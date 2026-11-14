// شفق بوت — السيرفر الرئيسي (Node.js 20+ بدون مكتبات خارجية)
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

loadEnvFile(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT) || 3000;
process.env.BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
const BASE_URL = process.env.BASE_URL;

const db = require('./lib/db');
const auth = require('./lib/auth');
const H = require('./lib/http');
const meta = require('./lib/meta');
const { parseEvents, handleEvent } = require('./lib/webhook');
const broadcast = require('./lib/broadcast');
const content = require('./lib/content');
const P = require('./lib/plans');
const core = require('./views/core');
const ui = require('./views/ui');

const PUBLIC_DIR = path.join(__dirname, 'public');

if (!process.env.SESSION_SECRET) console.warn(' SESSION_SECRET لازم ينحط قبل ما تستخدم الموقع.');
P.ensurePlans();
auth.ensureAdmin();

// ---------- قراءة ملف .env (اختياري، للتجربة على الجهاز) ----------
function loadEnvFile(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    let v = m[2];
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

// ---------- الراوتر ----------
const router = H.createRouter();
for (const mod of ['auth', 'accounts', 'replies', 'store', 'broadcasts', 'messenger', 'billing', 'admin', 'ai', 'content']) {
  require(`./routes/${mod}`)(router);
}

// منع التخمين على كلمة السر
const attempts = new Map();
const clientIp = (req) => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '';
function tooMany(ip) {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < 15 * 60e3);
  attempts.set(ip, list);
  return list.length >= 10;
}

async function handle(req, res) {
  const url = new URL(req.url, BASE_URL);
  const p = url.pathname;
  const m = req.method;

  // ---- عام ----
  if (m === 'GET' && p === '/healthz') return H.send(res, 200, 'ok', { 'Content-Type': 'text/plain' });
  if (m === 'GET' && p === '/privacy') return H.send(res, 200, core.privacyPage());
  if (m === 'GET' && p === '/data-deletion') return H.send(res, 200, core.dataDeletionPage());
  if (m === 'GET' && p === '/sw.js') {
    return H.serveFile(req, res, PUBLIC_DIR, 'sw.js', { maxAge: 0 }) || H.send(res, 404, '');
  }
  if ((m === 'GET' || m === 'HEAD') && p.startsWith('/uploads/')) {
    if (H.serveFile(req, res, db.UPLOADS, p.slice(9), { maxAge: 31536000 })) return;
    return H.send(res, 404, '');
  }
  if ((m === 'GET' || m === 'HEAD') && p !== '/' && H.serveFile(req, res, PUBLIC_DIR, p, { maxAge: p.startsWith('/fonts/') || p.startsWith('/icons/') ? 31536000 : 600 })) return;

  // ---- Webhook ----
  if (p === '/webhook') {
    if (m === 'GET') {
      const ok = url.searchParams.get('hub.mode') === 'subscribe' && process.env.META_VERIFY_TOKEN &&
        url.searchParams.get('hub.verify_token') === process.env.META_VERIFY_TOKEN;
      return ok ? H.send(res, 200, url.searchParams.get('hub.challenge') || '', { 'Content-Type': 'text/plain' })
        : H.send(res, 403, 'forbidden', { 'Content-Type': 'text/plain' });
    }
    if (m === 'POST') {
      const raw = await H.readBody(req, 5 * 1024 * 1024);
      if (!meta.verifySignature(raw, req.headers['x-hub-signature-256'])) return H.send(res, 401, 'bad signature', { 'Content-Type': 'text/plain' });
      H.send(res, 200, 'EVENT_RECEIVED', { 'Content-Type': 'text/plain' }); // Meta بدها رد سريع
      let body;
      try { body = JSON.parse(raw.toString('utf8')); } catch { return; }
      for (const ev of parseEvents(body)) handleEvent(ev).catch((e) => console.error('handleEvent', e));
      return;
    }
  }

  // ---- الدخول ----
  const user = auth.userFromSession(H.parseCookies(req).sid);

  // ---- الصفحات العامة (الموقع التعريفي، الأسعار، التسجيل) ----
  if (await publicRoutes(req, res, { url, user })) return;
  if (p === '/login') {
    if (m === 'GET') return user ? H.redirect(res, '/') : H.send(res, 200, ui.loginPage());
    if (m === 'POST') {
      const ip = clientIp(req);
      if (tooMany(ip)) return H.send(res, 429, ui.loginPage('محاولات كتيرة، استنى ربع ساعة وجرّب.'));
      const { fields } = await H.readForm(req);
      if (!process.env.SESSION_SECRET) return H.send(res, 500, ui.loginPage('السيرفر ناقصه SESSION_SECRET.'));
      if (!db.all('users').length) return H.send(res, 500, ui.loginPage('ما في ولا مستخدم. حط ADMIN_USERNAME و ADMIN_PASSWORD بإعدادات السيرفر وأعد تشغيله.'));
      const u = auth.findUser(fields.username);
      if (!u || !auth.checkPassword(u, fields.password || '')) {
        attempts.get(ip).push(Date.now());
        return H.send(res, 401, ui.loginPage('اسم المستخدم أو كلمة السر غلط.', fields.username));
      }
      attempts.delete(ip);
      db.update('users', u.id, { lastLoginAt: Date.now() });
      H.addCookie(res, H.cookie('sid', auth.makeSession(u), { maxAge: auth.SESSION_DAYS * 86400 }));
      return H.redirect(res, '/');
    }
  }
  if (p === '/logout' && m === 'POST') {
    H.addCookie(res, H.cookie('sid', '', { maxAge: 0 }));
    return H.redirect(res, '/login');
  }

  if (!user) {
    if (p.endsWith('.json') || req.headers.accept?.includes('application/json')) return H.json(res, { error: 'login' }, 401);
    return H.redirect(res, '/login');
  }

  // ---- الصفحات الداخلية ----
  const found = router.match(m, p);
  const cookies = H.parseCookies(req);
  let tenant = db.get('tenants', user.tenantId);
  // مدير المنصة فيه يفوت على حساب أي زبون
  if (user.role === 'super' && cookies.as) tenant = db.get('tenants', cookies.as) || tenant;
  const accounts = tenant ? db.listAccounts(tenant.id) : [];
  const ctx = { user, tenant, accounts, flash: '', plan: P.effectivePlan(tenant), impersonating: tenant && tenant.id !== user.tenantId };
  if (!found) return H.send(res, 404, core.notFoundPage(ctx));
  if (found.opts.super && user.role !== 'super') return H.redirect(res, '/', 'هالصفحة لمدير المنصة بس.');
  if (found.opts.admin && !['admin', 'super'].includes(user.role)) return H.redirect(res, '/', 'هالصفحة للمدير بس.');
  // الاشتراك منتهي ← بس صفحة الاشتراك وحسابي
  if (!found.opts.always && !found.opts.super && !P.isLive(tenant)) {
    return H.redirect(res, '/billing', P.status(tenant) === 'suspended' ? 'الحساب موقوف — تواصل معنا.' : 'انتهى الاشتراك أو فترة التجربة. اختار باقة لتكمّل');
  }
  if (found.params.acc) {
    ctx.acc = db.getAccount(found.params.acc);
    if (!ctx.acc || ctx.acc.tenantId !== tenant?.id) return H.redirect(res, '/accounts', 'الحساب مو موجود.');
    const feature = FEATURE_PATHS.find(([re]) => re.test(p))?.[1];
    if (feature && !P.can(tenant, feature)) return H.send(res, 200, require('./views/billing').upgradePage({ ...ctx, active: '' }, feature));
    H.addCookie(res, H.cookie('acc', ctx.acc.id, { maxAge: 365 * 86400 }));
  } else {
    const last = db.getAccount(cookies.acc);
    ctx.acc = last && last.tenantId === tenant?.id ? last : accounts[0] || null; // للقائمة بس
    ctx.navOnly = true;
  }
  if (m === 'GET') ctx.flash = H.takeFlash(req, res);
  let formCache;
  const form = async () => (formCache ||= await H.readForm(req));
  return found.handler(req, res, { params: found.params, query: Object.fromEntries(url.searchParams), ctx, form, cookies });
}

// كل قسم وأي ميزة بالباقة بيحتاج
const FEATURE_PATHS = [
  [/^\/a\/[^/]+\/broadcasts/, 'broadcast'],
  [/^\/a\/[^/]+\/(messenger|blocks)/, 'messengerBot'],
  [/^\/a\/[^/]+\/store/, 'store'],
  [/^\/a\/[^/]+\/reports/, 'stats'],
  [/^\/a\/[^/]+\/content/, 'publish'],
  [/^\/a\/[^/]+\/ai\/images/, 'aiImages'],
  [/^\/a\/[^/]+\/ai\/assistant/, 'aiAssistant'],
  [/^\/a\/[^/]+\/ai/, 'ai'],
  [/^\/a\/[^/]+\/badwords/, 'badWords'],
];

// ---------- الصفحات العامة ----------
async function publicRoutes(req, res, { url, user }) {
  const p = url.pathname;
  const pub = require('./views/public');
  if (req.method === 'GET' && p === '/' && !user) return H.send(res, 200, pub.landingPage({ plans: P.listPlans(), settings: P.settings() })), true;
  if (req.method === 'GET' && p === '/pricing') return H.send(res, 200, pub.pricingPage({ plans: P.listPlans(), settings: P.settings(), user })), true;
  if (p === '/signup') {
    const st = P.settings();
    if (user) return H.redirect(res, '/'), true;
    if (!st.signupOpen) return H.send(res, 200, pub.signupPage({ closed: true, settings: st })), true;
    if (req.method === 'GET') return H.send(res, 200, pub.signupPage({ settings: st })), true;
    if (req.method === 'POST') {
      const ip = clientIp(req);
      if (tooMany(ip)) return H.send(res, 429, pub.signupPage({ settings: st, error: 'محاولات كتيرة، جرّب بعد شوي.' })), true;
      const { fields: f } = await H.readForm(req);
      attempts.get(ip).push(Date.now());
      try {
        if (!String(f.business || '').trim()) throw new Error('اكتب اسم الصفحة أو النشاط');
        if (f.password !== f.password2) throw new Error('كلمتين السر مو متطابقين');
        if (auth.findUser(f.username)) throw new Error('اسم المستخدم موجود قبل، اختار غيره');
        const tenant = auth.createTenant({ name: f.business, phone: f.phone, trialDays: st.trialDays, planId: st.trialPlan });
        const u = auth.createUser({ username: f.username, password: f.password, name: f.name, phone: f.phone, role: 'admin', tenantId: tenant.id });
        db.update('tenants', tenant.id, { ownerId: u.id });
        H.addCookie(res, H.cookie('sid', auth.makeSession(u), { maxAge: auth.SESSION_DAYS * 86400 }));
        H.redirect(res, '/accounts', `أهلاً فيك بشفق بوت عندك ${st.trialDays} أيام تجربة مجانية. ابدأ بربط صفحتك.`);
      } catch (err) {
        H.send(res, 400, pub.signupPage({ settings: st, error: err.message, values: f }));
      }
      return true;
    }
  }
  return false;
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.error(err);
    if (!res.headersSent) H.send(res, err.status || 500, err.status === 413 ? 'الطلب كبير كتير' : `صار خطأ بالسيرفر: ${err.message}`);
    else res.end();
  });
});

if (require.main === module) {
  broadcast.startScheduler();
  content.startScheduler();
  server.listen(PORT, () => {
    console.log(`شفق بوت شغّال على ${BASE_URL} (port ${PORT})`);
    console.log(`البيانات محفوظة بـ ${db.DATA_DIR}`);
  });
}

module.exports = { server };

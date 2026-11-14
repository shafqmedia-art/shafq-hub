// أدوات HTTP صغيرة بدون مكتبات: كوكيز، فورمات، رفع ملفات، ملفات ثابتة، راوتر
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const SECURE = () => String(process.env.BASE_URL || '').startsWith('https://');

function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    try { out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* تجاهل */ }
  }
  return out;
}

function cookie(name, value, { maxAge, httpOnly = true } = {}) {
  let c = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
  if (httpOnly) c += '; HttpOnly';
  if (SECURE()) c += '; Secure';
  if (maxAge !== undefined) c += `; Max-Age=${maxAge}`;
  return c;
}

function addCookie(res, c) {
  const prev = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', [].concat(prev || [], c));
}

function send(res, status, body, headers = {}) {
  if (res.headersSent) return res.end();
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'X-Frame-Options': 'DENY',
    ...headers,
  });
  res.end(body);
}

const json = (res, data, status = 200) => send(res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });

function redirect(res, to, flash) {
  if (flash) addCookie(res, cookie('flash', flash, { maxAge: 30 }));
  res.writeHead(303, { Location: to });
  res.end();
}

function takeFlash(req, res) {
  const f = parseCookies(req).flash;
  if (f) addCookie(res, cookie('flash', '', { maxAge: 0 }));
  return f || '';
}

function readBody(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(Object.assign(new Error('Body too large'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// فورم عادي ← كائن (الحقول المكررة بتصير مصفوفة)
function parseForm(buf) {
  const out = {};
  for (const [k, v] of new URLSearchParams(buf.toString('utf8'))) {
    if (k in out) out[k] = [].concat(out[k], v);
    else out[k] = v;
  }
  return out;
}

// multipart/form-data (رفع صور وملفات)
function parseMultipart(buf, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!m) return { fields: {}, files: [] };
  const boundary = Buffer.from(`--${m[1] || m[2]}`);
  const fields = {};
  const files = [];
  let pos = buf.indexOf(boundary);
  while (pos !== -1) {
    const start = pos + boundary.length + 2;
    const next = buf.indexOf(boundary, start);
    if (next === -1) break;
    const part = buf.subarray(start, next - 2);
    const headEnd = part.indexOf('\r\n\r\n');
    if (headEnd > -1) {
      const head = part.subarray(0, headEnd).toString('utf8');
      const data = part.subarray(headEnd + 4);
      const name = /name="([^"]*)"/i.exec(head)?.[1];
      const filename = /filename="([^"]*)"/i.exec(head)?.[1];
      const type = /content-type:\s*([^\r\n]+)/i.exec(head)?.[1] || 'application/octet-stream';
      if (filename !== undefined) files.push({ name, filename, type, data });
      else if (name) fields[name] = data.toString('utf8');
    }
    pos = next;
  }
  return { fields, files };
}

async function readForm(req) {
  const ct = req.headers['content-type'] || '';
  if (ct.startsWith('multipart/form-data')) return parseMultipart(await readBody(req, 30 * 1024 * 1024), ct);
  if (ct.includes('application/json')) {
    try { return { fields: JSON.parse((await readBody(req)).toString('utf8') || '{}'), files: [] }; } catch { return { fields: {}, files: [] }; }
  }
  return { fields: parseForm(await readBody(req)), files: [] };
}

// ---------- الملفات الثابتة ----------
const TYPES = {
  '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.mp4': 'video/mp4', '.pdf': 'application/pdf',
};

function serveFile(req, res, root, rel, { maxAge = 3600, attachment = false } = {}) {
  let decoded;
  try { decoded = decodeURIComponent(rel); } catch { return false; }
  const file = path.normalize(path.join(root, decoded));
  if (!file.startsWith(root + path.sep)) return false;
  const ext = path.extname(file).toLowerCase();
  const type = TYPES[ext] || (attachment ? 'application/octet-stream' : null);
  if (!type) return false;
  let stat;
  try { stat = fs.statSync(file); } catch { return false; }
  if (!stat.isFile()) return false;
  res.writeHead(200, {
    'Content-Type': type, 'Content-Length': stat.size, 'Cache-Control': `public, max-age=${maxAge}`,
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.method === 'HEAD') return res.end(), true;
  fs.createReadStream(file).pipe(res);
  return true;
}

// حفظ ملف مرفوع ← رابط /uploads/...
const ALLOWED_UPLOADS = /\.(png|jpe?g|gif|webp|mp4|pdf)$/i;
function saveUpload(dir, file) {
  let ext = path.extname(file.filename || '').toLowerCase();
  if (!ALLOWED_UPLOADS.test(ext)) {
    ext = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'video/mp4': '.mp4', 'application/pdf': '.pdf' }[file.type] || '';
  }
  if (!ext) throw new Error('نوع الملف مو مدعوم (صور، mp4، pdf)');
  fs.mkdirSync(dir, { recursive: true });
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(5).toString('hex')}${ext}`;
  fs.writeFileSync(path.join(dir, name), file.data);
  return `/uploads/${name}`;
}

// ---------- راوتر ----------
function createRouter() {
  const routes = [];
  const add = (method) => (pattern, handler, opts = {}) => {
    const keys = [];
    const re = new RegExp(`^${pattern.replace(/\/:(\w+)/g, (_, k) => { keys.push(k); return '/([^/]+)'; })}/?$`);
    routes.push({ method, re, keys, handler, opts });
  };
  return {
    get: add('GET'),
    post: add('POST'),
    match(method, pathname) {
      for (const r of routes) {
        if (r.method !== method && !(method === 'HEAD' && r.method === 'GET')) continue;
        const m = r.re.exec(pathname);
        if (!m) continue;
        const params = {};
        r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
        return { handler: r.handler, params, opts: r.opts };
      }
      return null;
    },
  };
}

module.exports = {
  parseCookies, cookie, addCookie, send, json, redirect, takeFlash, readBody, parseForm, readForm,
  serveFile, saveUpload, createRouter,
};

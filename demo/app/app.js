/* نظام شفق — الخطوة الأولى: الدخول، لوحة اليوم، العملاء، الفريق، المهام، المالية، الملف الشخصي */
(function () {
  'use strict';
  var CFG = window.SHAFQ_CONFIG || { mode: 'local', countryCode: '963' };
  var KEY = 'shafq.demo.db', SKEY = 'shafq.demo.session', TKEY = 'shafq.demo.theme';
  var SRV = window.SHAFQ_SERVER, ONLINE = !!(SRV && SRV.enabled);
  var state = { ready: !ONLINE, needSetup: false, err: '' };
  var LOGO_W = 'icons/logo-white.png', LOGO_B = 'icons/logo-black.png';
  var CATS_IN = ['دفعة عميل', 'دخل آخر'];
  var CATS_OUT = ['أجر فريق', 'تمويل إعلاني', 'إيجار معدات', 'مواصلات', 'مصروف آخر'];
  var ROLES = [['creator', 'كونتنت كريتر'], ['editor', 'إيديتر'], ['designer', 'مصمم'], ['face', 'الوجه الإعلامي']];
  var MEDIA_SPECS = ['مصور فوتوغرافي', 'مصور فيديو', 'فيلم ميكر', 'مونتير', 'كونتنت كريتر', 'كاتب محتوى', 'مصمم جرافيك', 'موشن جرافيك', 'درون بايلوت', 'مدير إعلانات', 'سوشال ميديا ماناجر', 'مدير حسابات', 'وجه إعلامي', 'معلّق صوتي', 'مهندس صوت', 'مخرج', 'منتج', 'مساعد تصوير', 'إضاءة', 'ريتاتش', 'مودل', 'ميك أب أرتيست', 'ستايلست', 'مصمم UI/UX', 'مطوّر مواقع'];
  var TITLES = ['مصور', 'مصور فوتوغرافي', 'مصمم', 'مونتير', 'كونتنت كريتر', 'كاتب محتوى', 'درون بايلوت', 'مدير إعلانات', 'فيلم ميكر', 'وجه إعلامي', 'موشن جرافيك', 'معلّق صوتي', 'مدير حسابات', 'مساعد تصوير'];
  var SERVICES = ['إدارة صفحة', 'إدارة إعلانات', 'تصوير', 'مونتاج', 'تصميم', 'وجه إعلامي', 'كتابة محتوى', 'درون', 'تغطية فعالية'];

  /* ---------- أدوات ---------- */
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uid() { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return iso(new Date()); }
  function addDays(s, n) { var d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); }
  function addMonths(s, n) { var d = new Date(s + 'T12:00:00'); d.setMonth(d.getMonth() + n); return iso(d); }
  function num(v) { var n = parseFloat(String(v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  function usd(n) { n = Math.round(n * 100) / 100; var neg = n < 0; n = Math.abs(n); return (neg ? '-' : '') + '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  function syp(n) { return Math.round(n).toLocaleString('en-US') + ' ل.س'; }
  function dateAr(s) { try { return new Intl.DateTimeFormat('ar-SY-u-nu-latn', { day: 'numeric', month: 'long' }).format(new Date(s + 'T12:00:00')); } catch (e) { return s; } }
  function longDates() {
    var d = new Date(), g = '', hj = '';
    try { g = new Intl.DateTimeFormat('ar-SY-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d); } catch (e) { g = today(); }
    try { hj = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(d); } catch (e) { hj = ''; }
    return g + (hj ? ' · ' + hj : '');
  }
  function greet() { var hr = new Date().getHours(); return hr < 12 ? 'صباح الخير' : 'مساء الخير'; }
  function toast(t) { var el = document.getElementById('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('show'); }, 2200); }
  var CHEV = '<svg class="chev" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

  /* ---------- التخزين (الوضع المحلي) ---------- */
  var db;
  function blank() { return { users: [], clients: [], tasks: [], moves: [], debts: [], items: [], rates: {}, settings: { goal: 0 } }; }
  function load() { if (ONLINE) { db = blank(); return; } try { db = JSON.parse(localStorage.getItem(KEY)) || blank(); } catch (e) { db = blank(); } var b = blank(); Object.keys(b).forEach(function (k) { if (db[k] == null) db[k] = b[k]; }); }
  function save() {
    if (!ONLINE) { localStorage.setItem(KEY, JSON.stringify(db)); return; }
    SRV.push(db).catch(function (e) { toast('تعذر الحفظ: ' + e.message); return resync(); });
  }
  function resync() { return SRV.pull().then(function (d) { db = d; if (me() && me().role === 'client') pstate.data = null; render(); }).catch(function () { if (!SRV.hasSession()) render(); }); }
  function checkSetup() {
    state.ready = false; render();
    return SRV.hasManager().then(function (b) { state.needSetup = !b; state.err = ''; }, function (e) { state.err = e.message; }).then(function () { state.ready = true; render(); });
  }
  function boot() {
    state.err = ''; state.ready = false; render();
    if (!SRV.hasSession()) return checkSetup();
    return SRV.pull().then(function (d) { db = d; state.ready = true; render(); }, function (e) {
      if (e.offline) { state.err = e.message; state.ready = true; render(); return; }
      SRV.clear(); return checkSetup();
    });
  }
  function byId(t, id) { return db[t].filter(function (r) { return r.id === id; })[0]; }
  function userName(id) { var u = byId('users', id); return u ? u.name : 'غير محدد'; }
  function clientName(id) { var c = byId('clients', id); return c ? c.name : 'عام'; }

  /* ---------- الدخول ---------- */
  function hash(pass, salt) {
    var s = salt + '|' + pass;
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      });
    }
    var x = 5381; for (var i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) >>> 0;
    return Promise.resolve('f' + x.toString(16));
  }
  function me() { var id = ONLINE ? SRV.uid() : localStorage.getItem(SKEY); var u = id && byId('users', id); return u && u.active !== false ? u : null; }
  function isMgr() { var u = me(); return !!u && u.role === 'manager'; }
  function normPhone(p) { return String(p || '').replace(/[^\d]/g, ''); }
  function waPhone(p) { p = normPhone(p); if (!p) return ''; if (p.indexOf('00') === 0) return p.slice(2); if (p.charAt(0) === '0') return (CFG.countryCode || '963') + p.slice(1); return p; }
  function waLink(u, what) {
    var f = u && u.gender === 'f', msg = 'السلام عليكم ورحمة الله، كيف حالك ' + (f ? 'أستاذة ' : 'أستاذ ') + (u ? u.name : '') + '؟ حبيت أطمّن شو صار ' + (f ? 'معكِ' : 'معك') + ' بشغل ' + (what || 'المهام') + '. ' + (f ? 'يعطيكِ العافية.' : 'يعطيك العافية.');
    return 'https://wa.me/' + waPhone(u && u.phone) + '?text=' + encodeURIComponent(msg);
  }

  /* ---------- الحسابات ---------- */
  function live(m) { return !m.is_void; }
  function sum(arr, f) { return arr.reduce(function (a, r) { return a + f(r); }, 0); }
  function lastRate() { var ks = Object.keys(db.rates).sort(); return ks.length ? { date: ks[ks.length - 1], rate: db.rates[ks[ks.length - 1]] } : null; }
  function monthOf(s) { return s.slice(0, 7); }
  function box() {
    var r = { USD: 0, SYP: 0 };
    db.moves.filter(live).forEach(function (m) { r[m.cur] += (m.dir === 'in' ? 1 : -1) * m.amount; });
    var lr = lastRate(); r.total = r.USD + (lr ? r.SYP / lr.rate : 0); return r;
  }
  function memberDue(u) {
    var paid = sum(db.moves.filter(function (m) { return live(m) && m.dir === 'out' && m.user_id === u.id; }), function (m) { return m.usd; });
    return { contract: u.contract || 0, paid: paid, left: Math.max(0, (u.contract || 0) - paid) };
  }
  function clientEnd(c) { return c.start_date && c.months ? addMonths(c.start_date, num(c.months)) : ''; }
  function daysTo(s) { return Math.round((new Date(s + 'T12:00:00') - new Date(today() + 'T12:00:00')) / 86400000); }

  /* ---------- قطع الواجهة ---------- */
  function kpi(label, val, hi, sub) { return '<div class="kpi' + (hi ? ' hi' : '') + '"><span>' + h(label) + '</span><b' + (/[\u0600-\u06FF]/.test(String(val)) ? ' class="ar"' : '') + '>' + h(val) + '</b>' + (sub ? '<small>' + h(sub) + '</small>' : '') + '</div>'; }
  function tile(title, summ, body, open) { return '<details class="tile"' + (open ? ' open' : '') + '><summary><div><h2>' + h(title) + '</h2><span>' + summ + '</span></div>' + CHEV + '</summary><div class="body">' + body + '</div></details>'; }
  function rows(list) { return list.length ? '<div class="rows">' + list.map(function (r) { return '<div><span>' + r[0] + '</span><span class="mu">' + r[1] + '</span></div>'; }).join('') + '</div>' : '<p class="empty">لا شيء بعد.</p>'; }
  function btn(label, act, data, cls) { var d = ''; Object.keys(data || {}).forEach(function (k) { d += ' data-' + k + '="' + h(data[k]) + '"'; }); return '<button type="button" class="btn ' + (cls || '') + '" data-act="' + act + '"' + d + '>' + h(label) + '</button>'; }
  function avatar(u) { return '<span class="av" aria-hidden="true">' + (u.photo ? '<img src="' + h(u.photo) + '" alt="">' : h((u.name || '؟').charAt(0))) + '</span>'; }

  var NAV = [
    ['الرئيسية', [['لوحة اليوم', '#/'], ['التقويم', '#/calendar'], ['المهام', '#/tasks']]],
    ['العمل', [['العملاء', '#/clients'], ['المشاريع', '#/m/projects'], ['الدرون', '#/m/drone']]],
    ['الناس', [['الفريق', '#/team'], ['فريلانس', '#/m/talent'], ['بنك المؤثرين', '#/m/influencers'], ['العملاء المحتملون', '#/m/leads'], ['صندوق الطلبات', '#/m/inbox']]],
    ['المال', [['المالية', '#/finance'], ['الأوراق', '#/m/papers'], ['التقارير', '#/reports']]],
    ['الأدوات', [['المعدات', '#/m/gear'], ['التسويق', ''], ['ميتا', ''], ['المراسل', '#/reporter']]]
  ];
  var MNAV = [['اليوم', '#/'], ['مهامي', '#/tasks'], ['العملاء', '#/clients'], ['مالي', '#/money'], ['ملفي', '#/profile']];
  var TI = {"bell": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z\"/><path d=\"M10 20.5a2 2 0 0 0 4 0\"/></svg>", "cal": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"4\" y=\"5\" width=\"16\" height=\"15\" rx=\"2\"/><path d=\"M4 10h16M9 3v4M15 3v4\"/></svg>", "send": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M20.5 3.5 3.5 10.6l6.8 2.6 2.6 6.8z\"/><path d=\"m10.3 13.2 4.4-4.4\"/></svg>", "sun": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4\"/></svg>", "moon": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z\"/></svg>", "home": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4z\"/></svg>", "tasks": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"2\"/><path d=\"m8 12 3 3 5-6\"/></svg>", "users": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"9\" cy=\"9\" r=\"3.2\"/><path d=\"M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6\"/><path d=\"M15.5 6.2a3 3 0 0 1 0 5.6M17.5 14.6c1.6.6 2.7 2 3 4.4\"/></svg>", "money": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"3\" y=\"6\" width=\"18\" height=\"12\" rx=\"2\"/><circle cx=\"12\" cy=\"12\" r=\"2.6\"/><path d=\"M6.5 9.5v5M17.5 9.5v5\"/></svg>", "more": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 7h16M4 12h16M4 17h16\"/></svg>", "user": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"8.5\" r=\"3.6\"/><path d=\"M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6\"/></svg>", "x": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M6 6l12 12M18 6 6 18\"/></svg>"};
  var TABS = [['اليوم', '#/', 'home'], ['المهام', '#/tasks', 'tasks'], ['العملاء', '#/clients', 'users'], ['المالية', '#/finance', 'money']];
  var CTABS = [['الرئيسية', '#/', 'home'], ['المحتوى', '#/content', 'cal'], ['الخطة', '#/plan', 'tasks'], ['حسابي', '#/account', 'money']];
  var MTABS = [['اليوم', '#/', 'home'], ['مهامي', '#/tasks', 'tasks'], ['العملاء', '#/clients', 'users'], ['مالي', '#/money', 'money'], ['ملفي', '#/profile', 'user']];
  function tabbar() {
    var r = route(), base = (r.indexOf('#/client/') === 0 || r.indexOf('#/mc/') === 0) ? '#/clients' : r === '#/full' ? '#/' : r, list = isMgr() ? TABS : (me() && me().role === 'client') ? CTABS : MTABS;
    var out = '<nav class="tabbar" aria-label="التنقل السريع">' + list.map(function (t) { var on = base === t[1]; return '<a href="' + t[1] + '" class="tab' + (on ? ' on' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + TI[t[2]] + '<span>' + t[0] + '</span></a>'; }).join('');
    if (isMgr()) out += '<button type="button" class="tab" data-act="moreNav" aria-label="كل الأقسام">' + TI.more + '<span>المزيد</span></button>';
    else if (me() && me().role === 'client') out += '<button type="button" class="tab" data-act="msgAdmin" aria-label="راسل الإدارة">' + TI.send + '<span>راسلنا</span></button>';
    return out + '</nav>';
  }
  function moreSheet() {
    if (!isMgr()) return '';
    var skip = ['#/', '#/tasks', '#/clients', '#/finance'], r = route();
    var tiles = [];
    NAV.forEach(function (g) { g[1].forEach(function (i) { if (i[1] && skip.indexOf(i[1]) < 0) tiles.push([i[0], i[1]]); }); });
    tiles.push(['ملفي', '#/profile']);
    return '<div class="more" role="dialog" aria-label="كل الأقسام"><div class="more-h"><h2>كل الأقسام</h2><button type="button" class="nav-x" data-act="moreNav" aria-label="إغلاق">' + TI.x + '</button></div><div class="more-g">' + tiles.map(function (t) { return '<a href="' + t[1] + '" class="' + (r === t[1] ? 'on' : '') + '">' + h(t[0]) + '</a>'; }).join('') + '</div></div>';
  }
  function appbar() { return '<header class="appbar"><a class="ab-brand" href="#/" aria-label="الرئيسية"><img class="lg-w" src="' + LOGO_W + '" alt=""><img class="lg-b" src="' + LOGO_B + '" alt=""><b>شفق</b></a><span class="ab-acts">' + (isMgr() || me().role === 'client' ? '' : '<button type="button" class="ab-ic" data-act="msgAdmin" aria-label="راسل الإدارة">' + TI.send + '</button>') + bellBtn('ab-ic') + '<button type="button" class="ab-ic" data-act="theme" aria-label="تبديل الثيم">' + (document.body.classList.contains('t-light') ? TI.moon : TI.sun) + '</button><a class="ab-who" href="' + (me().role === 'client' ? '#/account' : '#/profile') + '" aria-label="حسابي">' + avatar(me()) + '</a></span></header>'; }
  function isPhone() { return window.matchMedia && window.matchMedia('(max-width:900px)').matches; }
  function route() { return location.hash || '#/'; }
  function navHtml() {
    var r = route(), base = r.indexOf('#/client/') === 0 ? '#/clients' : r, out = '';
    out += '<a class="brand" href="/" title="ارجع لموقع شفق ميديا"><img class="lg-w" src="' + LOGO_W + '" alt="شعار شفق"><img class="lg-b" src="' + LOGO_B + '" alt="شعار شفق"><div><b>شفق ميديا</b><span>' + (isMgr() ? 'نظام إدارة الأعمال' : 'واجهة الفريق') + '</span></div></a>';
    if (!isMgr()) { return out + MNAV.map(function (i) { return '<a href="' + i[1] + '" class="' + (base === i[1] ? 'on' : '') + '">' + i[0] + '</a>'; }).join('') + timeBox(); }
    NAV.forEach(function (g) {
      var has = g[1].some(function (i) { return i[1] && i[1] === base; }) || (r.indexOf('#/soon/') === 0 && g[1].some(function (i) { return '#/soon/' + encodeURIComponent(i[0]) === r; }));
      out += '<details' + (has || g[0] === 'الرئيسية' ? ' open' : '') + '><summary><span>' + g[0] + '</span>' + CHEV + '</summary><div class="items">';
      g[1].forEach(function (i) {
        var href = i[1] || '#/soon/' + encodeURIComponent(i[0]);
        out += '<a href="' + href + '" class="' + (href === base || href === r ? 'on' : '') + (i[1] ? '' : ' soon') + '">' + i[0] + '</a>';
      });
      out += '</div></details>';
    });
    return out + timeBox();
  }
  function timeBox() { return '<div class="timebox"><span class="clock" id="clock"></span><span>' + h(longDates()).replace(' · ', '</span><span>') + '</span></div>'; }
  function topHtml() {
    var u = me(), out = '<div class="top">';
    if (isMgr()) {
      out += '<details class="menu"><summary><span>العملاء</span>' + CHEV + '</summary><div class="pop">' +
        db.clients.map(function (c) { return '<a href="#/client/' + h(c.id) + '">' + h(c.name) + '</a>'; }).join('') +
        '<a href="#/clients" class="mu">+ إضافة عميل</a></div></details>';
      var r = db.rates[today()];
      if (rateSug()) out += rateSugHtml('side');
      out += '<div class="pill"><label for="rate">سعر الصرف اليوم</label><input id="rate" inputmode="numeric" data-chg="rate" placeholder="أدخل السعر" value="' + (r ? h(r) : '') + '"><span>ل.س</span></div>';
    }
    out += '<div class="grow"></div>' + bellBtn('btn ic') + btn(document.body.classList.contains('t-light') ? 'الثيم الغامق' : 'الثيم الفاتح', 'theme');
    out += '<a class="who" href="#/profile" aria-label="الملف الشخصي">' + avatar(u) + '<span><b>' + h(u.name) + '</b><small>' + h(u.title || (isMgr() ? 'المدير' : 'عضو الفريق')) + ' · ملفي</small></span></a></div>';
    return out;
  }
  function shell(content) { return appbar() + '<div class="shell"><nav class="nav" aria-label="أقسام النظام"><button type="button" class="nav-x" data-act="moreNav" aria-label="إغلاق القائمة">' + TI.x + '</button>' + navHtml() + '</nav>' + moreSheet() + '<main' + (route() === '#/finance' ? ' class="show-top"' : '') + '>' + topHtml() + content + '</main></div>' + tabbar(); }
  function head(h1, sub, acts) { return '<div class="head"><div><h1>' + h(h1) + '</h1><p>' + h(sub) + '</p></div><div class="acts">' + (acts || '') + '</div></div>'; }

  /* ---------- الشاشات ---------- */
  function taskRow(t, showWho) {
    var meta = (showWho ? h(userName(t.user_id)) + ' · ' : '') + h(t.client_name || clientName(t.client_id)) + ' · ' + h(dateAr(t.due));
    return '<div><label class="chk"><input type="checkbox" data-chg="task" data-id="' + h(t.id) + '"' + (t.done ? ' checked' : '') + '><span class="' + (t.done ? 'done' : '') + '">' + h(t.title) + '</span></label><span class="mu">' + meta + (isMgr() ? ' ' + btn('حذف', 'delTask', { id: t.id }, 'sm') : '') + '</span></div>';
  }
  function taskList(list, showWho) { return list.length ? '<div class="rows">' + list.map(function (t) { return taskRow(t, showWho); }).join('') + '</div>' : '<p class="empty">لا مهام.</p>'; }

  function vDash() {
    var t = today(), tm = addDays(t, 1), mv = db.moves.filter(live);
    var inT = sum(mv.filter(function (m) { return m.date === t && m.dir === 'in'; }), function (m) { return m.usd; });
    var outT = sum(mv.filter(function (m) { return m.date === t && m.dir === 'out'; }), function (m) { return m.usd; });
    var owe = db.debts.filter(function (d) { return !d.settled && d.dir === 'owe'; }), owed = db.debts.filter(function (d) { return !d.settled && d.dir === 'owed'; });
    var open = db.tasks.filter(function (x) { return !x.done; });
    var tToday = open.filter(function (x) { return x.due === t; }), tTom = open.filter(function (x) { return x.due === tm; }), late = open.filter(function (x) { return x.due < t; });
    var alerts = [];
    if (!db.rates[t]) alerts.push(rateSug() ? ['سعر الليرة اليوم: <span class="ltr">' + h(Number(rateSug().rate).toLocaleString('en-US')) + '</span> ل.س', btn('اعتماد', 'rateOk', {}, 'pri sm')] : ['سعر الصرف لم يُدخل اليوم', 'أدخله من الأعلى']);
    if (late.length) alerts.push(['مهام تجاوزت موعدها', String(late.length)]);
    db.debts.filter(function (d) { return !d.settled && d.due && daysTo(d.due) <= 7; }).forEach(function (d) { alerts.push([(d.dir === 'owe' ? 'دين عليّ: ' : 'دين لي: ') + h(d.party), daysTo(d.due) < 0 ? 'فات موعده' : 'خلال ' + daysTo(d.due) + ' يوم']); });
    db.clients.forEach(function (c) { var e = clientEnd(c); if (e && daysTo(e) >= 0 && daysTo(e) <= 30) alerts.push(['عقد ' + h(c.name) + ' ينتهي', 'خلال ' + daysTo(e) + ' يوم']); });
    alerts = alerts.concat(modAlerts());
    var mInc = sum(mv.filter(function (m) { return m.dir === 'in' && monthOf(m.date) === monthOf(t); }), function (m) { return m.usd; });
    var goal = num(db.settings.goal), pct = goal ? Math.min(100, Math.round(mInc / goal * 100)) : 0, bx = box();
    var team = db.users.filter(function (u) { return u.role === 'member' && u.active !== false; });
    var dues = team.map(function (u) { return [u, memberDue(u)]; }).filter(function (x) { return x[1].left > 0; });
    var c = '<div class="head" style="border-bottom:1px solid var(--ln);padding-bottom:20px"><div><h1>' + greet() + '، ' + h(me().name) + '</h1></div></div>';
    c += '<div class="kpis">' + kpi('دخل اليوم', usd(inT), true) + kpi('مصاريف اليوم', usd(outT)) + kpi('ديون عليّ', usd(sum(owe, function (d) { return d.usd; })), false, owe.length + ' دين') + kpi('ديون لي', usd(sum(owed, function (d) { return d.usd; })), false, owed.length + ' دين') + kpi('الصندوق', usd(bx.total), false, 'دولار ' + usd(bx.USD) + ' · ليرة ' + syp(bx.SYP)) + '</div>';
    c += '<div class="tiles">' +
      tile('اليوم', tToday.length + ' مهام', taskList(tToday, true)) +
      tile('غداً', tTom.length + ' مهام', taskList(tTom, true)) +
      tile('المراسل', alerts.length + ' تنبيهات', rows(alerts)) +
      tile('هدف الشهر', goal ? pct + '% من ' + h(usd(goal)) : 'لم يُحدد هدف', (goal ? '<div><b class="ltr">' + h(usd(mInc)) + '</b> <span class="mu">من <span class="ltr">' + h(usd(goal)) + '</span></span></div><div class="bar" role="img" aria-label="تحقق ' + pct + ' بالمئة"><i style="width:' + pct + '%"></i></div>' : '') + btn('تحديد الهدف', 'goal')) +
      tile('الصندوق', 'المجموع <span class="ltr">' + h(usd(bx.total)) + '</span>', rows([['رصيد الدولار', '<span class="ltr">' + h(usd(bx.USD)) + '</span>'], ['رصيد الليرة', h(syp(bx.SYP))], ['المجموع بالدولار', '<span class="ltr">' + h(usd(bx.total)) + '</span>']])) +
      tile('مستحقات الفريق', '<span class="ltr">' + h(usd(sum(dues, function (x) { return x[1].left; }))) + '</span> · ' + dues.length + ' أعضاء', rows(dues.map(function (x) { return [h(x[0].name) + ' · ' + h(x[0].title || ''), '<span class="ltr">' + h(usd(x[1].left)) + '</span>']; }))) +
      dashExtra() + '</div>';
    return shell(c);
  }

  function simpleList(list, empty) { return list.length ? '<div class="slist">' + list.join('') + '</div>' : '<p class="empty">' + empty + '</p>'; }
  function taskLine(t, who) {
    var t0 = today(), late = t.due < t0;
    return '<label class="sline"><input type="checkbox" data-chg="task" data-id="' + h(t.id) + '"' + (t.done ? ' checked' : '') + '><span class="s-main"><b class="' + (t.done ? 'done' : '') + '">' + h(t.title) + '</b><small>' + (who ? h(userName(t.user_id)) + ' · ' : '') + h(t.client_name || clientName(t.client_id)) + (late ? ' · <em class="late">متأخرة</em>' : t.due === t0 ? '' : ' · ' + h(dateAr(t.due))) + '</small></span></label>';
  }
  function vDashSimple() {
    var t = today(), mv = db.moves.filter(live), open = db.tasks.filter(function (x) { return !x.done; });
    var inT = sum(mv.filter(function (m) { return m.date === t && m.dir === 'in'; }), function (m) { return m.usd; });
    var mInc = sum(mv.filter(function (m) { return m.dir === 'in' && monthOf(m.date) === monthOf(t); }), function (m) { return m.usd; });
    var mOut = sum(mv.filter(function (m) { return m.dir === 'out' && monthOf(m.date) === monthOf(t); }), function (m) { return m.usd; });
    var todayT = open.filter(function (x) { return x.due <= t; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; });
    var alerts = [];
    if (!db.rates[t]) alerts.push(rateSug() ? ['سعر الليرة اليوم: <span class="ltr">' + h(Number(rateSug().rate).toLocaleString('en-US')) + '</span> ل.س', btn('اعتماد', 'rateOk', {}, 'pri sm')] : ['<a href="#/finance">أدخل سعر الصرف اليوم</a>', '']);
    alerts = alerts.concat(modAlerts());
    var c = '<div class="hello"><h1>' + greet() + '، ' + h(me().name) + '</h1><p class="mu">' + h(longDates()) + '</p></div>';
    c += '<div class="kpis">' + kpi('دخل اليوم', usd(inT), true) + kpi('صافي الشهر', usd(mInc - mOut)) + '</div>';
    if (alerts.length) c += '<section class="sbox"><h2>يحتاج انتباهك</h2>' + simpleList(alerts.slice(0, 5).map(function (a) { return '<div class="sline"><span class="s-main"><b>' + a[0] + '</b>' + (a[1] ? '<small>' + a[1] + '</small>' : '') + '</span></div>'; }), '') + '</section>';
    c += '<section class="sbox"><h2>مهام اليوم <span class="mu">' + todayT.length + '</span></h2>' + simpleList(todayT.slice(0, 8).map(function (x) { return taskLine(x, true); }), 'ما في مهام لليوم.') + (todayT.length > 8 ? '<a class="btn sm" href="#/tasks">كل المهام</a>' : '') + '</section>';
    c += '<div class="acts"><a class="btn" href="#/full">اللوحة الكاملة</a></div>';
    return shell(c);
  }
  function myTasks() { var u = me(); return db.tasks.filter(function (x) { return x.user_id === u.id; }); }
  function mcKey(t) { return t.client_id || ('n:' + (t.client_name || 'عام')); }
  function vMemberHome() {
    var u = me(), t = today(), open = myTasks().filter(function (x) { return !x.done; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; });
    var now = open.filter(function (x) { return x.due <= t; }), next = open.filter(function (x) { return x.due > t; })[0];
    var c = '<div class="hello"><h1>' + greet() + '، ' + h(u.name) + '</h1><p class="mu">' + h(longDates()) + '</p></div>';
    c += '<section class="sbox"><h2>مهام اليوم <span class="mu">' + now.length + '</span></h2>' + simpleList(now.map(function (x) { return taskLine(x, false); }), 'ما عندك مهام لليوم.') + '</section>';
    c += '<section class="sbox"><h2>أقرب موعد</h2>' + (next ? '<div class="slist"><div class="sline"><span class="s-main"><b>' + h(next.title) + '</b><small>' + h(next.client_name || 'عام') + ' · ' + h(dateAr(next.due)) + '</small></span></div></div>' : '<p class="empty">ما في مواعيد قادمة.</p>') + '</section>';
    return shell(c);
  }
  function vMemberTasks() {
    var all = myTasks(), open = all.filter(function (x) { return !x.done; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; }), done = all.filter(function (x) { return x.done; }).slice(-10).reverse();
    var c = head('مهامي', open.length + ' مهام مفتوحة');
    c += '<section class="sbox"><h2>المفتوحة</h2>' + simpleList(open.map(function (x) { return taskLine(x, false); }), 'ما عندك مهام مفتوحة.') + '</section>';
    c += '<section class="sbox"><h2>آخر المنجز</h2>' + simpleList(done.map(function (x) { return taskLine(x, false); }), 'ما في مهام منجزة بعد.') + '</section>';
    return shell(c);
  }
  function memberClients() {
    var g = {}, t = today();
    myTasks().forEach(function (x) { var k = mcKey(x); if (!g[k]) g[k] = { key: k, name: x.client_name || clientName(x.client_id) || 'عام', open: 0, next: '' }; if (!x.done) { g[k].open++; if (!g[k].next || x.due < g[k].next) g[k].next = x.due; } });
    return Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return b.open - a.open; });
  }
  function vMemberClients() {
    var list = memberClients();
    var c = head('العملاء', list.length + ' عملاء تشتغل معهم');
    c += simpleList(list.map(function (x) { return '<a class="sline link" href="#/mc/' + encodeURIComponent(x.key) + '"><span class="s-main"><b>' + h(x.name) + '</b><small>' + (x.open ? x.open + ' مهام مفتوحة' + (x.next ? ' · أقرب موعد ' + h(dateAr(x.next)) : '') : 'ما في مهام مفتوحة') + '</small></span>' + CHEV + '</a>'; }), 'لسا ما في عملاء مرتبطين بمهامك.');
    return shell(c);
  }
  function vMemberClient(key) {
    var x = memberClients().filter(function (c) { return c.key === key; })[0];
    if (!x) return shell(head('العميل غير موجود', '', '<a class="btn" href="#/clients">رجوع</a>'));
    var ts = myTasks().filter(function (t) { return mcKey(t) === key; }), open = ts.filter(function (t) { return !t.done; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; });
    var c = head(x.name, open.length + ' مهام مفتوحة معه', '<a class="btn" href="#/clients">رجوع</a>');
    c += '<section class="sbox"><h2>مهامي مع ' + h(x.name) + '</h2>' + simpleList(open.map(function (t) { return taskLine(t, false); }), 'ما في مهام مفتوحة.') + '</section>';
    return shell(c);
  }
  function vMemberMoney() {
    var u = me(), d = memberDue(u), pays = db.moves.filter(function (m) { return live(m) && m.dir === 'out' && m.user_id === u.id; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var c = head('مالي', 'حسابك مع شفق ميديا');
    c += '<div class="kpis">' + kpi('المتبقي لك', usd(d.left), true) + kpi('المدفوع لك', usd(d.paid), false, pays.length + ' دفعات') + kpi('قيمة العقد', usd(d.contract)) + '</div>';
    c += '<section class="sbox"><h2>الدفعات اللي استلمتها</h2>' + simpleList(pays.map(function (m) { return '<div class="sline"><span class="s-main"><b class="ltr" style="text-align:right">' + h(usd(m.usd)) + '</b><small>' + h(dateAr(m.date)) + (m.note ? ' · ' + h(m.note) : '') + '</small></span></div>'; }), 'لسا ما في دفعات مسجلة.') + '</section>';
    c += '<section class="sbox"><h2>اشتغلت شي ما انحسب؟</h2><p class="mu" style="font-size:14px">ابعت للإدارة طلب محاسبة على شغل إضافي، أو تذكير بدفعة متأخرة.</p><div class="acts">' + btn('طلب محاسبة على شغل', 'msgAdmin', { kind: 'pay' }, 'pri') + btn('تذكير بدفعة', 'msgAdmin', { kind: 'remind' }) + '</div></section>';
    return shell(c);
  }
  var MSG_KINDS = [['remind', 'تذكير'], ['request', 'طلب'], ['note', 'ملاحظة'], ['pay', 'طلب محاسبة على شغل']];
  function msgAdminForm(kind) {
    var u = me(), isC = u.role === 'client', cname = isC && pstate.data && pstate.data.client ? pstate.data.client.name : '';
    var kinds = isC ? MSG_KINDS.filter(function (k) { return k[0] !== 'pay'; }) : MSG_KINDS;
    openForm('راسل الإدارة', [
      { k: 'kind', label: 'نوع الرسالة', type: 'select', options: kinds, value: kind || 'remind', wide: true },
      { k: 'amount', label: 'المبلغ بالدولار (للمحاسبة، اختياري)', type: 'number', wide: true },
      { k: 'text', label: 'الرسالة', type: 'area', wide: true, req: true }
    ], function (v) {
      var body = String(v.text || '').trim(), k = kinds.filter(function (x) { return x[0] === v.kind; })[0] || kinds[0], amt = num(v.amount);
      if (!body) return { err: 'اكتب نص الرسالة.' };
      if (body.length > 280) return { err: 'الرسالة طويلة. خليها أقل من 280 حرف.' };
      if (!ONLINE) return 'هذه نسخة تجريبية: الرسالة ما بتنبعت فعلياً.';
      var who = (cname || u.name) + (isC ? ' (عميل)' : '');
      return SRV.notify([{ to: 'managers', title: k[1] + ' من ' + who, body: (amt > 0 && v.kind === 'pay' ? 'المبلغ: ' + usd(amt) + ' · ' : '') + body, tag: 'msg-' + u.id, url: isC ? './#/' : './#/team' }]).then(function (r) {
        if (r && r.sent) return 'وصلت رسالتك للإدارة';
        return { err: r ? 'انبعتت، بس الإدارة لسا ما فعّلت الإشعارات على جهازها. ابعتها على واتساب كمان لتتأكد.' : 'ما قدرنا نبعت الرسالة. تأكد من الإنترنت وجرّب مرة تانية.' };
      });
    }, 'الرسالة بتوصل للإدارة كإشعار على الجوال.', 'إرسال');
  }
  /* ---------- جرس الإشعارات (محفوظة على هذا الجهاز) ---------- */
  var NKEY = 'shafq.notes.seen', nstate = { list: null, seen: 0 };
  function noteDb() { return new Promise(function (res, rej) { var r = indexedDB.open('shafq-notes', 1); r.onupgradeneeded = function () { r.result.createObjectStore('notes', { keyPath: 'at' }); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
  function notesAll() {
    if (!window.indexedDB) return Promise.resolve([]);
    return noteDb().then(function (d) { return new Promise(function (res) { var tx = d.transaction('notes', 'readonly'), q = tx.objectStore('notes').getAll(); q.onsuccess = function () { d.close(); res((q.result || []).sort(function (a, b) { return b.at - a.at; })); }; q.onerror = function () { d.close(); res([]); }; }); }).catch(function () { return []; });
  }
  function demoNotes() {
    if (ONLINE) return [];
    var n = Date.now(), role = me() ? me().role : '';
    if (role === 'client') return [{ at: n - 36e5, title: 'نزل منشور جديد على صفحتك', body: 'ريل تحضير الحلويات صار منشور.', url: '#/content' }, { at: n - 864e5, title: 'تذكير بالدفعة', body: 'دفعة الشهر الحالي مستحقة.', url: '#/account' }];
    if (role === 'member') return [{ at: n - 18e5, title: 'مهمة جديدة', body: 'مونتاج ريل الطبق الجديد · مطعم الياسمين', url: '#/tasks' }, { at: n - 72e5, title: 'صباح الخير يزن', body: 'عندك اليوم 3 مهام.', url: '#/' }];
    return [{ at: n - 9e5, title: 'طلب محاسبة على شغل من يزن', body: 'المبلغ: $50 · تصوير إضافي يوم الخميس', url: '#/team' }, { at: n - 54e5, title: 'دفعة اشتراك جديدة', body: 'باقة النمو (3 أشهر) · $1,755 · مطعم الياسمين', url: '#/m/inbox' }, { at: n - 1728e5, title: 'أنجز يزن مهمة', body: 'تعديل الريل حسب ملاحظات العميل', url: '#/tasks' }];
  }
  function updateBadge() {
    notesAll().then(function (list) {
      if (!list.length) list = demoNotes();
      var seen = +(localStorage.getItem(NKEY) || 0), n = list.filter(function (x) { return x.at > seen; }).length;
      Array.prototype.forEach.call(document.querySelectorAll('.nbadge'), function (el) { el.hidden = !n; el.textContent = n > 9 ? '9+' : String(n); });
    });
  }
  function bellBtn(cls) { return '<a class="' + cls + ' bell" href="#/notes" aria-label="الإشعارات">' + TI.bell + '<i class="nbadge" hidden></i></a>'; }
  function ago(at) { var m = Math.round((Date.now() - at) / 6e4); if (m < 1) return 'هلّق'; if (m < 60) return 'قبل ' + m + ' دقيقة'; var hh = Math.round(m / 60); if (hh < 24) return 'قبل ' + hh + ' ساعة'; var dd = Math.round(hh / 24); return dd === 1 ? 'مبارح' : 'قبل ' + dd + ' يوم'; }
  function vNotes() {
    var isC = me().role === 'client', c = '<div class="hello"><h1>الإشعارات</h1><p class="mu">آخر اللي وصلك على هالجهاز</p></div>';
    if (nstate.list === null) {
      notesAll().then(function (l) { nstate.seen = +(localStorage.getItem(NKEY) || 0); nstate.list = l.length ? l : demoNotes(); try { localStorage.setItem(NKEY, String(Date.now())); } catch (e) {} render(); });
      c += '<p class="empty">جارٍ التحميل…</p>';
    } else {
      c += simpleList(nstate.list.map(function (x) { var u = x.at > nstate.seen; return '<a class="sline link' + (u ? ' unread' : '') + '" href="' + h(x.url || '#/') + '"><span class="s-main"><b>' + h(x.title) + '</b><small>' + (x.body ? h(x.body) + ' · ' : '') + h(ago(x.at)) + '</small></span>' + CHEV + '</a>'; }), 'ما وصلك إشعارات لسا. فعّل الإشعارات من ' + (isC ? 'الصفحة الرئيسية' : 'ملفك') + ' لتوصلك هون.');
    }
    if (isC) return appbar() + '<div class="portal">' + c + '</div>' + tabbar();
    return shell(c);
  }
  function vMember() {
    var u = me(), t = today(), mine = db.tasks.filter(function (x) { return x.user_id === u.id; }), open = mine.filter(function (x) { return !x.done; });
    var d = memberDue(u), wk = addDays(t, 7);
    var c = head('أهلاً، ' + u.name, (u.title || 'عضو الفريق') + ' · ' + longDates());
    c += '<div class="kpis">' + kpi('مهام اليوم', String(open.filter(function (x) { return x.due === t; }).length), true) + kpi('هذا الأسبوع', String(open.filter(function (x) { return x.due > t && x.due <= wk; }).length)) + kpi('متأخرة', String(open.filter(function (x) { return x.due < t; }).length)) + kpi('المتبقي لي', usd(d.left)) + '</div>';
    c += tile('مهامي', open.length + ' مهام مفتوحة', taskList(open.sort(function (a, b) { return a.due < b.due ? -1 : 1; }), false), true);
    c += '<div class="tiles">' + tile('مستحقاتي', 'المتبقي <span class="ltr">' + h(usd(d.left)) + '</span>', rows([['قيمة العقد', '<span class="ltr">' + h(usd(d.contract)) + '</span>'], ['المدفوع', '<span class="ltr">' + h(usd(d.paid)) + '</span>'], ['المتبقي', '<span class="ltr">' + h(usd(d.left)) + '</span>']])) +
      tile('دفعاتي', memberPays(u).length + ' دفعات', memberPays(u).length ? '<div class="paylog">' + memberPays(u).slice(0, 10).map(function (m) { return '<div><span>' + h(dateAr(m.date)) + (m.note ? ' · ' + h(m.note) : '') + '</span><span><b class="ltr">' + h(usd(m.usd)) + '</b> <em class="paid">تم القبض</em></span></div>'; }).join('') + '</div>' : '<p class="empty">ما في دفعات بعد.</p>') +
      tile('المنجز', mine.filter(function (x) { return x.done; }).length + ' مهام', taskList(mine.filter(function (x) { return x.done; }).slice(-10).reverse(), false)) + '</div>';
    return shell(c);
  }

  function vClients() {
    var c = head('العملاء', db.clients.length + ' عملاء', btn('+ عميل جديد', 'addClient', {}, 'pri'));
    c += db.clients.length ? '<div class="tiles">' + db.clients.map(function (cl) {
      var e = clientEnd(cl);
      return tile(cl.name, (cl.kind === 'project' ? 'مشروع' : 'إدارة صفحات') + ' · <span class="ltr">' + h(usd(num(cl.value))) + '</span>', rows([['النوع', cl.kind === 'project' ? 'مشروع' : 'إدارة صفحات'], ['القيمة', '<span class="ltr">' + h(usd(num(cl.value))) + '</span>'], ['ينتهي', e ? h(dateAr(e)) : 'غير محدد']]) + '<div class="acts"><a class="btn pri" href="#/client/' + h(cl.id) + '">فتح المساحة</a></div>');
    }).join('') + '</div>' : '<p class="empty">لا عملاء بعد. أضف أول عميل من الزر في الأعلى.</p>';
    return shell(c);
  }

  var DAYS7 = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  function monthName(ym) { try { return new Intl.DateTimeFormat('ar-SY-u-nu-latn', { month: 'long', year: 'numeric' }).format(new Date(ym + '-15T12:00:00')); } catch (x) { return ym; } }
  function planMonth(list) { var t = today(), up = list.filter(function (p) { return (p.date || '') >= t.slice(0, 7); }).map(function (p) { return p.date; }).sort(); return up.length && up[0].slice(0, 7) > t.slice(0, 7) && !list.some(function (p) { return (p.date || '').slice(0, 7) === t.slice(0, 7); }) ? up[0].slice(0, 7) : t.slice(0, 7); }
  function monthCal(list, ym, opt) {
    opt = opt || {};
    var first = new Date(ym + '-01T12:00:00'), days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(), lead = (first.getDay() + 1) % 7, t = today(), by = {};
    list.forEach(function (p) { if ((p.date || '').slice(0, 7) === ym) (by[p.date] = by[p.date] || []).push(p); });
    Object.keys(by).forEach(function (k) { by[k].sort(function (a, b) { return (a.time || '') < (b.time || '') ? -1 : 1; }); });
    function ev(p) {
      var s = pst(p.status), k = isReel(p) ? 'reel' : /كاروسيل/.test(p.type || '') ? 'car' : 'post', st = opt.client ? (s === 'منشور' ? 'نزل' : '') : pStage(p, s);
      var inner = '<b>' + h(p.name || p.type || 'منشور') + '</b><small>' + h([p.type, p.time, st].filter(Boolean).join(' · ')) + '</small>';
      return opt.client ? '<div class="pc-e ' + k + (s === 'منشور' ? ' done' : '') + '">' + inner + '</div>' : '<button type="button" class="pc-e ' + k + (s === 'منشور' ? ' done' : '') + '" data-act="editItem" data-mod="content" data-id="' + h(p.id) + '" title="تعديل">' + inner + '</button>';
    }
    var g = '', ag = '', n = 0, cells = Math.ceil((lead + days) / 7) * 7;
    for (var i = 0; i < cells; i++) {
      var dn = i - lead + 1;
      if (dn < 1 || dn > days) { g += '<div class="pc-d out" aria-hidden="true"></div>'; continue; }
      var ds = ym + '-' + pad(dn), l = by[ds] || []; n += l.length;
      g += '<div class="pc-d' + (ds === t ? ' now' : '') + (l.length ? ' has' : '') + '"><span class="pc-n">' + dn + '</span>' + l.map(ev).join('') + '</div>';
      if (l.length) ag += '<div class="pc-ag' + (ds === t ? ' now' : '') + '"><div class="pc-agh"><b>' + dn + '</b><span>' + DAYS7[(lead + dn - 1) % 7] + (ds === t ? ' · اليوم' : '') + '</span></div><div class="pc-agl">' + l.map(ev).join('') + '</div></div>';
    }
    return '<div class="pcal"><div class="pc-h">' + DAYS7.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div><div class="pc-g">' + g + '</div></div>' +
      '<div class="pc-agenda">' + (ag || '<p class="empty">ما في منشورات بهالشهر.</p>') + '</div>' +
      '<div class="pc-leg"><span><i class="reel"></i>ريل</span><span><i class="post"></i>بوست</span><span><i class="car"></i>كاروسيل</span>' + (n ? '<span class="mu">' + n + ' منشور بالشهر</span>' : '') + '</div>';
  }
  function vClientPlan(id) {
    var cl = byId('clients', id); if (!cl) return shell(head('العميل غير موجود', '', '<a class="btn" href="#/clients">رجوع</a>'));
    var all = items('post').filter(function (x) { return x.client_id === id; }), ym = mstate.pm[id] || (mstate.pm[id] = planMonth(all));
    var c = head('خطة المحتوى', cl.name, btn('+ منشور', 'addPost', { client: id }, 'pri') + '<details class="menu opts"><summary><span>خيارات</span>' + CHEV + '</summary><div class="pop"><a class="btn" href="#/client/' + h(id) + '">رجوع للعميل</a><label class="btn" for="xlfile">رفع ملف إكسل</label>' + btn('تحميل قالب إكسل', 'xlTemplate') + '</div></details><input id="xlfile" type="file" accept=".xlsx" data-chg="xlfile" hidden>');
    c += planBox(cl);
    c += flowView('c' + id, MODS.content, all, { noClient: true });
    c += '<section class="pc-sec"><div class="pc-top"><h2>' + h(monthName(ym)) + '</h2><div class="acts">' + btn('الشهر السابق', 'pmMonth', { id: id, d: -1 }) + btn('الشهر التالي', 'pmMonth', { id: id, d: 1 }) + '</div></div>' + monthCal(all, ym) + '</section>';
    return shell(c);
  }
  function rateSug() { var a = db.settings && db.settings.rate_auto; return a && a.day === today() && Number(a.rate) > 0 && !db.rates[today()] ? a : null; }
  function rateSugHtml(cls) { var a = rateSug(); return a ? '<div class="ratesug' + (cls ? ' ' + cls : '') + '"><span>سعر الليرة اليوم</span><b class="ltr">' + h(Number(a.rate).toLocaleString('en-US')) + '</b><span>ل.س</span>' + btn('اعتماد', 'rateOk', {}, 'pri sm') + '</div>' : ''; }

  function vClient(id) {
    var cl = byId('clients', id); if (!cl) return shell(head('العميل غير موجود', '', '<a class="btn" href="#/clients">رجوع</a>'));
    var mon = monthOf(today()), mv = db.moves.filter(function (m) { return live(m) && m.client_id === id; }), mm = mv.filter(function (m) { return monthOf(m.date) === mon; });
    var inc = sum(mm.filter(function (m) { return m.dir === 'in'; }), function (m) { return m.usd; }), out = sum(mm.filter(function (m) { return m.dir === 'out'; }), function (m) { return m.usd; });
    var team = db.users.filter(function (u) { return u.active !== false; }), e = clientEnd(cl), tasks = db.tasks.filter(function (t) { return t.client_id === id && !t.done; });
    var roles = normRoles(cl), rl = roleList();
    var rolesHtml = '<div class="rows">' + roles.map(function (r, i) {
      var u = byId('users', r.user);
      var sel = '<select aria-label="الشخص" data-chg="roleuser" data-id="' + h(id) + '" data-i="' + i + '" style="min-height:44px;background:var(--p2);border:1px solid var(--ln);border-radius:12px;padding:0 10px"><option value="">اختر الشخص</option>' + team.filter(function (x) { return x.role !== 'client'; }).map(function (x) { return '<option value="' + h(x.id) + '"' + (r.user === x.id ? ' selected' : '') + '>' + h(x.name) + '</option>'; }).join('') + '</select>';
      var nm = '<input aria-label="اسم الدور" list="dl_roles" autocomplete="off" placeholder="اسم الدور" data-chg="rolename" data-id="' + h(id) + '" data-i="' + i + '" value="' + h(r.role) + '" style="min-height:44px;width:150px;background:var(--p2);border:1px solid var(--ln);border-radius:12px;padding:0 10px">';
      return '<div><span class="acts">' + nm + sel + '</span><span class="acts">' + (u ? '<a class="btn sm" target="_blank" rel="noopener" href="' + h(waLink(u, cl.name)) + '">شو صار معك؟ · واتساب</a>' : '') + btn('حذف', 'delRole', { id: id, i: i }, 'sm') + '</span></div>';
    }).join('') + '</div><datalist id="dl_roles">' + rl.map(function (x) { return '<option value="' + h(x) + '">'; }).join('') + '</datalist>' + btn('+ إضافة دور', 'addRole', { id: id }, 'sm');
    var c = head(cl.name, (cl.kind === 'project' ? 'مشروع' : 'إدارة صفحات') + (e ? ' · ينتهي ' + dateAr(e) : ''), '<a class="btn pri" href="#/client/' + h(id) + '/plan">خطة المحتوى</a><details class="menu opts"><summary><span>خيارات</span>' + CHEV + '</summary><div class="pop">' + btn('+ دفعة من العميل', 'addMove', { client: id }) + btn('تعديل بيانات العميل', 'editClient', { id: id }) + (ONLINE && clientUser(cl) ? btn('إرسال إشعار', 'sendNote', { client: id }) : '') + clientLoginBtn(cl) + (isMgr() ? btn('حذف العميل', 'delClient', { id: id }, 'danger') : '') + '</div></details>');
    var allIn = sum(mv.filter(function (m) { return m.dir === 'in'; }), function (m) { return m.usd; }), mths = num(cl.months);
    var total = cl.kind === 'project' ? num(cl.value) : (mths ? num(cl.value) * mths : 0);
    c += '<div class="kpis">' + kpi('قيمة العقد', usd(total || num(cl.value)), false, cl.kind === 'project' ? 'للمشروع' : (mths ? usd(num(cl.value)) + ' شهرياً × ' + mths + ' أشهر' : 'شهرياً · المدة غير محددة')) +
      kpi('المقبوض من العميل', usd(allIn), false, 'منه هذا الشهر ' + usd(inc)) +
      kpi('الباقي على العميل', total ? usd(Math.max(0, total - allIn)) : 'غير محدد', true, total ? 'من كامل العقد' : 'حدّد مدة العقد من زر التعديل') +
      kpi('كلفة هذا الشهر', usd(out), false, 'أجور وتمويل ومصاريف') + kpi('الصافي هذا الشهر', usd(inc - out)) + '</div>';
    c += '<div class="tiles">' + tile('الأدوار', 'من يعمل على العميل', rolesHtml, true) +
      tile('المهام المفتوحة', tasks.length + ' مهام', taskList(tasks, true) + btn('+ مهمة', 'addTask', { client: id })) +
      tile('آخر الحركات', mv.length + ' حركة', rows(mv.slice(-8).reverse().map(function (m) { return [h(dateAr(m.date)) + ' · ' + h(m.cat) + (m.note ? ' · ' + h(m.note) : ''), '<span class="ltr">' + (m.dir === 'in' ? '+' : '-') + h(usd(m.usd)) + '</span>']; }))) +
      tile('ملاحظات', cl.notes ? 'مكتوبة' : 'لا ملاحظات', '<p>' + (cl.notes ? h(cl.notes) : '<span class="mu">أضف ملاحظات من زر التعديل.</span>') + '</p>') + '</div>';
    return shell(c);
  }

  function memberPays(u) { return db.moves.filter(function (m) { return live(m) && m.dir === 'out' && m.user_id === u.id; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }); }
  function memberRow(u) {
    var d = memberDue(u), open = db.tasks.filter(function (t) { return t.user_id === u.id && !t.done; }).length, pays = memberPays(u);
    var body = rows([['الهاتف', '<span class="ltr">' + h(u.phone || '') + '</span>'], ['شام كاش', u.shamcash ? '<span class="ltr">' + h(u.shamcash) + '</span>' : 'غير محدد'], ['قيمة العقد', '<span class="ltr">' + h(usd(d.contract)) + '</span>'], ['المدفوع', '<span class="ltr">' + h(usd(d.paid)) + '</span>'], ['المتبقي', '<span class="ltr">' + h(usd(d.left)) + '</span>'], ['مهام مفتوحة', String(open)]]);
    if (pays.length) body += '<div class="paylog"><h3>الدفعات</h3>' + pays.slice(0, 6).map(function (m) { return '<div><span>' + h(dateAr(m.date)) + (m.note ? ' · ' + h(m.note) : '') + '</span><span><b class="ltr">' + h(usd(m.usd)) + '</b> <em class="paid">تم القبض</em></span></div>'; }).join('') + '</div>';
    body += '<div class="acts">' + btn('دفع له', 'addMove', { user: u.id }, 'sm pri') + '<a class="btn sm" target="_blank" rel="noopener" href="' + h(waLink(u)) + '">واتساب</a>' + (ONLINE ? btn('إشعار', 'sendNote', { uid: u.id }, 'sm') : '') + btn('تعديل', 'editMember', { id: u.id }, 'sm') + btn(u.active === false ? 'تفعيل' : 'إيقاف', 'toggleMember', { id: u.id }, 'sm') + '</div>';
    return '<details class="mrow' + (u.active === false ? ' off' : '') + '"><summary>' + avatar(u) + '<span class="mr-main"><b>' + h(u.name) + '</b><small>' + h(tags(u.title).join(' · ') || 'بدون اختصاص') + (u.active === false ? ' · موقوف' : '') + '</small></span><span class="mr-due"><small>المتبقي</small><b class="ltr">' + h(usd(d.left)) + '</b></span>' + CHEV + '</summary><div class="mr-body">' + body + '</div></details>';
  }
  function vTeam() {
    var all = db.users.filter(function (u) { return u.role === 'member'; }), act = all.filter(function (u) { return u.active !== false; }), sp = mstate.teamSpec || '';
    var specs = {}; all.forEach(function (u) { tags(u.title).forEach(function (t) { specs[t] = (specs[t] || 0) + 1; }); });
    var c = head('الفريق', act.length + ' أشخاص', btn('+ عضو جديد', 'addMember', {}, 'pri'));
    c += '<div class="kpis">' + kpi('موظفون', String(act.filter(function (u) { return u.kind === 'employee'; }).length)) + kpi('فريلانس', String(act.filter(function (u) { return u.kind !== 'employee'; }).length)) + kpi('مستحقات الفريق', usd(sum(act, function (u) { return memberDue(u).left; })), true) + '</div>';
    if (!all.length) return shell(c + '<p class="empty">لا أعضاء بعد. أضف أول عضو من الزر في الأعلى.</p>');
    c += '<div class="tfilter"><label for="teamspec">الاختصاص</label><select id="teamspec" data-chg="teamspec"><option value="">كل الاختصاصات</option>' + Object.keys(specs).sort().map(function (k) { return '<option value="' + h(k) + '"' + (k === sp ? ' selected' : '') + '>' + h(k) + ' (' + specs[k] + ')</option>'; }).join('') + '</select></div>';
    var fl = all.filter(function (u) { return !sp || tags(u.title).indexOf(sp) >= 0; });
    [['employee', 'الموظفون'], ['freelancer', 'الفريلانس']].forEach(function (g) {
      var l = fl.filter(function (u) { return g[0] === 'employee' ? u.kind === 'employee' : u.kind !== 'employee'; }).sort(function (a, b) { return (a.active === false) - (b.active === false) || (a.name < b.name ? -1 : 1); });
      c += '<details class="tile tgroup" open><summary><div><h2>' + g[1] + '</h2><span>' + l.length + ' · المتبقي <span class="ltr">' + h(usd(sum(l.filter(function (u) { return u.active !== false; }), function (u) { return memberDue(u).left; }))) + '</span></span></div>' + CHEV + '</summary><div class="body">' + (l.length ? '<div class="mlist">' + l.map(memberRow).join('') + '</div>' : '<p class="empty">ما في حدا' + (sp ? ' بهالاختصاص' : '') + '.</p>') + '</div></details>';
    });
    return shell(c);
  }

  function vTasks() {
    var t = today(), all = db.tasks.slice().sort(function (a, b) { return a.due < b.due ? -1 : 1; }), open = all.filter(function (x) { return !x.done; });
    var late = open.filter(function (x) { return x.due < t; }), td = open.filter(function (x) { return x.due === t; }), nx = open.filter(function (x) { return x.due > t; }), dn = all.filter(function (x) { return x.done; });
    var c = head('المهام', open.length + ' مهمة مفتوحة · ' + late.length + ' متأخرة', btn('+ مهمة جديدة', 'addTask', {}, 'pri'));
    c += '<div class="kpis">' + kpi('مفتوحة', String(open.length)) + kpi('اليوم', String(td.length), true) + kpi('متأخرة', String(late.length)) + kpi('منجزة', String(dn.length)) + '</div>';
    c += tile('متأخرة', late.length + ' مهام', taskList(late, true), late.length > 0) + tile('اليوم', td.length + ' مهام', taskList(td, true), true) + tile('قادمة', nx.length + ' مهام', taskList(nx, true)) + tile('منجزة', dn.length + ' مهام', taskList(dn.slice(-15).reverse(), true));
    return shell(c);
  }

  function vFinance() {
    var t = today(), mon = monthOf(t), mv = db.moves.filter(live), mm = mv.filter(function (m) { return monthOf(m.date) === mon; });
    var inc = sum(mm.filter(function (m) { return m.dir === 'in'; }), function (m) { return m.usd; }), out = sum(mm.filter(function (m) { return m.dir === 'out'; }), function (m) { return m.usd; }), bx = box(), lr = lastRate();
    var c = head('المالية', 'العرض بالدولار · الإدخال بالليرة أو الدولار', btn('+ دين', 'addDebt') + btn('+ حركة جديدة', 'addMove', {}, 'pri'));
    if (!db.rates[t] && rateSug()) c += rateSugHtml();
    else if (!db.rates[t]) c += '<p class="warn">سعر الصرف لم يُدخل اليوم.' + (lr ? ' الحركات بالليرة ستُحسب على آخر سعر: ' + h(lr.rate) + ' (' + h(dateAr(lr.date)) + ').' : ' أدخله من الأعلى قبل تسجيل أي حركة بالليرة.') + '</p>';
    c += '<div class="kpis">' + kpi('دخل الشهر', usd(inc), true) + kpi('مصاريف الشهر', usd(out)) + kpi('الصافي', usd(inc - out)) + kpi('الصندوق', usd(bx.total), false, 'دولار وليرة') + '</div>';
    var list = db.moves.slice().sort(function (a, b) { return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0); }).slice(0, 60);
    var tb = list.length ? '<div class="tbl"><table><thead><tr><th>التاريخ</th><th>البيان</th><th>المبلغ</th><th>بالدولار</th><th></th></tr></thead><tbody>' + list.map(function (m) {
      var who = (m.client_id ? ' · ' + h(clientName(m.client_id)) : '') + (m.user_id ? ' · ' + h(userName(m.user_id)) : '');
      return '<tr class="' + (m.is_void ? 'done' : '') + '"><td>' + h(dateAr(m.date)) + '</td><td>' + h(m.cat) + (m.service ? ' · ' + h(m.service) : '') + (m.receipt ? ' · ' + h(m.receipt) : '') + (m.note ? ' · ' + h(m.note) : '') + who + (m.is_void ? ' · ملغاة' : '') + '</td><td>' + (m.cur === 'USD' ? '<span class="ltr">' + h(usd(m.amount)) + '</span>' : h(syp(m.amount)) + ' <span class="mu">@' + h(m.rate) + '</span>') + '</td><td><b class="ltr">' + (m.dir === 'in' ? '+' : '-') + h(usd(m.usd)) + '</b></td><td>' + (m.is_void ? btn('حذف نهائي', 'delMove', { id: m.id }, 'sm') : btn('إلغاء', 'voidMove', { id: m.id }, 'sm')) + '</td></tr>';
    }).join('') + '</tbody></table></div>' : '<p class="empty">لا حركات بعد.</p>';
    c += tile('الحركات', db.moves.length + ' حركة', tb, true);
    function debts(dir) { var l = db.debts.filter(function (d) { return d.dir === dir && !d.settled; }); return [l, l.length ? '<div class="rows">' + l.map(function (d) { return '<div><span>' + h(d.party) + (d.due ? ' · ' + h(dateAr(d.due)) : '') + '</span><span class="acts"><b class="ltr">' + h(usd(d.usd)) + '</b>' + btn('تسديد', 'settle', { id: d.id }, 'sm') + '</span></div>'; }).join('') + '</div>' : '<p class="empty">لا ديون.</p>']; }
    var a = debts('owe'), b = debts('owed');
    c += '<div class="tiles">' + tile('ديون عليّ', '<span class="ltr">' + h(usd(sum(a[0], function (d) { return d.usd; }))) + '</span>', a[1]) + tile('ديون لي', '<span class="ltr">' + h(usd(sum(b[0], function (d) { return d.usd; }))) + '</span>', b[1]) +
      tile('الصندوق', 'دولار وليرة', rows([['رصيد الدولار', '<span class="ltr">' + h(usd(bx.USD)) + '</span>'], ['رصيد الليرة', h(syp(bx.SYP))], ['آخر سعر صرف', lr ? h(lr.rate) + ' · ' + h(dateAr(lr.date)) : 'لم يُدخل']])) + '</div>';
    return shell(c);
  }

  function vProfile() {
    var u = me();
    function f(k, label, type, wide) { return '<div class="fld' + (wide ? ' wide' : '') + '"><label for="p_' + k + '">' + label + '</label>' + (type === 'area' ? '<textarea id="p_' + k + '" name="' + k + '">' + h(u[k]) + '</textarea>' : '<input id="p_' + k + '" name="' + k + '" type="' + (type || 'text') + '" value="' + h(u[k]) + '">') + '</div>'; }
    var c = head('الملف الشخصي', isMgr() ? 'المدير · يرى كل شيء' : 'عضو الفريق', btn('تسجيل الخروج', 'logout'));
    c += '<div class="tiles"><section class="tile" style="padding:24px;display:flex;flex-direction:column;align-items:center;gap:12px"><span class="av" style="width:140px;height:140px;font-size:56px;border-width:3px">' + (u.photo ? '<img src="' + h(u.photo) + '" alt="صورة الملف الشخصي">' : h((u.name || '؟').charAt(0))) + '</span><b style="font-size:20px">' + h(u.name) + '</b><span class="mu">' + h(u.title || '') + '</span><div class="acts"><label class="btn pri" for="photo">رفع صورة</label><input id="photo" type="file" accept="image/*" data-chg="photo" hidden>' + (u.photo ? btn('حذف الصورة', 'delPhoto') : '') + '</div></section>';
    c += '<section class="tile" style="padding:24px;grid-column:span 2;min-width:0"><form class="form" data-form="profile">' + f('name', 'الاسم') + f('title', 'الصفة أو العنوان') + '<div class="fld"><label for="p_gender">الجنس</label><select id="p_gender" name="gender"><option value="m"' + (u.gender !== 'f' ? ' selected' : '') + '>ذكر</option><option value="f"' + (u.gender === 'f' ? ' selected' : '') + '>أنثى</option></select></div>' + f('phone', 'رقم التواصل' + (ONLINE && u.login_phone ? ' (رقم الدخول: ' + u.login_phone + ')' : ''), 'tel') + f('email', 'الإيميل', 'email') + f('city', 'المدينة') + f('insta', 'حساب إنستغرام') + f('bio', 'نبذة', 'area', true) + '<div class="fld wide"><p class="err" id="perr"></p><div class="acts"><button class="btn pri" type="submit">حفظ التعديلات</button>' + btn('تغيير كلمة السر', 'chPass') + '</div></div></form></section></div>';
    c += pushTile();
    if (isMgr() && ONLINE) c += tile('سجل النشاط', 'مين غيّر شو ومتى', '<p class="mu">كل إضافة أو تعديل أو حذف على المال والعملاء والفريق بينسجل هون، وما حدا بيقدر يمسحه من التطبيق.</p><div class="acts">' + btn('عرض آخر 60 نشاط', 'auditShow', {}, 'pri') + '</div>');
    if (isMgr()) c += tile('بوابة العملاء', 'رقم الواتساب: ' + h(db.settings.shafq_phone || me().phone || 'غير محدد'), '<p class="mu">زر «شو صار معكم؟» عند المنشور المتأخر، وزر «تواصل مع شفق» في بوابة العميل، يفتحان واتساب على هذا الرقم.</p><div class="acts"><label for="shafqph" class="mu">رقم شفق</label><input id="shafqph" type="tel" data-chg="shafqph" value="' + h(db.settings.shafq_phone || me().phone || '') + '" style="min-height:44px;padding:0 16px;background:var(--p2);border:1px solid var(--ln);border-radius:999px"></div>');
    if (isMgr() && !ONLINE) c += tile('النسخ الاحتياطي', 'البيانات محفوظة على هذا الجهاز', '<p class="mu">في هذه النسخة البيانات محفوظة في متصفح هذا الجهاز فقط. نزّل نسخة احتياطية بانتظام.</p><div class="acts">' + btn('تنزيل نسخة احتياطية', 'backup') + '<label class="btn" for="restore">استرجاع نسخة</label><input id="restore" type="file" accept="application/json" data-chg="restore" hidden></div>');
    return shell(c);
  }

  function vSoon(name) { return shell(head(name, 'هذا القسم لم يُبنَ بعد', '') + '<p class="empty">القسم مصمم على لوحة التصميم، وسيُبنى في خطوة قادمة.</p>'); }

  function vLoading() { return '<div class="loading"><div class="l-ring"><img class="lg-w" src="' + LOGO_W + '" alt="شعار شفق"><img class="lg-b" src="' + LOGO_B + '" alt="شعار شفق"></div><p>جارٍ تجهيز مكتبك<span class="dots"><i>.</i><i>.</i><i>.</i></span></p></div>'; }
  function authTime() { var p = longDates().split(' · '); return '<div class="a-time"><span class="a-greet">' + h(greet()) + '</span><span class="clock" id="clock"></span><span class="a-date">' + h(p[0] || '') + '</span>' + (p[1] ? '<span class="a-hijri">' + h(p[1]) + '</span>' : '') + '</div>'; }
  function authCard(inner) { return '<div class="auth"><div class="a-bg"><i></i><i></i></div><div class="card"><div class="a-logo"><img class="lg-w" src="' + LOGO_W + '" alt="شعار شفق"><img class="lg-b" src="' + LOGO_B + '" alt="شعار شفق"></div>' + authTime() + inner + '</div></div>'; }
  function vSetup() { return authCard('<h1>إعداد نظام شفق</h1><p>أول دخول: أنشئ حساب المدير.</p><form class="fld" data-form="setup" style="gap:14px"><div class="fld"><label for="s_name">الاسم</label><input id="s_name" name="name" required></div><div class="fld"><label for="s_phone">رقم الموبايل</label><input id="s_phone" name="phone" type="tel" required></div><div class="fld"><label for="s_pass">كلمة السر</label><input id="s_pass" name="pass" type="password" minlength="6" required></div><p class="err" id="aerr"></p><button class="btn pri" type="submit">إنشاء الحساب والدخول</button></form>'); }
  function vLogin() { return authCard('<h1>تسجيل الدخول</h1><p>شفق ميديا · نظام إدارة الأعمال</p><form class="fld" data-form="login" style="gap:14px"><div class="fld"><label for="l_phone">رقم الموبايل</label><input id="l_phone" name="phone" type="tel" required></div><div class="fld"><label for="l_pass">كلمة السر</label><input id="l_pass" name="pass" type="password" required></div><p class="err" id="aerr"></p><button class="btn pri" type="submit">دخول</button></form>' + (ONLINE ? '<button class="linkbtn" type="button" data-act="forgotOpen">نسيت كلمة السر؟</button>' : '<p>نسيت كلمة السر؟ اطلب من المدير إعادة تعيينها.</p>')); }
  var fstate = { open: false, sent: false, phone: '', wa: '' };
  function vForgot() {
    if (fstate.sent) return authCard('<h1>وصل طلبك ✓</h1><p>انبعت إشعار للإدارة. ولتتأكد إنه وصل، ابعت الرسالة على واتساب كمان:</p>' + (fstate.wa ? '<a class="btn pri wa-big" target="_blank" rel="noopener" href="' + h(fstate.wa) + '">إرسال واتساب</a>' : '<p class="warn">ما قدرت أجيب رقم شفق. تواصل مع المدير مباشرة.</p>') + '<button class="linkbtn" type="button" data-act="forgotClose">رجوع لتسجيل الدخول</button>');
    return authCard('<h1>نسيت كلمة السر</h1><p>اكتب رقمك، ومنبعت للإدارة طلب تعيد ضبط كلمة السر.</p><form class="fld" data-form="forgot" style="gap:14px"><div class="fld"><label for="f_phone">رقم الموبايل</label><input id="f_phone" name="phone" type="tel" required value="' + h(fstate.phone) + '"></div><p class="err" id="aerr"></p><button class="btn pri" type="submit">متابعة</button></form><button class="linkbtn" type="button" data-act="forgotClose">رجوع لتسجيل الدخول</button>');
  }

  /* ---------- النوافذ ---------- */
  var formCb = null;
  function openForm(title, fields, cb, note, okLabel) {
    formCb = cb;
    var out = '<div class="dlg" role="dialog" aria-modal="true" aria-label="' + h(title) + '"><h2>' + h(title) + '</h2>' + (note ? (note.html ? '<div class="mu">' + note.html + '</div>' : '<p class="mu">' + h(note) + '</p>') : '') + '<form class="form" data-form="modal">';
    fields.forEach(function (f) {
      var id = 'm_' + f.k, el;
      if (f.type === 'select') el = '<select id="' + id + '" name="' + f.k + '">' + f.options.map(function (o) { return '<option value="' + h(o[0]) + '"' + (String(f.value) === String(o[0]) ? ' selected' : '') + '>' + h(o[1]) + '</option>'; }).join('') + '</select>';
      else if (f.type === 'checks') { var cv = tags(f.value), opts = f.options.concat(cv.filter(function (x) { return f.options.indexOf(x) < 0; })); el = '<div class="checks" id="' + id + '" role="group">' + opts.map(function (o) { return '<label class="chk"><input type="checkbox" name="' + f.k + '" value="' + h(o) + '"' + (cv.indexOf(o) >= 0 ? ' checked' : '') + '><span>' + h(o) + '</span></label>'; }).join('') + '</div>'; }
      else if (f.type === 'area') el = '<textarea id="' + id + '" name="' + f.k + '">' + h(f.value) + '</textarea>';
      else el = '<input id="' + id + '" name="' + f.k + '" type="' + (f.type || 'text') + '" value="' + h(f.value == null ? '' : f.value) + '"' + (f.req ? ' required' : '') + (f.ph ? ' placeholder="' + h(f.ph) + '"' : '') + (f.type === 'number' ? ' step="any" min="0" inputmode="decimal"' : '') + (f.accept ? ' accept="' + h(f.accept) + '"' : '') + (f.list ? ' list="dl_' + f.k + '" autocomplete="off"' : '') + '>' + (f.list ? '<datalist id="dl_' + f.k + '">' + f.list.map(function (o) { return '<option value="' + h(o) + '">'; }).join('') + '</datalist>' : '');
      out += '<div class="fld' + (f.wide ? ' wide' : '') + '"><label for="' + id + '">' + h(f.label) + '</label>' + el + '</div>';
    });
    out += '<div class="fld wide"><p class="err" id="merr"></p><div class="acts"><button class="btn pri" type="submit">' + h(okLabel || 'حفظ') + '</button>' + btn('إلغاء', 'close') + '</div></div></form></div>';
    var m = document.getElementById('modal'); m.innerHTML = out; m.hidden = false;
    var first = m.querySelector('input,select,textarea'); if (first) first.focus();
  }
  function closeForm() { var m = document.getElementById('modal'); m.hidden = true; m.innerHTML = ''; formCb = null; }
  function memberOpts(none) { return (none ? [['', none]] : []).concat(db.users.filter(function (u) { return u.active !== false && u.role !== 'client'; }).map(function (u) { return [u.id, u.name]; })); }
  function titleList() { var o = {}; TITLES.concat(db.users.map(function (u) { return u.title; })).concat(roleList(true)).forEach(function (t) { if (t) o[t] = 1; }); return Object.keys(o); }
  function roleList(raw) { var o = {}; db.clients.forEach(function (c) { normRoles(c).forEach(function (r) { if (r.role) o[r.role] = 1; }); }); return raw ? Object.keys(o) : TITLES.concat(Object.keys(o)).filter(function (x, i, a) { return a.indexOf(x) === i; }); }
  function serviceList() { var o = {}; SERVICES.concat(db.settings.services || []).concat(db.moves.map(function (m) { return m.service; })).forEach(function (t) { if (t) o[t] = 1; }); return Object.keys(o); }
  function normRoles(c) { if (Array.isArray(c.roles)) return c.roles; var out = []; var r = c.roles || {}; ROLES.forEach(function (x) { if (r[x[0]]) out.push({ role: x[1], user: r[x[0]] }); }); return out; }
  function clientOpts() { return [['', 'عام (بدون عميل)']].concat(db.clients.map(function (c) { return [c.id, c.name]; })); }

  function saveMove(v) {
        var amt = num(v.amount); if (amt <= 0) return { err: 'أدخل مبلغاً أكبر من صفر.' };
        if (CATS_IN.indexOf(v.cat) >= 0 && v.dir !== 'in') return { err: 'هذا التصنيف للقبض. غيّر النوع أو التصنيف.' };
        if (CATS_OUT.indexOf(v.cat) >= 0 && v.dir !== 'out') return { err: 'هذا التصنيف للدفع. غيّر النوع أو التصنيف.' };
        var rate = 1;
        if (v.cur === 'SYP') { rate = db.rates[v.date] || (lastRate() || {}).rate; if (!rate) return { err: 'أدخل سعر الصرف من أعلى الشاشة أولاً.' }; }
        var svc = (v.service || '').trim(), mid = uid(), rcv = ''; v.note = v.note || '';
        if (svc && serviceList().indexOf(svc) < 0) { db.settings.services = (db.settings.services || []).concat([svc]); }
        if (v.dir === 'in' && v.client_id) { rcv = nextNo('RCV', v.date); db.items.push({ id: uid(), kind: 'paper', status: 'سارية', created: today(), code: 'RCV', no: rcv, name: clientName(v.client_id), amount: amt, cur: v.cur, date: v.date, move_id: mid, notes: svc }); }
        db.moves.push({ id: mid, date: v.date, dir: v.dir, cat: v.cat, amount: amt, cur: v.cur, rate: rate, usd: v.cur === 'USD' ? amt : amt / rate, note: v.note.trim(), service: svc, receipt: rcv, client_id: v.client_id, user_id: v.user_id, item_id: v.item_id || '', created_by: me().id, is_void: false });
        if (v.dir === 'in' && v.client_id) notify([{ to: { client: v.client_id }, title: 'وصلتنا دفعتكم', body: amountTxt(amt, v.cur) + (svc ? ' عن ' + svc : '') + (rcv ? ' · وصل ' + rcv : '') + '. شكراً لثقتكم', tag: 'pay' }]);
        if (v.dir === 'out' && v.user_id && v.user_id !== me().id) { var pu = byId('users', v.user_id) || {}; notify([{ to: [v.user_id], title: 'سجّلنا دفعة ' + (pu.gender === 'f' ? 'إلكِ' : 'إلك') + '', body: amountTxt(amt, v.cur) + (v.note.trim() ? ' · ' + v.note.trim() : ''), tag: 'pay' }]); }
        return rcv ? 'سُجّلت الدفعة · وصل ' + rcv : v.user_id && v.dir === 'out' ? 'سُجّلت · تم القبض لـ ' + userName(v.user_id) : 'سُجّلت الحركة';
  }
  var acts = {
    close: closeForm,
    theme: function () { var l = document.body.classList.toggle('t-light'); document.body.classList.toggle('t-dark', !l); localStorage.setItem(TKEY, l ? 'light' : 'dark'); themeMeta(); render(); },
    moreNav: function () { document.body.classList.toggle('navopen'); },
    msgAdmin: function (d) { if (isMgr()) return; msgAdminForm(d.kind); },
    logout: function () { try { localStorage.removeItem(NKEY); if (window.indexedDB) indexedDB.deleteDatabase('shafq-notes'); } catch (e) {} pstate.data = null; pstate.month = ''; if (ONLINE) { SRV.idle().then(pushOff).then(function () { return SRV.signOut(); }).then(function () { db = blank(); location.hash = '#/'; checkSetup(); }); return; } localStorage.removeItem(SKEY); location.href = '../index.html'; },
    retry: function () { boot(); },
    addClient: function () { clientForm(null); },
    editClient: function (d) { clientForm(byId('clients', d.id)); },
    delClient: function (d) {
      var cl = byId('clients', d.id); if (!cl) return;
      var mv = db.moves.filter(function (m) { return m.client_id === cl.id; }), tk = db.tasks.filter(function (t) { return t.client_id === cl.id; });
      var msg = 'حذف العميل «' + cl.name + '» نهائياً؟ لا يمكن التراجع.';
      if (tk.length) msg += '\n\nرح تنحذف معه ' + tk.length + ' مهمة.';
      if (mv.length) msg += '\n\nوعنده ' + mv.length + ' حركة مالية: رح تنحذف كمان من المالية.';
      if (clientUser(cl)) msg += '\n\nملاحظة: حساب دخول العميل بيضل، وقّفه من الفريق إذا بدك.';
      if (!confirm(msg)) return;
      var mids = mv.map(function (m) { return m.id; });
      db.moves = db.moves.filter(function (m) { return m.client_id !== cl.id; });
      db.tasks = db.tasks.filter(function (t) { return t.client_id !== cl.id; });
      db.items.forEach(function (x) { if (x.client_done === cl.id) delete x.client_done; if (x.kind === 'paper' && mids.indexOf(x.move_id) >= 0) x.status = 'ملغاة'; });
      db.clients = db.clients.filter(function (c) { return c.id !== cl.id; });
      save(); location.hash = '#/clients'; render();
    },
    addMember: function () { memberForm(null); },
    editMember: function (d) { memberForm(byId('users', d.id)); },
    toggleMember: function (d) { var u = byId('users', d.id); u.active = u.active === false; save(); render(); toast(u.active ? 'تم التفعيل' : 'تم الإيقاف'); },
    addTask: function (d) {
      openForm('مهمة جديدة', [{ k: 'title', label: 'المهمة', req: true, wide: true }, { k: 'user_id', label: 'لمن', type: 'select', options: memberOpts(), value: me().id }, { k: 'client_id', label: 'العميل', type: 'select', options: clientOpts(), value: d.client || '' }, { k: 'due', label: 'موعد التسليم', type: 'date', value: today(), req: true }], function (v) {
        db.tasks.push({ id: uid(), title: v.title.trim(), user_id: v.user_id, client_id: v.client_id, client_name: v.client_id ? clientName(v.client_id) : '', due: v.due, done: false, done_at: '' });
        if (v.user_id && v.user_id !== me().id) notify([{ to: [v.user_id], title: 'مهمة جديدة', body: v.title.trim() + ' · التسليم ' + dateAr(v.due), tag: 'task' }]);
        return 'أُضيفت المهمة';
      });
    },
    delTask: function (d) { if (!confirm('حذف المهمة؟')) return; db.tasks = db.tasks.filter(function (t) { return t.id !== d.id; }); save(); render(); },
    addMove: function (d) {
      var isPay = !!d.user, isCl = !!d.client;
      if (isCl) {
        openForm('دفعة من ' + clientName(d.client), [
          { k: 'cat', label: 'التصنيف', type: 'select', options: CATS_IN.map(function (c) { return [c, c]; }), value: 'دفعة عميل' },
          { k: 'amount', label: 'المبلغ', type: 'number', req: true }, { k: 'cur', label: 'العملة', type: 'select', options: [['USD', 'دولار'], ['SYP', 'ليرة سورية']], value: 'USD' },
          { k: 'date', label: 'التاريخ', type: 'date', value: today(), req: true }, { k: 'service', label: 'عن شو', ph: 'اختر أو اكتب خدمة جديدة', list: serviceList() }, { k: 'note', label: 'ملاحظة داخلية (لا تظهر للعميل)', wide: true }
        ], function (v) { v.dir = 'in'; v.client_id = d.client; v.user_id = ''; v.item_id = ''; return saveMove(v); }, 'الحركة بالليرة تُحوَّل إلى الدولار بسعر يومها.');
        return;
      }
      openForm(isPay ? 'دفع لعضو الفريق' : 'حركة مالية جديدة', [
        { k: 'dir', label: 'النوع', type: 'select', options: [['in', 'قبض (دخل)'], ['out', 'دفع (مصروف)']], value: isPay ? 'out' : 'in' },
        { k: 'cat', label: 'التصنيف', type: 'select', options: CATS_IN.concat(CATS_OUT).map(function (c) { return [c, c]; }), value: isPay ? 'أجر فريق' : 'دفعة عميل' },
        { k: 'amount', label: 'المبلغ', type: 'number', req: true }, { k: 'cur', label: 'العملة', type: 'select', options: [['USD', 'دولار'], ['SYP', 'ليرة سورية']], value: 'USD' },
        { k: 'date', label: 'التاريخ', type: 'date', value: today(), req: true }, { k: 'client_id', label: 'العميل', type: 'select', options: clientOpts(), value: d.client || '' },
        { k: 'user_id', label: 'عضو الفريق', type: 'select', options: memberOpts('لا أحد'), value: d.user || '' }, { k: 'item_id', label: 'مربوط بمشروع أو طلب درون', type: 'select', options: itemOpts(), value: d.item || '' }, { k: 'service', label: 'عن شو', ph: 'اختر أو اكتب خدمة جديدة', list: serviceList() }, { k: 'note', label: 'ملاحظة داخلية (لا تظهر للعميل)', wide: true }
      ], function (v) {
        if (v.cat === 'أجر فريق' && !v.user_id) return { err: 'اختار عضو الفريق اللي قبض الأجر.' };
        if (v.user_id && v.dir === 'in') return { err: 'الدفع لعضو الفريق نوعه دفع (مصروف).' };
        return saveMove(v);
      }, 'الحركة بالليرة تُحوَّل إلى الدولار بسعر يومها، ويُحفظ السعر معها.');
    },
    voidMove: function (d) { if (!confirm('إلغاء الحركة؟ تبقى في السجل ولا تُحسب.')) return; var mv0 = byId('moves', d.id); mv0.is_void = true; db.items.forEach(function (p) { if (p.kind === 'paper' && p.move_id === mv0.id) p.status = 'ملغاة'; }); save(); render(); toast('أُلغيت الحركة'); },
    addRole: function (d) { var c = byId('clients', d.id); c.roles = normRoles(c).concat([{ role: '', user: '' }]); save(); render(); },
    delRole: function (d) { var c = byId('clients', d.id), rs = normRoles(c).slice(); rs.splice(+d.i, 1); c.roles = rs; save(); render(); },
    auditShow: function () {
      SRV.auditLog().then(function (rows) {
        var T = { moves: 'المال', profiles: 'الفريق', clients: 'العملاء', settings: 'الإعدادات', items: 'الأقسام' }, O = { insert: 'إضافة', update: 'تعديل', 'delete': 'حذف' };
        var html = rows && rows.length ? '<div class="tbl"><table><thead><tr><th>الوقت</th><th>مين</th><th>شو</th><th>التفاصيل</th></tr></thead><tbody>' + rows.map(function (r) { var d = new Date(r.at); return '<tr><td class="ltr">' + h(d.toISOString().slice(0, 10) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())) + '</td><td>' + h(r.actor_name || 'النظام') + '</td><td>' + h((O[r.op] || r.op) + ' · ' + (T[r.tbl] || r.tbl)) + '</td><td>' + h(r.summary || '') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p>لسا ما في نشاط مسجّل.</p>';
        alertBox('سجل النشاط', { html: html });
      }, function (e) { toast(/audit_log/.test(e.message) ? 'شغّل schema6.sql بـ Supabase أول' : 'تعذر التحميل: ' + e.message); });
    },
    clientLogin: function (d) { clientLoginForm(byId('clients', d.id)); },
    clientPass: function (d) {
      var u = byId('users', d.uid);
      openForm('كلمة سر جديدة لـ ' + u.name, [{ k: 'pass', label: 'كلمة السر الجديدة', type: 'password', req: true }], function (v) {
        if (v.pass.length < 8) return { err: 'كلمة السر 8 أحرف على الأقل.' };
        return SRV.rpc('admin_set_password', { p_user: u.id, p_pass: v.pass }).then(function () { return 'تغيّرت كلمة سر العميل'; }, function (e) { return { err: /admin_set_password|function/i.test(e.message) ? 'شغّل ملف schema5.sql بـ Supabase مرة وحدة.' : e.message }; });
      }, 'رقم الدخول: ' + (u.login_phone || u.phone));
    },
    toggleClientLogin: function (d) { var u = byId('users', d.uid); u.active = u.active === false; save(); render(); toast(u.active ? 'فُعّل دخول العميل' : 'أُوقف دخول العميل'); },
    delMove: function (d) { if (!confirm('حذف الحركة نهائياً من السجل؟ لا يمكن التراجع.')) return; db.moves = db.moves.filter(function (m) { return m.id !== d.id; }); save(); render(); toast('حُذفت الحركة'); },
    addDebt: function () {
      openForm('دين جديد', [{ k: 'dir', label: 'النوع', type: 'select', options: [['owe', 'دين عليّ'], ['owed', 'دين لي']] }, { k: 'party', label: 'الطرف', req: true }, { k: 'usd', label: 'المبلغ بالدولار', type: 'number', req: true }, { k: 'due', label: 'موعد الاستحقاق', type: 'date' }], function (v) {
        if (num(v.usd) <= 0) return { err: 'أدخل مبلغاً أكبر من صفر.' };
        db.debts.push({ id: uid(), dir: v.dir, party: v.party.trim(), usd: num(v.usd), due: v.due, settled: false }); return 'أُضيف الدين';
      });
    },
    settle: function (d) { if (!confirm('تسديد الدين؟')) return; byId('debts', d.id).settled = true; save(); render(); toast('تم التسديد'); },
    goal: function () { openForm('هدف الشهر', [{ k: 'goal', label: 'هدف الدخل بالدولار', type: 'number', value: db.settings.goal || '', wide: true }], function (v) { db.settings.goal = num(v.goal); return 'حُفظ الهدف'; }); },
    delPhoto: function () { me().photo = ''; save(); render(); },
    chPass: function () {
      openForm('تغيير كلمة السر', [{ k: 'p1', label: 'كلمة السر الجديدة', type: 'password', req: true }, { k: 'p2', label: 'تأكيدها', type: 'password', req: true }], function (v) {
        if (v.p1.length < 8) return { err: 'كلمة السر 8 أحرف على الأقل.' }; if (v.p1 !== v.p2) return { err: 'الكلمتان غير متطابقتين.' };
        if (ONLINE) return SRV.setPassword(v.p1).then(function () { return 'تغيّرت كلمة السر'; });
        var u = me(); return hash(v.p1, u.salt).then(function (hh) { u.pass = hh; return 'تغيّرت كلمة السر'; });
      });
    },
    backup: function () { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(db)], { type: 'application/json' })); a.download = 'shafq-backup-' + today() + '.json'; a.click(); }
  };
  function clientForm(c) {
    c = c || {};
    openForm(c.id ? 'تعديل العميل' : 'عميل جديد', [{ k: 'name', label: 'اسم العميل', req: true, value: c.name }, { k: 'kind', label: 'النوع', type: 'select', options: [['page', 'إدارة صفحات (عقد مستمر)'], ['project', 'مشروع']], value: c.kind || 'page' }, { k: 'value', label: 'قيمة العقد بالدولار', type: 'number', value: c.value }, { k: 'months', label: 'المدة بالأشهر', type: 'number', value: c.months }, { k: 'start_date', label: 'تاريخ البدء', type: 'date', value: c.start_date || today() }, { k: 'notes', label: 'ملاحظات', type: 'area', wide: true, value: c.notes }], function (v) {
      var o = { name: v.name.trim(), kind: v.kind, value: num(v.value), months: num(v.months), start_date: v.start_date, notes: v.notes.trim() };
      if (c.id) { Object.assign(c, o); db.tasks.forEach(function (t) { if (t.client_id === c.id) t.client_name = o.name; }); } else { o.id = uid(); o.roles = [{ role: '', user: '' }]; db.clients.push(o); }
      return 'حُفظ العميل';
    });
  }
  function linkTalent(u) {
    if (!u) return; var t = db.items.filter(function (x) { return x.kind === 'talent' && x.user_id === u.id; })[0];
    if (u.kind === 'employee') return;
    var o = { name: u.name, phone: u.phone || '', skills: u.title || '', shamcash: u.shamcash || '', user_id: u.id };
    if (t) Object.assign(t, o); else db.items.push(Object.assign({ id: uid(), kind: 'talent', status: 'اشتغل معنا', created: today(), account: '', city: '', rate: '', rating: '', notes: 'من الفريق' }, o));
  }
  function memberForm(u) {
    var edit = !!u; u = u || {};
    var fields = [{ k: 'name', label: 'الاسم', req: true, value: u.name }, { k: 'title', label: 'الاختصاصات', type: 'checks', options: MEDIA_SPECS, value: u.title, wide: true }, { k: 'gender', label: 'الجنس', type: 'select', options: [['m', 'ذكر'], ['f', 'أنثى']], value: u.gender || 'm' }, { k: 'phone', label: 'رقم الموبايل', type: 'tel', req: true, value: u.phone }, { k: 'kind', label: 'نوع العقد', type: 'select', options: [['freelancer', 'فريلانسر'], ['employee', 'موظف']], value: u.kind || 'freelancer' }, { k: 'contract', label: 'قيمة العقد بالدولار', type: 'number', value: u.contract }, { k: 'shamcash', label: 'حساب شام كاش', ph: 'رقم أو اسم الحساب', value: u.shamcash }, { k: 'pass', label: edit ? 'كلمة سر جديدة (اتركها فارغة للإبقاء)' : 'كلمة سر مؤقتة', type: 'password', req: !edit }];
    openForm(edit ? 'تعديل العضو' : 'عضو جديد', fields, function (v) {
      var ph = normPhone(v.phone); if (!ph) return { err: 'أدخل رقم موبايل صحيحاً.' };
      if (db.users.some(function (x) { return x.id !== u.id && (normPhone(x.phone) === ph || (!edit && normPhone(x.login_phone) === ph)); })) return { err: 'هذا الرقم مسجل لعضو آخر.' };
      if (v.pass && v.pass.length < 8) return { err: 'كلمة السر 8 أحرف على الأقل.' };
      var o = { name: v.name.trim(), title: (v.title || '').trim(), gender: v.gender, phone: v.phone.trim(), kind: v.kind, contract: num(v.contract), shamcash: (v.shamcash || '').trim() };
      if (ONLINE) {
        if (edit) { Object.assign(u, o); linkTalent(u); if (!v.pass) return 'حُفظ العضو'; return SRV.rpc('admin_set_password', { p_user: u.id, p_pass: v.pass }).then(function () { return 'حُفظ العضو وتغيّرت كلمة السر'; }, function (e) { return { err: /admin_set_password|function/i.test(e.message) ? 'لتغيير كلمة السر شغّل ملف schema5.sql بـ Supabase مرة وحدة.' : e.message }; }); }
        return SRV.createUser(v.phone, v.pass).then(function (id) {
          db.users.push(Object.assign({ id: id, role: 'member', active: true, login_phone: ph, email: '', city: '', insta: '', bio: '', photo: '' }, o)); linkTalent(byId('users', id)); return 'حُفظ العضو';
        });
      }
      var salt = u.salt || uid();
      return (v.pass ? hash(v.pass, salt) : Promise.resolve(u.pass)).then(function (hh) {
        var nu; if (edit) { Object.assign(u, o, { pass: hh, salt: salt }); nu = u; } else { nu = Object.assign({ id: uid(), role: 'member', active: true, pass: hh, salt: salt }, o); db.users.push(nu); }
        linkTalent(nu); return 'حُفظ العضو';
      });
    }, edit ? '' : 'العضو يدخل برقم موبايله وكلمة السر المؤقتة، ثم يغيّرها من ملفه.');
  }


  /* ---------- الأقسام العامة (مشاريع، درون، محتوى، فريلانس، مؤثرون، محتملون، طلبات، أوراق، معدات) ---------- */
  var mstate = { filter: {}, tag: {}, cal: '', stage: {}, pm: {}, teamSpec: '', pinfo: {}, pload: {} };
  var PSTEPS = ['تحضير', 'تصوير ومونتاج', 'مجدول', 'منشور'], POLD = { 'فكرة': 'تحضير', 'كتابة': 'تحضير', 'تصميم أو مونتاج': 'تصوير ومونتاج', 'موافقة العميل': 'تصوير ومونتاج' };
  var PNEXT = { 'تحضير': 'جاهز للتصوير', 'تصوير ومونتاج': 'جاهز، للجدولة', 'مجدول': 'نزل' };
  var CSTEPS = ['عم نحضّر', 'جاهز', 'نزل'];
  var PTAB = { 'تصوير ومونتاج': 'تصوير وتصميم' };
  function isReel(it) { return /ريل|فيديو/.test(it.type || ''); }
  function isReady(it) { return /جاهز/.test(it.type || '') || /^الريل الجاهز/.test(it.name || ''); }
  function pLabel(it, s) { return s === 'تصوير ومونتاج' ? (isReady(it) ? 'بالمونتاج' : isReel(it) ? 'بالتصوير والمونتاج' : 'بالتصميم') : s; }
  function pStage(it, s) { return s === 'تصوير ومونتاج' ? (isReady(it) ? 'مونتاج' : isReel(it) ? 'تصوير ومونتاج' : 'تصميم') : s; }
  function pNext(it, s) { if (s === 'تحضير') return isReady(it) ? 'جاهز للمونتاج' : isReel(it) ? 'جاهز للتصوير' : 'تم التحضير، للتصميم'; if (s === 'تصوير ومونتاج') return 'جاهز، للجدولة'; return PNEXT[s]; }
  function pst(s) { return POLD[s] || (PSTEPS.indexOf(s) >= 0 ? s : 'تحضير'); }
  function cstep(s) { s = pst(s); return s === 'منشور' ? 2 : s === 'مجدول' ? 1 : 0; }
  function track(i, labels, mini) { return '<ol class="track' + (mini ? ' mini' : '') + '" aria-label="المرحلة: ' + h(labels[i]) + '">' + labels.map(function (l, j) { return '<li class="' + (j < i ? 'done' : j === i ? 'cur' : '') + '"><i></i><span>' + h(l) + '</span></li>'; }).join('') + '</ol>'; }
  function safeLink(u) { u = String(u || '').trim(); return /^https:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; }
  function flowView(key, m, all, opt) {
    var cnt = {}; PSTEPS.forEach(function (s) { cnt[s] = 0; }); all.forEach(function (x) { cnt[pst(x.status)]++; });
    var cur = mstate.stage[key] || PSTEPS.filter(function (s) { return s !== 'منشور' && cnt[s]; })[0] || PSTEPS[0];
    var c = '<nav class="ftabs" role="tablist" aria-label="المراحل">' + PSTEPS.map(function (s) { var on = s === cur; return '<button type="button" role="tab" aria-selected="' + on + '" class="' + (on ? 'on' : '') + '" data-act="fstage" data-mod="' + key + '" data-v="' + h(s) + '"><span>' + h(PTAB[s] || s) + '</span><b>' + cnt[s] + '</b></button>'; }).join('') + '</nav>';
    var list = all.filter(function (x) { return pst(x.status) === cur; }).sort(function (a, b) { return ((a.date || '9') + (a.time || '')) < ((b.date || '9') + (b.time || '')) ? -1 : 1; });
    if (cur === 'منشور') list.reverse();
    c += list.length ? '<div class="fgrid">' + list.map(function (x) { return flowCard(x, opt); }).join('') + '</div>' : '<p class="empty">ما في شي بهالمرحلة.</p>';
    return c;
  }
  function flowCard(it, opt) {
    var s = pst(it.status), i = PSTEPS.indexOf(s), nx = pNext(it, s), meta = [it.type, it.client_id && !(opt && opt.noClient) ? clientName(it.client_id) : '', it.date ? dateAr(it.date) + (it.time ? ' ' + it.time : '') : ''].filter(Boolean).join(' · ');
    var note = s === 'موافقة العميل' ? '<p class="fnote wait">بانتظار رد العميل' + (it.sent_at ? ' من ' + h(dateAr(it.sent_at)) : '') + '</p>' : (it.review_note && s === 'تصوير ومونتاج' ? '<p class="fnote"><b>ملاحظة العميل:</b> ' + h(it.review_note) + '</p>' : '');
    return '<article class="fcard"><b class="ft">' + h(it.name) + '</b><span class="mu">' + h(meta) + '</span>' + track(i, PSTEPS, true) + note +
      (s === 'تصوير ومونتاج' ? '<span class="fnote">' + h(pLabel(it, s)) + '</span>' : '') + (nx ? btn(nx, 'pstep', { id: it.id, d: 1 }, 'pri fgo') : '') +
      '<div class="flinks">' + (i > 0 ? btn('رجوع خطوة', 'pstep', { id: it.id, d: -1 }, 'lnk') : '') + btn('تعديل', 'editItem', { mod: 'content', id: it.id }, 'lnk') + btn('حذف', 'delItem', { id: it.id }, 'lnk') + '</div></article>';
  }
  function reviewCard(p) {
    var link = safeLink(p.preview);
    return '<article class="rcard"><div><b>' + h(p.name || 'منشور') + '</b><span class="mu">' + h([p.type, p.date ? 'ينزل ' + dateAr(p.date) : ''].filter(Boolean).join(' · ')) + '</span></div>' +
      (link ? '<a class="btn rprev" target="_blank" rel="noopener noreferrer" href="' + h(link) + '">شوف المعاينة</a>' : '') + (p.caption ? '<p class="rcap">' + h(p.caption) + '</p>' : '') +
      '<div class="racts">' + btn('موافق', 'review', { id: p.id }, 'pri') + btn('بدي تعديل', 'reviewEdit', { id: p.id }) + '</div></article>';
  }
  function portalPost(id) { var d = ONLINE ? pstate.data : portalLocal(me().client_id); return d ? (d.posts || []).filter(function (p) { return p.id === id; })[0] : null; }
  function clientReview(id, ok, note) {
    var p = portalPost(id) || {}, msg = ok ? 'وصلت موافقتك، شكراً' : 'وصلت ملاحظتك، رح نعدّل ونرجعلك';
    if (!ONLINE) { var it = byId('items', id); if (it) { it.status = ok ? 'مجدول' : 'تصوير ومونتاج'; it.review_note = note || ''; save(); } render(); if (ok) toast(msg); return msg; }
    return SRV.rpc('client_review', { p_id: id, p_ok: ok, p_note: note || null }).then(function () {
      var cname = pstate.data && pstate.data.client ? pstate.data.client.name : me().name;
      SRV.notify([{ to: 'managers', title: (ok ? 'وافق ' : 'طلب تعديل من ') + cname, body: '«' + (p.name || '') + '»' + (note ? ' · ' + note : ''), tag: 'review-' + id, url: './#/m/content' }]);
      pstate.data = null; render(); if (ok) toast(msg); return msg;
    }, function (e) { var m = /client_review|function/i.test(e.message || '') ? 'الموافقة لسا ما تفعّلت على السيرفر.' : 'ما قدرنا نبعت، جرّب مرة تانية.'; if (ok) { toast(m); return; } return { err: m }; });
  }

  function items(kind) { return db.items.filter(function (x) { return x.kind === kind; }); }
  function itemMoney(id) { var mv = db.moves.filter(function (m) { return live(m) && m.item_id === id; }); return { inc: sum(mv.filter(function (m) { return m.dir === 'in'; }), function (m) { return m.usd; }), out: sum(mv.filter(function (m) { return m.dir === 'out'; }), function (m) { return m.usd; }) }; }
  function itemOpts() { return [['', 'غير مربوط']].concat(db.items.filter(function (x) { return (x.kind === 'project' || x.kind === 'drone') && x.status !== 'منتهٍ'; }).map(function (x) { return [x.id, (x.kind === 'drone' ? 'درون: ' : 'مشروع: ') + x.name]; })); }
  function tags(v) { return String(v || '').split(/[,،·]/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function L(v) { return '<span class="ltr">' + h(v) + '</span>'; }
  function sel(list) { return list.map(function (x) { return [x, x]; }); }
  function waTo(phone, msg) { return 'https://wa.me/' + waPhone(phone) + '?text=' + encodeURIComponent(msg); }
  var CODES = [['INV', 'فاتورة'], ['QUO', 'عرض سعر'], ['RCV', 'وصل قبض'], ['PAY', 'وصل دفع'], ['DLV', 'وصل استلام مواد'], ['LOG', 'سجل فرز الداتا'], ['FRL', 'عقد فريلانس'], ['EMP', 'عقد موظف'], ['CLT', 'عقد عميل']];
  function nextNo(code, date) {
    var y = (date || today()).slice(0, 4), pre = code + '-' + y + '-', mx = 0;
    items('paper').forEach(function (p) { if (String(p.no || '').indexOf(pre) === 0) mx = Math.max(mx, parseInt(p.no.slice(pre.length), 10) || 0); });
    return pre + ('00' + (mx + 1)).slice(-3);
  }
  function moneyRows(it) { var m = itemMoney(it.id), price = num(it.price); return [['السعر', L(usd(price))], ['المقبوض', L(usd(m.inc))], ['المتبقي على العميل', L(usd(Math.max(0, price - m.inc)))], ['المصاريف والأجور', L(usd(m.out))], ['الربح حتى الآن', L(usd(m.inc - m.out))]]; }
  var MODS = {
    projects: { title: 'المشاريع', sub: 'معارض، مؤتمرات، وثائقيات، وأعمال صغيرة', kind: 'project', add: '+ مشروع جديد',
      statuses: ['قادم', 'تصوير', 'فرز داتا', 'مونتاج', 'تسليم', 'منتهٍ'],
      fields: function () { return [{ k: 'name', label: 'اسم المشروع', req: true }, { k: 'type', label: 'النوع', type: 'select', options: sel(['مؤتمر', 'معرض', 'فيلم وثائقي', 'عرس أو فعالية', 'عمل صغير', 'آخر']) }, { k: 'client_id', label: 'العميل', type: 'select', options: clientOpts() }, { k: 'party', label: 'اسم الجهة (إن لم يكن عميلاً مسجلاً)' }, { k: 'date', label: 'التاريخ', type: 'date' }, { k: 'place', label: 'المكان' }, { k: 'team', label: 'الفريق المشارك' }, { k: 'price', label: 'السعر بالدولار', type: 'number' }, { k: 'notes', label: 'ملاحظات', type: 'area', wide: true }]; },
      summary: function (it) { return h(it.status) + (it.date ? ' · ' + h(dateAr(it.date)) : ''); },
      rows: function (it) { return [['النوع', h(it.type)], ['العميل', h(it.client_id ? clientName(it.client_id) : (it.party || 'غير محدد'))], ['المكان', h(it.place || 'غير محدد')], ['الفريق', h(it.team || 'لم يُحدد')]].concat(moneyRows(it)); },
      acts: function (it) { return btn('+ حركة مالية', 'addMove', { item: it.id, client: it.client_id || '' }, 'sm'); },
      kpis: function (l) { var act = l.filter(function (x) { return x.status !== 'منتهٍ' && x.status !== 'قادم'; }), due = sum(l, function (x) { return Math.max(0, num(x.price) - itemMoney(x.id).inc); }), mon = monthOf(today()); var prof = sum(db.moves.filter(function (m) { return live(m) && m.item_id && monthOf(m.date) === mon && (byId('items', m.item_id) || {}).kind === 'project'; }), function (m) { return m.dir === 'in' ? m.usd : -m.usd; }); return kpi('جارية', String(act.length)) + kpi('قادمة', String(l.filter(function (x) { return x.status === 'قادم'; }).length)) + kpi('بانتظار الدفع', usd(due)) + kpi('ربح هذا الشهر', usd(prof), true); } },
    drone: { title: 'الدرون', sub: 'طلبات الدرون وجدول الطيران', kind: 'drone', add: '+ طلب درون',
      statuses: ['طلب جديد', 'تسعير وتأكيد', 'التصريح', 'موعد الطيران', 'تصوير', 'مونتاج', 'تسليم ودفع', 'منتهٍ'],
      fields: function () { return [{ k: 'name', label: 'اسم العميل', req: true }, { k: 'phone', label: 'رقم العميل', type: 'tel' }, { k: 'pack', label: 'الباقة', type: 'select', options: sel(['صور جوية', 'فيديو قصير', 'تصوير لوكيشن كامل']) }, { k: 'area', label: 'المنطقة' }, { k: 'date', label: 'تاريخ الطيران', type: 'date' }, { k: 'time', label: 'الساعة', type: 'time' }, { k: 'pilot', label: 'الطيار', type: 'select', options: memberOpts('غير محدد') }, { k: 'model', label: 'الدرون' }, { k: 'permit', label: 'التصريح', type: 'select', options: sel(['لا يلزم', 'بانتظار الموافقة', 'جاهز']) }, { k: 'price', label: 'السعر بالدولار', type: 'number' }, { k: 'notes', label: 'ملاحظات', type: 'area', wide: true }]; },
      summary: function (it) { return h(it.status) + ' · ' + h(it.pack || '') + (it.date ? ' · ' + h(dateAr(it.date)) + (it.time ? ' ' + h(it.time) : '') : ''); },
      rows: function (it) { return [['المنطقة', h(it.area || 'غير محددة')], ['الطيار', h(it.pilot ? userName(it.pilot) : 'غير محدد')], ['الدرون', h(it.model || 'غير محددة')], ['التصريح', h(it.permit || 'لا يلزم')]].concat(moneyRows(it)); },
      acts: function (it) { return (it.phone ? '<a class="btn sm" target="_blank" rel="noopener" href="' + h(waTo(it.phone, 'السلام عليكم ورحمة الله، معكم شفق ميديا بخصوص طلب تصوير الدرون.')) + '">واتساب العميل</a>' : '') + btn('+ حركة مالية', 'addMove', { item: it.id }, 'sm'); },
      kpis: function (l) { var mon = monthOf(today()), t = today(), ml = l.filter(function (x) { return monthOf(x.created || x.date || '') === mon; }); var inc = sum(db.moves.filter(function (m) { return live(m) && m.dir === 'in' && monthOf(m.date) === mon && m.item_id && (byId('items', m.item_id) || {}).kind === 'drone'; }), function (m) { return m.usd; }); return kpi('طلبات الشهر', String(ml.length), true, 'الهدف 100') + kpi('طلعات اليوم', String(l.filter(function (x) { return x.date === t && x.status !== 'منتهٍ'; }).length)) + kpi('بانتظار التصريح', String(l.filter(function (x) { return x.permit === 'بانتظار الموافقة' && x.status !== 'منتهٍ'; }).length)) + kpi('دخل الدرون', usd(inc), false, 'هذا الشهر'); } },
    content: { title: 'خط إنتاج المحتوى', sub: 'كل منشور من الفكرة إلى النشر', kind: 'post', add: '+ منشور جديد', flow: true,
      statuses: PSTEPS,
      fields: function () { return [{ k: 'name', label: 'عنوان المنشور', req: true }, { k: 'client_id', label: 'العميل', type: 'select', options: clientOpts() }, { k: 'type', label: 'النوع', type: 'select', options: sel(['بوست', 'ريل', 'ريل جاهز', 'كاروسيل', 'ستوري', 'منشور الجمعة']) }, { k: 'owner', label: 'المسؤول', type: 'select', options: memberOpts('غير محدد') }, { k: 'date', label: 'موعد النشر', type: 'date' }, { k: 'time', label: 'ساعة النشر', type: 'time' }, { k: 'preview', label: 'رابط المعاينة للعميل (درايف أو صورة)', type: 'url', wide: true, ph: 'https://' }, { k: 'caption', label: 'الكابشن', type: 'area', wide: true }, { k: 'notes', label: 'ملاحظات داخلية (ما بيشوفها العميل)', type: 'area', wide: true }]; },
      summary: function (it) { return h(it.type || '') + ' · ' + h(it.client_id ? clientName(it.client_id) : 'عام') + (it.date ? ' · ' + h(dateAr(it.date)) : ''); },
      kpis: function (l) { return kpi('قيد العمل', String(l.filter(function (x) { return x.status !== 'منشور'; }).length)) + kpi('بانتظار موافقة العميل', String(l.filter(function (x) { return x.status === 'موافقة العميل'; }).length), true) + kpi('مجدول', String(l.filter(function (x) { return x.status === 'مجدول'; }).length)) + kpi('نُشر هذا الشهر', String(l.filter(function (x) { return x.status === 'منشور' && monthOf(x.date || '') === monthOf(today()); }).length)); } },
    talent: { title: 'فريلانس', sub: 'قاعدة بيانات الفريلانسرز للمشاريع القادمة', kind: 'talent', add: '+ فريلانسر', tagField: 'skills', tagLabel: 'الاختصاص',
      statuses: ['محفوظ', 'تواصلت معه', 'اشتغل معنا'],
      fields: function () { return [{ k: 'name', label: 'الاسم', req: true }, { k: 'account', label: 'حساب إنستغرام', ph: '@username' }, { k: 'skills', label: 'الاختصاصات', type: 'checks', options: MEDIA_SPECS, wide: true }, { k: 'shamcash', label: 'حساب شام كاش', ph: 'رقم أو اسم الحساب' }, { k: 'city', label: 'المدينة' }, { k: 'phone', label: 'رقم التواصل', type: 'tel' }, { k: 'rate', label: 'السعر التقريبي' }, { k: 'rating', label: 'تقييمي', type: 'select', options: [['', 'بدون']].concat(sel(['5', '4', '3', '2', '1'])) }, { k: 'notes', label: 'ملاحظات', type: 'area', wide: true }]; },
      summary: function (it) { return h(tags(it.skills).join(' · ') || 'بدون اختصاص') + ' · ' + h(it.status); },
      rows: function (it) { return [['الحساب', L(it.account || 'غير محدد')], ['شام كاش', it.shamcash ? '<span class="ltr">' + h(it.shamcash) + '</span>' : 'غير محدد'], ['المدينة', h(it.city || 'غير مذكورة')], ['السعر', h(it.rate || 'غير محدد')], ['تقييمي', it.rating ? h(it.rating) + ' من 5' : 'بدون']]; },
      acts: function (it) { return personActs(it); },
      kpis: function (l) { return kpi('محفوظون', String(l.length)) + kpi('تواصلت معهم', String(l.filter(function (x) { return x.status === 'تواصلت معه'; }).length)) + kpi('اشتغلوا معنا', String(l.filter(function (x) { return x.status === 'اشتغل معنا'; }).length), true) + kpi('اختصاصات', String(allTags(l, 'skills').length)); } },
    influencers: { title: 'بنك المؤثرين', sub: 'بلوجرز مفروزون حسب مجال المحتوى', kind: 'influencer', add: '+ مؤثر', tagField: 'niches', tagLabel: 'المجال',
      statuses: ['محفوظ', 'تواصلت معه', 'اشتغل معنا'],
      fields: function () { return [{ k: 'name', label: 'الاسم', req: true }, { k: 'account', label: 'الحساب', ph: '@username' }, { k: 'platform', label: 'المنصة', type: 'select', options: sel(['إنستغرام', 'تيك توك', 'يوتيوب', 'فيسبوك']) }, { k: 'niches', label: 'المجالات (افصل بفاصلة)', ph: 'طبخ ومطاعم، لايف ستايل' }, { k: 'city', label: 'المدينة' }, { k: 'followers', label: 'عدد المتابعين', type: 'number' }, { k: 'reel', label: 'سعر الريل' }, { k: 'story', label: 'سعر الستوري' }, { k: 'phone', label: 'رقم التواصل أو مدير الأعمال', type: 'tel' }, { k: 'fits', label: 'مناسب لمعايير شفق', type: 'select', options: sel(['نعم', 'لا']) }, { k: 'rating', label: 'تقييمي', type: 'select', options: [['', 'بدون']].concat(sel(['5', '4', '3', '2', '1'])) }, { k: 'notes', label: 'ملاحظات ونتائج الحملات', type: 'area', wide: true }]; },
      summary: function (it) { return h(tags(it.niches).join(' · ') || 'بدون مجال') + (it.fits === 'لا' ? ' · غير مناسب' : ''); },
      rows: function (it) { return [['الحساب', L(it.account || 'غير محدد')], ['المنصة', h(it.platform || '')], ['المدينة', h(it.city || 'غير مذكورة')], ['المتابعون', it.followers ? L(num(it.followers).toLocaleString('en-US')) : 'غير محدد'], ['سعر الريل', h(it.reel || 'غير محدد')], ['سعر الستوري', h(it.story || 'غير محدد')], ['مناسب لمعايير شفق', h(it.fits || 'نعم')]]; },
      acts: function (it) { return personActs(it); },
      kpis: function (l) { return kpi('مؤثرون محفوظون', String(l.length)) + kpi('مجالات', String(allTags(l, 'niches').length)) + kpi('اشتغلوا معنا', String(l.filter(function (x) { return x.status === 'اشتغل معنا'; }).length), true) + kpi('غير مناسبين', String(l.filter(function (x) { return x.fits === 'لا'; }).length)); } },
    leads: { title: 'العملاء المحتملون', sub: 'من أُرسل له عرض، من ردّ، ومن يحتاج متابعة', kind: 'lead', add: '+ عميل محتمل', board: true,
      statuses: ['جديد', 'تم التواصل', 'أُرسل عرض', 'تفاوض', 'صار عميلاً', 'ضاع'],
      fields: function () { return [{ k: 'name', label: 'الاسم أو الجهة', req: true }, { k: 'activity', label: 'النشاط', ph: 'مطعم، عيادة، محل...' }, { k: 'phone', label: 'رقم التواصل', type: 'tel' }, { k: 'source', label: 'المصدر', type: 'select', options: sel(['إحالة من عميل', 'نموذج الموقع', 'إنستغرام', 'واتساب', 'معرفة شخصية', 'آخر']) }, { k: 'ref', label: 'من دلّه علينا' }, { k: 'value', label: 'قيمة العرض بالدولار', type: 'number' }, { k: 'next', label: 'موعد المتابعة القادمة', type: 'date' }, { k: 'notes', label: 'ملاحظات', type: 'area', wide: true }]; },
      summary: function (it) { return h(it.activity || '') + (it.value ? ' · ' + usd(num(it.value)) : '') + (it.next ? ' · متابعة ' + h(dateAr(it.next)) : ''); },
      acts: function (it) { return (it.phone ? '<a class="btn sm" target="_blank" rel="noopener" href="' + h(waTo(it.phone, 'السلام عليكم ورحمة الله، معكم شفق ميديا. حبيت أتابع معكم بخصوص العرض.')) + '">واتساب</a>' : '') + (it.status !== 'صار عميلاً' ? btn('حوّله إلى عميل', 'lead2client', { id: it.id }, 'sm') : ''); },
      kpis: function (l) { var op = l.filter(function (x) { return x.status !== 'صار عميلاً' && x.status !== 'ضاع'; }), t = today(); return kpi('في المتابعة', String(op.length)) + kpi('عروض مُرسلة', String(l.filter(function (x) { return x.status === 'أُرسل عرض'; }).length)) + kpi('يحتاجون متابعة', String(op.filter(function (x) { return x.next && x.next <= t; }).length), true) + kpi('قيمة العروض', usd(sum(op, function (x) { return num(x.value); }))); } },
    inbox: { title: 'صندوق الطلبات', sub: 'كل الطلبات الواردة في قائمة واحدة', kind: 'request', add: '+ طلب سريع',
      statuses: ['جديد', 'تم الرد', 'بانتظار العميل', 'حُجز', 'ضاع'],
      fields: function () { return [{ k: 'name', label: 'الاسم', req: true }, { k: 'phone', label: 'الرقم', type: 'tel' }, { k: 'service', label: 'الخدمة المطلوبة', type: 'select', options: sel(['درون', 'إدارة صفحة', 'تغطية فعالية', 'فيلم وثائقي', 'أخرى']) }, { k: 'source', label: 'المصدر', type: 'select', options: sel(['واتساب', 'إنستغرام', 'نموذج الموقع', 'اتصال', 'إحالة']) }, { k: 'date', label: 'تاريخ الطلب', type: 'date', def: function () { return today(); } }, { k: 'owner', label: 'من يتابعه', type: 'select', options: memberOpts('غير محدد') }, { k: 'lost', label: 'سبب الضياع (إن ضاع)', type: 'select', options: [['', 'لا ينطبق']].concat(sel(['السعر', 'التأخر في الرد', 'الموعد', 'آخر'])) }, { k: 'notes', label: 'ملاحظات', type: 'area', wide: true }]; },
      summary: function (it) { return h(it.service || '') + ' · ' + h(it.source || '') + ' · ' + h(it.status); },
      rows: function (it) { return [['الرقم', L(it.phone || 'غير محدد')], ['تاريخ الطلب', it.date ? h(dateAr(it.date)) : 'غير محدد'], ['يتابعه', h(it.owner ? userName(it.owner) : 'غير محدد')], ['سبب الضياع', h(it.lost || 'لا ينطبق')]]; },
      acts: function (it) { return it.phone ? '<a class="btn sm" target="_blank" rel="noopener" href="' + h(waTo(it.phone, 'السلام عليكم ورحمة الله، أهلاً بكم في شفق ميديا. وصلنا طلبكم بخصوص ' + (it.service || 'خدماتنا') + '، ويسعدنا خدمتكم.')) + '">رد جاهز · واتساب</a>' : ''; },
      kpis: function (l) { var mon = monthOf(today()), ml = l.filter(function (x) { return monthOf(x.date || '') === mon; }), bk = ml.filter(function (x) { return x.status === 'حُجز'; }).length; return kpi('لم يُرد عليها', String(l.filter(function (x) { return x.status === 'جديد'; }).length), true) + kpi('بانتظار العميل', String(l.filter(function (x) { return x.status === 'بانتظار العميل'; }).length)) + kpi('حُجز هذا الشهر', String(bk)) + kpi('نسبة التحويل', (ml.length ? Math.round(bk / ml.length * 100) : 0) + '%', false, 'من ' + ml.length + ' طلب'); } },
    papers: { title: 'الأوراق', sub: 'كل ورقة لها رمز ورقم · لا حذف: الورقة الخطأ تُلغى', kind: 'paper', add: '+ ورقة جديدة', noEdit: true, noDelete: true,
      statuses: ['سارية', 'ملغاة'],
      fields: function () { return [{ k: 'code', label: 'نوع الورقة', type: 'select', options: CODES.map(function (c) { return [c[0], c[1] + ' (' + c[0] + ')']; }) }, { k: 'name', label: 'الطرف الثاني', req: true }, { k: 'amount', label: 'المبلغ', type: 'number' }, { k: 'cur', label: 'العملة', type: 'select', options: [['USD', 'دولار'], ['SYP', 'ليرة سورية']] }, { k: 'date', label: 'التاريخ', type: 'date', def: function () { return today(); } }, { k: 'notes', label: 'البيان', type: 'area', wide: true }]; },
      title_: function (it) { return (it.no || '') + ' · ' + it.name; },
      summary: function (it) { var c = CODES.filter(function (x) { return x[0] === it.code; })[0]; return h(c ? c[1] : it.code) + ' · ' + h(it.status) + (it.date ? ' · ' + h(dateAr(it.date)) : ''); },
      rows: function (it) { return [['الرقم', L(it.no)], ['المبلغ', it.amount ? (it.cur === 'SYP' ? h(syp(num(it.amount))) : L(usd(num(it.amount)))) : 'بدون مبلغ'], ['البيان', h(it.notes || '')]]; },
      acts: function (it) { return it.status === 'سارية' ? btn('إلغاء الورقة', 'voidPaper', { id: it.id }, 'sm') : ''; },
      kpis: function (l) { var mon = monthOf(today()); return kpi('أوراق هذا الشهر', String(l.filter(function (x) { return monthOf(x.date || '') === mon; }).length), true) + kpi('سارية', String(l.filter(function (x) { return x.status === 'سارية'; }).length)) + kpi('ملغاة', String(l.filter(function (x) { return x.status === 'ملغاة'; }).length)) + kpi('فواتير', String(l.filter(function (x) { return x.code === 'INV'; }).length)); } },
    gear: { title: 'المعدات', sub: 'معدات مستأجرة: من أين، بكم، لأي مشروع، ومتى تُعاد', kind: 'gear', add: '+ استئجار قطعة', tagField: 'cat', tagLabel: 'التصنيف',
      statuses: ['مستأجرة', 'أُعيدت'],
      fields: function () { return [{ k: 'name', label: 'اسم القطعة', req: true }, { k: 'cat', label: 'التصنيف', type: 'select', options: sel(['كاميرات', 'عدسات', 'درونات', 'جيمبال', 'ترايبود', 'إضاءة', 'صوت', 'بطاريات', 'تخزين', 'شاشات', 'إكسسوارات', 'شنط']) }, { k: 'model', label: 'الموديل' }, { k: 'shop', label: 'محل التأجير' }, { k: 'phone', label: 'هاتف المحل', type: 'tel' }, { k: 'cost', label: 'كلفة الإيجار الكلية بالدولار', type: 'number' }, { k: 'from', label: 'من تاريخ', type: 'date', def: function () { return today(); } }, { k: 'to', label: 'موعد الإعادة', type: 'date' }, { k: 'holder', label: 'مع من', type: 'select', options: memberOpts('غير محدد') }, { k: 'item', label: 'تُحسب على', type: 'select', options: itemOpts() }, { k: 'notes', label: 'ملاحظات', type: 'area', wide: true }]; },
      summary: function (it) { return h(it.cat || '') + ' · ' + h(it.status) + (it.to ? ' · تُعاد ' + h(dateAr(it.to)) : ''); },
      rows: function (it) { var ref = byId('items', it.item); return [['الموديل', h(it.model || 'غير محدد')], ['محل التأجير', h(it.shop || 'غير محدد') + (it.phone ? ' · ' + L(it.phone) : '')], ['الكلفة', L(usd(num(it.cost)))], ['المدة', (it.from ? h(dateAr(it.from)) : '؟') + ' إلى ' + (it.to ? h(dateAr(it.to)) : '؟')], ['مع من', h(it.holder ? userName(it.holder) : 'غير محدد')], ['تُحسب على', h(ref ? ref.name : 'غير مربوطة')]]; },
      kpis: function (l) { var t = today(), out = l.filter(function (x) { return x.status === 'مستأجرة'; }), mon = monthOf(t); return kpi('مستأجرة الآن', String(out.length), true) + kpi('تُعاد اليوم', String(out.filter(function (x) { return x.to === t; }).length)) + kpi('متأخرة عن الإعادة', String(out.filter(function (x) { return x.to && x.to < t; }).length)) + kpi('كلفة الإيجار', usd(sum(l.filter(function (x) { return monthOf(x.from || '') === mon; }), function (x) { return num(x.cost); })), false, 'هذا الشهر'); } }
  };
  function allTags(l, f) { var o = {}; l.forEach(function (x) { tags(x[f]).forEach(function (t) { o[t] = 1; }); }); return Object.keys(o); }
  function personActs(it) { var acc = String(it.account || '').replace(/^@/, '').trim(); return (acc ? '<a class="btn sm" target="_blank" rel="noopener" href="https://instagram.com/' + encodeURIComponent(acc) + '">فتح الحساب</a>' : '') + (it.phone ? '<a class="btn sm" target="_blank" rel="noopener" href="' + h(waTo(it.phone, 'السلام عليكم ورحمة الله، معك عبد الرحمن من شفق ميديا. شفت شغلك وحبيت نتعاون.')) + '">واتساب</a>' : ''); }
  function chipRow(label, list, cur, act, mod) { return '<div class="chips" role="group" aria-label="' + h(label) + '">' + list.map(function (x) { var on = (cur || '') === x[0]; return '<button type="button" class="btn sm' + (on ? ' pri' : '') + '" aria-pressed="' + on + '" data-act="' + act + '" data-mod="' + mod + '" data-v="' + h(x[0]) + '">' + h(x[1]) + '</button>'; }).join('') + '</div>'; }
  function statusSel(m, it) { return '<select aria-label="الحالة" data-chg="istatus" data-id="' + h(it.id) + '" style="min-height:36px;background:var(--p2);border:1px solid var(--ln);border-radius:12px;padding:0 8px;font-size:13px">' + m.statuses.map(function (s) { return '<option' + (s === it.status ? ' selected' : '') + '>' + h(s) + '</option>'; }).join('') + '</select>'; }
  function itemActs(key, m, it) { return '<div class="acts">' + (m.noEdit && it.status ? '' : statusSel(m, it)) + (m.acts ? m.acts(it) : '') + (m.noEdit ? '' : btn('تعديل', 'editItem', { mod: key, id: it.id }, 'sm')) + (m.noDelete ? '' : btn('حذف', 'delItem', { id: it.id }, 'sm')) + '</div>'; }
  function vMod(key) {
    var m = MODS[key], all = items(m.kind), f = mstate.filter[key] || '', tg = mstate.tag[key] || '';
    var c = head(m.title, m.sub, (key === 'content' ? btn('تحميل قالب إكسل', 'xlTemplate') + '<label class="btn" for="xlfile">رفع ملف إكسل</label><input id="xlfile" type="file" accept=".xlsx" data-chg="xlfile" hidden>' : '') + btn(m.add, 'addItem', { mod: key }, 'pri'));
    if (ONLINE && SRV.itemsMissing && SRV.itemsMissing()) c += '<p class="warn">هذا القسم يحتاج تحديث قاعدة البيانات: شغّل ملف schema2.sql في Supabase (SQL Editor) مرة واحدة ثم أعد فتح التطبيق.</p>';
    if (m.flow) return shell(c + flowView(key, m, all));
    c += '<div class="kpis">' + m.kpis(all) + '</div>';
    var list = all.filter(function (x) { return (!f || x.status === f) && (!tg || tags(x[m.tagField]).indexOf(tg) >= 0); });
    if (m.tagField) c += chipRow(m.tagLabel, [['', 'الكل']].concat(allTags(all, m.tagField).map(function (t) { return [t, t]; })), tg, 'mtag', key);
    if (m.board) {
      c += '<div class="tbl"><div class="board" style="grid-template-columns:repeat(' + m.statuses.length + ',minmax(170px,1fr));min-width:' + (m.statuses.length * 180) + 'px">' + m.statuses.map(function (s) {
        var col = list.filter(function (x) { return x.status === s; });
        return '<div class="col"><span class="colh">' + h(s) + ' · ' + col.length + '</span>' + col.map(function (it) { return '<div class="card"><b>' + h(it.name) + '</b><span class="mu">' + m.summary(it) + '</span>' + itemActs(key, m, it) + '</div>'; }).join('') + '</div>';
      }).join('') + '</div></div>';
    } else {
      c += chipRow('الحالة', [['', 'الكل']].concat(m.statuses.map(function (s) { return [s, s]; })), f, 'mfilter', key);
      c += list.length ? '<div class="tiles">' + list.map(function (it) { return tile(m.title_ ? m.title_(it) : it.name, m.summary(it), rows(m.rows(it)) + (it.notes && !m.noEdit ? '<p class="mu">' + h(it.notes) + '</p>' : '') + itemActs(key, m, it)); }).join('') + '</div>' : '<p class="empty">لا شيء هنا بعد. أضف من الزر في الأعلى.</p>';
    }
    if (key === 'talent' || key === 'influencers') c += '<p class="mu">الإضافة يدوية الآن. التعبئة التلقائية من سكرين شوت تحتاج ربط خدمة ذكاء اصطناعي، وهي خطوة قادمة.</p>';
    if (key === 'papers') c += '<p class="mu">هذا سجل الأوراق وترقيمها. إخراج الورقة بتصميم شفق للطباعة خطوة قادمة.</p>';
    return shell(c);
  }
  function itemForm(key, it, preset) {
    var m = MODS[key], edit = !!it; it = it || {};
    var fields = m.fields().map(function (f) { return Object.assign({}, f, { value: it[f.k] != null && it[f.k] !== '' ? it[f.k] : preset && preset[f.k] != null ? preset[f.k] : (f.def ? f.def() : (f.type === 'select' && f.options.length ? f.options[0][0] : '')) }); });
    openForm(edit ? 'تعديل' : m.add.replace('+ ', ''), fields, function (v) {
      var o = {}; m.fields().forEach(function (f) { o[f.k] = f.type === 'number' ? num(v[f.k]) : String(v[f.k] || '').trim(); });
      if (!o.name) return { err: 'الاسم مطلوب.' };
      if (edit) Object.assign(it, o);
      else { o.id = uid(); o.kind = m.kind; o.status = m.statuses[0]; o.created = today(); if (m.kind === 'paper') o.no = nextNo(o.code, o.date); db.items.push(o); }
      return 'تم الحفظ';
    });
  }
  Object.assign(acts, {
    addItem: function (d) { itemForm(d.mod, null); },
    editItem: function (d) { itemForm(d.mod, byId('items', d.id)); },
    delItem: function (d) { if (!confirm('حذف نهائي؟')) return; db.items = db.items.filter(function (x) { return x.id !== d.id; }); db.moves.forEach(function (m) { if (m.item_id === d.id) m.item_id = ''; }); save(); render(); },
    voidPaper: function (d) { if (!confirm('إلغاء الورقة؟ تبقى في السجل برقمها.')) return; byId('items', d.id).status = 'ملغاة'; save(); render(); toast('أُلغيت الورقة'); },
    mfilter: function (d) { mstate.filter[d.mod] = d.v; render(); },
    mtag: function (d) { mstate.tag[d.mod] = d.v; render(); },
    fstage: function (d) { mstate.stage[d.mod] = d.v; render(); },
    pstep: function (d) {
      var it = byId('items', d.id); if (!it) return;
      var s = pst(it.status), fw = +d.d > 0, i = PSTEPS.indexOf(s) + (fw ? 1 : -1); if (i < 0 || i >= PSTEPS.length) return;
      var to = PSTEPS[i]; it.status = to;
      save(); render(); toast('صار: ' + pLabel(it, to));
      if (fw && it.client_id && to === 'منشور') notify([{ to: { client: it.client_id }, title: 'نزل منشور جديد', body: '«' + (it.name || '') + '»' + (it.type ? ' · ' + it.type : ''), tag: 'post' }]);
    },
    planMake: function (d) { makePlan(d.id); },
    planCopy: function (d) { var u = d.u; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { toast('انْسخ الرابط'); }, function () { prompt('انسخ الرابط:', u); }); },
    planToggle: function (d) {
      var pi = mstate.pinfo[d.id]; if (!pi) return; var on = !pi.active;
      if (!on && !confirm('توقف رابط الخطة؟ العميل وأي حدا معه الرابط ما رح يقدر يفتحها.')) return;
      if (!ONLINE) { var s0 = db.settings['plan_' + d.id]; if (s0) { s0.active = on; save(); } pi.active = on; render(); return; }
      SRV.rpc('set_plan_active', { p_client: d.id, p_on: on }).then(function () { pi.active = on; render(); toast(on ? 'الرابط رجع اشتغل' : 'انوقف الرابط'); }, function (e) { toast(e.message); });
    },
    pmMonth: function (d) { mstate.pm[d.id] = addMonths(((mstate.pm[d.id]) || today().slice(0, 7)) + '-15', +d.d).slice(0, 7); render(); },
    addPost: function (d) { itemForm('content', null, { client_id: d.client }); },
    rateOk: function () { var a = rateSug(); if (!a || !isMgr()) return; db.rates[today()] = Number(a.rate); save(); render(); toast('اعتمدت سعر اليوم'); },
    review: function (d) { if (me().role !== 'client') return; clientReview(d.id, true, ''); },
    reviewEdit: function (d) {
      if (me().role !== 'client') return; var p = portalPost(d.id);
      openForm('بدك تعديل؟', [{ k: 'note', label: 'شو بدك نعدّل؟', type: 'area', wide: true, req: true }], function (v) {
        var n = String(v.note || '').trim(); if (!n) return { err: 'اكتب شو بدك نعدّل.' }; if (n.length > 500) return { err: 'خليها أقصر من 500 حرف.' };
        return clientReview(d.id, false, n);
      }, p ? '«' + (p.name || '') + '»' : '', 'ابعت الملاحظة');
    },
    lead2client: function (d) { var l = byId('items', d.id); if (!confirm('تحويل «' + l.name + '» إلى عميل؟')) return; db.clients.push({ id: uid(), name: l.name, kind: 'page', value: num(l.value), months: 0, start_date: today(), notes: l.notes || '', roles: [{ role: '', user: '' }] }); l.status = 'صار عميلاً'; save(); render(); toast('صار عميلاً'); },
    calPrev: function () { mstate.cal = addMonths(calMonth() + '-15', -1).slice(0, 7); render(); },
    calNext: function () { mstate.cal = addMonths(calMonth() + '-15', 1).slice(0, 7); render(); },
    addEvent: function () { openForm('موعد جديد', [{ k: 'name', label: 'الموعد', req: true, wide: true }, { k: 'date', label: 'التاريخ', type: 'date', value: today(), req: true }, { k: 'time', label: 'الساعة', type: 'time' }], function (v) { db.items.push({ id: uid(), kind: 'event', status: '', name: v.name.trim(), date: v.date, time: v.time }); return 'أُضيف الموعد'; }); }
  });

  /* ---------- التقويم ---------- */
  function calMonth() { return mstate.cal || today().slice(0, 7); }
  function calEntries() {
    var e = {}; function put(d, t) { if (!d) return; (e[d] = e[d] || []).push(t); }
    db.tasks.forEach(function (t) { if (!t.done) put(t.due, 'مهمة: ' + t.title); });
    db.items.forEach(function (x) {
      if (x.kind === 'project' && x.status !== 'منتهٍ') put(x.date, 'مشروع: ' + x.name);
      if (x.kind === 'drone' && x.status !== 'منتهٍ') put(x.date, 'درون' + (x.time ? ' ' + x.time : '') + ': ' + x.name);
      if (x.kind === 'post' && x.status !== 'منشور') put(x.date, 'نشر: ' + x.name);
      if (x.kind === 'event') put(x.date, (x.time ? x.time + ' ' : '') + x.name);
      if (x.kind === 'lead' && x.status !== 'صار عميلاً' && x.status !== 'ضاع') put(x.next, 'متابعة: ' + x.name);
      if (x.kind === 'gear' && x.status === 'مستأجرة') put(x.to, 'إعادة: ' + x.name);
    });
    db.debts.forEach(function (d) { if (!d.settled) put(d.due, (d.dir === 'owe' ? 'دين عليّ: ' : 'دين لي: ') + d.party); });
    db.clients.forEach(function (c) { put(clientEnd(c), 'نهاية عقد: ' + c.name); });
    return e;
  }
  function vCalendar() {
    var ym = calMonth(), first = new Date(ym + '-01T12:00:00'), days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(), lead = (first.getDay() + 1) % 7, e = calEntries(), t = today(), title;
    try { title = new Intl.DateTimeFormat('ar-SY-u-nu-latn', { month: 'long', year: 'numeric' }).format(first); } catch (x) { title = ym; }
    var c = head(title, 'المهام، المشاريع، الطلعات، النشر، الدفعات، ونهايات العقود', btn('الشهر السابق', 'calPrev') + btn('الشهر التالي', 'calNext') + btn('+ موعد جديد', 'addEvent', {}, 'pri'));
    var g = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(function (d) { return '<div class="calh">' + d + '</div>'; }).join('');
    for (var i = 0; i < lead; i++) g += '<div aria-hidden="true"></div>';
    var monthList = [];
    for (var d = 1; d <= days; d++) {
      var ds = ym + '-' + pad(d), l = e[ds] || [];
      l.forEach(function (x) { monthList.push([h(x), h(dateAr(ds))]); });
      g += '<div class="cald' + (ds === t ? ' now' : '') + '"><b>' + d + '</b>' + l.slice(0, 3).map(function (x) { return '<span>' + h(x) + '</span>'; }).join('') + (l.length > 3 ? '<span class="mu">+' + (l.length - 3) + '</span>' : '') + '</div>';
    }
    c += '<div class="tbl"><div class="cal">' + g + '</div></div>' + tile('كل مواعيد الشهر', monthList.length + ' موعد', rows(monthList), monthList.length > 0 && monthList.length <= 12);
    return shell(c);
  }

  /* ---------- التقارير ---------- */
  function hbar(label, val, pct) { return '<div><div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px"><span>' + h(label) + '</span><span class="mu ltr">' + h(val) + '</span></div><div class="bar" role="img" aria-label="' + h(label) + ': ' + h(val) + '"><i style="width:' + Math.max(0, Math.min(100, pct)) + '%"></i></div></div>'; }
  function bars(pairs, fmt) { var mx = Math.max.apply(null, pairs.map(function (p) { return Math.abs(p[1]); }).concat([1])); return pairs.length ? pairs.map(function (p) { return hbar(p[0], fmt(p[1]), Math.abs(p[1]) / mx * 100); }).join('') : '<p class="empty">لا بيانات بعد.</p>'; }
  function vReports() {
    var t = today(), mon = monthOf(t), mv = db.moves.filter(live), mm = mv.filter(function (m) { return monthOf(m.date) === mon; });
    var inc = sum(mm.filter(function (m) { return m.dir === 'in'; }), function (m) { return m.usd; }), out = sum(mm.filter(function (m) { return m.dir === 'out'; }), function (m) { return m.usd; });
    var byClient = db.clients.map(function (c) { return [c.name, sum(mm.filter(function (m) { return m.client_id === c.id; }), function (m) { return m.dir === 'in' ? m.usd : -m.usd; })]; }).filter(function (p) { return p[1] !== 0; }).sort(function (a, b) { return b[1] - a[1]; });
    var svc = { 'الدرون': 0, 'المشاريع': 0, 'إدارة الصفحات': 0, 'أخرى': 0 };
    mm.filter(function (m) { return m.dir === 'in'; }).forEach(function (m) { var it = byId('items', m.item_id); svc[it && it.kind === 'drone' ? 'الدرون' : it && it.kind === 'project' ? 'المشاريع' : m.client_id ? 'إدارة الصفحات' : 'أخرى'] += m.usd; });
    var months = []; for (var i = 5; i >= 0; i--) { var k = addMonths(mon + '-15', -i).slice(0, 7), lab; try { lab = new Intl.DateTimeFormat('ar-SY-u-nu-latn', { month: 'long' }).format(new Date(k + '-15T12:00:00')); } catch (x) { lab = k; } months.push([lab, sum(mv.filter(function (m) { return monthOf(m.date) === k; }), function (m) { return m.dir === 'in' ? m.usd : -m.usd; })]); }
    var team = db.users.filter(function (u) { return u.role === 'member'; }).map(function (u) { var dn = db.tasks.filter(function (x) { return x.user_id === u.id && x.done; }), on = dn.filter(function (x) { return x.done_at && x.done_at <= x.due; }).length; return [u.name, on, dn.length]; }).filter(function (p) { return p[2] > 0; });
    var c = head('التقارير', 'الشهر الحالي');
    c += '<div class="kpis">' + kpi('الدخل', usd(inc)) + kpi('المصاريف', usd(out)) + kpi('الصافي', usd(inc - out), true) + kpi('هامش الربح', (inc ? Math.round((inc - out) / inc * 100) : 0) + '%') + '</div>';
    c += '<div class="tiles">' + tile('صافي كل عميل', byClient.length + ' عملاء', bars(byClient, usd), true) + tile('الدخل حسب الخدمة', 'هذا الشهر', bars(Object.keys(svc).map(function (k) { return [k, svc[k]]; }).filter(function (p) { return p[1] > 0; }), usd), true) + tile('الصافي آخر 6 أشهر', 'مقارنة الأشهر', bars(months, usd), true) +
      tile('أداء الفريق', 'المهام المسلّمة في وقتها', team.length ? team.map(function (p) { return hbar(p[0], p[1] + ' من ' + p[2], p[1] / p[2] * 100); }).join('') : '<p class="empty">لا مهام منجزة بعد.</p>') + '</div>';
    return shell(c);
  }

  /* ---------- المراسل والتنبيهات ---------- */
  function modAlerts() {
    var a = [], t = today(), n;
    n = items('request').filter(function (x) { return x.status === 'جديد'; }).length; if (n) a.push(['طلبات لم يُرد عليها', String(n)]);
    items('lead').forEach(function (x) { if (x.next && x.next <= t && x.status !== 'صار عميلاً' && x.status !== 'ضاع') a.push(['متابعة عميل محتمل: ' + h(x.name), x.next < t ? 'فات موعدها' : 'اليوم']); });
    items('gear').forEach(function (x) { if (x.status === 'مستأجرة' && x.to && x.to <= t) a.push(['إعادة معدات: ' + h(x.name), x.to < t ? 'متأخرة' : 'اليوم']); });
    items('drone').forEach(function (x) { if (x.status !== 'منتهٍ' && x.permit === 'بانتظار الموافقة' && x.date && daysTo(x.date) <= 3 && daysTo(x.date) >= 0) a.push(['طلعة درون بلا تصريح: ' + h(x.name), 'خلال ' + daysTo(x.date) + ' يوم']); });
    n = items('post').filter(function (x) { return x.status === 'موافقة العميل'; }).length; if (n) a.push(['منشورات بانتظار موافقة العميل', String(n)]);
    return a;
  }
  function dashExtra() {
    var mon = monthOf(today()), dr = items('drone'), rq = items('request');
    return tile('الدرون هذا الشهر', dr.filter(function (x) { return monthOf(x.created || x.date || '') === mon; }).length + ' طلباً من 100', rows([['طلعات اليوم', String(dr.filter(function (x) { return x.date === today() && x.status !== 'منتهٍ'; }).length)], ['بانتظار التصريح', String(dr.filter(function (x) { return x.permit === 'بانتظار الموافقة' && x.status !== 'منتهٍ'; }).length)]]) + '<div class="acts"><a class="btn sm" href="#/m/drone">فتح الدرون</a></div>') +
      tile('صندوق الطلبات', rq.filter(function (x) { return x.status === 'جديد'; }).length + ' طلبات لم يُرد عليها', rows([['بانتظار العميل', String(rq.filter(function (x) { return x.status === 'بانتظار العميل'; }).length)], ['حُجز هذا الشهر', String(rq.filter(function (x) { return x.status === 'حُجز' && monthOf(x.date || '') === mon; }).length)]]) + '<div class="acts"><a class="btn sm" href="#/m/inbox">فتح الصندوق</a></div>');
  }
  function vReporter() {
    var t = today(), e = calEntries(), mv = db.moves.filter(live), td = mv.filter(function (m) { return m.date === t; });
    var morning = (e[t] || []).map(function (x) { return [h(x), 'اليوم']; });
    if (!db.rates[t]) morning.push(['سعر الصرف', 'لم يُدخل بعد']);
    var evening = [['المقبوض اليوم', L(usd(sum(td.filter(function (m) { return m.dir === 'in'; }), function (m) { return m.usd; })))], ['المصروف اليوم', L(usd(sum(td.filter(function (m) { return m.dir === 'out'; }), function (m) { return m.usd; })))], ['مهام أُنجزت اليوم', String(db.tasks.filter(function (x) { return x.done && x.done_at === t; }).length)], ['مهام متأخرة', String(db.tasks.filter(function (x) { return !x.done && x.due < t; }).length)]];
    var al = modAlerts(); db.debts.filter(function (d) { return !d.settled && d.due && daysTo(d.due) <= 7; }).forEach(function (d) { al.push([(d.dir === 'owe' ? 'دين عليّ: ' : 'دين لي: ') + h(d.party), daysTo(d.due) < 0 ? 'فات موعده' : 'خلال ' + daysTo(d.due) + ' يوم']); });
    db.clients.forEach(function (c) { var en = clientEnd(c); if (en && daysTo(en) >= 0 && daysTo(en) <= 30) al.push(['عقد ' + h(c.name) + ' ينتهي', 'خلال ' + daysTo(en) + ' يوم']); });
    var c = head('المراسل', 'ملخص اليوم من بيانات النظام');
    c += '<div class="tiles">' + tile('نشرة الصباح', morning.length + ' بنود اليوم', rows(morning), true) + tile('نشرة المساء', 'ما حدث اليوم', rows(evening), true) + tile('التنبيهات', al.length + ' تنبيهات', rows(al), true) + '</div>';
    c += '<p class="mu">المراسل يلخص ما سُجّل في النظام فقط. الإشعارات على الموبايل وسؤال المساعد بالعربية يحتاجان ربط خدمات خارجية، وهما خطوة قادمة.</p>';
    return shell(c);
  }


  /* ---------- بوابة العميل ---------- */
  function clientUser(cl) { return db.users.filter(function (u) { return u.role === 'client' && u.client_id === cl.id; })[0]; }
  function clientLoginBtn(cl) { var u = clientUser(cl); return u ? btn(u.active === false ? 'تفعيل دخول العميل' : 'إيقاف دخول العميل', 'toggleClientLogin', { uid: u.id }) + (ONLINE ? btn('كلمة سر العميل', 'clientPass', { uid: u.id }) : '') : btn('إنشاء دخول للعميل', 'clientLogin', { id: cl.id }); }
  function clientLoginForm(cl) {
    openForm('دخول العميل: ' + cl.name, [{ k: 'phone', label: 'رقم موبايل العميل (اسم المستخدم)', type: 'tel', req: true }, { k: 'pass', label: 'كلمة السر', type: 'password', req: true }], function (v) {
      var ph = normPhone(v.phone); if (!ph) return { err: 'أدخل رقم موبايل صحيحاً.' };
      if (v.pass.length < 8) return { err: 'كلمة السر 8 أحرف على الأقل.' };
      if (db.users.some(function (x) { return normPhone(x.phone) === ph || normPhone(x.login_phone) === ph; })) return { err: 'هذا الرقم مسجل لحساب آخر.' };
      var o = { role: 'client', client_id: cl.id, name: cl.name, title: 'عميل', phone: v.phone.trim(), login_phone: ph, active: true, kind: '', contract: 0 };
      if (ONLINE) return SRV.createUser(v.phone, v.pass).then(function (id) { db.users.push(Object.assign({ id: id }, o)); return 'أُنشئ دخول العميل'; });
      var salt = uid(); return hash(v.pass, salt).then(function (hh) { db.users.push(Object.assign({ id: uid(), pass: hh, salt: salt }, o)); return 'أُنشئ دخول العميل'; });
    }, 'العميل يدخل من رابط النظام نفسه برقمه وكلمة السر، ويرى بوابته فقط: خطة النشر وحسابه ودفعاته.');
  }
  function portalLocal(cid) {
    var c = byId('clients', cid) || {};
    return { client: { name: c.name, kind: c.kind, value: c.value, months: c.months, start_date: c.start_date },
      payments: db.moves.filter(function (m) { return live(m) && m.client_id === cid && m.dir === 'in'; }).map(function (m) { return { date: m.date, service: m.service, usd: m.usd, amount: m.amount, cur: m.cur, receipt: m.receipt }; }),
      posts: db.items.filter(function (x) { return x.kind === 'post' && x.client_id === cid; }).map(function (x) { return { id: x.id, name: x.name, type: x.type, date: x.date, time: x.time, status: pst(x.status), preview: x.preview, caption: x.caption, note: x.review_note }; }),
      plan_token: db.settings['plan_' + cid] && db.settings['plan_' + cid].active !== false ? 'demo' : null,
      phone: db.settings.shafq_phone || (db.users.filter(function (u) { return u.role === 'manager'; })[0] || {}).phone || '' };
  }
  var pstate = { data: null, loading: false, err: '', month: '' };
  function portalData() {
    if (!ONLINE) return portalLocal(me().client_id);
    if (!pstate.data && !pstate.loading) {
      pstate.loading = true; pstate.err = '';
      SRV.rpc('client_portal').then(function (d) { pstate.data = d; }, function (e) { pstate.err = e.message; }).then(function () { pstate.loading = false; render(); });
    }
    return pstate.data;
  }
  function postState(p, now) {
    if (p.status === 'منشور') return ['done', 'نزل'];
    if (pst(p.status) === 'موافقة العميل') return ['wait', 'بانتظار موافقتك'];
    var due = p.date ? new Date(p.date + 'T' + (p.time || '23:59') + ':00') : null;
    if (due && due < now) { var dd = Math.floor((now - due) / 86400000); return ['late', dd >= 1 ? 'متأخر ' + (dd === 1 ? 'يوم' : dd === 2 ? 'يومين' : dd + ' أيام') : 'متأخر']; }
    if (p.status === 'مجدول') return ['ready', 'جاهز للنشر'];
    return ['plan', 'قيد التحضير'];
  }
  function schedule(cl, paid) {
    var v = num(cl.value), n = cl.kind === 'project' ? 1 : num(cl.months), start = cl.start_date || today(), rows = [], left = paid;
    for (var i = 0; i < n; i++) { var due = addMonths(start, i), cov = Math.min(v, left); left -= cov; if (cov < v - 0.005) rows.push({ date: due, usd: v - cov }); }
    return rows;
  }
  function vPortal() {
    var d = portalData(), now = new Date(), t = today();
    var top = '<div class="ptop"><a class="brand" href="/" title="ارجع لموقع شفق ميديا"><img class="lg-w" src="' + LOGO_W + '" alt="شعار شفق"><img class="lg-b" src="' + LOGO_B + '" alt="شعار شفق"><div><b>شفق ميديا</b><span>بوابة العميل</span></div></a><div class="acts">' + bellBtn('btn ic') + btn('راسل الإدارة', 'msgAdmin', {}, 'pri') + btn(document.body.classList.contains('t-light') ? 'الثيم الغامق' : 'الثيم الفاتح', 'theme') + btn('تسجيل الخروج', 'logout') + '</div></div>';
    if (!d) return '<div class="portal">' + top + (pstate.err ? '<p class="warn">تعذر تحميل البوابة: ' + h(pstate.err) + '</p>' + btn('إعادة المحاولة', 'portalRefresh', {}, 'pri') : '<p class="empty">جارٍ التحميل…</p>') + '</div>';
    var cl = d.client || {}, ym = pstate.month || t.slice(0, 7), mname;
    try { mname = new Intl.DateTimeFormat('ar-SY-u-nu-latn', { month: 'long', year: 'numeric' }).format(new Date(ym + '-15T12:00:00')); } catch (x) { mname = ym; }
    var c = top + pushBanner() + '<div class="hello"><h1>' + greet() + '، ' + h(cl.name || '') + '</h1><p class="mu">' + h(longDates()) + '</p></div>';
    var cPlan = c.length;
    // plan
    var posts = (d.posts || []).filter(function (p) { return (p.date || '').slice(0, 7) === ym; }).sort(function (a, b) { return ((a.date || '') + (a.time || '')) < ((b.date || '') + (b.time || '')) ? -1 : 1; });
    var done = posts.filter(function (p) { return p.status === 'منشور'; }).length, types = {};
    posts.forEach(function (p) { var k = p.type || 'منشور'; types[k] = types[k] || [0, 0]; types[k][1]++; if (p.status === 'منشور') types[k][0]++; });
    c += '<div class="head"><div><h1 style="font-size:26px">خطة النشر الشهرية</h1><p>' + h(mname) + ' · نزل ' + done + ' من ' + posts.length + '</p></div><div class="acts">' + btn('الشهر السابق', 'portalMonth', { d: -1 }) + btn('الشهر التالي', 'portalMonth', { d: 1 }) + '</div></div>';
    if (posts.length) c += '<div class="tile ptypes" style="padding:16px 20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:16px">' + Object.keys(types).map(function (k) { var x = types[k]; return '<div><div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px"><span>' + h(k) + '</span><span class="mu">' + x[0] + ' من ' + x[1] + '</span></div><div class="bar"><i style="width:' + Math.round(x[0] / x[1] * 100) + '%"></i></div></div>'; }).join('') + '</div>';
    c += '<section class="pc-sec">' + monthCal(posts, ym, { client: true }) + '</section>';
    var phone = d.phone;
    var cAcc = c.length;
    // account
    var pays = (d.payments || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }), paid = sum(pays, function (p) { return num(p.usd); });
    var n = cl.kind === 'project' ? 1 : num(cl.months), total = num(cl.value) * (n || 1), sch = schedule(cl, paid), next = sch[0];
    c += '<div class="head"><div><h1 style="font-size:26px">حسابك</h1></div></div><div class="kpis">' + kpi('قيمة العقد', usd(total), false, cl.kind === 'project' ? 'للمشروع' : (n ? usd(num(cl.value)) + ' شهرياً × ' + n + ' أشهر' : 'شهرياً')) + kpi('المدفوع', usd(paid), false, pays.length + ' دفعات') + kpi('الباقي', usd(Math.max(0, total - paid)), false, sch.length ? sch.length + ' دفعات' : 'لا شيء') + kpi('الدفعة الجاية', next ? dateAr(next.date) : 'لا يوجد', true, next ? usd(next.usd) + (daysTo(next.date) > 0 ? ' · بعد ' + daysTo(next.date) + ' يوم' : daysTo(next.date) === 0 ? ' · اليوم' : ' · متأخرة') : 'الحساب مسدد') + '</div>';
    // payments table
    var tr = pays.map(function (p) { return '<tr><td>' + h(dateAr(p.date)) + '</td><td>' + (p.service ? '<span class="type">' + h(p.service) + '</span>' : '<span class="mu">—</span>') + '</td><td>' + (p.cur === 'SYP' ? h(syp(num(p.amount))) + ' <span class="mu">(<span class="ltr">' + h(usd(num(p.usd))) + '</span>)</span>' : '<span class="ltr">' + h(usd(num(p.usd))) + '</span>') + '</td><td><span class="ltr">' + h(p.receipt || '—') + '</span></td><td><b class="paid">مدفوعة</b></td></tr>'; }).join('') +
      sch.map(function (s0) { return '<tr><td>' + h(dateAr(s0.date)) + '</td><td><span class="mu">—</span></td><td><span class="ltr">' + h(usd(s0.usd)) + '</span></td><td><span class="mu">—</span></td><td><b class="due">' + (daysTo(s0.date) < 0 ? 'متأخرة' : 'مستحقة') + '</b></td></tr>'; }).join('');
    c += tile('الدفعات', pays.length + ' مدفوعة · ' + sch.length + ' مستحقة', tr ? '<div class="tbl"><table><thead><tr><th>التاريخ</th><th>عن شو</th><th>المبلغ</th><th>رقم الوصل</th><th>الحالة</th></tr></thead><tbody>' + tr + '</tbody></table></div>' : '<p class="empty">لا دفعات بعد.</p>', true);
    c += '<div class="foot">' + (phone ? '<a class="btn pri" target="_blank" rel="noopener" href="' + h(waTo(phone, 'السلام عليكم، معكم ' + (cl.name || '') + '.')) + '">تواصل مع شفق · واتساب</a>' : '') + '<span class="mu">شفق ميديا</span></div>';
    var helloHtml = c.slice(top.length, cPlan), planHtml = c.slice(cPlan, cAcc), accHtml = c.slice(cAcc), r = route(), sec;
    if (r === '#/content') sec = planHtml;
    else if (r === '#/plan') sec = d.plan_token ? '<div class="pframe"><iframe src="/p/' + (d.plan_token === 'demo' ? '?embed=1&demo=1' : encodeURIComponent(d.plan_token) + '?embed=1') + '" title="خطة الشهر" loading="lazy" referrerpolicy="no-referrer"></iframe></div>' : '<div class="hello"><h1>الخطة</h1><p class="mu">خطة الشهر لسا ما نزلت. رح يوصلك إشعار أول ما تجهز.</p></div>';
    else if (r === '#/account') {
      var left = Math.max(0, total - paid);
      sec = '<div class="hello"><h1>حسابي</h1><p class="mu">' + h(cl.name || '') + '</p></div>';
      sec += '<div class="kpis">' + kpi('الباقي عليك', usd(left), true) + kpi('دفعت', usd(paid)) + '</div>';
      var lines = sch.map(function (s0) { var late = daysTo(s0.date) < 0; return '<div class="sline"><span class="s-main"><b class="ltr" style="text-align:right">' + h(usd(s0.usd)) + '</b><small>' + h(dateAr(s0.date)) + ' · ' + (late ? '<em class="late">متأخرة</em>' : 'مستحقة') + '</small></span></div>'; })
        .concat(pays.slice().reverse().map(function (p0) { return '<div class="sline"><span class="s-main"><b class="ltr" style="text-align:right">' + h(usd(num(p0.usd))) + '</b><small>' + h(dateAr(p0.date)) + ' · مدفوعة' + (p0.service ? ' · ' + h(p0.service) : '') + '</small></span></div>'; }));
      sec += '<section class="sbox"><h2>الدفعات</h2>' + simpleList(lines, 'ما في دفعات.') + '</section>';
      sec += '<div class="acts">' + btn('تسجيل الخروج', 'logout') + '</div>';
    }
    else {
      var allP = d.posts || [], upc = allP.filter(function (p) { return (p.date || '') >= t && p.status !== 'منشور' && pst(p.status) !== 'موافقة العميل'; }).sort(function (a, b) { return ((a.date || '') + (a.time || '')) < ((b.date || '') + (b.time || '')) ? -1 : 1; }).slice(0, 3);
      var dayName; try { dayName = new Intl.DateTimeFormat('ar-SY-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()); } catch (x) { dayName = dateAr(t); }
      sec = pushBanner() + '<div class="hello"><h1>' + greet() + '، ' + h(cl.name || '') + '</h1><p class="mu">' + h(dayName) + '</p></div>';
      var waitP = allP.filter(function (p) { return pst(p.status) === 'موافقة العميل'; });
      if (waitP.length) sec += '<section class="sbox review"><h2>بانتظار موافقتك <b class="cnt">' + waitP.length + '</b></h2>' + waitP.map(reviewCard).join('') + '</section>';
      sec += '<section class="sbox"><h2>الجاي على صفحتك</h2>' + simpleList(upc.map(function (p) { var rel = p.date === t ? 'اليوم' : p.date === addDays(t, 1) ? 'بكرة' : dateAr(p.date); return '<div class="sline"><span class="s-main"><b>' + h(p.name || p.type || 'منشور') + '</b><small>' + h(rel) + (p.time ? ' · ' + h(p.time) : '') + '</small>' + track(cstep(p.status), CSTEPS) + '</span></div>'; }), 'ما في منشورات قادمة.') + '</section>';
      if (next) sec += '<div class="slist"><a class="sline link" href="#/account"><span class="s-main"><b>الدفعة الجاية</b><small>' + h(dateAr(next.date)) + ' · <span class="ltr">' + h(usd(next.usd)) + '</span>' + (daysTo(next.date) < 0 ? ' · <em class="late">متأخرة</em>' : '') + '</small></span>' + CHEV + '</a></div>';
    }
    var ptabs = '<nav class="ptabs" aria-label="أقسام البوابة">' + CTABS.map(function (x) { var on = (r === x[1]) || (x[1] === '#/' && r !== '#/content' && r !== '#/account' && r !== '#/plan'); return '<a href="' + x[1] + '" class="' + (on ? 'on' : '') + '">' + x[0] + '</a>'; }).join('') + '</nav>';
    return appbar() + '<div class="portal">' + top + ptabs + sec + '</div>' + tabbar();
  }
  Object.assign(acts, {
    portalMonth: function (d) { pstate.month = addMonths((pstate.month || today().slice(0, 7)) + '-15', +d.d).slice(0, 7); render(); },
    portalRefresh: function () { pstate.data = null; render(); }
  });


  /* ---------- إشعارات الجوال ---------- */
  var PUSH_KEY = CFG.pushKey || '', pushSynced = false;
  function isIOS() { return /iPhone|iPad|iPod/.test(navigator.userAgent); }
  function standalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
  function pushOK() { return ONLINE && !!PUSH_KEY && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }
  function pushStatus() {
    if (!ONLINE || !PUSH_KEY) return 'off';
    if (isIOS() && !standalone()) return 'ios';
    if (!pushOK()) return 'unsupported';
    return Notification.permission; // default | granted | denied
  }
  function keyBytes(b) { b = b.replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '='; var r = atob(b), o = new Uint8Array(r.length); for (var i = 0; i < r.length; i++) o[i] = r.charCodeAt(i); return o; }
  function pushSub(create) {
    return swReg().then(function (reg) {
      return reg.pushManager.getSubscription().then(function (s) {
        if (s && s.options && s.options.applicationServerKey) { var a = new Uint8Array(s.options.applicationServerKey), b = keyBytes(PUSH_KEY), same = a.length === b.length && a.every(function (x, i) { return x === b[i]; }); if (!same) return s.unsubscribe().then(function () { return null; }); }
        return s;
      }).then(function (s) { return s || (create ? reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUSH_KEY) }) : null); });
    }).then(function (s) { if (!s) return null; var j = s.toJSON(); return SRV.rpc('save_push_sub', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth }).then(function () { return s; }); });
  }
  function swReg() { return navigator.serviceWorker.getRegistration().then(function (reg) { if (reg) return reg; return navigator.serviceWorker.register('sw.js').then(function () { return navigator.serviceWorker.ready; }); }); }
  function pushSync() { if (pushSynced || pushStatus() !== 'granted') return; pushSynced = true; pushSub(true).catch(function () { pushSynced = false; }); }
  function pushOff() {
    pushSynced = false;
    if (!pushOK() || !SRV.hasSession()) return Promise.resolve();
    return navigator.serviceWorker.getRegistration().then(function (reg) { return reg ? reg.pushManager.getSubscription() : null; }).then(function (s) {
      if (!s) return; return SRV.rpc('delete_push_sub', { p_endpoint: s.endpoint }).catch(function () {}).then(function () { return s.unsubscribe(); });
    }).catch(function () {});
  }
  function pushBanner() {
    var st = pushStatus();
    try { if (localStorage.getItem('shafq_push_later') === today()) return ''; } catch (e) {}
    if (st === 'default') return '<div class="pushbar"><span> فعّل الإشعارات لتوصلك المهام والدفعات وتحية الصبح والمسا على جهازك.</span><span class="acts">' + btn('تفعيل الإشعارات', 'pushOn', {}, 'pri') + btn('لاحقاً', 'pushLater') + '</span></div>';
    if (st === 'ios') return '<div class="pushbar"><span> على الآيفون: من زر المشاركة اختر «إضافة إلى الشاشة الرئيسية»، وافتح النظام من الأيقونة لتقدر تفعّل الإشعارات.</span><span class="acts">' + btn('تمام', 'pushLater') + '</span></div>';
    return '';
  }
  function pushTile() {
    var st = pushStatus(), txt = { granted: 'مفعّلة على هذا الجهاز ✓', 'default': 'غير مفعّلة على هذا الجهاز', denied: 'محظورة من المتصفح. افتح إعدادات الموقع (القفل جنب الرابط) واسمح بالإشعارات.', ios: 'على الآيفون لازم تضيف النظام للشاشة الرئيسية أولاً، وتفتحه من الأيقونة.', unsupported: 'هذا المتصفح لا يدعم الإشعارات. جرّب كروم.', off: 'الإشعارات تشتغل بعد ربط النظام بالسيرفر.' }[st];
    return tile('الإشعارات', txt, '<p class="mu">بتوصلك إشعارات المهام والدفعات والمنشورات، وتحية الصبح والمسا باسمك.</p><div class="acts">' + (st === 'default' ? btn('تفعيل الإشعارات', 'pushOn', {}, 'pri') : '') + (st === 'granted' ? btn('إرسال إشعار تجريبي', 'pushTest', {}, 'pri') : '') + '</div>');
  }
  function alertBox(t, msg) { openForm(t, [], function () { return ''; }, msg, 'تمام'); }
  function notify(items) { if (ONLINE && SRV.notify) SRV.notify(items); }
  function amountTxt(amt, cur) { return cur === 'USD' ? usd(amt) : syp(amt); }
  Object.assign(acts, {
    pushOn: function () {
      if (pushStatus() !== 'default') { render(); return; }
      Notification.requestPermission().then(function (p) {
        if (p !== 'granted') { toast('ما انسمح بالإشعارات'); render(); return; }
        return pushSub(true).then(function () { pushSynced = true; toast('تفعّلت الإشعارات'); render(); });
      }).catch(function (e) { toast('تعذر تفعيل الإشعارات: ' + (e && e.message || e)); render(); });
    },
    pushLater: function () { try { localStorage.setItem('shafq_push_later', today()); } catch (e) {} render(); },
    pushTest: function () { pushSub(true).then(function () { return SRV.notify([{ to: [me().id], title: 'أهلاً ' + (me().gender === 'f' ? 'أستاذة ' : 'أستاذ ') + me().name + '', body: 'الإشعارات شغالة على هذا الجهاز.' }]); }).then(function (r) {
        if (r && r.sent) return toast('انبعت الإشعار ✓');
        var why = !r ? 'ما قدرت أوصل لدالة push بـ Supabase.' : r.errors && r.errors.length ? 'السبب: ' + r.errors.join(' | ') : !r.subs ? 'هالجهاز مو محفوظ بقاعدة البيانات. تأكد إنك شغّلت schema4.sql، وبعدين اكبس تفعيل من جديد.' : 'ما وصل لسبب مو معروف.';
        if (r && r.key && PUSH_KEY.slice(0, 12) !== r.key) why = 'المفتاح VAPID_PUBLIC بـ Supabase مو نفس مفتاح النظام. انسخه من جديد من push-secrets.txt.';
        alertBox('ما وصل الإشعار', why);
      }, function (e) { alertBox('ما وصل الإشعار', 'تعذر الإرسال: ' + e.message); }); }
  });


  /* ---------- إرسال إشعار يدوي برسائل جاهزة ---------- */
  function notePresets(u, cl) {
    var f = u && u.gender === 'f', sr = (f ? 'أستاذة ' : 'أستاذ ') + (u ? u.name : ''), k = f ? 'كِ' : 'ك';
    if (cl) {
      var paid = sum(db.moves.filter(function (m) { return live(m) && m.client_id === cl.id && m.dir === 'in'; }), function (m) { return m.usd; }), nx = schedule(cl, paid)[0];
      return [
        ['what', 'شو صار معكم؟', 'شو صار معكم؟', 'السلام عليكم ' + sr + '، حبينا نطمّن عليكم ونشوف إذا في شي بدكم ياه منا.'],
        ['due', 'تذكير بالدفعة الجاية', 'تذكير بالدفعة', sr + '، تذكير لطيف: الدفعة الجاية' + (nx ? ' بتاريخ ' + dateAr(nx.date) + ' بقيمة ' + usd(nx.usd) : '') + '. شكراً لتعاونكم.'],
        ['got', 'وصلتنا دفعتكم', 'وصلتنا دفعتكم', sr + '، وصلتنا الدفعة، شكراً لثقتكم.'],
        ['approve', 'محتوى بانتظار موافقتكم', 'بانتظار موافقتكم', sr + '، في محتوى جاهز وبانتظار موافقتكم. فوتوا على البوابة وشوفوه.'],
        ['plan', 'خطة الشهر جاهزة', 'خطة النشر جاهزة', sr + '، خطة النشر لهالشهر صارت جاهزة على البوابة.']
      ];
    }
    return [
      ['what', 'شو صار مع' + k + '؟', 'شو صار مع' + k + '؟', 'السلام عليكم ' + sr + '، حبيت أطمّن شو صار مع' + k + ' بالشغل. يعطي' + k + ' العافية.'],
      ['paid', 'وصل' + k + ' الدفع؟', 'وصل' + k + ' الدفع؟', sr + '، سجّلنا دفعة إل' + k + '. طمّني إذا وصلت' + k + '.'],
      ['task', 'عند' + k + ' مهمة جديدة', 'مهمة جديدة', sr + '، في مهمة جديدة إل' + k + ' على النظام، فوت' + (f ? 'ي' : '') + ' شوفها.'],
      ['due', 'تذكير بموعد التسليم', 'تذكير بالتسليم', sr + '، تذكير بموعد تسليم مهام' + k + '. إذا في شي معطّل' + k + ' خبّرني.'],
      ['thanks', 'يعطي' + k + ' العافية', 'يعطي' + k + ' العافية', sr + '، شكراً على شغل' + k + '، يعطي' + k + ' العافية.']
    ];
  }
  function sendNoteForm(u, cl) {
    var ps = notePresets(u, cl), to = cl ? { client: cl.id } : [u.id];
    openForm('إرسال إشعار إلى ' + (cl ? cl.name : u.name), [
      { k: 'kind', label: 'الرسالة', type: 'select', options: ps.map(function (p) { return [p[0], p[1]]; }).concat([['other', 'رسالة أخرى…']]), value: ps[0][0], wide: true },
      { k: 'text', label: 'نص الإشعار (فيك تعدّله)', type: 'area', value: ps[0][3], wide: true, req: true }
    ], function (v) {
      var p = ps.filter(function (x) { return x[0] === v.kind; })[0], body = String(v.text || '').trim();
      if (!body) return { err: 'اكتب نص الرسالة.' };
      return SRV.notify([{ to: to, title: p ? p[2] : 'رسالة من شفق ميديا', body: body, tag: 'note' }]).then(function (r) {
        if (r && r.sent) return 'انبعت الإشعار ✓';
        return { err: r ? 'ما وصل: ' + (cl ? 'العميل' : (u.gender === 'f' ? 'هي' : 'هو')) + ' لسا ما فعّل الإشعارات على جهازه. فيك تبعتله واتساب بدالها.' : 'تعذر الإرسال. تأكد من الإنترنت ومن دالة push.' };
      });
    }, 'الإشعار بيوصل على جهاز الشخص إذا كان مفعّل الإشعارات.');
    var sel = document.getElementById('m_kind'), ta = document.getElementById('m_text');
    if (sel && ta) sel.addEventListener('change', function () { var p = ps.filter(function (x) { return x[0] === sel.value; })[0]; ta.value = p ? p[3] : ''; if (!p) ta.focus(); });
  }
  Object.assign(acts, {
    sendNote: function (d) {
      if (d.client) { var cl = byId('clients', d.client); return sendNoteForm(clientUser(cl), cl); }
      sendNoteForm(byId('users', d.uid), null);
    }
  });


  /* ---------- خطة المحتوى من ملف إكسل ---------- */
  var XL_COLS = ['التاريخ', 'الساعة', 'العميل', 'النوع', 'العنوان', 'المسؤول', 'الحالة', 'ملاحظات'];
  var XL_TYPES = ['بوست', 'ريل', 'ريل جاهز', 'كاروسيل', 'ستوري', 'منشور الجمعة'];
  var CRC = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zipStore(files) { // ملف zip بدون ضغط، يكفي لقالب صغير
    var enc = new TextEncoder(), parts = [], central = [], off = 0;
    function u16(v) { return [v & 255, (v >> 8) & 255]; }
    function u32(v) { return [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]; }
    files.forEach(function (f) {
      var name = enc.encode(f[0]), data = enc.encode(f[1]), crc = crc32(data);
      var head = [].concat([0x50, 0x4b, 3, 4], u16(20), u16(0x800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
      parts.push(new Uint8Array(head), name, data);
      central.push(new Uint8Array([].concat([0x50, 0x4b, 1, 2], u16(20), u16(20), u16(0x800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off))), name);
      off += head.length + name.length + data.length;
    });
    var csize = central.reduce(function (a, b) { return a + b.length; }, 0);
    var end = new Uint8Array([].concat([0x50, 0x4b, 5, 6], u16(0), u16(0), u16(files.length), u16(files.length), u32(csize), u32(off), u16(0)));
    return new Blob(parts.concat(central, [end]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function xesc(v) { return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function xlCol(i) { var s = ''; i++; while (i) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function xlTemplateFiles() {
    var team = db.users.filter(function (u) { return u.active !== false && u.role !== 'client'; }).map(function (u) { return u.name; });
    var lists = [['العملاء', db.clients.map(function (c) { return c.name; })], ['النوع', XL_TYPES], ['المسؤول', team], ['الحالة', MODS.content.statuses]];
    var cell = function (r, c, v, st) { return '<c r="' + xlCol(c) + r + '" t="inlineStr"' + (st ? ' s="' + st + '"' : '') + '><is><t>' + xesc(v) + '</t></is></c>'; };
    var head = '<row r="1">' + XL_COLS.map(function (t, i) { return cell(1, i, t, 1); }).join('') + '</row>';
    var widths = [14, 10, 22, 14, 40, 18, 16, 36];
    var dv = [[2, 0], [3, 1], [5, 2], [6, 3]].map(function (x) { var L = lists[x[1]], n = Math.max(2, L[1].length + 1); return '<dataValidation type="list" allowBlank="1" showErrorMessage="0" sqref="' + xlCol(x[0]) + '2:' + xlCol(x[0]) + '1000"><formula1>\'القوائم\'!$' + xlCol(x[1]) + '$2:$' + xlCol(x[1]) + '$' + n + '</formula1></dataValidation>'; }).join('');
    var sheet1 = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView rightToLeft="1" workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>' + widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"' + (i === 0 ? ' style="2"' : i === 1 ? ' style="3"' : '') + '/>'; }).join('') + '</cols><sheetData>' + head + '</sheetData><dataValidations count="4">' + dv + '</dataValidations></worksheet>';
    var maxL = Math.max.apply(null, lists.map(function (l) { return l[1].length; }));
    var rows = '';
    for (var r = 0; r <= maxL; r++) { rows += '<row r="' + (r + 1) + '">' + lists.map(function (l, i) { var v = r === 0 ? l[0] : l[1][r - 1]; return v == null ? '' : cell(r + 1, i, v, r === 0 ? 1 : 0); }).join('') + '</row>'; }
    var sheet2 = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView rightToLeft="1" workbookViewId="0"/></sheetViews><cols><col min="1" max="4" width="24" customWidth="1"/></cols><sheetData>' + rows + '</sheetData></worksheet>';
    var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/><numFmt numFmtId="165" formatCode="hh:mm"/></numFmts><fonts count="2"><font><sz val="12"/><name val="Arial"/></font><font><b/><sz val="12"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFC6F432"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="4"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/><xf numFmtId="164" applyNumberFormat="1"/><xf numFmtId="165" applyNumberFormat="1"/></cellXfs></styleSheet>';
    return [
      ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="الخطة" sheetId="1" r:id="rId1"/><sheet name="القوائم" sheetId="2" r:id="rId2"/></sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', styles], ['xl/worksheets/sheet1.xml', sheet1], ['xl/worksheets/sheet2.xml', sheet2]
    ];
  }
  function xlTemplate() {
    var a = document.createElement('a'); a.href = URL.createObjectURL(zipStore(xlTemplateFiles())); a.download = 'خطة-المحتوى-شفق.xlsx';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  /* قراءة ملف xlsx */
  function unzip(buf) {
    var b = new Uint8Array(buf), dv = new DataView(buf), e = b.length - 22;
    while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) return Promise.reject(new Error('الملف مو ملف إكسل (xlsx).'));
    var n = dv.getUint16(e + 10, true), p = dv.getUint32(e + 16, true), out = {}, jobs = [], dec = new TextDecoder(), total = 0;
    if (n > 500) return Promise.reject(new Error('الملف فيه أجزاء كتير، مو ملف خطة عادي.'));
    for (var i = 0; i < n; i++) {
      var method = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
      var usz = dv.getUint32(p + 24, true), name = dec.decode(b.subarray(p + 46, p + 46 + nl)); p += 46 + nl + xl + cl;
      total += usz; if (total > 40 * 1024 * 1024) return Promise.reject(new Error('محتوى الملف كبير كتير.'));
      if (!/\.(xml|rels)$/.test(name)) continue;
      var start = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true), data = b.subarray(start, start + csz);
      jobs.push((function (name, data, method) {
        if (method === 0) { out[name] = dec.decode(data); return Promise.resolve(); }
        if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('المتصفح قديم. افتح النظام بكروم أو إيدج.'));
        return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text().then(function (t) { out[name] = t; });
      })(name, data, method));
    }
    return Promise.all(jobs).then(function () { return out; });
  }
  function xmlDoc(t) { return new DOMParser().parseFromString(t, 'application/xml'); }
  function byTag(d, tag) { return Array.prototype.slice.call(d.getElementsByTagNameNS('*', tag)); }
  function readXlsx(file) {
    return file.arrayBuffer().then(unzip).then(function (z) {
      var wb = xmlDoc(z['xl/workbook.xml'] || '<w/>'), sheets = byTag(wb, 'sheet');
      if (!sheets.length) throw new Error('ما لقيت صفحات بالملف.');
      var rid = sheets[0].getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || sheets[0].getAttribute('r:id');
      var target = 'worksheets/sheet1.xml';
      byTag(xmlDoc(z['xl/_rels/workbook.xml.rels'] || '<r/>'), 'Relationship').forEach(function (r) { if (r.getAttribute('Id') === rid) target = r.getAttribute('Target'); });
      target = target.replace(/^\/?xl\//, '').replace(/^\//, '');
      var ss = z['xl/sharedStrings.xml'] ? byTag(xmlDoc(z['xl/sharedStrings.xml']), 'si').map(function (si) { return byTag(si, 't').map(function (t) { return t.textContent; }).join(''); }) : [];
      var sh = xmlDoc(z['xl/' + target] || '<w/>'), rows = [];
      byTag(sh, 'row').forEach(function (row) {
        var r = [];
        byTag(row, 'c').forEach(function (c) {
          var ref = c.getAttribute('r') || '', col = 0, m = ref.match(/^[A-Z]+/);
          if (m) { for (var i = 0; i < m[0].length; i++) col = col * 26 + m[0].charCodeAt(i) - 64; col--; } else col = r.length;
          var t = c.getAttribute('t'), v = byTag(c, 'v')[0], val;
          if (t === 's') val = ss[+(v ? v.textContent : 0)] || '';
          else if (t === 'inlineStr') val = byTag(c, 't').map(function (x) { return x.textContent; }).join('');
          else val = v ? v.textContent : '';
          if (t !== 's' && t !== 'inlineStr' && t !== 'str' && val !== '' && !isNaN(+val)) val = +val;
          r[col] = val;
        });
        rows.push(r);
      });
      return rows;
    });
  }

  /* ---------- صفحة الخطة للعميل: قالب إكسل + PDF، بدون Claude ---------- */
  function readBook(file) {
    return file.arrayBuffer().then(unzip).then(function (z) {
      var wb = xmlDoc(z['xl/workbook.xml'] || '<w/>'), sheets = byTag(wb, 'sheet'), rels = {}, out = {};
      byTag(xmlDoc(z['xl/_rels/workbook.xml.rels'] || '<r/>'), 'Relationship').forEach(function (r) { rels[r.getAttribute('Id')] = r.getAttribute('Target'); });
      var ss = z['xl/sharedStrings.xml'] ? byTag(xmlDoc(z['xl/sharedStrings.xml']), 'si').map(function (si) { return byTag(si, 't').map(function (t) { return t.textContent; }).join(''); }) : [];
      sheets.forEach(function (s0) {
        var rid = s0.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || s0.getAttribute('r:id');
        var target = String(rels[rid] || '').replace(/^\/?xl\//, '').replace(/^\//, ''), rows = [];
        byTag(xmlDoc(z['xl/' + target] || '<w/>'), 'row').forEach(function (row) {
          var r = [];
          byTag(row, 'c').forEach(function (c) {
            var ref = c.getAttribute('r') || '', col = 0, m = ref.match(/^[A-Z]+/);
            if (m) { for (var i = 0; i < m[0].length; i++) col = col * 26 + m[0].charCodeAt(i) - 64; col--; } else col = r.length;
            var t = c.getAttribute('t'), v = byTag(c, 'v')[0];
            r[col] = t === 's' ? ss[+(v ? v.textContent : 0)] || '' : t === 'inlineStr' ? byTag(c, 't').map(function (x) { return x.textContent; }).join('') : v ? v.textContent : '';
          });
          if (r.some(function (x) { return String(x == null ? '' : x).trim(); })) rows.push(r.map(function (x) { return String(x == null ? '' : x).trim(); }));
        });
        out[normAr(s0.getAttribute('name') || '')] = rows;
      });
      return out;
    });
  }
  function planFromBook(book, cl, posts) {
    var L = function (v) { return String(v || '').split(/\s*[|\n]\s*/).map(function (x) { return x.trim(); }).filter(Boolean); };
    function sheet(name, cols) {
      var rows = book[normAr(name)] || [], hd = (rows[0] || []).map(normAr), idx = cols.map(function (c) { return hd.indexOf(normAr(c)); });
      return rows.slice(1).map(function (r) { var o = {}; cols.forEach(function (c, i) { o[c] = idx[i] >= 0 ? r[idx[i]] || '' : ''; }); return o; }).filter(function (o) { return cols.some(function (c) { return o[c]; }); });
    }
    var info = {}; (book[normAr('معلومات')] || []).forEach(function (r) { if (r[0]) info[normAr(r[0])] = r[1] || ''; });
    var I = function (k) { return info[normAr(k)] || ''; };
    var goals = sheet('الأهداف', ['العنوان', 'الوصف']), reels = sheet('الريلز', ['الرقم', 'المجموعة', 'التصنيف', 'العنوان', 'الخطوات', 'جاهز', 'الكابشن', 'اللقطات']);
    if (!goals.length && !reels.length) throw new Error('الملف مو قالب خطة شفق: ما لقيت صفحة «الأهداف» ولا «الريلز». نزّل القالب من الزر وعبّيه.');
    var script = sheet('السكريبت', ['رقم الريل', 'المشهد', 'الكلام']), byReel = {};
    script.forEach(function (s) { var n = parseInt(s['رقم الريل'], 10); if (n) (byReel[n] = byReel[n] || []).push({ who: s['المشهد'], say: s['الكلام'] }); });
    var groups = [], gi = {};
    var R = reels.map(function (r, i) {
      var n = parseInt(r['الرقم'], 10) || i + 1, g = r['المجموعة'] || '', o = { n: n, tag: r['التصنيف'], title: r['العنوان'] || ('ريل ' + n), steps: L(r['الخطوات']) };
      if (/^(نعم|اي|أي|جاهز|yes|1)$/i.test(String(r['جاهز']).trim())) o.ready = true;
      if (byReel[n]) o.script = { lines: byReel[n], caption: String(r['الكابشن'] || '').split(/\s*\n\s*/).filter(Boolean), shots: L(r['اللقطات']) };
      if (!(g in gi)) { gi[g] = groups.length; groups.push([g, []]); } groups[gi[g]][1].push(n);
      return o;
    });
    if (groups.length === 1 && R.length > 3) { groups = []; for (var k = 0; k < R.length; k += 3) groups.push(['', R.slice(k, k + 3).map(function (r) { return r.n; })]); }
    var sched = sheet('جدول النشر', ['الأسبوع', 'الريل 1', 'الريل 2', 'الريل 3']), dist = sheet('التوزيع', ['الأسبوع', 'المنشورات', 'الكاروسيل']);
    var sess = sheet('التصوير', ['الجلسة', 'البنود']), style = sheet('أسلوب التصوير', ['البند']);
    var d = {
      v: 1, client: { name: cl.name, en: I('الاسم بالإنجليزي') },
      title: I('العنوان') || 'الخطة التسويقية والمحتوى الشهري', kicker: I('عنوان صغير') || 'خطة الشهر الجديد من شفق ميديا',
      date: I('التاريخ') || dateAr(today()), city: I('المدينة') || 'دمشق', intro: I('المقدمة'),
      goals: { items: goals.map(function (g) { return [g['العنوان'], g['الوصف']]; }), result: I('النتيجة') },
      audience: sheet('الجمهور', ['الفئة']).map(function (a) { return a['الفئة']; }),
      numbers: sheet('الأرقام', ['الرقم', 'الاسم', 'التفصيل']).map(function (x) { return [num(x['الرقم']), x['الاسم'], x['التفصيل']]; }),
      reels_note: I('ملاحظة الريلز'), reels: R, reel_groups: groups,
      posts: { note: I('ملاحظة المنشورات') || 'النص يلي رح ينكتب على كل تصميم', items: sheet('المنشورات', ['العنوان', 'النص']).map(function (p) { return [p['العنوان'], p['النص']]; }) },
      carousels: { note: I('ملاحظة الكاروسيلات'), items: sheet('الكاروسيلات', ['العنوان', 'النوع', 'الشرائح']).map(function (c) { return { title: c['العنوان'], sub: c['النوع'], slides: L(c['الشرائح']) }; }) }
    };
    if (I('الوجه الإعلامي')) d.face = { label: 'الوجه الإعلامي', name: I('الوجه الإعلامي'), role: I('دور الوجه الإعلامي'), points: L(I('نقاط الوجه الإعلامي')) };
    if (sched.length) d.schedule = { note: I('ملاحظة الجدول'), days: I('أيام النشر'), time: I('ساعة النشر'), cols: ['الريل الأول', 'الريل الثاني', 'الريل الثالث'], rows: sched.map(function (s) { return [s['الأسبوع'], s['الريل 1'], s['الريل 2'], s['الريل 3']]; }), foot: I('ملاحظة أسفل الجدول') };
    if (dist.length) d.distribution = { note: I('ملاحظة التوزيع'), cols: ['المنشورات الثابتة', 'الكاروسيل'], rows: dist.map(function (s) { return [s['الأسبوع'], s['المنشورات'], s['الكاروسيل']]; }) };
    if (sess.length || style.length) d.shoot = { note: I('ملاحظة التصوير'), sessions: sess.map(function (s) { return [s['الجلسة'], L(s['البنود'])]; }), style: style.map(function (s) { return s['البند']; }) };
    // التقويم من خطة المحتوى بالتطبيق: شهر الخطة + أول أسبوع من الشهر الجاي
    var dated = posts.filter(function (p) { return p.date; });
    if (dated.length) {
      var cnt = {}; dated.forEach(function (p) { var m = p.date.slice(0, 7); cnt[m] = (cnt[m] || 0) + 1; });
      var ym = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a] || (a < b ? -1 : 1); })[0], nx = addMonths(ym + '-15', 1).slice(0, 7);
      d.calendar = { month: ym, title: 'تقويم النشر', note: 'كل يوم شو رح ينزل، ومتى', items: dated.filter(function (p) { return p.date.slice(0, 7) === ym || (p.date.slice(0, 7) === nx && +p.date.slice(8, 10) <= 7); }).sort(function (a, b) { return (a.date + (a.time || '')) < (b.date + (b.time || '')) ? -1 : 1; }).map(function (p) { return { d: p.date, t: p.time || '', type: p.type || 'منشور', title: p.name || '' }; }) };
    }
    return d;
  }
  function rnd(n) { var a = new Uint8Array(n), s = ''; crypto.getRandomValues(a); a.forEach(function (x) { s += ('0' + x.toString(16)).slice(-2); }); return s; }
  function logoBlob(file) {
    return new Promise(function (ok, no) {
      var rd = new FileReader(); rd.onerror = function () { no(new Error('تعذر قراءة الشعار')); };
      rd.onload = function () { var img = new Image(); img.onerror = function () { no(new Error('الشعار مو صورة')); }; img.onload = function () { var s = 320, cv = document.createElement('canvas'); cv.width = cv.height = s; var m = Math.min(img.width, img.height); cv.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s); cv.toBlob(function (b) { b ? ok(b) : no(new Error('تعذر تجهيز الشعار')); }, 'image/webp', .85); }; img.src = rd.result; };
      rd.readAsDataURL(file);
    });
  }
  function planUrl(tok) { return location.origin + '/p/' + tok; }
  function loadPlanInfo(id) {
    if (mstate.pinfo[id] !== undefined || mstate.pload[id]) return;
    if (!ONLINE) { var s0 = db.settings['plan_' + id]; mstate.pinfo[id] = s0 ? { token: 'demo', active: s0.active !== false, updated_at: s0.at, pdf: s0.data.pdf, logo: s0.data.client.logo } : null; return; }
    mstate.pload[id] = 1;
    SRV.rpc('plan_info', { p_client: id }).then(function (r) { mstate.pinfo[id] = r || null; }, function (e) { mstate.pinfo[id] = { err: /plan_info|function/i.test(e.message || '') ? 'شغّل ملف 11-plan-pages.sql على Supabase أول.' : e.message }; }).then(function () { mstate.pload[id] = 0; render(); });
  }
  function planBox(cl) {
    var id = cl.id; loadPlanInfo(id);
    var pi = mstate.pinfo[id], tpl = '<a class="btn" href="plan-template.xlsx" download="قالب-خطة-شفق.xlsx">تحميل قالب الخطة</a>';
    var c = '<section class="planbox"><div class="pb-h"><h2>صفحة الخطة للعميل</h2>';
    if (pi === undefined) return c + '<p class="mu">جارٍ التحقق…</p></div></section>';
    if (pi && pi.err) return c + '<p class="warn">' + h(pi.err) + '</p></div></section>';
    if (!pi) return c + '<p class="mu">عبّي قالب الخطة، وارفعه مع ملف الـ PDF، والصفحة والرابط بيطلعوا لحالهم. العميل بيشوفها بتبويب «الخطة» بالبوابة.</p></div><div class="acts">' + btn('إنشاء صفحة الخطة', 'planMake', { id: id }, 'pri') + tpl + '</div></section>';
    var url = pi.token === 'demo' ? '' : planUrl(pi.token);
    return c + '<p class="mu">' + (pi.active ? 'الرابط شغّال' : 'الرابط موقوف') + (pi.updated_at ? ' · آخر تحديث ' + h(dateAr(String(pi.updated_at).slice(0, 10))) : '') + (pi.pdf ? ' · فيها ملف PDF' : '') + '</p></div>' +
      (url ? '<div class="pb-link"><span class="ltr">' + h(url.replace(/^https?:\/\//, '')) + '</span>' + btn('نسخ الرابط', 'planCopy', { u: url }, 'sm') + '<a class="btn sm" target="_blank" rel="noopener" href="' + h(url) + '">فتح</a></div>' : '<p class="mu">بالنسخة التجريبية الرابط ما بيشتغل، بس العميل بيشوف الخطة بتبويب «الخطة».</p>') +
      '<div class="acts">' + btn('تحديث الخطة', 'planMake', { id: id }, 'pri') + btn(pi.active ? 'إيقاف الرابط' : 'تفعيل الرابط', 'planToggle', { id: id }) + tpl + '</div></section>';
  }
  function makePlan(id) {
    var cl = byId('clients', id), pi = mstate.pinfo[id] || {};
    openForm('صفحة الخطة · ' + cl.name, [
      { k: 'xl', label: 'ملف الخطة (قالب الإكسل)', type: 'file', accept: '.xlsx', wide: true },
      { k: 'pdf', label: 'ملف الخطة PDF' + (pi.pdf ? ' (موجود، ارفع جديد بس إذا بدك تبدّله)' : ' (اختياري)'), type: 'file', accept: 'application/pdf,.pdf', wide: true },
      { k: 'logo', label: 'شعار العميل' + (pi.logo ? ' (موجود)' : ' (اختياري)'), type: 'file', accept: 'image/*', wide: true }
    ], function () {
      var xf = (document.getElementById('m_xl').files || [])[0], pf = (document.getElementById('m_pdf').files || [])[0], lf = (document.getElementById('m_logo').files || [])[0];
      if (!xf) return { err: 'ارفع ملف الخطة (قالب الإكسل).' };
      if (!/\.xlsx$/i.test(xf.name) || xf.size > 5 * 1024 * 1024) return { err: 'ملف الخطة لازم يكون إكسل .xlsx وحجمه أقل من 5 ميغا.' };
      if (pf && (!/\.pdf$/i.test(pf.name) || pf.size > 25 * 1024 * 1024)) return { err: 'ملف الـ PDF لازم يكون .pdf وحجمه أقل من 25 ميغا.' };
      var posts = items('post').filter(function (x) { return x.client_id === id; }), data;
      return readBook(xf).then(function (book) {
        data = planFromBook(book, cl, posts);
        if (pi.pdf && !pf) data.pdf = pi.pdf;
        if (pi.logo && !lf) data.client.logo = pi.logo;
        if (!ONLINE) {
          var jobs = [];
          if (lf) jobs.push(logoBlob(lf).then(function (b) { return new Promise(function (ok) { var r = new FileReader(); r.onload = function () { data.client.logo = r.result; ok(); }; r.readAsDataURL(b); }); }));
          return Promise.all(jobs).then(function () {
            db.settings['plan_' + id] = { data: data, at: today(), active: true }; try { localStorage.setItem('shafq.demo.plan', JSON.stringify(data)); } catch (e) {}
            mstate.pinfo[id] = undefined; return 'انعملت صفحة الخطة';
          });
        }
        var base = id + '/' + rnd(8), up = [];
        if (pf) up.push(SRV.upload('plan-files', base + '.pdf', pf).then(function (u) { data.pdf = u; }));
        if (lf) up.push(logoBlob(lf).then(function (b) { return SRV.upload('plan-files', base + '-logo.webp', b); }).then(function (u) { data.client.logo = u; }));
        return Promise.all(up).then(function () { return SRV.rpc('save_plan', { p_client: id, p_data: data }); }).then(function (tok) {
          mstate.pinfo[id] = { token: tok, active: true, updated_at: new Date().toISOString(), pdf: data.pdf, logo: data.client.logo };
          notify([{ to: { client: id }, title: 'نزلت خطة الشهر', body: 'فوت على تبويب «الخطة» لتشوفها كاملة', tag: 'plan', url: './#/plan' }]);
          return 'جاهزة · الرابط: ' + planUrl(tok);
        });
      }).catch(function (e) { return { err: e && e.message ? e.message : 'صار خطأ، جرّب مرة تانية.' }; });
    }, 'التقويم بيتعبّى لحاله من خطة المحتوى تبع العميل بالتطبيق. الأهداف والريلز والسكريبتات والمنشورات من قالب الإكسل.', 'إنشاء الصفحة');
  }
  function normAr(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ً-ْـ]/g, '').replace(/\s+/g, ' '); }
  function findBy(list, name, get) {
    var n = normAr(name); if (!n) return null;
    return list.filter(function (x) { return normAr(get(x)) === n; })[0] || list.filter(function (x) { var g = normAr(get(x)); return g && (g.indexOf(n) >= 0 || n.indexOf(g) >= 0); })[0] || null;
  }
  function arDigits(s) { return String(s == null ? '' : s).trim().replace(/[٠-٩]/g, function (c) { return c.charCodeAt(0) - 1632; }); }
  function xlDate(v) {
    if (typeof v === 'number') return new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10);
    var s = arDigits(v), m;
    if ((m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/))) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
    if ((m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/))) return (m[3].length === 2 ? '20' + m[3] : m[3]) + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
    return '';
  }
  function xlTime(v) {
    if (typeof v === 'number') { var mins = Math.round((v % 1) * 1440); return ('0' + (Math.floor(mins / 60) % 24)).slice(-2) + ':' + ('0' + (mins % 60)).slice(-2); }
    var s = arDigits(v), m = s.match(/(\d{1,2})(?::(\d{2}))?\s*(ص|م|am|pm)?/i);
    if (!s || !m) return '';
    var hh = +m[1], suf = m[3] || '';
    if (/م|pm/i.test(suf) && hh < 12) hh += 12;
    if (/ص|am/i.test(suf) && hh === 12) hh = 0;
    return ('0' + hh).slice(-2) + ':' + (m[2] || '00');
  }
  function planFromRows(rows) {
    var hi = -1, map = {};
    for (var i = 0; i < Math.min(rows.length, 10) && hi < 0; i++) { if ((rows[i] || []).some(function (x) { return normAr(x) === normAr('العنوان'); })) hi = i; }
    if (hi < 0) throw new Error('ما لقيت عمود «العنوان». استعمل قالب شفق، أو خلّي أول سطر فيه أسماء الأعمدة.');
    (rows[hi] || []).forEach(function (x, i) { XL_COLS.forEach(function (c) { if (normAr(x) === normAr(c)) map[c] = i; }); });
    var team = db.users.filter(function (u) { return u.role !== 'client'; }), ok = [], dup = 0, warn = [], seen = {};
    items('post').forEach(function (p) { seen[(p.client_id || '') + '|' + (p.date || '') + '|' + normAr(p.name)] = 1; });
    if (rows.length > 3000) throw new Error('الملف فيه أكتر من 3000 سطر. قسّمه لملفات أصغر.');
    rows.slice(hi + 1).forEach(function (r, i) {
      r = r || [];
      var g = function (c) { var v = map[c] == null ? '' : r[map[c]]; return v == null ? '' : v; }, line = hi + i + 2;
      var name = String(g('العنوان')).trim(); if (!name) return;
      var cl = findBy(db.clients, g('العميل'), function (x) { return x.name; }), ow = findBy(team, g('المسؤول'), function (x) { return x.name; });
      var type = findBy(XL_TYPES, g('النوع'), function (x) { return x; }) || (String(g('النوع')).trim() || 'بوست');
      var st = findBy(MODS.content.statuses, g('الحالة'), function (x) { return x; }) || 'تحضير';
      var date = xlDate(g('التاريخ')), time = xlTime(g('الساعة'));
      if (g('العميل') !== '' && !cl) warn.push('سطر ' + line + ': العميل «' + g('العميل') + '» مو موجود، انضاف بدون عميل');
      if (g('المسؤول') !== '' && !ow) warn.push('سطر ' + line + ': «' + g('المسؤول') + '» مو من الفريق');
      if (g('التاريخ') !== '' && !date) warn.push('سطر ' + line + ': التاريخ «' + g('التاريخ') + '» مو مفهوم');
      var key = (cl ? cl.id : '') + '|' + date + '|' + normAr(name);
      if (seen[key]) { dup++; return; }
      seen[key] = 1;
      ok.push({ id: uid(), kind: 'post', status: st, created: today(), name: name, client_id: cl ? cl.id : '', type: type, owner: ow ? ow.id : '', date: date, time: time, notes: String(g('ملاحظات')).trim() });
    });
    return { ok: ok, dup: dup, warn: warn };
  }
  function importPlan(file) {
    readXlsx(file).then(function (rows) {
      var res = planFromRows(rows), ok = res.ok;
      if (!ok.length && !res.dup) throw new Error('الملف ما فيه منشورات. عبّي عمود «العنوان» على الأقل.');
      var byC = {}; ok.forEach(function (p) { var n = p.client_id ? clientName(p.client_id) : 'بدون عميل'; byC[n] = (byC[n] || 0) + 1; });
      var html = '<p><b>' + ok.length + '</b> منشور جاهز للإضافة' + (res.dup ? ' · <b>' + res.dup + '</b> موجود من قبل وما رح يتكرر' : '') + '</p>' +
        (ok.length ? '<p>' + Object.keys(byC).map(function (k) { return h(k) + ': ' + byC[k]; }).join(' · ') + '</p>' : '') +
        (res.warn.length ? '<p class="warn">' + res.warn.slice(0, 8).map(h).join('<br>') + (res.warn.length > 8 ? '<br>و' + (res.warn.length - 8) + ' ملاحظات تانية' : '') + '</p>' : '');
      openForm('استيراد خطة المحتوى', [], function () {
        if (!ok.length) return 'ما في شي جديد';
        db.items = db.items.concat(ok); return 'انضاف ' + ok.length + ' منشور للخطة';
      }, { html: html }, ok.length ? 'إضافة ' + ok.length + ' منشور' : 'تمام');
    }).catch(function (e) { toast('تعذر قراءة الملف: ' + (e && e.message || e)); });
  }
  Object.assign(acts, { xlTemplate: function () { xlTemplate(); toast('تنزّل القالب. عبّيه وارجع ارفعه من «رفع ملف إكسل»'); } });

  /* ---------- الأحداث ---------- */
  function formVals(f) { var v = {}; Array.prototype.forEach.call(f.elements, function (e) { if (!e.name) return; if (e.type === 'checkbox') { if (!(e.name in v)) v[e.name] = ''; if (e.checked) v[e.name] = v[e.name] ? v[e.name] + '، ' + e.value : e.value; return; } v[e.name] = e.value; }); return v; }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); if (!el) { var mn = document.querySelector('details.menu[open]'); if (mn && !e.target.closest('details.menu')) mn.removeAttribute('open'); return; }
    var a = el.getAttribute('data-act');
    var omn = el.closest('details.menu'); if (omn) omn.removeAttribute('open');
    if (a === 'forgotOpen') { fstate = { open: true, sent: false, phone: (document.getElementById('l_phone') || {}).value || '', wa: '' }; render(); return; }
    if (a === 'forgotClose') { fstate.open = false; fstate.sent = false; render(); return; }
    if (!acts[a]) return;
    if (!isMgr() && ['close', 'theme', 'logout', 'retry', 'delPhoto', 'chPass', 'portalRefresh', 'portalMonth', 'pushOn', 'pushLater', 'pushTest', 'moreNav', 'msgAdmin', 'review', 'reviewEdit'].indexOf(a) < 0) return;
    acts[a](el.dataset);
  });
  document.addEventListener('change', function (e) {
    var el = e.target, k = el.getAttribute && el.getAttribute('data-chg'); if (!k) return;
    if (k === 'teamspec') { mstate.teamSpec = el.value; render(); return; }
    if (k === 'rate' && isMgr()) { var r = num(el.value); if (r > 0) { db.rates[today()] = r; toast('حُفظ سعر الصرف'); } else delete db.rates[today()]; save(); render(); }
    if (k === 'task') { var t = byId('tasks', el.dataset.id); if (t && (isMgr() || t.user_id === me().id)) { t.done = el.checked; t.done_at = el.checked ? today() : ''; save(); render(); if (el.checked && !isMgr()) notify([{ to: 'managers', title: (me().gender === 'f' ? 'أنجزت ' : 'أنجز ') + me().name + ' مهمة', body: t.title, tag: 'done' }]); } }
    if (k === 'istatus' && isMgr()) { var it = byId('items', el.dataset.id); if (it) { var was = it.status; it.status = el.value; save(); render(); if (it.kind === 'post' && el.value === 'منشور' && was !== 'منشور' && it.client_id) notify([{ to: { client: it.client_id }, title: 'نزل منشور جديد', body: '«' + (it.name || '') + '»' + (it.type ? ' · ' + it.type : ''), tag: 'post' }]); } }
    if ((k === 'rolename' || k === 'roleuser') && isMgr()) { var c = byId('clients', el.dataset.id), rs = normRoles(c).slice(), i = +el.dataset.i; rs[i] = Object.assign({}, rs[i]); rs[i][k === 'rolename' ? 'role' : 'user'] = k === 'rolename' ? el.value.trim() : el.value; c.roles = rs; save(); render(); }
    if (k === 'shafqph' && isMgr()) { db.settings.shafq_phone = el.value.trim(); save(); render(); toast('حُفظ رقم شفق'); }
    if (k === 'xlfile' && isMgr() && el.files[0]) { var xf = el.files[0]; el.value = ''; if (!/\.xlsx$/i.test(xf.name) || xf.size > 5 * 1024 * 1024) { toast('ارفع ملف إكسل .xlsx حجمه أقل من 5 ميغا'); return; } importPlan(xf); }
    if (k === 'photo' && el.files[0] && (!/^image\/(png|jpe?g|webp|gif|heic|heif)$/i.test(el.files[0].type) || el.files[0].size > 15 * 1024 * 1024)) { toast('ارفع صورة (JPG أو PNG) حجمها أقل من 15 ميغا'); el.value = ''; return; }
    if (k === 'photo' && el.files[0]) { var rd = new FileReader(); rd.onload = function () { var img = new Image(); img.onload = function () { var s = 256, cv = document.createElement('canvas'); cv.width = cv.height = s; var m = Math.min(img.width, img.height); cv.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s); me().photo = cv.toDataURL('image/jpeg', 0.85); save(); render(); toast('حُفظت الصورة'); }; img.src = rd.result; }; rd.readAsDataURL(el.files[0]); }
    if (k === 'restore' && isMgr() && el.files[0]) { var fr = new FileReader(); fr.onload = function () { try { var d = JSON.parse(fr.result); if (!d.users || !d.moves) throw 0; if (!confirm('استرجاع النسخة يستبدل كل البيانات الحالية. متابعة؟')) return; localStorage.setItem(KEY, JSON.stringify(d)); load(); render(); toast('تم الاسترجاع'); } catch (x) { toast('الملف غير صالح'); } }; fr.readAsText(el.files[0]); }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target, kind = f.getAttribute('data-form'); if (!kind) return; e.preventDefault(); var v = formVals(f);
    if (kind === 'modal' && formCb) {
      Promise.resolve().then(function () { return formCb(v); }).then(function (res) { if (res && res.err) { document.getElementById('merr').textContent = res.err; return; } save(); closeForm(); render(); if (typeof res === 'string') toast(res); }, function (e) { var m = document.getElementById('merr'); if (m) m.textContent = e.message || 'حدث خطأ.'; });
    }
    if (kind === 'setup') {
      if (!ONLINE && db.users.length) return; var ph = normPhone(v.phone), er = document.getElementById('aerr');
      if (!ph) { er.textContent = 'أدخل رقم موبايل صحيحاً.'; return; } if (v.pass.length < 8) { er.textContent = 'كلمة السر 8 أحرف على الأقل.'; return; }
      if (ONLINE) {
        er.textContent = 'جارٍ إنشاء الحساب…';
        SRV.signUp(v.phone, v.pass, true).then(function () { return SRV.bootstrap(v.name.trim(), v.phone.trim()); }).then(function () { return SRV.pull(); }).then(function (d) { db = d; state.needSetup = false; location.hash = '#/'; render(); }, function (e) { var x = document.getElementById('aerr'); SRV.clear(); if (x) x.textContent = e.message; });
        return;
      }
      var salt = uid(); hash(v.pass, salt).then(function (hh) { var u = { id: uid(), name: v.name.trim(), phone: v.phone.trim(), role: 'manager', title: 'المدير', active: true, pass: hh, salt: salt }; db.users.push(u); save(); localStorage.setItem(SKEY, u.id); render(); });
    }
    if (kind === 'forgot') {
      var fp = String(v.phone || '').trim(); if (!normPhone(fp)) { document.getElementById('aerr').textContent = 'أدخل رقم موبايل صحيحاً.'; return; }
      var fb = e.target.querySelector('button[type=submit]'); fb.disabled = true; fb.textContent = 'جارٍ الإرسال…';
      SRV.forgot(fp).then(function (r) {
        var ph = (r && r.phone) || CFG.shafqPhone || '';
        fstate.phone = fp; fstate.sent = true;
        fstate.wa = ph ? waTo(ph, 'السلام عليكم، نسيت كلمة السر لحسابي بنظام شفق.\nرقمي: ' + fp + '\nبرجاء إعادة تعيين كلمة السر. شكراً') : '';
        render();
      });
      return;
    }
    if (kind === 'login') {
      if (ONLINE) {
        var ee = document.getElementById('aerr'); ee.textContent = 'جارٍ الدخول…';
        SRV.signIn(v.phone, v.pass).then(function () { return SRV.pull(); }).then(function (d) {
          db = d; if (!me()) { return SRV.signOut().then(function () { throw new Error('هذا الحساب غير مفعّل. راجع المدير.'); }); }
          location.hash = '#/'; render();
        }).catch(function (e) { var x = document.getElementById('aerr'); if (x) x.textContent = e.message; });
        return;
      }
      var u = db.users.filter(function (x) { return normPhone(x.phone) === normPhone(v.phone); })[0], er2 = document.getElementById('aerr');
      if (!u) { er2.textContent = 'الرقم أو كلمة السر غير صحيحة.'; return; }
      hash(v.pass, u.salt).then(function (hh) { if (hh !== u.pass) { er2.textContent = 'الرقم أو كلمة السر غير صحيحة.'; return; } if (u.active === false) { er2.textContent = 'هذا الحساب موقوف. راجع المدير.'; return; } localStorage.setItem(SKEY, u.id); location.hash = '#/'; render(); });
    }
    if (kind === 'profile') {
      var m = me(), ph2 = normPhone(v.phone);
      if (!v.name.trim() || !ph2) { document.getElementById('perr').textContent = 'الاسم ورقم التواصل مطلوبان.'; return; }
      if (db.users.some(function (x) { return x.id !== m.id && normPhone(x.phone) === ph2; })) { document.getElementById('perr').textContent = 'هذا الرقم مسجل لحساب آخر.'; return; }
      ['name', 'title', 'phone', 'email', 'city', 'insta', 'bio'].forEach(function (k) { m[k] = (v[k] || '').trim(); }); m.gender = v.gender === 'f' ? 'f' : 'm'; save(); render(); toast('حُفظ الملف');
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !document.getElementById('modal').hidden) closeForm(); });

  /* ---------- التشغيل ---------- */
  function render() {
    var app = document.getElementById('app'), r = route(), html;
    if (ONLINE && !state.ready) html = vLoading();
    else if (ONLINE && state.err) html = authCard('<h1>تعذر الاتصال</h1><p>' + h(state.err) + '</p>' + btn('إعادة المحاولة', 'retry', {}, 'pri'));
    else if (ONLINE && !SRV.hasSession()) html = state.needSetup ? vSetup() : fstate.open ? vForgot() : vLogin();
    else if (ONLINE && !me()) html = authCard('<h1>الحساب غير مفعّل</h1><p>هذا الحساب لا يملك ملفاً في النظام أو تم إيقافه. راجع المدير.</p>' + btn('تسجيل الخروج', 'logout'));
    else if (!ONLINE && !db.users.length) html = vSetup();
    else if (!ONLINE && !me()) html = vLogin();
    else if (r === '#/notes') html = vNotes();
    else if (me().role === 'client') html = vPortal();
    else if (!isMgr()) { if (r === '#/profile') html = vProfile(); else if (r === '#/tasks') html = vMemberTasks(); else if (r === '#/clients') html = vMemberClients(); else if (r === '#/money') html = vMemberMoney(); else if (r.indexOf('#/mc/') === 0) html = vMemberClient(decodeURIComponent(r.slice(5))); else if (r === '#/' || r === '') html = vMemberHome(); else { location.hash = '#/'; return; } }
    else if (r === '#/clients') html = vClients();
    else if (/^#\/client\/[^/]+\/plan$/.test(r)) html = vClientPlan(r.slice(9, -5));
    else if (r.indexOf('#/client/') === 0) html = vClient(r.slice(9));
    else if (r === '#/team') html = vTeam();
    else if (r === '#/tasks') html = vTasks();
    else if (r === '#/finance') html = vFinance();
    else if (r === '#/profile') html = vProfile();
    else if (r.indexOf('#/m/') === 0 && MODS[r.slice(4)]) html = vMod(r.slice(4));
    else if (r === '#/calendar') html = vCalendar();
    else if (r === '#/reports') html = vReports();
    else if (r === '#/reporter') html = vReporter();
    else if (r.indexOf('#/soon/') === 0) html = vSoon(decodeURIComponent(r.slice(7)));
    else if (r === '#/full') html = vDash();
    else html = isPhone() ? vDashSimple() : vDash();
    if (me() && me().role !== 'client' && (r === '#/' || r === '')) html = html.replace(/<div class="(head|hello)"/, function (m) { return pushBanner() + m; });
    if (ONLINE && SRV.hasSession() && me() && state.ready) pushSync();
    var openTiles = Array.prototype.map.call(app.querySelectorAll('details.tile'), function (d) { return d.open; }), same = app.getAttribute('data-r') === r;
    app.innerHTML = html; app.setAttribute('data-r', r); if (me()) updateBadge();
    if (same) Array.prototype.forEach.call(app.querySelectorAll('details.tile'), function (d, i) { if (openTiles[i] != null) d.open = openTiles[i]; });
    tick();
  }
  function enter() { var a = document.getElementById('app'); if (!a) return; a.classList.remove('enter'); void a.offsetWidth; a.classList.add('enter'); clearTimeout(enter.t); enter.t = setTimeout(function () { a.classList.remove('enter'); }, 900); }
  function themeMeta() { var c = document.body.classList.contains('t-light') ? '#F5F5F0' : '#141414'; var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', c); }
  function tick() { var c = document.getElementById('clock'); if (c) { var d = new Date(), t = pad(d.getHours()) + ':' + pad(d.getMinutes()); if (c.textContent !== t) c.textContent = t; } }
  function start() {
    if (localStorage.getItem(TKEY) === 'light') { document.body.classList.remove('t-dark'); document.body.classList.add('t-light'); } themeMeta();
    load(); if (ONLINE) boot(); else render(); setInterval(tick, 5000);
    if (ONLINE) {
      var soft = function () { var a = document.activeElement, typing = a && /INPUT|TEXTAREA|SELECT/.test(a.tagName); if (SRV.hasSession() && state.ready && document.getElementById('modal').hidden && !typing) SRV.idle().then(resync); };
      window.addEventListener('focus', soft); setInterval(soft, 120000);
    }
    if (window.matchMedia) { var mq = window.matchMedia('(max-width:900px)'); var onMq = function () { if (route() === '#/' && isMgr && me() && isMgr()) render(); }; if (mq.addEventListener) mq.addEventListener('change', onMq); }
    window.addEventListener('hashchange', function () { document.body.classList.remove('navopen'); if (route() === '#/notes') nstate.list = null; enter(); render(); window.scrollTo(0, 0); });
    if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', function (e) { if (e.data && e.data.type === 'note') { if (route() === '#/notes') nstate.list = null; updateBadge(); if (route() === '#/notes') render(); } });
    enter();
    /* demo: no service worker */
  }
  window.SHAFQ = { render: render, db: function () { return db; }, save: function () { save(); render(); } };
  start();
})();

(function () {
  'use strict';
  var WA = '966563079286';
  function wa(text) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function safeSrc(u) { u = String(u || ''); return /^(media\/|assets\/)[\w\-./]+$/.test(u) && u.indexOf('..') < 0 ? u : ''; }

  // WhatsApp links
  function bindWa(root) {
    $$('[data-wa]', root).forEach(function (a) { a.href = wa(a.getAttribute('data-wa')); a.target = '_blank'; a.rel = 'noopener'; });
  }
  bindWa(document);

  // nav
  var nav = $('#nav');
  function onScroll() { nav.classList.toggle('s', window.scrollY > 20); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var burger = $('#burger'), mm = $('#mmenu');
  burger.addEventListener('click', function () { var o = mm.classList.toggle('open'); burger.setAttribute('aria-expanded', o ? 'true' : 'false'); });
  $$('#mmenu a').forEach(function (a) { a.addEventListener('click', function () { mm.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }); });

  // services
  var ICON = {
    social: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
    aerial: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/><path d="M8 8l1 1M16 8l-1 1M8 16l1-1M16 16l-1-1"/>',
    events: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    wedding: '<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M10 4l2 3 2-3"/>',
    digital: '<path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>'
  };
  var SERVICES = [
    { id: 'social', t: 'إدارة حسابات التواصل', d: 'خطة ومحتوى ونشر وتقرير شهري بالأرقام.', long: 'نضع لحسابك خطة محتوى شهرية، ونصمم المنشورات وننشرها، ونتابع التعليقات والرسائل، ونرسل لك تقريراً بالأرقام كل شهر.' },
    { id: 'video', t: 'إنتاج الفيديو والمونتاج', d: 'ريلز وإعلانات وحلقات يوتيوب وبودكاست.', long: 'نصوّر ونحرّر الريلز والإعلانات وحلقات يوتيوب والبودكاست، بأسلوب يناسب علامتك وجمهورك.' },
    { id: 'aerial', t: 'التصوير الجوي', d: 'لقطات جوية احترافية للمشاريع والفعاليات.', long: 'لقطات جوية بدقة عالية للمشاريع والعقارات والفعاليات، بتصوير احترافي ومعدات حديثة.' },
    { id: 'events', t: 'تغطية المؤتمرات والمعارض', d: 'تصوير شامل ومحتوى جاهز خلال أيام.', long: 'نغطي مؤتمرك أو معرضك بالكامل: تصوير فوتوغرافي وفيديو، ومحتوى جاهز للنشر خلال أيام.' },
    { id: 'wedding', t: 'الأعراس والمناسبات', d: 'صور وفيديو يحفظان أجمل لحظاتك.', long: 'نوثّق عرسك ومناسباتك بالصور والفيديو، لتبقى أجمل اللحظات معك دائماً.' },
    { id: 'digital', t: 'الحلول الرقمية', d: 'مواقع وتطبيقات وأنظمة إدارة وبوتات ردود.', long: 'نبني مواقع إلكترونية وتطبيقات جوال وأنظمة إدارة وبوتات ردود تلقائية، على قياس عملك.' }
  ];
  var svc = $('#svc');
  svc.innerHTML = SERVICES.map(function (s) {
    return '<button class="card hov rv" type="button" data-svc="' + s.id + '"><div class="ico"><svg viewBox="0 0 24 24">' + ICON[s.id] + '</svg></div><div class="t">' + esc(s.t) + '</div><div class="d">' + esc(s.d) + '</div><span class="more">التفاصيل والأعمال ←</span></button>';
  }).join('');

  // works (from content.json; only items with real media are shown)
  var WORKS = [];
  var CAT = { social: 'إدارة الحسابات', video: 'الفيديو', aerial: 'التصوير الجوي', events: 'المؤتمرات والمعارض', wedding: 'المناسبات', digital: 'الحلول الرقمية' };
  // أعمال من مجلد «خدماتنا» على Google Drive (بتتحدث لحالها)
  function driveId(v) { v = String(v || ''); return /^[\w-]{10,80}$/.test(v) ? v : ''; }
  function thumb(id, w) { return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w' + (w || 900); }
  function itemHtml(w, i) {
    var did = driveId(w.drive), img = did ? thumb(did) : safeSrc(w.image), vid = did ? (w.kind === 'video') : safeSrc(w.video);
    var media = img && (did || !vid) ? '<img src="' + img + '" alt="' + esc(w.title) + '" loading="lazy" referrerpolicy="no-referrer">' : '<video src="' + vid + '#t=0.5" muted playsinline preload="metadata"></video>';
    return '<div class="witem" role="button" tabindex="0" data-w="' + i + '">' + media + ((w.drive ? w.kind === 'video' : vid) ? '<span class="play"><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg></span>' : '') + (w.title ? '<div class="cap">' + esc(w.title) + '</div>' : '') + '</div>';
  }
  function renderWorks(cat) {
    var list = WORKS.map(function (w, i) { return [w, i]; }).filter(function (p) { return !cat || p[0].service === cat; });
    $('#wgrid').innerHTML = list.map(function (p) { return itemHtml(p[0], p[1]); }).join('');
  }
  function initWorks() {
    if (!WORKS.length) { var b = $('[data-alt-work]'); if (b) b.hidden = true; return; }
    $('#work').hidden = false;
    $$('[data-work-link]').forEach(function (a) { a.hidden = false; });
    var b = $('[data-alt-work]'); if (b) { b.textContent = 'شاهد أعمالنا'; b.href = '#work'; }
    var cats = [];
    WORKS.forEach(function (w) { if (CAT[w.service] && cats.indexOf(w.service) < 0) cats.push(w.service); });
    var f = $('#filters');
    f.innerHTML = '<button class="on" data-cat="">الكل</button>' + cats.map(function (c) { return '<button data-cat="' + c + '">' + CAT[c] + '</button>'; }).join('');
    f.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      $$('button', f).forEach(function (x) { x.classList.toggle('on', x === b); });
      renderWorks(b.getAttribute('data-cat'));
    });
    renderWorks('');
    observe();
  }
  fetch('content.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (d) {
    WORKS = (d && Array.isArray(d.works) ? d.works : []).filter(function (w) { return w && (safeSrc(w.image) || safeSrc(w.video)); }).map(function (w) {
      return { title: String(w.title || '').slice(0, 80), service: w.service || '', image: w.image || '', video: w.video || '' };
    });
    var api = d && typeof d.drive === 'string' && /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(d.drive) ? d.drive : '';
    if (!api) return initWorks();
    return fetch(api).then(function (r) { return r.ok ? r.json() : {}; }).then(function (x) {
      (x && Array.isArray(x.works) ? x.works : []).forEach(function (w) {
        if (driveId(w.id) && CAT[w.service] && (w.kind === 'image' || w.kind === 'video')) WORKS.push({ title: String(w.title || '').slice(0, 80), service: w.service, drive: w.id, kind: w.kind });
      });
    }).catch(function () {}).then(initWorks);
  }).catch(function () { initWorks(); });

  // lightbox
  var lb = $('#lb'), lbin = $('#lbin');
  function openLb(w) {
    var did = driveId(w.drive), img = safeSrc(w.image), vid = safeSrc(w.video);
    if (did) lbin.innerHTML = w.kind === 'video' ? '<iframe class="dv" src="https://drive.google.com/file/d/' + did + '/preview" allow="autoplay; fullscreen" allowfullscreen title="' + esc(w.title) + '"></iframe>' : '<img src="' + thumb(did, 2000) + '" alt="' + esc(w.title) + '" referrerpolicy="no-referrer">';
    else lbin.innerHTML = vid ? '<video src="' + vid + '" controls autoplay playsinline></video>' : '<img src="' + img + '" alt="' + esc(w.title) + '">';
    lb.classList.add('open');
  }
  function closeLb() { lb.classList.remove('open'); lbin.innerHTML = ''; }
  $('#lbclose').addEventListener('click', closeLb);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('click', function (e) {
    var it = e.target.closest('.witem'); if (it) openLb(WORKS[+it.getAttribute('data-w')]);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('witem')) openLb(WORKS[+e.target.getAttribute('data-w')]);
  });

  // service modal
  var modal = $('#modal'), lastFocus = null;
  function openSvc(id) {
    var s = SERVICES.filter(function (x) { return x.id === id; })[0]; if (!s) return;
    $('#mtitle').textContent = s.t; $('#mdesc').textContent = s.long;
    var mine = WORKS.map(function (w, i) { return [w, i]; }).filter(function (p) { return p[0].service === id; });
    $('#mgal').innerHTML = mine.length ? '<div class="gal">' + mine.map(function (p) { return itemHtml(p[0], p[1]); }).join('') + '</div>'
      : (id === 'digital' ? '<div class="empty">شاهد قسم الحلول الرقمية، وجرّب نظام شفق بنفسك.<div style="margin-top:14px"><a class="btn btn-o" href="#digital" id="mgo">الحلول الرقمية</a></div></div>' : '<div class="empty">نضيف نماذج من أعمالنا في هذه الخدمة قريباً. تواصل معنا لنرسل لك أمثلة.</div>');
    var go = $('#mgo'); if (go) go.addEventListener('click', closeSvc);
    $('#mwa').href = 'request/index.html' + (id === 'digital' ? '' : '?s=' + id); $('#mwa').removeAttribute('target');
    lastFocus = document.activeElement; modal.classList.add('open'); document.body.style.overflow = 'hidden'; $('#mclose').focus();
  }
  function closeSvc() { modal.classList.remove('open'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  svc.addEventListener('click', function (e) { var b = e.target.closest('[data-svc]'); if (b) openSvc(b.getAttribute('data-svc')); });
  $('#mclose').addEventListener('click', closeSvc);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeSvc(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (lb.classList.contains('open')) closeLb(); else if (modal.classList.contains('open')) closeSvc(); } });

  // pricing
  var TERMS = [{ id: 1, n: 'شهري', off: 0 }, { id: 3, n: '3 أشهر', off: 10 }, { id: 6, n: '6 أشهر', off: 15 }, { id: 12, n: 'سنوي', off: 25 }];
  var CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var PLANS = [
    { k: 'starter', n: 'البداية', s: 'لمن يبدأ حضوره على المنصات.', p: 350, f: ['إدارة حساب واحد', '4 ريلز بالشهر', '8 منشورات بالشهر', 'تقرير شهري بالأرقام'] },
    { k: 'growth', n: 'النمو', s: 'الباقة الأنسب لمعظم العلامات.', p: 650, feat: true, f: ['8 ريلز بالشهر', '12 منشوراً بالشهر', '4 كاروسيل بالشهر', '4 منشورات للجمعة', 'خطة محتوى شهرية', 'تقرير شهري بالأرقام'] },
    { k: 'full', n: 'الشاملة', s: 'لمن يريد حضوراً كاملاً بلا حدود.', p: 1100, f: ['كل ما في باقة النمو', 'تصوير جوي شهري', 'تغطية الفعاليات والمعارض', 'إدارة الإعلانات الممولة', 'اجتماع شهري لمراجعة النتائج'] }
  ];
  var term = TERMS[0];
  var tg = $('#toggle');
  tg.innerHTML = TERMS.map(function (t, i) { return '<button role="tab" data-t="' + i + '" class="' + (i === 0 ? 'on' : '') + '" aria-selected="' + (i === 0) + '">' + t.n + (t.off ? '<small>-' + t.off + '%</small>' : '') + '</button>'; }).join('');
  function money(n) { return '$' + n.toLocaleString('en-US'); }
  var RATE = 0;
  function syp(usdN) { if (!RATE) return ''; var v = usdN * RATE, step = RATE >= 1000 ? 1000 : RATE >= 100 ? 10 : 1; return '<bdi dir="ltr">' + (Math.ceil(v / step) * step).toLocaleString('en-US') + '</bdi> ل.س'; }
  function renderPlans() {
    $('#plans').innerHTML = PLANS.map(function (pl) {
      var m = Math.floor(pl.p * (100 - term.off) / 100), total = m * term.id;
      return '<div class="card hov plan' + (pl.feat ? ' feat' : '') + '">' + (pl.feat ? '<span class="badge">الأكثر طلباً</span>' : '') +
        '<div class="t">' + pl.n + '</div><div class="d">' + pl.s + '</div>' +
        '<div class="pr"><b>' + money(m) + '</b>' + (term.off ? '<s>' + money(pl.p) + '</s>' : '') + '<i>بالشهر</i></div>' +
 (RATE ? '<div class="syp">أو ' + syp(m) + ' بالشهر</div>' : '') +
        '<div class="tot">' + (term.id > 1 ? 'المجموع <s><bdi dir="ltr">' + money(pl.p * term.id) + '</bdi></s> <bdi dir="ltr">' + money(total) + '</bdi> لمدة ' + term.n : 'تُدفع شهرياً') + '</div>' +
        '<ul>' + pl.f.map(function (x) { return '<li>' + CHECK + '<span>' + x + '</span></li>'; }).join('') + '</ul>' +
        '<button type="button" class="btn ' + (pl.feat ? 'btn-p' : 'btn-o') + '" data-plan="' + pl.k + '">اختر الباقة</button></div>';
    }).join('');
    bindWa($('#plans'));
  }
  tg.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    term = TERMS[+b.getAttribute('data-t')];
    $$('button', tg).forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
    renderPlans();

  });
  renderPlans();
  fetch('https://ypsarmfjbkxgoepmibia.supabase.co/functions/v1/pay', { headers: { apikey: 'sb_publishable_nH-QKU_Mwjkd1xvMQTOldg_irMRYWZY' } }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (d) {
    var r = Number(d && d.rate); if (r > 0 && isFinite(r)) { RATE = r; renderPlans(); var n = $('#ratenote'); if (n) n.textContent = 'سعر الصرف المعتمد اليوم: 1$ = ' + r.toLocaleString('en-US') + ' ل.س.'; }
  }).catch(function () {});
  // ===== الدفع والاشتراك =====
  var FN = 'https://ypsarmfjbkxgoepmibia.supabase.co/functions/v1/pay';
  var PUBKEY = 'sb_publishable_nH-QKU_Mwjkd1xvMQTOldg_irMRYWZY';
  var METHODS = {
    shamcash: { n: 'شام كاش', logo: 'pay/img/shamcash-logo.png', qr: 'pay/img/shamcash-qr.png', rows: [['اسم الحساب', 'AbdulrhmanYabrodi', 1], ['رمز الحساب', 'f0757ef594a215dbd142d2cc8b3c62f6', 1]] },
    haram: { n: 'الهرم للحوالات', logo: 'pay/img/haram.png', rows: [['اسم المستلم', 'عبد الرحمن هيثم فتال يبرودي', 1], ['رقم الهاتف', '0952584579', 1], ['المدينة', 'دمشق', 0]] },
    fuad: { n: 'الفؤاد للحوالات', logo: 'pay/img/fuad.png', dark: true, rows: [['اسم المستلم', 'عبد الرحمن هيثم فتال يبرودي', 1], ['رقم الهاتف', '0952584579', 1], ['المدينة', 'دمشق', 0]] },
    other: { n: 'شركة حوالات أخرى', icon: '<svg viewBox="0 0 24 24"><path d="M4 7h13l-3-3M20 17H7l3 3"/></svg>', rows: [['اسم المستلم', 'عبد الرحمن هيثم فتال يبرودي', 1], ['رقم الهاتف', '0952584579', 1], ['المدينة', 'دمشق', 0]] },
    cash: { n: 'دفع نقدي', icon: '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></svg>', cash: true }
  };
  var pay = $('#pay'), pbody = $('#pbody'), st = {}, payFocus = null;
  function todayIso() { var d = new Date(), z = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
  function calc() { var m = Math.floor(st.plan.p * (100 - st.term.off) / 100); return { m: m, total: m * st.term.id, full: st.plan.p * st.term.id }; }
  function bar(n) { $$('#pbar i').forEach(function (x, i) { x.classList.toggle('on', i < n); }); }
  function show(html, n) { pbody.innerHTML = '<div class="pstep">' + html + '</div>'; bar(n); pay.scrollTop = 0; var f = $('input,button.method,.drop', pbody); if (f) f.focus({ preventScroll: true }); }
  function summary() {
    var c = calc();
    return '<div class="sum"><span>الباقة</span><b>' + esc(st.plan.n) + '</b><span>المدة</span><b>' + esc(st.term.n) + '</b>' +
      '<span>بالشهر</span><b><bdi dir="ltr">' + money(c.m) + '</bdi></b>' +
      '<span>المبلغ المطلوب</span><b class="big">' + (st.term.off ? '<s><bdi dir="ltr">' + money(c.full) + '</bdi></s>' : '') + '<bdi dir="ltr">' + money(c.total) + '</bdi></b>' +
      (RATE ? '<span>أو بالليرة السورية</span><b dir="rtl">' + syp(c.total) + '</b>' : '') + '</div>';
  }
  function openPay(k) {
    st = { plan: PLANS.filter(function (p) { return p.k === k; })[0], term: term, method: '', file: null, date: todayIso() };
    if (!st.plan) return;
    payFocus = document.activeElement; pay.classList.add('open'); document.body.style.overflow = 'hidden';
    step1();
  }
  function closePay() { pay.classList.remove('open'); document.body.style.overflow = ''; pbody.innerHTML = ''; if (payFocus) payFocus.focus(); }
  function step1() {
    show('<h3 id="ptitle">بيانات الاشتراك</h3><p class="sub">تأكد من باقتك، واكتب بيانات علامتك.</p>' + summary() +
      '<div class="grid2"><div><label for="pco">اسم الشركة أو العلامة</label><input type="text" id="pco" maxlength="80" autocomplete="organization" value="' + esc(st.company || '') + '"></div>' +
      '<div><label for="pct">اسم المسؤول عن الميديا</label><input type="text" id="pct" maxlength="60" autocomplete="name" value="' + esc(st.contact || '') + '"></div>' +
      '<div><label for="pph">رقم الواتساب</label><input type="tel" id="pph" maxlength="20" dir="ltr" autocomplete="tel" placeholder="09xxxxxxxx" value="' + esc(st.phone || '') + '"></div>' +
      '<div><label for="pdt">تاريخ الدفع</label><input type="date" id="pdt" value="' + esc(st.date) + '"></div></div>' +
      '<label class="agree"><input type="checkbox" id="pagree"' + (st.agree ? ' checked' : '') + '> <span>قرأت <a href="terms/index.html" target="_blank" rel="noopener">الشروط وسياسة الاسترجاع</a> وأوافق عليها.</span></label>' +
      '<input class="hp" type="text" id="phw" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="err" id="perr" role="alert"></div><div class="acts"><button type="button" class="btn btn-p" id="pnext1">المتابعة إلى الدفع</button></div>', 1);
    $('#pnext1').addEventListener('click', function () {
      var co = $('#pco').value.trim(), ct = $('#pct').value.trim(), ph = $('#pph').value.replace(/[^\d+]/g, ''), dt = $('#pdt').value;
      if (co.length < 2) return err('اكتب اسم الشركة أو العلامة.', '#pco');
      if (ct.length < 2) return err('اكتب اسم المسؤول عن الميديا.', '#pct');
      if (ph.length < 8) return err('اكتب رقم واتساب صحيحاً.', '#pph');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dt)) return err('اختر تاريخ الدفع.', '#pdt');
      if (!$('#pagree').checked) return err('وافق على الشروط وسياسة الاسترجاع للمتابعة.', '#pagree');
      st.agree = true;
      st.company = co; st.contact = ct; st.phone = ph; st.date = dt; st.hp = $('#phw').value;
      step2();
    });
  }
  function err(m, sel) { var e = $('#perr'); if (e) e.textContent = m; if (sel) $(sel).focus(); return false; }
  function detail() {
    var M = METHODS[st.method]; if (!M) return '';
    if (M.cash) return '<div class="pdetail noqr"><div class="info"><div class="row"><span>المبلغ</span><b>' + money(calc().total) + (RATE ? ' · ' + syp(calc().total) : '') + '</b><i class="cp"></i></div></div></div><p class="sub" style="margin-top:12px">تدفع المبلغ نقداً عند أول لقاء مع فريقنا. أكّد طلبك، وسنتواصل معك على رقمك لنحدد الموعد والمكان.</p>';
    var extra = st.method === 'other' ? '<div class="grid2" style="margin-top:14px"><div><label for="poc">اسم شركة الحوالات</label><input type="text" id="poc" maxlength="60" value="' + esc(st.otherCo || '') + '"></div><div><label for="poi">رقم الحوالة أو تفاصيل أخرى</label><input type="text" id="poi" maxlength="300" value="' + esc(st.otherInfo || '') + '"></div></div>' : '';
    var rows = M.rows.map(function (r) { return '<div class="row"><span>' + r[0] + '</span><b>' + esc(r[1]) + '</b>' + (r[2] ? '<button type="button" class="copyb" data-copy="' + esc(r[1]) + '">نسخ</button>' : '<i class="cp"></i>') + '</div>'; }).join('') +
      '<div class="row"><span>المبلغ</span><b>' + money(calc().total) + (RATE ? ' · ' + syp(calc().total) : '') + '</b><i class="cp"></i></div>';
    return '<div class="pdetail' + (M.qr ? '' : ' noqr') + '">' + (M.qr ? '<div class="qr"><img src="' + M.qr + '" alt="رمز QR لحساب شام كاش"></div>' : '') + '<div class="info">' + rows + '</div></div>' +
      '<p class="sub" style="margin-top:12px">' + (M.qr ? 'امسح الرمز من تطبيق شام كاش، أو انسخ رمز الحساب، وحوّل المبلغ.' : st.method === 'other' ? 'أرسل الحوالة باسم المستلم من أي شركة حوالات، واكتب اسمها هنا.' : 'أرسل الحوالة باسم المستلم من أقرب مكتب ' + esc(M.n) + '، واحتفظ بالوصل.') + '</p>' + extra;
  }
  function step2() {
    show('<h3 id="ptitle">طريقة الدفع</h3><p class="sub">اختر الطريقة المناسبة لك، وحوّل المبلغ.</p>' +
      '<div class="methods">' + Object.keys(METHODS).map(function (k) { var M = METHODS[k]; return '<button type="button" class="method' + (st.method === k ? ' on' : '') + '" data-m="' + k + '">' + (M.logo ? '<span class="lg-box' + (M.dark ? ' dk' : '') + '"><img src="' + M.logo + '" alt=""></span>' : '<span class="lg-box ic">' + M.icon + '</span>') + '<span>' + M.n + '</span></button>'; }).join('') + '</div>' +
      '<div id="pdet">' + detail() + '</div><div class="err" id="perr" role="alert"></div>' +
      '<div class="acts"><button type="button" class="btn btn-o" id="pback2">رجوع</button><button type="button" class="btn btn-p" id="pnext2">' + (st.method === 'cash' ? 'تأكيد الطلب' : 'تم الدفع') + '</button></div>', 2);
    $$('.method', pbody).forEach(function (b) {
      b.addEventListener('click', function () {
        st.method = b.getAttribute('data-m');
        $$('.method', pbody).forEach(function (x) { x.classList.toggle('on', x === b); });
        var d = $('#pdet'); d.innerHTML = '<div class="pstep">' + detail() + '</div>'; $('#perr').textContent = '';
        $('#pnext2').textContent = st.method === 'cash' ? 'تأكيد الطلب' : 'تم الدفع';
      });
    });
    $('#pback2').addEventListener('click', step1);
    $('#pnext2').addEventListener('click', function () {
      if (!st.method) return err('اختر طريقة الدفع أولاً.');
      if (st.method === 'other') { st.otherCo = ($('#poc').value || '').trim(); st.otherInfo = ($('#poi').value || '').trim(); if (st.otherCo.length < 2) return err('اكتب اسم شركة الحوالات.', '#poc'); }
      if (METHODS[st.method].cash) { st.file = null; return send($('#pnext2')); }
      step3();
    });
  }
  function step3() {
    show('<h3 id="ptitle">أرفق وصل الدفع</h3><p class="sub">ارفع وصل ' + esc(METHODS[st.method].n) + ' بصيغة PDF أو صورة، حتى 5MB.</p>' +
      '<label class="drop" id="pdrop" tabindex="0"><svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg><b id="pfname">اضغط لاختيار الوصل أو اسحبه هنا</b><small>PDF أو JPG أو PNG</small><input type="file" id="pfile" accept="application/pdf,image/jpeg,image/png,image/webp" hidden></label>' +
      '<div class="err" id="perr" role="alert"></div>' +
      '<div class="acts"><button type="button" class="btn btn-o" id="pback3">رجوع</button><button type="button" class="btn btn-p" id="psend">إرسال الوصل</button></div>', 3);
    var drop = $('#pdrop'), inp = $('#pfile');
    function take(f) {
      if (!f) return;
      if (!/^(application\/pdf|image\/(jpeg|png|webp))$/.test(f.type)) return err('الوصل لازم يكون PDF أو صورة.');
      if (f.size > 5 * 1024 * 1024) return err('حجم الملف أكبر من 5MB.');
      st.file = f; $('#perr').textContent = ''; drop.classList.add('has'); $('#pfname').textContent = f.name;
    }
    inp.addEventListener('change', function () { take(inp.files[0]); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { take(e.dataTransfer.files[0]); });
    $('#pback3').addEventListener('click', step2);
    $('#psend').addEventListener('click', send);
  }
  function send(btnEl) {
    var cash = METHODS[st.method].cash;
    if (!cash && !st.file) return err('أرفق وصل الدفع أولاً.');
    var b = btnEl && btnEl.nodeType ? btnEl : $('#psend'), label = b.textContent; b.disabled = true; b.innerHTML = '<span class="spin"></span> جارٍ الإرسال';
    var fd = new FormData();
    fd.append('plan', st.plan.k); fd.append('term', String(st.term.id)); fd.append('method', st.method);
    fd.append('company', st.company); fd.append('contact', st.contact); fd.append('phone', st.phone); fd.append('pay_date', st.date);
    fd.append('type', 'sub'); fd.append('website', st.hp || '');
    if (st.method === 'other') { fd.append('other_company', st.otherCo || ''); fd.append('other_info', st.otherInfo || ''); }
    if (st.file) fd.append('receipt', st.file, st.file.name);
    fetch(FN, { method: 'POST', headers: { apikey: PUBKEY }, body: fd }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok || !d.ok) throw new Error(d.error || 'تعذر الإرسال.'); return d; });
    }).then(function (d) { st.sub = d.sub; step4(); }, function (e) {
      b.disabled = false; b.textContent = label;
      var el = $('#perr'); el.innerHTML = esc(e.message || 'تعذر الإرسال.') + ' يمكنك إرسال الطلب مباشرة على واتساب.';
      var a = document.createElement('a'); a.className = 'btn btn-o'; a.style.marginTop = '10px'; a.textContent = 'إرسال الطلب على واتساب'; a.target = '_blank'; a.rel = 'noopener';
      a.href = wa(payText('لم يُسجّل بعد')); el.appendChild(document.createElement('br')); el.appendChild(a);
    });
  }
  function payText(sub) {
    var c = calc();
    return 'مرحباً شفق ميديا، تم الدفع.\nرقم الاشتراك: ' + sub + '\nالباقة: ' + st.plan.n + ' (' + st.term.n + ')\nالمبلغ: ' + money(c.total) + '\nطريقة الدفع: ' + METHODS[st.method].n + (st.method === 'other' ? ' (' + st.otherCo + ')' : '') + (METHODS[st.method].cash ? '' : '\nتاريخ الدفع: ' + st.date) + '\nالشركة: ' + st.company + '\nالمسؤول عن الميديا: ' + st.contact;
  }
  function step4() {
    var canShare = false;
    try { canShare = !!(st.file && navigator.canShare && navigator.canShare({ files: [st.file] })); } catch (e) {}
    show('<div class="done"><img class="lgo" src="assets/logo-white.png" alt="شعار شفق ميديا"><h3 id="ptitle">بداية خير</h3>' +
      '<p>' + (METHODS[st.method].cash ? 'سجّلنا اشتراكك في باقة ' + esc(st.plan.n) + '. سيتواصل معك فريقنا لترتيب الدفع وبدء العمل.' : 'وصلنا وصل الدفع وسجّلنا اشتراكك في باقة ' + esc(st.plan.n) + '. سيتواصل معك فريقنا لبدء العمل.') + '</p>' +
      '<div class="subno">' + esc(st.sub) + '</div><p style="font-size:14px">رقم الاشتراك، احتفظ به.</p>' +
      '<div class="acts"><a class="btn btn-p" id="pwa" target="_blank" rel="noopener">' + (st.file ? 'إرسال إشعار الدفع عبر واتساب' : 'إرسال إشعار الطلب عبر واتساب') + '</a>' + (canShare ? '<button type="button" class="btn btn-o" id="pshare">مشاركة الوصل على واتساب</button>' : '') + '</div></div>', 4);
    $('#pwa').href = wa(payText(st.sub) + (st.file ? '\nأرفقت وصل الدفع في الموقع.' : ''));
    var sh = $('#pshare');
    if (sh) sh.addEventListener('click', function () { navigator.share({ files: [st.file], text: payText(st.sub) }).catch(function () {}); });
  }
  pbody.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]'); if (!c) return;
    var v = c.getAttribute('data-copy');
    function ok() { c.textContent = 'تم النسخ'; c.classList.add('ok'); setTimeout(function () { c.textContent = 'نسخ'; c.classList.remove('ok'); }, 1600); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(ok, function () {});
    else { var t = document.createElement('textarea'); t.value = v; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok(); } catch (x) {} t.remove(); }
  });
  $('#plans').addEventListener('click', function (e) { var b = e.target.closest('[data-plan]'); if (b) openPay(b.getAttribute('data-plan')); });
  $('#pclose').addEventListener('click', closePay);
  pay.addEventListener('click', function (e) { if (e.target === pay) closePay(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pay.classList.contains('open')) closePay(); });

  // contact form -> صندوق الطلبات
  var types = $('#ctypes'), chosen = '';
  types.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    chosen = b.getAttribute('data-s');
    $$('button', types).forEach(function (x) { x.classList.toggle('on', x === b); });
  });
  $('#cform').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#cname').value.trim(), phone = $('#cphone').value.replace(/[^\d+]/g, ''), msg = $('#cmsg').value.trim(), err = $('#cerr'), b = $('#csend');
    if (name.length < 2) { err.textContent = 'اكتب اسمك أو اسم شركتك.'; $('#cname').focus(); return; }
    if (phone.length < 8) { err.textContent = 'اكتب رقم واتساب صحيحاً لنتواصل معك.'; $('#cphone').focus(); return; }
    if (!chosen) { err.textContent = 'اختر الخدمة.'; return; }
    if (msg.length < 3) { err.textContent = 'اكتب رسالة قصيرة عن مشروعك.'; $('#cmsg').focus(); return; }
    err.textContent = ''; b.disabled = true; b.innerHTML = '<span class="spin"></span> جارٍ الإرسال';
    var fd = new FormData();
    fd.append('type', 'req'); fd.append('service', chosen); fd.append('company', name); fd.append('contact', name); fd.append('phone', phone);
    fd.append('purpose', msg.slice(0, 200)); fd.append('details', msg); fd.append('website', $('#chw').value);
    fetch(FN, { method: 'POST', headers: { apikey: PUBKEY }, body: fd }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok || !d.ok) throw new Error(d.error || 'تعذر الإرسال.'); return d; });
    }).then(function (d) {
      $('#cform').innerHTML = '<div class="done" style="padding:10px 0"><h3 style="font-size:26px">وصلتنا رسالتك</h3><p>رقم طلبك</p><div class="subno">' + esc(d.sub) + '</div><p style="margin-top:12px">سنراجع التفاصيل ونتواصل معك على رقمك.</p></div>';
    }, function (x) { b.disabled = false; b.textContent = 'إرسال'; err.textContent = x.message || 'تعذر الإرسال. جرّب مرة ثانية.'; });
  });

  // reveal
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  function observe() { $$('.rv:not(.in)').forEach(function (el) { if (io) io.observe(el); else el.classList.add('in'); }); }
  observe();

  $('#yr').textContent = new Date().getFullYear();
})();

/* مدّ الكلمات بالكشيدة (ـ) حتى تتساوى أطوال العناوين في كل مجموعة */
(function () {
  'use strict';
  var JOIN = 'بتثجحخسشصضطظعغفقكلمنهيئـ';
  var AR = /[ء-ي]/;
  function cands(t) {
    var c = [];
    for (var i = 0; i < t.length - 1; i++) {
      if (JOIN.indexOf(t[i]) < 0 || !AR.test(t[i + 1])) continue;
      if (t[i] === 'ل' && 'اأإآ'.indexOf(t[i + 1]) >= 0) continue;
      c.push(i);
    }
    // ابدأ من منتصف كل كلمة نحو الأطراف
    var mid = t.length / 2;
    return c.sort(function (a, b) { return Math.abs(a - mid) - Math.abs(b - mid); });
  }
  function build(t, cnt) {
    var out = '';
    for (var i = 0; i < t.length; i++) { out += t[i]; if (cnt[i]) out += new Array(cnt[i] + 1).join('ـ'); }
    return out;
  }
  function w(el) { return el.getBoundingClientRect().width; }
  function fit(group) {
    group.forEach(function (el) { if (!el.dataset.orig) el.dataset.orig = el.textContent; el.textContent = el.dataset.orig; });
    var target = Math.max.apply(null, group.map(w));
    group.forEach(function (el) {
      var t = el.dataset.orig, c = cands(t), cnt = {}, k = 0, guard = 0;
      if (!c.length) return;
      var prev = w(el);
      while (prev < target - 1.5 && guard++ < 60) {
        var pos = c[k % c.length]; k++;
        if ((cnt[pos] || 0) >= 4) { if (k > c.length * 5) break; continue; }
        cnt[pos] = (cnt[pos] || 0) + 1;
        el.textContent = build(t, cnt);
        var now = w(el);
        if (now > target + 1.5 && (now - target) > (target - prev)) { cnt[pos]--; el.textContent = build(t, cnt); break; }
        prev = now;
      }
    });
  }
  function run() {
    var rules = Array.prototype.slice.call(document.querySelectorAll('.kf[data-kf="rules"]'));
    ['rulesd', 'steps'].forEach(function (g) {
      var els = Array.prototype.slice.call(document.querySelectorAll('.kf[data-kf="' + g + '"]'));
      if (!els.length) return;
      if (window.innerWidth > 900) fit(els);
      else els.forEach(function (el) { if (el.dataset.orig) el.textContent = el.dataset.orig; });
    });
    var aud = Array.prototype.slice.call(document.querySelectorAll('.aud .kf'));
    if (rules.length) fit(rules);
    if (aud.length) {
      if (window.innerWidth > 900) fit(aud);
      else aud.forEach(function (el) { if (el.dataset.orig) el.textContent = el.dataset.orig; });
    }
  }
  var t0 = 0;
  function later() { clearTimeout(t0); t0 = setTimeout(run, 150); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run); else window.addEventListener('load', run);
  window.addEventListener('load', later);
  window.addEventListener('resize', later);
})();

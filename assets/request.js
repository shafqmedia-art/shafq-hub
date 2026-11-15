(function () {
  'use strict';
  var FN = 'https://ypsarmfjbkxgoepmibia.supabase.co/functions/v1/pay';
  var PUBKEY = 'sb_publishable_nH-QKU_Mwjkd1xvMQTOldg_irMRYWZY';
  var WA = '966563079286';
  var SVCS = [['social', 'إدارة حسابات التواصل'], ['video', 'إنتاج الفيديو والمونتاج'], ['aerial', 'التصوير الجوي'], ['events', 'تغطية المؤتمرات والمعارض'], ['wedding', 'الأعراس والمناسبات'],
    ['website', 'موقع إلكتروني'], ['app', 'تطبيق جوال'], ['system', 'نظام إدارة'], ['bot', 'بوت ردود تلقائية'], ['custom', 'عرض مخصص'], ['other', 'خدمة أخرى']];
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var pre = '';
  try { pre = new URLSearchParams(location.search).get('s') || ''; } catch (e) {}
  var chosen = SVCS.some(function (x) { return x[0] === pre; }) ? pre : '';
  var box = $('#svcs');
  box.innerHTML = SVCS.map(function (x) { return '<button type="button" data-s="' + x[0] + '" class="' + (x[0] === chosen ? 'on' : '') + '" aria-pressed="' + (x[0] === chosen) + '">' + x[1] + '</button>'; }).join('');
  box.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    chosen = b.getAttribute('data-s');
    Array.prototype.forEach.call(box.querySelectorAll('button'), function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
  });
  function name(k) { var r = SVCS.filter(function (x) { return x[0] === k; })[0]; return r ? r[1] : ''; }
  $('#rqform').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('#rerr'), b = $('#rsend');
    var v = { co: $('#rco').value.trim(), ct: $('#rct').value.trim(), ph: $('#rph').value.replace(/[^\d+]/g, ''), wh: $('#rwh').value.trim(), pu: $('#rpu').value.trim(), de: $('#rde').value.trim() };
    function bad(m, sel) { err.textContent = m; if (sel) $(sel).focus(); }
    if (!chosen) return bad('اختر الخدمة التي تحتاجها.');
    if (v.co.length < 2) return bad('اكتب اسم الشركة أو العلامة.', '#rco');
    if (v.ct.length < 2) return bad('اكتب اسم المسؤول.', '#rct');
    if (v.ph.length < 8) return bad('اكتب رقم واتساب صحيحاً.', '#rph');
    if (v.pu.length < 3) return bad('اكتب الهدف من الخدمة.', '#rpu');
    err.textContent = ''; b.disabled = true; b.innerHTML = '<span class="spin"></span> جارٍ الإرسال';
    var fd = new FormData();
    fd.append('type', 'req'); fd.append('service', chosen); fd.append('company', v.co); fd.append('contact', v.ct); fd.append('phone', v.ph);
    fd.append('when', v.wh); fd.append('purpose', v.pu); fd.append('details', v.de); fd.append('website', $('#rhw').value);
    fetch(FN, { method: 'POST', headers: { apikey: PUBKEY }, body: fd }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok || !d.ok) throw new Error(d.error || 'تعذر الإرسال.'); return d; });
    }).then(function (d) {
      var text = 'مرحباً شفق ميديا، أرسلت طلب خدمة من الموقع.\nرقم الطلب: ' + d.sub + '\nالخدمة: ' + name(chosen) + '\nالشركة: ' + v.co + '\nالمسؤول: ' + v.ct;
      $('#rqbox').innerHTML = '<div class="card done pstep" style="padding:44px 28px"><img class="lgo" src="../assets/logo-white.png" alt="شعار شفق ميديا"><h3>وصلنا طلبك</h3>' +
        '<p>سنراجع التفاصيل ونرسل لك عرض السعر على رقم الواتساب ' + '<bdi dir="ltr">' + esc(v.ph) + '</bdi>.</p><div class="subno">' + esc(d.sub) + '</div><p style="font-size:14px">رقم طلبك، احتفظ به.</p>' +
        '<div class="acts" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:22px"><a class="btn btn-o" href="../index.html">العودة إلى الموقع</a><a class="btn btn-p" target="_blank" rel="noopener" href="https://wa.me/' + WA + '?text=' + encodeURIComponent(text) + '">إرسال إشعار الطلب عبر واتساب</a></div></div>';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, function (x) { b.disabled = false; b.textContent = 'إرسال الطلب'; err.textContent = (x.message || 'تعذر الإرسال.') + ' جرّب مرة ثانية.'; });
  });
})();

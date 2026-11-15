/* يشتغل قبل النظام: يتأكد من وجود صفة الدخول والبيانات التجريبية، ويرسم الشريط العلوي */
(function () {
  'use strict';
  var D = window.SHAFQ_DEMO;
  var who = null;
  try { who = localStorage.getItem(D.SKEY); } catch (e) {}
  if (!who) { location.replace('../index.html'); return; }
  if (!D.fresh()) D.seed();
  var bar = document.getElementById('demobar');
  if (!bar) return;
  bar.innerHTML = '<div class="db-in"><span class="db-t"><b>نسخة تجريبية</b> · البيانات أمثلة وهمية، وكل ما تغيّره يبقى في متصفحك فقط.</span><span class="db-a"><a class="db-b" href="../index.html">تغيير الصفة</a><button class="db-b" type="button" id="dbReset">ابدأ من جديد</button><a class="db-b db-p" href="../../request/index.html?s=system">اطلب نظاماً مثله</a></span></div>';
  var st = document.createElement('style');
  st.textContent = '#demobar{background:#1d1d1d;border-bottom:1px solid #2e2e2e;font-family:Cairo,system-ui,sans-serif;position:relative;z-index:40}' +
    '#demobar .db-in{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:8px 16px;font-size:13.5px;color:#d6d5cf}' +
    '#demobar b{color:#C8F03C}#demobar .db-a{display:flex;gap:6px;flex-wrap:wrap}' +
    '#demobar .db-b{display:inline-flex;align-items:center;min-height:34px;padding:0 12px;border:1px solid #3a3a3a;border-radius:8px;color:#F5F4EE;font:inherit;font-size:13px;font-weight:700;background:none;cursor:pointer;text-decoration:none}' +
    '#demobar .db-b:hover{border-color:#F5F4EE}#demobar .db-p{background:#C8F03C;border-color:#C8F03C;color:#121212}' +
    'body.t-light #demobar{background:#ecebe4;border-color:#d8d7cf;color:#333}body.t-light #demobar .db-in{color:#333}body.t-light #demobar .db-b{color:#121212;border-color:#c9c8c0}body.t-light #demobar b{color:#4a6b00}';
  document.head.appendChild(st);
  document.getElementById('dbReset').addEventListener('click', function () { D.seed(); location.hash = '#/'; location.reload(); });
})();

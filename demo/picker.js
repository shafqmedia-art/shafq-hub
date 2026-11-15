(function () {
  'use strict';
  var D = window.SHAFQ_DEMO;
  var has = false;
  try { has = !!localStorage.getItem(D.KEY); } catch (e) {}
  if (has) document.getElementById('resume').hidden = false;
  document.getElementById('wipe').addEventListener('click', function () { D.seed(); this.parentNode.textContent = 'تم. اختر الصفة لتبدأ ببيانات جديدة.'; });
  Array.prototype.forEach.call(document.querySelectorAll('[data-u]'), function (b) {
    b.addEventListener('click', function () {
      if (!D.fresh()) D.seed();
      try { localStorage.setItem(D.SKEY, b.getAttribute('data-u')); localStorage.setItem('shafq.demo.theme', 'dark'); } catch (e) {}
      location.href = 'app/index.html#/';
    });
  });
})();

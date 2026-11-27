(function () {
  'use strict';
  var server = window.SHAFQ_SERVER;
  var emailForm = document.getElementById('email-form');
  var codeForm = document.getElementById('code-form');
  var email = document.getElementById('email');
  var code = document.getElementById('code');
  var title = document.getElementById('title');
  var accessContent = document.getElementById('access-content');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var destination = document.getElementById('delivery-address');
  var emailMessage = document.getElementById('email-message');
  var codeMessage = document.getElementById('code-message');
  var edit = document.getElementById('edit');
  var resend = document.getElementById('resend');
  var intro = document.getElementById('email-intro');
  var sendCode = document.getElementById('send-code');
  var confirmCode = document.getElementById('confirm-code');
  var switchMode = document.getElementById('switch-mode');
  var createAccount = false;
  var address = '';
  var busy = false;

  function announce(text) {
    var message = codeForm.hidden ? emailMessage : codeMessage;
    message.textContent = text;
    message.hidden = !text;
  }

  async function run(form, operation) {
    if (busy) return;
    if (!server || !server.enabled) {
      announce('تسجيل الدخول بالإيميل يحتاج إعداد الاتصال بخادم شفق.');
      return;
    }
    busy = true;
    form.setAttribute('aria-busy', 'true');
    var buttons = Array.from(form.querySelectorAll('button'));
    buttons.forEach(function (button) { button.disabled = true; });
    announce('');
    try { await operation(); }
    finally {
      busy = false;
      form.removeAttribute('aria-busy');
      buttons.forEach(function (button) { button.disabled = false; });
    }
  }

  async function send(form) {
    await run(form, async function () {
      try {
        await server.requestEmailCode(address, createAccount);
      } catch (error) {
        announce('تعذر إرسال الرمز. تأكد من البريد وجرّب بعد قليل.');
        return;
      }
      var firstSend = form === emailForm;
      emailForm.hidden = true;
      codeForm.hidden = false;
      title.textContent = 'أدخل رمز التحقق';
      confirmCode.textContent = createAccount ? 'تأكيد الحساب' : 'تأكيد الدخول';
      destination.textContent = address;
      code.value = '';
      if (!firstSend) announce('أعدنا إرسال الرمز.');
      if (firstSend && !reduceMotion.matches && accessContent.animate) {
        accessContent.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
      }
      code.focus({ preventScroll: true });
      code.scrollIntoView({ block: 'nearest' });
    });
  }

  function pressFeedback(event) {
    var button = event.target.closest('button[type="submit"]');
    if (!button || button.disabled || reduceMotion.matches || !button.animate) return;
    button.animate([
      { transform: 'scale(.98)', offset: 0 },
      { transform: 'scale(.98)', offset: .82 },
      { transform: 'scale(1)', offset: 1 }
    ], { duration: 100 });
  }

  emailForm.addEventListener('pointerdown', function (event) {
    if (event.isPrimary && event.button === 0) pressFeedback(event);
  });
  emailForm.addEventListener('click', function (event) {
    if (event.detail === 0) pressFeedback(event);
  });

  emailForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (busy) return;
    address = email.value.trim();
    send(emailForm);
  });

  function renderEmailStep() {
    title.textContent = createAccount ? 'إنشاء حساب' : 'تسجيل الدخول';
    intro.textContent = createAccount ? 'أدخل بريدك الإلكتروني لإنشاء حسابك في شفق.' : 'أدخل بريدك الإلكتروني لنرسل لك رمز الدخول.';
    sendCode.textContent = createAccount ? 'إرسال رمز التحقق' : 'إرسال رمز الدخول';
    switchMode.textContent = createAccount ? 'عندك حساب؟ سجّل الدخول' : 'جديد على شفق؟ أنشئ حساباً';
  }

  switchMode.addEventListener('click', function () {
    createAccount = !createAccount;
    announce('');
    renderEmailStep();
    email.focus();
  });

  edit.addEventListener('click', function () {
    announce('');
    codeForm.hidden = true;
    emailForm.hidden = false;
    code.value = '';
    renderEmailStep();
    destination.textContent = '';
    email.focus();
  });

  resend.addEventListener('click', function () { send(codeForm); });

  codeForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var token = code.value.replace(/[٠-٩]/g, function (digit) { return String(digit.charCodeAt(0) - 1632); })
      .replace(/[۰-۹]/g, function (digit) { return String(digit.charCodeAt(0) - 1776); }).trim();
    if (!/^[0-9]{6}$/.test(token)) {
      announce('اكتب الرمز من 6 أرقام.');
      code.focus();
      return;
    }

    run(codeForm, async function () {
      try { await server.verifyEmailCode(address, token); }
      catch (error) {
        announce(error.offline ? 'تحقق من الإنترنت وجرّب مرة تانية.' : 'تعذر التحقق من الرمز. تأكد منه أو اطلب رمز جديد.');
        return;
      }

      try { await openAccount(); }
      catch (error) {
        announce('تعذر فتح حسابك. حمّل الصفحة من جديد للمتابعة.');
      }
    });
  });

  async function openAccount() {
    if (!await server.verifiedEmailSession()) {
      await server.signOut();
      announce('انتهت جلسة الدخول. اطلب رمزاً جديداً.');
      return;
    }
    var requestedRoute = new URLSearchParams(window.location.search).get('view') || '';
    var appRoute = /^#\/[a-z0-9/_%.-]{0,240}$/i.test(requestedRoute) ? requestedRoute : '';
    if (appRoute && await server.activeProfile()) {
      window.location.replace('shafq-app/' + appRoute);
      return;
    }
    window.location.replace('portal.html');
  }

  if (server && server.enabled && server.hasSession()) {
    run(emailForm, async function () {
      try { await openAccount(); }
      catch (error) {
        if (error.status === 401 || error.status === 403) server.clear();
        else announce('تعذر فتح حسابك. تحقق من اتصالك وحمّل الصفحة من جديد.');
      }
    });
  }
})();

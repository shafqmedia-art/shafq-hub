(function () {
  'use strict';
  var server = window.SHAFQ_SERVER;

  function showEntry() {
    window.location.replace('./');
  }

  async function showPortal() {
    if (!server || !server.enabled || !server.hasSession()) {
      showEntry();
      return;
    }

    try {
      if (!await server.verifiedEmailSession()) {
        await server.signOut();
        showEntry();
        return;
      }
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        server.clear();
        showEntry();
        return;
      }

      var message = document.createElement('p');
      message.textContent = 'تعذر التحقق من جلسة الدخول. تحقق من اتصالك وأعد تحميل الصفحة.';
      document.body.replaceChildren(message);
      document.body.hidden = false;
      return;
    }

    document.querySelectorAll('[data-sign-out]').forEach(function (link) {
      link.addEventListener('click', async function (event) {
        event.preventDefault();
        document.body.hidden = true;
        await server.signOut();
        showEntry();
      });
    });

    document.body.hidden = false;
    var site = document.createElement('script');
    site.src = 'assets/site.js?v=6';
    document.body.appendChild(site);

    // A profile is only needed for the app shortcut, not for the website.
    try {
      if (await server.activeProfile()) document.querySelector('.portal-app').hidden = false;
    } catch (error) {
      // Keep the shortcut hidden when the account's permissions cannot be checked.
    }
  }

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) window.location.reload();
  });
  showPortal();
})();

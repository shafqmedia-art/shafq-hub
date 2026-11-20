// يحفظ ملفات الواجهة ليفتح التطبيق بسرعة وبدون إنترنت. البيانات لا تمر من هنا.
var CACHE = 'shafq-shell-v26';
var FILES = ['./', 'index.html', 'styles.css', 'app.js', 'server.js', 'config.js', 'manifest.webmanifest', 'fonts/Cairo-Regular.ttf', 'fonts/Cairo-SemiBold.ttf', 'fonts/Cairo-Bold.ttf', 'fonts/Cairo-Black.ttf', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/logo-white.png', 'icons/logo-black.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-180.png', 'intro.js'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); return r; }).catch(function () { return caches.match(e.request); }));
});

// إشعارات الجوال
self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'شفق ميديا', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(Promise.all([saveNote({ at: Date.now(), title: String(d.title || 'شفق ميديا').slice(0, 120), body: String(d.body || '').slice(0, 300), url: safeUrl(d.url) }).then(function () { return self.clients.matchAll({ type: 'window', includeUncontrolled: true }); }).then(function (cs) { cs.forEach(function (c) { c.postMessage({ type: 'note' }); }); }).catch(function () {}), self.registration.showNotification(d.title || 'شفق ميديا', { body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: d.tag || undefined, dir: 'rtl', lang: 'ar', data: { url: safeUrl(d.url) } })]));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = new URL(safeUrl(e.notification.data && e.notification.data.url), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) { if (cs[i].url.indexOf(self.registration.scope) === 0 && 'focus' in cs[i]) { cs[i].navigate(url).catch(function () {}); return cs[i].focus(); } }
    return self.clients.openWindow(url);
  }));
});

// الإشعارات بتنحفظ على الجهاز لحتى تبين بالجرس جوّا التطبيق
function safeUrl(u) { try { var x = new URL(u || './', self.registration.scope); return x.origin === self.location.origin ? x.href : './'; } catch (e) { return './'; } }
function noteDb() { return new Promise(function (res, rej) { var r = indexedDB.open('shafq-notes', 1); r.onupgradeneeded = function () { r.result.createObjectStore('notes', { keyPath: 'at' }); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
function saveNote(n) {
  return noteDb().then(function (db) { return new Promise(function (res) {
    var tx = db.transaction('notes', 'readwrite'), st = tx.objectStore('notes'); st.put(n);
    var all = st.getAllKeys(); all.onsuccess = function () { var k = all.result; for (var i = 0; i < k.length - 60; i++) st.delete(k[i]); };
    tx.oncomplete = function () { db.close(); res(); }; tx.onerror = function () { db.close(); res(); };
  }); });
}

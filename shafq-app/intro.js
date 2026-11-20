// حماية: فتح الموقع دائماً عبر HTTPS، ومنع عرضه داخل إطار موقع تاني (clickjacking)
(function () {
  if (location.protocol === 'http:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') { location.replace('https://' + location.host + location.pathname + location.search + location.hash); return; }
  if (window.top !== window.self) { try { window.top.location = window.self.location.href; } catch (e) { document.documentElement.style.display = 'none'; } }
})();

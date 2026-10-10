// service-worker.js - deixa o jogo instalável e jogável sem internet depois da 1ª visita (PWA).
// Só roda em http(s) (GitHub Pages); abrindo o index.html com duplo clique ele não é usado.
// HTML, CSS e JS: rede primeiro (sempre a versão nova quando há internet), cache se estiver offline.
// Fontes, sons e imagens: cache primeiro (não mudam). Arquivo que não existe (ex.: um meme apagado) não é guardado.
'use strict';
const CACHE = 'liquida-brasil-v1';   // nome novo: o activate apaga o cache antigo ('grao-mestre-v1')
const BASE = ['./index.html', './css/style.css', './manifest.webmanifest',
  './js/data.js', './js/diario.js', './js/engine.js', './js/bots.js', './js/sprites.js', './js/minigames.js', './js/audio.js', './js/ui.js', './js/main.js',
  './assets/fonts/press-start-2p.woff2', './assets/fonts/silkscreen.woff2', './assets/fonts/vt323.woff2',
  './assets/icones/icone-192.png', './assets/icones/icone-512.png'];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const guardar = r => { if (r && r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); } return r; };
  if (/\.(html|css|js|webmanifest)$|\/$/.test(new URL(req.url).pathname)) {
    ev.respondWith(fetch(req).then(guardar).catch(() => caches.match(req, { ignoreSearch: true })
      .then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : r))));   // offline: qualquer página abre o jogo
  } else {
    ev.respondWith(caches.match(req).then(r => r || fetch(req).then(guardar)));
  }
});

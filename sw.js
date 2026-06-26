// sw.js — Service Worker CSE Lab System
// Estratégia: Cache-first para shell, Network-first para APIs

const CACHE_NAME = 'cse-lab-v1';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './js/config.js',
  './js/auth.js',
  './js/drive.js',
  './js/whatsapp.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Instalação: pré-cacheia o shell do app
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// Ativação: remove caches de versões antigas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: separa chamadas à API do cache local
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Chamadas ao Google: sempre da rede (nunca cachear tokens)
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('accounts.google.com') ||
    url.hostname.includes('googleusercontent.com')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Chamadas ao WhatsApp: passthrough
  if (url.hostname.includes('wa.me') || url.hostname.includes('whatsapp.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Assets locais: cache-first com fallback para rede
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cacheia assets locais novos dinamicamente
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

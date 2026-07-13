/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

const CACHE_VERSION = "ma3moni-v2";
const SHELL_CACHE   = "ma3moni-shell-v2";

const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/offline.html",
];

// ── Install ────────────────────────────────────────────────
self.addEventListener("install", (e: ExtendableEvent) => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then(c => c.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => (self as unknown as ServiceWorkerGlobalScope).skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────────
self.addEventListener("activate", (e: ExtendableEvent) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION && k !== SHELL_CACHE).map(k => caches.delete(k))
      ))
      .then(() => (self as unknown as ServiceWorkerGlobalScope).clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────
self.addEventListener("fetch", (e: FetchEvent) => {
  const { request } = e;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Navigation → network-first, fallback to shell, then offline page
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) caches.open(SHELL_CACHE).then(c => c.put(request, res.clone()));
          return res;
        })
        .catch(() =>
          caches.match("/").then(c => c ?? caches.match("/offline.html") ?? Response.error())
        )
    );
    return;
  }

  // Static assets → cache-first
  if (/\.(js|css|woff2?|ttf|svg|png|jpg|webp|ico)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) caches.open(CACHE_VERSION).then(c => c.put(request, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // API calls → network-only (never cache sensitive data)
  if (url.pathname.startsWith("/api/")) return;

  // Anything else → stale-while-revalidate
  e.respondWith(
    caches.match(request).then(cached => {
      const fresh = fetch(request).then(res => {
        if (res.ok) caches.open(CACHE_VERSION).then(c => c.put(request, res.clone()));
        return res;
      });
      return cached ?? fresh;
    })
  );
});

// ── Push notifications ────────────────────────────────────
self.addEventListener("push", (e: PushEvent) => {
  const data = e.data?.json() ?? { title: "Ma3moni", body: "You have a new notification." };
  e.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).registration.showNotification(data.title, {
      body:  data.body,
      icon:  "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      data:  { url: data.url ?? "/" },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", (e: NotificationEvent) => {
  e.notification.close();
  e.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).clients
      .matchAll({ type: "window" })
      .then(list => {
        const target = e.notification.data?.url ?? "/";
        for (const client of list) {
          if (client.url === target && "focus" in client) return (client as WindowClient).focus();
        }
        return (self as unknown as ServiceWorkerGlobalScope).clients.openWindow(target);
      })
  );
});

export {};

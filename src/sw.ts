/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

// Injected by vite.config.ts at build time — changes on every deploy.
// This makes the compiled sw.js byte-unique so browsers always detect
// the new version and trigger an update without manual intervention.
declare const __BUILD_ID__: string;

const CACHE_VERSION = `ma3moni-${__BUILD_ID__}`;
const SHELL_CACHE   = `ma3moni-shell-${__BUILD_ID__}`;

const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/offline.html",
];

const sw = self as unknown as ServiceWorkerGlobalScope;

// ── Install ────────────────────────────────────────────────
sw.addEventListener("install", (e: ExtendableEvent) => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then(c => c.addAll(PRECACHE_URLS).catch(() => {}))
      // Skip waiting so the new SW activates immediately on all tabs
      .then(() => sw.skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────────
sw.addEventListener("activate", (e: ExtendableEvent) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION && k !== SHELL_CACHE)
            .map(k => caches.delete(k))
      ))
      // Claim all open clients immediately so they use the new SW at once
      .then(() => sw.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────
sw.addEventListener("fetch", (e: FetchEvent) => {
  const { request } = e;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== sw.location.origin) return;

  // API calls — never cache, always go to network
  if (url.pathname.startsWith("/api/")) return;

  // Navigation → network-first so fresh HTML always loads; offline fallback
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

  // Hashed static assets (JS/CSS/fonts/images) → cache-first (they never change)
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

  // Everything else → stale-while-revalidate
  e.respondWith(
    caches.match(request).then(cached => {
      const fresh = fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(request, clone));
        }
        return res;
      });
      return cached ?? fresh;
    })
  );
});

// ── Push notifications ────────────────────────────────────
sw.addEventListener("push", (e: PushEvent) => {
  const data = e.data?.json() ?? { title: "Ma3moni", body: "You have a new notification." };
  e.waitUntil(
    sw.registration.showNotification(data.title, {
      body:    data.body,
      icon:    "/icons/icon-192.svg",
      badge:   "/icons/icon-192.svg",
      data:    { url: data.url ?? "/" },
      vibrate: [100, 50, 100],
    })
  );
});

sw.addEventListener("notificationclick", (e: NotificationEvent) => {
  e.notification.close();
  e.waitUntil(
    sw.clients
      .matchAll({ type: "window" })
      .then(list => {
        const target = e.notification.data?.url ?? "/";
        for (const client of list) {
          if (client.url === target && "focus" in client) return (client as WindowClient).focus();
        }
        return sw.clients.openWindow(target);
      })
  );
});

export {};

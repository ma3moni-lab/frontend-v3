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
  "/icons/icon-192.png",
  "/icons/icon-512.png",
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

  if (request.method !== "GET") return;

  // Cross-origin images (Cloudinary, CDN) — cache-first so repeated visits
  // never re-download the same photo.
  if (url.origin !== sw.location.origin) {
    if (!/\.(jpe?g|png|webp|gif|avif)$/i.test(url.pathname)) return;
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then(c => c.put(request, clone));
          }
          return res;
        }).catch(() => cached ?? Response.error());
      })
    );
    return;
  }

  // API calls — never cache, always go to network
  if (url.pathname.startsWith("/api/")) return;

  // Navigation → network-first so fresh HTML always loads; offline fallback
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then(res => {
          // Clone SYNCHRONOUSLY before returning — body stream is consumed
          // by the browser as soon as we return res, so async cloning fails.
          if (res.ok) {
            const toCache = res.clone();
            caches.open(SHELL_CACHE).then(c => c.put(request, toCache));
          }
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
          if (res.ok) {
            const toCache = res.clone(); // clone before returning
            caches.open(CACHE_VERSION).then(c => c.put(request, toCache));
          }
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
  // Robust data parsing — handle JSON, plain text, or missing payload
  let data: { title?: string; body?: string; url?: string } = {};
  try {
    data = e.data?.json() ?? {};
  } catch {
    try { data = { body: e.data?.text() ?? "" }; } catch {}
  }

  const title = (data.title ?? "Ma3moni") as string;
  const body  = (data.body  ?? "You have a new notification.") as string;
  const url   = (data.url   ?? "/") as string;

  // showNotification MUST be called synchronously inside waitUntil.
  // We do NOT chain it after clients.matchAll() because that chain can silently
  // fail on some mobile browsers if matchAll resolves with 0 clients.
  // Instead we run both in parallel via Promise.all so neither blocks the other.
  e.waitUntil(
    Promise.all([
      // Always show the OS notification — this is the critical path.
      // icon must be PNG — SVG is NOT supported on Android Chrome or iOS.
      sw.registration.showNotification(title, {
        body,
        icon:             "/icons/icon-192.png",
        badge:            "/icons/icon-192.png",
        data:             { url },
        vibrate:          [200, 100, 200],
        requireInteraction: false,
        tag:              "ma3moni-push",
        renotify:         true,
        silent:           false,
      }),
      // Best-effort: tell open tabs a push arrived (for in-app badges / sounds)
      sw.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
        clients.forEach(c => c.postMessage({ type: "PUSH_RECEIVED", data: { title, body, url } }));
      }).catch(() => {}),
    ])
  );
});

sw.addEventListener("notificationclick", (e: NotificationEvent) => {
  e.notification.close();
  const target = (e.notification.data?.url as string | undefined) ?? "/";
  e.waitUntil(
    sw.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(list => {
        // Focus existing window if already open at target URL
        for (const client of list) {
          if (client.url.includes(target.replace(/^\//, "")) && "focus" in client) {
            return (client as WindowClient).focus();
          }
        }
        // Focus any open window and navigate, or open a new one
        if (list.length > 0 && "navigate" in list[0]) {
          return (list[0] as WindowClient & { navigate: (url: string) => Promise<WindowClient> })
            .navigate(target).then(c => c?.focus());
        }
        return sw.clients.openWindow(target);
      })
      .catch(() => sw.clients.openWindow(target))
  );
});

export {};

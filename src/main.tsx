import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import App from "./app/App";

// ── Stale-chunk guard ─────────────────────────────────────────────────────────
// After a new deployment, lazy chunk hashes change.  If a tab was open before
// the deploy, any lazy import (admin panel, blog, etc.) will 404 because the
// old hash no longer exists on the server.  Intercept this at two levels:
//   1. unhandledrejection — catches dynamic-import failures that escape React
//   2. visibilitychange   — proactively reload tabs that were hidden > 30 min
window.addEventListener("unhandledrejection", (e) => {
  const msg = String((e.reason as Error | null)?.message ?? e.reason ?? "");
  if (msg.includes("dynamically imported module") || msg.includes("Failed to fetch")) {
    e.preventDefault();
    window.location.reload();
  }
});

let _hiddenAt = 0;
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    _hiddenAt = Date.now();
  } else if (_hiddenAt > 0 && Date.now() - _hiddenAt > 30 * 60 * 1000) {
    // Tab was hidden for > 30 min — silently reload to pick up latest deploy
    window.location.reload();
  }
});

// Inject favicon before React mounts so the browser tab icon is correct immediately
(function setFavicon() {
  const existing = document.querySelector("link[rel~='icon']");
  if (existing) existing.remove();
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  link.href = "/icons/icon-192.svg";
  document.head.appendChild(link);
})();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

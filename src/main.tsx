import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import App from "./app/App";

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

import { useEffect, useState, type ReactNode } from "react";
import { Download, X, Wifi, Bell, Share } from "lucide-react";
import { restorePreferences } from "../../lib/preferences";
import { wakeUpServer } from "../../lib/api";

interface PWAProviderProps { children: ReactNode; }
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// 24 h in ms — re-show banner after one day even if previously dismissed
const BANNER_TTL = 24 * 60 * 60 * 1000;

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  const isIos = /iP(ad|hone|od)/i.test(ua);
  // Safari on iOS: has "Safari" but NOT "CriOS" (Chrome) or "FxiOS" (Firefox)
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  return isIos && isSafari;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function shouldShowBanner(storageKey: string): boolean {
  try {
    const ts = localStorage.getItem(storageKey);
    if (!ts) return true;
    return Date.now() - parseInt(ts, 10) > BANNER_TTL;
  } catch {
    return true;
  }
}

function recordDismiss(storageKey: string) {
  try { localStorage.setItem(storageKey, String(Date.now())); } catch {}
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // Chrome/Android install banner
  const [showBanner, setShowBanner]       = useState(false);
  // iOS Safari "Add to Home Screen" instructions banner
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [isOffline, setIsOffline]         = useState(!navigator.onLine);
  const [swState, setSwState]             = useState<"idle" | "updating">("idle");
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  // Push notification permission — ask once, 4 s after mount
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    const seen = sessionStorage.getItem("ma3_push_prompted");
    if (seen) return;
    const t = setTimeout(() => setShowPushPrompt(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const requestPush = async () => {
    try { await Notification.requestPermission(); } catch {}
    sessionStorage.setItem("ma3_push_prompted", "1");
    setShowPushPrompt(false);
  };

  useEffect(() => {
    restorePreferences();
    // Wake Render free-tier server before user tries to log in
    wakeUpServer();

    // Preload critical fonts
    const preloadFont = (href: string) => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const link = document.createElement("link");
      link.rel = "preload"; link.as = "style"; link.href = href;
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    };
    preloadFont("https://fonts.googleapis.com/css2?family=Gugi&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap");

    // Web App Manifest
    const manifest = document.createElement("link");
    manifest.rel = "manifest"; manifest.href = "/manifest.json";
    document.head.appendChild(manifest);

    // Apple touch icon (home screen icon on iOS)
    const appleIcon = document.createElement("link");
    appleIcon.rel = "apple-touch-icon";
    appleIcon.href = "/icons/apple-touch-icon.svg";
    document.head.appendChild(appleIcon);

    // Favicon
    const favicon = document.createElement("link");
    favicon.rel = "icon"; favicon.type = "image/svg+xml"; favicon.href = "/icons/icon-192.svg";
    document.head.appendChild(favicon);

    // Theme & PWA meta tags
    const metas: HTMLMetaElement[] = [];
    const addMeta = (name: string, content: string, isName = true) => {
      const m = document.createElement("meta");
      if (isName) m.name = name; else m.setAttribute("property", name);
      m.content = content;
      document.head.appendChild(m);
      metas.push(m);
    };
    addMeta("theme-color", "#0A6870");
    addMeta("apple-mobile-web-app-capable", "yes");
    addMeta("apple-mobile-web-app-status-bar-style", "default");
    addMeta("apple-mobile-web-app-title", "Ma3moni");
    addMeta("mobile-web-app-capable", "yes");
    addMeta("application-name", "Ma3moni");
    addMeta("msapplication-TileColor", "#0A6870");
    addMeta("og:type", "website", false);
    addMeta("og:title", "Ma3moni — Where Intentional Connections Begin", false);
    addMeta("og:description", "A compatibility-first marriage platform.", false);

    // Service Worker — auto-reload when the new SW takes control.
    // sw.ts calls skipWaiting() on install and clients.claim() on activate,
    // so controllerchange fires as soon as the new version is active.
    if ("serviceWorker" in navigator) {
      let reloading = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloading) return;
        reloading = true;
        window.location.reload();
      });

      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(reg => {
          reg.addEventListener("updatefound", () => {
            const worker = reg.installing;
            worker?.addEventListener("statechange", () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller) {
                setSwState("updating");
              }
            });
          });
        })
        .catch(() => {});
    }

    // Online / offline
    const onOnline  = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);

    // iOS Safari — show custom instructions banner (no beforeinstallprompt on iOS)
    if (isIosSafari() && !isStandalone() && shouldShowBanner("pwa-ios-dismissed")) {
      // Small delay so it doesn't flash during initial paint
      const t = setTimeout(() => setShowIosBanner(true), 2000);
      return () => {
        clearTimeout(t);
        try { document.head.removeChild(manifest); } catch {}
        try { document.head.removeChild(appleIcon); } catch {}
        try { document.head.removeChild(favicon); } catch {}
        metas.forEach(m => { try { document.head.removeChild(m); } catch {} });
        window.removeEventListener("online",  onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }

    // Chrome / Android / desktop — listen for the native install prompt
    const onInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      if (shouldShowBanner("pwa-chrome-dismissed")) setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", onInstall);

    return () => {
      try { document.head.removeChild(manifest); } catch {}
      try { document.head.removeChild(appleIcon); } catch {}
      try { document.head.removeChild(favicon); } catch {}
      metas.forEach(m => { try { document.head.removeChild(m); } catch {} });
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onInstall);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
    dismissChrome();
  };

  const dismissChrome = () => {
    setShowBanner(false);
    recordDismiss("pwa-chrome-dismissed");
  };

  const dismissIos = () => {
    setShowIosBanner(false);
    recordDismiss("pwa-ios-dismissed");
  };

  return (
    <>
      {children}

      {/* Push notification permission prompt */}
      {showPushPrompt && (
        <div className="fixed bottom-24 left-4 right-4 z-[120] max-w-sm mx-auto bg-card border border-border rounded-2xl shadow-2xl p-4 view-enter">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Stay in the loop</p>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>
                Allow notifications to know when a new match or message arrives — even when the app is closed.
              </p>
              <div className="flex gap-2 mt-3">
                <button onClick={requestPush}
                  className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                  Allow
                </button>
                <button onClick={() => { sessionStorage.setItem("ma3_push_prompted", "1"); setShowPushPrompt(false); }}
                  className="flex-1 py-2 rounded-xl border border-border hover:bg-muted transition-colors"
                  style={{ fontSize: "0.8125rem" }}>
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update available */}
      {swState === "updating" && (
        <div className="fixed top-0 left-0 right-0 z-[110] flex items-center justify-between px-5 py-3 bg-primary text-white" style={{ fontSize: "0.875rem" }}>
          <span style={{ fontWeight: 600 }}>A new version of Ma3moni is available.</span>
          <button onClick={() => window.location.reload()} className="ml-4 underline" style={{ fontWeight: 700 }}>
            Update now
          </button>
        </div>
      )}

      {/* Offline banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
          <Wifi size={14} /> You're offline — some features may be unavailable
        </div>
      )}

      {/* Chrome / Android / desktop install banner */}
      {showBanner && !isOffline && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-card border-t border-border shadow-2xl shadow-primary/10">
          <div className="max-w-lg mx-auto flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
              <Download size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Install Ma3moni</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Add to your home screen — works offline too</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={dismissChrome} className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Dismiss">
                <X size={16} />
              </button>
              <button onClick={install} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari "Add to Home Screen" instructions banner */}
      {showIosBanner && !isOffline && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-card border-t border-border shadow-2xl shadow-primary/10">
          <div className="max-w-lg mx-auto">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <Download size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Install Ma3moni on your iPhone</p>
                <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
                  Tap the <Share size={13} className="inline align-text-bottom mx-0.5 text-primary" /> Share button in Safari, then choose <strong>"Add to Home Screen"</strong> for the full app experience.
                </p>
              </div>
              <button onClick={dismissIos} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

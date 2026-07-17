import { useState, useEffect } from "react";
import { Landing } from "./Landing";
import { LoginPage, type UserPlan } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";
import { Onboarding } from "./Onboarding";
import { UserApp } from "./UserApp";
import { MaintenancePage } from "./MaintenancePage";
import {
  auth as apiAuth, setUserTokens, clearTokens, adminApi, restoreUserToken, ApiError,
} from "../../lib/api";

const MAINTENANCE_KEY     = "ma3moni_maintenance_on";
const MAINTENANCE_END_KEY = "ma3moni_maintenance_end";
const MAINTENANCE_MSG_KEY = "ma3moni_maintenance_msg";
const SESSION_KEY         = "ma3moni_user_session";
const PLAN_KEY            = "ma3moni_user_plan";
const ONBOARDING_KEY      = "ma3moni_onboarding_complete";
const LAST_VIEW_KEY       = "ma3moni_last_view";

type UserView = "landing" | "login" | "register" | "onboarding" | "app";

/** Silently detect approximate location from IP and store it for admin monitoring. */
async function detectAndStoreLocation(): Promise<void> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return;
    const data = await res.json() as { city?: string; country_name?: string };
    const loc = [data.city, data.country_name].filter(Boolean).join(", ");
    if (loc) {
      // Store locally for app use
      try { localStorage.setItem("ma3moni_detected_location", loc); } catch {}
      // Push to backend profile (best-effort, runs silently)
      apiAuth.updateProfile({ last_location: loc } as never).catch(() => {});
    }
  } catch {}
}

export function UserRoot() {
  // ── Maintenance mode ──────────────────────────────────────────
  const [maintenance, setMaintenance] = useState(() => {
    try { return localStorage.getItem(MAINTENANCE_KEY) === "true"; } catch { return false; }
  });
  const [maintenanceEnd, setMaintenanceEnd] = useState<number | null>(() => {
    try { const v = localStorage.getItem(MAINTENANCE_END_KEY); return v ? Number(v) : null; } catch { return null; }
  });
  const [maintenanceMsg] = useState(() => {
    try { return localStorage.getItem(MAINTENANCE_MSG_KEY) ?? undefined; } catch { return undefined; }
  });

  useEffect(() => {
    const check = () => {
      adminApi.settings().then(s => {
        const on = s.maintenance_mode;
        setMaintenance(on);
        try { localStorage.setItem(MAINTENANCE_KEY, on ? "true" : "false"); } catch {}
        const endMs = (s as { maintenance_end_time?: number }).maintenance_end_time;
        if (endMs) {
          setMaintenanceEnd(endMs);
          try { localStorage.setItem(MAINTENANCE_END_KEY, String(endMs)); } catch {}
        } else if (!on) {
          setMaintenanceEnd(null);
          try { localStorage.removeItem(MAINTENANCE_END_KEY); } catch {}
        }
      }).catch(() => {});
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  if (maintenance) return <MaintenancePage endTime={maintenanceEnd} message={maintenanceMsg} />;

  // ── View state — restored from last session ───────────────────
  const [view, setView] = useState<UserView>(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      if (s) {
        const { view: v, expiry } = JSON.parse(s);
        // Only restore "app" or "onboarding" if tokens actually exist
        if (expiry > Date.now() && restoreUserToken()) {
          if (v === "app" || v === "onboarding") return v as UserView;
        }
      }
    } catch {}
    return "landing";
  });

  // Persist current view so user continues from same place on refresh
  useEffect(() => {
    if (view === "app" || view === "onboarding") {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          view, expiry: Date.now() + 30 * 24 * 60 * 60 * 1000,
        }));
        localStorage.setItem(LAST_VIEW_KEY, view);
      } catch {}
    } else {
      try { localStorage.removeItem(SESSION_KEY); } catch {}
    }
  }, [view]);

  // ── Sign out ──────────────────────────────────────────────────
  const signOut = async () => {
    clearTokens();
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    try { localStorage.removeItem(PLAN_KEY); } catch {}
    // Intentionally keep ONBOARDING_KEY — user already completed onboarding; signing out doesn't undo it.
    setView("landing");
  };

  // ── After login: decide where to send the user ───────────────
  const afterLogin = async (plan: UserPlan, profileComplete: boolean) => {
    try { localStorage.setItem(PLAN_KEY, plan); } catch {}
    detectAndStoreLocation();
    const alreadyOnboarded = (() => { try { return localStorage.getItem(ONBOARDING_KEY) === "true"; } catch { return false; } })();
    if (profileComplete || alreadyOnboarded) { setView("app"); return; }
    // Neither flag set — cross-device or cleared storage: check backend profile for any data.
    try {
      const me = await apiAuth.me();
      const p = me.profile as Record<string, unknown>;
      if (p?.full_name || p?.gender || p?.location_city || p?.date_of_birth) {
        try { localStorage.setItem(ONBOARDING_KEY, "true"); } catch {}
        setView("app"); return;
      }
    } catch {}
    setView("onboarding");
  };

  // ── After registration + OTP: go to onboarding ───────────────
  const afterRegister = (plan: UserPlan, _profileComplete: boolean, _identifier: string) => {
    try { localStorage.setItem(PLAN_KEY, plan); } catch {}
    detectAndStoreLocation();
    setView("onboarding");
  };

  // ── On mount: verify stored session is still valid ───────────
  useEffect(() => {
    if (view === "app" || view === "onboarding") {
      apiAuth.me().then(me => {
        // Sync plan in case it was upgraded
        try { localStorage.setItem(PLAN_KEY, me.plan); } catch {}
      }).catch((err: unknown) => {
        // 401 = session dead (stale tokens from another backend, etc.)
        if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 401) {
          signOut();
        }
      });
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Onboarding complete ───────────────────────────────────────
  const onOnboardingComplete = () => {
    try { localStorage.setItem(ONBOARDING_KEY, "true"); } catch {}
    setView("app");
  };

  return (
    <div className="size-full overflow-hidden bg-background">
      {view === "landing" && (
        <Landing
          onStart={() => setView("register")}
          onLogin={() => setView("login")}
        />
      )}

      {view === "login" && (
        <LoginPage
          onSuccess={afterLogin}
          onRegister={() => setView("register")}
          onBack={() => setView("landing")}
        />
      )}

      {view === "register" && (
        <RegisterPage
          onVerified={afterRegister}
          onLogin={() => setView("login")}
          onBack={() => setView("landing")}
        />
      )}

      {view === "onboarding" && (
        <Onboarding
          onComplete={onOnboardingComplete}
          onBack={() => setView("landing")}
        />
      )}

      {view === "app" && (
        <UserApp onSignOut={signOut} />
      )}
    </div>
  );
}

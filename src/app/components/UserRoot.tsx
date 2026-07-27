import { useState, useEffect } from "react";
import { Landing } from "./Landing";
import { LoginPage, type UserPlan } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";
import { Onboarding } from "./Onboarding";
import { UserApp } from "./UserApp";
import { MaintenancePage } from "./MaintenancePage";
import { SuspendedView } from "./SuspendedView";
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

type UserView = "landing" | "login" | "register" | "onboarding" | "app" | "suspended";

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

const SUSPENSION_REASON_KEY = "ma3moni_suspension_reason";
const SUSPENSION_AT_KEY     = "ma3moni_suspended_at";

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

  const [suspensionReason, setSuspensionReason] = useState<string>(() => {
    try { return localStorage.getItem(SUSPENSION_REASON_KEY) ?? ""; } catch { return ""; }
  });
  const [suspensionAt, setSuspensionAt] = useState<string | undefined>(() => {
    try { return localStorage.getItem(SUSPENSION_AT_KEY) ?? undefined; } catch { return undefined; }
  });
  const [suspensionEmail, setSuspensionEmail] = useState<string>(() => {
    try { return localStorage.getItem("ma3moni_login_email") ?? ""; } catch { return ""; }
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

  // ── Suspension handler ────────────────────────────────────────
  const onSuspended = (reason: string, suspAt?: string, email?: string) => {
    try { localStorage.setItem(SUSPENSION_REASON_KEY, reason); } catch {}
    if (suspAt) { try { localStorage.setItem(SUSPENSION_AT_KEY, suspAt); } catch {} }
    setSuspensionReason(reason);
    setSuspensionAt(suspAt);
    if (email) setSuspensionEmail(email);
    setView("suspended");
  };

  // ── Sign out ──────────────────────────────────────────────────
  const signOut = async () => {
    clearTokens();
    // Clear ALL user-specific cache so a different user logging in on the same
    // device never sees another user's profile data, photos, or push state.
    const USER_KEYS = [
      SESSION_KEY,
      PLAN_KEY,
      ONBOARDING_KEY,
      "ma3moni_onboarding_progress",
      "ma3moni_found_partner",
      "ma3_push_subscribed",
      "ma3moni_avatar",
      "ma3moni_pending_plan",
      "ma3moni_pending_reference",
      "ma3_uid",
      "ma3moni_conv_cache",
      "ma3moni_avatar_photo",
      "ma3moni_detected_location",
      SUSPENSION_REASON_KEY,
      SUSPENSION_AT_KEY,
    ];
    USER_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch {} });
    setSuspensionReason("");
    setSuspensionAt(undefined);
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
        // If backend has since suspended the account, redirect immediately
        if (me.account_status === "suspended") {
          onSuspended(
            me.suspension_reason ?? "Your account has been suspended.",
            me.suspended_at,
            me.email,
          );
        }
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
          onSuspended={onSuspended}
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

      {view === "suspended" && (
        <SuspendedView
          reason={suspensionReason}
          suspendedAt={suspensionAt}
          userEmail={suspensionEmail || undefined}
          onSignOut={signOut}
        />
      )}
    </div>
  );
}

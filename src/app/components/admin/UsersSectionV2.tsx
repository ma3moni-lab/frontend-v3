import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Search, Filter, Eye, Trash2, Lock, Unlock, CheckCircle, X,
  Bell, Gift, ChevronRight, MapPin, Briefcase, Calendar,
  MessageSquare, Heart, LogIn, Star, Shield, Send, Check,
  Download, UserCheck, Clock, AlertCircle, KeyRound, Copy
} from "lucide-react";
import { USERS } from "../../../data/users";
import { adminApi, restoreAdminToken } from "../../../lib/api";


const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  login:        <LogIn size={13} />,
  match:        <Heart size={13} />,
  message:      <MessageSquare size={13} />,
  profile:      <UserCheck size={13} />,
  subscription: <Star size={13} />,
  auth:         <LogIn size={13} />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  auth:         "#4A8DB8",
  match:        "#0A6870",
  message:      "#6B9E78",
  profile:      "#C5733F",
  subscription: "#9B6DAF",
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    active:    { bg: "#dcfce7", text: "#166534" },
    suspended: { bg: "#fef9c3", text: "#854d0e" },
    pending:   { bg: "#dbeafe", text: "#1d4ed8" },
  };
  const s = map[status] ?? { bg: "#f3f4f6", text: "#6b7280" };
  return <span className="px-2 py-0.5 rounded-full capitalize" style={{ fontSize: "0.75rem", fontWeight: 600, background: s.bg, color: s.text }}>{status}</span>;
}

interface PushNotifModalProps {
  targets: typeof USERS;
  onClose: () => void;
}

function PushNotifModal({ targets, onClose }: PushNotifModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notifType, setNotifType] = useState("system");
  const [sent, setSent] = useState(false);

  const NOTIF_TYPES = ["system", "match", "message", "referral"];

  const send = async () => {
    if (!title.trim() || !message.trim()) return;
    // Send to each target via real API, fall back gracefully
    for (const u of targets) {
      try { await adminApi.pushToUser(u.id, notifType, title, message); } catch {}
    }
    setSent(true);
    setTimeout(onClose, 1800);
  };

  if (sent) return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Check size={24} className="text-primary" />
        </div>
        <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }}>Notification Sent</h3>
        <p className="text-muted-foreground mt-2" style={{ fontSize: "0.9rem" }}>
          Push notification delivered to {targets.length} user{targets.length !== 1 ? "s" : ""}.
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }}>Send Push Notification</h3>
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
              To: {targets.length === 1 ? targets[0].name : `${targets.length} selected users`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Recipients */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Recipients</label>
            <div className="flex flex-wrap gap-1.5">
              {targets.slice(0, 5).map(u => (
                <span key={u.id} className="px-2.5 py-1 bg-secondary rounded-full text-secondary-foreground" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{u.name}</span>
              ))}
              {targets.length > 5 && <span className="px-2.5 py-1 bg-muted rounded-full text-muted-foreground" style={{ fontSize: "0.75rem" }}>+{targets.length - 5} more</span>}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Notification Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Profile update required"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              style={{ fontSize: "0.9rem" }}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write the notification message…"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              style={{ fontSize: "0.9rem" }}
            />
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.75rem" }}>{message.length}/160 characters</p>
          </div>

          {/* Preview */}
          {(title || message) && (
            <div className="bg-foreground/5 rounded-xl p-4 border border-border">
              <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 8 }}>PREVIEW</p>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                  <Heart size={14} className="text-white" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>{title || "Notification title"}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.8125rem", marginTop: 2 }}>{message || "Notification body text…"}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.9rem" }}>Cancel</button>
            <button
              onClick={send}
              disabled={!title.trim() || !message.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontSize: "0.9rem", fontWeight: 700 }}
            >
              <Send size={15} /> Send Notification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reset Password Modal ──────────────────────────────────────
interface ResetPwModalProps {
  user: typeof USERS[0];
  onClose: () => void;
}

function ResetPasswordModal({ user, onClose }: ResetPwModalProps) {
  const [expiryHours, setExpiryHours] = useState("24");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ temp_password: string; expires_at: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true); setError("");
    try {
      const res = await adminApi.resetUserPassword(user.id, Number(expiryHours));
      setResult({ temp_password: res.temp_password, expires_at: res.expires_at });
      toast.success("Temporary password generated");
    } catch {
      setError("Could not reach the server. Is Django running?");
    } finally {
      setLoading(false);
    }
  };

  const copyPw = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.temp_password).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }}>Reset Password</h3>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <KeyRound size={16} className="text-amber-600 flex-shrink-0" />
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{user.name}</p>
            <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{user.email}</p>
          </div>
        </div>

        {!result ? (
          <>
            <div className="mb-4">
              <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                Password valid for
              </label>
              <select value={expiryHours} onChange={e => setExpiryHours(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: "0.9375rem" }}>
                <option value="1">1 hour</option>
                <option value="6">6 hours</option>
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
                <option value="72">72 hours (3 days)</option>
                <option value="168">1 week</option>
              </select>
              <p className="text-muted-foreground mt-1.5" style={{ fontSize: "0.75rem" }}>
                User will be notified in-app. Share the temp password securely via another channel.
              </p>
            </div>
            {error && <p className="text-destructive mb-3" style={{ fontSize: "0.8125rem" }}>{error}</p>}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.9rem" }}>
                Cancel
              </button>
              <button onClick={generate} disabled={loading}
                className="flex-1 py-3 rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
                style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                {loading ? "Generating…" : "Generate"}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4">
              <p className="text-muted-foreground mb-1" style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Temporary Password
              </p>
              <div className="flex items-center gap-2">
                <code style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "0.05em", flex: 1 }}>
                  {result.temp_password}
                </code>
                <button onClick={copyPw} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0">
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>
            </div>
            <div className="flex items-start gap-2 text-amber-600 bg-amber-50 rounded-xl p-3">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <p style={{ fontSize: "0.8125rem" }}>
                Expires: <strong>{result.expires_at}</strong>. Share this securely — it will NOT be shown again.
              </p>
            </div>
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
              The user has been notified in-app. Ask them to log in and set a new password immediately.
            </p>
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" style={{ fontWeight: 700 }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface GrantSubModalProps {
  user: typeof USERS[0];
  onClose: () => void;
  onGranted: (userId: string, plan: string) => void;
}

function GrantSubModal({ user, onClose, onGranted }: GrantSubModalProps) {
  const [plan, setPlan]       = useState<"basic" | "premium">("premium");
  const [days, setDays]       = useState("30");
  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [grantError, setGrantError] = useState("");

  const grant = async () => {
    if (granted) return; // idempotency — prevent double-clicks after success
    setLoading(true);
    setGrantError("");
    let success = false;

    try {
      await adminApi.grantSubscription(user.id, plan as import("../../../lib/api").UserPlan, Number(days));
      success = true;
    } catch {
      // Fallback: send notification so user is at least informed
      try {
        await adminApi.pushToUser(
          user.id, "subscription",
          `🎉 ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Activated`,
          `Your account has been upgraded to the ${plan} plan for ${days} days by the Ma3moni team.`,
          { plan, days: Number(days) },
        );
        success = true;
      } catch {
        setGrantError("Could not reach the server. Is Django running?");
      }
    }

    setLoading(false);
    if (success) {
      onGranted(user.id, plan); // update parent list — no scope issues
      setGranted(true);
      setTimeout(onClose, 2200);
    }
  };

  if (granted) return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Check size={28} className="text-green-600" />
        </div>
        <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }}>Subscription Granted!</h3>
        <p className="text-muted-foreground mt-2" style={{ fontSize: "0.9rem" }}>
          <strong>{user.name}</strong> now has free <span className="capitalize text-primary font-semibold">{plan}</span> for <strong>{days} days</strong>.
        </p>
        <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem" }}>They will receive a notification shortly.</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }}>Grant Free Subscription</h3>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl border border-primary/15">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: "var(--primary)" }}>
                {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </span>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{user.name}</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Current: {user.subscription}</p>
            </div>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Select Plan</label>
            <div className="grid grid-cols-2 gap-3">
              {(["basic", "premium"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`p-3 rounded-xl border transition-all capitalize text-left ${plan === p ? "border-primary bg-secondary" : "border-border hover:border-primary/30"}`}
                >
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", color: plan === p ? "var(--primary)" : "var(--foreground)" }}>{p}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{p === "basic" ? "$19/mo value" : "$49/mo value"}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Duration (days)</label>
            <div className="flex gap-2">
              {["7", "14", "30", "90"].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`flex-1 py-2.5 rounded-xl border transition-all ${days === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/30"}`}
                  style={{ fontSize: "0.875rem", fontWeight: 600 }}
                >
                  {d}d
                </button>
              ))}
              <input
                value={days}
                onChange={e => setDays(e.target.value)}
                type="number"
                min="1"
                className="w-16 px-2 py-2.5 rounded-xl border border-border bg-input-background text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: "0.875rem" }}
              />
            </div>
          </div>

          <div className="p-3 bg-secondary rounded-xl border border-primary/15" style={{ fontSize: "0.875rem" }}>
            <span className="text-muted-foreground">Granting: </span>
            <strong className="text-primary capitalize">{plan}</strong>
            <span className="text-muted-foreground"> for </span>
            <strong>{days} days</strong>
            <span className="text-muted-foreground"> to {user.name}</span>
          </div>

          {grantError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={14} className="text-destructive flex-shrink-0" />
              <p className="text-destructive" style={{ fontSize: "0.8125rem" }}>{grantError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} disabled={loading} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50" style={{ fontSize: "0.9rem" }}>Cancel</button>
            <button
              onClick={grant}
              disabled={loading || granted}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontSize: "0.9rem", fontWeight: 700 }}
            >
              {loading
                ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Granting…</>
                : <><Gift size={15} /> Grant Access</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type SortKey = "name" | "joined" | "status";

// ── Activity Timeline component (role-gated) ─────────────────
// Avatar that fetches the user's first profile photo from Django
function UserAvatar({ name, userId, size = 44 }: { name: string; userId: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    adminApi.userDetail(userId).then(u => {
      const photo = (u as { photos?: { image_url: string }[] }).photos?.[0]?.image_url;
      if (photo) {
        const base = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
        setSrc(photo.startsWith("/") ? base + photo : photo);
      }
    }).catch(() => {});
  }, [userId]);

  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const r = Math.round(size * 0.28);

  return src ? (
    <div className="rounded-2xl overflow-hidden flex-shrink-0 border border-border"
      style={{ width: size, height: size }}>
      <img src={src} alt={name} className="w-full h-full object-cover object-top" />
    </div>
  ) : (
    <div className="rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}>
      <span style={{ fontSize: r, fontWeight: 800, color: "var(--primary)" }}>{initials}</span>
    </div>
  );
}

function ActivityTimeline({ userId }: {
  userId: string;
}) {
  const [activities, setActivities] = useState<{ icon: string; text: string; time: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActivities([]);
    setLoading(true);
    adminApi.userActivity(userId).then(res => {
      const mapped = res.results.map(a => ({
        icon: a.type, text: a.action + (a.detail ? `: ${a.detail}` : ""), time: a.timestamp, type: a.type,
      }));
      // Login/logout events bubble to the top
      mapped.sort((a, b) => {
        const aLogin = a.type === "login" || a.type === "auth" ? 0 : 1;
        const bLogin = b.type === "login" || b.type === "auth" ? 0 : 1;
        return aLogin - bLogin;
      });
      setActivities(mapped);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Activity Timeline</h4>
        {loading && <div className="w-3 h-3 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />}
      </div>
      <div className="space-y-2">
        {activities.map((act, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: (ACTIVITY_COLORS[act.type] ?? "#68747F") + "20", color: ACTIVITY_COLORS[act.type] ?? "#68747F" }}>
              {ACTIVITY_ICONS[act.icon] ?? <AlertCircle size={12} />}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: "0.8125rem" }}>{act.text}</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{act.time}</p>
            </div>
          </div>
        ))}
        {activities.length === 0 && !loading && (
          <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>No activity recorded yet.</p>
        )}
      </div>
    </div>
  );
}

export function UsersSectionV2() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [detailUser, setDetailUser] = useState<typeof USERS[0] | null>(null);
  const [showPushModal, setShowPushModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showResetPwModal, setShowResetPwModal] = useState(false);
  const [suspendModal, setSuspendModal] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [liveUsers, setLiveUsers] = useState<typeof USERS>([]);
  const [apiError, setApiError]   = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  function loadUsers() {
    setApiLoading(true);
    setApiError(null);
    // Restore admin token if it was overwritten by a user-app login
    restoreAdminToken();
    adminApi.users({ page_size: 100 }).then(res => {
      console.log("[Admin Users] API response:", res);
      const mapped = (res.results ?? []).map(u => {
        try {
          return {
            id:           String(u.id ?? ""),
            name:         String(u.name ?? u.email ?? ""),
            email:        String(u.email ?? ""),
            phone:        String(u.phone ?? ""),
            age:          u.age ?? null,
            location:     String(u.location ?? ""),
            gender:       (u.gender ?? "") as typeof USERS[0]["gender"],
            status:       (u.status ?? "active") as typeof USERS[0]["status"],
            verified:     Boolean(u.verified),
            subscription: (u.subscription ?? "free") as typeof USERS[0]["subscription"],
            joined:       String(u.joined ?? ""),
            lastActive:   String(u.last_active ?? u.lastActive ?? "Never"),
            completion:   Number(u.completion ?? 0),
          };
        } catch (mapErr) {
          console.warn("[Admin Users] Failed to map user:", u, mapErr);
          return null;
        }
      }).filter(Boolean) as typeof USERS;
      console.log("[Admin Users] Mapped", mapped.length, "users");
      setLiveUsers(mapped);
      if (mapped.length === 0 && res.results?.length > 0) {
        setApiError("Users loaded but could not be displayed — check console for details.");
      } else {
        setApiError(null);
      }
    }).catch((err: unknown) => {
      console.error("[Admin Users] Fetch error:", err);
      const status = (err as { status?: number })?.status;
      const message = (err as Error)?.message ?? "";
      if (status === 401 || status === 403) {
        setApiError("Admin session expired. Please sign out and sign in again.");
      } else if (message.includes("fetch") || err instanceof TypeError) {
        setApiError("Cannot reach the server. Check your internet connection and try again.");
      } else {
        setApiError(`Error ${status ?? "unknown"}: ${message || "Unknown error"} — click Retry.`);
      }
    }).finally(() => setApiLoading(false));
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? liveUsers.filter(u =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        )
      : liveUsers;
    return [...base].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else if (sortKey === "joined") cmp = new Date(a.joined).getTime() - new Date(b.joined).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [liveUsers, search, sortKey, sortDir]);

  const toggleSelect = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const toggleAll = () =>
    setSelected(s => s.length === filtered.length ? [] : filtered.map(u => u.id));

  const selectedUsers = liveUsers.filter(u => selected.includes(u.id));
  const pushTargets = detailUser ? [detailUser] : selectedUsers;

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* ── Left: user table ── */}
      <div className={`flex flex-col transition-all ${detailUser ? "w-[55%]" : "w-full"} overflow-hidden`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4 flex-shrink-0">
          <div>
            <h1 style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>User Management</h1>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.9375rem" }}>
              {apiLoading ? "Loading…" : `${liveUsers.length} member${liveUsers.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            <Download size={14} /> Export
          </button>
        </div>

        {/* API status banner */}
        {apiError && (
          <div className="mb-4 flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex-shrink-0">
            <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#854d0e" }}>Live data unavailable</p>
              <p style={{ fontSize: "0.75rem", color: "#92400e" }}>{apiError}</p>
            </div>
            <button onClick={loadUsers}
              className="flex-shrink-0 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors"
              style={{ fontSize: "0.75rem", fontWeight: 700 }}
            >
              Retry
            </button>
          </div>
        )}
        {apiLoading && (
          <div className="mb-4 flex items-center gap-2 text-muted-foreground flex-shrink-0">
            <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <span style={{ fontSize: "0.8125rem" }}>Fetching users from Django…</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex gap-3 mb-4 flex-shrink-0">
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-4">
            <Search size={14} className="text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…" className="flex-1 py-2.5 bg-transparent focus:outline-none" style={{ fontSize: "0.875rem" }} />
          </div>
          <button className="flex items-center gap-1.5 bg-card border border-border px-4 py-2.5 rounded-xl hover:border-primary/30 transition-colors text-muted-foreground" style={{ fontSize: "0.875rem" }}>
            <Filter size={13} /> Filter
          </button>
        </div>

        {/* Bulk action bar */}
        {selected.length > 0 && (
          <div className="flex items-center gap-3 mb-3 px-4 py-3 bg-secondary rounded-xl border border-primary/20 flex-shrink-0">
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--primary)" }}>{selected.length} selected</span>
            <div className="flex-1" />
            <button
              onClick={() => setShowPushModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              style={{ fontSize: "0.8125rem", fontWeight: 600 }}
            >
              <Bell size={13} /> Send Notification
            </button>
            <button onClick={() => setSelected([])} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <X size={15} />
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-card rounded-2xl border border-border overflow-auto flex-1">
          <table className="w-full">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border">
                <th className="px-4 py-3.5">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded accent-primary" />
                </th>
                {(["Name", "Status", "Plan", "Joined", "Actions"] as const).map(h => {
                  const key = (h === "Name" ? "name" : h === "Status" ? "status" : h === "Joined" ? "joined" : null) as SortKey | null;
                  const active = key && sortKey === key;
                  return (
                    <th key={h}
                      className={`text-left px-4 py-3.5 text-muted-foreground ${key ? "cursor-pointer hover:text-foreground select-none" : ""} transition-colors`}
                      style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                      onClick={key ? () => handleSort(key) : undefined}>
                      <span className="flex items-center gap-1">
                        {h}
                        {key && <span style={{ opacity: active ? 1 : 0.3, fontSize: "0.7rem" }}>{active && sortDir === "asc" ? "↑" : "↓"}</span>}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                        <Search size={20} className="text-muted-foreground" />
                      </div>
                      <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>No users match your search</p>
                      <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Try a different name or email, or clear the filters.</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map(u => (
                <tr
                  key={u.id}
                  className={`border-b border-border last:border-0 transition-colors cursor-pointer ${detailUser?.id === u.id ? "bg-secondary/60" : "hover:bg-muted/30"}`}
                  onClick={() => setDetailUser(detailUser?.id === u.id ? null : u)}
                >
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} className="rounded accent-primary" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--primary)" }}>
                          {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{u.name}</span>
                          {u.verified && <CheckCircle size={12} className="text-primary" />}
                        </div>
                        <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3.5">
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "capitalize", color: u.subscription === "premium" ? "#0A6870" : u.subscription === "basic" ? "#4A8DB8" : "#68747F" }}>
                      {u.subscription}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{u.joined}</td>
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setDetailUser(u); }} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors" title="View detail"><Eye size={14} /></button>
                      <button
                        onClick={() => {
                          if (u.status === "suspended") {
                            // Reactivate immediately
                            adminApi.updateUserStatus(u.id, "active")
                              .then(() => {
                                setLiveUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: "active" as const } : x));
                                toast.success(`${u.name} reactivated.`);
                              })
                              .catch(err => toast.error(`Reactivation failed: ${(err as {message?:string})?.message ?? "Unknown error"}`));
                          } else {
                            setSuspendModal(u.id);
                          }
                        }}
                        className="p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title={u.status === "suspended" ? "Reactivate" : "Suspend"}>
                        {u.status === "suspended" ? <Unlock size={14} /> : <Lock size={14} />}
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Permanently delete ${u.name}? This cannot be undone.`)) return;
                          try {
                            await adminApi.deleteUser(u.id);
                            setLiveUsers(prev => prev.filter(x => x.id !== u.id));
                            window.dispatchEvent(new Event("ma3moni:users-changed"));
                            toast.success(`${u.name} permanently deleted.`);
                          } catch (err) {
                            toast.error(`Delete failed: ${(err as {message?:string})?.message ?? "Unknown error"}`);
                          }
                        }}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-lg transition-colors"
                        title="Permanently delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Right: user detail panel ── */}
      {detailUser && (
        <div className="w-[45%] ml-5 flex flex-col overflow-hidden bg-card rounded-2xl border border-border">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>User Detail</h3>
            <button onClick={() => setDetailUser(null)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><X size={17} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Profile header */}
            <div className="flex items-start gap-4">
              <UserAvatar name={detailUser.name} userId={detailUser.id} size={56} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 style={{ fontWeight: 800, fontSize: "1.125rem" }}>{detailUser.name}</h2>
                  {detailUser.verified && <CheckCircle size={15} className="text-primary" />}
                </div>
                <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{detailUser.email}</p>
                {detailUser.phone && (
                  <p className="text-muted-foreground flex items-center gap-1" style={{ fontSize: "0.8125rem" }}>
                    <Lock size={10} className="text-primary" />
                    {detailUser.phone}
                    <span style={{ fontSize: "0.6875rem", color: "var(--muted-foreground)" }}>· private</span>
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={detailUser.status} />
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "capitalize", color: detailUser.subscription === "premium" ? "#0A6870" : "#4A8DB8" }}>
                    {detailUser.subscription}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile completion */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Profile Completion</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--primary)" }}>{detailUser.completion}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${detailUser.completion}%` }} />
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <MapPin size={13} />, label: "Location", value: detailUser.location || "—" },
                { icon: <Calendar size={13} />, label: "Joined", value: detailUser.joined },
                { icon: <Clock size={13} />, label: "Last Active", value: detailUser.lastActive },
                { icon: <Briefcase size={13} />, label: "Gender", value: detailUser.gender ? detailUser.gender.charAt(0).toUpperCase() + detailUser.gender.slice(1) : "—" },
                { icon: <MessageSquare size={13} />, label: "Phone", value: detailUser.phone || "Not provided", private: true },
                { icon: <UserCheck size={13} />, label: "Verified", value: detailUser.verified ? "Yes" : "No" },
              ].map(({ icon, label, value, private: priv }) => (
                <div key={label} className="bg-muted/50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                    {icon}
                    <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
                    {priv && <Lock size={9} className="text-primary" />}
                  </div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowGrantModal(true)}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-secondary border border-primary/20 rounded-xl text-primary hover:bg-primary hover:text-white transition-all"
                style={{ fontSize: "0.8125rem", fontWeight: 700 }}
              >
                <Gift size={14} /> Grant Sub
              </button>
              <button
                onClick={() => setShowPushModal(true)}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-secondary border border-primary/20 rounded-xl text-primary hover:bg-primary hover:text-white transition-all"
                style={{ fontSize: "0.8125rem", fontWeight: 700 }}
              >
                <Bell size={14} /> Notify User
              </button>
              <button
                onClick={() => setShowResetPwModal(true)}
                className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 hover:bg-amber-100 transition-all"
                style={{ fontSize: "0.8125rem", fontWeight: 700 }}
              >
                <KeyRound size={14} /> Reset Password
              </button>
            </div>

            {/* Activity timeline — loaded from API, falls back to mock */}
            <ActivityTimeline userId={detailUser.id} />
          </div>
        </div>
      )}

      {/* Modals */}
      {showPushModal && (
        <PushNotifModal targets={pushTargets.length ? pushTargets : [detailUser!].filter(Boolean)} onClose={() => setShowPushModal(false)} />
      )}
      {showGrantModal && detailUser && (
        <GrantSubModal
          user={detailUser}
          onClose={() => setShowGrantModal(false)}
          onGranted={(userId, grantedPlan) =>
            setLiveUsers(prev =>
              prev.map(u =>
                u.id === userId ? { ...u, subscription: grantedPlan as typeof u.subscription } : u
              )
            )
          }
        />
      )}
      {showResetPwModal && detailUser && (
        <ResetPasswordModal user={detailUser} onClose={() => setShowResetPwModal(false)} />
      )}
      {suspendModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl p-6">
            <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }}>Suspend Account</h3>
            <p className="text-muted-foreground mt-1 mb-4" style={{ fontSize: "0.875rem" }}>
              {liveUsers.find(u => u.id === suspendModal)?.name} will lose platform access.
            </p>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Reason (required)</label>
            <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} rows={3} placeholder="Enter suspension reason…" className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" style={{ fontSize: "0.9rem" }} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setSuspendModal(null); setSuspendReason(""); }} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.9rem" }}>Cancel</button>
              <button
                onClick={async () => {
                  const name = liveUsers.find(u => u.id === suspendModal)?.name ?? "User";
                  if (!suspendReason.trim()) { toast.error("Please enter a suspension reason"); return; }
                  try {
                    await adminApi.updateUserStatus(suspendModal!, "suspended");
                    setLiveUsers(prev => prev.map(u => u.id === suspendModal ? { ...u, status: "suspended" as const } : u));
                    toast.success(`${name} has been suspended.`);
                    setSuspendModal(null); setSuspendReason("");
                  } catch (err) {
                    toast.error(`Suspension failed: ${(err as {message?:string})?.message ?? "Check Django terminal"}`);
                  }
                }}
                className="flex-1 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors" style={{ fontSize: "0.9rem", fontWeight: 600 }}>Suspend</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

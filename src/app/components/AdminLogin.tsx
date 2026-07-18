import { useState } from "react";
import { Eye, EyeOff, Shield, AlertCircle, Heart, Lock, ChevronRight, ChevronLeft } from "lucide-react";
import type { AdminRole } from "./AdminRoot";
import { auth as apiAuth, setAdminTokens, toFrontendRole, ApiError } from "../../lib/api";

interface AdminSession {
  role: AdminRole;
  name: string;
  email: string;
}

interface AdminLoginProps {
  onLogin: (session: AdminSession) => void;
}

const ROLE_LABELS: Record<AdminRole, string> = {
  "super-admin":   "Super Admin",
  "admin":         "Admin",
  "blog-admin":    "Blog Admin",
  "customer-care": "Customer Care Agent",
};

const ROLE_DESC: Record<AdminRole, string> = {
  "super-admin":   "Full platform access + user creation",
  "admin":         "User & content management",
  "blog-admin":    "Blog creation & content management",
  "customer-care": "Support ticket access",
};

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent]   = useState(false);
  const [slowLogin, setSlowLogin]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSlowLogin(false);

    // After 4 s with no response, hint that the server may be cold-starting
    const slowTimer = setTimeout(() => setSlowLogin(true), 4000);

    try {
      const res = await apiAuth.login(identifier.trim(), password);
      clearTimeout(slowTimer);

      const frontendRole = toFrontendRole(res.user.role);
      if (!frontendRole) {
        setLoading(false);
        setError("This account does not have admin access.");
        return;
      }

      setAdminTokens(res.access, res.refresh);

      // Fetch real full name from profile — fall back to email if profile not set
      let displayName = res.user.email;
      try {
        const me = await apiAuth.me();
        displayName = me.profile?.full_name?.trim() || res.user.email;
      } catch {}

      setLoading(false);
      onLogin({
        role:  frontendRole,
        name:  displayName,
        email: res.user.email,
      });
    } catch (err) {
      clearTimeout(slowTimer);
      setLoading(false);
      setSlowLogin(false);
      if (err instanceof ApiError && err.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (err instanceof TypeError) {
        setError("Cannot reach the server. Check your connection and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  // ── Forgot password panel ──────────────────────────────
  if (showForgot) {
    return (
      <div className="size-full flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm">
          <button onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors" style={{ fontSize: "0.875rem" }}>
            <ChevronLeft size={16} /> Back to sign in
          </button>
          {forgotSent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <Shield size={28} className="text-primary" />
              </div>
              <h2 style={{ fontWeight: 800, fontSize: "1.5rem" }}>Check your inbox</h2>
              <p className="text-muted-foreground mt-3" style={{ fontSize: "0.9375rem", lineHeight: 1.7 }}>
                If <strong>{forgotEmail}</strong> is registered as an admin, a reset link has been sent by our security team.
              </p>
              <button onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }}
                className="mt-8 w-full py-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" style={{ fontWeight: 700 }}>
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontWeight: 800, fontSize: "1.625rem" }}>Reset your password</h2>
              <p className="text-muted-foreground mt-2 mb-8" style={{ fontSize: "0.9375rem" }}>Enter your admin email and we'll send a reset link.</p>
              <form onSubmit={async e => { e.preventDefault(); await new Promise(r => setTimeout(r, 600)); setForgotSent(true); }}>
                <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Admin Email</label>
                <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="admin@ma3moni.com" required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4" style={{ fontSize: "0.9375rem" }} />
                <button type="submit" className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" style={{ fontWeight: 700, fontSize: "1rem" }}>
                  Send Reset Link
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="size-full flex">
      {/* ── Left panel — branding ──────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 flex-shrink-0"
        style={{ width: "42%", background: "var(--sidebar)" }}
      >
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <Heart size={18} className="fill-white text-white" />
            </div>
            <div>
              <p className="logo-font" style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--sidebar-foreground)" }}>Ma3moni</p>
              <p style={{ fontSize: "0.75rem", color: "rgba(203,213,224,0.5)", fontWeight: 500 }}>Admin Portal</p>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8" style={{ background: "rgba(255,255,255,0.07)", fontSize: "0.8125rem", color: "rgba(203,213,224,0.7)" }}>
              <Shield size={13} />
              Secure Administrative Access
            </div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--sidebar-foreground)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Platform<br />
              <span style={{ color: "var(--sidebar-primary)" }}>Control</span><br />
              Centre
            </h1>
            <p className="mt-5" style={{ fontSize: "1rem", color: "rgba(203,213,224,0.65)", lineHeight: 1.7, maxWidth: "340px" }}>
              Manage users, moderate content, review reports, and keep the Ma3moni community safe and trusted.
            </p>
          </div>
        </div>

        {/* Role list */}
        <div className="space-y-3">
          {(Object.entries(ROLE_LABELS) as [AdminRole, string][]).map(([role, label]) => (
            <div key={role} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--sidebar-primary)", opacity: 0.85 }}>
                <Lock size={13} className="text-white" />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--sidebar-foreground)" }}>{label}</p>
                <p style={{ fontSize: "0.75rem", color: "rgba(203,213,224,0.5)" }}>{ROLE_DESC[role]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — login form ───────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-background overflow-y-auto">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Heart size={14} className="fill-white text-white" />
            </div>
            <span className="logo-font" style={{ fontWeight: 800, fontSize: "1rem" }}>Ma3moni</span>
            <span className="ml-1 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>· Admin</span>
          </div>

          <div className="mb-8">
            <h2 style={{ fontWeight: 800, fontSize: "1.875rem", letterSpacing: "-0.03em" }}>Sign in</h2>
            <p className="text-muted-foreground mt-2" style={{ fontSize: "0.9375rem" }}>
              Administrative access only. This portal is not publicly accessible.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                Email address
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
                placeholder="admin@ma3moni.com"
                required
                autoComplete="username email"
                className="w-full px-4 py-3.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                style={{ fontSize: "0.9375rem" }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  style={{ fontSize: "0.9375rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle size={15} className="text-destructive flex-shrink-0" />
                <p style={{ fontSize: "0.875rem", color: "var(--destructive)" }}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ fontWeight: 700, fontSize: "1rem" }}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    {slowLogin ? "Server waking up…" : "Authenticating…"}
                  </div>
                  {slowLogin && (
                    <span style={{ fontSize: "0.75rem", opacity: 0.75 }}>This may take up to 30 s on first login</span>
                  )}
                </div>
              ) : (
                <>
                  Sign In
                  <ChevronRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={() => { setShowForgot(true); setForgotEmail(identifier); }}
              className="text-muted-foreground hover:text-primary transition-colors" style={{ fontSize: "0.875rem" }}>
              Forgot password?
            </button>
          </div>

          <p className="text-muted-foreground text-center mt-8" style={{ fontSize: "0.8125rem" }}>
            Unauthorized access is strictly prohibited and logged.
          </p>
        </div>
      </div>
    </div>
  );
}

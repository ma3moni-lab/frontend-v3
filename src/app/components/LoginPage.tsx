import { useState } from "react";
import { Eye, EyeOff, AlertCircle, ArrowRight, ChevronLeft, Phone, Shield, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { auth as apiAuth, setUserTokens, ApiError } from "../../lib/api";
import { Logo } from "./Logo";

export type UserPlan = "free" | "basic" | "premium";

interface LoginPageProps {
  onSuccess: (plan: UserPlan, profileComplete: boolean) => void;
  onSuspended: (reason: string, suspendedAt?: string, email?: string) => void;
  onRegister: () => void;
  onBack: () => void;
}

// ── Forgot password panel ──────────────────────────────────────
function ForgotPanel({ initialId, onBack }: { initialId: string; onBack: () => void }) {
  const [email,   setEmail]   = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiAuth.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center view-enter">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={24} className="text-primary" />
          </div>
          <h3 className="display-serif" style={{ fontSize: "1.75rem", color: "var(--foreground)" }}>
            Check your inbox
          </h3>
          <p className="text-muted-foreground mt-3 mb-8" style={{ fontSize: "0.9375rem", lineHeight: 1.7 }}>
            If <strong style={{ color: "var(--foreground)", fontWeight: 600 }}>{email}</strong> is registered,
            you'll receive a reset link shortly. Check your spam folder if you don't see it within a few minutes.
          </p>
          <button
            onClick={onBack}
            className="w-full py-3.5 rounded-xl border border-border bg-muted/60 hover:bg-muted transition-colors"
            style={{ fontWeight: 600, fontSize: "0.9375rem" }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-sm view-enter">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          style={{ fontSize: "0.875rem" }}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <h3 className="display-serif" style={{ fontSize: "2rem", color: "var(--foreground)" }}>
          Forgot password?
        </h3>
        <p className="text-muted-foreground mt-2 mb-7" style={{ fontSize: "0.9375rem", lineHeight: 1.65 }}>
          Enter your email and we'll send a reset link.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full px-4 py-3.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/35 transition-all"
              style={{ fontSize: "0.9375rem" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white transition-all active:scale-[0.97] disabled:opacity-55"
            style={{ fontWeight: 600, fontSize: "0.9375rem", background: "var(--primary)", boxShadow: loading ? "none" : "var(--shadow-primary)" }}
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Sending…</>
              : <>Send Reset Link <ArrowRight size={16} /></>
            }
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main login page ─────────────────────────────────────────────
export function LoginPage({ onSuccess, onSuspended, onRegister, onBack }: LoginPageProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [slow, setSlow]             = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSlow(false);
    const t = setTimeout(() => setSlow(true), 5000);
    try {
      const res = await apiAuth.login(identifier.trim(), password);
      clearTimeout(t);
      setUserTokens(res.access, res.refresh);
      try { localStorage.setItem("ma3moni_login_email", res.user.email); } catch {}
      setLoading(false);
      if (res.user.account_status === "suspended") {
        onSuspended(
          res.user.suspension_reason ?? "Your account has been suspended.",
          undefined,
          res.user.email,
        );
        return;
      }
      onSuccess(res.user.plan as UserPlan, res.user.profile_complete ?? false);
    } catch (err) {
      clearTimeout(t);
      setLoading(false);
      setSlow(false);
      if (err instanceof ApiError && (err.status === 403 || err.status === 401)) {
        const data = err.data as Record<string, unknown> | undefined;
        const status = data?.account_status as string | undefined;
        const reason = data?.suspension_reason as string | undefined;
        const suspendedAt = data?.suspended_at as string | undefined;
        if (status === "suspended" || reason) {
          onSuspended(
            reason ?? "Your account has been suspended by our moderation team.",
            suspendedAt,
            identifier.trim().includes("@") ? identifier.trim() : undefined,
          );
          return;
        }
        if (err.status === 401) {
          setError("Incorrect email/phone or password. Please try again.");
          return;
        }
      }
      if (err instanceof TypeError) {
        setError("Cannot reach the server. Check your internet connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="size-full bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontSize: "0.875rem" }}
        >
          <ChevronLeft size={18} /> Back
        </button>
        <Logo variant="full" size="sm" />
        <div style={{ width: 60 }} />
      </div>

      {showForgot ? (
        <ForgotPanel initialId={identifier.includes("@") ? identifier : ""} onBack={() => setShowForgot(false)} />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex">

            {/* Left panel — cinematic photo, desktop only */}
            <div
              className="hidden lg:flex flex-col justify-between flex-shrink-0 relative overflow-hidden"
              style={{ width: "42%" }}
            >
              {/* Photo */}
              <img
                src="https://images.unsplash.com/photo-1765292783732-2fadae02dd8f?w=840&h=1080&fit=crop&auto=format"
                alt="Couple embracing warmly outdoors"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: "center 30%" }}
              />

              {/* Gradient overlay — bottom-heavy, for text legibility */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to top, rgba(10,26,34,0.94) 0%, rgba(10,26,34,0.52) 42%, rgba(10,26,34,0.12) 100%)",
                }}
              />

              {/* Logo — top left, over photo */}
              <div className="relative p-10">
                <Logo variant="wordmark" theme="dark" size="md" />
              </div>

              {/* Bottom — headline + trust signals */}
              <div className="relative p-10">
                <h2
                  className="display-serif text-white"
                  style={{ fontSize: "2.125rem", lineHeight: 1.18 }}
                >
                  Welcome back.<br />Your journey<br />continues here.
                </h2>
                <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.60)", lineHeight: 1.75 }}>
                  Thousands of intentional individuals found their partner on Ma3moni.
                </p>

                <div className="mt-7 space-y-3">
                  {[
                    { icon: Shield,       text: "End-to-end encrypted messages" },
                    { icon: Sparkles,     text: "AI-powered compatibility matching" },
                    { icon: CheckCircle,  text: "100% manually verified profiles" },
                  ].map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex items-center gap-3"
                      style={{
                        padding: "0.625rem 0",
                        borderTop: "1px solid rgba(255,255,255,0.10)",
                      }}
                    >
                      <Icon size={14} className="flex-shrink-0" style={{ color: "rgba(255,255,255,0.55)" }} />
                      <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.72)", fontWeight: 500 }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — sign-in form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
              <div className="w-full max-w-[400px] view-enter">
                <div className="mb-8">
                  <h1 className="display-serif" style={{ fontSize: "2.25rem", color: "var(--foreground)" }}>Sign in</h1>
                  <p className="text-muted-foreground mt-2" style={{ fontSize: "0.9375rem", lineHeight: 1.65 }}>
                    Enter your email or phone number to continue.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Email or phone number</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={e => { setIdentifier(e.target.value); setError(""); }}
                        placeholder="you@example.com"
                        required
                        autoComplete="username email tel"
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/35 transition-all"
                        style={{ fontSize: "0.9375rem" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Password</label>
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-primary hover:opacity-75 transition-opacity"
                        style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(""); }}
                        placeholder="••••••••••"
                        required
                        autoComplete="current-password"
                        className="w-full px-4 py-3.5 pr-12 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/35 transition-all"
                        style={{ fontSize: "0.9375rem" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPw ? "Hide password" : "Show password"}
                      >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl" style={{ background: "rgba(196,30,55,0.06)", border: "1px solid rgba(196,30,55,0.14)" }}>
                      <AlertCircle size={14} className="text-destructive flex-shrink-0 mt-0.5" />
                      <p style={{ fontSize: "0.875rem", color: "var(--destructive)", lineHeight: 1.5 }}>{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white transition-all active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed mt-2"
                    style={{
                      fontWeight: 600,
                      fontSize: "0.9375rem",
                      background: "var(--primary)",
                      boxShadow: loading ? "none" : "var(--shadow-primary)",
                    }}
                  >
                    {loading ? (
                      <div className="flex flex-col items-center gap-1 w-full">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          {slow ? "Server waking up…" : "Signing in…"}
                        </div>
                        {slow && (
                          <span style={{ fontSize: "0.75rem", opacity: 0.65 }}>
                            First login may take up to 30 s on Render free tier
                          </span>
                        )}
                      </div>
                    ) : (
                      <>Sign In <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>

                <p className="text-center mt-7 text-muted-foreground" style={{ fontSize: "0.9375rem" }}>
                  Don't have an account?{" "}
                  <button
                    onClick={onRegister}
                    className="text-primary hover:opacity-75 transition-opacity"
                    style={{ fontWeight: 700 }}
                  >
                    Create account
                  </button>
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

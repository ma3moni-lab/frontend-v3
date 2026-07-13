import { useState } from "react";
import { Eye, EyeOff, Heart, AlertCircle, ArrowRight, ChevronLeft, Phone, Sparkles, Shield, CheckCircle } from "lucide-react";
import { auth as apiAuth, setUserTokens, ApiError } from "../../lib/api";

export type UserPlan = "free" | "basic" | "premium";

interface LoginPageProps {
  onSuccess: (plan: UserPlan, profileComplete: boolean) => void;
  onRegister: () => void;
  onBack: () => void;
}

// ── Forgot password panel ──────────────────────────────────────
function ForgotPanel({ initialId, onBack }: { initialId: string; onBack: () => void }) {
  const [id, setId]     = useState(initialId);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center view-enter">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={28} className="text-primary" />
          </div>
          <h3 style={{ fontWeight: 900, fontSize: "1.5rem", letterSpacing: "-0.025em" }}>Check your inbox</h3>
          <p className="text-muted-foreground mt-3 mb-8" style={{ fontSize: "0.9375rem", lineHeight: 1.75 }}>
            If <strong style={{ color: "var(--foreground)" }}>{id}</strong> is registered, you'll receive a reset link shortly.
          </p>
          <button onClick={onBack}
            className="w-full py-3.5 rounded-2xl border border-border bg-muted/40 hover:bg-muted transition-colors"
            style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-sm view-enter">
        <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-8 transition-colors" style={{ fontSize: "0.875rem" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <h3 style={{ fontWeight: 900, fontSize: "1.75rem", letterSpacing: "-0.035em" }}>Forgot password?</h3>
        <p className="text-muted-foreground mt-2 mb-7" style={{ fontSize: "0.9375rem" }}>Enter your email and we'll send a reset link.</p>
        <form onSubmit={async e => { e.preventDefault(); await new Promise(r => setTimeout(r, 500)); setSent(true); }} className="space-y-4">
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Email address</label>
            <input type="email" value={id} onChange={e => setId(e.target.value)} placeholder="you@example.com" required
              className="w-full px-4 py-3.5 rounded-2xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all"
              style={{ fontSize: "0.9375rem" }} />
          </div>
          <button type="submit"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white transition-all active:scale-[0.97]"
            style={{ fontWeight: 700, fontSize: "1rem", background: "linear-gradient(135deg, #0A6870, #0E8A95)", boxShadow: "0 6px 20px rgba(10,104,112,0.25)" }}>
            Send Reset Link <ArrowRight size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main login page ─────────────────────────────────────────────
export function LoginPage({ onSuccess, onRegister, onBack }: LoginPageProps) {
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
      onSuccess(res.user.plan as UserPlan, res.user.profile_complete ?? false);
    } catch (err) {
      clearTimeout(t);
      setLoading(false);
      setSlow(false);
      if (err instanceof ApiError && err.status === 401) {
        setError("Incorrect email/phone or password. Please try again.");
      } else if (err instanceof TypeError) {
        setError("Cannot reach the server. Check your internet connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="size-full bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white/80 backdrop-blur-sm flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "0.875rem" }}>
          <ChevronLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A6870, #14A8B4)" }}>
            <Heart size={13} className="text-white fill-white" />
          </div>
          <span className="logo-font" style={{ fontWeight: 800, fontSize: "1rem" }}>Ma3moni</span>
        </div>
        <div style={{ width: 60 }} />
      </div>

      {showForgot ? (
        <ForgotPanel initialId={identifier.includes("@") ? identifier : ""} onBack={() => setShowForgot(false)} />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex">
            {/* Left decorative panel — desktop only */}
            <div className="hidden lg:flex flex-col justify-between p-12 flex-shrink-0 relative overflow-hidden"
              style={{ width: "40%", background: "linear-gradient(160deg, #0A6870 0%, #0D8A95 60%, #0E9EA8 100%)" }}>
              <div className="absolute inset-0 dot-grid opacity-[0.06]" />
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-15" style={{ background: "white" }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-14">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                    <Heart size={16} className="text-white fill-white" />
                  </div>
                  <span className="logo-font text-white" style={{ fontWeight: 800, fontSize: "1.0625rem" }}>Ma3moni</span>
                </div>
                <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "white", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
                  Welcome back.<br />Your journey<br />continues here.
                </h2>
                <p style={{ marginTop: "1rem", fontSize: "0.9375rem", color: "rgba(255,255,255,0.70)", lineHeight: 1.75 }}>
                  Thousands of intentional individuals found their partner on Ma3moni. Your person might be waiting.
                </p>
              </div>
              <div className="relative space-y-3">
                {[
                  { icon: Shield,       text: "End-to-end encrypted messages" },
                  { icon: Sparkles,     text: "AI-powered compatibility matching" },
                  { icon: CheckCircle,  text: "100% manually verified profiles" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.10)" }}>
                    <Icon size={16} className="text-white/80 flex-shrink-0" />
                    <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
              <div className="w-full max-w-[400px] view-enter">
                <div className="mb-8">
                  <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.035em" }}>Sign in</h1>
                  <p className="text-muted-foreground mt-2" style={{ fontSize: "1rem" }}>
                    Enter your email or phone number to continue.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Email or phone number</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input type="text" value={identifier} onChange={e => { setIdentifier(e.target.value); setError(""); }}
                        placeholder="you@example.com or +234 800 000 0000" required autoComplete="username email tel"
                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all"
                        style={{ fontSize: "0.9375rem" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Password</label>
                      <button type="button" onClick={() => setShowForgot(true)}
                        className="text-primary hover:text-primary/75 transition-colors" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input type={showPw ? "text" : "password"} value={password}
                        onChange={e => { setPassword(e.target.value); setError(""); }}
                        placeholder="••••••••••" required autoComplete="current-password"
                        className="w-full px-4 py-3.5 pr-12 rounded-2xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all"
                        style={{ fontSize: "0.9375rem" }} />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPw ? "Hide password" : "Show password"}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl">
                      <AlertCircle size={15} className="text-destructive flex-shrink-0 mt-0.5" />
                      <p style={{ fontSize: "0.875rem", color: "var(--destructive)", lineHeight: 1.5 }}>{error}</p>
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white transition-all active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    style={{ fontWeight: 700, fontSize: "1rem", background: "linear-gradient(135deg, #0A6870, #0E8A95)", boxShadow: loading ? "none" : "0 6px 20px rgba(10,104,112,0.28)" }}>
                    {loading ? (
                      <div className="flex flex-col items-center gap-1 w-full">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          {slow ? "Server waking up…" : "Signing in…"}
                        </div>
                        {slow && <span style={{ fontSize: "0.75rem", opacity: 0.75 }}>First login may take up to 30 s on Render free tier</span>}
                      </div>
                    ) : (
                      <>Sign In <ArrowRight size={17} /></>
                    )}
                  </button>
                </form>

                <p className="text-center mt-7 text-muted-foreground" style={{ fontSize: "0.9375rem" }}>
                  Don't have an account?{" "}
                  <button onClick={onRegister} className="text-primary hover:text-primary/75 transition-colors" style={{ fontWeight: 700 }}>
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

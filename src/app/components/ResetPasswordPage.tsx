import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Eye, EyeOff, Heart, CheckCircle2, XCircle, Loader2, AlertCircle, ArrowRight, X,
} from "lucide-react";
import { auth as apiAuth, ApiError } from "../../lib/api";

// Kept in sync with backend PasswordComplexityValidator
const PW_RULES = [
  { label: "At least 8 characters",         test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter (A–Z)",     test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a–z)",     test: (p: string) => /[a-z]/.test(p) },
  { label: "One number (0–9)",               test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character (!@#$…)",  test: (p: string) => /[!@#$%^&*()\-_=+\[\]{}|;:'",.<>?/\\`~]/.test(p) },
];

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const token          = searchParams.get("token") ?? "";

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [showCf,    setShowCf]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);

  useEffect(() => {
    if (!token) {
      const t = setTimeout(() => navigate("/"), 3000);
      return () => clearTimeout(t);
    }
  }, [token, navigate]);

  const pwPassed        = PW_RULES.map(r => r.test(password));
  const allPwPass       = pwPassed.every(Boolean);
  const showRules       = password.length > 0;
  const confirmMismatch = confirm.length > 0 && confirm !== password;
  const canSubmit       = allPwPass && !confirmMismatch && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!allPwPass) { setError("Please meet all password requirements below."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }

    setLoading(true);
    try {
      await apiAuth.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, unknown> | undefined;
        // Show the specific server message (e.g. complexity rule from backend)
        // fall back to a generic message only when no parseable detail
        const detail = typeof data?.detail === "string" ? data.detail : null;
        if (detail) {
          setError(detail);
        } else if (err.status === 400) {
          setError("Invalid or expired reset link. Please request a new one.");
        } else {
          setError("Could not reset password — please try again or request a new link.");
        }
      } else {
        setError("Network error — please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── No token ──────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <XCircle size={56} className="mx-auto text-destructive mb-4" />
          <h2 style={{ fontWeight: 900, fontSize: "1.5rem" }}>Invalid link</h2>
          <p className="text-muted-foreground mt-2">This password reset link is missing its token. Redirecting you to the home page…</p>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm view-enter">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-primary" />
          </div>
          <h2 style={{ fontWeight: 900, fontSize: "1.75rem", letterSpacing: "-0.03em" }}>Password updated!</h2>
          <p className="text-muted-foreground mt-3 mb-8" style={{ fontSize: "0.9375rem", lineHeight: 1.75 }}>
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white transition-all"
            style={{ fontWeight: 700, fontSize: "1rem", background: "linear-gradient(135deg, #0A6870, #0E8A95)", boxShadow: "0 6px 20px rgba(10,104,112,0.25)" }}
          >
            Go to sign in <ArrowRight size={17} />
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-center px-6 py-4 border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A6870, #14A8B4)" }}>
            <Heart size={14} className="text-white fill-white" />
          </div>
          <span className="logo-font" style={{ fontWeight: 800, fontSize: "1.0625rem" }}>Ma3moni</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px] view-enter">
          <div className="mb-8">
            <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.035em" }}>Set new password</h1>
            <p className="text-muted-foreground mt-2" style={{ fontSize: "1rem" }}>
              Choose a strong password for your Ma3moni account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New password + live checklist */}
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>New password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="Create a strong password"
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3.5 pr-12 rounded-2xl border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all"
                  style={{
                    fontSize: "0.9375rem",
                    borderColor: showRules
                      ? (allPwPass ? "var(--primary)" : "var(--destructive)")
                      : "var(--border)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Live rule checklist */}
              {showRules && (
                <div className="mt-2.5 px-3.5 py-3 rounded-xl border border-border bg-muted/40 space-y-1.5">
                  {PW_RULES.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {pwPassed[i]
                        ? <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                        : <X size={13} className="text-muted-foreground flex-shrink-0" />
                      }
                      <span style={{
                        fontSize: "0.8125rem",
                        color: pwPassed[i] ? "var(--foreground)" : "var(--muted-foreground)",
                        fontWeight: pwPassed[i] ? 500 : 400,
                      }}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Confirm password</label>
              <div className="relative">
                <input
                  type={showCf ? "text" : "password"}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(""); }}
                  placeholder="Repeat your new password"
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3.5 pr-12 rounded-2xl border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all"
                  style={{
                    fontSize: "0.9375rem",
                    borderColor: confirmMismatch ? "var(--destructive)" : "var(--border)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCf(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmMismatch && (
                <p className="mt-1" style={{ fontSize: "0.75rem", color: "var(--destructive)" }}>
                  Passwords do not match.
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl">
                <AlertCircle size={15} className="text-destructive flex-shrink-0 mt-0.5" />
                <p style={{ fontSize: "0.875rem", color: "var(--destructive)", lineHeight: 1.5 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white transition-all active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{
                fontWeight: 700, fontSize: "1rem",
                background: "linear-gradient(135deg, #0A6870, #0E8A95)",
                boxShadow: canSubmit ? "0 6px 20px rgba(10,104,112,0.28)" : "none",
              }}
            >
              {loading ? <><Loader2 size={17} className="animate-spin" /> Saving…</> : <>Reset Password <ArrowRight size={17} /></>}
            </button>
          </form>

          <p className="text-center mt-6 text-muted-foreground" style={{ fontSize: "0.875rem" }}>
            Link expired?{" "}
            <button onClick={() => navigate("/")} className="text-primary hover:text-primary/75 transition-colors" style={{ fontWeight: 700 }}>
              Request a new one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

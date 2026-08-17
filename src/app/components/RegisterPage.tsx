import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, Heart, AlertCircle, ArrowRight, ChevronLeft, Phone, Mail, Shield, Gift, CheckCircle2, X } from "lucide-react";
import { auth as apiAuth, setUserTokens, ApiError, referrals as referralsApi } from "../../lib/api";
import type { UserPlan } from "./LoginPage";

const PENDING_REF_KEY = "ma3moni_pending_ref";

// Kept in sync with backend PasswordComplexityValidator
const PW_RULES = [
  { label: "At least 8 characters",         test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter (A–Z)",     test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a–z)",     test: (p: string) => /[a-z]/.test(p) },
  { label: "One number (0–9)",               test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character (!@#$…)",  test: (p: string) => /[!@#$%^&*()\-_=+\[\]{}|;:'",.<>?/\\`~]/.test(p) },
];

interface RegisterPageProps {
  onVerified: (plan: UserPlan, profileComplete: boolean, identifier: string) => void;
  onLogin: () => void;
  onBack: () => void;
}

// ─── OTP screen ───────────────────────────────────────────────────────────────
function OtpScreen({ identifier, onVerified, onBack }: {
  identifier: string;
  onVerified: (access: string, refresh: string, plan: UserPlan, profileComplete: boolean) => void;
  onBack: () => void;
}) {
  const [digits, setDigits]   = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [resent, setResent]   = useState(false);
  const [countdown, setCount] = useState(60);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current[0]?.focus();
    const id = setInterval(() => setCount(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const code = digits.join("");

  const handleDigit = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    setError("");
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(""));
      refs.current[5]?.focus();
    }
  };

  const submit = async () => {
    if (code.length !== 6) { setError("Enter all 6 digits."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await apiAuth.verifyOtp(identifier, code);
      setUserTokens(res.access, res.refresh);
      onVerified(res.access, res.refresh, res.user.plan as UserPlan, res.user.profile_complete ?? false);
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError) {
        setError(err.message || "Invalid or expired code.");
      } else {
        setError("Could not verify. Please try again.");
      }
    }
  };

  const resend = async () => {
    if (countdown > 0) return;
    await apiAuth.sendOtp(identifier).catch(() => {});
    setResent(true);
    setCount(60);
    const id = setInterval(() => setCount(c => { if (c <= 1) { clearInterval(id); return 0; } return c - 1; }), 1000);
  };

  return (
    <div className="size-full bg-background flex flex-col">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <button onClick={onBack} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontWeight: 600, fontSize: "1rem" }}>Verify your account</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Shield size={28} className="text-primary" />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.025em", textAlign: "center" }}>
            Enter the code
          </h2>
          <p className="text-muted-foreground mt-2 mb-8" style={{ fontSize: "0.9375rem", textAlign: "center", lineHeight: 1.6 }}>
            We sent a 6-digit code to <strong>{identifier}</strong>.<br />
            Check your inbox (and spam folder).
          </p>

          <div className="flex gap-2.5 justify-center mb-6" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-12 h-14 text-center rounded-xl border-2 border-border bg-input-background focus:outline-none focus:border-primary transition-all"
                style={{ fontSize: "1.5rem", fontWeight: 700,
                  borderColor: d ? "var(--primary)" : undefined }}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl mb-4">
              <AlertCircle size={14} className="text-destructive flex-shrink-0" />
              <p style={{ fontSize: "0.875rem", color: "var(--destructive)" }}>{error}</p>
            </div>
          )}

          <button onClick={submit} disabled={loading || code.length !== 6}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontWeight: 700, fontSize: "1rem" }}>
            {loading
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <><ArrowRight size={17} /> Verify & Continue</>}
          </button>

          <p className="text-center mt-5 text-muted-foreground" style={{ fontSize: "0.875rem" }}>
            {resent && <span className="text-green-600 block mb-1">Code resent!</span>}
            {countdown > 0
              ? <>Resend code in <strong>{countdown}s</strong></>
              : <button onClick={resend} className="text-primary font-semibold hover:text-primary/80 transition-colors">Resend code</button>
            }
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Registration form ────────────────────────────────────────────────────────
export function RegisterPage({ onVerified, onLogin, onBack }: RegisterPageProps) {
  const [mode, setMode]           = useState<"email" | "phone">("email");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [agreedToS, setAgreedToS] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [otpIdentifier, setOtpId] = useState("");
  const [referralCode, setReferralCode] = useState<string>(() => {
    try { return localStorage.getItem(PENDING_REF_KEY) ?? ""; } catch { return ""; }
  });
  const [refStatus, setRefStatus] = useState<"idle" | "valid" | "invalid">("idle");

  const identifier = mode === "email" ? email.toLowerCase().trim() : phone.trim();

  // Live password rule checks
  const pwPassed   = PW_RULES.map(r => r.test(password));
  const allPwPass  = pwPassed.every(Boolean);
  const showRules  = password.length > 0;
  const confirmMismatch = confirm.length > 0 && confirm !== password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!allPwPass) {
      setError("Please meet all password requirements before continuing.");
      return;
    }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (mode === "email" && !email.includes("@")) { setError("Enter a valid email address."); return; }
    if (mode === "phone" && phone.length < 7) { setError("Enter a valid phone number."); return; }
    if (!agreedToS) { setError("You must agree to the Terms of Service and Privacy Policy to continue."); return; }

    setLoading(true);
    try {
      const res = await apiAuth.register(
        mode === "email" ? email.toLowerCase().trim() : `${phone.replace(/\s/g, "")}@phone.ma3moni`,
        password,
        mode === "phone" ? phone.trim() : undefined,
      );
      setUserTokens(res.access, res.refresh);
      if (mode === "phone" && phone.trim()) {
        try {
          const raw = localStorage.getItem("ma3moni_onboarding_progress");
          const existing: Record<string, unknown> = raw
            ? (JSON.parse(raw) as { form?: Record<string, unknown> }).form ?? {}
            : {};
          localStorage.setItem("ma3moni_onboarding_progress", JSON.stringify({
            step: existing.step ?? 0,
            form: { ...existing, phone: phone.trim() },
          }));
        } catch {}
      }
      setOtpId(mode === "email" ? email.toLowerCase().trim() : phone.trim());
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError) {
        const data = err.data as Record<string, unknown> | null;
        if (data) {
          const SILENT_KEYS = new Set(["email", "phone", "password", "non_field_errors"]);
          const msgs: string[] = [];
          Object.entries(data).forEach(([k, v]) => {
            if (Array.isArray(v)) v.forEach(m => msgs.push(SILENT_KEYS.has(k) ? String(m) : `${k}: ${m}`));
            else if (typeof v === "string") msgs.push(v);
          });
          setError(msgs[0] ?? err.message);
        } else {
          setError(`Server error (${err.status}). Please try again.`);
        }
      } else {
        setError("Cannot reach the server. Check your connection.");
      }
    }
  };

  if (otpIdentifier) {
    return (
      <OtpScreen
        identifier={otpIdentifier}
        onVerified={async (_access, _refresh, plan, profileComplete) => {
          const code = referralCode.trim().toUpperCase();
          if (code) {
            try { await referralsApi.apply(code); } catch {}
            try { localStorage.removeItem(PENDING_REF_KEY); } catch {}
          }
          onVerified(plan, profileComplete, otpIdentifier);
        }}
        onBack={() => setOtpId("")}
      />
    );
  }

  return (
    <div className="size-full bg-background overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "0.9rem" }}>
          <ChevronLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Heart size={13} className="text-primary-foreground fill-primary-foreground" />
          </div>
          <span className="logo-font" style={{ fontWeight: 800, fontSize: "1rem" }}>Ma3moni</span>
        </div>
        <div style={{ width: 60 }} />
      </div>

      <div className="flex-1 px-6 py-8 max-w-[440px] mx-auto w-full">
        <div className="mb-7">
          <h1 style={{ fontSize: "1.875rem", fontWeight: 900, letterSpacing: "-0.035em" }}>Create your account</h1>
          <p className="text-muted-foreground mt-1.5" style={{ fontSize: "0.9375rem" }}>
            Start your journey to finding a meaningful, lasting partnership.
          </p>
        </div>

        {/* Email / Phone toggle */}
        <div className="flex rounded-xl border border-border p-1 mb-6" style={{ background: "var(--muted)" }}>
          {(["email", "phone"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all"
              style={{
                fontWeight: 600, fontSize: "0.875rem",
                background: mode === m ? "var(--card)" : "transparent",
                color: mode === m ? "var(--foreground)" : "var(--muted-foreground)",
                boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
              {m === "email" ? <Mail size={15} /> : <Phone size={15} />}
              {m === "email" ? "Email" : "Phone"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email or Phone */}
          {mode === "email" ? (
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Email address</label>
              <input
                type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                placeholder="you@example.com" required autoComplete="email"
                className="w-full px-4 py-3.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                style={{ fontSize: "0.9375rem" }}
              />
            </div>
          ) : (
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Phone number</label>
              <input
                type="tel" value={phone} onChange={e => { setPhone(e.target.value); setError(""); }}
                placeholder="+234 800 000 0000" required autoComplete="tel"
                className="w-full px-4 py-3.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                style={{ fontSize: "0.9375rem" }}
              />
              <p className="mt-1 text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                Include country code (e.g. +234 for Nigeria)
              </p>
            </div>
          )}

          {/* Password with live complexity checklist */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="Create a strong password" required autoComplete="new-password"
                className="w-full px-4 py-3.5 pr-12 rounded-xl border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                style={{
                  fontSize: "0.9375rem",
                  borderColor: showRules
                    ? (allPwPass ? "var(--primary)" : "var(--destructive)")
                    : "var(--border)",
                }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
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
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Confirm password</label>
            <div className="relative">
              <input
                type={showCf ? "text" : "password"} value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(""); }}
                placeholder="Repeat your password" required autoComplete="new-password"
                className="w-full px-4 py-3.5 pr-12 rounded-xl border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                style={{
                  fontSize: "0.9375rem",
                  borderColor: confirmMismatch ? "var(--destructive)" : "var(--border)",
                }}
              />
              <button type="button" onClick={() => setShowCf(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmMismatch && (
              <p className="mt-1" style={{ fontSize: "0.75rem", color: "var(--destructive)" }}>
                Passwords do not match.
              </p>
            )}
          </div>

          {/* Referral code — optional */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              Referral code <span className="text-muted-foreground" style={{ fontWeight: 400 }}>(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Gift size={15} />
              </div>
              <input
                type="text"
                value={referralCode}
                onChange={e => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12);
                  setReferralCode(val);
                  setRefStatus("idle");
                  try { if (val) localStorage.setItem(PENDING_REF_KEY, val); else localStorage.removeItem(PENDING_REF_KEY); } catch {}
                }}
                placeholder="MA3-XXXXXX"
                autoComplete="off"
                className="w-full pl-10 pr-10 py-3.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                style={{
                  fontSize: "0.9375rem", letterSpacing: "0.06em",
                  borderColor: refStatus === "valid" ? "var(--primary)" : refStatus === "invalid" ? "var(--destructive)" : undefined,
                }}
              />
              {refStatus === "valid" && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                  <CheckCircle2 size={16} />
                </div>
              )}
            </div>
            {referralCode && refStatus === "idle" && (
              <p className="mt-1 text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                Referral code will be applied after account verification.
              </p>
            )}
            {refStatus === "valid" && (
              <p className="mt-1 text-primary" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                Referral code will earn you both a bonus!
              </p>
            )}
          </div>

          {/* Terms of Service + Privacy Policy checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={agreedToS}
                onChange={e => { setAgreedToS(e.target.checked); setError(""); }}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                style={{
                  borderColor: agreedToS ? "var(--primary)" : "var(--border)",
                  background: agreedToS ? "var(--primary)" : "transparent",
                }}
              >
                {agreedToS && <CheckCircle2 size={13} className="text-primary-foreground" strokeWidth={3} />}
              </div>
            </div>
            <span style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", lineHeight: 1.6 }}>
              I have read and agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline"
                onClick={e => e.stopPropagation()}
              >
                Terms of Service
              </a>
              {" "}and{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline"
                onClick={e => e.stopPropagation()}
              >
                Privacy Policy
              </a>
            </span>
          </label>

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle size={15} className="text-destructive flex-shrink-0" />
              <p style={{ fontSize: "0.875rem", color: "var(--destructive)" }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !allPwPass || confirmMismatch || !agreedToS}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontWeight: 700, fontSize: "1rem" }}>
            {loading
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <><ArrowRight size={17} /> Create Account</>}
          </button>
        </form>

        <p className="text-center mt-6 text-muted-foreground" style={{ fontSize: "0.9375rem" }}>
          Already have an account?{" "}
          <button onClick={onLogin} className="text-primary font-semibold hover:text-primary/80 transition-colors">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

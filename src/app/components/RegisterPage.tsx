import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, Heart, AlertCircle, ArrowRight, ChevronLeft, Phone, Mail, Shield } from "lucide-react";
import { auth as apiAuth, setUserTokens, ApiError } from "../../lib/api";
import type { UserPlan } from "./LoginPage";

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

          {/* OTP digit boxes */}
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
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [otpIdentifier, setOtpId] = useState("");

  const identifier = mode === "email" ? email.toLowerCase().trim() : phone.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (mode === "email" && !email.includes("@")) { setError("Enter a valid email address."); return; }
    if (mode === "phone" && phone.length < 7) { setError("Enter a valid phone number."); return; }

    setLoading(true);
    try {
      const res = await apiAuth.register(
        mode === "email" ? email.toLowerCase().trim() : `${phone.replace(/\s/g, "")}@phone.ma3moni`,
        password,
        "",
        mode === "phone" ? phone.trim() : undefined,
      );
      setUserTokens(res.access, res.refresh);
      setOtpId(mode === "email" ? email.toLowerCase().trim() : phone.trim());
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError) {
        const data = err.data as Record<string, unknown> | null;
        if (data) {
          const msgs: string[] = [];
          Object.entries(data).forEach(([k, v]) => {
            if (Array.isArray(v)) v.forEach(m => msgs.push(k === "non_field_errors" ? String(m) : `${k}: ${m}`));
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

  // After registration succeeds, show OTP screen
  if (otpIdentifier) {
    return (
      <OtpScreen
        identifier={otpIdentifier}
        onVerified={(_access, _refresh, plan, profileComplete) =>
          onVerified(plan, profileComplete, otpIdentifier)
        }
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
            Start your journey to finding a halal partner.
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

          {/* Password */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="At least 8 characters" required autoComplete="new-password"
                className="w-full px-4 py-3.5 pr-12 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                style={{ fontSize: "0.9375rem" }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Confirm password</label>
            <div className="relative">
              <input
                type={showCf ? "text" : "password"} value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(""); }}
                placeholder="Repeat your password" required autoComplete="new-password"
                className="w-full px-4 py-3.5 pr-12 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                style={{ fontSize: "0.9375rem" }}
              />
              <button type="button" onClick={() => setShowCf(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle size={15} className="text-destructive flex-shrink-0" />
              <p style={{ fontSize: "0.875rem", color: "var(--destructive)" }}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontWeight: 700, fontSize: "1rem" }}>
            {loading
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <><ArrowRight size={17} /> Create Account</>}
          </button>

          <p className="text-muted-foreground text-center" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
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

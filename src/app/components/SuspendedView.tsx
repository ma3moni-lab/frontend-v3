import { useState } from "react";
import { Heart, ShieldOff, Send, CheckCircle, LogOut, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { auth as apiAuth } from "../../lib/api";

interface SuspendedViewProps {
  reason: string;         // Admin-supplied suspension reason
  suspendedAt?: string;   // ISO timestamp (optional)
  userEmail?: string;
  onSignOut: () => void;
}

export function SuspendedView({ reason, suspendedAt, userEmail, onSignOut }: SuspendedViewProps) {
  const [appealText, setAppealText] = useState("");
  const [step, setStep]             = useState<"idle" | "writing" | "submitting" | "done" | "error">("idle");
  const [showReason, setShowReason] = useState(true);

  const formattedDate = suspendedAt
    ? new Date(suspendedAt).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })
    : null;

  const submitAppeal = async () => {
    if (!appealText.trim()) return;
    setStep("submitting");
    try {
      await apiAuth.submitAppeal(appealText.trim());
      setStep("done");
    } catch {
      setStep("error");
    }
  };

  return (
    <div className="size-full bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A6870, #14A8B4)" }}>
            <Heart size={13} className="text-white fill-white" />
          </div>
          <span className="logo-font" style={{ fontWeight: 800, fontSize: "1rem" }}>Ma3moni</span>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontSize: "0.8125rem" }}>
          <LogOut size={14} />
          Sign out
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 max-w-lg mx-auto w-full">

        {/* Hero — suspension icon */}
        <div className="text-center py-4">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #D41F3A18, #D41F3A10)", border: "2px solid #D41F3A30" }}>
            <ShieldOff size={36} className="text-destructive" />
          </div>
          <h1 style={{ fontWeight: 900, fontSize: "1.5rem", letterSpacing: "-0.025em" }}>
            Account Suspended
          </h1>
          <p className="text-muted-foreground mt-2" style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}>
            Your account has been temporarily suspended by our moderation team.
          </p>
          {formattedDate && (
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem" }}>
              Suspended on {formattedDate}
            </p>
          )}
        </div>

        {/* Reason card */}
        <div className="rounded-2xl border border-destructive/25 bg-red-50 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left"
            onClick={() => setShowReason(s => !s)}>
            <div className="flex items-center gap-2.5">
              <AlertCircle size={17} className="text-destructive flex-shrink-0" />
              <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--destructive)" }}>
                Reason for suspension
              </span>
            </div>
            {showReason
              ? <ChevronUp size={16} className="text-destructive/60 flex-shrink-0" />
              : <ChevronDown size={16} className="text-destructive/60 flex-shrink-0" />}
          </button>
          {showReason && (
            <div className="px-5 pb-4 border-t border-destructive/15">
              <p className="mt-3" style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "#7F1D1D" }}>
                {reason || "No specific reason was provided. Please submit an appeal for more information."}
              </p>
            </div>
          )}
        </div>

        {/* What's disabled notice */}
        <div className="rounded-2xl border border-border bg-card px-5 py-4 space-y-2">
          <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>While suspended, you cannot:</p>
          {["View or send messages", "See matches or profiles", "Send interests", "Access your profile settings"].map(item => (
            <div key={item} className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
              </div>
              <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Appeal section */}
        <div className="rounded-2xl border border-primary/20 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Submit an appeal</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
              If you believe this suspension was made in error, explain your situation below. Our team reviews all appeals within 3–5 business days.
            </p>
            {userEmail && (
              <p className="text-muted-foreground mt-1" style={{ fontSize: "0.75rem" }}>
                Reply will be sent to: <strong className="text-foreground">{userEmail}</strong>
              </p>
            )}
          </div>

          {step === "done" ? (
            <div className="px-5 py-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={26} className="text-green-600" />
              </div>
              <p style={{ fontWeight: 700, fontSize: "1rem" }}>Appeal submitted</p>
              <p className="text-muted-foreground mt-1.5" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                Our moderation team will review your appeal and respond via email within 3–5 business days.
              </p>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-3">
              {step === "idle" ? (
                <button
                  onClick={() => setStep("writing")}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
                  style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                  <Send size={16} />
                  Write an appeal
                </button>
              ) : (
                <>
                  <textarea
                    value={appealText}
                    onChange={e => setAppealText(e.target.value)}
                    placeholder="Explain why you believe this suspension was made in error. Include any context that may be helpful for our team…"
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                    style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}
                    autoFocus
                  />
                  {step === "error" && (
                    <p className="text-destructive" style={{ fontSize: "0.8125rem" }}>
                      Something went wrong. Please try again or email us at support@ma3moni.com.
                    </p>
                  )}
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setStep("idle")}
                      className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors"
                      style={{ fontSize: "0.875rem" }}>
                      Cancel
                    </button>
                    <button
                      onClick={submitAppeal}
                      disabled={!appealText.trim() || step === "submitting"}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
                      style={{ fontWeight: 700, fontSize: "0.875rem" }}>
                      {step === "submitting"
                        ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        : <><Send size={14} /> Submit</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Contact support */}
        <div className="text-center pb-4">
          <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
            Need help? Email us at{" "}
            <a href="mailto:support@ma3moni.com" className="text-primary underline font-semibold">
              support@ma3moni.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Heart, Clock, RefreshCw } from "lucide-react";

interface MaintenancePageProps {
  endTime: number | null; // unix ms timestamp when maintenance ends (null = indefinite)
  message?: string;
}

export function MaintenancePage({ endTime, message }: MaintenancePageProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const diff = Math.max(0, endTime - Date.now());
      setRemaining(diff);
      if (diff === 0) {
        // Auto-reload when timer hits 0
        setTimeout(() => window.location.reload(), 1500);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const hours   = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <Heart size={18} className="text-primary-foreground fill-primary-foreground" />
        </div>
        <span className="logo-font" style={{ fontWeight: 800, fontSize: "1.375rem" }}>Ma3moni</span>
      </div>

      {/* Icon */}
      <div className="w-20 h-20 rounded-3xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-6 shadow-lg shadow-primary/10">
        <RefreshCw size={32} className="text-primary animate-spin" style={{ animationDuration: "3s" }} />
      </div>

      <h1 style={{ fontWeight: 900, fontSize: "1.875rem", letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
        We'll be right back
      </h1>
      <p className="text-muted-foreground max-w-sm" style={{ fontSize: "1rem", lineHeight: 1.7 }}>
        {message || "Ma3moni is currently undergoing scheduled maintenance to improve your experience. We apologise for any inconvenience."}
      </p>

      {/* Countdown */}
      {endTime && remaining > 0 && (
        <div className="mt-8">
          <p className="text-muted-foreground mb-3" style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Estimated time remaining
          </p>
          <div className="flex items-center gap-3">
            {[
              { val: pad(hours),   label: "Hours" },
              { val: pad(minutes), label: "Minutes" },
              { val: pad(seconds), label: "Seconds" },
            ].map(({ val, label }) => (
              <div key={label} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
                  <span style={{ fontSize: "1.625rem", fontWeight: 900, color: "var(--primary)", fontVariantNumeric: "tabular-nums" }}>
                    {val}
                  </span>
                </div>
                <span className="text-muted-foreground mt-1.5" style={{ fontSize: "0.6875rem", fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-4" style={{ fontSize: "0.8125rem" }}>
            The page will refresh automatically when maintenance ends.
          </p>
        </div>
      )}

      {endTime && remaining === 0 && (
        <div className="mt-8 flex items-center gap-2 text-primary" style={{ fontWeight: 700 }}>
          <RefreshCw size={16} /> Refreshing…
        </div>
      )}

      {!endTime && (
        <div className="mt-8 flex items-center gap-2 text-muted-foreground" style={{ fontSize: "0.875rem" }}>
          <Clock size={14} />
          Check back soon — we're working hard to restore service.
        </div>
      )}

      <p className="text-muted-foreground mt-10" style={{ fontSize: "0.75rem" }}>
        © 2026 Ma3moni · For urgent support contact <span className="text-primary">support@ma3moni.com</span>
      </p>
    </div>
  );
}

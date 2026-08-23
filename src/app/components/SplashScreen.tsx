import { useEffect, useState } from "react";
import { Logo } from "./Logo";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 200);
    const t2 = setTimeout(() => setPhase("out"), 1500);
    const t3 = setTimeout(() => onDone(), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: "#0A4A52",
        transition: "opacity 0.42s cubic-bezier(0.16,1,0.3,1)",
        opacity: phase === "out" ? 0 : 1,
        pointerEvents: phase === "out" ? "none" : "all",
      }}
    >
      {/* Warm amber glow — subtle, grounded, not a floating blob */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 480,
          height: 200,
          background: "radial-gradient(ellipse at 50% 100%, rgba(166,78,42,0.22) 0%, transparent 70%)",
        }}
      />

      {/* Top-right quiet highlight */}
      <div
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: 300,
          height: 300,
          background: "radial-gradient(ellipse at 100% 0%, rgba(20,160,172,0.12) 0%, transparent 65%)",
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-5">
        {/* Logo mark — frosted container, fav icon inside */}
        <div
          style={{
            animation: "fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <Logo variant="icon" theme="dark" size="lg" />
        </div>

        {/* Brand wordmark */}
        <span
          className="logo-font text-white"
          style={{
            fontSize: "2.125rem",
            fontWeight: 900,
            letterSpacing: "-0.025em",
            animation: "fadeUp 0.55s 0.08s cubic-bezier(0.16,1,0.3,1) both",
            opacity: 0,
          }}
        >
          Ma3moni
        </span>

        {/* Tagline */}
        <p
          style={{
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.45)",
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textAlign: "center",
            animation: "fadeUp 0.55s 0.18s cubic-bezier(0.16,1,0.3,1) both",
            opacity: 0,
          }}
        >
          Intentional connections
        </p>
      </div>

      {/* Loading indicator — minimal */}
      <div className="absolute bottom-14 flex items-center gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: i === 1 ? 6 : 4,
              height: i === 1 ? 6 : 4,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.35)",
              animation: `float 1.2s ${i * 0.18}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

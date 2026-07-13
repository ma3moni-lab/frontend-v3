import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

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
        background: "linear-gradient(160deg, #0A6870 0%, #0D8A95 55%, #0E9EA8 100%)",
        transition: "opacity 0.4s cubic-bezier(0.16,1,0.3,1)",
        opacity: phase === "out" ? 0 : 1,
        pointerEvents: phase === "out" ? "none" : "all",
      }}
    >
      {/* Background texture */}
      <div className="absolute inset-0 dot-grid opacity-[0.06]" />
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-15" style={{ background: "white" }} />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full blur-3xl opacity-10" style={{ background: "white" }} />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-4">
        {/* Logo icon */}
        <div
          className="w-20 h-20 rounded-3xl bg-white/15 border border-white/25 flex items-center justify-center shadow-2xl"
          style={{
            animation: "fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both",
            boxShadow: "0 20px 60px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          <Heart size={34} className="text-white fill-white" />
        </div>

        {/* Brand name */}
        <span
          className="logo-font text-white"
          style={{ fontSize: "2.25rem", fontWeight: 900, letterSpacing: "-0.03em", animation: "fadeUp 0.55s 0.1s cubic-bezier(0.16,1,0.3,1) both", opacity: 0 }}
        >
          Ma3moni
        </span>

        {/* Tagline */}
        <p
          style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.72)", fontWeight: 500, animation: "fadeUp 0.55s 0.2s cubic-bezier(0.16,1,0.3,1) both", opacity: 0 }}
        >
          Where intentional connections begin
        </p>
      </div>

      {/* Loading indicator */}
      <div className="absolute bottom-12 flex items-center gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="rounded-full bg-white"
            style={{
              width: i === 1 ? 8 : 5,
              height: i === 1 ? 8 : 5,
              opacity: i === 1 ? 0.9 : 0.45,
              animation: `float 1s ${i * 0.2}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

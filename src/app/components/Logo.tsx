/**
 * Logo — single source of truth for all Ma3moni brand marks.
 *
 * To update the brand images, replace the files in src/imports/:
 *   ma3moni_logo.png  — full wordmark
 *   favicon.png       — icon mark
 *
 * public/brand/ holds production copies for email templates and direct URLs.
 *
 * variant="full"      → ma3moni_logo.png (full wordmark)
 * variant="wordmark"  → favicon.png icon + "Ma3moni" text
 * variant="icon"      → favicon.png alone
 *
 * theme="light"  → mix-blend-mode:multiply removes the light background
 * theme="dark"   → white frosted container so the mark reads on dark/teal surfaces
 */
import fullLogo from "@/imports/ma3moni_logo.png";
import iconLogo from "@/imports/favicon.png";

interface LogoProps {
  variant?: "full" | "wordmark" | "icon";
  theme?: "light" | "dark";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  subtitle?: string;
}

const ICON_DIMS: Record<NonNullable<LogoProps["size"]>, string> = {
  xs: "w-5 h-5",
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

const FULL_HEIGHTS: Record<NonNullable<LogoProps["size"]>, number> = {
  xs: 22,
  sm: 28,
  md: 36,
  lg: 52,
};

const TEXT_SIZES: Record<NonNullable<LogoProps["size"]>, string> = {
  xs: "0.8125rem",
  sm: "0.9rem",
  md: "1rem",
  lg: "1.25rem",
};

export function Logo({
  variant = "wordmark",
  theme = "light",
  size = "md",
  className = "",
  subtitle,
}: LogoProps) {
  /* ── Full wordmark image ──────────────────────────────────────────────────── */
  if (variant === "full") {
    return (
      <img
        src={fullLogo}
        alt="Ma3moni"
        style={{
          height: FULL_HEIGHTS[size],
          width: "auto",
          mixBlendMode: theme === "light" ? "multiply" : undefined,
        }}
        className={`object-contain select-none ${className}`}
        draggable={false}
      />
    );
  }

  /* ── Icon mark ─────────────────────────────────────────────────────────────
     Light: mix-blend-mode:multiply removes the off-white background.
     Dark:  white frosted container so the icon reads on dark/teal surfaces.   */
  const iconEl =
    theme === "dark" ? (
      <div
        className={`${ICON_DIMS[size]} rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center`}
        style={{
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
        }}
      >
        <img
          src={iconLogo}
          alt="Ma3moni mark"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    ) : (
      <div className={`${ICON_DIMS[size]} rounded-lg overflow-hidden flex-shrink-0`}>
        <img
          src={iconLogo}
          alt="Ma3moni mark"
          className="w-full h-full object-contain"
          style={{ mixBlendMode: "multiply" }}
          draggable={false}
        />
      </div>
    );

  if (variant === "icon") {
    return <div className={className}>{iconEl}</div>;
  }

  /* ── Wordmark: icon + text ─────────────────────────────────────────────────── */
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {iconEl}
      <div className="flex flex-col leading-none">
        <span
          className="logo-font"
          style={{
            fontWeight: 800,
            fontSize: TEXT_SIZES[size],
            color: theme === "dark" ? "white" : undefined,
            letterSpacing: "-0.01em",
          }}
        >
          Ma3moni
        </span>
        {subtitle && (
          <span
            style={{
              fontSize: "0.625rem",
              fontWeight: 500,
              letterSpacing: "0.04em",
              color:
                theme === "dark"
                  ? "rgba(203,213,224,0.55)"
                  : "var(--muted-foreground)",
              marginTop: "1px",
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

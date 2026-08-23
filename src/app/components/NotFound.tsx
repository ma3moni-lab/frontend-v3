import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="size-full flex flex-col items-center justify-center bg-background gap-6 px-6 text-center">
      <Logo variant="icon" size="lg" />
      <div>
        <h1 style={{ fontSize: "4rem", fontWeight: 900, color: "var(--primary)", lineHeight: 1, letterSpacing: "-0.04em" }}>404</h1>
        <p style={{ fontWeight: 700, fontSize: "1.25rem", marginTop: 12 }}>Page not found</p>
        <p className="text-muted-foreground mt-2" style={{ fontSize: "0.9375rem" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
        style={{ fontWeight: 600 }}
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>
    </div>
  );
}

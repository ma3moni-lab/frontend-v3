import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { Heart, Menu, X, ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { to: "/about",   label: "About" },
  { to: "/stories", label: "Stories" },
  { to: "/blog",    label: "Blog" },
  { to: "/contact", label: "Contact" },
];

export function MarketingLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="size-full overflow-y-auto bg-background flex flex-col">
      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border flex-shrink-0">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Heart size={16} className="text-primary-foreground fill-primary-foreground" />
            </div>
            <span style={{ fontWeight: 700, fontSize: "1.125rem", letterSpacing: "-0.02em", color: "var(--foreground)" }}>
              Ma3moni
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg transition-colors ${pathname === to ? "text-primary bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                style={{ fontSize: "0.9375rem" }}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontSize: "0.9375rem" }}
            >
              Sign In
            </Link>
            <Link
              to="/"
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              style={{ fontSize: "0.875rem", fontWeight: 600 }}
            >
              Get Started <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setOpen(o => !o)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-border bg-card px-6 py-4 space-y-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 rounded-xl transition-colors ${pathname === to ? "text-primary bg-secondary" : "text-foreground hover:bg-muted"}`}
                style={{ fontSize: "1rem" }}
              >
                {label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-border flex gap-3">
              <Link to="/" onClick={() => setOpen(false)} className="flex-1 py-3 text-center border border-border rounded-xl text-foreground hover:bg-muted transition-colors" style={{ fontSize: "0.9375rem" }}>
                Sign In
              </Link>
              <Link to="/" onClick={() => setOpen(false)} className="flex-1 py-3 text-center bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors" style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Content ─────────────────────────────────────── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-border bg-card flex-shrink-0">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Heart size={15} className="text-primary-foreground fill-primary-foreground" />
                </div>
                <span className="logo-font" style={{ fontWeight: 800, fontSize: "1.0625rem" }}>Ma3moni</span>
              </Link>
              <p className="text-muted-foreground" style={{ fontSize: "0.9rem", lineHeight: 1.7, maxWidth: "260px" }}>
                A compatibility-first marriage platform for serious individuals seeking lifelong partnerships.
              </p>
            </div>
            {[
              { heading: "Platform", links: [{ to: "/", label: "Get Started" }, { to: "/stories", label: "Success Stories" }, { to: "/about", label: "About Us" }] },
              { heading: "Resources", links: [{ to: "/blog", label: "Blog" }, { to: "/contact", label: "Support" }, { to: "/contact", label: "Contact Us" }] },
              { heading: "Legal", links: [{ to: "/privacy", label: "Privacy Policy" }, { to: "/terms", label: "Terms of Service" }] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "1rem" }}>{heading}</p>
                <div className="space-y-2">
                  {links.map(({ to, label }) => (
                    <Link key={label} to={to} className="block text-muted-foreground hover:text-primary transition-colors" style={{ fontSize: "0.875rem" }}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>© 2026 Ma3moni. All rights reserved.</p>
            <div className="flex items-center gap-4 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

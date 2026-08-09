import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import {
  Heart, Shield, Star, Users, ArrowRight, CheckCircle,
  Menu, X, Eye, Target, Lock, Globe, Zap, MapPin, Calendar,
  Quote, Clock, ChevronDown, ChevronUp, Send, Tag, Mail,
  MessageCircle, Check, Sparkles, TrendingUp, Award,
} from "lucide-react";
import { BlogDetail } from "./BlogDetail";
import { blog, type BlogArticle } from "../../lib/api";

const u = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`;

const SCROLL_NAV = [
  { id: "about",   label: "About" },
  { id: "contact", label: "Contact" },
];

// ─────────────────────────── DATA ────────────────────────────────
const CORE_VALUES = [
  { icon: Shield,  title: "Integrity",      desc: "We never compromise on trust. Every decision is made with honesty and accountability." },
  { icon: Heart,   title: "Dignity",        desc: "Every member deserves respect. We design for the whole person, not just the profile." },
  { icon: Target,  title: "Intentionality", desc: "We avoid addictive patterns. Ma3moni is built for purpose, not compulsion." },
  { icon: Lock,    title: "Privacy",        desc: "Your data belongs to you. We collect only what's necessary and never sell it." },
  { icon: Star,    title: "Compatibility",  desc: "Depth over volume. A handful of aligned matches beats thousands of superficial ones." },
  { icon: Globe,   title: "Inclusivity",    desc: "Love transcends borders. We build for serious individuals everywhere." },
];

const STORIES = [
  {
    id: 1, names: "Yusuf & Aisha", location: "Dubai, UAE", married: "March 2025", score: 94,
    photo: u("1672184702625-71ddc099768e", 800, 600),
    quote: "Ma3moni was the first platform where I felt someone actually understood what I was looking for — and why.",
    story: "Yusuf is a software architect. Aisha is a pediatric nurse. They matched on values around family, spirituality, and service. Engaged within six months.",
  },
  {
    id: 2, names: "Omar & Fatima", location: "London, UK", married: "September 2024", score: 91,
    photo: u("1712948222259-752aa0bcae58", 800, 600),
    quote: "The compatibility breakdown helped us have real conversations from day one. The big things were already aligned.",
    story: "Omar is a civil engineer. Fatima is a teacher. They lived in different cities but shared identical views on home and family. They moved to London together after their wedding.",
  },
  {
    id: 3, names: "Hassan & Lina", location: "Amsterdam, Netherlands", married: "February 2025", score: 92,
    photo: u("1696738806828-dfd185176ee1", 800, 600),
    quote: "We had a 92% score and were both skeptics. A year into marriage we keep finding the algorithm was right about things we didn't even ask about.",
    story: "Hassan is a product designer. Lina is a biomedical researcher. They matched across cities, both open to relocation. Amsterdam won.",
  },
];

const FAQS = [
  { q: "How does the compatibility score work?", a: "Our algorithm analyses 40+ data points across values, lifestyle, communication style, life goals, and partner preferences. Each dimension is weighted based on your stated priorities." },
  { q: "Is my profile visible to everyone?", a: "No. Profiles are only shown to individuals who meet your stated compatibility preferences. You control visibility and can pause or hide your profile at any time." },
  { q: "How long does profile moderation take?", a: "Profile photos are reviewed within 24 hours. You'll be notified when your photo is approved or if changes are requested." },
  { q: "Can I change my preferences after onboarding?", a: "Yes, at any time from Profile → Partner Preferences. Changing preferences updates your active matches accordingly." },
  { q: "How do I delete my account?", a: "Go to Profile → Settings → Delete Account. All data is permanently removed within 30 days." },
];

const PRIVACY_SUMMARY = `Ma3moni collects only the information needed to match you with compatible partners. We never sell your data to third parties. Messages are encrypted end-to-end. You have the right to access, correct, or delete your data at any time. For the full Privacy Policy, email privacy@ma3moni.com.`;
const TERMS_SUMMARY = `By using Ma3moni, you confirm you are 18+, single, and genuinely seeking a long-term relationship. You agree not to impersonate others, send spam, or misuse the platform. Subscriptions are billed monthly and can be cancelled anytime. For the full Terms of Service, email legal@ma3moni.com.`;

function firstParagraphText(content: string, maxLen = 200): string {
  if (!content) return "";
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      const first = parsed.find((b: { type: string; text?: string }) => b.type === "paragraph" && b.text);
      if (first?.text) {
        const plain = (first.text as string).replace(/[*_`#>~]/g, "").trim();
        return plain.length > maxLen ? plain.slice(0, maxLen).trimEnd() + "…" : plain;
      }
    }
  } catch {}
  const chunk = content.split(/\n{2,}|\n/)[0].trim();
  const plain = chunk.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`#>~]/g, "").trim();
  return plain.length > maxLen ? plain.slice(0, maxLen).trimEnd() + "…" : plain;
}

const TRUST_ITEMS = [
  "256-bit encryption",
  "Manual profile review",
  "No data selling",
  "GDPR compliant",
  "Values-first design",
];

// ─────────────────────────── POLICY MODAL ────────────────────────
function PolicyModal({ title, content, onClose }: { title: string; content: string; onClose: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-border bg-card/95 backdrop-blur-sm z-10 rounded-t-2xl">
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 text-muted-foreground" style={{ fontSize: "0.9375rem", lineHeight: 1.8 }}>{content}</div>
        <div className="px-6 pb-6">
          <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
            For the complete document, contact <strong style={{ color: "var(--primary)" }}>legal@ma3moni.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── STAT COUNTER ────────────────────────
function StatCard({ value, label, suffix = "" }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="text-center">
      <p className="text-primary" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
        {value}{suffix}
      </p>
      <p className="text-muted-foreground mt-1.5" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{label}</p>
    </div>
  );
}

// ─────────────────────────── HERO VISUAL ─────────────────────────
function HeroVisual() {
  return (
    <div className="relative w-full max-w-[400px] mx-auto select-none" style={{ height: "500px" }}>
      {/* Main photo — editorial portrait crop */}
      <div
        className="absolute inset-0 overflow-hidden bg-muted"
        style={{ borderRadius: "1.25rem", boxShadow: "var(--shadow-xl)" }}
      >
        <img
          src="https://images.unsplash.com/photo-1776266098669-11331e211e97?w=620&h=760&fit=crop&auto=format"
          alt="Couple standing together in sunlight"
          className="w-full h-full object-cover"
          style={{ objectPosition: "center 15%" }}
        />
        {/* Bottom gradient for badge legibility */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(10,26,34,0.72) 0%, rgba(10,26,34,0.10) 45%, transparent 65%)" }}
        />
      </div>

      {/* Active members — top right */}
      <div
        className="absolute top-4 right-4 bg-card/92 backdrop-blur-sm rounded-xl border border-border/50 flex items-center gap-2 px-3 py-2"
        style={{ boxShadow: "var(--shadow-md)" }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <span style={{ fontSize: "0.6875rem", fontWeight: 600 }}>12k+ active</span>
      </div>

      {/* Compatibility badge — bottom overlay */}
      <div className="absolute bottom-5 left-5 right-5">
        <div
          className="bg-card/96 backdrop-blur-md rounded-xl border border-border/60 p-4"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles size={15} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--foreground)" }}>94% Compatibility</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.6875rem", marginTop: 2 }}>Values · Goals · Lifestyle aligned</p>
            </div>
            <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--primary)", flexShrink: 0 }}>94%</span>
          </div>
          <div className="mt-3 flex gap-1">
            {["Values", "Goals", "Lifestyle"].map((label, i) => (
              <div key={label} className="flex-1">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: ["94%", "91%", "88%"][i], background: "var(--primary)", opacity: 0.7 + i * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Verified badge — left edge */}
      <div
        className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 flex items-center gap-2 px-3 py-2"
        style={{ boxShadow: "var(--shadow-md)" }}
      >
        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
          <Check size={11} className="text-green-600" />
        </div>
        <span style={{ fontSize: "0.6875rem", fontWeight: 600 }}>Verified Profile</span>
      </div>
    </div>
  );
}

// ─────────────────────────── MAIN ────────────────────────────────
interface LandingProps { onStart: () => void; onLogin: () => void; }

export function Landing({ onStart, onLogin }: LandingProps) {
  const [mobileOpen, setMobileOpen]         = useState(false);
  const [scrolled, setScrolled]             = useState(false);
  const [openFaq, setOpenFaq]               = useState<number | null>(null);
  const [showPrivacy, setShowPrivacy]       = useState(false);
  const [showTerms, setShowTerms]           = useState(false);
  const [contactForm, setContactForm]       = useState({ name: "", email: "", subject: "", message: "" });
  const [contactSent, setContactSent]       = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [landingArticles, setLandingArticles] = useState<BlogArticle[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    blog.articles().then(r => setLandingArticles(r.results.slice(0, 3))).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: Event) => { setSelectedArticle((e as CustomEvent).detail as string); };
    window.addEventListener("openArticle", handler);
    return () => window.removeEventListener("openArticle", handler);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 24);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  if (selectedArticle !== null) {
    return (
      <BlogDetail
        articleId={selectedArticle}
        onBack={() => { setSelectedArticle(null); setTimeout(() => scrollTo("blog"), 80); }}
        onStart={onStart}
      />
    );
  }

  const sendContact = (e: React.FormEvent) => { e.preventDefault(); setContactSent(true); };

  return (
    <div ref={scrollRef} className="size-full overflow-y-auto overflow-x-hidden bg-background">

      {/* ══════════════════════ NAV ════════════════════════════════ */}
      <nav
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(247,244,239,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(28,21,16,0.09)" : "1px solid transparent",
          boxShadow: scrolled ? "0 1px 12px rgba(28,21,16,0.06)" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)" }}>
              <Heart size={15} className="text-white fill-white" />
            </div>
            <span className="logo-font" style={{ fontWeight: 800, fontSize: "1.125rem", letterSpacing: "-0.01em" }}>Ma3moni</span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-0.5">
            <button
              onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
              className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontSize: "0.9rem" }}
            >Home</button>
            {SCROLL_NAV.map(({ id, label }) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                style={{ fontSize: "0.9rem" }}>{label}</button>
            ))}
            <Link to="/blog"
              className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontSize: "0.9rem" }}>Blog</Link>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-2">
            <button onClick={onLogin}
              className="hidden sm:flex items-center px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted/60 transition-all"
              style={{ fontSize: "0.875rem", fontWeight: 600, boxShadow: "var(--shadow-sm)" }}>
              Sign In
            </button>
            <button onClick={onStart}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white transition-all active:scale-[0.97]"
              style={{ fontSize: "0.875rem", fontWeight: 600, background: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
              Get Started <ArrowRight size={14} />
            </button>
            <button
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3 space-y-1">
            {[
              { label: "Home", action: () => { scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }); setMobileOpen(false); } },
              ...SCROLL_NAV.map(({ id, label }) => ({ label, action: () => scrollTo(id) })),
            ].map(({ label, action }) => (
              <button key={label} onClick={action}
                className="flex w-full items-center px-4 py-3 rounded-xl text-foreground hover:bg-muted/60 transition-colors text-left"
                style={{ fontSize: "0.9375rem" }}>{label}</button>
            ))}
            <Link to="/blog" onClick={() => setMobileOpen(false)}
              className="flex px-4 py-3 rounded-xl text-foreground hover:bg-muted/60 transition-colors"
              style={{ fontSize: "0.9375rem" }}>Blog</Link>
            <div className="pt-2 pb-1 flex gap-2">
              <button onClick={onLogin} className="flex-1 py-3 rounded-xl border border-border bg-card text-center" style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Sign In</button>
              <button onClick={onStart} className="flex-1 py-3 rounded-xl text-white text-center" style={{ fontSize: "0.9375rem", fontWeight: 600, background: "var(--primary)" }}>Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════════ HERO ═══════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: "92vh", display: "flex", alignItems: "center" }}>
        {/* Clean warm surface — no dot-grid, no blobs */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 70% 40%, rgba(11,94,102,0.06) 0%, transparent 60%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(166,78,42,0.05) 0%, transparent 55%)" }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-20 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <div className="view-enter">
            {/* Eyebrow — editorial label, not pill */}
            <div className="flex items-center gap-2 mb-5">
              <div className="w-5 h-px bg-primary" />
              <span className="text-primary" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Marriage-first · Values-led · Private
              </span>
            </div>

            {/* Headline — Instrument Serif for editorial weight */}
            <h1
              className="display-serif"
              style={{ fontSize: "clamp(2.75rem, 5.5vw, 4.5rem)", color: "var(--foreground)" }}
            >
              Where Intentional<br />
              <em>Connections</em><br />
              Begin
            </h1>

            <p className="mt-5 text-muted-foreground" style={{ fontSize: "1.0625rem", lineHeight: 1.75, maxWidth: "460px" }}>
              A compatibility-first platform for serious individuals seeking meaningful, lifelong partnerships. No noise. No distractions. Just genuine connection.
            </p>

            {/* CTA row */}
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <button onClick={onStart}
                className="group flex items-center justify-center gap-2 text-white px-8 py-4 rounded-xl transition-all active:scale-[0.97]"
                style={{ fontSize: "0.9375rem", fontWeight: 600, background: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
                Begin Your Journey
                <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => scrollTo("about")}
                className="flex items-center justify-center gap-2 bg-card border border-border px-8 py-4 rounded-xl hover:bg-muted/40 transition-all"
                style={{ fontSize: "0.9375rem", fontWeight: 600, boxShadow: "var(--shadow-sm)" }}>
                Learn More
              </button>
            </div>

            {/* Trust row */}
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
              {["Verified profiles only", "End-to-end encryption", "No data selling"].map(t => (
                <div key={t} className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
                  <CheckCircle size={13} className="text-primary flex-shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — cinematic photo visual */}
          <div className="flex items-center justify-center view-enter-up">
            <HeroVisual />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground opacity-50">
          <div className="w-5 h-8 rounded-full border-2 border-current flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════ STATS BAR ══════════════════════════ */}
      <div className="border-y border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-3 gap-8 md:gap-16 text-center">
            <StatCard value="12,400" suffix="+" label="Verified Members" />
            <StatCard value="4,200" suffix="+" label="Successful Matches" />
            <StatCard value="98" suffix="%" label="Satisfaction Score" />
          </div>
          <div className="mt-8 pt-6 border-t border-border flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {TRUST_ITEMS.map(item => (
              <div key={item} className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
                <Check size={13} className="text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════ FEATURES ═══════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-primary mb-3" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Why Ma3moni is different
          </p>
          <h2 className="display-serif" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "var(--foreground)" }}>
            Built for the most important<br />decision of your life
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto" style={{ fontSize: "1.0625rem", lineHeight: 1.7 }}>
            Every feature is designed with a single goal: a platform worthy of a serious commitment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Star, color: "var(--primary)", bg: "var(--secondary)",
              title: "Deep Compatibility Engine",
              desc: "Our algorithm analyses 40+ dimensions — values, lifestyle, communication style, life goals — to surface genuinely aligned matches.",
              highlight: "40+ compatibility factors",
            },
            {
              icon: Shield, color: "var(--accent)", bg: "#F5EBE3",
              title: "Verified & Trusted Platform",
              desc: "Every profile is manually reviewed before activation. Verification badges, moderation tools, and trust indicators keep the community safe.",
              highlight: "100% manual verification",
            },
            {
              icon: Users, color: "#4A8DB8", bg: "#EBF3FA",
              title: "Intentional by Design",
              desc: "No infinite scroll. No swipe culture. A curated set of high-quality daily matches — so you invest in people, not patterns.",
              highlight: "Curated daily matches",
            },
          ].map(({ icon: Icon, color, bg, title, desc, highlight }) => (
            <div key={title}
              className="group bg-card rounded-2xl border border-border p-7 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              style={{ boxShadow: "var(--shadow-sm)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105"
                style={{ background: bg }}>
                <Icon size={20} style={{ color }} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.625rem", letterSpacing: "-0.01em" }}>{title}</h3>
              <p className="text-muted-foreground" style={{ fontSize: "0.9375rem", lineHeight: 1.7 }}>{desc}</p>
              <div className="mt-5 pt-4 border-t border-border">
                <span className="inline-flex items-center gap-1.5" style={{ fontSize: "0.8125rem", fontWeight: 700, color }}>
                  <TrendingUp size={12} /> {highlight}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section className="border-y border-border py-24 px-6" style={{ background: "var(--card)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary mb-3" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Your journey
            </p>
            <h2 className="display-serif" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "var(--foreground)" }}>
              From sign-up to<br />meaningful connection
            </h2>
            <p className="text-muted-foreground mt-4" style={{ fontSize: "1.0625rem" }}>Four thoughtful steps — no shortcuts, no pressure.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line (desktop) */}
            <div
              className="absolute top-10 left-[12.5%] right-[12.5%] h-px hidden lg:block"
              style={{ background: "linear-gradient(90deg, transparent, rgba(11,94,102,0.18), rgba(11,94,102,0.18), rgba(11,94,102,0.18), transparent)" }}
            />

            {[
              { step: "01", title: "Create Your Profile", desc: "Share who you are — values, goals, life vision, and what you're genuinely looking for.", icon: "✍️" },
              { step: "02", title: "Set Deep Preferences", desc: "Use our structured preference system to define what truly matters, not just surface-level traits.", icon: "⚙️" },
              { step: "03", title: "Review Curated Matches", desc: "A small set of high-quality, compatible people delivered daily. No endless scrolling.", icon: "💡" },
              { step: "04", title: "Connect with Purpose", desc: "Start a conversation when you're ready. No pressure, no timers, no games.", icon: "💬" },
            ].map(({ step, title, desc, icon }, i) => (
              <div key={step} className="relative group">
                <div className="bg-background rounded-2xl border border-border p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 h-full"
                  style={{ boxShadow: "var(--shadow-sm)" }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: i === 0 ? "var(--primary)" : "var(--secondary)" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: i === 0 ? "white" : "var(--primary)", letterSpacing: "0.01em" }}>{step}</span>
                  </div>
                  <div className="text-2xl mb-3">{icon}</div>
                  <h4 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>{title}</h4>
                  <p className="text-muted-foreground" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <button onClick={onStart}
              className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-xl transition-all active:scale-[0.97]"
              style={{ fontSize: "0.9375rem", fontWeight: 600, background: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
              Start Your Profile <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════ ABOUT ══════════════════════════════ */}
      <section id="about" className="py-24 px-6 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary mb-3" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              About Ma3moni
            </p>
            <h2 className="display-serif" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "var(--foreground)", maxWidth: "680px", margin: "0 auto" }}>
              We built Ma3moni because this mattered too much to get wrong
            </h2>
            <p className="text-muted-foreground mt-5 max-w-2xl mx-auto" style={{ fontSize: "1.0625rem", lineHeight: 1.8 }}>
              Most platforms optimise for engagement. We optimise for outcomes. When someone trusts you with finding a life partner, engagement metrics mean nothing if they don't find the right person.
            </p>
          </div>

          {/* Vision + Mission */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-14">
            {/* Vision — sophisticated dark, private-club quality */}
            <div className="rounded-2xl p-8 relative overflow-hidden editorial-dark">
              <div className="flex items-center gap-2 mb-5 relative">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
                  <Eye size={14} className="text-white/80" />
                </div>
                <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)" }}>Our Vision</span>
              </div>
              <p className="display-serif text-white" style={{ fontSize: "1.375rem", lineHeight: 1.5 }}>
                A world where every individual who seeks a lifelong partner can find them with clarity, dignity, and intention.
              </p>
            </div>

            {/* Mission — warm tinted surface */}
            <div className="rounded-2xl p-8 border border-primary/15 relative overflow-hidden"
              style={{ background: "var(--secondary)", boxShadow: "var(--shadow-sm)" }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target size={14} className="text-primary" />
                </div>
                <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--primary)" }}>Our Mission</span>
              </div>
              <p className="display-serif text-primary" style={{ fontSize: "1.375rem", lineHeight: 1.5 }}>
                To build a compatibility-first platform that prioritises meaningful, lasting relationships — guided by shared values and genuine human connection.
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <Zap size={14} className="text-primary" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)" }}>Core Values</span>
            </div>
            <h3 className="display-serif" style={{ fontSize: "1.875rem", color: "var(--foreground)" }}>Six principles behind every decision</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CORE_VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="bg-card rounded-xl border border-border p-6 hover:border-primary/25 hover:shadow-md transition-all duration-300 group"
                style={{ boxShadow: "var(--shadow-sm)" }}>
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <Icon size={17} />
                </div>
                <p style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.375rem", letterSpacing: "-0.01em" }}>{title}</p>
                <p className="text-muted-foreground" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ STORIES ════════════════════════════ */}
      <section id="stories" className="border-y border-border py-24 px-6 scroll-mt-16" style={{ background: "var(--card)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary mb-3" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Real Couples
            </p>
            <h2 className="display-serif" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "var(--foreground)" }}>
              Stories that began with a<br />
              <em>compatibility score</em>
            </h2>
          </div>

          <div className="space-y-6">
            {STORIES.map((s, i) => (
              <div key={s.id}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 ${i % 2 === 1 ? "lg:[direction:rtl]" : ""}`}
                style={{ boxShadow: "var(--shadow-md)" }}>
                {/* Photo */}
                <div className="relative overflow-hidden bg-muted" style={{ minHeight: "280px", direction: "ltr" }}>
                  <img src={s.photo} alt={s.names} loading="lazy" decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    style={{ minHeight: 280 }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(12,20,34,0.38) 0%, transparent 50%)" }} />
                  {/* Score badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 rounded-xl px-3 py-1.5 glass">
                    <Sparkles size={12} className="text-primary" />
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--primary)" }}>{s.score}% Compatible</span>
                  </div>
                  {/* Location */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white" style={{ fontSize: "0.8125rem" }}>
                    <MapPin size={12} />
                    <span style={{ fontWeight: 600 }}>{s.location}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="bg-background p-8 lg:p-10 flex flex-col justify-center" style={{ direction: "ltr" }}>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                    <Quote size={14} className="text-primary" />
                  </div>
                  <blockquote className="display-serif-italic" style={{ fontSize: "1.125rem", lineHeight: 1.65, marginBottom: "1.5rem", color: "var(--foreground)" }}>
                    "{s.quote}"
                  </blockquote>
                  <div className="h-px bg-border mb-4" />
                  <h3 style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.015em", marginBottom: "0.375rem" }}>{s.names}</h3>
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
                    <Calendar size={12} />
                    <span style={{ fontSize: "0.875rem" }}>Married {s.married}</span>
                  </div>
                  <p className="text-muted-foreground" style={{ fontSize: "0.9375rem", lineHeight: 1.7 }}>{s.story}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button onClick={onStart}
              className="inline-flex items-center gap-2 text-white px-9 py-4 rounded-xl transition-all active:scale-[0.97]"
              style={{ fontSize: "0.9375rem", fontWeight: 600, background: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
              Begin Your Story <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════ BLOG ════════════════════════════════ */}
      <section id="blog" className="py-24 px-6 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
            <div>
              <p className="text-primary mb-3" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Ma3moni Journal
              </p>
              <h2 className="display-serif" style={{ fontSize: "clamp(1.875rem, 4vw, 2.5rem)", color: "var(--foreground)" }}>
                Insights on intentional relationships
              </h2>
              <p className="text-muted-foreground mt-3" style={{ fontSize: "1rem" }}>Research, advice, and real stories for those seeking a lasting partnership.</p>
            </div>
            <Link to="/blog"
              className="flex-shrink-0 flex items-center gap-2 border border-primary text-primary px-5 py-2.5 rounded-xl hover:bg-primary hover:text-white transition-all"
              style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              All articles <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {landingArticles.length === 0 ? (
              <p className="text-muted-foreground col-span-3 text-center py-8" style={{ fontSize: "0.9375rem" }}>Articles coming soon.</p>
            ) : landingArticles.map((post, idx) => (
              <button key={post.id}
                onClick={() => { setSelectedArticle(post.slug); scrollRef.current?.scrollTo({ top: 0 }); }}
                className={`text-left bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/25 hover:shadow-lg transition-all duration-300 group ${idx === 0 ? "md:col-span-1" : ""}`}
                style={{ boxShadow: "var(--shadow-sm)" }}>
                <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: "16/9" }}>
                  {post.cover_image ? (
                    <img src={post.cover_image} alt={post.title} loading="lazy" decoding="async"
                      className="absolute inset-0 w-full h-full object-contain" />
                  ) : (
                    <div className="absolute inset-0 bg-secondary" />
                  )}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(28,21,16,0.18) 0%, transparent 50%)" }} />
                  {post.category && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-white"
                      style={{ fontSize: "0.6875rem", fontWeight: 700, background: "var(--primary)" }}>
                      {post.category.name}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 style={{ fontWeight: 700, fontSize: "1rem", lineHeight: 1.45, marginBottom: "0.625rem", letterSpacing: "-0.01em" }}>{post.title}</h3>
                  <p className="text-muted-foreground" style={{ fontSize: "0.875rem", lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {firstParagraphText(post.content || "")}
                  </p>
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.8125rem" }}>{post.author?.full_name ?? "Ma3moni Team"}</p>
                      {post.published_at && (
                        <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                          <Clock size={11} />
                          <span style={{ fontSize: "0.75rem" }}>{new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                      )}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center transition-all duration-200 group-hover:bg-primary group-hover:shadow-sm">
                      <ArrowRight size={13} className="text-primary group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ CONTACT / FAQ ══════════════════════ */}
      <section id="contact" className="border-y border-border py-24 px-6 scroll-mt-16" style={{ background: "var(--card)" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact form */}
          <div>
            <p className="text-primary mb-4" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Contact & Support
            </p>
            <h2 className="display-serif" style={{ fontSize: "2rem", color: "var(--foreground)", marginBottom: "0.75rem" }}>
              We're here to help
            </h2>
            <p className="text-muted-foreground mb-7" style={{ fontSize: "1rem" }}>Our team responds within 4 business hours.</p>

            {contactSent ? (
              <div className="bg-secondary rounded-2xl border border-primary/15 p-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Check size={22} className="text-primary" />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "1.25rem", letterSpacing: "-0.02em" }}>Message received!</h3>
                <p className="text-muted-foreground mt-2 mb-6" style={{ fontSize: "0.9375rem" }}>
                  We'll reply to <strong style={{ color: "var(--foreground)" }}>{contactForm.email}</strong> within 4 business hours.
                </p>
                <button
                  onClick={() => { setContactSent(false); setContactForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="px-6 py-2.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
                  style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={sendContact} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Full Name", key: "name", type: "text", placeholder: "Yusuf Al-Rashid" },
                    { label: "Email", key: "email", type: "email", placeholder: "you@example.com" },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                      <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{label}</label>
                      <input type={type} value={contactForm[key as keyof typeof contactForm]}
                        onChange={e => setContactForm(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder} required
                        className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/35 transition-all"
                        style={{ fontSize: "0.9rem" }} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Subject</label>
                  <select value={contactForm.subject} onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))} required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                    style={{ fontSize: "0.9rem" }}>
                    <option value="">Select topic…</option>
                    <option>Account & Profile</option>
                    <option>Matching & Compatibility</option>
                    <option>Subscription & Billing</option>
                    <option>Technical Issue</option>
                    <option>Safety & Reporting</option>
                    <option>Privacy & Data</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Message</label>
                  <textarea value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Describe your question or issue in detail…" rows={4} required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/35 transition-all resize-none"
                    style={{ fontSize: "0.9rem" }} />
                </div>
                <button type="submit"
                  className="flex items-center gap-2 text-white px-7 py-3.5 rounded-xl transition-all active:scale-[0.97]"
                  style={{ fontWeight: 600, fontSize: "0.9375rem", background: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
                  <Send size={15} /> Send Message
                </button>
              </form>
            )}

            <div className="flex flex-wrap gap-4 mt-6">
              {[
                { icon: Mail, label: "support@ma3moni.com" },
                { icon: MessageCircle, label: "Live Chat (Mon–Fri)" },
                { icon: Clock, label: "~4 hr response time" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
                  <Icon size={13} className="text-primary" /> {label}
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h3 className="display-serif" style={{ fontSize: "1.625rem", color: "var(--foreground)", marginBottom: "1.5rem" }}>
              Frequently Asked Questions
            </h3>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-background rounded-xl border border-border overflow-hidden transition-all">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-card transition-colors gap-3">
                    <span style={{ fontWeight: 600, fontSize: "0.9375rem", flex: 1 }}>{faq.q}</span>
                    <div className={`w-6 h-6 rounded-full border border-border flex items-center justify-center flex-shrink-0 transition-all ${openFaq === i ? "bg-primary border-primary" : "bg-card"}`}>
                      {openFaq === i
                        ? <ChevronUp size={12} className="text-white" />
                        : <ChevronDown size={12} className="text-muted-foreground" />}
                    </div>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5">
                      <p className="text-muted-foreground" style={{ fontSize: "0.9375rem", lineHeight: 1.75 }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ FINAL CTA ══════════════════════════ */}
      {/* Dark editorial — private-club sophistication */}
      <section className="relative overflow-hidden py-24 px-6 editorial-dark">
        {/* Warm ambient light from below — tasteful, not blobby */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ width: 600, height: 250, background: "radial-gradient(ellipse at 50% 100%, rgba(166,78,42,0.16) 0%, transparent 65%)" }}
        />
        <div
          className="absolute top-0 right-0 pointer-events-none"
          style={{ width: 400, height: 300, background: "radial-gradient(ellipse at 100% 0%, rgba(11,94,102,0.14) 0%, transparent 65%)" }}
        />

        <div className="relative text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-7">
            <div className="h-px w-12 bg-white/20" />
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
              Begin your journey
            </span>
            <div className="h-px w-12 bg-white/20" />
          </div>
          <h2
            className="display-serif text-white"
            style={{ fontSize: "clamp(2.25rem, 5vw, 3.25rem)", lineHeight: 1.12 }}
          >
            Ready to begin<br />
            <em>your</em> journey?
          </h2>
          <p className="mt-4 mb-9" style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,0.58)", lineHeight: 1.75 }}>
            Join a growing community of serious individuals who chose depth over speed, and found their person on Ma3moni.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={onStart}
              className="inline-flex items-center justify-center gap-2 bg-white px-9 py-4 rounded-xl hover:bg-white/92 transition-all active:scale-[0.97]"
              style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--primary)", boxShadow: "0 8px 32px rgba(0,0,0,0.30)" }}>
              Get Started — It's Free <ArrowRight size={17} />
            </button>
            <button onClick={onLogin}
              className="inline-flex items-center justify-center gap-2 border border-white/20 bg-white/8 text-white px-9 py-4 rounded-xl hover:bg-white/12 transition-all"
              style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
              Already a member? Sign In
            </button>
          </div>
          <p className="mt-5" style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.38)" }}>No credit card required · Free to browse matches</p>
        </div>
      </section>

      {/* ══════════════════════ FOOTER ═════════════════════════════ */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)" }}>
                <Heart size={14} className="text-white fill-white" />
              </div>
              <span className="logo-font" style={{ fontWeight: 800, fontSize: "1.0625rem" }}>Ma3moni</span>
            </div>
            <p className="text-muted-foreground mb-5" style={{ fontSize: "0.875rem", lineHeight: 1.75, maxWidth: "240px" }}>
              A compatibility-first marriage platform for serious individuals seeking lifelong partnerships.
            </p>
            <div className="flex gap-2">
              {["integrity", "dignity", "privacy"].map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-secondary text-muted-foreground rounded-lg capitalize" style={{ fontSize: "0.6875rem", fontWeight: 600 }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {[
            {
              heading: "Platform",
              links: [
                { label: "Get Started", action: onStart },
                { label: "How It Works", action: () => scrollTo("about") },
                { label: "Success Stories", action: () => scrollTo("stories") },
              ],
            },
            {
              heading: "Resources",
              links: [
                { label: "Blog & Journal", action: () => window.location.assign("/blog") },
                { label: "Support Centre", action: () => scrollTo("contact") },
                { label: "FAQ", action: () => scrollTo("contact") },
                { label: "Admin Portal", action: () => window.location.assign("/app/admin") },
              ],
            },
            {
              heading: "Legal",
              links: [
                { label: "Privacy Policy", action: () => setShowPrivacy(true) },
                { label: "Terms of Service", action: () => setShowTerms(true) },
              ],
            },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <p style={{ fontWeight: 700, fontSize: "0.75rem", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--foreground)" }}>{heading}</p>
              <div className="space-y-2.5">
                {links.map(({ label, action }) => (
                  <button key={label} onClick={action}
                    className="block text-muted-foreground hover:text-primary transition-colors text-left"
                    style={{ fontSize: "0.875rem" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer bottom */}
        <div className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>© 2026 Ma3moni. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {[
                { label: "Privacy", action: () => setShowPrivacy(true) },
                { label: "Terms", action: () => setShowTerms(true) },
                { label: "Contact", action: () => scrollTo("contact") },
              ].map(({ label, action }) => (
                <button key={label} onClick={action}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  style={{ fontSize: "0.8125rem" }}>{label}</button>
              ))}
              <a href="/app/admin" className="text-muted-foreground hover:text-primary transition-colors" style={{ fontSize: "0.8125rem" }}>Admin</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ══════════════════════ POLICY MODALS ══════════════════════ */}
      {showPrivacy && <PolicyModal title="Privacy Policy" content={PRIVACY_SUMMARY} onClose={() => setShowPrivacy(false)} />}
      {showTerms  && <PolicyModal title="Terms of Service" content={TERMS_SUMMARY} onClose={() => setShowTerms(false)} />}
    </div>
  );
}

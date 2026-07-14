import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import {
  Heart, Shield, Star, Users, ArrowRight, CheckCircle,
  Menu, X, Eye, Target, Lock, Globe, Zap, MapPin, Calendar,
  Quote, Clock, ChevronDown, ChevronUp, Send, Tag, Mail,
  MessageCircle, Check, Sparkles, TrendingUp, Award,
} from "lucide-react";
import { BlogDetail, ARTICLES } from "./BlogDetail";

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

// ─────────────────────────── TRUST INDICATORS ────────────────────
const TRUST_ITEMS = [
  "256-bit encryption",
  "Manual profile review",
  "No data selling",
  "GDPR compliant",
  "Halal-by-design",
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
      <div className="bg-card rounded-3xl border border-border w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-border bg-card/95 backdrop-blur-sm z-10 rounded-t-3xl">
          <h3 style={{ fontWeight: 800, fontSize: "1.0625rem" }}>{title}</h3>
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
      <p className="text-gradient" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>
        {value}{suffix}
      </p>
      <p className="text-muted-foreground mt-1.5" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{label}</p>
    </div>
  );
}

// ─────────────────────────── HERO VISUAL ─────────────────────────
function HeroCard() {
  const bars = [{ label: "Values", w: "94%" }, { label: "Goals", w: "91%" }, { label: "Lifestyle", w: "88%" }];
  return (
    <div className="relative w-full max-w-[340px] mx-auto select-none" style={{ height: "420px" }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(10,104,112,0.15) 0%, transparent 70%)", transform: "scale(1.3)" }} />

      {/* Main profile card */}
      <div className="absolute left-0 right-0 mx-auto w-[260px] bg-card rounded-3xl border border-border overflow-hidden float-animation"
        style={{ boxShadow: "0 20px 60px rgba(10,104,112,0.18), 0 4px 12px rgba(12,20,34,0.10)", top: "32px" }}>
        {/* Cover */}
        <div className="h-28 relative" style={{ background: "linear-gradient(135deg, #0A6870 0%, #14A8B4 100%)" }}>
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />
          {/* Avatar */}
          <div className="absolute -bottom-8 left-5 w-16 h-16 rounded-2xl bg-white shadow-lg border-2 border-white flex items-center justify-center overflow-hidden">
            <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E6F2F3, #C5E4E6)" }}>
              <span style={{ fontSize: "1.5rem" }}>👩</span>
            </div>
          </div>
          {/* Score badge */}
          <div className="absolute -bottom-5 right-5 h-10 px-3 rounded-xl flex items-center gap-1.5 shadow-lg"
            style={{ background: "linear-gradient(135deg, #0A6870, #14A8B4)", boxShadow: "0 4px 12px rgba(10,104,112,0.35)" }}>
            <Sparkles size={12} style={{ color: "rgba(255,255,255,0.85)" }} />
            <span style={{ color: "white", fontWeight: 800, fontSize: "0.9rem" }}>94%</span>
          </div>
        </div>

        {/* Card body */}
        <div className="pt-10 px-5 pb-5">
          <div className="mb-1" style={{ fontWeight: 700, fontSize: "1rem" }}>Sarah A.</div>
          <div className="text-muted-foreground mb-4" style={{ fontSize: "0.8125rem" }}>28 · Software Engineer · Dubai</div>
          <div className="space-y-2">
            {bars.map(b => (
              <div key={b.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{b.label}</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)" }}>{b.w}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: b.w, background: "linear-gradient(90deg, #0A6870, #14A8B4)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge — New Match */}
      <div className="absolute glass rounded-2xl px-3 py-2 shadow-lg flex items-center gap-2" style={{ top: "16px", right: "0", boxShadow: "var(--shadow-lg)" }}>
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Heart size={12} className="text-primary fill-primary" />
        </div>
        <div>
          <p style={{ fontSize: "0.6875rem", fontWeight: 700 }}>New Match!</p>
          <p className="text-muted-foreground" style={{ fontSize: "0.625rem" }}>Just now</p>
        </div>
      </div>

      {/* Floating badge — Verified */}
      <div className="absolute glass rounded-2xl px-3 py-2 shadow-lg flex items-center gap-1.5" style={{ bottom: "40px", left: "0", boxShadow: "var(--shadow-lg)" }}>
        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
          <Check size={11} className="text-green-600" />
        </div>
        <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>Verified Profile</span>
      </div>

      {/* Floating badge — Active members */}
      <div className="absolute glass rounded-2xl px-3 py-2 shadow-lg flex items-center gap-1.5" style={{ bottom: "80px", right: "-8px", boxShadow: "var(--shadow-lg)" }}>
        <div className="flex -space-x-1.5">
          {["#0A6870","#C5733F","#4A8DB8"].map((c, i) => (
            <div key={i} className="w-5 h-5 rounded-full border-2 border-white" style={{ background: c }} />
          ))}
        </div>
        <span style={{ fontSize: "0.6875rem", fontWeight: 600 }}>12k+ active</span>
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
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: Event) => { setSelectedArticle((e as CustomEvent).detail as number); };
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
          background: scrolled ? "rgba(244,247,250,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(12,20,34,0.08)" : "1px solid transparent",
          boxShadow: scrolled ? "0 1px 12px rgba(12,20,34,0.06)" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A6870, #14A8B4)" }}>
              <Heart size={15} className="text-white fill-white" />
            </div>
            <span className="logo-font" style={{ fontWeight: 800, fontSize: "1.125rem", letterSpacing: "-0.01em" }}>Ma3moni</span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-0.5">
            <button onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
              className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/60 transition-all"
              style={{ fontSize: "0.9rem" }}>Home</button>
            {SCROLL_NAV.map(({ id, label }) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/60 transition-all"
                style={{ fontSize: "0.9rem" }}>{label}</button>
            ))}
            <Link to="/blog"
              className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/60 transition-all"
              style={{ fontSize: "0.9rem" }}>Blog</Link>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-2">
            <button onClick={onLogin}
              className="hidden sm:flex items-center px-4 py-2 rounded-xl border border-border bg-white hover:bg-muted/40 transition-all"
              style={{ fontSize: "0.875rem", fontWeight: 600, boxShadow: "var(--shadow-sm)", color: "#0C1422" }}>
              Sign In
            </button>
            <button onClick={onStart}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white transition-all"
              style={{ fontSize: "0.875rem", fontWeight: 700, background: "linear-gradient(135deg, #0A6870, #0E8A95)", boxShadow: "0 4px 12px rgba(10,104,112,0.30)" }}>
              Get Started <ArrowRight size={14} />
            </button>
            <button className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
              <button onClick={onLogin} className="flex-1 py-3 rounded-xl border border-border bg-white text-center" style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#0C1422" }}>Sign In</button>
              <button onClick={onStart} className="flex-1 py-3 rounded-xl text-white text-center" style={{ fontSize: "0.9375rem", fontWeight: 700, background: "linear-gradient(135deg, #0A6870, #0E8A95)" }}>Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════════ HERO ═══════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: "92vh", display: "flex", alignItems: "center" }}>
        {/* Background — dot grid + ambient blobs */}
        <div className="absolute inset-0 dot-grid" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(10,104,112,0.10) 0%, transparent 65%)", transform: "translate(20%, -20%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(197,115,63,0.07) 0%, transparent 65%)", transform: "translate(-20%, 20%)" }} />

        <div className="relative max-w-6xl mx-auto px-6 py-20 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — copy */}
          <div className="view-enter">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 border border-primary/20 bg-secondary px-3.5 py-1.5 rounded-full mb-6"
              style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span style={{ color: "var(--primary)" }}>Marriage-first · Values-led · Private</span>
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.25rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em" }}>
              Where Intentional<br />
              <span className="text-gradient">Connections</span><br />
              Begin
            </h1>

            <p className="mt-5 text-muted-foreground" style={{ fontSize: "1.0625rem", lineHeight: 1.75, maxWidth: "460px" }}>
              A compatibility-first platform for serious individuals seeking meaningful, lifelong partnerships. No noise. No distractions. Just genuine connection.
            </p>

            {/* CTA row */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button onClick={onStart}
                className="group flex items-center justify-center gap-2 text-white px-8 py-4 rounded-2xl transition-all active:scale-[0.97]"
                style={{ fontSize: "1rem", fontWeight: 700, background: "linear-gradient(135deg, #0A6870, #0E8A95)", boxShadow: "0 8px 24px rgba(10,104,112,0.30)" }}>
                Begin Your Journey
                <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => scrollTo("about")}
                className="flex items-center justify-center gap-2 bg-white border border-border px-8 py-4 rounded-2xl hover:bg-muted/40 transition-all"
                style={{ fontSize: "1rem", fontWeight: 600, boxShadow: "var(--shadow-sm)", color: "#0C1422" }}>
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

          {/* Right — hero card visual */}
          <div className="flex items-center justify-center view-enter-up">
            <HeroCard />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground opacity-60">
          <div className="w-5 h-8 rounded-full border-2 border-current flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════ STATS BAR ══════════════════════════ */}
      <div className="border-y border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-3 gap-8 md:gap-16 text-center">
            <StatCard value="12,400" suffix="+" label="Verified Members" />
            <StatCard value="4,200" suffix="+" label="Successful Matches" />
            <StatCard value="98" suffix="%" label="Satisfaction Score" />
          </div>
          {/* Trust indicators */}
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
          <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3.5 py-1.5 rounded-full mb-5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
            <Sparkles size={12} className="text-primary" />
            Why Ma3moni is different
          </div>
          <h2 style={{ fontSize: "clamp(1.875rem, 4vw, 2.75rem)", fontWeight: 900, letterSpacing: "-0.035em" }}>
            Built for the most important<br />decision of your life
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto" style={{ fontSize: "1.0625rem", lineHeight: 1.7 }}>
            Every feature is designed with a single goal: a platform worthy of a serious commitment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Star, color: "#0A6870", bg: "#E6F2F3",
              title: "Deep Compatibility Engine",
              desc: "Our algorithm analyses 40+ dimensions — values, lifestyle, communication style, life goals — to surface genuinely aligned matches.",
              highlight: "40+ compatibility factors",
            },
            {
              icon: Shield, color: "#C5733F", bg: "#FBF2EB",
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
              className="group bg-card rounded-3xl border border-border p-7 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden"
              style={{ boxShadow: "var(--shadow-sm)" }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105"
                style={{ background: bg }}>
                <Icon size={22} style={{ color }} />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: "1.0625rem", marginBottom: "0.625rem", letterSpacing: "-0.015em" }}>{title}</h3>
              <p className="text-muted-foreground" style={{ fontSize: "0.9375rem", lineHeight: 1.7 }}>{desc}</p>
              <div className="mt-5 pt-4 border-t border-border">
                <span className="inline-flex items-center gap-1.5" style={{ fontSize: "0.8125rem", fontWeight: 700, color }}>
                  <TrendingUp size={13} /> {highlight}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section className="relative overflow-hidden bg-white border-y border-border py-24 px-6">
        <div className="absolute inset-0 dot-grid opacity-40" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3.5 py-1.5 rounded-full mb-5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              <Award size={12} className="text-primary" />
              Your journey
            </div>
            <h2 style={{ fontSize: "clamp(1.875rem, 4vw, 2.75rem)", fontWeight: 900, letterSpacing: "-0.035em" }}>
              From sign-up to<br />meaningful connection
            </h2>
            <p className="text-muted-foreground mt-4" style={{ fontSize: "1.0625rem" }}>Four thoughtful steps — no shortcuts, no pressure.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="absolute top-10 left-[12.5%] right-[12.5%] h-px hidden lg:block"
              style={{ background: "linear-gradient(90deg, transparent, rgba(10,104,112,0.15), rgba(10,104,112,0.15), rgba(10,104,112,0.15), transparent)" }} />

            {[
              { step: "01", title: "Create Your Profile", desc: "Share who you are — values, goals, life vision, and what you're genuinely looking for.", icon: "✍️" },
              { step: "02", title: "Set Deep Preferences", desc: "Use our structured preference system to define what truly matters, not just surface-level traits.", icon: "⚙️" },
              { step: "03", title: "Review Curated Matches", desc: "A small set of high-quality, compatible people delivered daily. No endless scrolling.", icon: "💡" },
              { step: "04", title: "Connect with Purpose", desc: "Start a conversation when you're ready. No pressure, no timers, no games.", icon: "💬" },
            ].map(({ step, title, desc, icon }, i) => (
              <div key={step} className="relative group">
                <div className="bg-card rounded-3xl border border-border p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 h-full"
                  style={{ boxShadow: "var(--shadow-sm)" }}>
                  {/* Step number */}
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 relative"
                    style={{ background: i === 0 ? "linear-gradient(135deg, #0A6870, #14A8B4)" : "var(--secondary)" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 900, color: i === 0 ? "white" : "var(--primary)", letterSpacing: "0.01em" }}>{step}</span>
                  </div>
                  <div className="text-2xl mb-3">{icon}</div>
                  <h4 style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>{title}</h4>
                  <p className="text-muted-foreground" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <button onClick={onStart}
              className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-2xl transition-all active:scale-[0.97]"
              style={{ fontSize: "1rem", fontWeight: 700, background: "linear-gradient(135deg, #0A6870, #0E8A95)", boxShadow: "0 8px 24px rgba(10,104,112,0.28)" }}>
              Start Your Profile <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════ ABOUT ══════════════════════════════ */}
      <section id="about" className="py-24 px-6 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3.5 py-1.5 rounded-full mb-5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              <Heart size={12} className="text-primary" />
              About Ma3moni
            </div>
            <h2 style={{ fontSize: "clamp(1.875rem, 4vw, 2.75rem)", fontWeight: 900, letterSpacing: "-0.035em", maxWidth: "680px", margin: "0 auto" }}>
              We built Ma3moni because this mattered too much to get wrong
            </h2>
            <p className="text-muted-foreground mt-5 max-w-2xl mx-auto" style={{ fontSize: "1.0625rem", lineHeight: 1.8 }}>
              Most platforms optimise for engagement. We optimise for outcomes. When someone trusts you with finding a life partner, engagement metrics mean nothing if they don't find the right person.
            </p>
          </div>

          {/* Vision + Mission */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-14">
            <div className="rounded-3xl p-8 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0A6870 0%, #0D8A95 100%)", boxShadow: "0 16px 48px rgba(10,104,112,0.25)" }}>
              <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10" style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
              <div className="absolute -left-4 -bottom-4 w-32 h-32 rounded-full opacity-5" style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
              <div className="flex items-center gap-2 mb-5 relative">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                  <Eye size={15} className="text-white" />
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.75)" }}>Our Vision</span>
              </div>
              <p style={{ fontSize: "1.25rem", fontWeight: 800, lineHeight: 1.5, color: "white", position: "relative" }}>
                A world where every individual who seeks a lifelong partner can find them with clarity, dignity, and intention.
              </p>
            </div>

            <div className="rounded-3xl p-8 border border-primary/15 bg-secondary relative overflow-hidden"
              style={{ boxShadow: "var(--shadow-sm)" }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target size={15} className="text-primary" />
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)" }}>Our Mission</span>
              </div>
              <p style={{ fontSize: "1.25rem", fontWeight: 800, lineHeight: 1.5, color: "var(--primary)" }}>
                To build a compatibility-first platform that prioritises meaningful, lasting relationships — guided by shared values and genuine human connection.
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <Zap size={15} className="text-primary" />
              <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)" }}>Core Values</span>
            </div>
            <h3 style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.03em" }}>Six principles behind every decision</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CORE_VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="bg-white rounded-2xl border border-border p-6 hover:border-primary/25 hover:shadow-md transition-all duration-300 group"
                style={{ boxShadow: "var(--shadow-sm)" }}>
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <Icon size={18} />
                </div>
                <p style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.375rem", letterSpacing: "-0.01em" }}>{title}</p>
                <p className="text-muted-foreground" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ STORIES ════════════════════════════ */}
      <section id="stories" className="bg-white border-y border-border py-24 px-6 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3.5 py-1.5 rounded-full mb-5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              <Heart size={12} className="text-primary fill-primary" />
              Real Couples
            </div>
            <h2 style={{ fontSize: "clamp(1.875rem, 4vw, 2.75rem)", fontWeight: 900, letterSpacing: "-0.035em" }}>
              Stories that began with a{" "}
              <span className="text-gradient">compatibility score</span>
            </h2>
          </div>

          <div className="space-y-6">
            {STORIES.map((s, i) => (
              <div key={s.id}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300 ${i % 2 === 1 ? "lg:[direction:rtl]" : ""}`}
                style={{ boxShadow: "var(--shadow-md)" }}>
                {/* Photo */}
                <div className="relative overflow-hidden" style={{ minHeight: "280px", direction: "ltr" }}>
                  <img src={s.photo} alt={s.names} loading="lazy" decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    style={{ minHeight: 280 }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(12,20,34,0.35) 0%, transparent 50%)" }} />
                  {/* Score badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 rounded-xl px-3 py-1.5 shadow-lg glass">
                    <Sparkles size={12} className="text-primary" />
                    <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: "var(--primary)" }}>{s.score}% Compatible</span>
                  </div>
                  {/* Location */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white" style={{ fontSize: "0.8125rem" }}>
                    <MapPin size={12} />
                    <span style={{ fontWeight: 600 }}>{s.location}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="bg-card p-8 lg:p-10 flex flex-col justify-center" style={{ direction: "ltr" }}>
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <Quote size={15} className="text-primary" />
                  </div>
                  <blockquote style={{ fontSize: "1.125rem", lineHeight: 1.7, fontStyle: "italic", marginBottom: "1.5rem", fontWeight: 500 }}>
                    "{s.quote}"
                  </blockquote>
                  <div className="h-px bg-border mb-4" />
                  <h3 style={{ fontWeight: 900, fontSize: "1.125rem", letterSpacing: "-0.02em", marginBottom: "0.375rem" }}>{s.names}</h3>
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
              className="inline-flex items-center gap-2 text-white px-9 py-4 rounded-2xl transition-all active:scale-[0.97]"
              style={{ fontSize: "1rem", fontWeight: 700, background: "linear-gradient(135deg, #0A6870, #0E8A95)", boxShadow: "0 8px 24px rgba(10,104,112,0.28)" }}>
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
              <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3.5 py-1.5 rounded-full mb-5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                <Tag size={12} className="text-primary" />
                Ma3moni Journal
              </div>
              <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, letterSpacing: "-0.035em" }}>
                Insights on{" "}
                <span className="text-gradient">intentional</span> relationships
              </h2>
              <p className="text-muted-foreground mt-3" style={{ fontSize: "1.0625rem" }}>Research, advice, and real stories for those seeking a lasting partnership.</p>
            </div>
            <Link to="/blog"
              className="flex-shrink-0 flex items-center gap-2 border border-primary text-primary px-5 py-2.5 rounded-xl hover:bg-primary hover:text-white transition-all"
              style={{ fontSize: "0.9rem", fontWeight: 700 }}>
              All articles <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ARTICLES.map((post, idx) => (
              <button key={post.id} onClick={() => { setSelectedArticle(post.id); scrollRef.current?.scrollTo({ top: 0 }); }}
                className={`text-left bg-card rounded-3xl border border-border overflow-hidden hover:border-primary/25 hover:shadow-lg transition-all duration-300 group ${idx === 0 ? "md:col-span-1" : ""}`}
                style={{ boxShadow: "var(--shadow-sm)" }}>
                <div className="relative overflow-hidden" style={{ height: "200px" }}>
                  <img src={post.photo} alt={post.title} loading="lazy" decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(12,20,34,0.25) 0%, transparent 50%)" }} />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-white" style={{ fontSize: "0.6875rem", fontWeight: 800, background: "linear-gradient(135deg, #0A6870, #14A8B4)" }}>
                    {post.category}
                  </span>
                </div>
                <div className="p-5">
                  <h3 style={{ fontWeight: 800, fontSize: "1rem", lineHeight: 1.45, marginBottom: "0.625rem", letterSpacing: "-0.01em" }}>{post.title}</h3>
                  <p className="text-muted-foreground" style={{ fontSize: "0.875rem", lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.8125rem" }}>{post.author}</p>
                      <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                        <Clock size={11} />
                        <span style={{ fontSize: "0.75rem" }}>{post.readTime} · {post.date}</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center transition-all duration-200 group-hover:bg-primary group-hover:shadow-md">
                      <ArrowRight size={14} className="text-primary group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ CONTACT / FAQ ══════════════════════ */}
      <section id="contact" className="bg-white border-y border-border py-24 px-6 scroll-mt-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact form */}
          <div>
            <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3.5 py-1.5 rounded-full mb-6" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              <Mail size={12} className="text-primary" />
              Contact & Support
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.035em", marginBottom: "0.75rem" }}>We're here to help</h2>
            <p className="text-muted-foreground mb-7" style={{ fontSize: "1rem" }}>Our team responds within 4 business hours.</p>

            {contactSent ? (
              <div className="bg-secondary rounded-3xl border border-primary/15 p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Check size={24} className="text-primary" />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.02em" }}>Message received!</h3>
                <p className="text-muted-foreground mt-2 mb-6" style={{ fontSize: "0.9375rem" }}>
                  We'll reply to <strong style={{ color: "var(--foreground)" }}>{contactForm.email}</strong> within 4 business hours.
                </p>
                <button onClick={() => { setContactSent(false); setContactForm({ name: "", email: "", subject: "", message: "" }); }}
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
                      <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{label}</label>
                      <input type={type} value={contactForm[key as keyof typeof contactForm]}
                        onChange={e => setContactForm(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder} required
                        className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all"
                        style={{ fontSize: "0.9rem" }} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Subject</label>
                  <select value={contactForm.subject} onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))} required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/25 appearance-none"
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
                  <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Message</label>
                  <textarea value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Describe your question or issue in detail…" rows={4} required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all resize-none"
                    style={{ fontSize: "0.9rem" }} />
                </div>
                <button type="submit"
                  className="flex items-center gap-2 text-white px-7 py-3.5 rounded-xl transition-all active:scale-[0.97]"
                  style={{ fontWeight: 700, fontSize: "1rem", background: "linear-gradient(135deg, #0A6870, #0E8A95)", boxShadow: "0 4px 12px rgba(10,104,112,0.25)" }}>
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
            <h3 style={{ fontWeight: 800, fontSize: "1.375rem", letterSpacing: "-0.02em", marginBottom: "1.25rem" }}>
              Frequently Asked Questions
            </h3>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-background rounded-2xl border border-border overflow-hidden transition-all">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white transition-colors gap-3">
                    <span style={{ fontWeight: 700, fontSize: "0.9375rem", flex: 1 }}>{faq.q}</span>
                    <div className={`w-6 h-6 rounded-full border border-border flex items-center justify-center flex-shrink-0 transition-all ${openFaq === i ? "bg-primary border-primary" : "bg-white"}`}>
                      {openFaq === i
                        ? <ChevronUp size={13} className="text-white" />
                        : <ChevronDown size={13} className="text-muted-foreground" />}
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
      <section className="relative overflow-hidden py-24 px-6" style={{ background: "linear-gradient(135deg, #0A6870 0%, #0D8A95 50%, #0E9EA8 100%)" }}>
        {/* Texture */}
        <div className="absolute inset-0 dot-grid opacity-[0.07]" />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,0.06)" }} />

        <div className="relative text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full mb-6" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
            <Heart size={12} className="text-white/80 fill-white/50" />
            Join thousands of intentional individuals
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "white", lineHeight: 1.1 }}>
            Ready to begin<br />your journey?
          </h2>
          <p className="mt-4 mb-9" style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>
            Join a growing community of serious individuals who chose depth over speed, and found their person on Ma3moni.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={onStart}
              className="inline-flex items-center justify-center gap-2 bg-white px-9 py-4 rounded-2xl hover:bg-white/92 transition-all active:scale-[0.97]"
              style={{ fontWeight: 800, fontSize: "1rem", color: "#0A6870", boxShadow: "0 8px 32px rgba(0,0,0,0.20)" }}>
              Get Started — It's Free <ArrowRight size={18} />
            </button>
            <button onClick={onLogin}
              className="inline-flex items-center justify-center gap-2 border border-white/30 bg-white/10 text-white px-9 py-4 rounded-2xl hover:bg-white/15 transition-all"
              style={{ fontWeight: 700, fontSize: "1rem" }}>
              Already a member? Sign In
            </button>
          </div>
          <p className="mt-5" style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)" }}>No credit card required · Free to browse matches</p>
        </div>
      </section>

      {/* ══════════════════════ FOOTER ═════════════════════════════ */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A6870, #14A8B4)" }}>
                <Heart size={14} className="text-white fill-white" />
              </div>
              <span className="logo-font" style={{ fontWeight: 800, fontSize: "1.0625rem" }}>Ma3moni</span>
            </div>
            <p className="text-muted-foreground mb-5" style={{ fontSize: "0.875rem", lineHeight: 1.75, maxWidth: "240px" }}>
              A compatibility-first marriage platform for serious individuals seeking lifelong partnerships.
            </p>
            <div className="flex gap-2">
              {["integrity", "dignity", "privacy"].map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full capitalize" style={{ fontSize: "0.6875rem", fontWeight: 700 }}>
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
              <p style={{ fontWeight: 800, fontSize: "0.8125rem", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{heading}</p>
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

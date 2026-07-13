import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, ArrowRight, Clock, User, Tag, Search, ChevronRight } from "lucide-react";
import { ARTICLES } from "./BlogDetail";
import { BlogDetail } from "./BlogDetail";

const CATEGORIES = ["All", "Compatibility", "Communication", "Values", "Relationships"];

const CATEGORY_COLORS: Record<string, string> = {
  Compatibility:  "#0A6870",
  Communication:  "#4A8DB8",
  Values:         "#C5733F",
  Relationships:  "#6B9E78",
};

function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? "#68747F";
  return (
    <span
      className="px-2.5 py-1 rounded-full"
      style={{ fontSize: "0.75rem", fontWeight: 700, background: color + "18", color }}
    >
      {category}
    </span>
  );
}

export function BlogListPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [openArticleId, setOpenArticleId] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const filtered = ARTICLES.filter(a => {
    const matchCat = activeCategory === "All" || a.category === activeCategory;
    const matchSearch = !search.trim() ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      a.author.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = filtered[0] ?? null;
  const rest = filtered.slice(1);

  // ── Article detail view ──────────────────────────────────
  if (openArticleId !== null) {
    return (
      <BlogDetail
        articleId={openArticleId}
        onBack={() => { setOpenArticleId(null); window.scrollTo({ top: 0 }); }}
        onStart={() => navigate("/")}
        backLabel="← Back to Blog"
        onOpenArticle={id => { setOpenArticleId(id); window.scrollTo({ top: 0 }); }}
      />
    );
  }

  // ── Listing view ─────────────────────────────────────────
  return (
    <div className="size-full overflow-y-auto bg-background">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Heart size={15} className="text-primary-foreground fill-primary-foreground" />
            </div>
            <span className="logo-font" style={{ fontWeight: 800, fontSize: "1.125rem" }}>
              Ma3moni
            </span>
            <span className="hidden sm:block text-muted-foreground" style={{ fontSize: "0.9375rem" }}>
              / Journal
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
              style={{ fontSize: "0.875rem" }}
            >
              ← Back to Home
            </Link>
            <Link
              to="/"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              style={{ fontSize: "0.875rem", fontWeight: 600 }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full mb-5" style={{ fontSize: "0.8125rem" }}>
                <Tag size={13} className="text-primary" /> Ma3moni Journal
              </div>
              <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
                Insights on<br />
                <span style={{ color: "var(--primary)" }}>intentional</span> relationships
              </h1>
              <p className="text-muted-foreground mt-4" style={{ fontSize: "1.0625rem", lineHeight: 1.7, maxWidth: "520px" }}>
                Research, advice, and real stories for serious individuals seeking a lasting partnership. Written by psychologists, researchers, and the Ma3moni team.
              </p>
            </div>
            {/* Search */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-4 py-3" style={{ width: "clamp(240px, 30vw, 320px)" }}>
                <Search size={16} className="text-muted-foreground flex-shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search articles…"
                  className="flex-1 bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
                  style={{ fontSize: "0.9375rem" }}
                />
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 mt-8 pt-8 border-t border-border">
            {[
              { label: "Articles published", value: `${ARTICLES.length}` },
              { label: "Categories", value: `${CATEGORIES.length - 1}` },
              { label: "Authors", value: "3" },
              { label: "New article", value: "Every week" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.02em", color: "var(--primary)" }}>{value}</p>
                <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category filter ── */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 py-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full border transition-all ${activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30 bg-card"
                }`}
                style={{ fontSize: "0.875rem", fontWeight: activeCategory === cat ? 700 : 500 }}
              >
                {cat}
                {cat !== "All" && (
                  <span className={`ml-1.5 ${activeCategory === cat ? "opacity-70" : "opacity-50"}`}>
                    ({ARTICLES.filter(a => a.category === cat).length})
                  </span>
                )}
              </button>
            ))}
            {search && (
              <button
                onClick={() => setSearch("")}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary text-secondary-foreground border border-primary/20"
                style={{ fontSize: "0.8125rem" }}
              >
                "{search}" ×
              </button>
            )}
            <span className="flex-shrink-0 text-muted-foreground ml-auto" style={{ fontSize: "0.8125rem" }}>
              {filtered.length} article{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">

        {filtered.length === 0 ? (
          /* ── Empty state ── */
          <div className="py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
              <Search size={22} className="text-muted-foreground" />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: "1.25rem" }}>No articles found</h3>
            <p className="text-muted-foreground mt-2" style={{ fontSize: "1rem" }}>
              Try a different search or{" "}
              <button onClick={() => { setActiveCategory("All"); setSearch(""); }} className="text-primary hover:underline">
                clear filters
              </button>
              .
            </p>
          </div>
        ) : (
          <>
            {/* ── Featured article ── */}
            {featured && (
              <button
                onClick={() => { setOpenArticleId(featured.id); window.scrollTo({ top: 0 }); }}
                className="w-full text-left mb-12 group"
              >
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 rounded-3xl overflow-hidden border border-border hover:border-primary/25 hover:shadow-xl transition-all">
                  {/* Image */}
                  <div className="lg:col-span-3 relative overflow-hidden" style={{ minHeight: "320px" }}>
                    <img
                      src={featured.photo}
                      alt={featured.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                      style={{ minHeight: "320px" }}
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 60%, rgba(255,255,255,0.05) 100%)" }} />
                    <div className="absolute top-5 left-5 flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-full">
                      <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>Featured</span>
                    </div>
                    <div className="absolute top-5 right-5">
                      <CategoryBadge category={featured.category} />
                    </div>
                  </div>
                  {/* Content */}
                  <div className="lg:col-span-2 bg-card p-8 lg:p-10 flex flex-col justify-center">
                    <CategoryBadge category={featured.category} />
                    <h2
                      style={{ fontWeight: 900, fontSize: "clamp(1.25rem, 2.5vw, 1.625rem)", letterSpacing: "-0.025em", lineHeight: 1.25, margin: "0.875rem 0 1rem" }}
                      className="group-hover:text-primary transition-colors"
                    >
                      {featured.title}
                    </h2>
                    <p className="text-muted-foreground mb-6" style={{ fontSize: "0.9375rem", lineHeight: 1.7 }}>
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User size={13} />
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)" }}>{featured.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span style={{ fontSize: "0.8125rem" }}>{featured.readTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-5 text-primary group-hover:gap-3 transition-all" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                      Read article <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* ── Article grid ── */}
            {rest.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
                    {activeCategory === "All" ? "All Articles" : activeCategory}
                  </h2>
                  <span className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>
                    {rest.length} more article{rest.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {rest.map(article => (
                    <button
                      key={article.id}
                      onClick={() => { setOpenArticleId(article.id); window.scrollTo({ top: 0 }); }}
                      className="text-left bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/20 hover:shadow-md transition-all group"
                    >
                      {/* Thumbnail */}
                      <div className="relative overflow-hidden" style={{ height: "220px" }}>
                        <img
                          src={article.photo}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3">
                          <CategoryBadge category={article.category} />
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-5">
                        <h3
                          style={{ fontWeight: 700, fontSize: "1rem", lineHeight: 1.45, marginBottom: "0.625rem" }}
                          className="group-hover:text-primary transition-colors"
                        >
                          {article.title}
                        </h3>
                        <p
                          className="text-muted-foreground"
                          style={{ fontSize: "0.875rem", lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: "1rem" }}
                        >
                          {article.excerpt}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                                <span style={{ fontSize: "0.5rem", fontWeight: 900, color: "var(--primary)" }}>
                                  {article.author.split(" ").map(n => n[0]).join("")}
                                </span>
                              </div>
                              <span style={{ fontWeight: 600, fontSize: "0.8125rem" }}>{article.author}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                              <Clock size={11} />
                              <span style={{ fontSize: "0.75rem" }}>{article.readTime}</span>
                              <span style={{ fontSize: "0.75rem" }}>· {article.date}</span>
                            </div>
                          </div>
                          <ArrowRight size={15} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── All authors ── */}
        <div className="mt-16 pt-10 border-t border-border">
          <h2 style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.02em", marginBottom: "1.25rem" }}>
            Meet the Authors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { initials: "MR", name: "Mariam Rashid",   role: "Psychologist & Relationship Researcher", color: "#0A6870", articles: ARTICLES.filter(a => a.author === "Mariam Rashid").length },
              { initials: "LH", name: "Layla Hassan",    role: "Co-Founder & CTO, Ma3moni",              color: "#4A8DB8", articles: ARTICLES.filter(a => a.author === "Layla Hassan").length },
              { initials: "FA", name: "Faisal Al-Amin",  role: "Co-Founder & CEO, Ma3moni",              color: "#C5733F", articles: ARTICLES.filter(a => a.author === "Faisal Al-Amin").length },
            ].map(({ initials, name, role, color, articles }) => (
              <div key={name} className="flex items-start gap-4 bg-card rounded-2xl border border-border p-5 hover:border-primary/20 transition-all">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: color + "20" }}>
                  <span style={{ fontSize: "1rem", fontWeight: 900, color }}>{initials}</span>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{name}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.8125rem", marginTop: 2, marginBottom: 8 }}>{role}</p>
                  <button
                    onClick={() => setActiveCategory("All")}
                    className="text-primary hover:text-primary/80 transition-colors"
                    style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                  >
                    {articles} article{articles !== 1 ? "s" : ""} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Newsletter ── */}
        <div className="mt-12 bg-primary rounded-3xl p-10 text-white text-center">
          <div className="max-w-lg mx-auto">
            <h2 style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.025em" }}>
              Get new articles in your inbox
            </h2>
            <p className="opacity-80 mt-3 mb-7" style={{ fontSize: "1rem" }}>
              Weekly insights on compatibility, communication, and intentional relationships. Unsubscribe anytime.
            </p>
            {subscribed ? (
              <div className="flex items-center justify-center gap-2 bg-white/20 rounded-xl px-6 py-4">
                <span style={{ fontWeight: 700, fontSize: "1rem" }}>✓ You're subscribed — thank you!</span>
              </div>
            ) : (
              <form
                onSubmit={e => { e.preventDefault(); if (email.trim()) setSubscribed(true); }}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 transition-colors"
                  style={{ fontSize: "0.9375rem" }}
                />
                <button
                  type="submit"
                  className="flex-shrink-0 flex items-center justify-center gap-2 bg-white text-primary px-6 py-3 rounded-xl hover:bg-white/90 transition-all"
                  style={{ fontWeight: 700, fontSize: "0.9375rem" }}
                >
                  Subscribe <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card mt-0">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Heart size={11} className="text-primary-foreground fill-primary-foreground" />
            </div>
            <span className="logo-font" style={{ fontWeight: 800, fontSize: "0.875rem" }}>Ma3moni Journal</span>
          </Link>
          <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>© 2026 Ma3moni. All rights reserved.</p>
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "0.8125rem" }}>
            Back to Home →
          </Link>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Calendar, Heart, ArrowRight, ThumbsUp, ThumbsDown, Eye, BookOpen } from "lucide-react";
import type { BlogArticle } from "../../lib/api";

// ─── Content renderer ──────────────────────────────────────

type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading";   text: string }
  | { type: "image";     src: string; caption: string };

function parseContent(raw: string): Block[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p) && p.length > 0 && typeof p[0]?.type === "string") {
      return p as Block[];
    }
  } catch {}
  return raw.split(/\n\n+/).filter(Boolean).map(chunk => {
    const t = chunk.trim();
    if (t.startsWith("## "))  return { type: "heading"   as const, text: t.slice(3) };
    if (t.startsWith("### ")) return { type: "heading"   as const, text: t.slice(4) };
    const img = t.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img) return { type: "image" as const, src: img[2], caption: img[1] };
    return { type: "paragraph" as const, text: t };
  });
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*")  && p.endsWith("*"))  return <em key={i}>{p.slice(1, -1)}</em>;
    return p;
  });
}

function ContentRenderer({ content }: { content: string }) {
  const blocks = parseContent(content);
  if (!blocks.length) return null;
  return (
    <div>
      {blocks.map((b, i) => {
        if (b.type === "heading") return (
          <h2 key={i} style={{ fontWeight: 800, fontSize: "1.4375rem", letterSpacing: "-0.02em", marginTop: "2.5rem", marginBottom: "0.75rem", lineHeight: 1.25 }}>
            {b.text}
          </h2>
        );
        if (b.type === "image") return (
          <figure key={i} className="my-8">
            <img
              src={b.src}
              alt={b.caption}
              loading="lazy"
              className="w-full rounded-2xl object-cover shadow-md"
              style={{ maxHeight: 460 }}
            />
            {b.caption && (
              <figcaption className="text-center text-muted-foreground mt-2.5" style={{ fontSize: "0.8125rem" }}>
                {b.caption}
              </figcaption>
            )}
          </figure>
        );
        return (
          <p key={i} style={{ fontSize: "1.0625rem", lineHeight: 1.8, marginBottom: "1.25rem" }}>
            {renderInline(b.text)}
          </p>
        );
      })}
    </div>
  );
}

// ─── Hero image ────────────────────────────────────────────

function HeroImage({ src, alt, category }: { src: string; alt: string; category?: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "clamp(260px, 42vh, 520px)" }}>
      {/* Blurred placeholder while loading */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{
          backgroundImage: `url(${src})`,
          filter: "blur(20px)",
          transform: "scale(1.1)",
          opacity: loaded ? 0 : 1,
        }}
      />
      <img
        src={src}
        alt={alt}
        loading="eager"
        onLoad={() => setLoaded(true)}
        className="w-full h-full object-cover transition-opacity duration-700"
        style={{ opacity: loaded ? 1 : 0 }}
      />
      {/* Cinematic gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 35%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* Category pill bottom-left */}
      {category && (
        <div className="absolute bottom-5 left-5 sm:bottom-7 sm:left-7">
          <span
            className="px-3 py-1.5 rounded-full text-white backdrop-blur-sm"
            style={{ fontSize: "0.75rem", fontWeight: 700, background: "var(--primary)", boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
          >
            {category}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────

interface BlogDetailProps {
  articleId: string;
  onBack: () => void;
  onStart: () => void;
  backLabel?: string;
  onOpenArticle?: (slug: string) => void;
}

export function BlogDetail({ articleId, onBack, onStart, backLabel = "Back to Home", onOpenArticle }: BlogDetailProps) {
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [related,  setRelated]  = useState<BlogArticle[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [likes,    setLikes]    = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [voted,    setVoted]    = useState<"like" | "dislike" | null>(null);

  useEffect(() => {
    setLoading(true);
    setArticle(null);
    import("../../lib/api").then(({ blog }) => {
      blog.article(articleId).then(a => {
        setArticle(a);
        setLikes(a.likes_count);
        setDislikes(a.dislikes_count);
        setVoted(a.user_vote === 1 ? "like" : a.user_vote === -1 ? "dislike" : null);
        blog.articles().then(r => setRelated(r.results.filter(x => x.slug !== articleId).slice(0, 4))).catch(() => {});
      }).catch(() => {}).finally(() => setLoading(false));
    });
  }, [articleId]);

  const vote = async (v: "like" | "dislike") => {
    if (!article || voted === v) return;
    const nl = likes    + (v === "like"    ? 1 : 0) - (voted === "like"    ? 1 : 0);
    const nd = dislikes + (v === "dislike" ? 1 : 0) - (voted === "dislike" ? 1 : 0);
    setLikes(nl); setDislikes(nd); setVoted(v);
    try {
      const { blog } = await import("../../lib/api");
      const r = await blog.vote(article.id, v === "like" ? 1 : -1);
      setLikes(r.likes_count); setDislikes(r.dislikes_count);
    } catch {}
  };

  const authorName    = article?.author?.full_name ?? "";
  const initials      = authorName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const publishedDate = article?.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";
  const readMins = article?.content ? Math.max(1, Math.ceil(article.content.length / 1200)) : 1;

  return (
    <div className="size-full overflow-y-auto bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontSize: "0.9rem" }}
          >
            <ArrowLeft size={17} /> {backLabel}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Heart size={11} className="text-primary-foreground fill-primary-foreground" />
            </div>
            <span className="logo-font" style={{ fontWeight: 800, fontSize: "0.9375rem" }}>Ma3moni</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-16 space-y-5">
          {/* Skeleton hero */}
          <div className="bg-muted animate-pulse rounded-3xl w-full" style={{ height: "clamp(260px, 40vh, 460px)" }} />
          {[40, 20, 16, 16, 16].map((h, i) => (
            <div key={i} className="bg-muted animate-pulse rounded-2xl" style={{ height: h }} />
          ))}
        </div>
      ) : !article ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
          <BookOpen size={32} />
          <p style={{ fontSize: "1rem" }}>Article not found.</p>
          <button onClick={onBack} className="text-primary hover:underline" style={{ fontSize: "0.875rem" }}>Go back</button>
        </div>
      ) : (
        <>
          {/* Hero */}
          {article.cover_image ? (
            <HeroImage src={article.cover_image} alt={article.title} category={article.category?.name} />
          ) : article.category && (
            <div className="px-4 sm:px-6 pt-8 max-w-3xl mx-auto">
              <span className="px-3 py-1.5 rounded-full text-primary bg-secondary border border-primary/15" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                {article.category.name}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16">
            <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: "1.5rem" }}>
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 pb-7 border-b border-border mb-9">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--primary)" }}>{initials}</span>
                </div>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{authorName}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
                {publishedDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span style={{ fontSize: "0.8125rem" }}>{publishedDate}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock size={12} />
                  <span style={{ fontSize: "0.8125rem" }}>{readMins} min read</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye size={12} />
                  <span style={{ fontSize: "0.8125rem" }}>{article.view_count.toLocaleString()} views</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <ContentRenderer content={article.content} />

            {/* Votes — sticky on mobile at the bottom */}
            <div className="mt-10 pt-8 border-t border-border">
              <p className="text-muted-foreground mb-4" style={{ fontSize: "0.875rem" }}>Was this article helpful?</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => vote("like")}
                  aria-label="Helpful"
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                    voted === "like"
                      ? "bg-green-500 border-green-500 text-white shadow-md"
                      : "border-border bg-card hover:border-green-400 hover:text-green-600 text-muted-foreground"
                  }`}
                  style={{ fontWeight: 700, fontSize: "0.9375rem", minWidth: "120px" }}
                >
                  <ThumbsUp size={17} />
                  <span>Helpful</span>
                  <span className="opacity-70" style={{ fontSize: "0.8125rem" }}>({likes.toLocaleString()})</span>
                </button>
                <button
                  onClick={() => vote("dislike")}
                  aria-label="Not helpful"
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                    voted === "dislike"
                      ? "bg-red-500 border-red-500 text-white shadow-md"
                      : "border-border bg-card hover:border-red-300 hover:text-red-500 text-muted-foreground"
                  }`}
                  style={{ fontWeight: 700, fontSize: "0.9375rem", minWidth: "140px" }}
                >
                  <ThumbsDown size={17} />
                  <span>Not helpful</span>
                  <span className="opacity-70" style={{ fontSize: "0.8125rem" }}>({dislikes.toLocaleString()})</span>
                </button>
              </div>
              {voted && (
                <p className="mt-3 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
                  {voted === "like" ? "Thanks — glad it resonated." : "Thanks — we'll keep improving."}
                </p>
              )}
            </div>

            {/* Author card */}
            {authorName && (
              <div className="mt-12 pt-8 border-t border-border">
                <div className="flex items-start gap-4 bg-secondary rounded-2xl border border-primary/15 p-5 sm:p-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <span style={{ fontSize: "1.125rem", fontWeight: 900, color: "var(--primary)" }}>{initials}</span>
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: "1.0625rem" }}>{authorName}</p>
                    <p className="text-muted-foreground mt-1" style={{ fontSize: "0.875rem", lineHeight: 1.65 }}>
                      {article.category?.name ? `${article.category.name} · Ma3moni Editorial Team` : "Ma3moni Editorial Team"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-10 bg-primary rounded-2xl p-7 sm:p-8 text-white text-center">
              <h3 style={{ fontWeight: 900, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>Ready to apply what you've read?</h3>
              <p className="opacity-80 mt-2 mb-6" style={{ fontSize: "1rem" }}>
                Ma3moni matches you based on the values, communication style, and goals you've just read about.
              </p>
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2 bg-white text-primary px-7 py-3.5 rounded-xl hover:bg-white/90 active:scale-95 transition-all"
                style={{ fontWeight: 700, fontSize: "1rem" }}
              >
                Create Your Profile <ArrowRight size={17} />
              </button>
            </div>

            {/* Related articles */}
            {related.length > 0 && (
              <div className="mt-14">
                <h2 style={{ fontWeight: 800, fontSize: "1.375rem", letterSpacing: "-0.02em", marginBottom: "1.25rem" }}>
                  More from the Journal
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {related.map(rel => (
                    <button
                      key={rel.id}
                      onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); onOpenArticle?.(rel.slug); }}
                      className="text-left rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/25 hover:shadow-sm transition-all group"
                    >
                      {rel.cover_image ? (
                        <div className="relative overflow-hidden" style={{ height: 160 }}>
                          <img
                            src={rel.cover_image}
                            alt={rel.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                          />
                          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)" }} />
                        </div>
                      ) : (
                        <div className="w-full bg-secondary" style={{ height: 160 }} />
                      )}
                      <div className="p-4">
                        {rel.category && (
                          <span className="text-primary" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                            {rel.category.name}
                          </span>
                        )}
                        <p
                          style={{ fontWeight: 700, fontSize: "0.9375rem", lineHeight: 1.4, marginTop: "0.25rem" }}
                          className="line-clamp-2"
                        >
                          {rel.title}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

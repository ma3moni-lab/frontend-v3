import { useState } from "react";
import { Link } from "react-router";
import { MarketingLayout } from "../marketing/MarketingLayout";
import { Clock, ArrowRight, Tag } from "lucide-react";

const u = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`;

const CATEGORIES = ["All", "Compatibility", "Relationships", "Values", "Communication", "Success Stories"];

const POSTS = [
  {
    id: 1,
    category: "Compatibility",
    title: "Why Compatibility Matters More Than Chemistry (And How to Find It)",
    excerpt: "Chemistry fades. Compatibility — grounded in shared values, aligned goals, and complementary communication styles — is what sustains a marriage. Here's how to assess it honestly.",
    author: "Mariam Rashid",
    date: "June 28, 2026",
    readTime: "7 min read",
    photo: u("1474552226712-ac0f0961a954", 800, 500),
    featured: true,
  },
  {
    id: 2,
    category: "Communication",
    title: "The One Conversation Every Couple Should Have Before Marriage",
    excerpt: "Most couples spend months planning a wedding and hours discussing finances, but almost no time aligning on communication styles. This conversation changes that.",
    author: "Layla Hassan",
    date: "June 20, 2026",
    readTime: "5 min read",
    photo: u("1579208570378-8c970854bc23", 800, 500),
    featured: false,
  },
  {
    id: 3,
    category: "Values",
    title: "How to Identify Your Non-Negotiables (Without Being Unrealistic)",
    excerpt: "There's a difference between standards and expectations. Understanding that difference is what separates someone who finds the right partner from someone who doesn't.",
    author: "Mariam Rashid",
    date: "June 14, 2026",
    readTime: "6 min read",
    photo: u("1606800052052-a08af7148866", 800, 500),
    featured: false,
  },
  {
    id: 4,
    category: "Relationships",
    title: "Long-Distance Relationships: What Our Data Actually Shows",
    excerpt: "Of all the relationships formed on Ma3moni, 23% started long-distance. Here's what we've learned about what makes them work — and what doesn't.",
    author: "Faisal Al-Amin",
    date: "June 7, 2026",
    readTime: "8 min read",
    photo: u("1534630103086-5b1c106f74e0", 800, 500),
    featured: false,
  },
  {
    id: 5,
    category: "Success Stories",
    title: "Hassan & Lina: How a 92% Score Changed Two Skeptics' Minds",
    excerpt: "Neither of them believed in compatibility algorithms. A year into their marriage, they've become our most enthusiastic believers. This is their story.",
    author: "Community Team",
    date: "May 30, 2026",
    readTime: "4 min read",
    photo: u("1532712938310-34cb3982ef74", 800, 500),
    featured: false,
  },
  {
    id: 6,
    category: "Values",
    title: "Faith, Values, and Marriage: Navigating What Matters in a Secular Age",
    excerpt: "More couples than ever are navigating different levels of religious practice within their relationship. Here's how to have that conversation clearly and compassionately.",
    author: "Mariam Rashid",
    date: "May 22, 2026",
    readTime: "6 min read",
    photo: u("1460978812857-470ed1c77af0", 800, 500),
    featured: false,
  },
  {
    id: 7,
    category: "Compatibility",
    title: "The Science Behind the Ma3moni Compatibility Score",
    excerpt: "How do we calculate that number? What data goes into it? And why is it actually useful — unlike most personality tests? Our CTO explains.",
    author: "Layla Hassan",
    date: "May 15, 2026",
    readTime: "9 min read",
    photo: u("1465495976277-4387d4b0b4c6", 800, 500),
    featured: false,
  },
];

export function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const featured = POSTS.find(p => p.featured)!;
  const filtered = POSTS.filter(p => !p.featured && (activeCategory === "All" || p.category === activeCategory));

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="bg-card border-b border-border py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full mb-6" style={{ fontSize: "0.8125rem" }}>
            <Tag size={13} className="text-primary" /> Ma3moni Journal
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, letterSpacing: "-0.035em" }}>
            Insights on <span style={{ color: "var(--primary)" }}>intentional</span> relationships
          </h1>
          <p className="text-muted-foreground mt-4" style={{ fontSize: "1.0625rem", lineHeight: 1.7 }}>
            Research, advice, and real stories for those seeking a lasting partnership.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Featured post */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-border mb-16 hover:shadow-lg transition-shadow">
            <div className="relative overflow-hidden" style={{ minHeight: "340px" }}>
              <img src={featured.photo} alt={featured.title} className="w-full h-full object-cover" style={{ minHeight: "340px" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <span className="absolute top-5 left-5 bg-primary text-white px-3 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                Featured
              </span>
            </div>
            <div className="bg-card p-8 lg:p-10 flex flex-col justify-center">
              <span className="text-primary" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{featured.category}</span>
              <h2 style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em", lineHeight: 1.3, marginTop: "0.5rem", marginBottom: "1rem" }}>
                {featured.title}
              </h2>
              <p className="text-muted-foreground mb-6" style={{ fontSize: "0.9375rem", lineHeight: 1.65 }}>{featured.excerpt}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{featured.author}</p>
                  <div className="flex items-center gap-3 text-muted-foreground mt-0.5">
                    <span style={{ fontSize: "0.8125rem" }}>{featured.date}</span>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span style={{ fontSize: "0.8125rem" }}>{featured.readTime}</span>
                    </div>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 text-primary hover:gap-2.5 transition-all" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  Read <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full border transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground bg-card"}`}
                style={{ fontSize: "0.875rem" }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Posts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(post => (
              <article key={post.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/20 hover:shadow-md transition-all group cursor-pointer">
                <div className="relative overflow-hidden" style={{ height: "200px" }}>
                  <img
                    src={post.photo}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-white"
                    style={{ fontSize: "0.7rem", fontWeight: 700, background: "var(--primary)" }}
                  >
                    {post.category}
                  </span>
                </div>
                <div className="p-5">
                  <h3 style={{ fontWeight: 700, fontSize: "1rem", lineHeight: 1.4, marginBottom: "0.625rem" }}>
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground mb-5" style={{ fontSize: "0.875rem", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.8125rem" }}>{post.author}</p>
                      <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                        <span style={{ fontSize: "0.75rem" }}>{post.date}</span>
                        <span style={{ fontSize: "0.75rem" }}>·</span>
                        <div className="flex items-center gap-1">
                          <Clock size={11} />
                          <span style={{ fontSize: "0.75rem" }}>{post.readTime}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-secondary border-y border-primary/15 py-16 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Get new articles in your inbox</h2>
          <p className="text-muted-foreground mt-3 mb-6" style={{ fontSize: "1rem" }}>Weekly insights on compatibility, relationships, and intentional living.</p>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              style={{ fontSize: "0.9375rem" }}
            />
            <button className="flex-shrink-0 bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors" style={{ fontWeight: 600 }}>
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

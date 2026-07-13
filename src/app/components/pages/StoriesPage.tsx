import { Link } from "react-router";
import { MarketingLayout } from "../marketing/MarketingLayout";
import { Heart, MapPin, Calendar, ArrowRight, Quote } from "lucide-react";

const u = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`;

const STORIES = [
  {
    id: 1,
    names: "Yusuf & Aisha",
    location: "Dubai, UAE",
    married: "March 2025",
    score: 94,
    photo: u("1672184702625-71ddc099768e", 800, 600),
    quote: "I had tried other platforms for years and always felt like I was being sold to. Ma3moni was the first time I felt like someone actually understood what I was looking for — and why.",
    story: "Yusuf is a software architect. Aisha is a pediatric nurse. They matched on values around family, spirituality, and service. They were engaged within six months.",
  },
  {
    id: 2,
    names: "Omar & Fatima",
    location: "London, UK",
    married: "September 2024",
    score: 91,
    photo: u("1712948222259-752aa0bcae58", 800, 600),
    quote: "What surprised me was how the compatibility breakdown actually helped us have real conversations from day one. We didn't need to figure out the big things — they were already aligned.",
    story: "Omar is a civil engineer. Fatima is a secondary school teacher. They lived in different cities when they matched, but shared identical views on what home means. They moved to London together after their wedding.",
  },
  {
    id: 3,
    names: "Khalid & Nour",
    location: "Riyadh, Saudi Arabia",
    married: "June 2025",
    score: 89,
    photo: u("1696738806828-dfd185176ee1", 800, 600),
    quote: "Both of us had been hesitant about online platforms. Ma3moni felt different — more serious, more intentional. By the second conversation, I knew we were going to get married.",
    story: "Khalid is a corporate lawyer. Nour is an architect. Their 89% compatibility score reflected deep alignment on long-term goals and communication styles — something both of them said was rare to find.",
  },
  {
    id: 4,
    names: "Tariq & Salma",
    location: "Toronto, Canada",
    married: "December 2024",
    score: 87,
    photo: u("1520854221256-17451cc331bf", 800, 600),
    quote: "I appreciated that Ma3moni doesn't pretend a relationship is just chemistry. It helped me articulate what I actually needed in a partner — not just what I thought I wanted.",
    story: "Tariq is a finance director. Salma is a clinical psychologist. Their compatibility report highlighted strong alignment in communication style — the one area, Salma says, that most couples struggle with.",
  },
  {
    id: 5,
    names: "Hassan & Lina",
    location: "Amsterdam, Netherlands",
    married: "February 2025",
    score: 92,
    photo: u("1532712938310-34cb3982ef74", 800, 600),
    quote: "We had a 92% compatibility score and we were both skeptical. Six months into marriage, we keep finding the algorithm was right about things we didn't even ask about.",
    story: "Hassan is a product designer. Lina is a biomedical researcher. They matched across a long-distance gap — Amsterdam to Dubai — but both had listed relocation as something they were open to.",
  },
  {
    id: 6,
    names: "Bilal & Mariam",
    location: "Doha, Qatar",
    married: "October 2024",
    score: 88,
    photo: u("1474552226712-ac0f0961a954", 800, 600),
    quote: "Ma3moni showed us what we already knew about ourselves — and then found someone who fit. That's the difference. It's not matching you to someone. It's matching you to yourself, first.",
    story: "Bilal is an entrepreneur. Mariam is a sustainability consultant. They had both listed entrepreneurship and community impact as core life goals. Their first date was a volunteer event — Mariam's suggestion.",
  },
];

export function StoriesPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="bg-card border-b border-border py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full mb-6" style={{ fontSize: "0.8125rem" }}>
            <Heart size={13} className="text-primary fill-primary" /> Real Couples
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            Stories that began<br />with a <span style={{ color: "var(--primary)" }}>compatibility score</span>
          </h1>
          <p className="text-muted-foreground mt-5" style={{ fontSize: "1.0625rem", lineHeight: 1.7 }}>
            Every couple here found each other through Ma3moni. These are their words.
          </p>
        </div>
      </section>

      {/* Stories grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          {STORIES.map((s, i) => (
            <div
              key={s.id}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all ${i % 2 === 1 ? "lg:[direction:rtl]" : ""}`}
            >
              {/* Photo */}
              <div className="relative overflow-hidden" style={{ minHeight: "380px", direction: "ltr" }}>
                <img
                  src={s.photo}
                  alt={`${s.names} wedding photo`}
                  className="w-full h-full object-cover"
                  style={{ minHeight: "380px" }}
                />
                {/* Compatibility badge */}
                <div className="absolute top-5 left-5 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--primary)" }}>{s.score}% Compatible</span>
                </div>
              </div>

              {/* Content */}
              <div className="bg-card p-8 lg:p-10 flex flex-col justify-center" style={{ direction: "ltr" }}>
                <Quote size={32} className="text-primary/20 mb-4" />
                <blockquote className="text-foreground mb-6" style={{ fontSize: "1.0625rem", lineHeight: 1.7, fontStyle: "italic" }}>
                  "{s.quote}"
                </blockquote>
                <div className="h-px bg-border mb-6" />
                <h3 style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.02em" }}>{s.names}</h3>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin size={13} />
                    <span style={{ fontSize: "0.875rem" }}>{s.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar size={13} />
                    <span style={{ fontSize: "0.875rem" }}>Married {s.married}</span>
                  </div>
                </div>
                <p className="text-muted-foreground mt-4" style={{ fontSize: "0.9375rem", lineHeight: 1.65 }}>{s.story}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial bar */}
      <section className="bg-muted border-y border-border py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid grid-cols-3 gap-8">
            {[
              { value: "4,200+", label: "Relationships formed" },
              { value: "89%", label: "Average compatibility score" },
              { value: "98%", label: "Member satisfaction" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p style={{ fontSize: "2.25rem", fontWeight: 900, color: "var(--primary)", letterSpacing: "-0.03em" }}>{value}</p>
                <p className="text-muted-foreground mt-1" style={{ fontSize: "0.9375rem" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Your story starts here</h2>
          <p className="text-muted-foreground mt-3 mb-8" style={{ fontSize: "1.0625rem" }}>
            Join the thousands who found what they were looking for.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl hover:bg-primary/90 transition-all"
            style={{ fontWeight: 700, fontSize: "1rem" }}
          >
            Begin Your Journey <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}

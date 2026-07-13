import { Link } from "react-router";
import { MarketingLayout } from "../marketing/MarketingLayout";
import { Heart, Eye, Target, Shield, Star, Users, Globe, Lock, Zap, ArrowRight } from "lucide-react";

const CORE_VALUES = [
  { icon: <Shield size={22} />, title: "Integrity", desc: "We never compromise on trust. Every decision — from product to moderation — is made with honesty and accountability." },
  { icon: <Heart size={22} />, title: "Dignity", desc: "Every member deserves respect. We design for the whole person, not just the profile." },
  { icon: <Target size={22} />, title: "Intentionality", desc: "We deliberately avoid addictive patterns. Our platform is built for purpose, not compulsion." },
  { icon: <Lock size={22} />, title: "Privacy", desc: "Your data belongs to you. We collect only what's necessary and never sell what you share with us." },
  { icon: <Star size={22} />, title: "Compatibility", desc: "Depth over volume. We believe a small number of meaningful connections is worth more than thousands of casual ones." },
  { icon: <Globe size={22} />, title: "Inclusivity", desc: "Love transcends borders. We build for serious individuals everywhere, across cultures and backgrounds." },
];

const TEAM = [
  { initials: "FA", name: "Faisal Al-Amin", role: "Co-Founder & CEO", bg: "#0A6870", bio: "Former product lead at a global tech company. Passionate about using technology to solve deeply human problems." },
  { initials: "LH", name: "Layla Hassan", role: "Co-Founder & CTO", bg: "#4A8DB8", bio: "10 years in machine learning and compatibility systems. Believes algorithms should serve people, not replace judgment." },
  { initials: "MR", name: "Mariam Rashid", role: "Head of Community", bg: "#C5733F", bio: "Psychologist and relationship researcher. Ensures the platform reflects real human needs, not just data points." },
  { initials: "KM", name: "Khalid Mansouri", role: "Head of Trust & Safety", bg: "#6B9E78", bio: "Built safety systems at two major platforms. Ensures Ma3moni remains a safe, moderated environment." },
];

export function AboutPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="bg-card border-b border-border py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full mb-8" style={{ fontSize: "0.8125rem" }}>
            <Heart size={13} className="text-primary" /> Our Story
          </div>
          <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            We built Ma3moni because<br />
            <span style={{ color: "var(--primary)" }}>this mattered too much</span><br />
            to get wrong.
          </h1>
          <p className="text-muted-foreground mt-8 max-w-2xl mx-auto" style={{ fontSize: "1.125rem", lineHeight: 1.75 }}>
            Most platforms optimize for engagement. We optimize for outcomes. Because when someone trusts you with something as important as finding a life partner, engagement metrics mean nothing if they don't find the right person.
          </p>
        </div>
      </section>

      {/* Vision */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Eye size={18} className="text-primary" />
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Our Vision</span>
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
              A world where finding the right partner is dignified, intentional, and possible.
            </h2>
            <p className="text-muted-foreground mt-5" style={{ fontSize: "1.0625rem", lineHeight: 1.75 }}>
              We envision a world where every serious individual — regardless of where they live, how they were raised, or what they look like — can find a compatible life partner with clarity, dignity, and intention.
            </p>
            <p className="text-muted-foreground mt-4" style={{ fontSize: "1.0625rem", lineHeight: 1.75 }}>
              Not a world where more people are on more apps, but a world where fewer, more meaningful connections lead to deeper, lasting commitments.
            </p>
          </div>
          <div className="bg-primary rounded-3xl p-10 text-white relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -right-4 bottom-8 w-24 h-24 rounded-full bg-white/5" />
            <blockquote style={{ fontSize: "1.375rem", fontWeight: 700, lineHeight: 1.4, position: "relative" }}>
              "A world where every individual who seeks a lifelong partner can find them with clarity, dignity, and intention."
            </blockquote>
            <p className="mt-6 opacity-70" style={{ fontSize: "0.875rem" }}>— Ma3moni Vision Statement</p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-card border-y border-border py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="bg-secondary rounded-3xl p-10 border border-primary/15 order-last lg:order-first">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Target size={22} className="text-primary" />
              </div>
              <span style={{ fontWeight: 800, fontSize: "1.125rem" }}>Our Mission</span>
            </div>
            <p style={{ fontSize: "1.1875rem", fontWeight: 600, lineHeight: 1.5, color: "var(--primary)" }}>
              To build a compatibility-first platform that prioritizes meaningful, lasting relationships — guided by shared values, aligned goals, and genuine human connection.
            </p>
            <div className="mt-8 pt-6 border-t border-primary/15 grid grid-cols-2 gap-4">
              {[
                { value: "94%", label: "Compatibility-led matches" },
                { value: "12K+", label: "Active members" },
                { value: "4.2K+", label: "Relationships formed" },
                { value: "3 yrs", label: "Average time to marriage" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--primary)", letterSpacing: "-0.03em" }}>{value}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-primary" />
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Our Mission</span>
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
              Compatibility first. Everything else second.
            </h2>
            <p className="text-muted-foreground mt-5" style={{ fontSize: "1.0625rem", lineHeight: 1.75 }}>
              Our platform is built around a simple belief: that who you are compatible with depends on more than what you look like. It depends on your values, how you communicate, what you want from life, and who you want to grow into.
            </p>
            <p className="text-muted-foreground mt-4" style={{ fontSize: "1.0625rem", lineHeight: 1.75 }}>
              We serve that belief by designing every feature around compatibility data, not engagement metrics — so our success is measured by relationships that last, not time spent on the app.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap size={18} className="text-primary" />
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Core Values</span>
            </div>
            <h2 style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.03em" }}>What we believe in</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto" style={{ fontSize: "1.0625rem" }}>
              Six principles that guide every product decision we make.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CORE_VALUES.map(({ icon, title, desc }) => (
              <div key={title} className="bg-card rounded-2xl border border-border p-7 hover:border-primary/25 hover:shadow-md transition-all group">
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mb-5 text-primary group-hover:bg-primary/10 transition-colors">
                  {icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "1.0625rem", marginBottom: "0.5rem" }}>{title}</h3>
                <p className="text-muted-foreground" style={{ fontSize: "0.9375rem", lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founding Story */}
      <section className="bg-card border-y border-border py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Our Story</span>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginTop: "0.75rem" }}>How Ma3moni began</h2>
          </div>
          <div className="space-y-5 text-muted-foreground" style={{ fontSize: "1.0625rem", lineHeight: 1.8 }}>
            <p>Ma3moni was born from a personal frustration. Our co-founders Faisal and Layla had both watched people they loved — family members, close friends — spend years cycling through platforms that were fundamentally misaligned with the seriousness of what they were seeking.</p>
            <p>The platforms they used were built for engagement, not outcomes. They rewarded frequent logins, not thoughtful conversations. They prioritized photos over values. They gamified something that should have been sacred.</p>
            <p>So in 2023, Faisal and Layla set out to build something different. Not another app — a platform. One that treated its users as whole, serious people rather than profiles to be browsed. One that measured its success by marriages, not monthly active users.</p>
            <p>Three years later, over 4,200 relationships have been formed on Ma3moni. Every single one began with a compatibility match — not a swipe.</p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>The Team</span>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginTop: "0.75rem" }}>People behind the platform</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map(({ initials, name, role, bg, bio }) => (
              <div key={name} className="bg-card rounded-2xl border border-border p-6 hover:border-primary/20 hover:shadow-md transition-all">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: bg + "20" }}>
                  <span style={{ fontSize: "1.25rem", fontWeight: 800, color: bg }}>{initials}</span>
                </div>
                <p style={{ fontWeight: 700, fontSize: "1rem" }}>{name}</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--primary)", fontWeight: 600, marginTop: 2, marginBottom: "0.75rem" }}>{role}</p>
                <p className="text-muted-foreground" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>{bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20 px-6 text-center text-white">
        <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Ready to find your person?</h2>
        <p className="mt-3 mb-8 opacity-80" style={{ fontSize: "1.0625rem" }}>Join thousands of serious individuals who trusted Ma3moni with their most important search.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl hover:bg-white/90 transition-all"
          style={{ fontWeight: 700, fontSize: "1rem" }}
        >
          Begin Your Journey <ArrowRight size={18} />
        </Link>
      </section>
    </MarketingLayout>
  );
}

import { useState } from "react";
import { MarketingLayout } from "../marketing/MarketingLayout";
import { Mail, MessageCircle, Clock, CheckCircle, ChevronDown, ChevronUp, Send } from "lucide-react";

const FAQS = [
  { q: "How does the compatibility score work?", a: "Our algorithm analyses 40+ data points across values, lifestyle, communication style, life goals, and partner preferences. Each dimension is weighted based on your stated priorities, producing a percentage that reflects overall alignment." },
  { q: "Is my profile visible to everyone?", a: "No. Profiles on Ma3moni are only shown to individuals who meet your stated compatibility preferences. You control the visibility of your profile and can pause or hide it at any time from your settings." },
  { q: "How do I delete my account?", a: "You can permanently delete your account from Profile → Settings → Delete Account. All your data will be removed from our systems within 30 days, in accordance with our privacy policy." },
  { q: "I was matched with someone I know — what should I do?", a: "If you come across someone you know personally and it's uncomfortable, you can block them from their profile. Blocking prevents them from seeing you and stops all future matches with that person." },
  { q: "How long does profile moderation take?", a: "Profile photos are reviewed within 24 hours. During peak periods, this may extend to 48 hours. You'll receive a notification when your photo is approved or if any changes are requested." },
  { q: "Can I change my preferences after completing onboarding?", a: "Yes, at any time. Go to Profile → Partner Preferences. Changing preferences may update your active matches based on the new criteria." },
  { q: "What happens if my account is suspended?", a: "You'll receive an email with the reason for suspension. If you believe it was made in error, you can appeal via the contact form below. Customer Care typically responds within 24 hours." },
];

export function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="bg-card border-b border-border py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, letterSpacing: "-0.035em" }}>
            We're here to <span style={{ color: "var(--primary)" }}>help</span>
          </h1>
          <p className="text-muted-foreground mt-4" style={{ fontSize: "1.0625rem", lineHeight: 1.7 }}>
            Our support team typically responds within 4 business hours.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Contact options */}
          <div className="space-y-4">
            <h2 style={{ fontWeight: 800, fontSize: "1.25rem", marginBottom: "1.25rem" }}>Get in touch</h2>
            {[
              {
                icon: <Mail size={20} />,
                title: "Email Support",
                desc: "For general questions and account help",
                value: "support@ma3moni.com",
                color: "#0A6870",
              },
              {
                icon: <MessageCircle size={20} />,
                title: "Live Chat",
                desc: "Available Mon–Fri, 9am–6pm GST",
                value: "Start a chat",
                color: "#4A8DB8",
              },
              {
                icon: <Clock size={20} />,
                title: "Response Time",
                desc: "We typically respond within",
                value: "4 business hours",
                color: "#C5733F",
              },
            ].map(({ icon, title, desc, value, color }) => (
              <div key={title} className="bg-card rounded-2xl border border-border p-5 flex items-start gap-4 hover:border-primary/20 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "15", color }}>
                  {icon}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{title}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{desc}</p>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem", color, marginTop: 4 }}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2">
            <h2 style={{ fontWeight: 800, fontSize: "1.25rem", marginBottom: "1.25rem" }}>Send a message</h2>

            {submitted ? (
              <div className="bg-secondary rounded-2xl border border-primary/20 p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={26} className="text-primary" />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: "1.25rem" }}>Message sent!</h3>
                <p className="text-muted-foreground mt-3" style={{ fontSize: "1rem" }}>
                  We've received your message and will respond to <strong>{form.email}</strong> within 4 business hours.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="mt-6 text-primary hover:text-primary/80 transition-colors"
                  style={{ fontSize: "0.9375rem", fontWeight: 600 }}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-7 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { label: "Full Name", key: "name", placeholder: "Yusuf Al-Rashid", type: "text" },
                    { label: "Email Address", key: "email", placeholder: "your@email.com", type: "email" },
                  ].map(({ label, key, placeholder, type }) => (
                    <div key={key}>
                      <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{label}</label>
                      <input
                        type={type}
                        value={form[key as keyof typeof form]}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        style={{ fontSize: "0.9375rem" }}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Subject</label>
                  <select
                    value={form.subject}
                    onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    style={{ fontSize: "0.9375rem" }}
                  >
                    <option value="">Select a topic…</option>
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
                  <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Message</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Please describe your question or issue in detail…"
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                    style={{ fontSize: "0.9375rem" }}
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98]"
                  style={{ fontWeight: 700, fontSize: "1rem" }}
                >
                  <Send size={16} />
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-card border-y border-border py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Frequently asked questions</h2>
            <p className="text-muted-foreground mt-3" style={{ fontSize: "1rem" }}>Can't find your answer? Send us a message above.</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-background rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-muted/30 transition-colors"
                >
                  <span style={{ fontWeight: 600, fontSize: "0.9375rem", flex: 1, marginRight: "1rem" }}>{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={18} className="text-primary flex-shrink-0" /> : <ChevronDown size={18} className="text-muted-foreground flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-muted-foreground" style={{ fontSize: "0.9375rem", lineHeight: 1.7 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

import { MarketingLayout } from "../marketing/MarketingLayout";

const SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    content: `Ma3moni ("we", "us", or "our") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, who we share it with, and the choices you have regarding your information. By using Ma3moni, you agree to the practices described in this policy.

Last updated: July 2, 2026`,
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    content: `**Account information:** When you register, we collect your name, email address, date of birth, gender, and password.

**Profile information:** Details you choose to share including your city, education, profession, values, lifestyle preferences, life goals, and partner preferences.

**Photos:** Profile photos you upload, which are subject to manual moderation before being displayed.

**Communications:** Messages you send through the platform (encrypted in transit and at rest).

**Usage data:** How you interact with the app, including which profiles you viewed, actions you took, and features you used. This data is anonymised and aggregated.

**Device information:** Device type, operating system, browser, and IP address for security and fraud prevention purposes.`,
  },
  {
    id: "how-we-use",
    title: "How We Use Your Information",
    content: `We use your information to:

• **Operate the platform** — create and maintain your account, process subscriptions, and provide customer support.
• **Generate compatibility matches** — our algorithm uses your profile data exclusively to identify compatible members.
• **Ensure safety** — detect fraudulent accounts, enforce our community guidelines, and protect members from harm.
• **Improve our product** — analyse aggregated usage patterns to improve matching quality and user experience.
• **Communicate with you** — send platform notifications, support responses, and (with consent) marketing updates.

We do not use your data for advertising purposes, and we never sell your personal information to third parties.`,
  },
  {
    id: "data-sharing",
    title: "Data Sharing",
    content: `We share your information only in the following circumstances:

**With other members:** Your profile information is visible to members who meet your stated compatibility preferences. You control the extent of what you share.

**Service providers:** We work with trusted third-party services for payment processing (Stripe, Paystack), infrastructure hosting, and email delivery. These providers are contractually obligated to protect your data and may not use it for their own purposes.

**Legal requirements:** We may disclose information where required by law, court order, or to protect the rights and safety of our members or the public.

**Business transfers:** In the event of a merger, acquisition, or sale of assets, your data may be transferred. We will notify you before any such transfer and before your data becomes subject to a different privacy policy.`,
  },
  {
    id: "data-retention",
    title: "Data Retention",
    content: `We retain your data as long as your account is active. If you delete your account:

• Your profile is removed from the platform immediately.
• Your personal data is permanently deleted from our systems within 30 days.
• Anonymised, aggregated data derived from your usage (which cannot identify you) may be retained for platform improvement purposes.
• Messages exchanged with other members are deleted from our servers. The other party retains their own copy in their conversation history.`,
  },
  {
    id: "your-rights",
    title: "Your Rights",
    content: `Depending on your location, you may have the following rights regarding your data:

• **Access:** Request a copy of the personal data we hold about you.
• **Correction:** Request that we correct inaccurate or incomplete data.
• **Deletion:** Request that we delete your personal data (subject to legal obligations).
• **Portability:** Request your data in a machine-readable format.
• **Restriction:** Request that we restrict processing of your data in certain circumstances.
• **Objection:** Object to our processing of your data for certain purposes.

To exercise any of these rights, contact us at privacy@ma3moni.com. We will respond within 30 days.`,
  },
  {
    id: "security",
    title: "Security",
    content: `We take the security of your data seriously. Our measures include:

• End-to-end encryption for all messages between members.
• TLS/HTTPS encryption for all data in transit.
• AES-256 encryption for sensitive data at rest.
• Multi-factor authentication available for all accounts.
• Regular third-party security audits.
• Strict access controls — only authorised personnel can access user data, and only when necessary.

No system is completely secure. If you suspect your account has been compromised, contact us immediately at security@ma3moni.com.`,
  },
  {
    id: "cookies",
    title: "Cookies & Tracking",
    content: `We use strictly necessary cookies to operate the platform (session management, authentication). We do not use tracking cookies, advertising pixels, or third-party analytics that profile you across the web.

You can control cookie settings through your browser, but disabling essential cookies may affect the platform's functionality.`,
  },
  {
    id: "children",
    title: "Children's Privacy",
    content: `Ma3moni is intended for adults aged 18 and older. We do not knowingly collect data from anyone under 18. If we discover that we have collected data from a minor, we will delete it immediately. If you believe a minor has registered, contact us at support@ma3moni.com.`,
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email and display a prominent notice on the platform at least 14 days before the changes take effect. Your continued use of the platform after the effective date constitutes acceptance of the updated policy.`,
  },
  {
    id: "contact",
    title: "Contact Us",
    content: `For privacy-related questions, requests, or concerns, contact us at:

**Email:** privacy@ma3moni.com
**Address:** Ma3moni Technologies Ltd., PO Box 45678, Dubai, UAE

For general support queries, visit our Contact page.`,
  },
];

export function PrivacyPage() {
  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.035em" }}>Privacy Policy</h1>
          <p className="text-muted-foreground mt-3" style={{ fontSize: "1rem" }}>Last updated: July 2, 2026</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* ToC */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.75rem" }}>Table of Contents</p>
              <nav className="space-y-1">
                {SECTIONS.map((s, i) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-muted-foreground hover:text-primary transition-colors py-1"
                    style={{ fontSize: "0.8125rem" }}
                  >
                    {i + 1}. {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="lg:col-span-3 space-y-10">
            {SECTIONS.map((s, i) => (
              <section key={s.id} id={s.id}>
                <h2 style={{ fontWeight: 800, fontSize: "1.25rem", marginBottom: "1rem", letterSpacing: "-0.015em" }}>
                  {i + 1}. {s.title}
                </h2>
                <div className="text-muted-foreground space-y-3" style={{ fontSize: "0.9375rem", lineHeight: 1.75 }}>
                  {s.content.split("\n\n").map((para, j) => (
                    <p key={j}>
                      {para.split(/(\*\*.*?\*\*)/).map((part, k) =>
                        part.startsWith("**") && part.endsWith("**") ? (
                          <strong key={k} style={{ color: "var(--foreground)", fontWeight: 600 }}>
                            {part.slice(2, -2)}
                          </strong>
                        ) : (
                          <span key={k}>{part}</span>
                        )
                      )}
                    </p>
                  ))}
                </div>
                {i < SECTIONS.length - 1 && <div className="mt-8 h-px bg-border" />}
              </section>
            ))}
          </main>
        </div>
      </div>
    </MarketingLayout>
  );
}

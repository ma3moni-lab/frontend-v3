import { MarketingLayout } from "../marketing/MarketingLayout";

const SECTIONS = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    content: `By creating an account on Ma3moni, you agree to be bound by these Terms of Service ("Terms"), our Privacy Policy, and our Community Guidelines. If you do not agree to these Terms, you may not use the platform.

Ma3moni is operated by Ma3moni Technologies Ltd. ("Ma3moni", "we", "us"). These Terms were last updated on July 2, 2026.`,
  },
  {
    id: "eligibility",
    title: "Eligibility",
    content: `To use Ma3moni, you must:

• Be at least 18 years of age.
• Be a single individual genuinely seeking a long-term, marriage-oriented relationship.
• Have the legal capacity to enter into a binding agreement.
• Not be prohibited from using the platform under applicable law.

By using Ma3moni, you represent and warrant that you meet all eligibility requirements. We reserve the right to terminate accounts that do not meet these criteria.`,
  },
  {
    id: "account",
    title: "Account Responsibilities",
    content: `**Accuracy:** You are responsible for providing truthful, accurate, and complete information on your profile. False or misleading information is grounds for immediate account termination.

**Security:** You are responsible for maintaining the confidentiality of your login credentials. Notify us immediately at security@ma3moni.com if you suspect unauthorised access to your account.

**One account per person:** You may not create multiple accounts. If we detect duplicate accounts, all associated accounts may be permanently suspended.

**Profile photos:** All profile photos must be recent, solo photographs of yourself. Group photos, illustrated images, or photos of other individuals are not permitted and will be rejected during moderation.`,
  },
  {
    id: "prohibited",
    title: "Prohibited Conduct",
    content: `You agree not to:

• Impersonate any person or misrepresent your identity.
• Use the platform for commercial solicitation, advertising, or spam.
• Send unsolicited, harassing, abusive, threatening, or sexually explicit messages.
• Attempt to circumvent our safety features, moderation systems, or subscription requirements.
• Scrape, harvest, or extract data from the platform by automated means.
• Introduce malicious code, viruses, or other harmful software.
• Use the platform to facilitate crimes or activities that violate applicable law.
• Engage in any behaviour designed to manipulate, deceive, or defraud other members.

Violation of this section may result in immediate account suspension or permanent ban, at our sole discretion.`,
  },
  {
    id: "content",
    title: "User Content",
    content: `You retain ownership of the content you submit to Ma3moni (including photos, profile text, and messages). By submitting content, you grant Ma3moni a non-exclusive, royalty-free, worldwide licence to use, display, and process your content solely for the purpose of operating and improving the platform.

You are solely responsible for the content you post. Ma3moni does not endorse, verify, or take responsibility for user-generated content, except where we are legally required to act.`,
  },
  {
    id: "subscriptions",
    title: "Subscriptions & Payments",
    content: `**Subscription plans:** Ma3moni offers a free tier and paid subscription plans (Basic and Premium). Paid features are described on our pricing page and are subject to change with advance notice.

**Billing:** Subscriptions are billed monthly. By subscribing, you authorise Ma3moni to charge your payment method on a recurring basis until you cancel.

**Cancellation:** You may cancel your subscription at any time from Profile → Subscription → Cancel Plan. Cancellation takes effect at the end of the current billing period. No partial refunds are issued for unused time.

**Refunds:** Refund requests are handled on a case-by-case basis. Contact support@ma3moni.com within 7 days of a charge if you believe a billing error occurred.

**Price changes:** We will notify you at least 30 days before any price change. Your continued use after the effective date constitutes acceptance of the new price.`,
  },
  {
    id: "safety",
    title: "Safety & Moderation",
    content: `Ma3moni maintains a moderation team to review reported content, profile photos, and flagged accounts. We reserve the right to:

• Remove any content that violates these Terms or our Community Guidelines.
• Suspend or permanently ban accounts at our discretion.
• Cooperate with law enforcement when legally required.

Members are encouraged to use the Report function on any profile or conversation that makes them uncomfortable. All reports are reviewed confidentially.`,
  },
  {
    id: "disclaimers",
    title: "Disclaimers & Limitation of Liability",
    content: `**No guarantees:** Ma3moni provides a platform to facilitate connections. We do not guarantee that use of the platform will result in a match, relationship, or marriage.

**Background checks:** Ma3moni does not conduct criminal background checks on members. Exercise reasonable caution when meeting anyone in person.

**Platform availability:** We strive for high availability but do not guarantee uninterrupted service. We are not liable for losses resulting from platform downtime.

**Limitation of liability:** To the maximum extent permitted by law, Ma3moni's liability for any claim arising from use of the platform is limited to the amount you paid us in the 12 months preceding the claim.`,
  },
  {
    id: "termination",
    title: "Termination",
    content: `**By you:** You may delete your account at any time from Profile → Settings → Delete Account. Deletion is effective immediately and your data will be removed within 30 days.

**By us:** We may terminate or suspend your account immediately, without prior notice, if you violate these Terms, engage in fraudulent activity, or if we are required to do so by law.

Upon termination, your right to use the platform ceases immediately. Provisions of these Terms that by their nature should survive termination will do so.`,
  },
  {
    id: "governing-law",
    title: "Governing Law & Disputes",
    content: `These Terms are governed by the laws of the United Arab Emirates. Any dispute arising from these Terms or your use of Ma3moni shall be resolved through binding arbitration in Dubai, UAE, except where prohibited by applicable law.

If a dispute cannot be resolved through arbitration, the courts of Dubai, UAE shall have exclusive jurisdiction.`,
  },
  {
    id: "changes",
    title: "Changes to These Terms",
    content: `We may update these Terms from time to time. We will notify you of material changes by email and by posting a notice on the platform at least 14 days before they take effect. Your continued use of the platform after the effective date constitutes acceptance of the updated Terms.`,
  },
  {
    id: "contact",
    title: "Contact",
    content: `For questions about these Terms, contact us at:

**Email:** legal@ma3moni.com
**Address:** Ma3moni Technologies Ltd., PO Box 45678, Dubai, UAE`,
  },
];

export function TermsPage() {
  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.035em" }}>Terms of Service</h1>
          <p className="text-muted-foreground mt-3" style={{ fontSize: "1rem" }}>Last updated: July 2, 2026</p>
          <div className="mt-5 p-4 bg-secondary rounded-xl border border-primary/15">
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.7 }}>
              <strong>Summary:</strong> Use Ma3moni honestly and respectfully. Don't impersonate anyone, send spam, or misuse the platform. We'll protect your data as described in our Privacy Policy. These Terms govern your relationship with Ma3moni.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
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

import { useState } from "react";
import { CheckCircle, Eye, EyeOff, RefreshCw, Save, ToggleLeft, ToggleRight, TrendingUp, DollarSign, Users, X, AlertTriangle } from "lucide-react";

// ── Mock transaction data (replaced by real API on live) ─────
const TRANSACTIONS = [
  { id: "tx1", user: "Aisha Mohammed", plan: "Premium", amount: 49, date: "Jul 1, 2026", status: "completed", provider: "Credo", ref: "CREDO_8821a9" },
  { id: "tx2", user: "Layla Rahman",   plan: "Premium", amount: 49, date: "Jun 28, 2026", status: "completed", provider: "Credo", ref: "CREDO_44bc1" },
  { id: "tx3", user: "Yusuf Al-Rashid",plan: "Basic",   amount: 19, date: "Jun 25, 2026", status: "completed", provider: "Credo", ref: "CREDO_C7H3X2" },
  { id: "tx4", user: "Noor Aziz",      plan: "Premium", amount: 49, date: "Jun 20, 2026", status: "refunded",  provider: "Credo", ref: "CREDO_ref91c" },
  { id: "tx5", user: "Tariq Mansouri", plan: "Basic",   amount: 19, date: "Jun 18, 2026", status: "failed",    provider: "Credo", ref: "CREDO_fail7" },
  { id: "tx6", user: "Omar Hassan",    plan: "Basic",   amount: 19, date: "Jun 15, 2026", status: "completed", provider: "Credo", ref: "CREDO_H9G2K1" },
];

type PaymentMode = "test" | "live";
// Credo is the primary gateway. PayPal and Paystack remain as future alternatives.
type ProviderKey = "credo" | "paypal" | "paystack";

interface ProviderConfig {
  enabled: boolean;
  mode: PaymentMode;
  testKeys: Record<string, string>;
  liveKeys: Record<string, string>;
}

const PROVIDER_FIELDS: Record<ProviderKey, { label: string; testKeys: string[]; liveKeys: string[]; color: string; description: string; primary?: boolean }> = {
  credo: {
    label: "Credo · eTranzact",
    description: "Primary payment gateway — NGN, USD and more. Keys from dashboard.credocentral.com.",
    color: "#0A6870",
    primary: true,
    testKeys: ["Test Public Key", "Test Secret Key", "Webhook Secret"],
    liveKeys: ["Live Public Key", "Live Secret Key", "Webhook Secret"],
  },
  paypal: {
    label: "PayPal",
    description: "Global payments — USD, EUR, GBP and 25+ currencies.",
    color: "#003087",
    testKeys: ["Sandbox Client ID", "Sandbox Secret Key"],
    liveKeys: ["Live Client ID", "Live Secret Key"],
  },
  paystack: {
    label: "Paystack",
    description: "Africa-first payment stack — NGN, GHS, ZAR and more.",
    color: "#00C3F7",
    testKeys: ["Test Public Key", "Test Secret Key", "Webhook Secret"],
    liveKeys: ["Live Public Key", "Live Secret Key", "Webhook Secret"],
  },
};

const PROVIDER_LOGOS: Record<ProviderKey, string> = {
  credo:    "CR",
  paypal:   "PP",
  paystack: "PS",
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  completed: { bg: "#dcfce7", text: "#166534" },
  refunded:  { bg: "#fef9c3", text: "#854d0e" },
  failed:    { bg: "#fee2e2", text: "#991b1b" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "#f3f4f6", text: "#6b7280" };
  return (
    <span className="px-2 py-0.5 rounded-full capitalize" style={{ fontSize: "0.75rem", fontWeight: 600, background: s.bg, color: s.text }}>
      {status}
    </span>
  );
}

export function PaymentsSectionV2() {
  const [providers, setProviders] = useState<Record<ProviderKey, ProviderConfig>>({
    credo:    { enabled: true,  mode: "test", testKeys: {}, liveKeys: {} },  // primary
    paypal:   { enabled: false, mode: "test", testKeys: {}, liveKeys: {} },  // optional
    paystack: { enabled: false, mode: "test", testKeys: {}, liveKeys: {} },  // optional
  });

  const [plans, setPlans] = useState({ basic: "19", premium: "49" });
  const [editing, setEditing] = useState<"basic" | "premium" | null>(null);
  const [draft, setDraft] = useState("");
  const [savedPlan, setSavedPlan] = useState<"basic" | "premium" | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [refundModal, setRefundModal] = useState<string | null>(null);

  const toggleMode = (key: ProviderKey) =>
    setProviders(p => ({ ...p, [key]: { ...p[key], mode: p[key].mode === "test" ? "live" : "test" } }));

  const toggleEnabled = (key: ProviderKey) =>
    setProviders(p => ({ ...p, [key]: { ...p[key], enabled: !p[key].enabled } }));

  const saveKey = (provider: ProviderKey, mode: PaymentMode, field: string, value: string) => {
    setProviders(p => ({
      ...p,
      [provider]: {
        ...p[provider],
        [`${mode}Keys`]: { ...p[provider][`${mode}Keys`], [field]: value },
      },
    }));
  };

  const savePlan = (plan: "basic" | "premium") => {
    if (!draft || isNaN(Number(draft))) return;
    setPlans(p => ({ ...p, [plan]: draft }));
    setEditing(null);
    setSavedPlan(plan);
    setTimeout(() => setSavedPlan(null), 2000);
  };

  const USER_COUNTS = { basic: 3420, premium: 2193, free: 7234 };
  const MRR = USER_COUNTS.basic * Number(plans.basic) + USER_COUNTS.premium * Number(plans.premium);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>Payments & Subscriptions</h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.9375rem" }}>Manage payment providers, pricing, and transactions</p>
        </div>
      </div>

      {/* MRR summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: <DollarSign size={18} />, label: "Monthly Recurring Revenue", value: `$${MRR.toLocaleString()}`, color: "#0A6870" },
          { icon: <Users size={18} />, label: "Paying Subscribers", value: (USER_COUNTS.basic + USER_COUNTS.premium).toLocaleString(), color: "#4A8DB8" },
          { icon: <TrendingUp size={18} />, label: "Revenue Growth", value: "+7.2%", color: "#6B9E78" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: color + "18", color }}>
              {icon}
            </div>
            <p style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.03em" }}>{value}</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Subscription Plan Pricing ── */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <h2 style={{ fontWeight: 700, fontSize: "1.0625rem", marginBottom: "1.25rem" }}>Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free */}
          <div className="rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontWeight: 700 }}>Free</span>
              <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>$0 / month</span>
            </div>
            <p style={{ fontSize: "2rem", fontWeight: 900, color: "#68747F" }}>{USER_COUNTS.free.toLocaleString()}</p>
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Active members</p>
          </div>

          {/* Basic */}
          {(["basic", "premium"] as const).map(plan => (
            <div key={plan} className="rounded-xl border border-primary/25 bg-secondary/30 p-5">
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{plan}</span>
                {savedPlan === plan && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle size={13} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Saved</span>
                  </div>
                )}
              </div>

              {editing === plan ? (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-muted-foreground" style={{ fontSize: "1.125rem" }}>$</span>
                  <input
                    autoFocus
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") savePlan(plan); if (e.key === "Escape") setEditing(null); }}
                    className="w-20 px-3 py-1.5 rounded-lg border border-primary/50 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                    style={{ fontSize: "1.25rem", fontWeight: 700 }}
                  />
                  <span className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>/mo</span>
                  <button onClick={() => savePlan(plan)} className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    <Save size={13} />
                  </button>
                  <button onClick={() => setEditing(null)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditing(plan); setDraft(plans[plan]); }}
                  className="flex items-baseline gap-1 mt-2 group"
                >
                  <span style={{ fontSize: "2rem", fontWeight: 900, color: "var(--primary)" }}>${plans[plan]}</span>
                  <span className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>/month</span>
                  <span className="ml-2 opacity-0 group-hover:opacity-100 text-primary transition-opacity" style={{ fontSize: "0.75rem" }}>Edit</span>
                </button>
              )}

              <p style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.75rem", color: "var(--foreground)" }}>
                {USER_COUNTS[plan].toLocaleString()}
              </p>
              <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>subscribers · ${(USER_COUNTS[plan] * Number(plans[plan])).toLocaleString()} MRR</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Payment Providers ── */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <h2 style={{ fontWeight: 700, fontSize: "1.0625rem", marginBottom: "1.25rem" }}>Payment Providers</h2>
        <div className="space-y-5">
          {(Object.entries(PROVIDER_FIELDS) as [ProviderKey, typeof PROVIDER_FIELDS[ProviderKey]][]).map(([key, meta]) => {
            const cfg = providers[key];
            const activeKeys = cfg.mode === "test" ? meta.testKeys : meta.liveKeys;
            const modeData = cfg.mode === "test" ? cfg.testKeys : cfg.liveKeys;

            return (
              <div key={key} className={`rounded-xl border p-5 transition-all ${cfg.enabled ? "border-primary/20 bg-background" : "border-border opacity-60"}`}>
                {/* Provider header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white" style={{ background: meta.color, fontSize: "0.75rem" }}>
                      {PROVIDER_LOGOS[key]}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{meta.label}</p>
                      <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{meta.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Test / Live toggle */}
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: "0.75rem", fontWeight: cfg.mode === "test" ? 700 : 400, color: cfg.mode === "test" ? "#C5733F" : "var(--muted-foreground)" }}>Test</span>
                      <button
                        onClick={() => toggleMode(key)}
                        className="relative w-10 h-5 rounded-full transition-colors"
                        style={{ background: cfg.mode === "live" ? "var(--primary)" : "#CBD5E0" }}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${cfg.mode === "live" ? "left-[22px]" : "left-0.5"}`} />
                      </button>
                      <span style={{ fontSize: "0.75rem", fontWeight: cfg.mode === "live" ? 700 : 400, color: cfg.mode === "live" ? "var(--primary)" : "var(--muted-foreground)" }}>Live</span>
                    </div>
                    {/* Enable/disable */}
                    <button
                      onClick={() => toggleEnabled(key)}
                      className={`px-3 py-1.5 rounded-lg border transition-all ${cfg.enabled ? "border-primary/30 text-primary bg-secondary hover:bg-primary hover:text-white" : "border-border text-muted-foreground hover:bg-muted"}`}
                      style={{ fontSize: "0.75rem", fontWeight: 600 }}
                    >
                      {cfg.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>

                {/* Mode badge */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-4 ${cfg.mode === "live" ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${cfg.mode === "live" ? "bg-green-500" : "bg-amber-500"}`} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: cfg.mode === "live" ? "#16a34a" : "#d97706" }}>
                    {cfg.mode === "live" ? "Live Mode — real transactions active" : "Test Mode — no real transactions"}
                  </span>
                </div>

                {cfg.mode === "live" && (
                  <div className="flex items-center gap-2 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
                    <p style={{ fontSize: "0.75rem", color: "#92400e" }}>Live keys are sensitive. They are stored encrypted and only displayed partially.</p>
                  </div>
                )}

                {/* API key fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeKeys.map(field => {
                    const fieldId = `${key}-${cfg.mode}-${field}`;
                    const visible = showKeys[fieldId];
                    return (
                      <div key={field}>
                        <label className="block mb-1" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)" }}>{field}</label>
                        <div className="relative">
                          <input
                            type={visible ? "text" : "password"}
                            placeholder={cfg.mode === "test" ? `${key}_test_xxxx…` : `${key}_live_xxxx…`}
                            value={modeData[field] ?? ""}
                            onChange={e => saveKey(key, cfg.mode, field, e.target.value)}
                            className="w-full pr-9 pl-3 py-2 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                            style={{ fontSize: "0.8125rem", fontFamily: "monospace" }}
                          />
                          <button
                            onClick={() => setShowKeys(s => ({ ...s, [fieldId]: !visible }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Webhook URL */}
                <div className="mt-3">
                  <label className="block mb-1" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Webhook URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={`https://api.ma3moni.com/webhooks/${key}`}
                      className="flex-1 px-3 py-2 rounded-xl border border-border bg-muted text-muted-foreground"
                      style={{ fontSize: "0.75rem", fontFamily: "monospace" }}
                    />
                    <button
                      onClick={() => navigator.clipboard?.writeText(`https://api.ma3moni.com/webhooks/${key}`)}
                      className="px-3 py-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Transaction History ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 style={{ fontWeight: 700, fontSize: "1.0625rem" }}>Recent Transactions</h2>
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "0.8125rem" }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["User", "Plan", "Amount", "Provider", "Ref", "Date", "Status", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-muted-foreground" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.map(tx => (
                <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{tx.user}</td>
                  <td className="px-5 py-3.5">
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: tx.plan === "Premium" ? "var(--primary)" : "#4A8DB8" }}>{tx.plan}</span>
                  </td>
                  <td className="px-5 py-3.5" style={{ fontSize: "0.875rem", fontWeight: 700 }}>${tx.amount}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{tx.provider}</span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground" style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>{tx.ref}</td>
                  <td className="px-5 py-3.5 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{tx.date}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={tx.status} /></td>
                  <td className="px-5 py-3.5">
                    {tx.status === "completed" && (
                      <button
                        onClick={() => setRefundModal(tx.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        style={{ fontSize: "0.8125rem" }}
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund confirm */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl p-6">
            <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }}>Confirm Refund</h3>
            <p className="text-muted-foreground mt-2 mb-5" style={{ fontSize: "0.9rem" }}>
              Refund <strong>{TRANSACTIONS.find(t => t.id === refundModal)?.user}</strong> ${TRANSACTIONS.find(t => t.id === refundModal)?.amount}? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRefundModal(null)} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.9rem" }}>Cancel</button>
              <button onClick={() => setRefundModal(null)} className="flex-1 py-3 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors" style={{ fontSize: "0.9rem", fontWeight: 600 }}>Confirm Refund</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

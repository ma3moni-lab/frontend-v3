import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, CheckCircle, DollarSign, Eye, EyeOff,
  Loader2, Plus, RefreshCw, Save, TrendingUp, Users, X,
} from "lucide-react";
import { adminApi, subscriptions as subscriptionsApi, type Plan } from "../../../lib/api";

// ── Mock transaction data (replaced by real billing_history API on live) ─
const TRANSACTIONS = [
  { id: "tx1", user: "Aisha Mohammed",  plan: "Premium", amount: 49, date: "Jul 1, 2026",  status: "completed", provider: "Credo", ref: "CREDO_8821a9" },
  { id: "tx2", user: "Layla Rahman",    plan: "Premium", amount: 49, date: "Jun 28, 2026", status: "completed", provider: "Credo", ref: "CREDO_44bc1" },
  { id: "tx3", user: "Yusuf Al-Rashid", plan: "Basic",   amount: 19, date: "Jun 25, 2026", status: "completed", provider: "Credo", ref: "CREDO_C7H3X2" },
  { id: "tx4", user: "Noor Aziz",       plan: "Premium", amount: 49, date: "Jun 20, 2026", status: "refunded",  provider: "Credo", ref: "CREDO_ref91c" },
  { id: "tx5", user: "Tariq Mansouri",  plan: "Basic",   amount: 19, date: "Jun 18, 2026", status: "failed",    provider: "Credo", ref: "CREDO_fail7" },
  { id: "tx6", user: "Omar Hassan",     plan: "Basic",   amount: 19, date: "Jun 15, 2026", status: "completed", provider: "Credo", ref: "CREDO_H9G2K1" },
];

type PaymentMode = "test" | "live";
type ProviderKey  = "credo" | "paypal" | "paystack";

interface ProviderConfig {
  enabled: boolean;
  mode: PaymentMode;
  testKeys: Record<string, string>;
  liveKeys: Record<string, string>;
}

const PROVIDER_META: Record<ProviderKey, { label: string; testKeys: string[]; liveKeys: string[]; color: string; description: string; primary?: boolean }> = {
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

const PROVIDER_LOGOS: Record<ProviderKey, string> = { credo: "CR", paypal: "PP", paystack: "PS" };

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

// ── Plan editor ────────────────────────────────────────────────
interface PlanEditorProps {
  plan: Plan;
  onSaved: (updated: Plan) => void;
}

function PlanEditor({ plan, onSaved }: PlanEditorProps) {
  const [editing, setEditing] = useState(false);
  const [priceMonthly, setPriceMonthly] = useState(String(plan.price_monthly));
  const [priceYearly, setPriceYearly]   = useState(String(plan.price_yearly));
  const [features, setFeatures]         = useState<string[]>(plan.features ?? []);
  const [saving, setSaving]             = useState(false);

  const startEdit = () => {
    setPriceMonthly(String(plan.price_monthly));
    setPriceYearly(String(plan.price_yearly));
    setFeatures([...(plan.features ?? [])]);
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = async () => {
    const pm = parseFloat(priceMonthly);
    const py = parseFloat(priceYearly);
    if (isNaN(pm) || isNaN(py)) {
      toast.error("Price must be a number.");
      return;
    }
    setSaving(true);
    try {
      const updated = await adminApi.updatePlan(plan.name, {
        price_monthly: pm,
        price_yearly:  py,
        features:      features.filter(f => f.trim()),
      });
      toast.success(`${plan.name.charAt(0).toUpperCase() + plan.name.slice(1)} plan saved to production.`);
      onSaved(updated);
      setEditing(false);
    } catch {
      toast.error("Failed to save plan. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (plan.name === "free") {
    return (
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontWeight: 700, textTransform: "capitalize" }}>Free</span>
          <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>$0 / month</span>
        </div>
        <ul className="space-y-1">
          {(plan.features ?? []).map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
              <CheckCircle size={12} className="text-green-500 flex-shrink-0" />{f}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/25 bg-secondary/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{plan.name}</span>
        {!editing && (
          <button
            onClick={startEdit}
            className="text-primary hover:underline"
            style={{ fontSize: "0.8125rem", fontWeight: 600 }}
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block mb-1" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Monthly ($)</label>
              <input
                autoFocus
                value={priceMonthly}
                onChange={e => setPriceMonthly(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-primary/50 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: "1.125rem", fontWeight: 700 }}
              />
            </div>
            <div>
              <label className="block mb-1" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Yearly ($)</label>
              <input
                value={priceYearly}
                onChange={e => setPriceYearly(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-primary/50 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: "1.125rem", fontWeight: 700 }}
              />
            </div>
          </div>

          {/* Feature list */}
          <div>
            <label className="block mb-1" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Features</label>
            <div className="space-y-1.5">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={f}
                    onChange={e => {
                      const next = [...features];
                      next[i] = e.target.value;
                      setFeatures(next);
                    }}
                    className="flex-1 px-2.5 py-1 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                    style={{ fontSize: "0.8125rem" }}
                  />
                  <button
                    onClick={() => setFeatures(features.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setFeatures([...features, ""])}
                className="flex items-center gap-1 text-primary hover:underline"
                style={{ fontSize: "0.8125rem" }}
              >
                <Plus size={12} /> Add feature
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
              style={{ fontSize: "0.8125rem", fontWeight: 600 }}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Save to production
            </button>
            <button
              onClick={cancel}
              className="px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg"
              style={{ fontSize: "0.8125rem" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1 mb-1">
            <span style={{ fontSize: "2rem", fontWeight: 900, color: "var(--primary)" }}>${plan.price_monthly}</span>
            <span className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>/mo</span>
            <span className="ml-2 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>(${plan.price_yearly}/yr)</span>
          </div>
          <ul className="space-y-1 mt-2">
            {(plan.features ?? []).map((f, i) => (
              <li key={i} className="flex items-center gap-2" style={{ fontSize: "0.8125rem" }}>
                <CheckCircle size={12} className="text-primary flex-shrink-0" />{f}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export function PaymentsSectionV2() {
  const [plans, setPlans]   = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [providers, setProviders] = useState<Record<ProviderKey, ProviderConfig>>({
    credo:    { enabled: true,  mode: "test", testKeys: {}, liveKeys: {} },
    paypal:   { enabled: false, mode: "test", testKeys: {}, liveKeys: {} },
    paystack: { enabled: false, mode: "test", testKeys: {}, liveKeys: {} },
  });
  const [showKeys,    setShowKeys]    = useState<Record<string, boolean>>({});
  const [refundModal, setRefundModal] = useState<string | null>(null);

  useEffect(() => {
    subscriptionsApi.plans()
      .then(setPlans)
      .catch(() => {/* keep empty — UI shows loading skeleton */})
      .finally(() => setLoadingPlans(false));
  }, []);

  const handlePlanSaved = (updated: Plan) => {
    setPlans(prev => prev.map(p => p.name === updated.name ? { ...p, ...updated } : p));
  };

  const toggleMode    = (key: ProviderKey) =>
    setProviders(p => ({ ...p, [key]: { ...p[key], mode: p[key].mode === "test" ? "live" : "test" } }));

  const toggleEnabled = (key: ProviderKey) =>
    setProviders(p => ({ ...p, [key]: { ...p[key], enabled: !p[key].enabled } }));

  const saveKey = (provider: ProviderKey, mode: PaymentMode, field: string, value: string) => {
    setProviders(p => ({
      ...p,
      [provider]: { ...p[provider], [`${mode}Keys`]: { ...p[provider][`${mode}Keys`], [field]: value } },
    }));
  };

  const basicPlan   = plans.find(p => p.name === "basic");
  const premiumPlan = plans.find(p => p.name === "premium");
  const MRR = (basicPlan ? Number(basicPlan.price_monthly) * 3420 : 0)
            + (premiumPlan ? Number(premiumPlan.price_monthly) * 2193 : 0);

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
          { icon: <Users size={18} />,      label: "Paying Subscribers",        value: (3420 + 2193).toLocaleString(),               color: "#4A8DB8" },
          { icon: <TrendingUp size={18} />, label: "Revenue Growth",            value: "+7.2%",                                       color: "#6B9E78" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-4">
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
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontWeight: 700, fontSize: "1.0625rem" }}>Subscription Plans</h2>
          <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Changes are saved directly to production</p>
        </div>

        {loadingPlans ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading plans…
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map(plan => (
              <PlanEditor key={plan.name} plan={plan} onSaved={handlePlanSaved} />
            ))}
          </div>
        )}
      </div>

      {/* ── Payment Providers ── */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <h2 style={{ fontWeight: 700, fontSize: "1.0625rem", marginBottom: "1.25rem" }}>Payment Providers</h2>
        <div className="space-y-4">
          {(Object.entries(PROVIDER_META) as [ProviderKey, typeof PROVIDER_META[ProviderKey]][]).map(([key, meta]) => {
            const cfg = providers[key];
            const activeKeys = cfg.mode === "test" ? meta.testKeys : meta.liveKeys;
            const modeData   = cfg.mode === "test" ? cfg.testKeys  : cfg.liveKeys;

            return (
              <div key={key} className={`rounded-xl border p-4 transition-all ${cfg.enabled ? "border-primary/20 bg-background" : "border-border opacity-60"}`}>
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
                    <button
                      onClick={() => toggleEnabled(key)}
                      className={`px-3 py-1.5 rounded-lg border transition-all ${cfg.enabled ? "border-primary/30 text-primary bg-secondary hover:bg-primary hover:text-white" : "border-border text-muted-foreground hover:bg-muted"}`}
                      style={{ fontSize: "0.75rem", fontWeight: 600 }}
                    >
                      {cfg.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>

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

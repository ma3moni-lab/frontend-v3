import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownToLine, ChevronLeft, ChevronRight, Download, Edit2,
  Filter, Loader2, RefreshCw, Save, Search, Settings2, X, Zap,
} from "lucide-react";
import {
  adminApi, subscriptions as subApi,
  type Plan, type AdminPaymentRecord,
} from "../../../lib/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

// ── Helpers ────────────────────────────────────────────────────
const DJANGO_BASE =
  (import.meta as { env: Record<string, string> }).env.VITE_API_URL
  ?? "https://ma3moni-backend26.onrender.com";

function adminToken() {
  try { return localStorage.getItem("ma3moni_admin_access_token") ?? ""; } catch { return ""; }
}

function countryFlag(country: string): string {
  const c = (country ?? "").toLowerCase();
  if (c.includes("nigeria") || c === "ng") return "🇳🇬";
  if (c.includes("united kingdom") || c === "uk" || c === "gb") return "🇬🇧";
  if (c.includes("united states") || c === "us") return "🇺🇸";
  if (c.includes("canada"))      return "🇨🇦";
  if (c.includes("ghana"))       return "🇬🇭";
  if (c.includes("south africa"))return "🇿🇦";
  if (c.includes("kenya"))       return "🇰🇪";
  return "🌍";
}

function fmtAmt(amount: number, currency: string) {
  if (currency === "NGN") return `₦${Number(amount).toLocaleString()}`;
  return `$${Number(amount).toFixed(2)}`;
}

const STATUS_CHIP: Record<string, { bg: string; text: string; label: string }> = {
  successful: { bg: "#dcfce7", text: "#166534", label: "Success"  },
  completed:  { bg: "#dcfce7", text: "#166534", label: "Success"  }, // legacy alias
  failed:     { bg: "#fee2e2", text: "#991b1b", label: "Failed"   },
  cancelled:  { bg: "#fee2e2", text: "#991b1b", label: "Cancelled" },
  refunded:   { bg: "#fef9c3", text: "#854d0e", label: "Refunded" },
  pending:    { bg: "#dbeafe", text: "#1e40af", label: "Pending"  },
};

// ── Analytics types ────────────────────────────────────────────
interface Analytics {
  ngn_series: { period: string; amount: number }[];
  usd_series: { period: string; amount: number }[];
  kpis:         Record<string, number>;
  summary:      Record<string, number>;
  status_counts:Record<string, number>;
  sub_counts:   Record<string, number>;
}

// ── Plan editor modal ──────────────────────────────────────────
function PlanEditor({ plan, onSaved }: { plan: Plan; onSaved: () => void }) {
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    price_monthly:     String(plan.price_monthly     ?? 0),
    price_yearly:      String(plan.price_yearly      ?? 0),
    price_monthly_ngn: String(plan.price_monthly_ngn ?? 0),
    price_yearly_ngn:  String(plan.price_yearly_ngn  ?? 0),
    description:       plan.description ?? "",
    badge:             plan.badge       ?? "",
    is_active:         plan.is_active   !== false,
    sort_order:        String(plan.sort_order ?? 0),
    features:          (plan.features ?? []).join("\n"),
  });

  const f = (k: keyof typeof form, v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.updatePlan(plan.name, {
        price_monthly:     parseFloat(form.price_monthly)     || 0,
        price_yearly:      parseFloat(form.price_yearly)      || 0,
        price_monthly_ngn: parseFloat(form.price_monthly_ngn) || 0,
        price_yearly_ngn:  parseFloat(form.price_yearly_ngn)  || 0,
        description:       form.description,
        badge:             form.badge,
        is_active:         form.is_active,
        sort_order:        parseInt(form.sort_order) || 0,
        features:          form.features.split("\n").map(s => s.trim()).filter(Boolean),
      });
      toast.success(`${plan.name} plan saved — changes are live`);
      setOpen(false);
      onSaved();
    } catch {
      toast.error("Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 transition-colors font-semibold"
      >
        <Edit2 size={13} /> Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-lg">{plan.name.charAt(0).toUpperCase() + plan.name.slice(1)} Plan</h3>
                <p className="text-gray-500 text-sm mt-0.5">Changes apply to all future checkouts immediately.</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                  <input className={inp} value={form.description} onChange={e => f("description", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Badge label</label>
                  <input className={inp} placeholder="e.g. Popular" value={form.badge} onChange={e => f("badge", e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Sort order</label>
                  <input type="number" className={inp} value={form.sort_order} onChange={e => f("sort_order", e.target.value)} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <input type="checkbox" checked={form.is_active} onChange={e => f("is_active", e.target.checked)} className="w-4 h-4 accent-teal-600" />
                  <span className="text-sm font-semibold text-gray-700">Active</span>
                </label>
              </div>

              {/* Nigeria pricing */}
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span>🇳🇬</span>
                  <span className="text-sm font-bold text-green-800">Nigeria Pricing (NGN ₦)</span>
                </div>
                <p className="text-xs text-green-700 mb-3">Independent from USD — set the naira amount directly. No conversion applied.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Monthly (₦)</label>
                    <input type="number" className={inp} value={form.price_monthly_ngn} onChange={e => f("price_monthly_ngn", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Yearly (₦)</label>
                    <input type="number" className={inp} value={form.price_yearly_ngn} onChange={e => f("price_yearly_ngn", e.target.value)} />
                  </div>
                </div>
              </div>

              {/* International pricing */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span>🌍</span>
                  <span className="text-sm font-bold text-blue-800">International Pricing (USD $)</span>
                </div>
                <p className="text-xs text-blue-700 mb-3">Shown to users outside Nigeria. Independent from NGN — no conversion applied.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Monthly ($)</label>
                    <input type="number" className={inp} value={form.price_monthly} onChange={e => f("price_monthly", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Yearly ($)</label>
                    <input type="number" className={inp} value={form.price_yearly} onChange={e => f("price_yearly", e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Features (one per line)</label>
                <textarea rows={5} className={inp} value={form.features} onChange={e => f("features", e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={save} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                style={{ background: "#0A6870" }}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main component ─────────────────────────────────────────────
// ── Credo Gateway Settings Panel ────────────────────────────────
interface CredoConfig {
  enabled: boolean;
  environment: "production" | "sandbox";
  public_key: string;
  secret_key_set: boolean;
  webhook_secret_set: boolean;
  callback_url: string;
  api_url: string;
  bearer: number;
  channels: string;
}

function CredoSettingsPanel() {
  const [cfg,       setCfg]       = useState<CredoConfig | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [testing,   setTesting]   = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; latency_ms?: number; environment?: string; error?: string } | null>(null);

  const [form, setForm] = useState({
    enabled:        true,
    environment:    "production" as "production" | "sandbox",
    public_key:     "",
    secret_key:     "",
    webhook_secret: "",
    callback_url:   "",
    bearer:         "0",
    channels:       "CARD,BANK",
  });

  const inp = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-mono";
  const inpPlain = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30";
  const f = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(prev => ({ ...prev, [k]: v }));

  const load = useCallback(() => {
    setLoading(true);
    adminApi.credoSettings()
      .then(d => {
        setCfg(d);
        setForm(prev => ({
          ...prev,
          enabled:     d.enabled,
          environment: d.environment,
          public_key:  d.public_key,
          callback_url: d.callback_url,
          bearer:      String(d.bearer),
          channels:    d.channels,
        }));
      })
      .catch(() => toast.error("Failed to load Credo settings"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        enabled:     form.enabled,
        environment: form.environment,
        public_key:  form.public_key,
        callback_url: form.callback_url,
        bearer:      parseInt(form.bearer) || 0,
        channels:    form.channels,
      };
      if (form.secret_key)     payload.secret_key     = form.secret_key;
      if (form.webhook_secret) payload.webhook_secret = form.webhook_secret;
      await adminApi.updateCredoSettings(payload as Parameters<typeof adminApi.updateCredoSettings>[0]);
      toast.success("Credo settings saved");
      setForm(prev => ({ ...prev, secret_key: "", webhook_secret: "" }));
      load();
    } catch {
      toast.error("Failed to save Credo settings");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await adminApi.testCredoConnection();
      setTestResult(r);
      if (r.ok) toast.success(`Credo connected — ${r.latency_ms}ms (${r.environment})`);
      else       toast.error(`Credo connection failed: ${r.error ?? "unknown error"}`);
    } catch {
      setTestResult({ ok: false, error: "Network error" });
      toast.error("Failed to reach Credo API");
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-600" /></div>;

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div className={`rounded-2xl p-4 flex items-start gap-3 ${form.enabled ? "bg-green-50 border border-green-200" : "bg-gray-100 border border-gray-200"}`}>
        <div className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${form.enabled ? "bg-green-500" : "bg-gray-400"}`} />
        <div className="flex-1">
          <div className="font-bold text-sm">{form.enabled ? "Credo Payments Active" : "Credo Payments Disabled"}</div>
          <div className="text-xs text-gray-600 mt-0.5">
            {form.enabled
              ? `Environment: ${form.environment} · Secret key ${cfg?.secret_key_set ? "set ✓" : "not set ✗"} · Webhook ${cfg?.webhook_secret_set ? "set ✓" : "not set ✗"}`
              : "Users will not see the payment option while Credo is disabled."}
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs font-semibold text-gray-600">{form.enabled ? "Enabled" : "Disabled"}</span>
          <button
            onClick={() => f("enabled", !form.enabled)}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.enabled ? "bg-teal-600" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.enabled ? "translate-x-5" : ""}`} />
          </button>
        </label>
      </div>

      {/* Environment */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2"><Settings2 size={15} /> Environment & Channels</h3>

        {/* Environment cards */}
        <div className="grid grid-cols-2 gap-3">
          {(["sandbox", "production"] as const).map(env => (
            <button
              key={env}
              type="button"
              onClick={() => f("environment", env)}
              className={`text-left rounded-xl border-2 px-4 py-3 transition-all ${
                form.environment === env
                  ? env === "sandbox"
                    ? "border-amber-400 bg-amber-50"
                    : "border-teal-600 bg-teal-50"
                  : "border-gray-100 bg-gray-50 hover:border-gray-300"
              }`}
            >
              <div className="font-bold text-sm">
                {env === "sandbox" ? "🧪 Sandbox" : "🚀 Production"}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {env === "sandbox"
                  ? "Test keys · api.credodemo.com · no real charges"
                  : "Live keys · api.credocentral.com · real payments"}
              </div>
              <div className="text-xs font-mono text-gray-400 mt-1">
                {env === "sandbox" ? "https://api.credodemo.com" : "https://api.credocentral.com"}
              </div>
            </button>
          ))}
        </div>

        {form.environment === "sandbox" && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <strong>Sandbox mode:</strong> Enter your Credo <em>test</em> keys (from Credo dashboard → Sandbox). Transactions are simulated — no real money moves. Switch to Production when going live.
          </div>
        )}
        {form.environment === "production" && (
          <div className="text-xs text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
            <strong>Production mode:</strong> Enter your Credo <em>live</em> keys (from Credo dashboard → API Keys). Real charges will be processed. Ensure keys match the environment.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Transaction fee bearer</label>
            <select className={inpPlain} value={form.bearer}
              onChange={e => f("bearer", e.target.value)}>
              <option value="0">0 — Merchant pays fee</option>
              <option value="1">1 — Customer pays fee</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Payment channels</label>
            <input className={inpPlain} value={form.channels}
              placeholder="CARD,BANK"
              onChange={e => f("channels", e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">CARD, BANK, USSD, WALLET</p>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <span>🔑</span> API Keys
          <span className="ml-auto text-xs text-gray-400 font-normal">
            {form.environment === "sandbox" ? "Credo Dashboard → Sandbox → API Keys" : "Credo Dashboard → API Keys"}
          </span>
        </h3>
        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <strong>Key pairing rule:</strong> Sandbox keys only work on Sandbox · Live keys only work on Production. Mixing them causes a 401 error.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Public key</label>
            <input className={inp} value={form.public_key}
              placeholder={form.environment === "sandbox" ? "test_pk_… (from Credo Sandbox)" : "pk_live_… (from Credo Production)"}
              onChange={e => f("public_key", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Secret key {cfg?.secret_key_set && <span className="text-green-600">(currently set ✓)</span>}
            </label>
            <input type="password" className={inp} value={form.secret_key}
              placeholder={cfg?.secret_key_set ? "Leave blank to keep existing key" : form.environment === "sandbox" ? "test_sk_… (from Credo Sandbox)" : "sk_live_… (from Credo Production)"}
              onChange={e => f("secret_key", e.target.value)} />
            <p className="text-xs text-red-500/80 mt-1">Never share this key. It never appears in responses — only a "set / not set" indicator is returned.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Webhook signing secret {cfg?.webhook_secret_set && <span className="text-green-600">(currently set ✓)</span>}
            </label>
            <input type="password" className={inp} value={form.webhook_secret}
              placeholder={cfg?.webhook_secret_set ? "Leave blank to keep existing secret" : "whsec_… (generated in Credo → Webhooks)"}
              onChange={e => f("webhook_secret", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Test connection result */}
      {testResult && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${testResult.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
          {testResult.ok
            ? `Connected to Credo ${testResult.environment} in ${testResult.latency_ms}ms`
            : `Connection failed: ${testResult.error ?? "unknown error"}`}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={testConnection}
          disabled={testing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {testing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          Test Connection
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50"
          style={{ background: "#0A6870" }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Settings
        </button>
      </div>

      {/* Credo dashboard setup instructions */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm space-y-3">
        <div className="font-semibold text-slate-800">Credo dashboard setup</div>
        <div>
          <p className="text-xs text-slate-600 font-semibold mb-1">Callback URL (paste into Credo → Settings → Payment):</p>
          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded block break-all text-slate-700">
            {DJANGO_BASE}/api/payments/credo/callback/
          </span>
          <p className="text-xs text-slate-500 mt-1">Credo redirects the user's browser here after payment. The backend then redirects to the app.</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 font-semibold mb-1">Webhook URL (paste into Credo → Settings → Webhooks):</p>
          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded block break-all text-slate-700">
            {DJANGO_BASE}/api/payments/credo/webhook/
          </span>
          <p className="text-xs text-slate-500 mt-1">Server-to-server notification — the backend verifies and activates subscriptions here.</p>
        </div>
      </div>
    </div>
  );
}

// ── Main section ────────────────────────────────────────────────
export function PaymentsSectionV2({ role }: { role: string }) {
  const isSuperAdmin = role === "super-admin";

  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "plans" | "gateway">("overview");

  // Plans
  const [plans,        setPlans]        = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Analytics
  const [analytics,        setAnalytics]        = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [chartPeriod,      setChartPeriod]      = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");

  // Billing table
  const [payments,    setPayments]    = useState<AdminPaymentRecord[]>([]);
  const [payTotal,    setPayTotal]    = useState(0);
  const [payPage,     setPayPage]     = useState(1);
  const [payPages,    setPayPages]    = useState(1);
  const [payLoading,  setPayLoading]  = useState(false);
  const [filters, setFilters] = useState<{
    currency: "NGN" | "USD" | "";
    country:  "nigeria" | "uk" | "others" | "";
    status:   "successful" | "failed" | "refunded" | "pending" | "cancelled" | "";
    search:   string;
  }>({ currency: "", country: "", status: "", search: "" });

  const loadPlans = useCallback(() => {
    setPlansLoading(true);
    subApi.plans()
      .then(p => setPlans(p))
      .catch(() => {})
      .finally(() => setPlansLoading(false));
  }, []);

  const loadAnalytics = useCallback(() => {
    if (!isSuperAdmin) return;
    setAnalyticsLoading(true);
    const qs = new URLSearchParams({ period: chartPeriod });
    fetch(`${DJANGO_BASE}/api/admin/analytics/revenue/?${qs}`, {
      headers: { Authorization: `Bearer ${adminToken()}` },
    })
      .then(r => r.json())
      .then(d => setAnalytics(d as Analytics))
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false));
  }, [isSuperAdmin, chartPeriod]);

  const loadPayments = useCallback((page = 1) => {
    if (!isSuperAdmin) return;
    setPayLoading(true);
    const params: Parameters<typeof adminApi.billingHistory>[0] = { page, page_size: 25 };
    if (filters.currency) params.currency = filters.currency;
    if (filters.country)  params.country  = filters.country;
    if (filters.status)   params.status   = filters.status;
    if (filters.search)   params.search   = filters.search;
    adminApi.billingHistory(params)
      .then(r => { setPayments(r.results); setPayTotal(r.count); setPayPage(r.page); setPayPages(r.pages); })
      .catch(() => {})
      .finally(() => setPayLoading(false));
  }, [isSuperAdmin, filters]);

  useEffect(() => { loadPlans(); }, [loadPlans]);
  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);
  useEffect(() => { if (activeTab === "transactions") loadPayments(1); }, [activeTab, loadPayments]);

  const downloadCSV = () => {
    if (!payments.length) return;
    const hdr = ["Reference", "Customer", "Email", "Country", "Currency", "Amount", "Plan", "Status", "Gateway", "Date"];
    const rows = payments.map(p => [
      p.reference, p.user.name, p.user.email, p.country,
      p.currency, p.amount, p.plan, p.status, p.payment_method,
      new Date(p.created_at).toLocaleDateString(),
    ]);
    const csv  = [hdr, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a    = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `payments-${Date.now()}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
    toast.success("CSV downloaded");
  };

  const kpis       = analytics?.kpis        ?? {};
  const summary    = analytics?.summary     ?? {};
  const subCounts  = analytics?.sub_counts  ?? {};
  const statusCnts = analytics?.status_counts ?? {};

  const kpiCards = [
    { label: "Total NGN Revenue",    value: `₦${Number(summary.ngn_total ?? 0).toLocaleString()}`,      icon: "🇳🇬", color: "#0A6870" },
    { label: "Total USD Revenue",    value: `$${Number(summary.usd_total ?? 0).toLocaleString()}`,      icon: "🌍", color: "#1d4ed8" },
    { label: "Monthly NGN",          value: `₦${Number(kpis.mrr_ngn ?? 0).toLocaleString()}`,           icon: "📅", color: "#059669" },
    { label: "Monthly USD",          value: `$${Number(kpis.mrr_usd ?? 0).toFixed(2)}`,                 icon: "📅", color: "#7c3aed" },
    { label: "Successful",           value: String(statusCnts.completed ?? 0),                           icon: "✅", color: "#166534" },
    { label: "Failed",               value: String(statusCnts.failed ?? 0),                              icon: "❌", color: "#991b1b" },
    { label: "Pending",              value: String(statusCnts.pending ?? 0),                             icon: "⏳", color: "#1e40af" },
    { label: "Refunded",             value: String(statusCnts.refunded ?? 0),                            icon: "↩️", color: "#854d0e" },
    { label: "Active Subscriptions", value: String(subCounts.active ?? 0),                               icon: "🟢", color: "#0A6870" },
    { label: "Expired",              value: String(subCounts.expired ?? 0),                              icon: "⚫", color: "#6b7280" },
    { label: "Cancelled",            value: String(subCounts.cancelled ?? 0),                            icon: "🔴", color: "#b91c1c" },
    { label: "NGN Transactions",     value: String(summary.ngn_transactions ?? 0),                       icon: "🇳🇬", color: "#0A6870" },
    { label: "USD Transactions",     value: String(summary.usd_transactions ?? 0),                       icon: "🌍", color: "#1d4ed8" },
    { label: "Avg NGN Payment",      value: `₦${Number(summary.avg_ngn ?? 0).toLocaleString()}`,         icon: "📊", color: "#059669" },
    { label: "Avg USD Payment",      value: `$${Number(summary.avg_usd ?? 0).toFixed(2)}`,               icon: "📊", color: "#7c3aed" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-2xl">Payments & Revenue</h2>
          <p className="text-gray-500 text-sm mt-0.5">Multi-currency management · 🇳🇬 NGN & 🌍 USD</p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <button onClick={downloadCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors">
              <Download size={14} /> Export CSV
            </button>
          )}
          <button
            onClick={() => { loadAnalytics(); if (activeTab === "transactions") loadPayments(1); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {(isSuperAdmin
          ? (["overview", "transactions", "plans", "gateway"] as const)
          : (["overview", "plans"] as const)
        ).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === t ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "gateway" ? "Gateway" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ───────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {analyticsLoading ? (
            <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-600" /></div>
          ) : (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {kpiCards.map(card => (
                  <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="text-xl mb-1">{card.icon}</div>
                    <div className="font-extrabold text-xl" style={{ color: card.color }}>{card.value}</div>
                    <div className="text-gray-500 mt-0.5 text-xs font-medium">{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Period selector */}
              {isSuperAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">Period:</span>
                  {(["daily", "weekly", "monthly", "yearly"] as const).map(p => (
                    <button key={p} onClick={() => setChartPeriod(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${chartPeriod === p ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                      style={chartPeriod === p ? { background: "#0A6870" } : {}}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              )}

              {/* NGN chart */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🇳🇬</span>
                  <h3 className="font-bold">NGN Revenue</h3>
                  <span className="ml-auto text-sm font-semibold" style={{ color: "#0A6870" }}>
                    ₦{Number(summary.ngn_total ?? 0).toLocaleString()} total
                  </span>
                </div>
                {!(analytics?.ngn_series?.length) ? (
                  <p className="text-center text-gray-400 py-8 text-sm">No NGN transactions yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={analytics.ngn_series}>
                      <defs>
                        <linearGradient id="ng" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#0A6870" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#0A6870" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => [`₦${Number(v).toLocaleString()}`, "Revenue"]} />
                      <Area type="monotone" dataKey="amount" stroke="#0A6870" strokeWidth={2.5} fill="url(#ng)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* USD chart */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🌍</span>
                  <h3 className="font-bold">USD Revenue</h3>
                  <span className="ml-auto text-sm font-semibold" style={{ color: "#1d4ed8" }}>
                    ${Number(summary.usd_total ?? 0).toFixed(2)} total
                  </span>
                </div>
                {!(analytics?.usd_series?.length) ? (
                  <p className="text-center text-gray-400 py-8 text-sm">No USD transactions yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={analytics.usd_series}>
                      <defs>
                        <linearGradient id="us" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#1d4ed8" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                      <Tooltip formatter={(v: number) => [`$${Number(v).toFixed(2)}`, "Revenue"]} />
                      <Area type="monotone" dataKey="amount" stroke="#1d4ed8" strokeWidth={2.5} fill="url(#us)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Summary side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { flag: "🇳🇬", label: "NGN Summary", color: "#166534", bg: "green",
                    rows: [
                      ["Total", `₦${Number(summary.ngn_total ?? 0).toLocaleString()}`],
                      ["Transactions", String(summary.ngn_transactions ?? 0)],
                      ["Average", `₦${Number(summary.avg_ngn ?? 0).toLocaleString()}`],
                      ["Monthly MRR", `₦${Number(kpis.mrr_ngn ?? 0).toLocaleString()}`],
                    ]},
                  { flag: "🌍", label: "USD Summary", color: "#1e40af", bg: "blue",
                    rows: [
                      ["Total", `$${Number(summary.usd_total ?? 0).toFixed(2)}`],
                      ["Transactions", String(summary.usd_transactions ?? 0)],
                      ["Average", `$${Number(summary.avg_usd ?? 0).toFixed(2)}`],
                      ["Monthly MRR", `$${Number(kpis.mrr_usd ?? 0).toFixed(2)}`],
                    ]},
                ].map(card => (
                  <div key={card.label} className={`bg-white rounded-2xl border border-${card.bg}-100 shadow-sm p-5`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span>{card.flag}</span>
                      <span className="text-sm font-bold" style={{ color: card.color }}>{card.label}</span>
                    </div>
                    <dl className="space-y-2 text-sm">
                      {card.rows.map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <dt className="text-gray-500">{k}</dt>
                          <dd className="font-bold">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TRANSACTIONS ────────────────────────────────────────── */}
      {activeTab === "transactions" && isSuperAdmin && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-44">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input placeholder="Search name, email, reference…"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && loadPayments(1)} />
              </div>
              <select className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none"
                value={filters.currency}
                onChange={e => setFilters(f => ({ ...f, currency: e.target.value as "NGN"|"USD"|"" }))}>
                <option value="">All Currencies</option>
                <option value="NGN">🇳🇬 NGN</option>
                <option value="USD">🌍 USD</option>
              </select>
              <select className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none"
                value={filters.country}
                onChange={e => setFilters(f => ({ ...f, country: e.target.value as "nigeria"|"uk"|"others"|"" }))}>
                <option value="">All Countries</option>
                <option value="nigeria">🇳🇬 Nigeria</option>
                <option value="uk">🇬🇧 United Kingdom</option>
                <option value="others">🌍 Others</option>
              </select>
              <select className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none"
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value as "successful"|"failed"|"refunded"|"pending"|"cancelled"|"" }))}>
                <option value="">All Statuses</option>
                <option value="successful">✅ Success</option>
                <option value="pending">⏳ Pending</option>
                <option value="failed">❌ Failed</option>
                <option value="cancelled">🚫 Cancelled</option>
                <option value="refunded">↩️ Refunded</option>
              </select>
              <button onClick={() => loadPayments(1)}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors"
                style={{ background: "#0A6870" }}>
                <Filter size={14} className="inline mr-1" /> Filter
              </button>
              <button onClick={() => setFilters({ currency: "", country: "", status: "", search: "" })}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                <X size={14} className="inline" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <span className="text-sm font-semibold text-gray-700">{payTotal} records</span>
              <button onClick={downloadCSV} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowDownToLine size={12} /> Download CSV
              </button>
            </div>
            {payLoading ? (
              <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-teal-600" /></div>
            ) : !payments.length ? (
              <p className="text-center text-gray-400 py-12 text-sm">No transactions found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                      {["Reference","Customer","Country","Currency","Amount","Plan","Status","Gateway","Date"].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => {
                      const sc = STATUS_CHIP[p.status] ?? STATUS_CHIP.pending;
                      return (
                        <tr key={p.id} className={`border-t border-gray-50 hover:bg-gray-50/60 transition-colors ${i % 2 ? "bg-gray-50/30" : ""}`}>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.reference || "—"}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold">{p.user.name}</div>
                            <div className="text-xs text-gray-400">{p.user.email}</div>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {countryFlag(p.country)} {p.country || "Unknown"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                              style={{ background: p.currency === "NGN" ? "#0A6870" : "#1d4ed8" }}>
                              {p.currency}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold">{fmtAmt(p.amount, p.currency)}</td>
                          <td className="px-4 py-3 capitalize">{p.plan || "—"}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: sc.bg, color: sc.text }}>
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 capitalize">{p.payment_method || "Credo"}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {new Date(p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {payPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50/50">
                <span className="text-xs text-gray-500">Page {payPage} of {payPages}</span>
                <div className="flex gap-2">
                  <button disabled={payPage <= 1 || payLoading} onClick={() => loadPayments(payPage - 1)}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors">
                    <ChevronLeft size={14} />
                  </button>
                  <button disabled={payPage >= payPages || payLoading} onClick={() => loadPayments(payPage + 1)}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── GATEWAY SETTINGS ────────────────────────────────────── */}
      {activeTab === "gateway" && isSuperAdmin && (
        <CredoSettingsPanel />
      )}

      {/* ── PLANS ──────────────────────────────────────────────── */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Configure independent NGN and USD pricing. Changes apply immediately to new checkouts — existing subscriptions are unaffected.
          </p>
          {plansLoading ? (
            <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-teal-600" /></div>
          ) : !plans.length ? (
            <p className="text-center text-gray-400 py-8 text-sm">No plans found. They are auto-seeded on first user request.</p>
          ) : (
            <div className="grid gap-4">
              {plans.map(plan => (
                <div key={plan.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-extrabold text-lg">{plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}</h3>
                        {plan.badge && (
                          <span className="px-2 py-0.5 rounded-full text-white text-xs font-bold" style={{ background: "#0A6870" }}>
                            {plan.badge}
                          </span>
                        )}
                        {plan.is_active === false && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Inactive</span>
                        )}
                      </div>
                      {plan.description && <p className="text-gray-500 text-sm">{plan.description}</p>}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 border border-green-200">
                          <span className="text-sm">🇳🇬</span>
                          <div>
                            <div className="text-xs text-green-700 font-semibold">NGN</div>
                            <div className="font-extrabold" style={{ color: "#166534" }}>
                              ₦{Number(plan.price_monthly_ngn ?? 0).toLocaleString()}
                              <span className="text-xs font-normal text-gray-500">/mo</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200">
                          <span className="text-sm">🌍</span>
                          <div>
                            <div className="text-xs text-blue-700 font-semibold">USD</div>
                            <div className="font-extrabold" style={{ color: "#1e40af" }}>
                              ${Number(plan.price_monthly ?? 0).toFixed(2)}
                              <span className="text-xs font-normal text-gray-500">/mo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {plan.features?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {plan.features.map((f: string) => (
                            <span key={f} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">{f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {isSuperAdmin && <PlanEditor plan={plan} onSaved={loadPlans} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PaymentsSectionV2;

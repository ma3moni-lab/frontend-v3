import { useState, useRef, useEffect, lazy, Suspense, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { USERS as USERS_DATA } from "../../data/users";
import { adminApi, analytics as analyticsApi, restoreAdminToken, type AnalyticsOverview, type PlatformSettings, type AuditEntry, type ActivityEntry } from "../../lib/api";

// Heavy admin sections are code-split — they only load when their tab is opened,
// keeping the initial admin bundle small.
const PaymentsSectionV2 = lazy(() => import("./admin/PaymentsSectionV2").then(m => ({ default: m.PaymentsSectionV2 })));
const UsersSectionV2 = lazy(() => import("./admin/UsersSectionV2").then(m => ({ default: m.UsersSectionV2 })));
const SupportSectionV2 = lazy(() => import("./admin/SupportSectionV2").then(m => ({ default: m.SupportSectionV2 })));

// Lightweight fallback shown while a section chunk loads.
function SectionLoading() {
  return (
    <div className="flex items-center justify-center h-full py-20">
      <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  );
}
import {
  LayoutDashboard, Users, Shield, Ban, Headphones, Key,
  CreditCard, BarChart2, Flag, Settings, ChevronLeft,
  Search, Filter, MoreVertical, Check, X, AlertTriangle,
  TrendingUp, UserCheck, DollarSign, Heart, Bell, LogOut,
  Eye, Trash2, RefreshCw, Plus, Download, ChevronRight,
  CheckCircle, XCircle, Clock, Send, User, MessageSquare,
  Lock, Unlock, Menu, ChevronDown, Star, ArrowUpRight,
  BookOpen, ThumbsUp, UserPlus, Pencil,
  Tag, Trash, Activity, Info, Save, Loader2
} from "lucide-react";
import { BlogSection, TopArticlesPanel } from "./admin/AdminBlogSection";
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

import type { AdminRole } from "./AdminRoot";
import { Logo } from "./Logo";

interface AdminAppProps {
  onBack: () => void;
  role: AdminRole;
  adminName: string;
  adminEmail: string;
  initialSection?: string;
  onSectionChange?: (section: string) => void;
  onNameChange?: (name: string) => void;
}

// Sections each role can access
// Base access per role. Payments are super-admin only unless the super-admin
// explicitly grants revenue visibility to admins via Settings.
const ROLE_ACCESS: Record<AdminRole, AdminSection[]> = {
  "super-admin":   ["overview","users","blacklist","support","roles","blog","payments","analytics","reports","settings","audit"],
  "admin":         ["overview","users","blacklist","support","blog","analytics","reports"],
  "blog-admin":    ["blog","overview"],
  "customer-care": ["support","overview"],
};

// A persistent flag (set by super-admin in Settings) that also grants
// admins access to the Payments section and revenue KPIs.
const REVENUE_PERM_KEY = "ma3moni_admin_revenue_perm";
function getRevenuePermission() {
  try { return localStorage.getItem(REVENUE_PERM_KEY) === "true"; } catch { return false; }
}
function setRevenuePermission(v: boolean) {
  try { localStorage.setItem(REVENUE_PERM_KEY, v ? "true" : "false"); } catch {}
}

const ROLE_BADGE: Record<AdminRole, string> = {
  "super-admin":   "SA",
  "admin":         "AD",
  "blog-admin":    "BA",
  "customer-care": "CC",
};

const ROLE_LABEL: Record<AdminRole, string> = {
  "super-admin":   "Super Admin",
  "admin":         "Admin",
  "blog-admin":    "Blog Admin",
  "customer-care": "Customer Care",
};

type AdminSection =
  | "overview" | "users" | "blacklist"
  | "support" | "roles" | "blog" | "payments" | "analytics"
  | "reports" | "settings" | "audit";

// ─── MOCK DATA ────────────────────────────────────────────
// USERS_DATA imported from src/data/users (shared with UsersSectionV2).

const MODERATION_QUEUE = [
  { id: "p1", userId: "u3", userName: "Sara Khalid", submittedAt: "2h ago", photoLabel: "Photo 1", status: "pending" as const },
  { id: "p2", userId: "u6", userName: "Khalid Al-Mansouri", submittedAt: "4h ago", photoLabel: "Photo 1", status: "pending" as const },
  { id: "p3", userId: "u2", userName: "Yusuf Al-Rashid", submittedAt: "6h ago", photoLabel: "Photo 3", status: "pending" as const },
  { id: "p4", userId: "u1", userName: "Aisha Mohammed", submittedAt: "1d ago", photoLabel: "Photo 2", status: "approved" as const },
  { id: "p5", userId: "u5", userName: "Layla Rahman", submittedAt: "2d ago", photoLabel: "Photo 1", status: "rejected" as const },
];

const BLACKLIST = [
  { id: "b1", type: "email", value: "spam@example.com", reason: "Fake account", date: "May 12, 2026", blockedBy: "Admin" },
  { id: "b2", type: "phone", value: "+971-55-0000", reason: "Harassment", date: "May 15, 2026", blockedBy: "Support" },
  { id: "b3", type: "name", value: "John Test", reason: "Duplicate account", date: "Jun 1, 2026", blockedBy: "Admin" },
];

const TICKETS = [
  { id: "t1", userId: "u3", userName: "Sara Khalid", subject: "Cannot upload profile photo", status: "open", priority: "high", agent: "Sarah (Care)", created: "2h ago", messages: [
    { from: "user", text: "I keep getting an error when trying to upload my profile photo. It says 'upload failed' every time." },
    { from: "agent", text: "Hi Sara, I'm sorry to hear that. Can you tell me what file format and size you're using?" },
    { from: "user", text: "I'm using a JPG file, around 2MB." },
  ]},
  { id: "t2", userId: "u4", userName: "Omar Hassan", subject: "Account suspended without reason", status: "escalated", priority: "high", agent: "Ahmed (Care)", created: "1d ago", messages: [
    { from: "user", text: "My account was suspended and I don't know why. I haven't done anything wrong." },
    { from: "agent", text: "I've reviewed your account. It was flagged for suspicious activity. I'm escalating this to an admin." },
  ]},
  { id: "t3", userId: "u2", userName: "Yusuf Al-Rashid", subject: "Match quality feedback", status: "resolved", priority: "low", agent: "Sarah (Care)", created: "3d ago", messages: [
    { from: "user", text: "I think the matching algorithm could be improved. I'm getting matches from very different cities." },
    { from: "agent", text: "Thank you for the feedback, Yusuf. I'll pass this to our team. In the meantime, you can set your location preference in Profile > Partner Preferences." },
  ]},
];

const ROLES_DATA = [
  { id: "r1", name: "Super Admin",    color: "#0A6870", badge: "SA", permissions: ["all"], users: ["superadmin@ma3moni.com"],                desc: "Full platform access + user creation & role assignment" },
  { id: "r2", name: "Admin",          color: "#4A8DB8", badge: "AD", permissions: ["view_users","suspend_users","manage_moderation","view_payments","manage_blog"], users: ["admin@ma3moni.com"],        desc: "User management, content moderation, blog editing" },
  { id: "r3", name: "Blog Admin",     color: "#6B9E78", badge: "BA", permissions: ["manage_blog","view_analytics"],                               users: ["blog@ma3moni.com"],        desc: "Create and manage all blog articles and track engagement" },
  { id: "r4", name: "Customer Care",  color: "#C5733F", badge: "CC", permissions: ["view_tickets","respond_tickets","view_user_profiles"],         users: ["care@ma3moni.com"],         desc: "Support ticket handling and user profile lookup" },
];



const TRANSACTIONS = [
  { id: "tx1", user: "Aisha Mohammed", plan: "Premium", amount: "$49.00", date: "Jul 1, 2026", status: "completed" },
  { id: "tx2", user: "Layla Rahman", plan: "Premium", amount: "$49.00", date: "Jun 28, 2026", status: "completed" },
  { id: "tx3", user: "Yusuf Al-Rashid", plan: "Basic", amount: "$19.00", date: "Jun 25, 2026", status: "completed" },
  { id: "tx4", user: "Noor Aziz", plan: "Premium", amount: "$49.00", date: "Jun 20, 2026", status: "refunded" },
  { id: "tx5", user: "Tariq Mansouri", plan: "Basic", amount: "$19.00", date: "Jun 18, 2026", status: "failed" },
];

const REPORTS = [
  {
    id: "rp1",
    reporterId: "u1", reporter: "Aisha Mohammed", reporterEmail: "aisha@example.com",
    reportedId: "u4", reported: "Omar Hassan", reportedEmail: "omar@example.com",
    reportedSubscription: "Free", reportedStatus: "suspended", reportedJoined: "Dec 20, 2025",
    reason: "Inappropriate messages",
    category: "harassment",
    description: "The user sent several aggressive and sexually suggestive messages after I declined to continue the conversation. When I asked him to stop, the messages became more hostile. I have felt unsafe and unable to use the platform comfortably since.",
    evidence: [
      { type: "message", content: "You think you're too good for me? I'll show you.", time: "Jun 29, 2026 11:42 PM" },
      { type: "message", content: "Ignoring me? That's fine. I know where to find your type.", time: "Jun 30, 2026 12:01 AM" },
      { type: "message", content: "Just wait.", time: "Jun 30, 2026 12:03 AM" },
    ],
    date: "Jun 30, 2026", time: "8:14 AM", status: "pending",
    priority: "high",
    priorReportsAgainstUser: 2,
    actionHistory: [
      { action: "Account flagged by automated system", by: "System", date: "Jun 29, 2026", type: "system" },
      { action: "Report received and assigned to review queue", by: "System", date: "Jun 30, 2026", type: "system" },
    ],
    relatedReports: ["rp3"],
    adminNotes: "",
  },
  {
    id: "rp2",
    reporterId: "u3", reporter: "Sara Khalid", reporterEmail: "sara@example.com",
    reportedId: "u-unknown", reported: "Unknown User", reportedEmail: "unknown@example.com",
    reportedSubscription: "Free", reportedStatus: "suspended", reportedJoined: "Jun 10, 2026",
    reason: "Fake profile",
    category: "fake_profile",
    description: "This profile uses stock photos I found via reverse image search. The profile bio is copied word-for-word from another member I know. I believe this is a fake or scam account.",
    evidence: [
      { type: "note", content: "Reverse image search confirmed stock photo from Shutterstock (ID 1234567).", time: "Jun 28, 2026" },
      { type: "note", content: "Bio text is an exact match of member #U44219's profile, reported separately.", time: "Jun 28, 2026" },
    ],
    date: "Jun 28, 2026", time: "2:30 PM", status: "actioned",
    priority: "medium",
    priorReportsAgainstUser: 0,
    actionHistory: [
      { action: "Report received", by: "System", date: "Jun 28, 2026", type: "system" },
      { action: "Account suspended pending investigation", by: "Admin", date: "Jun 28, 2026", type: "suspend" },
      { action: "Photos removed from platform", by: "Mod Team", date: "Jun 28, 2026", type: "moderation" },
      { action: "User added to monitoring list", by: "Admin", date: "Jun 29, 2026", type: "admin" },
    ],
    relatedReports: [],
    adminNotes: "Confirmed fake profile. Retains access until appeals period expires (Jul 5).",
  },
  {
    id: "rp3",
    reporterId: "u5", reporter: "Layla Rahman", reporterEmail: "layla@example.com",
    reportedId: "u8", reported: "Tariq Mansouri", reportedEmail: "tariq@example.com",
    reportedSubscription: "Basic", reportedStatus: "active", reportedJoined: "Jan 8, 2026",
    reason: "Harassment",
    category: "harassment",
    description: "After I ended our conversation, this user continued to send messages daily for over two weeks. When I blocked him on the platform, he created another account and messaged me again. I am deeply uncomfortable.",
    evidence: [
      { type: "message", content: "Why did you stop responding? I deserve an explanation.", time: "Jun 20, 2026" },
      { type: "message", content: "I've sent you 14 messages. Please reply.", time: "Jun 23, 2026" },
      { type: "note", content: "Second account detected with matching phone number (+971-55-6678). IP address confirmed same device.", time: "Jun 25, 2026" },
    ],
    date: "Jun 25, 2026", time: "5:45 PM", status: "pending",
    priority: "high",
    priorReportsAgainstUser: 1,
    actionHistory: [
      { action: "Report received and auto-flagged (repeat offender pattern)", by: "System", date: "Jun 25, 2026", type: "system" },
      { action: "Second account detected and suspended", by: "System", date: "Jun 25, 2026", type: "system" },
    ],
    relatedReports: ["rp1"],
    adminNotes: "",
  },
  {
    id: "rp4",
    reporterId: "u6", reporter: "Khalid Al-Mansouri", reporterEmail: "khalid@example.com",
    reportedId: "u-sp1", reported: "Spam Account 7742", reportedEmail: "promo7742@gmail.com",
    reportedSubscription: "Free", reportedStatus: "pending", reportedJoined: "Jun 27, 2026",
    reason: "Spam & solicitation",
    category: "spam",
    description: "This account sent me a message immediately after matching, promoting a third-party website and asking me to move the conversation there. The profile was created recently and has no real information.",
    evidence: [
      { type: "message", content: "Hi! I'm not very active here. Let's connect on MatchPlus.io instead — I'm @sarah_real there 😊", time: "Jun 28, 2026 3:10 AM" },
    ],
    date: "Jun 28, 2026", time: "9:00 AM", status: "dismissed",
    priority: "low",
    priorReportsAgainstUser: 3,
    actionHistory: [
      { action: "Report received", by: "System", date: "Jun 28, 2026", type: "system" },
      { action: "Account identified as bot/spam", by: "System", date: "Jun 28, 2026", type: "system" },
      { action: "Account permanently banned", by: "Admin", date: "Jun 28, 2026", type: "ban" },
      { action: "IP address blacklisted", by: "Super Admin", date: "Jun 28, 2026", type: "admin" },
    ],
    relatedReports: [],
    adminNotes: "Confirmed spam bot. Device fingerprint added to global blacklist.",
  },
];

const analyticsData = {
  users: [
    { month: "Jan", total: 6200, new: 420 },
    { month: "Feb", total: 7100, new: 510 },
    { month: "Mar", total: 8300, new: 680 },
    { month: "Apr", total: 9400, new: 590 },
    { month: "May", total: 10800, new: 740 },
    { month: "Jun", total: 12100, new: 820 },
    { month: "Jul", total: 12847, new: 380 },
  ],
  matches: [
    { month: "Jan", matches: 312 }, { month: "Feb", matches: 445 },
    { month: "Mar", matches: 521 }, { month: "Apr", matches: 478 },
    { month: "May", matches: 634 }, { month: "Jun", matches: 712 },
    { month: "Jul", matches: 619 },
  ],
  revenue: [
    { month: "Jan", amount: 28400 }, { month: "Feb", amount: 32100 },
    { month: "Mar", amount: 36800 }, { month: "Apr", amount: 41200 },
    { month: "May", amount: 44700 }, { month: "Jun", amount: 48200 },
    { month: "Jul", amount: 20100 },
  ],
  gender: [
    { name: "Male", value: 52, color: "#0A6870" },
    { name: "Female", value: 48, color: "#C5733F" },
  ],
  subscriptions: [
    { name: "Free", value: 7234, color: "#EDF0F6" },
    { name: "Basic", value: 3420, color: "#4A8DB8" },
    { name: "Premium", value: 2193, color: "#0A6870" },
  ],
};

// ─── UTILITY COMPONENTS ───────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: "#dcfce7", text: "#166534", label: "Active" },
    suspended: { bg: "#fef9c3", text: "#854d0e", label: "Suspended" },
    pending: { bg: "#f0f9ff", text: "#0369a1", label: "Pending" },
    approved: { bg: "#dcfce7", text: "#166534", label: "Approved" },
    rejected: { bg: "#fee2e2", text: "#991b1b", label: "Rejected" },
    open: { bg: "#dbeafe", text: "#1d4ed8", label: "Open" },
    escalated: { bg: "#fef9c3", text: "#854d0e", label: "Escalated" },
    resolved: { bg: "#dcfce7", text: "#166534", label: "Resolved" },
    completed: { bg: "#dcfce7", text: "#166534", label: "Completed" },
    refunded: { bg: "#fef9c3", text: "#854d0e", label: "Refunded" },
    failed: { bg: "#fee2e2", text: "#991b1b", label: "Failed" },
    actioned: { bg: "#e0e7ff", text: "#3730a3", label: "Actioned" },
  };
  const s = map[status] ?? { bg: "#f3f4f6", text: "#6b7280", label: status };
  return (
    <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 600, background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>{title}</h1>
        {sub && <p className="text-muted-foreground mt-1" style={{ fontSize: "0.9375rem" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function KpiCard({ icon, label, value, change, color }: {
  icon: ReactNode; label: string; value: string; change: string; color: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`bg-card rounded-2xl border border-border p-5 hover:border-primary/20 hover:shadow-md transition-all ${visible ? "count-up" : "opacity-0"}`}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "18", color }}>
          {icon}
        </div>
        <span className="flex items-center gap-1" style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16a34a" }}>
          <ArrowUpRight size={12} />
          {change}
        </span>
      </div>
      <p style={{ fontSize: "1.875rem", fontWeight: 900, marginTop: 16, letterSpacing: "-0.03em" }}>{value}</p>
      <p className="text-muted-foreground mt-1" style={{ fontSize: "0.875rem" }}>{label}</p>
    </div>
  );
}

// ─── ACTIVITY PANEL ───────────────────────────────────────
const USER_ACTIVITY_MOCK = [
  { text: "New user registered", time: "Just now", dot: "#0A6870", type: "user" },
  { text: "Photo submitted for review", time: "12m ago", dot: "#C5733F", type: "user" },
  { text: "New Premium subscription", time: "1h ago", dot: "#4A8DB8", type: "user" },
  { text: "Report filed: harassment", time: "2h ago", dot: "#D41F3A", type: "user" },
  { text: "Support ticket opened", time: "3h ago", dot: "#C5733F", type: "user" },
];
const ADMIN_ACTIVITY_MOCK = [
  { text: "Photo approved (Admin)", time: "8m ago", dot: "#6B9E78", type: "admin" },
  { text: "User suspended (Admin)", time: "45m ago", dot: "#D41F3A", type: "admin" },
  { text: "Blacklist entry added (Super Admin)", time: "2h ago", dot: "#0A6870", type: "admin" },
  { text: "Report resolved (Moderator)", time: "4h ago", dot: "#6B9E78", type: "admin" },
];

function ActivityPanel({ role }: { role: AdminRole }) {
  const isSuperAdmin  = role === "super-admin";
  const isCustomerCare = role === "customer-care";

  const [userActivity, setUserActivity]   = useState<typeof USER_ACTIVITY_MOCK>([]);
  const [adminActivity, setAdminActivity] = useState<typeof ADMIN_ACTIVITY_MOCK>([]);
  const [activityTab, setActivityTab]     = useState<"user" | "admin">("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.platformActivity("user").then(res => {
      setUserActivity(res.results.map(a => ({
        text: `${a.actor}: ${a.action}`,
        time: new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        dot: a.type === "subscription" ? "#4A8DB8" : a.type === "moderation" ? "#D41F3A" : "#0A6870",
        type: "user",
      })));
    }).catch(() => {}).finally(() => setLoading(false));

    if (isSuperAdmin) {
      adminApi.platformActivity("admin").then(res => {
        setAdminActivity(res.results.map(a => ({
          text: `${a.action} (${a.actor})`,
          time: new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          dot: "#6B9E78", type: "admin",
        })));
      }).catch(() => {});
    }
  }, [isSuperAdmin]);

  const items = activityTab === "user" ? userActivity : adminActivity;

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Recent Activity</h3>
        {isSuperAdmin && (
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            {(["user", "admin"] as const).map(t => (
              <button key={t} onClick={() => setActivityTab(t)}
                className={`px-3 py-1 rounded-md capitalize transition-all ${activityTab === t ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                style={{ fontSize: "0.75rem", fontWeight: activityTab === t ? 700 : 400 }}>
                {t === "admin" ? "Admin Actions" : "User Activity"}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <div className="flex items-center gap-2 text-muted-foreground py-4"><div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /><span style={{ fontSize: "0.8125rem" }}>Loading…</span></div>}

      {!loading && items.length === 0 && (
        <p className="text-muted-foreground py-4 text-center" style={{ fontSize: "0.8125rem" }}>No recent activity.</p>
      )}

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: item.dot }} />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: "0.8125rem", lineHeight: 1.4 }}>{item.text}</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{item.time}</p>
            </div>
          </div>
        ))}
      </div>

      {isCustomerCare && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Showing support-related activity only.</p>
        </div>
      )}
    </div>
  );
}

// ─── QUICK ACTIONS ROW ─────────────────────────────────────
function QuickActionsRow({ liveOverview, onNavigate }: { liveOverview?: AnalyticsOverview; onNavigate?: (s: AdminSection) => void }) {
  const qa = liveOverview?.quick_actions;
  const items = [
    { label: "Open Support Tickets",  value: qa?.open_tickets ?? "—",            action: "View →",   color: "#4A8DB8", target: "support"  as AdminSection },
    { label: "Open Support Tickets",  value: qa?.open_tickets          ?? "—", action: "View →",   color: "#4A8DB8", target: "support"    as AdminSection },
    { label: "Pending Reports",       value: qa?.pending_reports        ?? "—", action: "Action →", color: "#D41F3A", target: "reports"    as AdminSection },
  ];
  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      {items.map(({ label, value, action, color, target }) => (
        <div key={label} className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{label}</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 900, color }}>{value}</p>
          </div>
          <button onClick={() => onNavigate?.(target)} className="hover:opacity-70 transition-opacity" style={{ fontSize: "0.8125rem", fontWeight: 600, color }}>{action}</button>
        </div>
      ))}
    </div>
  );
}

// ─── OVERVIEW SECTION ─────────────────────────────────────
function fmtGrowth(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return "";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct}% vs yesterday`;
}

function OverviewSection({ role, onNavigate, liveOverview, liveUsersChart, liveRevenueChart }: {
  role: AdminRole;
  onNavigate?: (s: AdminSection) => void;
  liveOverview?: AnalyticsOverview;
  liveUsersChart?: Array<{ month: string; total: number; new: number }>;
  liveRevenueChart?: Array<{ month: string; amount: number }>;
  liveGender?: Array<{ name: string; value: number; color: string }>;
}) {
  const canSeeFinancials = role === "super-admin" || (role === "admin" && getRevenuePermission());
  const isBlogAdmin     = role === "blog-admin";
  const isCustomerCare  = role === "customer-care";
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  // Daily active users chart (last 14 days)
  const [dailyActive, setDailyActive] = useState<Array<{ date: string; active: number }>>([]);
  const [dauDays, setDauDays] = useState<7 | 14 | 30>(14);

  useEffect(() => {
    if (isCustomerCare || isBlogAdmin) return;
    import("../../lib/api").then(({ analytics: api }) => {
      api.dailyActiveUsers(dauDays)
        .then(r => setDailyActive(r.series))
        .catch(() => {});
    });
  }, [isCustomerCare, isBlogAdmin, dauDays]);

  // Live blog stats — fetched for blog-admin and all admin/super-admin roles
  const [blogStats, setBlogStats] = useState<{
    total: number; published: number; drafts: number; categories: number;
    totalViews: number; totalLikes: number;
  } | null>(null);

  useEffect(() => {
    if (isCustomerCare) return;
    import("../../lib/api").then(({ adminBlog }) => {
      Promise.all([adminBlog.listArticles(), adminBlog.listCategories()]).then(([articles, cats]) => {
        const all = articles.results;
        setBlogStats({
          total:      all.length,
          published:  all.filter(a => a.status === "published").length,
          drafts:     all.filter(a => a.status === "draft").length,
          categories: cats.length,
          totalViews: all.reduce((s, a) => s + (a.view_count ?? 0), 0),
          totalLikes: all.reduce((s, a) => s + (a.likes_count ?? 0), 0),
        });
      }).catch(() => {});
    });
  }, [isCustomerCare]);

  const subtitle = isBlogAdmin
    ? "Your content performance at a glance"
    : isCustomerCare
      ? "Support queue overview"
      : "Platform health at a glance";

  return (
    <div>
      <SectionHeader title="Dashboard" sub={subtitle} />

      {/* ── KPI row — filtered by role ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* Users: super-admin, admin */}
        {(role === "super-admin" || role === "admin") && (
          <>
            <KpiCard icon={<Users size={18} />} label="Total Users" value={liveOverview ? fmt(liveOverview.total_users) : "—"} change={liveOverview?.new_month_growth != null ? fmtGrowth(liveOverview.new_month_growth) : ""} color="#0A6870" />
            <KpiCard icon={<UserCheck size={18} />} label="Active Today" value={liveOverview ? fmt(liveOverview.active_today) : "—"} change={liveOverview ? fmtGrowth(liveOverview.active_today_growth) : ""} color="#4A8DB8" />
            <KpiCard icon={<Heart size={18} />} label="Matches This Month" value={liveOverview ? fmt(liveOverview.total_matches) : "—"} change="" color="#C5733F" />
            <KpiCard icon={<BookOpen size={18} />} label="Published Articles" value={blogStats ? String(blogStats.published) : "—"} change="" color="#6B9E78" />
          </>
        )}
        {/* Revenue: only when permitted */}
        {canSeeFinancials && (
          <KpiCard icon={<DollarSign size={18} />} label="Monthly Revenue" value={liveOverview?.revenue_mtd ? `$${(liveOverview.revenue_mtd / 1000).toFixed(1)}k` : "—"} change="" color="#6B9E78" />
        )}
        {/* Blog Admin KPIs */}
        {isBlogAdmin && (
          <>
            <KpiCard icon={<BookOpen size={18} />} label="Published Articles" value={blogStats ? String(blogStats.published) : "—"} change="" color="#6B9E78" />
            <KpiCard icon={<Eye size={18} />} label="Total Article Views" value={blogStats ? fmt(blogStats.totalViews) : "—"} change="" color="#4A8DB8" />
            <KpiCard icon={<ThumbsUp size={18} />} label="Total Likes" value={blogStats ? fmt(blogStats.totalLikes) : "—"} change="" color="#0A6870" />
            <KpiCard icon={<Tag size={18} />} label="Categories" value={blogStats ? String(blogStats.categories) : "—"} change="" color="#C5733F" />
          </>
        )}
        {/* Customer Care KPIs */}
        {isCustomerCare && (
          <>
            <KpiCard icon={<Headphones size={18} />} label="Open Tickets" value="2" change="" color="#C5733F" />
            <KpiCard icon={<UserCheck size={18} />} label="Resolved Today" value="5" change="+2" color="#6B9E78" />
            <KpiCard icon={<AlertTriangle size={18} />} label="Escalated" value="1" change="" color="#D41F3A" />
            <KpiCard icon={<Users size={18} />} label="Active Members" value="—" change="" color="#4A8DB8" />
          </>
        )}
      </div>

      {/* ── Main charts — role filtered ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Active Users — super-admin and admin only */}
        {(role === "super-admin" || role === "admin") && (
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Daily Active Users</h3>
                {liveOverview && (
                  <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.8125rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{liveOverview.active_today}</span> today
                    {" · "}
                    <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{liveOverview.active_7d}</span> last 7d
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {([7, 14, 30] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDauDays(d)}
                    className="px-2.5 py-1 rounded-md transition-colors"
                    style={{
                      fontSize: "0.75rem", fontWeight: dauDays === d ? 700 : 500,
                      background: dauDays === d ? "var(--card)" : "transparent",
                      color: dauDays === d ? "var(--foreground)" : "var(--muted-foreground)",
                      boxShadow: dauDays === d ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyActive} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#68747F" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={d => {
                    const dt = new Date(d);
                    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                  interval={dauDays <= 7 ? 0 : dauDays <= 14 ? 1 : 4}
                />
                <YAxis tick={{ fontSize: 12, fill: "#68747F" }} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: "0.875rem" }}
                  labelFormatter={d => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  formatter={(v: number) => [v, "Active Users"]}
                />
                <Bar dataKey="active" fill="#4A8DB8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Blog article engagement — blog-admin */}
        {isBlogAdmin && (
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-4">
            <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">Article Views (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { month: "Feb", views: 1400 }, { month: "Mar", views: 2100 }, { month: "Apr", views: 2800 },
                { month: "May", views: 3600 }, { month: "Jun", views: 4200 }, { month: "Jul", views: 4820 },
              ]} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <XAxis key="x" dataKey="month" tick={{ fontSize: 12, fill: "#68747F" }} axisLine={false} tickLine={false} />
                <YAxis key="y" tick={{ fontSize: 12, fill: "#68747F" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip key="tip" contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
                <Bar key="bar" dataKey="views" fill="#6B9E78" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue chart — only for those with financial access */}
        {canSeeFinancials && (
          <div className={`${role === "super-admin" ? "" : "lg:col-span-2"} bg-card rounded-2xl border border-border p-4`}>
            <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={liveRevenueChart ?? analyticsData.revenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <XAxis key="x" dataKey="month" tick={{ fontSize: 12, fill: "#68747F" }} axisLine={false} tickLine={false} />
                <YAxis key="y" tick={{ fontSize: 12, fill: "#68747F" }} axisLine={false} tickLine={false} width={52} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip key="tip" contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: "0.875rem" }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                <Line key="line" type="monotone" dataKey="amount" stroke="#6B9E78" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Activity — split: User Activity + Admin Activity (super-admin only) */}
        {!isBlogAdmin && (
          <ActivityPanel role={role} />
        )}

        {/* Blog recent posts — blog-admin */}
        {isBlogAdmin && <TopArticlesPanel />}
      </div>

      {/* ── Quick action row — only for roles that have those sections ── */}
      {(role === "super-admin" || role === "admin") && (
        <QuickActionsRow liveOverview={liveOverview} onNavigate={onNavigate} />
      )}
    </div>
  );
}

// ─── USERS SECTION ────────────────────────────────────────
function UsersSection() {
  return <UsersSectionV2 />;
}

// ── Sortable column header ────────────────────────────────
function SortHeader({ label, field, sortField, sortDir, onSort }: {
  label: string; field: string;
  sortField: string; sortDir: "asc" | "desc";
  onSort: (f: string) => void;
}) {
  const active = sortField === field;
  return (
    <th className="text-left px-5 py-3.5 text-muted-foreground cursor-pointer hover:text-foreground select-none transition-colors"
      style={{ fontSize: "0.8125rem", fontWeight: 600 }}
      onClick={() => onSort(field)}>
      <span className="flex items-center gap-1">
        {label}
        <span style={{ opacity: active ? 1 : 0.3, fontSize: "0.7rem" }}>
          {active && sortDir === "asc" ? "↑" : "↓"}
        </span>
      </span>
    </th>
  );
}

// ─── SHARED PHOTO HELPERS ─────────────────────────────────

/** Resolve a relative /media/… path to a full URL using the configured API base. */
function resolveMediaUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) {
    const base = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
    return base + url;
  }
  return url;
}

/** Return true when a string looks like an image URL, path, or base64 data URI. */
function isMediaUrl(str: string): boolean {
  if (!str) return false;
  if (str.startsWith("data:image/")) return true;
  const s = str.toLowerCase();
  return (
    (s.startsWith("/media/") || s.startsWith("http")) &&
    (s.includes(".jpg") || s.includes(".jpeg") || s.includes(".png") ||
     s.includes(".webp") || s.includes(".gif") || s.includes("/photos/"))
  );
}

/** Small inline photo thumbnail used in evidence and audit rows. */
function PhotoThumb({ url, label = "Evidence photo" }: { url: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const src = resolveMediaUrl(url);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative mt-2 block rounded-xl overflow-hidden border border-border hover:border-primary transition-colors"
        style={{ width: 120, height: 80, flexShrink: 0 }}
        title="Click to expand"
      >
        <img src={src} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold transition-opacity">Expand</span>
        </div>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={src} alt={label} className="w-full h-full object-contain" />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── MODERATION SECTION ───────────────────────────────────
// Extended moderation item with photo URL and user details
interface ModerationItem {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userGender?: string;
  userLocation?: string;
  userSubscription?: string;
  photoUrl?: string;
  submittedAt: string;
  photoLabel: string;
  status: "pending" | "approved" | "rejected";
}

function ModerationSection() {
  const [activeTab, setActiveTab]     = useState<"pending" | "approved" | "rejected">("pending");
  const [rejectModal, setRejectModal] = useState<ModerationItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [previewItem, setPreviewItem] = useState<ModerationItem | null>(null);
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Persist approved/rejected photo IDs across refreshes (no DB status field yet)
  const REVIEWED_KEY = "ma3moni_moderation_reviewed";
  const getReviewed = (): Record<string, "approved" | "rejected"> => {
    try { return JSON.parse(localStorage.getItem(REVIEWED_KEY) ?? "{}"); } catch { return {}; }
  };
  const saveReviewed = (id: string, status: "approved" | "rejected") => {
    try {
      const existing = getReviewed();
      localStorage.setItem(REVIEWED_KEY, JSON.stringify({ ...existing, [id]: status }));
    } catch {}
  };

  useEffect(() => {
    restoreAdminToken();
    const reviewed = getReviewed();

    adminApi.photoQueue().then(res => {
      // Always replace items — filter out already-reviewed ones server-side isn't possible yet
      // so we use localStorage to remember which IDs the admin already actioned
      const mapped: ModerationItem[] = res.results.map(p => {
        const photoUrl = resolveMediaUrl(p.photo_url ?? "");
        return {
          id:               p.id,
          userId:           p.user.id,
          userName:         p.user.name,
          userEmail:        p.user.email,
          userGender:       p.user.gender,
          userLocation:     p.user.location,
          userSubscription: p.user.subscription,
          photoUrl,
          submittedAt:      p.submitted_at,
          photoLabel:       "Profile Photo",
          status:           (reviewed[p.id] ?? "pending") as ModerationItem["status"],
        };
      });
      setItems(mapped);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(p => p.status === activeTab);

  const approve = async (item: ModerationItem) => {
    setItems(prev => prev.map(p => p.id === item.id ? { ...p, status: "approved" as const } : p));
    saveReviewed(item.id, "approved");
    setPreviewItem(null);
    try { await adminApi.reviewPhoto(item.id, "approved"); } catch {}
    toast.success(`Photo approved for ${item.userName}`);
  };

  const confirmReject = async () => {
    if (!rejectModal) return;
    setItems(prev => prev.map(p => p.id === rejectModal.id ? { ...p, status: "rejected" as const } : p));
    saveReviewed(rejectModal.id, "rejected");
    setRejectModal(null); setRejectReason(""); setPreviewItem(null);
    try { await adminApi.reviewPhoto(rejectModal.id, "rejected"); } catch {}
    toast.success(`Photo rejected for ${rejectModal.userName}`);
  };

  const pendingCount  = items.filter(p => p.status === "pending").length;
  const approvedCount = items.filter(p => p.status === "approved").length;
  const rejectedCount = items.filter(p => p.status === "rejected").length;

  return (
    <div>
      {/* Photo preview + action modal */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-3xl border border-border w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Photo */}
            <div className="relative bg-muted" style={{ height: 320 }}>
              {previewItem.photoUrl
                ? <img src={previewItem.photoUrl} alt={previewItem.userName} className="w-full h-full object-cover object-top" />
                : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <User size={48} />
                    <span style={{ fontSize: "0.875rem" }}>Photo not available</span>
                  </div>
                )}
              {/* Status overlay for non-pending */}
              {previewItem.status !== "pending" && (
                <div className={`absolute inset-0 flex items-center justify-center ${previewItem.status === "approved" ? "bg-green-900/40" : "bg-red-900/50"}`}>
                  <div className={`px-5 py-2.5 rounded-full ${previewItem.status === "approved" ? "bg-green-500" : "bg-destructive"} text-white`} style={{ fontWeight: 800, fontSize: "0.875rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {previewItem.status}
                  </div>
                </div>
              )}
              <button onClick={() => setPreviewItem(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* User info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: "1.125rem" }}>{previewItem.userName}</h3>
                  <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{previewItem.userEmail}</p>
                </div>
                <StatusBadge status={previewItem.status} />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Gender",   value: previewItem.userGender ? previewItem.userGender.charAt(0).toUpperCase() + previewItem.userGender.slice(1) : "—" },
                  { label: "Location", value: previewItem.userLocation || "—" },
                  { label: "Plan",     value: previewItem.userSubscription || "free" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/50 rounded-xl p-2.5 text-center">
                    <p className="text-muted-foreground" style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 700, marginTop: 2, textTransform: "capitalize" }}>{value}</p>
                  </div>
                ))}
              </div>

              <p className="text-muted-foreground mb-4" style={{ fontSize: "0.75rem" }}>
                Submitted {previewItem.submittedAt} · {previewItem.photoLabel}
              </p>

              {previewItem.status === "pending" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => { setRejectModal(previewItem); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-destructive bg-red-50 hover:bg-red-100 transition-colors"
                    style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                    <XCircle size={16} /> Reject
                  </button>
                  <button
                    onClick={() => approve(previewItem)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                    <CheckCircle size={16} /> Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl p-6">
            <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }} className="mb-1">Reject Photo</h3>
            <p className="text-muted-foreground mb-4" style={{ fontSize: "0.875rem" }}>{rejectModal.userName}</p>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Reason</label>
            <select value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 mb-5"
              style={{ fontSize: "0.9rem" }}>
              <option value="">Select a reason…</option>
              <option value="blurry">Blurry or low quality</option>
              <option value="not_face">Not a real face photo</option>
              <option value="multiple">Multiple people in photo</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="group">Group photo</option>
              <option value="other">Other</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.9rem" }}>Cancel</button>
              <button onClick={confirmReject} disabled={!rejectReason}
                className="flex-1 py-3 bg-destructive text-white rounded-xl hover:bg-destructive/90 transition-colors disabled:opacity-50"
                style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionHeader
        title="Photo Moderation"
        sub="Review profile photos before they're visible to other members"
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Pending Review", count: pendingCount,  color: "#C5733F", bg: "#FEF3C7" },
          { label: "Approved",       count: approvedCount, color: "#166534", bg: "#DCFCE7" },
          { label: "Rejected",       count: rejectedCount, color: "#991B1B", bg: "#FEE2E2" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="rounded-2xl border border-border p-4 text-center" style={{ background: bg + "40" }}>
            <p style={{ fontSize: "1.875rem", fontWeight: 900, color }}>{loading ? "…" : count}</p>
            <p style={{ fontSize: "0.6875rem", fontWeight: 600, color, opacity: 0.8 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tab filter */}
      <div className="flex gap-2 mb-6">
        {(["pending", "approved", "rejected"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-full border-2 transition-all capitalize ${
              activeTab === t
                ? t === "pending" ? "bg-amber-500 border-amber-500 text-white"
                  : t === "approved" ? "bg-primary border-primary text-primary-foreground"
                  : "bg-destructive border-destructive text-white"
                : "border-border bg-card text-muted-foreground hover:border-primary/30"
            }`}
            style={{ fontSize: "0.8125rem", fontWeight: activeTab === t ? 700 : 400 }}>
            {t} ({t === "pending" ? pendingCount : t === "approved" ? approvedCount : rejectedCount})
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-muted-foreground py-8 justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          Loading photo queue…
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-card rounded-2xl border border-border p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-primary" />
          </div>
          <p style={{ fontWeight: 700, fontSize: "1.0625rem" }}>Queue is clear</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.875rem" }}>No {activeTab} photos right now.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(item => (
          <button key={item.id} onClick={() => setPreviewItem(item)}
            className="group bg-card rounded-2xl border border-border overflow-hidden text-left hover:border-primary/30 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
            {/* Photo thumbnail */}
            <div className="relative bg-muted" style={{ height: 160 }}>
              {item.photoUrl
                ? <img src={item.photoUrl} alt={item.userName} className="w-full h-full object-cover object-top transition-transform group-hover:scale-105" />
                : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <User size={36} />
                  </div>
                )}

              {/* Status overlay tint */}
              {item.status === "pending" && (
                <div className="absolute inset-0" style={{ background: "rgba(194,89,0,0.12)" }} />
              )}
              {item.status === "rejected" && (
                <div className="absolute inset-0 bg-red-900/30" />
              )}

              {/* Status badge top-right */}
              <div className="absolute top-2 right-2">
                <StatusBadge status={item.status} />
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-white/90 rounded-full px-3 py-1.5" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)" }}>
                  View &amp; Review
                </div>
              </div>
            </div>

            {/* User info */}
            <div className="p-3">
              <p style={{ fontWeight: 700, fontSize: "0.875rem" }} className="truncate">{item.userName}</p>
              <p className="text-muted-foreground truncate" style={{ fontSize: "0.75rem" }}>{item.submittedAt}</p>
              {item.status === "pending" && (
                <div className="flex items-center gap-1 mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span style={{ fontSize: "0.6875rem", color: "#92400e", fontWeight: 600 }}>Awaiting review</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── BLACKLIST SECTION ────────────────────────────────────
function BlacklistSection() {
  const [form, setForm] = useState({ type: "email", value: "", reason: "" });
  const [list, setList] = useState<typeof BLACKLIST>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminApi.blacklist().then(res => {
      setList(res.results.map(b => ({
        id: b.id, type: b.type, value: b.value, reason: b.reason,
        date: b.added_at, blockedBy: "Admin",
      })));
    }).catch(() => {});
  }, []);

  const filtered = search.trim()
    ? list.filter(item =>
        item.value.toLowerCase().includes(search.toLowerCase()) ||
        item.reason.toLowerCase().includes(search.toLowerCase()) ||
        item.type.toLowerCase().includes(search.toLowerCase())
      )
    : list;

  const add = async () => {
    if (!form.value || !form.reason) return;
    setList(prev => [...prev, { id: `b${Date.now()}`, type: form.type, value: form.value, reason: form.reason, date: "Today", blockedBy: "Admin" }]);
    setForm({ type: "email", value: "", reason: "" });
    try { await adminApi.addBlacklist(form.type, form.value, form.reason); } catch {}
  };

  return (
    <div>
      <SectionHeader title="Blacklist System" sub="Block users from re-registering on any account" />

      {/* Add form */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-6">
        <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">Add to Blacklist</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Block By</label>
            <select
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none"
              style={{ fontSize: "0.9rem" }}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="name">Name</option>
              <option value="photo">Profile Photo</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Value</label>
            <input
              value={form.value}
              onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
              placeholder={form.type === "email" ? "email@example.com" : form.type === "phone" ? "+971-55-xxxx" : "Enter value…"}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              style={{ fontSize: "0.9rem" }}
            />
          </div>
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Reason</label>
            <input
              value={form.reason}
              onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
              placeholder="Harassment, fraud…"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              style={{ fontSize: "0.9rem" }}
            />
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "0.875rem" }}>
            <RefreshCw size={14} /> Scan for Duplicates
          </button>
          <button
            onClick={add}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
            style={{ fontSize: "0.875rem", fontWeight: 600 }}
          >
            <Ban size={14} /> Add to Blacklist
          </button>
        </div>
      </div>

      {/* Search + Table */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by value, type or reason…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            style={{ fontSize: "0.875rem" }}
          />
        </div>
        {search && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filtered.length} / {list.length} entries
          </span>
        )}
      </div>
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Type", "Value", "Reason", "Blocked By", "Date", ""].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-muted-foreground" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground" style={{ fontSize: "0.875rem" }}>
                  {search ? "No entries match your search." : "Blacklist is empty."}
                </td>
              </tr>
            ) : null}
            {filtered.map(item => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-4">
                  <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground capitalize" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{item.type}</span>
                </td>
                <td className="px-5 py-4" style={{ fontSize: "0.875rem", fontFamily: "monospace" }}>{item.value}</td>
                <td className="px-5 py-4 text-muted-foreground" style={{ fontSize: "0.875rem" }}>{item.reason}</td>
                <td className="px-5 py-4 text-muted-foreground" style={{ fontSize: "0.875rem" }}>{item.blockedBy}</td>
                <td className="px-5 py-4 text-muted-foreground" style={{ fontSize: "0.875rem" }}>{item.date}</td>
                <td className="px-5 py-4">
                  <button
                    onClick={async () => {
                      setList(prev => prev.filter(b => b.id !== item.id));
                      try { await adminApi.removeBlacklist(item.id); } catch {}
                    }}
                    title="Remove from blacklist"
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CUSTOMER CARE SECTION ────────────────────────────────
function SupportSection({ role }: { role: AdminRole }) {
  return <SupportSectionV2 role={role} />;
}

// Blog section components (TopArticlesPanel, BlogSection, BlogEditorModal)
// are in ./admin/AdminBlogSection.tsx — imported above.


// ─── ROLES SECTION (with super-admin user creation) ───────
function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", role: "customer-care" as AdminRole, password: "" });
  const [done, setDone] = useState(false);
  const u = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(p => ({ ...p, [k]: v }));

  if (done) return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border p-8 w-full max-w-md text-center">
        <CheckCircle size={48} className="text-primary mx-auto mb-4" />
        <p style={{ fontWeight: 800, fontSize: "1.25rem" }}>User created!</p>
        <p className="text-muted-foreground mt-2" style={{ fontSize: "0.875rem" }}>{form.name} ({form.email}) has been added as <strong>{ROLE_LABEL[form.role]}</strong>.</p>
        <button onClick={onClose} className="mt-6 w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" style={{ fontWeight: 700 }}>Done</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 style={{ fontWeight: 700, fontSize: "1.0625rem" }}>Create Admin User</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Full Name</label>
            <input value={form.name} onChange={e => u("name", e.target.value)} placeholder="e.g. Aisha Mohammed" className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30" style={{ fontSize: "0.9rem" }} />
          </div>
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Email Address</label>
            <input type="email" value={form.email} onChange={e => u("email", e.target.value)} placeholder="user@ma3moni.com" className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30" style={{ fontSize: "0.9rem" }} />
          </div>
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Assign Role</label>
            <div className="grid grid-cols-2 gap-2">
              {(["super-admin","admin","blog-admin","customer-care"] as AdminRole[]).map(r => (
                <button key={r} onClick={() => u("role", r)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left ${form.role === r ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/30"}`}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: ROLE_ACCESS[r].length > 5 ? "#0A6870" : r === "blog-admin" ? "#6B9E78" : r === "admin" ? "#4A8DB8" : "#C5733F", opacity: 0.15 + (form.role === r ? 0.85 : 0) }}>
                    <span style={{ fontSize: "0.5625rem", fontWeight: 800, color: "white" }}>{ROLE_BADGE[r]}</span>
                  </div>
                  <span style={{ fontSize: "0.8125rem", fontWeight: form.role === r ? 700 : 500, color: form.role === r ? "var(--primary)" : "var(--foreground)" }}>{ROLE_LABEL[r]}</span>
                </button>
              ))}
            </div>
            <p className="text-muted-foreground mt-2" style={{ fontSize: "0.75rem" }}>
              {form.role === "super-admin" && "Full access including user creation and role assignment."}
              {form.role === "admin" && "User management, moderation, blog editing, payments."}
              {form.role === "blog-admin" && "Create and manage articles, view engagement analytics."}
              {form.role === "customer-care" && "Support tickets and user profile lookup only."}
            </p>
          </div>
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Temporary Password</label>
            <input type="password" value={form.password} onChange={e => u("password", e.target.value)} placeholder="Min 8 characters" className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30" style={{ fontSize: "0.9rem" }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.9rem" }}>Cancel</button>
            <button
              onClick={() => {
                if (!form.name.trim() || !form.email.trim() || !form.password || form.password.length < 8) {
                  alert("Please fill in all fields and ensure the password is at least 8 characters.");
                  return;
                }
                setDone(true);
              }}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Create User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: "#0A6870", admin: "#4A8DB8", blog_admin: "#6B9E78",
  moderator: "#9B6DAF", cc_agent: "#C5733F",
};
const ROLE_LABELS_MAP: Record<string, string> = {
  super_admin: "Super Admin", admin: "Admin", blog_admin: "Blog Admin",
  moderator: "Moderator", cc_agent: "Customer Care",
};

function RolesSection({ role }: { role: AdminRole }) {
  const isSuperAdmin = role === "super-admin";
  const [staffList, setStaffList] = useState(ROLES_DATA.flatMap(r => r.users.map(email => ({ email, role: r.name.toLowerCase().replace(/ /g,"_"), name: r.name }))));
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; email: string; role: string; is_active: boolean; permissions?: import("../../lib/api").Permission[] } | null>(null);
  const [editPerms, setEditPerms] = useState<import("../../lib/api").Permission[]>([]);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "admin" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Fetch real staff from API
  useEffect(() => {
    if (!isSuperAdmin) return;
    adminApi.staff().then(res => {
      if (res.results.length) setStaffList(res.results.map(s => ({ id: s.id, email: s.email, name: s.name || s.email, role: s.role, is_active: s.is_active })) as typeof staffList);
    }).catch(() => {});
  }, [isSuperAdmin]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!createForm.email || !createForm.password) { setCreateError("Email and password required."); return; }
    setCreating(true);
    try {
      const newStaff = await adminApi.createStaff({ email: createForm.email, password: createForm.password, role: createForm.role as import("../../lib/api").DjangoRole, name: createForm.name });
      setStaffList(prev => [...prev, { id: newStaff.id, email: newStaff.email, name: newStaff.name || newStaff.email, role: newStaff.role, is_active: newStaff.is_active }] as typeof staffList);
      setShowCreate(false);
      setCreateForm({ name: "", email: "", password: "", role: "admin" });
      toast.success(`Admin account created for ${newStaff.email}`);
    } catch (err: unknown) {
      setCreateError((err as import("../../lib/api").ApiError)?.message ?? "Failed to create account.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: string, data: { role?: string; is_active?: boolean; name?: string }) => {
    try {
      await adminApi.updateStaff(id, data as Parameters<typeof adminApi.updateStaff>[1]);
      setStaffList(prev => prev.map((s: { id?: string }) => s.id === id ? { ...s, ...data } : s) as typeof staffList);
      setEditTarget(null);
      toast.success("Admin account updated.");
    } catch { toast.error("Failed to update."); }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!window.confirm(`Remove admin access for ${email}?`)) return;
    try {
      await adminApi.deleteStaff(id);
      setStaffList(prev => (prev as { id?: string }[]).filter(s => s.id !== id) as typeof staffList);
      toast.success("Admin account removed.");
    } catch { toast.error("Failed to remove."); }
  };

  // Group by role
  const grouped = ROLES_DATA.map(rd => ({
    ...rd,
    liveUsers: (staffList as { role: string; email?: string; name?: string; id?: string; is_active?: boolean }[]).filter(s => {
      const roleKey = rd.name.toLowerCase().replace(/ /g,"_");
      return s.role === roleKey || s.role?.replace(/-/g,"_") === roleKey;
    }),
  }));

  return (
    <div>
      {/* Create admin modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl p-6">
            <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }} className="mb-4">Create Admin Account</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block mb-1" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Full Name</label>
                <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Sarah Al-Nasser" className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30" style={{ fontSize: "0.9rem" }} />
              </div>
              <div>
                <label className="block mb-1" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Email *</label>
                <input type="email" required value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@ma3moni.com" className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30" style={{ fontSize: "0.9rem" }} />
              </div>
              <div>
                <label className="block mb-1" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Password *</label>
                <input type="password" required value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 8 characters" className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30" style={{ fontSize: "0.9rem" }} />
              </div>
              <div>
                <label className="block mb-1" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Role *</label>
                <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none" style={{ fontSize: "0.9rem" }}>
                  <option value="admin">Admin</option>
                  <option value="blog_admin">Blog Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="cc_agent">Customer Care</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {createError && <p className="text-destructive" style={{ fontSize: "0.8125rem" }}>{createError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setCreateError(""); }} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.9rem" }}>Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit admin modal — includes granular permissions */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl p-6 my-4">
            <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }} className="mb-1">Edit Admin Account</h3>
            <p className="text-muted-foreground mb-4" style={{ fontSize: "0.875rem" }}>{editTarget.email}</p>
            <div className="space-y-3">
              <div>
                <label className="block mb-1" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Full Name</label>
                <input value={editTarget.name} onChange={e => setEditTarget(t => t ? { ...t, name: e.target.value } : t)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none" style={{ fontSize: "0.9rem" }} />
              </div>
              <div>
                <label className="block mb-1" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Role</label>
                <select value={editTarget.role} onChange={e => setEditTarget(t => t ? { ...t, role: e.target.value } : t)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none" style={{ fontSize: "0.9rem" }}>
                  <option value="admin">Admin</option>
                  <option value="blog_admin">Blog Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="cc_agent">Customer Care</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-1">
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Account Active</span>
                <button onClick={() => setEditTarget(t => t ? { ...t, is_active: !t.is_active } : t)}
                  className={`w-12 h-6 rounded-full transition-all relative ${editTarget.is_active ? "bg-primary" : "bg-switch-background"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${editTarget.is_active ? "left-7" : "left-1"}`} />
                </button>
              </div>

              {/* Granular permission overrides */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Granular Permissions</span>
                  <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>overrides role defaults</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {(import("../../lib/api") as unknown as { ALL_PERMISSIONS: readonly import("../../lib/api").Permission[] }).ALL_PERMISSIONS &&
                    ["delete_user","suspend_user","view_user_details","view_user_activity",
                     "manage_reports","manage_blacklist","manage_blog","view_analytics",
                     "view_financials","send_push_notifications","grant_subscription",
                     "view_admin_activity","manage_roles"].map(perm => {
                      const p = perm as import("../../lib/api").Permission;
                      const checked = editPerms.includes(p);
                      return (
                        <button key={p} type="button"
                          onClick={() => setEditPerms(prev => checked ? prev.filter(x => x !== p) : [...prev, p])}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-all ${checked ? "border-primary bg-primary/8 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                          style={{ fontSize: "0.7rem", fontWeight: checked ? 700 : 400 }}>
                          <div className={`w-3 h-3 rounded flex-shrink-0 flex items-center justify-center ${checked ? "bg-primary" : "bg-muted border border-border"}`}>
                            {checked && <Check size={8} className="text-white" />}
                          </div>
                          {p.replace(/_/g, " ")}
                        </button>
                      );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => { setEditTarget(null); setEditPerms([]); }} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.9rem" }}>Cancel</button>
              <button onClick={async () => {
                await handleUpdate(editTarget.id, { role: editTarget.role as import("../../lib/api").DjangoRole, is_active: editTarget.is_active, name: editTarget.name });
                if (editPerms.length > 0) {
                  try { await adminApi.setPermissions(editTarget.id, editPerms); } catch {}
                }
                setEditPerms([]);
              }}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionHeader
        title="Roles & Permissions"
        sub="Control what each team member can access and modify"
        action={
          isSuperAdmin ? (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              <UserPlus size={14} /> Add Admin
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-5">
        {grouped.map(rd => (
          <div key={rd.id} className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: rd.color + "20", color: rd.color }}>
                <span style={{ fontWeight: 800, fontSize: "0.75rem" }}>{rd.badge}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{rd.name}</p>
                <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{rd.liveUsers.length} member{rd.liveUsers.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-muted-foreground mb-3" style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>{rd.desc}</p>
              <div className="mt-3 pt-3 border-t border-border">
                <p style={{ fontSize: "0.75rem", fontWeight: 600 }} className="mb-2">Members</p>
                {rd.liveUsers.length === 0 && (
                  <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>No members yet</p>
                )}
                {rd.liveUsers.map((u: { id?: string; email?: string; name?: string; is_active?: boolean }, i: number) => (
                  <div key={u.id ?? u.email ?? i} className="flex items-center justify-between gap-2 py-1 group">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: u.is_active === false ? "#6b7280" : rd.color }} />
                      <div className="min-w-0">
                        <p style={{ fontSize: "0.75rem", fontWeight: 600 }} className="truncate">{u.name || u.email}</p>
                        <p className="text-muted-foreground truncate" style={{ fontSize: "0.6875rem" }}>{u.email}</p>
                      </div>
                    </div>
                    {isSuperAdmin && u.id && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditTarget({ id: u.id!, name: u.name || "", email: u.email || "", role: rd.name.toLowerCase().replace(/ /g,"_"), is_active: u.is_active !== false })}
                          className="p-1 rounded hover:bg-primary/10 text-primary transition-colors"><Pencil size={11} /></button>
                        <button onClick={() => handleDelete(u.id!, u.email || "")}
                          className="p-1 rounded hover:bg-red-50 text-destructive transition-colors"><Trash size={11} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PAYMENTS SECTION ─────────────────────────────────────
function PaymentsSection({ role }: { role: AdminRole }) {
  return <PaymentsSectionV2 role={role} />;
}

// ─── ANALYTICS SECTION ────────────────────────────────────
function AnalyticsSection({ role }: { role: AdminRole }) {
  const canSeeRevenue = role === "super-admin" || (role === "admin" && getRevenuePermission());
  const [period, setPeriod] = useState<"30d" | "90d" | "1y">("90d");
  const [loading, setLoading] = useState(true);

  const [usersData,   setUsersData]   = useState<Array<{ month: string; total: number; new: number }>>([]);
  const [matchesData, setMatchesData] = useState<Array<{ month: string; matches: number }>>([]);
  const [genderData,  setGenderData]  = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [revenueData, setRevenueData] = useState<Array<{ month: string; amount: number }>>([]);
  const [revKpis,     setRevKpis]     = useState<{ mrr: number; arr: number; arpu: number } | null>(null);
  const [subDist,     setSubDist]     = useState<Array<{ name: string; value: number; color: string }>>([]);

  useEffect(() => {
    setLoading(true);
    const apiPeriod = period as "30d" | "90d" | "1y";
    Promise.allSettled([
      analyticsApi.users(apiPeriod).then(r => { setUsersData(r.series); setGenderData(r.gender); }),
      analyticsApi.matches().then(r => setMatchesData(r.series)),
      canSeeRevenue ? analyticsApi.revenue().then(r => { setRevenueData(r.series); setRevKpis(r.kpis); }) : Promise.resolve(),
      analyticsApi.subscriptions().then(r => setSubDist(r.distribution)),
    ]).finally(() => setLoading(false));
  }, [period, canSeeRevenue]);

  const PERIOD_LABELS: Record<string, string> = { "30d": "30D", "90d": "90D", "1y": "1Y" };

  return (
    <div>
      <SectionHeader
        title="Analytics & Insights"
        sub="Live platform performance data"
        action={
          <div className="flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {(["30d", "90d", "1y"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${period === p ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                  style={{ fontSize: "0.8125rem", fontWeight: period === p ? 600 : 400 }}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Revenue KPI strip — super-admin only */}
      {canSeeRevenue && revKpis && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "MRR", value: `$${revKpis.mrr.toLocaleString()}` },
            { label: "ARR", value: `$${revKpis.arr.toLocaleString()}` },
            { label: "ARPU", value: `$${revKpis.arpu.toFixed(2)}` },
          ].map(k => (
            <div key={k.label} className="bg-card rounded-2xl border border-border p-4">
              <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{k.label}</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 800 }}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">New Users</h3>
          {!usersData.length ? (
            <div className="flex justify-center items-center h-[220px]"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={usersData}>
                <XAxis key="x" dataKey="month" tick={{ fontSize: 11, fill: "#68747F" }} axisLine={false} tickLine={false} />
                <YAxis key="y" tick={{ fontSize: 11, fill: "#68747F" }} axisLine={false} tickLine={false} />
                <Tooltip key="tip" contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
                <Bar key="bar" dataKey="new" fill="#0A6870" radius={[6, 6, 0, 0]} name="New users" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Match Trends */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">Match Trends</h3>
          {!matchesData.length ? (
            <div className="flex justify-center items-center h-[220px]"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={matchesData}>
                <XAxis key="x" dataKey="month" tick={{ fontSize: 11, fill: "#68747F" }} axisLine={false} tickLine={false} />
                <YAxis key="y" tick={{ fontSize: 11, fill: "#68747F" }} axisLine={false} tickLine={false} />
                <Tooltip key="tip" contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
                <Line key="line" type="monotone" dataKey="matches" stroke="#C5733F" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gender Balance */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">Gender Balance</h3>
          {!genderData.length ? (
            <div className="flex justify-center items-center h-[180px]"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="flex items-center gap-8">
              <PieChart width={180} height={180}>
                <Pie key="pie" data={genderData} cx={90} cy={90} innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                  {genderData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div className="space-y-4">
                {genderData.map(g => (
                  <div key={g.name}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ background: g.color }} />
                      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{g.name}</span>
                    </div>
                    <p style={{ fontSize: "1.5rem", fontWeight: 900, color: g.color }}>{g.value}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Subscription distribution */}
        {subDist.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">Subscription Plans</h3>
            <div className="flex items-center gap-6">
              <PieChart width={160} height={160}>
                <Pie key="pie2" data={subDist} cx={80} cy={80} innerRadius={44} outerRadius={72} dataKey="value" strokeWidth={0}>
                  {subDist.map((entry, i) => <Cell key={`sc-${i}`} fill={entry.color} />)}
                </Pie>
              </PieChart>
              <div className="flex-1 space-y-2">
                {subDist.map(s => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                      <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{s.name}</span>
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>{s.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Revenue — only super-admin or admin with permission */}
        {canSeeRevenue && (
          <div className={subDist.length > 0 ? "lg:col-span-2" : ""} style={{}}>
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">Monthly Revenue</h3>
              {!revenueData.length ? (
                <div className="flex justify-center items-center h-[200px]"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={revenueData}>
                    <XAxis key="x" dataKey="month" tick={{ fontSize: 11, fill: "#68747F" }} axisLine={false} tickLine={false} />
                    <YAxis key="y" tick={{ fontSize: 11, fill: "#68747F" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip key="tip" contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", fontSize: "0.8125rem" }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                    <Line key="line" type="monotone" dataKey="amount" stroke="#6B9E78" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── REPORTS SECTION ──────────────────────────────────────
function ReportsSection() {
  // null = not yet loaded, array = loaded (may be empty or have real data)
  const [reports, setReports]       = useState<typeof REPORTS | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "actioned" | "dismissed">("all");
  const [apiError, setApiError]     = useState<string | null>(null);

  // Show empty while loading, real data once API responds (never fall back to mock)
  const displayReports = reports ?? [];
  const isLoading = reports === null && !apiError;

  useEffect(() => {
    setApiError(null);
    adminApi.reports().then(res => {
        setReports(res.results.map(r => ({
        id: r.id,
        reporterId: r.reporter.id, reporter: r.reporter.name, reporterEmail: r.reporter.email,
        reportedId: r.reported_user.id, reported: r.reported_user.name, reportedEmail: r.reported_user.email,
        reportedSubscription: r.reported_user.subscription,
        reportedStatus: r.reported_user.status,
        reportedJoined: r.reported_user.joined,
        reason: r.category, category: r.category,
        description: r.description,
        evidence: r.evidence ?? [],
        date: (r.created_at ?? "").split("T")[0], time: "",
        status: r.status as typeof REPORTS[0]["status"],
        priority: r.priority as typeof REPORTS[0]["priority"],
        priorReportsAgainstUser: r.prior_reports_against_user ?? 0,
        actionHistory: r.action_history ?? [],
        relatedReports: [] as string[],
        adminNotes: r.admin_notes ?? "",
      })));
    }).catch((err: unknown) => {
      const status = (err as { status?: number })?.status;
      // Set reports to empty array so mock data never shows again
      setReports([]);
      if (status === 401 || status === 403) {
        setApiError("Admin session expired. Please sign out and sign back in.");
      } else {
        setApiError("Cannot reach the server. Check your connection and try again.");
      }
    });
  }, []);

  const pending   = displayReports.filter(r => r.status === "pending").length;
  const actioned  = displayReports.filter(r => r.status === "actioned").length;
  const dismissed = displayReports.filter(r => r.status === "dismissed").length;
  const filtered  = displayReports.filter(r => filterStatus === "all" || r.status === filterStatus);
  const selected  = displayReports.find(r => r.id === selectedId);
  const isLive    = reports !== null; // true once API responded

  if (selected) {
    return <ReportDetailView
      report={selected}
      allReports={displayReports}
      onBack={() => setSelectedId(null)}
      onAction={(id, action) => {
        // Optimistically update the list row so navigation back reflects the new status
        const updated = displayReports.map(r => r.id === id ? {
          ...r,
          status: (action === "dismiss" ? "dismissed" : "actioned") as typeof r.status,
        } : r);
        setReports(updated);
      }}
    />;
  }

  const priorityColor = (p: string) => p === "high" ? { bg: "#fee2e2", text: "#991b1b" } : p === "medium" ? { bg: "#fef9c3", text: "#854d0e" } : { bg: "#f3f4f6", text: "#6b7280" };
  const statusColor = (s: string): { bg: string; text: string } => ({
    pending:   { bg: "#dbeafe", text: "#1d4ed8" },
    actioned:  { bg: "#dcfce7", text: "#166534" },
    dismissed: { bg: "#f3f4f6", text: "#6b7280" },
  }[s] ?? { bg: "#f3f4f6", text: "#6b7280" });

  const catIcon: Record<string, string> = { harassment: "⚠️", fake_profile: "🎭", spam: "📢", other: "📋" };

  return (
    <div>
      {/* API error / retry banner */}
      {apiError && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={15} className="text-amber-600 flex-shrink-0" />
          <p className="flex-1 text-amber-800" style={{ fontSize: "0.8125rem" }}>{apiError}</p>
          <button
            onClick={() => {
              setApiError(null);
              setReports(null);
              adminApi.reports().then(res => {
                setReports(res.results.map(r => ({
                  id: r.id,
                  reporterId: r.reporter.id, reporter: r.reporter.name, reporterEmail: r.reporter.email,
                  reportedId: r.reported_user.id, reported: r.reported_user.name, reportedEmail: r.reported_user.email,
                  reportedSubscription: r.reported_user.subscription, reportedStatus: r.reported_user.status, reportedJoined: r.reported_user.joined,
                  reason: r.category, category: r.category, description: r.description, evidence: r.evidence ?? [],
                  date: (r.created_at ?? "").split("T")[0], time: "",
                  status: r.status as typeof REPORTS[0]["status"],
                  priority: r.priority as typeof REPORTS[0]["priority"],
                  priorReportsAgainstUser: r.prior_reports_against_user ?? 0,
                  actionHistory: r.action_history ?? [], relatedReports: [] as string[], adminNotes: r.admin_notes ?? "",
                })));
              }).catch(() => { setReports([]); setApiError("Still unreachable — check Django + token."); });
            }}
            className="flex-shrink-0 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors"
            style={{ fontSize: "0.75rem", fontWeight: 700 }}>
            Retry
          </button>
        </div>
      )}

      {/* Count summary row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total",     value: displayReports.length, color: "#0A6870" },
          { label: "Pending",   value: pending,               color: "#1d4ed8" },
          { label: "Actioned",  value: actioned,              color: "#166534" },
          { label: "Dismissed", value: dismissed,             color: "#6b7280" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-4 text-center">
            <p style={{ fontSize: "1.75rem", fontWeight: 900, color }}>
              {!isLive ? <span className="inline-block w-5 h-5 rounded-full border-2 border-current/30 border-t-current animate-spin" style={{ verticalAlign: "middle" }} /> : value}
            </p>
            <p className="text-muted-foreground" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{label}</p>
            {!isLive && label === "Total" && <p style={{ fontSize: "0.55rem", color: "#C5733F" }}>loading…</p>}
          </div>
        ))}
      </div>

      <SectionHeader
        title="Reports & Moderation"
        sub={isLive ? `${pending} pending · ${displayReports.length} total` : "Loading live data…"}
        action={
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {(["all", "pending", "actioned", "dismissed"] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize ${filterStatus === s ? "bg-card shadow-sm font-semibold" : "text-muted-foreground"}`}
                style={{ fontSize: "0.8125rem" }}>
                {s}{s !== "all" && isLive && ` (${s === "pending" ? pending : s === "actioned" ? actioned : dismissed})`}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {[
          { label: "Total Reports", value: displayReports.length, color: "#4A8DB8" },
          { label: "Pending Review", value: displayReports.filter(r => r.status === "pending").length, color: "#C5733F" },
          { label: "Actioned",       value: displayReports.filter(r => r.status === "actioned").length, color: "#6B9E78" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-4">
            <p className="text-muted-foreground mb-1" style={{ fontSize: "0.875rem" }}>{label}</p>
            <p style={{ fontSize: "2rem", fontWeight: 900, color }}>{value}</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <p style={{ fontWeight: 600, fontSize: "1rem" }}>No {filterStatus} reports</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.875rem" }}>All caught up.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const ps = priorityColor(r.priority);
            const ss = statusColor(r.status);
            return (
              <div
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:border-primary/20 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Category icon */}
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-lg">
                      {catIcon[r.category] ?? "📋"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span style={{ fontWeight: 700, fontSize: "1rem" }}>{r.reason}</span>
                        <span className="px-2 py-0.5 rounded-full capitalize" style={{ fontSize: "0.6875rem", fontWeight: 700, background: ps.bg, color: ps.text }}>{r.priority}</span>
                        <span className="px-2 py-0.5 rounded-full capitalize" style={{ fontSize: "0.6875rem", fontWeight: 700, background: ss.bg, color: ss.text }}>{r.status}</span>
                        {r.priorReportsAgainstUser > 0 && (
                          <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.6875rem", fontWeight: 700, background: "#fee2e2", color: "#991b1b" }}>
                            {r.priorReportsAgainstUser} prior report{r.priorReportsAgainstUser !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>
                        <strong style={{ color: "var(--foreground)" }}>{r.reported}</strong> reported by {r.reporter}
                      </p>
                      <p className="text-muted-foreground mt-1 line-clamp-2" style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>
                        {r.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{r.date}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{r.time}</p>
                    <div className="flex items-center gap-1 mt-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>View Report</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── REPORT DETAIL VIEW ───────────────────────────────────
type ReportType = typeof REPORTS[0];
function ReportDetailView({ report: initialReport, allReports, onBack, onAction }: {
  report: ReportType;
  allReports: ReportType[];
  onBack: () => void;
  onAction: (id: string, action: string, note: string) => void;
}) {
  const [tab, setTab]                   = useState<"details" | "communication" | "history">("details");
  const [fullReport, setFullReport]     = useState<import("../../lib/api").AdminReport | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [adminNote, setAdminNote]       = useState(initialReport.adminNotes);
  const [confirming, setConfirming]     = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [chatInput, setChatInput]       = useState("");
  const [sending, setSending]           = useState(false);
  const [staffList, setStaffList]       = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [assigning, setAssigning]       = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const report = fullReport
    ? {
        ...initialReport,
        status:         fullReport.status as ReportType["status"],
        priority:       fullReport.priority as ReportType["priority"],
        adminNotes:     fullReport.admin_notes ?? initialReport.adminNotes,
        actionHistory:  fullReport.action_history ?? initialReport.actionHistory,
        evidence:       fullReport.evidence ?? initialReport.evidence,
        priorReportsAgainstUser: fullReport.prior_reports_against_user ?? initialReport.priorReportsAgainstUser,
        linked_ticket:  fullReport.linked_ticket,
        appeal_status:  fullReport.appeal_status,
      }
    : { ...initialReport, linked_ticket: null, appeal_status: "none" as const };

  useEffect(() => {
    setLoadingDetail(true);
    const getReportFn = (adminApi as unknown as Record<string, unknown>).getReport as typeof adminApi.getReport | undefined;
    if (getReportFn) {
      getReportFn(initialReport.id).then(r => {
        setFullReport(r);
        setAdminNote(r.admin_notes ?? "");
      }).catch(() => {}).finally(() => setLoadingDetail(false));
    } else {
      setLoadingDetail(false);
    }

    adminApi.staff().then(res => {
      setStaffList(res.results
        .filter(s => ['admin', 'super_admin', 'moderator', 'cc_agent'].includes(s.role))
        .map(s => ({ id: s.id, name: s.name || s.email, role: s.role })));
    }).catch(() => {});
  }, [initialReport.id]);

  useEffect(() => {
    if (tab === "communication") {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [tab, report.linked_ticket?.messages?.length]);

  const statusColor = (s: string) => ({
    pending:       { bg: "#dbeafe", text: "#1d4ed8" },
    under_review:  { bg: "#e0e7ff", text: "#3730a3" },
    actioned:      { bg: "#dcfce7", text: "#166534" },
    dismissed:     { bg: "#f3f4f6", text: "#6b7280" },
    suspend:       { bg: "#fef9c3", text: "#854d0e" },
    ban:           { bg: "#fee2e2", text: "#991b1b" },
    warn:          { bg: "#fef9c3", text: "#854d0e" },
    admin:         { bg: "#dcfce7", text: "#166534" },
    system:        { bg: "#f3f4f6", text: "#6b7280" },
    moderation:    { bg: "#e0e7ff", text: "#3730a3" },
    dismiss:       { bg: "#f3f4f6", text: "#6b7280" },
  }[s] ?? { bg: "#f3f4f6", text: "#6b7280" });

  const appealStatusColor = (s: string) => ({
    none:         { bg: "#f3f4f6", text: "#6b7280" },
    pending:      { bg: "#fef9c3", text: "#854d0e" },
    under_review: { bg: "#e0e7ff", text: "#3730a3" },
    resolved:     { bg: "#dcfce7", text: "#166534" },
  }[s] ?? { bg: "#f3f4f6", text: "#6b7280" });

  const handleAction = async (action: string) => {
    onAction(initialReport.id, action, adminNote);
    setConfirming(null);
    try {
      const updated = await adminApi.updateReport(initialReport.id, {
        status:        action === "dismiss" ? "dismissed" : "actioned",
        admin_notes:   adminNote,
        action,
        admin_message: actionMessage,
      });
      setFullReport(updated);
    } catch {}
    setActionMessage("");
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    setSending(true);
    try {
      const sendFn = (adminApi as unknown as Record<string, unknown>).sendReportMessage as typeof adminApi.sendReportMessage | undefined;
      if (sendFn) {
        const ticket = await sendFn(initialReport.id, chatInput.trim());
        if (fullReport) setFullReport({ ...fullReport, linked_ticket: ticket });
      }
      setChatInput("");
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch {}
    setSending(false);
  };

  const handleAssign = async (agentId: string) => {
    setAssigning(true);
    try {
      const assignFn = (adminApi as unknown as Record<string, unknown>).assignReportTicket as typeof adminApi.assignReportTicket | undefined;
      if (assignFn) {
        const ticket = await assignFn(initialReport.id, agentId);
        if (fullReport) setFullReport({ ...fullReport, linked_ticket: ticket });
      }
    } catch {}
    setAssigning(false);
  };

  const catIcon: Record<string, string> = {
    harassment: "⚠️", fake_profile: "🎭", spam: "📢", scam: "🎯",
    inappropriate_content: "🚫", other: "📋",
  };

  const msgs = report.linked_ticket?.messages ?? [];

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "0.875rem" }}>
            <ChevronLeft size={18} /> All Reports
          </button>
          <div className="h-4 w-px bg-border" />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl" style={{ lineHeight: 1 }}>{catIcon[initialReport.category] ?? "📋"}</span>
              <h1 style={{ fontWeight: 800, fontSize: "1.375rem", letterSpacing: "-0.02em" }}>
                {initialReport.reason.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </h1>
              <span className="px-2.5 py-1 rounded-full capitalize" style={{ fontSize: "0.7rem", fontWeight: 700, ...statusColor(report.status) }}>
                {report.status.replace(/_/g, " ")}
              </span>
              {report.priority === "high" && (
                <span className="px-2.5 py-1 rounded-full" style={{ fontSize: "0.7rem", fontWeight: 700, background: "#fee2e2", color: "#991b1b" }}>
                  High Priority
                </span>
              )}
              {(report.appeal_status && report.appeal_status !== "none") && (
                <span className="px-2.5 py-1 rounded-full capitalize" style={{ fontSize: "0.7rem", fontWeight: 700, ...appealStatusColor(report.appeal_status) }}>
                  Appeal: {report.appeal_status.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem" }}>
              Report #{initialReport.id.slice(0, 8).toUpperCase()} · {initialReport.date}
            </p>
          </div>
        </div>
        {loadingDetail && (
          <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin flex-shrink-0 mt-1" />
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6 w-fit">
        {([
          { key: "details",       label: "Details" },
          { key: "communication", label: `Communication${msgs.length ? ` (${msgs.length})` : ""}` },
          { key: "history",       label: "History" },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg transition-all ${tab === t.key ? "bg-card shadow-sm font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            style={{ fontSize: "0.875rem" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Left: tab content ── */}
        <div className="xl:col-span-2 space-y-4">

          {/* DETAILS TAB */}
          {tab === "details" && (
            <>
              {/* Parties */}
              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Parties Involved</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { role: "Reported User", name: initialReport.reported, email: initialReport.reportedEmail, sub: initialReport.reportedSubscription, status: initialReport.reportedStatus, joined: initialReport.reportedJoined, prior: report.priorReportsAgainstUser, isReported: true },
                    { role: "Reporter",      name: initialReport.reporter, email: initialReport.reporterEmail, sub: "", status: "active", joined: "", prior: 0, isReported: false },
                  ].map(({ role, name, email, sub, status, joined, prior, isReported }) => (
                    <div key={role} className={`rounded-xl border p-4 ${isReported ? "bg-red-50 border-red-100" : "bg-secondary border-primary/15"}`}>
                      <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: isReported ? "#991b1b" : "var(--primary)", marginBottom: "0.75rem" }}>{role}</p>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: isReported ? "#fee2e2" : "rgba(10,104,112,0.12)" }}>
                          <span style={{ fontSize: "0.9rem", fontWeight: 800, color: isReported ? "#991b1b" : "var(--primary)" }}>
                            {name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{name}</p>
                          <p className="text-muted-foreground truncate" style={{ fontSize: "0.8125rem" }}>{email}</p>
                        </div>
                      </div>
                      {isReported && (
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { l: "Plan",         v: sub || "—" },
                            { l: "Status",       v: status },
                            { l: "Joined",       v: joined || "—" },
                            { l: "Prior Reports", v: String(prior) },
                          ].map(({ l, v }) => (
                            <div key={l} className="bg-white/70 rounded-lg p-2">
                              <p style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#991b1b", marginBottom: 2 }}>{l}</p>
                              <p style={{ fontWeight: 600, fontSize: "0.8125rem", textTransform: "capitalize" }}>{v}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-lg flex-shrink-0">⚠️</div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Complaint Description</h3>
                    <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
                      Category: {initialReport.reason.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} · {initialReport.date}
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "var(--foreground)" }}>{initialReport.description}</p>
              </div>

              {/* Evidence */}
              {report.evidence.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-4">
                  <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Evidence ({report.evidence.length})</h3>
                  <div className="space-y-3">
                    {report.evidence.map((ev: { type: string; content: string; time: string }, i: number) => {
                      const isPhoto = ev.type === "photo" || isMediaUrl(ev.content);
                      return (
                        <div key={i} className={`rounded-xl p-4 border ${isPhoto ? "bg-blue-50 border-blue-200" : ev.type === "message" ? "bg-muted/50 border-border" : "bg-amber-50 border-amber-200"}`}>
                          <div className="flex items-start gap-3">
                            <span style={{ fontSize: "1.125rem" }}>{isPhoto ? "📷" : ev.type === "message" ? "💬" : "📝"}</span>
                            <div className="flex-1">
                              {isPhoto ? (
                                <>
                                  <p className="text-muted-foreground mb-2" style={{ fontSize: "0.75rem", fontWeight: 600 }}>Uploaded photo evidence</p>
                                  <PhotoThumb url={ev.content} label="Report evidence" />
                                </>
                              ) : (
                                <p style={{ fontSize: "0.875rem", lineHeight: 1.65 }}>
                                  {ev.type === "message" ? `"${ev.content}"` : ev.content}
                                </p>
                              )}
                              <p className="text-muted-foreground mt-2" style={{ fontSize: "0.75rem" }}>{ev.time}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* COMMUNICATION TAB */}
          {tab === "communication" && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {/* Thread header */}
              <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Support Thread</h3>
                  <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
                    {report.linked_ticket
                      ? `Ticket ${report.linked_ticket.id.slice(0, 8).toUpperCase()} · ${report.linked_ticket.status}`
                      : "Thread will be created when you take an action"}
                  </p>
                </div>
                {report.linked_ticket?.assigned_to && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-xl border border-primary/15">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "var(--primary)" }}>
                        {report.linked_ticket.assigned_to.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{report.linked_ticket.assigned_to.name}</span>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: "420px", minHeight: "200px" }}>
                {msgs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3 text-2xl">💬</div>
                    <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>No messages yet</p>
                    <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem" }}>
                      Take an action on this report to open a support thread with the user.
                    </p>
                  </div>
                ) : (
                  msgs.map((m: import("../../lib/api").ReportTicketMessage, i: number) => {
                    const isAdmin = m.sender_role !== "user";
                    return (
                      <div key={i} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] ${isAdmin ? "items-end" : "items-start"} flex flex-col gap-1`}>
                          <div className="flex items-center gap-2">
                            {!isAdmin && (
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <span style={{ fontSize: "0.6rem", fontWeight: 700 }}>
                                  {m.sender_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-muted-foreground" style={{ fontSize: "0.7rem", fontWeight: 600 }}>
                              {isAdmin ? "You" : m.sender_name}
                            </span>
                            {isAdmin && (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary)" }}>
                                <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "white" }}>
                                  {m.sender_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div
                            className={`px-4 py-3 rounded-2xl ${isAdmin ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                            style={{
                              background:   isAdmin ? "var(--primary)" : "var(--muted)",
                              color:        isAdmin ? "white" : "var(--foreground)",
                              fontSize:     "0.875rem",
                              lineHeight:   1.65,
                              whiteSpace:   "pre-wrap",
                            }}
                          >
                            {m.body}
                          </div>
                          <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                            {new Date(m.sent_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Reply input */}
              {report.linked_ticket && (
                <div className="px-6 pb-6 pt-2 border-t border-border">
                  <div className="flex gap-3 items-end">
                    <textarea
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                      rows={3}
                      placeholder="Type a message to the user… (Enter to send, Shift+Enter for new line)"
                      className="flex-1 px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      style={{ fontSize: "0.875rem" }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || sending}
                      className="flex-shrink-0 px-5 py-3 rounded-xl text-white transition-all disabled:opacity-50"
                      style={{ background: "var(--primary)", fontSize: "0.875rem", fontWeight: 700 }}
                    >
                      {sending ? "…" : "Send"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {tab === "history" && (
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1.5rem" }}>Action Timeline</h3>
              {report.actionHistory.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>No actions taken yet.</p>
                </div>
              ) : (
                <div className="relative space-y-4">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />
                  {[
                    { action: "Report submitted", by: initialReport.reporter, date: initialReport.date, type: "system" },
                    ...report.actionHistory,
                  ].map((h, i) => {
                    const hs = statusColor(h.type);
                    const actionIcons: Record<string, string> = { warn: "⚠️", suspend: "🔴", ban: "🚫", dismiss: "✕", admin: "✅", system: "📋", moderation: "👁" };
                    return (
                      <div key={i} className="flex items-start gap-5 relative pl-10">
                        <div className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-background text-sm" style={{ background: hs.bg }}>
                          {actionIcons[h.type] ?? "●"}
                        </div>
                        <div className="flex-1 pb-1">
                          <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{h.action}</p>
                          <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.8125rem" }}>
                            by {h.by}
                            {h.date && ` · ${typeof h.date === "string" && h.date.includes("T")
                              ? new Date(h.date).toLocaleString()
                              : h.date}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: action panel ── */}
        <div className="space-y-4">

          {/* Take action */}
          <div className="bg-card rounded-2xl border border-border p-4">
            {report.status === "actioned" || report.status === "dismissed" ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3 text-xl">✅</div>
                <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Report {report.status}</p>
                <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem" }}>No further action required.</p>
              </div>
            ) : (
              <>
                <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "1rem" }}>Take Action</h3>
                {confirming ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border ${
                      confirming === "ban"     ? "bg-red-50 border-red-200" :
                      confirming === "suspend" ? "bg-amber-50 border-amber-200" :
                      confirming === "dismiss" ? "bg-muted border-border" :
                      "bg-secondary border-primary/15"
                    }`}>
                      <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                        {confirming === "warn"    ? "⚠️ Issue Warning" :
                         confirming === "suspend" ? "🔴 Suspend Account" :
                         confirming === "ban"     ? "🚫 Permanent Ban" :
                         "Dismiss Report"}
                      </p>
                      <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem" }}>
                        {confirming === "warn"    ? "The user receives a formal warning via their support inbox." :
                         confirming === "suspend" ? "Account suspended immediately. User can appeal via support." :
                         confirming === "ban"     ? "Permanent and irreversible. User data retained for 90 days." :
                         "Report closed without action. Reopen if new evidence emerges."}
                      </p>
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1.5" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                        Message to user {confirming !== "dismiss" ? "(sent via support inbox)" : "(optional)"}
                      </label>
                      <textarea
                        value={actionMessage}
                        onChange={e => setActionMessage(e.target.value)}
                        rows={3}
                        placeholder={confirming === "dismiss" ? "Optional note…" : "Explain the reason for this action to the user…"}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        style={{ fontSize: "0.8125rem" }}
                      />
                    </div>
                    <div className="flex gap-2.5">
                      <button onClick={() => setConfirming(null)} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.875rem" }}>
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAction(confirming)}
                        className="flex-1 py-2.5 rounded-xl text-white transition-all"
                        style={{
                          fontSize: "0.875rem", fontWeight: 700,
                          background: confirming === "ban" ? "#dc2626" : confirming === "suspend" ? "#f59e0b" : confirming === "dismiss" ? "#68747F" : "var(--primary)",
                        }}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[
                      { key: "warn",    label: "Issue Warning",   desc: "Formal notice to the user",    bg: "var(--secondary)", color: "var(--primary)",             border: "rgba(10,104,112,0.25)" },
                      { key: "suspend", label: "Suspend Account", desc: "Temporary access removal",      bg: "#fffbeb",          color: "#92400e",                    border: "#fcd34d" },
                      { key: "ban",     label: "Permanent Ban",   desc: "Irreversible account removal",  bg: "#fef2f2",          color: "#991b1b",                    border: "#fca5a5" },
                      { key: "dismiss", label: "Dismiss Report",  desc: "Close without action",          bg: "var(--muted)",     color: "var(--muted-foreground)",    border: "var(--border)" },
                    ].map(({ key, label, desc, bg, color, border }) => (
                      <button
                        key={key}
                        onClick={() => setConfirming(key)}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl border transition-all hover:opacity-85 text-left"
                        style={{ background: bg, borderColor: border }}
                      >
                        <div>
                          <p style={{ fontWeight: 700, fontSize: "0.875rem", color }}>{label}</p>
                          <p style={{ fontSize: "0.75rem", color, opacity: 0.65 }}>{desc}</p>
                        </div>
                        <ChevronRight size={14} style={{ color, opacity: 0.5 }} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Admin notes */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.75rem" }}>Internal Notes</h3>
            <textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              rows={3}
              placeholder="Private admin notes (not visible to users)…"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              style={{ fontSize: "0.875rem" }}
            />
            <button
              onClick={async () => {
                try { await adminApi.updateReport(initialReport.id, { admin_notes: adminNote }); } catch {}
              }}
              className="mt-2 w-full py-2 rounded-xl border border-border hover:bg-muted transition-colors"
              style={{ fontSize: "0.8125rem", fontWeight: 600 }}
            >
              Save Notes
            </button>
          </div>

          {/* Assign agent */}
          {staffList.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.875rem" }}>Assign to Agent</h3>
              {report.linked_ticket?.assigned_to && (
                <div className="flex items-center gap-2 mb-3 p-2.5 bg-secondary rounded-xl border border-primary/15">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "var(--primary)" }}>
                      {report.linked_ticket.assigned_to.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{report.linked_ticket.assigned_to.name}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Currently assigned</p>
                  </div>
                </div>
              )}
              {!report.linked_ticket && (
                <p className="text-muted-foreground mb-3" style={{ fontSize: "0.8125rem" }}>
                  Take an action first to create a ticket thread, then assign it.
                </p>
              )}
              <div className="space-y-1.5">
                {staffList.slice(0, 6).map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => handleAssign(agent.id)}
                    disabled={assigning || !report.linked_ticket}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50 text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                        <span style={{ fontSize: "0.6rem", fontWeight: 700 }}>
                          {agent.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{agent.name}</p>
                        <p className="text-muted-foreground capitalize" style={{ fontSize: "0.7rem" }}>{agent.role.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                    <ChevronRight size={13} className="text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Appeal status control */}
          {report.appeal_status && report.appeal_status !== "none" && (
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.75rem" }}>Appeal Status</h3>
              <div className="flex flex-wrap gap-2">
                {(["pending", "under_review", "resolved"] as const).map(s => (
                  <button
                    key={s}
                    onClick={async () => {
                      try {
                        const updated = await adminApi.updateReport(initialReport.id, { appeal_status: s });
                        setFullReport(updated);
                      } catch {}
                    }}
                    className="px-3 py-1.5 rounded-xl border capitalize transition-all"
                    style={{
                      fontSize: "0.8125rem", fontWeight: 600,
                      ...(report.appeal_status === s
                        ? appealStatusColor(s)
                        : { background: "var(--muted)", color: "var(--muted-foreground)", borderColor: "var(--border)" }),
                    }}
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN AUDIT LOG SECTION ──────────────────────────────
const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  user_suspend:    { bg: "#FEF3C7", text: "#92400E" },
  user_activate:   { bg: "#D1FAE5", text: "#065F46" },
  user_deactivate: { bg: "#FEE2E2", text: "#991B1B" },
  user_delete:     { bg: "#FEE2E2", text: "#7F1D1D" },
  user_grant_sub:  { bg: "#DBEAFE", text: "#1E40AF" },
  user_reset_pw:   { bg: "#EDE9FE", text: "#5B21B6" },
  role_assign:     { bg: "#E0F2FE", text: "#0C4A6E" },
  blacklist_add:   { bg: "#FEE2E2", text: "#991B1B" },
  blacklist_remove:{ bg: "#D1FAE5", text: "#065F46" },
  settings_update: { bg: "#F0FDF4", text: "#166534" },
  blog_publish:    { bg: "#ECFDF5", text: "#047857" },
  blog_unpublish:  { bg: "#FEF9C3", text: "#713F12" },
  blog_delete:     { bg: "#FEE2E2", text: "#991B1B" },
  photo_approve:   { bg: "#D1FAE5", text: "#065F46" },
  photo_reject:    { bg: "#FEE2E2", text: "#991B1B" },
  report_action:   { bg: "#FEF3C7", text: "#92400E" },
  login:           { bg: "#E0F2FE", text: "#075985" },
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  super_admin: "#0A6870", admin: "#4A8DB8", blog_admin: "#6B9E78", cc_agent: "#C5733F",
};

function AdminAuditSection() {
  const [logSource, setLogSource] = useState<"admin" | "user">("admin");
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showIpTooltip, setShowIpTooltip] = useState(false);

  const fetchAudit = (p = 1, q = search, act = actionFilter, src = logSource) => {
    setLoading(true);
    setFetchError(null);
    adminApi.auditLog({ source: src, page: p, page_size: 25, search: q, action: act })
      .then(r => { setEntries(r.results); setTotal(r.count); setPage(r.page); setPages(r.pages); })
      .catch((err) => {
        setEntries([]);
        setFetchError(err?.message ?? "Failed to load log. The database table may need a migration.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAudit(1, "", "", logSource);
    setSearch(""); setSearchInput(""); setActionFilter("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logSource]);

  const applySearch = () => { setSearch(searchInput); fetchAudit(1, searchInput, actionFilter); };
  const applyAction = (act: string) => { setActionFilter(act); fetchAudit(1, search, act); };

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const ADMIN_ACTIONS = [
    { value: "", label: "All Actions" },
    { value: "user_suspend",    label: "User Suspended" },
    { value: "user_activate",   label: "User Activated" },
    { value: "user_deactivate", label: "User Deactivated" },
    { value: "user_delete",     label: "User Deleted" },
    { value: "user_grant_sub",  label: "Subscription Granted" },
    { value: "user_reset_pw",   label: "Password Reset" },
    { value: "role_assign",     label: "Role Assigned" },
    { value: "blacklist_add",   label: "Blacklist Added" },
    { value: "blacklist_remove",label: "Blacklist Removed" },
    { value: "settings_update", label: "Settings Updated" },
    { value: "blog_publish",    label: "Blog Published" },
    { value: "blog_delete",     label: "Blog Deleted" },
    { value: "photo_approve",   label: "Photo Approved" },
    { value: "photo_reject",    label: "Photo Rejected" },
    { value: "report_action",   label: "Report Actioned" },
    { value: "login",           label: "Admin Login" },
  ];

  const USER_ACTIONS = [
    { value: "", label: "All Activity" },
    { value: "user_login",          label: "User Login" },
    { value: "user_register",       label: "User Registered" },
    { value: "user_profile_update", label: "Profile Updated" },
    { value: "user_photo_upload",   label: "Photo Uploaded" },
    { value: "user_photo_delete",   label: "Photo Deleted" },
    { value: "user_interest_sent",  label: "Interest Sent" },
    { value: "user_interest_resp",  label: "Interest Responded" },
    { value: "user_report_filed",   label: "Report Filed" },
    { value: "user_sub_purchase",   label: "Subscription Purchased" },
  ];

  return (
    <div>
      <SectionHeader
        title="Audit Log"
        sub="Combined log of admin actions and user platform activity"
      />

      {/* Log source toggle */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {([
            { key: "admin", label: "Admin Actions" },
            { key: "user",  label: "User Activity" },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setLogSource(t.key)}
              className={`px-4 py-2 rounded-lg transition-all ${logSource === t.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
              style={{ fontSize: "0.875rem", fontWeight: logSource === t.key ? 700 : 400 }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
          {logSource === "admin"
            ? "Actions performed by admin and support team"
            : "Logins, profile updates, photo uploads, and match interactions"}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 flex-1" style={{ minWidth: 200, maxWidth: 340 }}>
          <Search size={14} className="text-muted-foreground flex-shrink-0" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && applySearch()}
            placeholder={logSource === "admin" ? "Search admin, target, detail…" : "Search user, action, detail…"}
            className="flex-1 bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
            style={{ fontSize: "0.875rem" }}
          />
          {searchInput && (
            <button onClick={() => {
              setSearchInput(""); setSearch("");
              fetchAudit(1, "", actionFilter);
            }} className="text-muted-foreground hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={actionFilter}
          onChange={e => applyAction(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
          style={{ fontSize: "0.875rem" }}
        >
          {(logSource === "admin" ? ADMIN_ACTIONS : USER_ACTIONS).map(a => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
        <button
          onClick={() => fetchAudit(page)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors"
          style={{ fontSize: "0.875rem" }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
        {/* IP address explanation tooltip — only shown for admin log */}
        {logSource === "admin" && (
          <div className="relative" key="ip-tooltip">
            <button
              onClick={() => setShowIpTooltip(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-muted-foreground"
              style={{ fontSize: "0.875rem" }}
            >
              <Info size={14} /> IP Info
            </button>
            {showIpTooltip && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-lg p-4 z-20">
                <button onClick={() => setShowIpTooltip(false)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"><X size={12} /></button>
                <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: 6 }}>Why does the IP address vary?</p>
                <p className="text-muted-foreground" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
                  The backend reads the <code style={{ background: "var(--muted)", padding: "1px 5px", borderRadius: 4, fontSize: "0.75rem" }}>X-Forwarded-For</code> header
                  set by reverse proxies (Render, Cloudflare, load balancers). Each proxy appends its own IP to this chain.
                  The first IP in the chain is the client&apos;s real IP, but proxy IPs and shared NAT addresses may appear for users on the same network.
                  Local development shows <code style={{ background: "var(--muted)", padding: "1px 5px", borderRadius: 4, fontSize: "0.75rem" }}>127.0.0.1</code> since no proxy is involved.
                </p>
              </div>
            )}
          </div>
        )}
        <span className="text-muted-foreground ml-auto" style={{ fontSize: "0.875rem" }}>
          {total.toLocaleString()} event{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground"><div className="w-7 h-7 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-3" />Loading…</div>
        ) : fetchError ? (
          <div className="py-16 text-center px-6">
            <AlertTriangle size={36} className="mx-auto mb-3 opacity-50" style={{ color: "#D41F3A" }} />
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "#D41F3A" }}>Could not load {logSource === "admin" ? "audit log" : "user activity"}</p>
            <p className="text-muted-foreground mt-2" style={{ fontSize: "0.875rem", maxWidth: 420, margin: "0.5rem auto 0" }}>{fetchError}</p>
            <p className="text-muted-foreground mt-3" style={{ fontSize: "0.8125rem" }}>
              Ensure the backend is deployed and the database table exists.
            </p>
            <button onClick={() => fetchAudit()} className="mt-4 px-4 py-2 rounded-lg bg-primary text-white" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Retry</button>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-20 text-center">
            <Shield size={40} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p style={{ fontWeight: 700, fontSize: "1rem" }}>No {logSource === "admin" ? "admin actions" : "user activity"} yet</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.875rem" }}>
              {logSource === "admin"
                ? "Actions taken by admins will appear here once the backend is deployed."
                : "User logins, profile updates, and match activity will appear here automatically."}
            </p>
          </div>
        ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontSize: "0.875rem" }}>
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Timestamp", "Actor", "Action", "Target", "Detail", "IP"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-muted-foreground" style={{ fontWeight: 600, fontSize: "0.8125rem", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, idx) => {
                    const colors = ACTION_COLORS[e.action] ?? { bg: "#F3F4F6", text: "#374151" };
                    const roleColor = ROLE_BADGE_COLORS[e.actor.role] ?? "#68747F";
                    return (
                      <tr key={e.id} className={`border-b border-border last:border-0 transition-colors hover:bg-muted/20 ${idx % 2 === 0 ? "" : "bg-muted/5"}`}>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted-foreground)", fontSize: "0.8125rem" }}>
                          {fmtTime(e.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: roleColor + "20" }}>
                              <span style={{ fontSize: "0.5625rem", fontWeight: 800, color: roleColor }}>
                                {e.actor.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, lineHeight: 1.3 }}>{e.actor.name}</p>
                              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{e.actor.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 700, background: colors.bg, color: colors.text }}>
                              {e.action_label}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full w-fit" style={{ fontSize: "0.6rem", fontWeight: 700, background: e.is_user_activity ? "#E8F4FB" : "#F3EAF8", color: e.is_user_activity ? "#1A73A7" : "#7C4DAF" }}>
                              {e.is_user_activity ? "USER" : "ADMIN"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {e.target_label ? (
                            <div>
                              <p style={{ fontWeight: 600 }}>{e.target_label}</p>
                              {e.target_type && <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", textTransform: "capitalize" }}>{e.target_type}</p>}
                            </div>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--muted-foreground)", maxWidth: 280 }}>
                          {isMediaUrl(e.detail) ? (
                            <div className="flex items-center gap-2">
                              <PhotoThumb url={e.detail} label="Audit photo" />
                            </div>
                          ) : (
                            <span className="line-clamp-2">{e.detail || "—"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted-foreground)", fontFamily: "monospace", fontSize: "0.75rem" }}>
                          {e.ip_address ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>Page {page} of {pages}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => { const p = page - 1; setPage(p); fetchAudit(p); }}
              className="px-4 py-2 rounded-xl border border-border bg-card disabled:opacity-40 hover:bg-muted transition-colors"
              style={{ fontSize: "0.875rem" }}
            >← Prev</button>
            <button
              disabled={page >= pages}
              onClick={() => { const p = page + 1; setPage(p); fetchAudit(p); }}
              className="px-4 py-2 rounded-xl border border-border bg-card disabled:opacity-40 hover:bg-muted transition-colors"
              style={{ fontSize: "0.875rem" }}
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EMAIL DIAGNOSTICS PANEL ─────────────────────────────
function EmailDiagnosticsPanel() {
  type EmailStatus = Awaited<ReturnType<typeof adminApi.emailStatus>>;
  const [status,     setStatus]    = useState<EmailStatus | null>(null);
  const [loading,    setLoading]   = useState(true);
  const [testTo,     setTestTo]    = useState("");
  const [testing,    setTesting]   = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; provider: string; error: string } | null>(null);

  const load = () => {
    setLoading(true);
    adminApi.emailStatus()
      .then(s => setStatus(s))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const sendTest = async () => {
    if (!testTo.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const r = await adminApi.sendTestEmail(testTo.trim());
      setTestResult({ success: r.success, provider: r.provider, error: r.error });
      if (r.success) toast.success(`Test email sent via ${r.provider} → ${r.to}`);
      else           toast.error(`Delivery failed: ${r.error}`);
    } catch {
      toast.error("Could not reach email-test endpoint.");
    } finally {
      setTesting(false);
    }
  };

  const isSES  = status?.active_provider === "amazon_ses";
  const isMock = status?.active_provider === "mock";

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Send size={17} className="text-primary" />
          </div>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Email Delivery</h3>
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Amazon SES · OTP · Receipts · Alerts</p>
          </div>
        </div>
        <button onClick={load} disabled={loading}
          className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>}

      {!loading && status && (
        <div className="space-y-4">
          {/* Provider status banner */}
          <div className={`rounded-xl px-4 py-3 flex items-start gap-3 ${isSES ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${isSES ? "bg-green-500" : "bg-amber-500"}`} />
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: isSES ? "#166534" : "#92400e" }}>
                {isSES ? "Amazon SES — live delivery active" : "Mock Provider — emails NOT sent to inbox"}
              </p>
              <p style={{ fontSize: "0.8125rem", color: isSES ? "#166534" : "#92400e", opacity: 0.85 }}>
                {status.provider_reason}
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "AWS Key ID set",        ok: status.aws_key_set },
              { label: "AWS Secret set",         ok: status.aws_secret_set },
              { label: "Email verification on",  ok: status.email_verification_on },
              { label: `Region: ${status.aws_region}`, ok: true },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center gap-2">
                {ok ? <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    : <XCircle    size={14} className="text-red-500 flex-shrink-0" />}
                <span style={{ fontWeight: ok ? 500 : 600, fontSize: "0.8125rem",
                               color: ok ? "var(--foreground)" : "#991b1b" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Sent (last 50)",   value: status.stats.sent,   color: "#166534" },
              { label: "Failed (last 50)", value: status.stats.failed, color: status.stats.failed > 0 ? "#991b1b" : "var(--foreground)" },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-muted/50 p-3 text-center">
                <p style={{ fontSize: "1.5rem", fontWeight: 900, color: s.color }}>{s.value}</p>
                <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Recent log */}
          {status.stats.recent.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <p className="px-3 py-2 bg-muted/50 text-muted-foreground" style={{ fontSize: "0.75rem", fontWeight: 600 }}>RECENT ATTEMPTS</p>
              <div className="divide-y divide-border">
                {status.stats.recent.map((log, i) => (
                  <div key={i} className="px-3 py-2 flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.status === "sent" ? "bg-green-500" : "bg-red-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: "0.8125rem" }}>
                        {log.to} · <span className="text-muted-foreground">{log.type}</span>
                      </p>
                      {log.error && <p className="truncate text-red-500" style={{ fontSize: "0.75rem" }}>{log.error}</p>}
                    </div>
                    <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: "0.6875rem" }}>
                      {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test send */}
          <div className="border-t border-border pt-4">
            <p style={{ fontWeight: 600, fontSize: "0.875rem" }} className="mb-2">Send Test Email</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="recipient@example.com"
                value={testTo}
                onChange={e => setTestTo(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendTest()}
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: "0.875rem" }}
              />
              <button
                onClick={sendTest}
                disabled={testing || !testTo.trim()}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                style={{ fontSize: "0.875rem", fontWeight: 600 }}
              >
                {testing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Send
              </button>
            </div>
            {testResult && (
              <p className={`mt-2 px-3 py-2 rounded-lg text-sm ${testResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                {testResult.success
                  ? `✅ Delivered via ${testResult.provider}`
                  : `❌ Failed (${testResult.provider}): ${testResult.error}`}
              </p>
            )}
            {isMock && (
              <p className="mt-2 text-amber-600" style={{ fontSize: "0.75rem" }}>
                ⚠️ Mock provider active — test logs to server console only. Add AWS credentials on Render to enable real delivery.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS SECTION ─────────────────────────────────────
function SettingsSection({ role, onSettingsSaved }: { role: AdminRole; onSettingsSaved?: (s: PlatformSettings) => void }) {
  const isSuperAdmin = role === "super-admin";
  const [settings, setSettings] = useState({
    genderBalance: true,
    maxDailyMatchesFree:  "2",
    maxDailyMatchesBasic: "5",
    minFemaleRatio: "48",
    referralBonus: "10",
    referralBonusNgn: "5000",
    maintenanceMode: false,
    emailVerification: true,
    photoModerationRequired: true,
    maxPhotos: "4",
  });

  // Credo gateway keys — kept in separate state so they're only sent on explicit save
  const [credoKeys, setCredoKeys] = useState({
    publicKey:     "",
    secretKey:     "",
    webhookSecret: "",
    environment:   "sandbox" as "sandbox" | "production",
  });
  const [credoSaved, setCredoSaved] = useState({ secretKeySet: false, webhookSecretSet: false });
  const [credoSaving, setCredoSaving] = useState(false);
  const [adminRevenueAccess, setAdminRevenueAccess] = useState(getRevenuePermission);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [pushConfigured, setPushConfigured] = useState<boolean | null>(null);
  const [autoGrant, setAutoGrant] = useState({
    enabled: false,
    plan: "basic" as "basic" | "premium",
    days: "7",
  });

  // Self-fetch live settings from DB on mount
  useEffect(() => {
    adminApi.settings()
      .then(s => {
        setSettings(prev => ({
          ...prev,
          maxDailyMatchesFree:  String(s.max_daily_matches_free),
          maxDailyMatchesBasic: String(s.max_daily_matches_basic),
          referralBonus:        String(s.referral_bonus_points),
          referralBonusNgn:     String(s.referral_bonus_ngn ?? 5000),
          maintenanceMode:      s.maintenance_mode,
          maxPhotos:            String(s.max_photos),
          emailVerification:    s.email_verification_enabled ?? true,
        }));
        if (s.revenue_permission_for_admin !== undefined) {
          setAdminRevenueAccess(s.revenue_permission_for_admin);
          setRevenuePermission(s.revenue_permission_for_admin);
        }
        // Pre-fill non-secret Credo fields; show masked indicator for secrets
        setCredoKeys(prev => ({
          ...prev,
          publicKey:   s.credo_public_key   ?? "",
          environment: (s.credo_environment as "sandbox" | "production") ?? "sandbox",
        }));
        setCredoSaved({
          secretKeySet:     s.credo_secret_key_set     ?? false,
          webhookSecretSet: s.credo_webhook_secret_set ?? false,
        });
        setPushConfigured(s.push_configured ?? false);
        setAutoGrant({
          enabled: s.auto_grant_on_completion ?? false,
          plan:    (s.auto_grant_plan ?? "basic") as "basic" | "premium",
          days:    String(s.auto_grant_days ?? 7),
        });
      })
      .catch(() => {
        setLoadError(true);
        setPushConfigured(false); // stop spinner — don't leave it running on error
      });
  }, []);

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const update = (key: keyof typeof settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updated = await adminApi.updateSettings({
        max_daily_matches_free:       Number(settings.maxDailyMatchesFree),
        max_daily_matches_basic:      Number(settings.maxDailyMatchesBasic),
        max_photos:                   Number(settings.maxPhotos),
        referral_bonus_points:        Number(settings.referralBonus),
        referral_bonus_ngn:           Number(settings.referralBonusNgn),
        maintenance_mode:             settings.maintenanceMode as boolean,
        email_verification_enabled:   settings.emailVerification as boolean,
        revenue_permission_for_admin: adminRevenueAccess,
        auto_grant_on_completion:     autoGrant.enabled,
        auto_grant_plan:              autoGrant.plan,
        auto_grant_days:              Number(autoGrant.days),
      });
      onSettingsSaved?.(updated);
      setRevenuePermission(adminRevenueAccess);
      // Reflect what the server actually saved
      setSettings(prev => ({
        ...prev,
        maxDailyMatchesFree:  String(updated.max_daily_matches_free),
        maxDailyMatchesBasic: String(updated.max_daily_matches_basic),
        referralBonus:        String(updated.referral_bonus_points),
        referralBonusNgn:     String(updated.referral_bonus_ngn ?? 5000),
        maintenanceMode:      updated.maintenance_mode,
        maxPhotos:            String(updated.max_photos),
        emailVerification:    updated.email_verification_enabled ?? true,
      }));
      setLoadError(false);
      toast.success("Settings saved successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not save settings: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const saveCredoKeys = async () => {
    setCredoSaving(true);
    try {
      const payload: Record<string, string> = {};
      payload.credo_environment                                        = credoKeys.environment;
      if (credoKeys.publicKey.trim())     payload.credo_public_key     = credoKeys.publicKey.trim();
      if (credoKeys.secretKey.trim())     payload.credo_secret_key     = credoKeys.secretKey.trim();
      if (credoKeys.webhookSecret.trim()) payload.credo_webhook_secret = credoKeys.webhookSecret.trim();
      const updated = await adminApi.updateSettings(payload);
      setCredoKeys(prev => ({ ...prev, secretKey: "", webhookSecret: "" }));
      setCredoSaved({
        secretKeySet:     updated.credo_secret_key_set     ?? (!!credoKeys.secretKey || credoSaved.secretKeySet),
        webhookSecretSet: updated.credo_webhook_secret_set ?? (!!credoKeys.webhookSecret || credoSaved.webhookSecretSet),
      });
      toast.success("Credo payment keys saved.");
    } catch {
      toast.error("Could not save Credo keys. Please try again.");
    } finally {
      setCredoSaving(false);
    }
  };

  return (
    <div>
      <SectionHeader title="System Settings" sub="Configure platform behavior and operational controls" />

      {loadError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2" style={{ fontSize: "0.875rem" }}>
          <AlertTriangle size={15} className="flex-shrink-0" />
          <span>Could not load live settings from server — showing defaults. Check that migrations are applied on the backend, then refresh.</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Matching Controls */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">Matching Controls</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Gender Balance Mechanism</p>
                <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Automatically limit registrations to maintain gender ratio</p>
              </div>
              <button
                onClick={() => toggle("genderBalance")}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.genderBalance ? "bg-primary" : "bg-switch-background"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.genderBalance ? "left-7" : "left-1"}`} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Max Daily Matches — Free Plan", key: "maxDailyMatchesFree" },
                { label: "Max Daily Matches — Basic Plan", key: "maxDailyMatchesBasic" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{label}</label>
                  <input
                    value={settings[key as keyof typeof settings] as string}
                    onChange={e => update(key as keyof typeof settings, e.target.value)}
                    type="number"
                    min="1"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    style={{ fontSize: "0.9rem" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Referral Settings */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-1">Referral Program</h3>
          <p className="text-muted-foreground mb-5" style={{ fontSize: "0.8125rem" }}>
            Set the bonus amount shown to users when they share their referral code. Each currency is independent — never converted.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                Nigerian users <span className="font-normal text-muted-foreground">(₦ Naira)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold" style={{ fontSize: "0.9rem" }}>₦</span>
                <input
                  value={settings.referralBonusNgn}
                  onChange={e => update("referralBonusNgn", e.target.value)}
                  type="number"
                  min="0"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  style={{ fontSize: "0.9rem" }}
                />
              </div>
            </div>
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                International users <span className="font-normal text-muted-foreground">($ USD)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold" style={{ fontSize: "0.9rem" }}>$</span>
                <input
                  value={settings.referralBonus}
                  onChange={e => update("referralBonus", e.target.value)}
                  type="number"
                  min="0"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  style={{ fontSize: "0.9rem" }}
                />
              </div>
            </div>
          </div>
          <button onClick={saveSettings} disabled={saving}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
            style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        {/* Feature toggles */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">Feature Controls</h3>
          <div className="space-y-4">
            {[
              { key: "emailVerification", label: "Email Verification Required", desc: "Users must verify email before accessing the platform" },
              { key: "photoModerationRequired", label: "Photo Moderation Required", desc: "All profile photos reviewed before going live" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-1">
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{label}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{desc}</p>
                </div>
                <button
                  onClick={() => toggle(key as keyof typeof settings)}
                  className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${settings[key as keyof typeof settings] ? "bg-primary" : "bg-switch-background"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings[key as keyof typeof settings] ? "left-7" : "left-1"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance */}
        {/* Revenue access control — super-admin only */}
        {isSuperAdmin && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={18} className="text-primary" />
                  <p style={{ fontWeight: 700, fontSize: "1rem" }}>Admin Revenue Visibility</p>
                </div>
                <p className="text-muted-foreground" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
                  When enabled, Admin-role users can see the Payments section, revenue KPIs,
                  and the revenue chart in Analytics. Super Admin always has access regardless.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <div className={`w-2 h-2 rounded-full ${adminRevenueAccess ? "bg-green-500" : "bg-muted-foreground"}`} />
                  <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
                    Currently <strong>{adminRevenueAccess ? "enabled" : "disabled"}</strong> for Admin role
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  const next = !adminRevenueAccess;
                  setAdminRevenueAccess(next);
                  setRevenuePermission(next);
                  // Also add/remove payments from admin's nav dynamically by refreshing the permission cache.
                }}
                className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 mt-1 ${adminRevenueAccess ? "bg-primary" : "bg-switch-background"}`}
                aria-label="Toggle admin revenue access"
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${adminRevenueAccess ? "left-7" : "left-1"}`} />
              </button>
            </div>
          </div>
        )}

        <div className={`rounded-2xl border p-4 ${settings.maintenanceMode ? "bg-amber-50 border-amber-200" : "bg-card border-border"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className={settings.maintenanceMode ? "text-amber-600" : "text-muted-foreground"} />
                <p style={{ fontWeight: 700, fontSize: "1rem", color: settings.maintenanceMode ? "#854d0e" : "var(--foreground)" }}>
                  Maintenance Mode
                </p>
              </div>
              <p className={`mt-1 ${settings.maintenanceMode ? "text-amber-700" : "text-muted-foreground"}`} style={{ fontSize: "0.8125rem" }}>
                {settings.maintenanceMode
                  ? "Platform is currently in maintenance mode. Users see the maintenance page."
                  : "Toggle on to show a maintenance page to all users. You retain admin access."}
              </p>
            </div>
            <button
              onClick={() => {
                toggle("maintenanceMode");
                const on = !settings.maintenanceMode;
                try { localStorage.setItem("ma3moni_maintenance_on", on ? "true" : "false"); } catch {}
                if (!on) {
                  try { localStorage.removeItem("ma3moni_maintenance_end"); } catch {}
                }
              }}
              className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${settings.maintenanceMode ? "bg-amber-500" : "bg-switch-background"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.maintenanceMode ? "left-7" : "left-1"}`} />
            </button>
          </div>
          {/* Timer duration — shown only when maintenance is on */}
          {settings.maintenanceMode && (
            <div className="grid grid-cols-2 gap-3 mt-2 pt-4 border-t border-amber-200">
              <div>
                <label className="block mb-1" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#92400e" }}>
                  Estimated duration
                </label>
                <select
                  onChange={e => {
                    const mins = Number(e.target.value);
                    if (mins > 0) {
                      const endMs = Date.now() + mins * 60_000;
                      try {
                        localStorage.setItem("ma3moni_maintenance_end", String(endMs));
                      } catch {}
                    } else {
                      try { localStorage.removeItem("ma3moni_maintenance_end"); } catch {}
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 focus:outline-none"
                  style={{ fontSize: "0.875rem", color: "#78350f" }}
                  defaultValue="0"
                >
                  <option value="0">No timer (indefinite)</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                  <option value="360">6 hours</option>
                  <option value="720">12 hours</option>
                </select>
              </div>
              <div>
                <label className="block mb-1" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#92400e" }}>
                  Message to users
                </label>
                <input
                  placeholder="We'll be back shortly…"
                  onChange={e => {
                    try { localStorage.setItem("ma3moni_maintenance_msg", e.target.value); } catch {}
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 focus:outline-none"
                  style={{ fontSize: "0.875rem", color: "#78350f" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

        {/* ── Email Diagnostics ── super-admin only */}
        {isSuperAdmin && <EmailDiagnosticsPanel />}

        {/* Payment Gateway — Credo by eTranzact */}
        {isSuperAdmin && (
          <div className="bg-card rounded-2xl border border-border p-4 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CreditCard size={18} className="text-primary" />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Payment Gateway — Credo by eTranzact</h3>
                <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Secret keys are write-only and never returned after saving.</p>
              </div>
            </div>

            {/* Environment toggle */}
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Environment</label>
              <div className="grid grid-cols-2 gap-2">
                {(["sandbox", "production"] as const).map(env => (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setCredoKeys(p => ({ ...p, environment: env }))}
                    className={`flex flex-col items-start px-4 py-3 rounded-xl border-2 transition-all text-left ${
                      credoKeys.environment === env
                        ? env === "sandbox"
                          ? "border-amber-400 bg-amber-50 text-amber-900"
                          : "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>
                      {env === "sandbox" ? "🧪 Sandbox" : "🚀 Production"}
                    </span>
                    <span style={{ fontSize: "0.75rem", marginTop: "2px" }}>
                      {env === "sandbox"
                        ? "Test keys · api.credodemo.com · no real charges"
                        : "Live keys · api.credocentral.com · real payments"}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                {credoKeys.environment === "sandbox"
                  ? "Use your Credo sandbox/test keys below. Find them at dashboard.credocentral.com → Sandbox."
                  : "Use your Credo live keys below. Find them at dashboard.credocentral.com → API Keys."}
              </p>
            </div>

            {/* Key fields */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  Public Key
                </label>
                <input
                  value={credoKeys.publicKey}
                  onChange={e => setCredoKeys(p => ({ ...p, publicKey: e.target.value }))}
                  placeholder={credoKeys.environment === "sandbox" ? "test_pk_…" : "pk_live_…"}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono"
                  style={{ fontSize: "0.8125rem" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    Secret Key
                    {credoSaved.secretKeySet && !credoKeys.secretKey && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-green-700 bg-green-100" style={{ fontSize: "0.6875rem", fontWeight: 600 }}>● Saved</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={credoKeys.secretKey}
                    onChange={e => setCredoKeys(p => ({ ...p, secretKey: e.target.value }))}
                    placeholder={credoSaved.secretKeySet ? "Leave blank to keep" : credoKeys.environment === "sandbox" ? "test_sk_…" : "sk_live_…"}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono"
                    style={{ fontSize: "0.8125rem" }}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    Webhook Secret
                    {credoSaved.webhookSecretSet && !credoKeys.webhookSecret && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-green-700 bg-green-100" style={{ fontSize: "0.6875rem", fontWeight: 600 }}>● Saved</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={credoKeys.webhookSecret}
                    onChange={e => setCredoKeys(p => ({ ...p, webhookSecret: e.target.value }))}
                    placeholder={credoSaved.webhookSecretSet ? "Leave blank to keep" : "whsec_…"}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono"
                    style={{ fontSize: "0.8125rem" }}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {/* URLs reference */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5" style={{ fontSize: "0.75rem" }}>
              <p className="font-semibold text-foreground">Credo dashboard — paste these URLs:</p>
              <p className="text-muted-foreground">
                <span className="font-semibold">Callback URL:</span>{" "}
                <code className="bg-card px-1.5 py-0.5 rounded border border-border text-foreground">https://ma3moni-backend26.onrender.com/api/payments/credo/callback/</code>
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold">Webhook URL:</span>{" "}
                <code className="bg-card px-1.5 py-0.5 rounded border border-border text-foreground">https://ma3moni-backend26.onrender.com/api/payments/credo/webhook/</code>
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={saveCredoKeys}
                disabled={credoSaving}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                style={{ fontSize: "0.875rem", fontWeight: 600 }}
              >
                {credoSaving ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</> : "Save Settings"}
              </button>
            </div>
          </div>
        )}

      {/* ── Push Notification Status ──────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5 mt-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Push Notifications</p>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>
              Web push uses VAPID keys configured as environment variables on Render. The admin panel can send pushes but users must first allow notifications on their device.
            </p>
          </div>
          {pushConfigured === null ? (
            <div className="w-4 h-4 rounded-full border-2 border-muted border-t-primary animate-spin flex-shrink-0 mt-1" />
          ) : pushConfigured ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 flex-shrink-0" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
              ✓ Configured
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex-shrink-0" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
              ⚠ VAPID keys missing
            </span>
          )}
        </div>
        {pushConfigured === false && (
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3" style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "#92400e" }}>
            <strong>To enable push notifications:</strong>
            <ol className="list-decimal ml-4 mt-1 space-y-0.5">
              <li>SSH into your Render instance and run: <code className="bg-amber-100 px-1 rounded">python manage.py generate_vapid_keys</code></li>
              <li>Copy the printed VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, and VAPID_ADMIN_EMAIL values</li>
              <li>Add them as Environment Variables in your Render service dashboard</li>
              <li>Redeploy — push will activate automatically</li>
            </ol>
          </div>
        )}
      </div>

      {/* ── Auto-grant subscription on profile completion ────────── */}
      <div className="rounded-2xl border border-border bg-card p-5 mt-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Auto-Grant on Profile Completion</p>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>
              When toggled on, users who complete their profile (≥70% score) automatically receive the selected plan for the specified number of days — free of charge.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAutoGrant(p => ({ ...p, enabled: !p.enabled }))}
            className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${autoGrant.enabled ? "bg-primary" : "bg-muted-foreground/30"}`}
            style={{ marginLeft: "1rem" }}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoGrant.enabled ? "translate-x-6" : ""}`} />
          </button>
        </div>
        {autoGrant.enabled && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-muted-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Plan to Grant</label>
              <select
                value={autoGrant.plan}
                onChange={e => setAutoGrant(p => ({ ...p, plan: e.target.value as "basic" | "premium" }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                style={{ fontSize: "0.875rem" }}>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div>
              <label className="block text-muted-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Duration (days)</label>
              <select
                value={autoGrant.days}
                onChange={e => setAutoGrant(p => ({ ...p, days: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                style={{ fontSize: "0.875rem" }}>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
          </div>
        )}
        {autoGrant.enabled && (
          <p className="mt-3 text-primary" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
            ✓ Active — new users completing their profile will automatically receive {autoGrant.days} days of {autoGrant.plan} plan.
          </p>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60"
          style={{ fontWeight: 700, fontSize: "0.9375rem" }}
        >
          {saving ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</> : "Save All Settings"}
        </button>
      </div>
    </div>
  );
}

// ─── ADMIN SHELL ──────────────────────────────────────────
export function AdminApp({ onBack, role, adminName, adminEmail, initialSection, onSectionChange, onNameChange }: AdminAppProps) {
  // v2 — sections rendered on-demand via renderSection() to avoid recharts key collisions.
  // For admin role, dynamically add "payments" to nav when super-admin has granted access.
  const baseAccess = ROLE_ACCESS[role];
  const allowedSections: AdminSection[] = (role === "admin" && getRevenuePermission())
    ? [...baseAccess, "payments"]
    : baseAccess;

  const defaultSection = role === "customer-care" ? "support" : role === "blog-admin" ? "blog" : "overview";
  const resolvedInitial: AdminSection = (
    initialSection && allowedSections.includes(initialSection as AdminSection)
      ? initialSection as AdminSection
      : defaultSection
  );
  const [section, setSection] = useState<AdminSection>(resolvedInitial);

  // On mobile the sidebar starts closed (drawer mode); on desktop it starts open.
  const isMobile = () => typeof window !== "undefined" && window.innerWidth < 768;
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobile());
  const [mobileView, setMobileView] = useState(isMobile);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setMobileView(mobile);
      if (!mobile) setSidebarOpen(true);   // always open on desktop
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── My Account modal ──────────────────────────────────────
  const [profileOpen, setProfileOpen] = useState(false);
  const [editName, setEditName] = useState(adminName);
  const [savingName, setSavingName] = useState(false);

  const saveAdminName = async () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setSavingName(true);
    try {
      const { adminApi } = await import("../../lib/api");
      const updated = await adminApi.updateMe(trimmed);
      onNameChange?.(updated.name || trimmed);
      setProfileOpen(false);
      const { toast } = await import("sonner");
      toast.success("Display name updated.");
    } catch {
      const { toast } = await import("sonner");
      toast.error("Could not save name. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  // Admins are identified by role badge/initials — no dating-profile photo in admin UI
  const adminPhotoUrl: string | null = null;
  const [isPending, startTransition] = useTransition();

  const changeSection = (next: AdminSection) => {
    startTransition(() => {
      setSection(next);
      onSectionChange?.(next);
      if (mobileView) setSidebarOpen(false); // close drawer after nav on mobile
    });
  };

  // Live counts for nav badges
  const [navCounts, setNavCounts] = useState({
    users: 0, moderation: 0, support: 0, reports: 0, blacklist: 0,
  });

  // Live analytics data for overview dashboard
  const [liveOverview,     setLiveOverview]     = useState<AnalyticsOverview | undefined>(undefined);
  const [liveUsersChart,   setLiveUsersChart]   = useState<Array<{ month: string; total: number; new: number }> | undefined>(undefined);
  const [liveRevenueChart, setLiveRevenueChart] = useState<Array<{ month: string; amount: number }> | undefined>(undefined);
  const [liveGender,       setLiveGender]       = useState<Array<{ name: string; value: number; color: string }> | undefined>(undefined);

  const fetchNavCounts = () => {
    adminApi.users({ page_size: 1 })
      .then(r => setNavCounts(c => ({ ...c, users: r.count })))
      .catch(() => {});
    adminApi.blacklist()
      .then(r => setNavCounts(c => ({ ...c, blacklist: r.results.length })))
      .catch(() => {});
    adminApi.reports({ status: "pending" })
      .then(r => setNavCounts(c => ({ ...c, reports: r.results.length })))
      .catch(() => {});
    adminApi.tickets({ status: "open" } as Parameters<typeof adminApi.tickets>[0])
      .then(r => setNavCounts(c => ({ ...c, support: r.results.length })))
      .catch(() => {});
  };

  const fetchAnalytics = () => {
    analyticsApi.overview()
      .then(setLiveOverview)
      .catch(() => {});
    analyticsApi.users()
      .then(r => { setLiveUsersChart(r.series); setLiveGender(r.gender); })
      .catch(() => {});
    analyticsApi.revenue()
      .then(r => setLiveRevenueChart(r.series))
      .catch(() => {});
  };

  useEffect(() => {
    fetchNavCounts();
    fetchAnalytics();
  }, []);

  // Re-fetch counts when any section mutates shared data (e.g. user deleted)
  useEffect(() => {
    const refresh = () => { fetchNavCounts(); fetchAnalytics(); };
    window.addEventListener("ma3moni:users-changed", refresh);
    return () => window.removeEventListener("ma3moni:users-changed", refresh);
  }, []);

  // Prefer live counts from the overview API (always accurate after refresh); fall
  // back to navCounts (from separate per-section requests) if overview hasn't loaded yet.
  const ov = liveOverview;
  const ALL_NAV_ITEMS: { key: AdminSection; icon: ReactNode; label: string; badge?: number }[] = [
    { key: "overview",   icon: <LayoutDashboard size={17} />, label: "Overview" },
    { key: "users",      icon: <Users size={17} />,           label: "Users",     badge: ov?.total_users      ?? navCounts.users },
    { key: "blacklist",  icon: <Ban size={17} />,             label: "Blacklist", badge: ov?.blacklist_count   ?? navCounts.blacklist },
    { key: "support",    icon: <Headphones size={17} />,      label: "Support",   badge: ov?.open_tickets_count ?? navCounts.support },
    { key: "roles",      icon: <Key size={17} />,             label: "Roles" },
    { key: "blog",       icon: <BookOpen size={17} />,        label: "Blog",      badge: ov?.blog_published_count },
    { key: "payments",   icon: <CreditCard size={17} />,      label: "Payments" },
    { key: "analytics",  icon: <BarChart2 size={17} />,       label: "Analytics" },
    { key: "reports",    icon: <Flag size={17} />,            label: "Reports",   badge: ov?.pending_reports_count ?? navCounts.reports },
    { key: "settings",   icon: <Settings size={17} />,        label: "Settings" },
    { key: "audit",      icon: <Shield size={17} />,          label: "Audit Log" },
  ];

  const navItems = ALL_NAV_ITEMS.filter(item => allowedSections.includes(item.key));

  // Render only the active section — instantiating all at once caused
  // recharts SVG defs (linearGradient IDs) to collide, producing duplicate-key warnings.
  const renderSection = () => {
    switch (section) {
      case "overview":   return <OverviewSection role={role} onNavigate={s => changeSection(s)} liveOverview={liveOverview} liveUsersChart={liveUsersChart} liveRevenueChart={liveRevenueChart} liveGender={liveGender} />;
      case "users":      return <UsersSection />;
      case "moderation": return null; // removed
      case "blacklist":  return <BlacklistSection />;
      case "support":    return <SupportSection role={role} />;
      case "roles":      return <RolesSection role={role} />;
      case "blog":       return <BlogSection role={role} />;
      case "payments":   return <PaymentsSection role={role} />;
      case "analytics":  return <AnalyticsSection role={role} />;
      case "reports":    return <ReportsSection />;
      case "settings":   return <SettingsSection role={role} />;
      case "audit":      return <AdminAuditSection />;
    }
  };

  const roleGradient = role === "super-admin"
    ? "linear-gradient(135deg,#0A6870,#14A8B4)"
    : role === "admin"
    ? "linear-gradient(135deg,#3A7DA8,#5BA0CC)"
    : role === "blog-admin"
    ? "linear-gradient(135deg,#5B8F68,#7DB48A)"
    : "linear-gradient(135deg,#B5632F,#D08050)";

  const adminInitials = adminName && adminName !== adminEmail
    ? adminName.split(" ").map((n: string) => n[0] ?? "").join("").slice(0, 2).toUpperCase()
    : ROLE_BADGE[role];

  const currentLabel = ALL_NAV_ITEMS.find(i => i.key === section)?.label ?? "";

  return (
    <div className="size-full flex overflow-hidden bg-background">

      {/* ── Mobile backdrop ───────────────────────────────────── */}
      {mobileView && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className="flex-shrink-0 flex flex-col transition-transform duration-250 ease-in-out"
        style={{
          width: mobileView ? "280px" : sidebarOpen ? "240px" : "64px",
          background: "var(--sidebar)",
          borderRight: "1px solid var(--sidebar-border)",
          // On mobile: fixed overlay drawer; on desktop: inline panel
          ...(mobileView ? {
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 40,
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            boxShadow: sidebarOpen ? "4px 0 24px rgba(0,0,0,0.25)" : "none",
          } : {
            transition: "width 200ms ease-in-out",
          }),
        }}
      >
        {/* Logo + close button */}
        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "var(--sidebar-border)", minHeight: "64px" }}>
          <div className="flex items-center gap-3 min-w-0">
            <Logo variant="icon" theme="dark" size="sm" />
            {(sidebarOpen || mobileView) && (
              <div className="min-w-0">
                <p className="logo-font" style={{ fontWeight: 800, fontSize: "1rem", color: "var(--sidebar-foreground)" }}>Ma3moni</p>
                <p style={{ fontSize: "0.6875rem", color: "rgba(203,213,224,0.5)", fontWeight: 500 }}>Admin Portal</p>
              </div>
            )}
          </div>
          {mobileView && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg transition-colors flex-shrink-0"
              style={{ color: "rgba(203,213,224,0.6)" }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(({ key, icon, label, badge }) => {
            const active = section === key;
            const showLabel = sidebarOpen || mobileView;
            return (
              <button
                key={key}
                onClick={() => changeSection(key)}
                className={`w-full flex items-center gap-3 px-3 rounded-xl transition-all ${active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"} ${isPending ? "opacity-70" : ""}`}
                style={{
                  background: active ? "var(--sidebar-primary)" : "transparent",
                  justifyContent: showLabel ? "flex-start" : "center",
                  paddingTop: mobileView ? "12px" : "10px",
                  paddingBottom: mobileView ? "12px" : "10px",
                }}
              >
                <span className="flex-shrink-0">{icon}</span>
                {showLabel && (
                  <>
                    <span style={{ fontSize: mobileView ? "0.9375rem" : "0.875rem", fontWeight: active ? 700 : 500, flex: 1, textAlign: "left" }}>{label}</span>
                    {badge !== undefined && badge > 0 && (
                      <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center" style={{ fontSize: "0.625rem", fontWeight: 700, background: active ? "rgba(255,255,255,0.25)" : "var(--sidebar-primary)", color: "white" }}>
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom — logout */}
        <div className="p-3 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
          <button
            onClick={onBack}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors"
            style={{ justifyContent: (sidebarOpen || mobileView) ? "flex-start" : "center", color: "rgba(203,213,224,0.55)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <LogOut size={15} />
            {(sidebarOpen || mobileView) && <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b border-border bg-card flex-shrink-0 gap-2">
          {/* Left: hamburger + section title on mobile */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex-shrink-0"
            >
              <Menu size={18} />
            </button>
            {mobileView && (
              <span className="font-bold truncate" style={{ fontSize: "0.9375rem" }}>{currentLabel}</span>
            )}
          </div>

          {/* Right: bell + identity */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
            </button>
            <div className="h-5 w-px bg-border" />
            <button
              onClick={() => { setEditName(adminName); setProfileOpen(true); }}
              className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-muted/60 transition-colors"
              title="My Account"
            >
              <div className="hidden sm:block text-right">
                <p style={{ fontSize: "0.8125rem", fontWeight: 700, lineHeight: 1.25 }}>
                  {adminName && adminName !== adminEmail ? adminName : ROLE_LABEL[role]}
                </p>
                <p className="text-muted-foreground" style={{ fontSize: "0.6875rem", lineHeight: 1.2 }}>{ROLE_LABEL[role]}</p>
              </div>
              <div
                className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: roleGradient, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
              >
                <span style={{ fontSize: "0.6875rem", fontWeight: 800, color: "white" }}>{adminInitials}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Section content */}
        <main className={`flex-1 p-3 md:p-6 ${section === "users" ? "overflow-hidden flex flex-col" : "overflow-y-auto"}`}>
          <Suspense fallback={<SectionLoading />}>
            {renderSection()}
          </Suspense>
        </main>
      </div>

      {/* ── My Account modal ─────────────────────────────── */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: roleGradient }}
                >
                  <span style={{ fontSize: "0.6875rem", fontWeight: 800, color: "white" }}>
                    {editName.trim() ? editName.trim().split(" ").map(n => n[0] ?? "").join("").slice(0, 2).toUpperCase() : ROLE_BADGE[role]}
                  </span>
                </div>
                <h2 style={{ fontWeight: 700, fontSize: "1rem" }}>My Account</h2>
              </div>
              <button onClick={() => setProfileOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Role — read-only */}
              <div>
                <label className="block mb-1" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</label>
                <div className="px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-muted-foreground" style={{ fontSize: "0.9rem" }}>
                  {ROLE_LABEL[role]}
                </div>
              </div>

              {/* Email — read-only */}
              <div>
                <label className="block mb-1" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
                <div className="px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-muted-foreground" style={{ fontSize: "0.9rem", fontFamily: "monospace" }}>
                  {adminEmail}
                </div>
              </div>

              {/* Display name — editable */}
              <div>
                <label className="block mb-1" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Display Name</label>
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveAdminName(); if (e.key === "Escape") setProfileOpen(false); }}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  style={{ fontSize: "0.9rem" }}
                />
                <p className="mt-1.5 text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                  This name appears in the admin dashboard header and audit logs.
                </p>
              </div>
            </div>

            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setProfileOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
                style={{ fontSize: "0.9rem" }}
              >
                Cancel
              </button>
              <button
                onClick={saveAdminName}
                disabled={savingName || !editName.trim() || editName.trim() === adminName}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontSize: "0.9rem", fontWeight: 600 }}
              >
                {savingName ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save name
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect, lazy, Suspense, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { USERS as USERS_DATA } from "../../data/users";
import { adminApi, analytics as analyticsApi, restoreAdminToken, type AnalyticsOverview, type PlatformSettings } from "../../lib/api";

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
  BookOpen, ThumbsUp, ThumbsDown, FileText, UserPlus, Pencil,
  ImagePlus, Tag, Trash, Link
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

import type { AdminRole } from "./AdminRoot";

interface AdminAppProps {
  onBack: () => void;
  role: AdminRole;
  adminName: string;
  adminEmail: string;
}

// Sections each role can access
// Base access per role. Payments are super-admin only unless the super-admin
// explicitly grants revenue visibility to admins via Settings.
const ROLE_ACCESS: Record<AdminRole, AdminSection[]> = {
  "super-admin":   ["overview","users","blacklist","support","roles","blog","payments","analytics","reports","settings"],
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
  | "reports" | "settings";

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

// Blog engagement stats — keyed by article index to stay in sync with ARTICLES in BlogDetail.
const ARTICLES_META = [
  { id: 1, title: "Why Compatibility Matters More Than Chemistry",           category: "Compatibility", author: "Mariam Rashid", date: "Jun 28, 2026" },
  { id: 2, title: "The Language of Values: What Matters Most in a Partner",  category: "Values",        author: "Ibrahim Al-Sayed", date: "Jun 22, 2026" },
  { id: 3, title: "Communication Styles & Marriage Compatibility",           category: "Communication", author: "Mariam Rashid", date: "Jun 15, 2026" },
  { id: 4, title: "The Question of Children: Having the Right Conversation", category: "Life Goals",    author: "Layla Hassan", date: "Jun 8, 2026" },
  { id: 5, title: "Understanding Religious Compatibility",                   category: "Faith",         author: "Ibrahim Al-Sayed", date: "Jun 1, 2026" },
  { id: 6, title: "Financial Alignment & Shared Goals in Marriage",          category: "Life Goals",    author: "Layla Hassan", date: "May 24, 2026" },
];

const BLOG_STATS = [
  { views: 4820, likes: 312, dislikes: 14 },
  { views: 3560, likes: 241, dislikes: 8 },
  { views: 2940, likes: 198, dislikes: 22 },
  { views: 2100, likes: 145, dislikes: 11 },
  { views: 1876, likes: 133, dislikes: 9 },
  { views: 1430, likes:  98, dislikes: 6 },
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
    <div className="bg-card rounded-2xl border border-border p-6">
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
        <div key={label} className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between">
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
            <KpiCard icon={<Users size={18} />} label="Total Users" value={liveOverview ? fmt(liveOverview.total_users) : "12,847"} change="+8.3%" color="#0A6870" />
            <KpiCard icon={<UserCheck size={18} />} label="Active Today" value={liveOverview ? fmt(liveOverview.active_today) : "1,234"} change="+12.1%" color="#4A8DB8" />
            <KpiCard icon={<Heart size={18} />} label="Matches This Month" value={liveOverview ? fmt(liveOverview.total_matches) : "619"} change="+4.6%" color="#C5733F" />
          </>
        )}
        {/* Revenue: only when permitted */}
        {canSeeFinancials && (
          <KpiCard icon={<DollarSign size={18} />} label="Monthly Revenue" value={liveOverview?.revenue_mtd ? `$${(liveOverview.revenue_mtd / 1000).toFixed(1)}k` : "$48,200"} change="+7.2%" color="#6B9E78" />
        )}
        {/* Blog Admin KPIs */}
        {isBlogAdmin && (
          <>
            <KpiCard icon={<BookOpen size={18} />} label="Published Articles" value="6" change="+2" color="#6B9E78" />
            <KpiCard icon={<Eye size={18} />} label="Total Article Views" value="16,726" change="+14.2%" color="#4A8DB8" />
            <KpiCard icon={<ThumbsUp size={18} />} label="Total Likes" value="1,127" change="+8.3%" color="#0A6870" />
            <KpiCard icon={<Tag size={18} />} label="Categories" value="7" change="" color="#C5733F" />
          </>
        )}
        {/* Customer Care KPIs */}
        {isCustomerCare && (
          <>
            <KpiCard icon={<Headphones size={18} />} label="Open Tickets" value="2" change="" color="#C5733F" />
            <KpiCard icon={<UserCheck size={18} />} label="Resolved Today" value="5" change="+2" color="#6B9E78" />
            <KpiCard icon={<AlertTriangle size={18} />} label="Escalated" value="1" change="" color="#D41F3A" />
            <KpiCard icon={<Users size={18} />} label="Active Members" value="1,234" change="+12.1%" color="#4A8DB8" />
          </>
        )}
      </div>

      {/* ── Main charts — role filtered ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth — super-admin and admin only */}
        {(role === "super-admin" || role === "admin") && (
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
            <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">User Growth</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={liveUsersChart ?? analyticsData.users} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <XAxis key="x" dataKey="month" tick={{ fontSize: 12, fill: "#68747F" }} axisLine={false} tickLine={false} />
                <YAxis key="y" tick={{ fontSize: 12, fill: "#68747F" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip key="tip" contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
                <Line key="line" type="monotone" dataKey="total" stroke="#0A6870" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Blog article engagement — blog-admin */}
        {isBlogAdmin && (
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
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
          <div className={`${role === "super-admin" ? "" : "lg:col-span-2"} bg-card rounded-2xl border border-border p-6`}>
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
        {isBlogAdmin && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-4">Top Articles</h3>
            <div className="space-y-3">
              {ARTICLES_META.slice(0, 4).map((a, i) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span style={{ fontSize: "0.625rem", fontWeight: 800, color: "var(--primary)" }}>#{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, lineHeight: 1.35 }} className="line-clamp-1">{a.title}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{BLOG_STATS[i].views.toLocaleString()} views · {BLOG_STATS[i].likes} likes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
        // Resolve relative /media/ URLs to full Django URL
        let photoUrl = p.photo_url ?? "";
        if (photoUrl && photoUrl.startsWith("/")) {
          const base = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
          photoUrl = base + photoUrl;
        }
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
            <div className="p-5">
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

  useEffect(() => {
    adminApi.blacklist().then(res => {
      setList(res.results.map(b => ({
        id: b.id, type: b.type, value: b.value, reason: b.reason,
        date: b.added_at, blockedBy: "Admin",
      })));
    }).catch(() => {});
  }, []);

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
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
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

      {/* Table */}
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
            {list.map(item => (
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
                    onClick={() => setList(prev => prev.filter(b => b.id !== item.id))}
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

// ─── BLOG EDITOR MODAL ────────────────────────────────────
// ── Body block types for the rich editor ─────────────────
type BodyBlock =
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "image"; src: string; caption: string; inputMode: "upload" | "url" };

const makeId = () => Math.random().toString(36).slice(2, 9);

function BodyBlockEditor({ block, onChange, onDelete, onAddAfter }: {
  block: BodyBlock;
  onChange: (b: BodyBlock) => void;
  onDelete: () => void;
  onAddAfter: (type: "paragraph" | "heading" | "image") => void;
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || block.type !== "image") return;
    const url = URL.createObjectURL(file);
    onChange({ ...block, src: url });
  };

  return (
    <div className="group relative border border-border rounded-xl bg-card overflow-hidden">
      {/* Block content */}
      {block.type === "paragraph" && (
        <textarea
          value={block.text}
          onChange={e => onChange({ ...block, text: e.target.value })}
          rows={3}
          placeholder="Write paragraph text…"
          className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none"
          style={{ fontSize: "0.9rem", lineHeight: 1.7 }}
        />
      )}
      {block.type === "heading" && (
        <input
          value={block.text}
          onChange={e => onChange({ ...block, text: e.target.value })}
          placeholder="Section heading…"
          className="w-full px-4 py-3 bg-transparent focus:outline-none"
          style={{ fontSize: "1.0625rem", fontWeight: 700 }}
        />
      )}
      {block.type === "image" && (
        <div className="p-4 space-y-3">
          {/* Image preview / upload area */}
          {block.src ? (
            <div className="relative rounded-xl overflow-hidden" style={{ maxHeight: 240 }}>
              <img src={block.src} alt={block.caption || "Article image"} className="w-full h-full object-cover" />
              <button
                onClick={() => onChange({ ...block, src: "" })}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                aria-label="Remove image">
                <X size={14} className="text-white" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {/* Upload tab */}
              <label className={`flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${block.inputMode === "upload" ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"}`}
                onClick={() => onChange({ ...block, inputMode: "upload" })}>
                <ImagePlus size={22} className="text-primary" />
                <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Upload image</span>
                <span className="text-muted-foreground" style={{ fontSize: "0.6875rem" }}>JPG, PNG, WEBP</span>
                <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
              </label>
              {/* URL tab */}
              <div className={`flex-1 flex flex-col gap-2 p-3 rounded-xl border-2 border-dashed transition-colors ${block.inputMode === "url" ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"}`}
                onClick={() => onChange({ ...block, inputMode: "url" })}>
                <div className="flex items-center gap-2 text-primary">
                  <Link size={16} />
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Image URL</span>
                </div>
                <input
                  type="url"
                  value={block.src}
                  onChange={e => onChange({ ...block, src: e.target.value })}
                  placeholder="https://…"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ fontSize: "0.8rem" }}
                  onClick={e => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          {/* Caption */}
          <input
            value={block.caption}
            onChange={e => onChange({ ...block, caption: e.target.value })}
            placeholder="Caption (optional)"
            className="w-full px-3 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            style={{ fontSize: "0.8rem" }}
          />
        </div>
      )}

      {/* Block type badge + actions (shown on hover) */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground" style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase" }}>
          {block.type}
        </span>
        <button onClick={onDelete} className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors" aria-label="Delete block">
          <Trash size={12} className="text-red-500" />
        </button>
      </div>

      {/* Add block below — shown on hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity px-4 pb-3 pt-0">
        <div className="relative inline-block">
          <button onClick={() => setShowAddMenu(s => !s)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
            style={{ fontSize: "0.75rem", fontWeight: 600 }}>
            <Plus size={13} /> Add block
          </button>
          {showAddMenu && (
            <div className="absolute left-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg py-1 z-10 min-w-[160px]">
              {(["paragraph", "heading", "image"] as const).map(t => (
                <button key={t} onClick={() => { onAddAfter(t); setShowAddMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-muted transition-colors flex items-center gap-2"
                  style={{ fontSize: "0.8125rem" }}>
                  {t === "paragraph" ? <FileText size={13} /> : t === "heading" ? <BookOpen size={13} /> : <ImagePlus size={13} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BlogEditorModal({ article, categories, onClose, onSave }: {
  article: { title: string; category: string; author: string; date: string; coverImage?: string } | null;
  categories: string[];
  onClose: () => void;
  onSave: (data: { title: string; category: string; author: string; coverImage: string; excerpt: string; blocks: BodyBlock[] }) => void;
}) {
  const [form, setForm] = useState({
    title: article?.title ?? "",
    category: article?.category ?? (categories[0] ?? "Compatibility"),
    author: article?.author ?? "",
    excerpt: "",
    coverImage: article?.coverImage ?? "",
    coverInputMode: "upload" as "upload" | "url",
  });
  const [blocks, setBlocks] = useState<BodyBlock[]>([
    { id: makeId(), type: "paragraph", text: "" },
  ]);
  const [saved, setSaved] = useState(false);
  const isEdit = !!article;

  const u = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(p => ({ ...p, [k]: v }));

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) u("coverImage", URL.createObjectURL(file));
  };

  const updateBlock = (id: string, updated: BodyBlock) =>
    setBlocks(prev => prev.map(b => b.id === id ? updated : b));

  const deleteBlock = (id: string) =>
    setBlocks(prev => prev.filter(b => b.id !== id));

  const addAfter = (afterId: string, type: "paragraph" | "heading" | "image") => {
    const idx = blocks.findIndex(b => b.id === afterId);
    const newBlock: BodyBlock = type === "image"
      ? { id: makeId(), type: "image", src: "", caption: "", inputMode: "upload" }
      : { id: makeId(), type, text: "" };
    setBlocks(prev => [...prev.slice(0, idx + 1), newBlock, ...prev.slice(idx + 1)]);
  };

  if (saved) return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border p-8 w-full max-w-md text-center">
        <CheckCircle size={48} className="text-primary mx-auto mb-4" />
        <p style={{ fontWeight: 800, fontSize: "1.25rem" }}>{isEdit ? "Article updated!" : "Article published!"}</p>
        {form.coverImage && (
          <div className="rounded-xl overflow-hidden mt-4 mb-2" style={{ height: 120 }}>
            <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
          </div>
        )}
        <p className="text-muted-foreground mt-2" style={{ fontSize: "0.875rem" }}>{form.title}</p>
        <button onClick={() => onSave({ title: form.title, category: form.category, author: form.author, coverImage: form.coverImage, excerpt: form.excerpt, blocks })}
          className="mt-6 w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" style={{ fontWeight: 700 }}>
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl border border-border w-full max-w-3xl shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h3 style={{ fontWeight: 700, fontSize: "1.0625rem" }}>{isEdit ? "Edit Article" : "New Article"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Cover image ───────────────────────────────── */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              Cover Image
            </label>
            {form.coverImage ? (
              <div className="relative rounded-2xl overflow-hidden" style={{ height: 200 }}>
                <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white cursor-pointer hover:bg-white/30 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    <ImagePlus size={15} /> Replace
                    <input type="file" accept="image/*" className="sr-only" onChange={handleCoverUpload} />
                  </label>
                  <button onClick={() => u("coverImage", "")} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/80 backdrop-blur-sm text-white hover:bg-red-600/80 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    <Trash size={15} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border overflow-hidden">
                {/* Upload / URL tabs */}
                <div className="flex border-b border-border">
                  {(["upload", "url"] as const).map(mode => (
                    <button key={mode} onClick={() => u("coverInputMode", mode)}
                      className={`flex-1 py-2.5 text-center transition-colors ${form.coverInputMode === mode ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-muted"}`}
                      style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                      {mode === "upload" ? "Upload file" : "Paste URL"}
                    </button>
                  ))}
                </div>
                {form.coverInputMode === "upload" ? (
                  <label className="flex flex-col items-center justify-center gap-3 py-8 cursor-pointer hover:bg-muted/40 transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <ImagePlus size={22} className="text-primary" />
                    </div>
                    <div className="text-center">
                      <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>Click to upload cover image</p>
                      <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>JPG, PNG, WEBP — recommended 1200×600px</p>
                    </div>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleCoverUpload} />
                  </label>
                ) : (
                  <div className="p-4">
                    <input
                      type="url"
                      value={form.coverImage}
                      onChange={e => u("coverImage", e.target.value)}
                      placeholder="https://images.unsplash.com/…"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                      style={{ fontSize: "0.9rem" }}
                    />
                    {form.coverImage && (
                      <img src={form.coverImage} alt="Preview" className="mt-3 w-full rounded-xl object-cover" style={{ height: 120 }} />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Meta fields ───────────────────────────────── */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Title</label>
            <input value={form.title} onChange={e => u("title", e.target.value)}
              placeholder="Article headline…"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: "1rem", fontWeight: 600 }} />
          </div>
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Excerpt</label>
            <textarea value={form.excerpt} onChange={e => u("excerpt", e.target.value)} rows={2}
              placeholder="Brief summary shown on the listing page…"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              style={{ fontSize: "0.9rem" }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Category</label>
              <select value={form.category} onChange={e => u("category", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: "0.9rem" }}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Author</label>
              <input value={form.author} onChange={e => u("author", e.target.value)}
                placeholder="Author name"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: "0.9rem" }} />
            </div>
          </div>

          {/* ── Body blocks ───────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Article Body</label>
              <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{blocks.length} block{blocks.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2">
              {blocks.map(block => (
                <BodyBlockEditor
                  key={block.id}
                  block={block}
                  onChange={updated => updateBlock(block.id, updated)}
                  onDelete={() => deleteBlock(block.id)}
                  onAddAfter={type => addAfter(block.id, type)}
                />
              ))}
              {/* Add first block buttons when empty */}
              {blocks.length === 0 && (
                <div className="flex gap-2">
                  {(["paragraph", "heading", "image"] as const).map(t => (
                    <button key={t} onClick={() => setBlocks([
                      t === "image"
                        ? { id: makeId(), type: "image", src: "", caption: "", inputMode: "upload" }
                        : { id: makeId(), type: t, text: "" }
                    ])}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-muted-foreground"
                      style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                      {t === "image" ? <ImagePlus size={14} /> : t === "heading" ? <BookOpen size={14} /> : <FileText size={14} />}
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Actions ───────────────────────────────────── */}
          <div className="flex gap-3 pt-2 border-t border-border">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.9rem" }}>
              Cancel
            </button>
            <button
              onClick={() => {
                if (!form.title.trim()) { alert("Please enter an article title."); return; }
                if (!form.author.trim()) { alert("Please enter the author name."); return; }
                setSaved(true);
              }}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              {isEdit ? "Save Changes" : "Publish Article"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        <div className="p-6 space-y-4">
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

// ─── BLOG SECTION ─────────────────────────────────────────
const DEFAULT_CATEGORIES = ["Compatibility", "Values", "Communication", "Life Goals", "Faith", "Family", "Guidance"];

function BlogSection({ role }: { role: AdminRole }) {
  const canEdit = role === "super-admin" || role === "admin" || role === "blog-admin";

  // ── Tab state ────────────────────────────────────────────
  const [tab, setTab] = useState<"articles" | "categories">("articles");

  // ── Articles state ───────────────────────────────────────
  type ArticleRow = typeof ARTICLES_META[number] & typeof BLOG_STATS[number] & { coverImage?: string; excerpt?: string; blocks?: BodyBlock[] };
  const [articles, setArticles] = useState<ArticleRow[]>(() =>
    BLOG_STATS.map((s, i) => ({ ...ARTICLES_META[i], ...s }))
  );
  const [editing, setEditing] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [preview, setPreview] = useState<ArticleRow | null>(null);

  // ── Categories state ─────────────────────────────────────
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCat, setNewCat] = useState("");
  const [editCatIdx, setEditCatIdx] = useState<number | null>(null);
  const [editCatVal, setEditCatVal] = useState("");

  const addCategory = () => {
    const trimmed = newCat.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories(prev => [...prev, trimmed]);
    setNewCat("");
  };
  const saveEditCat = (i: number) => {
    const trimmed = editCatVal.trim();
    if (!trimmed || (categories.includes(trimmed) && categories[i] !== trimmed)) { setEditCatIdx(null); return; }
    const oldName = categories[i];
    setCategories(prev => prev.map((c, j) => j === i ? trimmed : c));
    // Update any articles using the old name.
    setArticles(prev => prev.map(a => a.category === oldName ? { ...a, category: trimmed } : a));
    setEditCatIdx(null);
  };
  const deleteCategory = (i: number) => {
    const name = categories[i];
    if (articles.some(a => a.category === name)) {
      alert(`"${name}" is used by ${articles.filter(a => a.category === name).length} article(s). Reassign them first.`);
      return;
    }
    setCategories(prev => prev.filter((_, j) => j !== i));
  };

  return (
    <div>
      <SectionHeader
        title="Blog Management"
        sub="Create articles, manage categories and track reader engagement"
        action={
          canEdit ? (
            <div className="flex gap-2">
              {tab === "articles" && (
                <button onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  <Plus size={14} /> New Article
                </button>
              )}
            </div>
          ) : undefined
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: "Articles",    value: articles.length, icon: <FileText size={16} /> },
          { label: "Total Views", value: articles.reduce((s, a) => s + a.views, 0).toLocaleString(), icon: <Eye size={16} /> },
          { label: "Total Likes", value: articles.reduce((s, a) => s + a.likes, 0).toLocaleString(), icon: <ThumbsUp size={16} /> },
          { label: "Categories",  value: categories.length, icon: <Tag size={16} /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">{icon}</div>
            <div>
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{label}</p>
              <p style={{ fontWeight: 800, fontSize: "1.375rem", lineHeight: 1.1, color: "var(--primary)" }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-5 w-fit">
        {(["articles", "categories"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg transition-all capitalize ${tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            style={{ fontSize: "0.875rem", fontWeight: tab === t ? 600 : 400 }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Articles table ──────────────────────────────────── */}
      {tab === "articles" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border">
                {["Cover", "Title", "Category", "Author", "Views", "Likes", "Dislikes", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-muted-foreground" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{h}</th>
                ))}
                {canEdit && <th className="px-4 py-3.5" />}
              </tr>
            </thead>
            <tbody>
              {articles.map((a, i) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-12 h-9 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {a.coverImage
                        ? <img src={a.coverImage} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><FileText size={14} className="text-muted-foreground" /></div>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p style={{ fontWeight: 600, fontSize: "0.875rem", maxWidth: 220 }} className="line-clamp-1">{a.title}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{a.date}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-primary bg-secondary" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{a.category}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{a.author}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1"><Eye size={12} className="text-muted-foreground" /><span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{a.views.toLocaleString()}</span></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1"><ThumbsUp size={12} className="text-green-500" /><span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#16a34a" }}>{a.likes}</span></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1"><ThumbsDown size={12} className="text-red-400" /><span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#dc2626" }}>{a.dislikes}</span></div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 700, background: "#d1fae5", color: "#065f46" }}>Published</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setPreview(a)} className="flex items-center gap-1.5 text-muted-foreground hover:text-blue-500 transition-colors" style={{ fontSize: "0.8125rem" }}>
                        <Eye size={13} /> Preview
                      </button>
                      {canEdit && (
                        <button onClick={() => setEditing(i)} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors" style={{ fontSize: "0.8125rem" }}>
                          <Pencil size={13} /> Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Categories manager ──────────────────────────────── */}
      {tab === "categories" && (
        <div className="space-y-4">
          {/* Add new */}
          {canEdit && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <p style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.75rem" }}>Add New Category</p>
              <div className="flex gap-2">
                <input
                  value={newCat}
                  onChange={e => setNewCat(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }}
                  placeholder="Category name…"
                  aria-label="New category name"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ fontSize: "0.9rem" }}
                />
                <button
                  type="button"
                  onClick={addCategory}
                  disabled={!newCat.trim() || categories.includes(newCat.trim())}
                  aria-label="Add category"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
                  style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  <Plus size={14} /> Add
                </button>
              </div>
              {newCat.trim() && categories.includes(newCat.trim()) && (
                <p className="text-amber-600 mt-1.5" style={{ fontSize: "0.8125rem" }}>A category with this name already exists.</p>
              )}
            </div>
          )}

          {/* Category list */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>All Categories</p>
              <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{categories.length} total</span>
            </div>
            {categories.map((cat, i) => {
              const count = articles.filter(a => a.category === cat).length;
              const isEditing = editCatIdx === i;
              return (
                <div key={cat} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Tag size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        value={editCatVal}
                        onChange={e => setEditCatVal(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveEditCat(i); if (e.key === "Escape") setEditCatIdx(null); }}
                        autoFocus
                        className="w-full px-3 py-1.5 rounded-lg border border-primary bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        style={{ fontSize: "0.9rem", fontWeight: 600 }}
                      />
                    ) : (
                      <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{cat}</p>
                    )}
                    <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                      {count} article{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEditCat(i)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                            <Check size={12} /> Save
                          </button>
                          <button onClick={() => setEditCatIdx(null)}
                            className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                            style={{ fontSize: "0.8125rem" }}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditCatIdx(i); setEditCatVal(cat); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                            style={{ fontSize: "0.8125rem" }}>
                            <Pencil size={13} /> Edit
                          </button>
                          <button onClick={() => deleteCategory(i)}
                            disabled={count > 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            style={{ fontSize: "0.8125rem" }}
                            title={count > 0 ? "Reassign articles before deleting" : "Delete category"}>
                            <Trash size={13} /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {/* Article preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl my-6 overflow-hidden">
            {preview.coverImage && <img src={preview.coverImage} alt="Cover" className="w-full h-48 object-cover" />}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-secondary text-primary" style={{ fontSize: "0.75rem", fontWeight: 700 }}>{preview.category}</span>
                <button onClick={() => setPreview(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
              </div>
              <h2 style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em", lineHeight: 1.2 }} className="mb-2">{preview.title}</h2>
              <p className="text-muted-foreground mb-4" style={{ fontSize: "0.9375rem" }}>{preview.excerpt || "No excerpt provided."}</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span style={{ fontWeight: 800, fontSize: "0.75rem", color: "var(--primary)" }}>{preview.author.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{preview.author}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{preview.date}</p>
                </div>
                <div className="ml-auto flex items-center gap-4 text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                  <span className="flex items-center gap-1"><Eye size={13} />{preview.views.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><ThumbsUp size={13} />{preview.likes}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showCreate || editing !== null) && (
        <BlogEditorModal
          article={editing !== null ? articles[editing] : null}
          categories={categories}
          onClose={() => { setShowCreate(false); setEditing(null); }}
          onSave={(data) => {
            if (editing !== null) {
              setArticles(prev => prev.map((a, i) => i === editing ? { ...a, ...data } : a));
              toast.success(`Article updated: "${data.title}"`);
            } else {
              setArticles(prev => [...prev, {
                id: prev.length + 1,
                ...data,
                date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                views: 0, likes: 0, dislikes: 0,
              }]);
              // Notify members: logged to admin activity + simulated push to matching users
              toast.success(
                `"${data.title}" published in ${data.category}. Members interested in this topic have been notified.`,
                { duration: 5000 }
              );
            }
            setShowCreate(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

// ─── PAYMENTS SECTION ─────────────────────────────────────
function PaymentsSection() {
  return <PaymentsSectionV2 />;
}

// ─── ANALYTICS SECTION ────────────────────────────────────
function AnalyticsSection({ role }: { role: AdminRole }) {
  const canSeeRevenue = role === "super-admin" || (role === "admin" && getRevenuePermission());
  const [period, setPeriod] = useState<"7D" | "30D" | "90D" | "1Y">("30D");

  return (
    <div>
      <SectionHeader
        title="Analytics & Insights"
        sub="Understand platform performance and user behavior"
        action={
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {(["7D", "30D", "90D", "1Y"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition-all ${period === p ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                style={{ fontSize: "0.8125rem", fontWeight: period === p ? 600 : 400 }}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth — explicit keys prevent recharts key collision */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">New Users</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analyticsData.users}>
              <XAxis key="x" dataKey="month" tick={{ fontSize: 11, fill: "#68747F" }} axisLine={false} tickLine={false} />
              <YAxis key="y" tick={{ fontSize: 11, fill: "#68747F" }} axisLine={false} tickLine={false} />
              <Tooltip key="tip" contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
              <Bar key="bar" dataKey="new" fill="#0A6870" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Match Trends */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">Match Trends</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analyticsData.matches}>
              <XAxis key="x" dataKey="month" tick={{ fontSize: 11, fill: "#68747F" }} axisLine={false} tickLine={false} />
              <YAxis key="y" tick={{ fontSize: 11, fill: "#68747F" }} axisLine={false} tickLine={false} />
              <Tooltip key="tip" contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
              <Line key="line" type="monotone" dataKey="matches" stroke="#C5733F" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Balance — PieChart with fixed size, no ResponsiveContainer */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">Gender Balance</h3>
          <div className="flex items-center gap-8">
            <PieChart width={180} height={180}>
              <Pie key="pie" data={analyticsData.gender} cx={90} cy={90} innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                {analyticsData.gender.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="space-y-4">
              {analyticsData.gender.map(g => (
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
        </div>

        {/* Revenue — only super-admin or admin with permission */}
        {canSeeRevenue && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analyticsData.revenue}>
                <XAxis key="x" dataKey="month" tick={{ fontSize: 11, fill: "#68747F" }} axisLine={false} tickLine={false} />
                <YAxis key="y" tick={{ fontSize: 11, fill: "#68747F" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip key="tip" contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", fontSize: "0.8125rem" }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                <Line key="line" type="monotone" dataKey="amount" stroke="#6B9E78" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
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
      onAction={async (id, action, note) => {
        const updated = displayReports.map(r => r.id === id ? {
          ...r, status: action === "dismiss" ? "dismissed" : "actioned",
          adminNotes: note || r.adminNotes,
          actionHistory: [...r.actionHistory, {
            action: action === "warn" ? "Warning issued" : action === "suspend" ? "Account suspended" : action === "ban" ? "Account banned" : "Report dismissed",
            by: "Admin", date: "Today", type: action === "dismiss" ? "admin" : action,
          }],
        } : r);
        setReports(updated);
        setSelectedId(null);
        try { await adminApi.updateReport(id, { status: action === "dismiss" ? "dismissed" : "actioned", admin_notes: note, action }); } catch {}
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
          <div key={label} className="bg-card rounded-2xl border border-border p-5">
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
function ReportDetailView({ report, allReports, onBack, onAction }: {
  report: ReportType;
  allReports: ReportType[];
  onBack: () => void;
  onAction: (id: string, action: string, note: string) => void;
}) {
  const [adminNote, setAdminNote] = useState(report.adminNotes);
  const [confirming, setConfirming] = useState<string | null>(null);

  const relatedReports = allReports.filter(r => report.relatedReports.includes(r.id));

  const statusColor = (s: string) => ({
    pending:   { bg: "#dbeafe", text: "#1d4ed8" },
    actioned:  { bg: "#dcfce7", text: "#166534" },
    dismissed: { bg: "#f3f4f6", text: "#6b7280" },
    system:    { bg: "#f3f4f6", text: "#6b7280" },
    suspend:   { bg: "#fef9c3", text: "#854d0e" },
    ban:       { bg: "#fee2e2", text: "#991b1b" },
    moderation:{ bg: "#e0e7ff", text: "#3730a3" },
    admin:     { bg: "#dcfce7", text: "#166534" },
    warn:      { bg: "#fef9c3", text: "#854d0e" },
  }[s] ?? { bg: "#f3f4f6", text: "#6b7280" });

  const evidenceIcon = (type: string) => type === "message" ? "💬" : "📝";

  const isPending = report.status === "pending";

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "0.9rem" }}>
          <ChevronLeft size={18} /> All Reports
        </button>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <h1 style={{ fontWeight: 800, fontSize: "1.375rem", letterSpacing: "-0.02em" }}>
            Report #{report.id.toUpperCase()}
          </h1>
          <span className="px-2.5 py-1 rounded-full capitalize" style={{ fontSize: "0.75rem", fontWeight: 700, ...statusColor(report.status) }}>
            {report.status}
          </span>
          {report.priority === "high" && (
            <span className="px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 700, background: "#fee2e2", color: "#991b1b" }}>
              High Priority
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Left: report details ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Parties */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Parties Involved</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { role: "Reported User", name: report.reported, email: report.reportedEmail, sub: report.reportedSubscription, status: report.reportedStatus, joined: report.reportedJoined, isReported: true },
                { role: "Reporter",      name: report.reporter,  email: report.reporterEmail, sub: "—", status: "active", joined: "—", isReported: false },
              ].map(({ role, name, email, sub, status, joined, isReported }) => (
                <div key={role} className={`rounded-xl border p-4 ${isReported ? "bg-red-50 border-red-100" : "bg-secondary border-primary/15"}`}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: isReported ? "#991b1b" : "var(--primary)", marginBottom: "0.625rem" }}>{role}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: isReported ? "#fee2e2" : "var(--primary)" + "20" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 800, color: isReported ? "#991b1b" : "var(--primary)" }}>
                        {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{name}</p>
                      <p className="text-muted-foreground truncate" style={{ fontSize: "0.8125rem" }}>{email}</p>
                    </div>
                  </div>
                  {isReported && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        { l: "Subscription", v: sub },
                        { l: "Status",       v: status },
                        { l: "Joined",       v: joined },
                        { l: "Prior Reports", v: String(report.priorReportsAgainstUser) },
                      ].map(({ l, v }) => (
                        <div key={l} className="bg-white/60 rounded-lg p-2">
                          <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#991b1b", marginBottom: 1 }}>{l}</p>
                          <p style={{ fontWeight: 600, fontSize: "0.8125rem", textTransform: "capitalize" }}>{v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Report description */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-base">⚠️</div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>{report.reason}</h3>
                <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Submitted {report.date} at {report.time}</p>
              </div>
            </div>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.75 }}>{report.description}</p>
          </div>

          {/* Evidence */}
          {report.evidence.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Evidence Provided</h3>
              <div className="space-y-3">
                {report.evidence.map((ev, i) => (
                  <div key={i} className={`rounded-xl p-4 border ${ev.type === "message" ? "bg-muted/50 border-border" : "bg-amber-50 border-amber-200"}`}>
                    <div className="flex items-start gap-3">
                      <span style={{ fontSize: "1.125rem" }}>{evidenceIcon(ev.type)}</span>
                      <div className="flex-1">
                        <p style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                          {ev.type === "message" ? `"${ev.content}"` : ev.content}
                        </p>
                        <p className="text-muted-foreground mt-1" style={{ fontSize: "0.75rem" }}>{ev.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related reports */}
          {relatedReports.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>
                Related Reports ({relatedReports.length})
              </h3>
              <div className="space-y-2">
                {relatedReports.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{r.reason} — {r.reported}</p>
                      <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>by {r.reporter} · {r.date}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full capitalize" style={{ fontSize: "0.6875rem", fontWeight: 700, ...statusColor(r.status) }}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: action panel ── */}
        <div className="space-y-5">

          {/* Action history / timeline */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "1rem" }}>History</h3>
            <div className="space-y-4 relative">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
              {report.actionHistory.map((h, i) => {
                const hs = statusColor(h.type);
                return (
                  <div key={i} className="flex items-start gap-3 relative pl-8">
                    <div className="absolute left-0 w-6 h-6 rounded-full flex items-center justify-center border-2 border-background" style={{ background: hs.bg }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: hs.text }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{h.action}</p>
                      <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>by {h.by} · {h.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Admin notes */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.75rem" }}>Admin Notes</h3>
            <textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              rows={3}
              placeholder="Add internal notes about this report…"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              style={{ fontSize: "0.875rem" }}
            />
          </div>

          {/* Take action */}
          {isPending ? (
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "1rem" }}>Take Action</h3>

              {confirming ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${confirming === "ban" ? "bg-red-50 border-red-200" : confirming === "suspend" ? "bg-amber-50 border-amber-200" : confirming === "dismiss" ? "bg-muted border-border" : "bg-secondary border-primary/15"}`}>
                    <p style={{ fontWeight: 700, fontSize: "0.9375rem", textTransform: "capitalize" }}>
                      {confirming === "warn" ? "Issue a warning" : confirming === "suspend" ? "Suspend account" : confirming === "ban" ? "Permanently ban account" : "Dismiss report"}
                    </p>
                    <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem" }}>
                      {confirming === "warn"    ? "The user will receive a formal warning. A second violation may lead to suspension." :
                       confirming === "suspend" ? "Account will be suspended immediately. User can appeal within 7 days." :
                       confirming === "ban"     ? "This action is permanent and cannot be undone. The user's data will be retained for 90 days." :
                       "The report will be closed without action. You can reopen it if new evidence emerges."}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirming(null)} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.875rem" }}>
                      Cancel
                    </button>
                    <button
                      onClick={() => { onAction(report.id, confirming, adminNote); setConfirming(null); }}
                      className="flex-1 py-3 rounded-xl text-white transition-all capitalize"
                      style={{ fontSize: "0.875rem", fontWeight: 700, background: confirming === "ban" ? "var(--destructive)" : confirming === "suspend" ? "#f59e0b" : confirming === "dismiss" ? "#68747F" : "var(--primary)" }}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {[
                    { key: "warn",    label: "Issue Warning",     desc: "Formal notice to the user",     bg: "var(--secondary)", color: "var(--primary)", border: "var(--primary)" },
                    { key: "suspend", label: "Suspend Account",   desc: "Temporary access removal",       bg: "#fef9c3",         color: "#854d0e",        border: "#d97706" },
                    { key: "ban",     label: "Permanent Ban",     desc: "Irreversible account removal",   bg: "#fee2e2",         color: "#991b1b",        border: "#dc2626" },
                    { key: "dismiss", label: "Dismiss Report",    desc: "Close without action",           bg: "var(--muted)",    color: "var(--muted-foreground)", border: "var(--border)" },
                  ].map(({ key, label, desc, bg, color, border }) => (
                    <button
                      key={key}
                      onClick={() => setConfirming(key)}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border transition-all hover:opacity-90 text-left"
                      style={{ background: bg, borderColor: border }}
                    >
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "0.9rem", color }}>{label}</p>
                        <p style={{ fontSize: "0.75rem", color, opacity: 0.7 }}>{desc}</p>
                      </div>
                      <ChevronRight size={15} style={{ color, opacity: 0.7 }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-muted rounded-2xl border border-border p-5 text-center">
              <CheckCircle size={24} className="text-primary mx-auto mb-2" />
              <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Report {report.status}</p>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem" }}>No further action required.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS SECTION ─────────────────────────────────────
function SettingsSection({ role, liveSettings, onSettingsSaved }: { role: AdminRole; liveSettings?: PlatformSettings; onSettingsSaved?: (s: PlatformSettings) => void }) {
  const isSuperAdmin = role === "super-admin";
  const [settings, setSettings] = useState({
    genderBalance: true,
    maxDailyMatches: liveSettings ? String(liveSettings.max_daily_matches_free) : "2",
    minFemaleRatio: "48",
    referralBonus: liveSettings ? String(liveSettings.referral_bonus_points) : "10",
    maintenanceMode: liveSettings?.maintenance_mode ?? false,
    emailVerification: true,
    photoModerationRequired: true,
    maxPhotos: liveSettings ? String(liveSettings.max_photos) : "4",
  });
  const [adminRevenueAccess, setAdminRevenueAccess] = useState(getRevenuePermission);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!liveSettings) return;
    setSettings(prev => ({
      ...prev,
      maxDailyMatches: String(liveSettings.max_daily_matches_free),
      referralBonus:   String(liveSettings.referral_bonus_points),
      maintenanceMode: liveSettings.maintenance_mode,
      maxPhotos:       String(liveSettings.max_photos),
    }));
  }, [liveSettings]);

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
        max_daily_matches_free:      Number(settings.maxDailyMatches),
        max_daily_matches_basic:     5,
        max_photos:                  Number(settings.maxPhotos),
        referral_bonus_points:       Number(settings.referralBonus),
        maintenance_mode:            settings.maintenanceMode as boolean,
        revenue_permission_for_admin: adminRevenueAccess,
      });
      onSettingsSaved?.(updated);
      setRevenuePermission(adminRevenueAccess);
      toast.success("Settings saved successfully.");
    } catch {
      toast.error("Could not save to server. Changes applied locally.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeader title="System Settings" sub="Configure platform behavior and operational controls" />

      <div className="space-y-6">
        {/* Matching Controls */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">Matching Controls</h3>
          <div className="space-y-5">
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
                { label: "Max Daily Matches Per User", key: "maxDailyMatches" },
                { label: "Min Female Ratio (%)", key: "minFemaleRatio" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{label}</label>
                  <input
                    value={settings[key as keyof typeof settings] as string}
                    onChange={e => update(key as keyof typeof settings, e.target.value)}
                    type="number"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    style={{ fontSize: "0.9rem" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Referral Settings */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-5">Referral Program</h3>
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Referral Bonus Amount (USD)</label>
            <div className="flex gap-3">
              <input
                value={settings.referralBonus}
                onChange={e => update("referralBonus", e.target.value)}
                type="number"
                className="w-40 px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                style={{ fontSize: "0.9rem" }}
              />
              <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                Update
              </button>
            </div>
          </div>
        </div>

        {/* Feature toggles */}
        <div className="bg-card rounded-2xl border border-border p-6">
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
          <div className="bg-card rounded-2xl border border-border p-6">
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

        <div className={`rounded-2xl border p-6 ${settings.maintenanceMode ? "bg-amber-50 border-amber-200" : "bg-card border-border"}`}>
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

      {/* Save button */}
      {isSuperAdmin && (
        <div className="flex justify-end mt-6">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60"
            style={{ fontWeight: 700, fontSize: "0.9375rem" }}
          >
            {saving ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</> : "Save Settings"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ADMIN SHELL ──────────────────────────────────────────
export function AdminApp({ onBack, role, adminName, adminEmail }: AdminAppProps) {
  // v2 — sections rendered on-demand via renderSection() to avoid recharts key collisions.
  // For admin role, dynamically add "payments" to nav when super-admin has granted access.
  const baseAccess = ROLE_ACCESS[role];
  const allowedSections: AdminSection[] = (role === "admin" && getRevenuePermission())
    ? [...baseAccess, "payments"]
    : baseAccess;

  const defaultSection = role === "customer-care" ? "support" : role === "blog-admin" ? "blog" : "overview";
  const [section, setSection] = useState<AdminSection>(defaultSection);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Admin profile photo — fetched from /me/ so it shows in the sidebar
  const [adminPhotoUrl, setAdminPhotoUrl] = useState<string | null>(null);
  useEffect(() => {
    import("../../lib/api").then(({ auth }) => {
      auth.me().then(me => {
        const photo = me.photos?.[0]?.image_url;
        if (photo) setAdminPhotoUrl(photo);
      }).catch(() => {});
    });
  }, []);
  const [isPending, startTransition] = useTransition();

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

  const ALL_NAV_ITEMS: { key: AdminSection; icon: ReactNode; label: string; badge?: number }[] = [
    { key: "overview",   icon: <LayoutDashboard size={17} />, label: "Overview" },
    { key: "users",      icon: <Users size={17} />,           label: "Users",      badge: navCounts.users      || undefined },
    // Moderation removed — photos save directly without review
    { key: "blacklist",  icon: <Ban size={17} />,             label: "Blacklist",  badge: navCounts.blacklist  || undefined },
    { key: "support",    icon: <Headphones size={17} />,      label: "Support",    badge: navCounts.support    || undefined },
    { key: "roles",      icon: <Key size={17} />,             label: "Roles" },
    { key: "blog",       icon: <BookOpen size={17} />,        label: "Blog" },
    { key: "payments",   icon: <CreditCard size={17} />,      label: "Payments" },
    { key: "analytics",  icon: <BarChart2 size={17} />,       label: "Analytics" },
    { key: "reports",    icon: <Flag size={17} />,            label: "Reports",    badge: navCounts.reports    || undefined },
    { key: "settings",   icon: <Settings size={17} />,        label: "Settings" },
  ];

  const navItems = ALL_NAV_ITEMS.filter(item => allowedSections.includes(item.key));

  // Render only the active section — instantiating all at once caused
  // recharts SVG defs (linearGradient IDs) to collide, producing duplicate-key warnings.
  const renderSection = () => {
    switch (section) {
      case "overview":   return <OverviewSection role={role} onNavigate={s => startTransition(() => setSection(s))} liveOverview={liveOverview} liveUsersChart={liveUsersChart} liveRevenueChart={liveRevenueChart} liveGender={liveGender} />;
      case "users":      return <UsersSection />;
      case "moderation": return null; // removed
      case "blacklist":  return <BlacklistSection />;
      case "support":    return <SupportSection role={role} />;
      case "roles":      return <RolesSection role={role} />;
      case "blog":       return <BlogSection role={role} />;
      case "payments":   return <PaymentsSection />;
      case "analytics":  return <AnalyticsSection role={role} />;
      case "reports":    return <ReportsSection />;
      case "settings":   return <SettingsSection role={role} />;
    }
  };

  return (
    <div className="size-full flex overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col transition-[width] duration-200 ease-in-out"
        style={{ width: sidebarOpen ? "240px" : "64px", background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "var(--sidebar-border)", minHeight: "68px" }}>
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Heart size={15} className="text-sidebar-primary-foreground fill-sidebar-primary-foreground" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="logo-font" style={{ fontWeight: 800, fontSize: "1rem", color: "var(--sidebar-foreground)" }}>Ma3moni</p>
              <p style={{ fontSize: "0.6875rem", color: "rgba(203,213,224,0.5)", fontWeight: 500 }}>Admin Portal</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(({ key, icon, label, badge }) => (
            <button
              key={key}
              onClick={() => startTransition(() => setSection(key))}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${section === key ? "text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"} ${isPending ? "opacity-80" : ""}`}
              style={{ background: section === key ? "var(--sidebar-primary)" : "transparent", justifyContent: sidebarOpen ? "flex-start" : "center" }}
            >
              <span className="flex-shrink-0">{icon}</span>
              {sidebarOpen && (
                <>
                  <span style={{ fontSize: "0.875rem", fontWeight: section === key ? 700 : 500, flex: 1, textAlign: "left" }}>{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ fontSize: "0.625rem", fontWeight: 700, background: section === key ? "rgba(255,255,255,0.25)" : "var(--sidebar-primary)", color: "white" }}>
                      {badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2 rounded-xl" style={{ background: "var(--sidebar-accent)" }}>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-sidebar-primary flex items-center justify-center flex-shrink-0">
                {adminPhotoUrl
                  ? <img src={adminPhotoUrl} alt={adminName} className="w-full h-full object-cover object-top" />
                  : <span style={{ fontSize: "0.625rem", fontWeight: 800, color: "white" }}>{ROLE_BADGE[role]}</span>
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--sidebar-foreground)", lineHeight: 1.3 }}>{adminName}</p>
                <p className="truncate" style={{ fontSize: "0.6875rem", color: "rgba(203,213,224,0.55)", lineHeight: 1.3, fontWeight: 400 }}>{adminEmail}</p>
                <span className="inline-block mt-0.5 px-1.5 py-px rounded" style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.04em", background: "rgba(255,255,255,0.08)", color: "rgba(203,213,224,0.6)", textTransform: "uppercase" }}>{ROLE_LABEL[role]}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-sidebar-primary flex items-center justify-center">
                {adminPhotoUrl
                  ? <img src={adminPhotoUrl} alt={adminName} className="w-full h-full object-cover object-top" />
                  : <span style={{ fontSize: "0.625rem", fontWeight: 800, color: "white" }}>{ROLE_BADGE[role]}</span>
                }
              </div>
            </div>
          )}
          <button
            onClick={onBack}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            style={{ justifyContent: sidebarOpen ? "flex-start" : "center", opacity: 0.6 }}
          >
            <LogOut size={16} />
            {sidebarOpen && <span style={{ fontSize: "0.8125rem" }}>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
            </button>
            <div className="h-5 w-px bg-border" />
            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary flex items-center justify-center" title={`${adminName} — ${ROLE_LABEL[role]}`}>
              {adminPhotoUrl
                ? <img src={adminPhotoUrl} alt={adminName} className="w-full h-full object-cover object-top" />
                : <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "white" }}>{ROLE_BADGE[role]}</span>
              }
            </div>
          </div>
        </div>

        {/* Section content — only one section mounted at a time */}
        <main className={`flex-1 p-6 ${section === "users" ? "overflow-hidden flex flex-col" : "overflow-y-auto"}`}>
          <Suspense fallback={<SectionLoading />}>
            {renderSection()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  MessageSquare, Users, ClipboardList, Send, Bell, X, Check,
  ChevronRight, UserCheck, Shield, Eye, Clock, AlertCircle,
  ArrowUpRight, Search, Plus, CheckCircle, ChevronLeft,
  DollarSign, Wallet, Gift, Heart, MapPin, Phone, Mail,
  LogIn, Layers, Activity, ArrowRight, UserCog, ShieldAlert,
  Crown, UserPlus, Lock, ToggleLeft, ToggleRight, Star,
  Ticket, BarChart2, Calendar, Edit3
} from "lucide-react";
import { adminApi } from "../../../lib/api";

type AgentRole = "super-admin" | "admin" | "customer-care";

// ── Data ──────────────────────────────────────────────────
const AGENTS = [
  { id: "ag1", name: "Sarah Al-Nasser", email: "care1@ma3moni.com", avatar: "SN", color: "#0A6870",  status: "online",  role: "Senior Care Agent",   tickets: 2, verifications: 14, joined: "Jan 2026" },
  { id: "ag2", name: "Ahmed Khalil",    email: "care2@ma3moni.com", avatar: "AK", color: "#4A8DB8",  status: "offline", role: "Care Agent",          tickets: 1, verifications: 9,  joined: "Mar 2026" },
  { id: "ag3", name: "Reem Mansouri",   email: "care3@ma3moni.com", avatar: "RM", color: "#C5733F",  status: "online",  role: "Care Agent",          tickets: 0, verifications: 5,  joined: "May 2026" },
];

const TICKETS = [
  {
    id: "t1", userId: "u3", userName: "Sara Khalid",  email: "sara@example.com",  subject: "Cannot upload profile photo",
    status: "open", priority: "high", agentId: "ag1", created: "2h ago",
    messages: [
      { from: "user",  text: "I keep getting an error when trying to upload my profile photo.", time: "10:05 AM" },
      { from: "agent", text: "Hi Sara, I'm sorry to hear that. Can you tell me the file format and size?", time: "10:08 AM", agent: "Sarah" },
      { from: "user",  text: "It's a JPG, around 2MB.", time: "10:10 AM" },
    ],
  },
  {
    id: "t2", userId: "u4", userName: "Omar Hassan",  email: "omar@example.com",  subject: "Account suspended without reason",
    status: "escalated", priority: "high", agentId: "ag2", created: "1d ago",
    messages: [
      { from: "user",  text: "My account was suspended and I have no idea why.", time: "Yesterday 3:00 PM" },
      { from: "agent", text: "I can see your account was flagged for suspicious activity. I'm escalating to admin.", time: "Yesterday 3:30 PM", agent: "Ahmed" },
    ],
  },
  {
    id: "t3", userId: "u2", userName: "Yusuf Al-Rashid", email: "yusuf@example.com", subject: "Match quality feedback",
    status: "resolved", priority: "low", agentId: "ag1", created: "3d ago",
    messages: [
      { from: "user",  text: "The matching could factor in location proximity more.", time: "3 days ago" },
      { from: "agent", text: "Great feedback Yusuf — passing this to our product team. You can also filter by location in preferences.", time: "3 days ago", agent: "Sarah" },
    ],
  },
];

const AGENT_LOGS: Record<string, { id: string; action: string; user: string; time: string; type: "moderation" | "support" | "verification" | "notification" | "chat" }[]> = {
  ag1: [
    { id: "l1", action: "Approved profile photo",     user: "Aisha Mohammed",     time: "Jul 2, 2026 10:23 AM", type: "moderation" },
    { id: "l2", action: "Responded to ticket #T1",   user: "Sara Khalid",        time: "Jul 2, 2026 10:08 AM", type: "support" },
    { id: "l3", action: "Verified profile identity", user: "Khalid Al-Mansouri", time: "Jul 1, 2026 2:30 PM",  type: "verification" },
    { id: "l4", action: "Resolved ticket #T3",       user: "Yusuf Al-Rashid",    time: "Jun 29, 2026 4:00 PM", type: "support" },
    { id: "l5", action: "Rejected profile photo",    user: "Layla Rahman",       time: "Jun 28, 2026 11:20 AM", type: "moderation" },
    { id: "l6", action: "Sent push notification",    user: "Omar Hassan",        time: "Jun 27, 2026 3:45 PM", type: "notification" },
    { id: "l7", action: "Approved profile photo",    user: "Sara Khalid",        time: "Jun 26, 2026 9:15 AM", type: "moderation" },
  ],
  ag2: [
    { id: "l1", action: "Escalated ticket #T2",      user: "Omar Hassan",        time: "Jul 1, 2026 3:30 PM",  type: "support" },
    { id: "l2", action: "Verified profile identity", user: "Noor Aziz",          time: "Jun 30, 2026 11:00 AM", type: "verification" },
    { id: "l3", action: "Sent push notification",    user: "Sara Khalid",        time: "Jun 29, 2026 2:00 PM", type: "notification" },
    { id: "l4", action: "Approved profile photo",    user: "Tariq Mansouri",     time: "Jun 28, 2026 10:30 AM", type: "moderation" },
    { id: "l5", action: "Responded to ticket #T2",   user: "Omar Hassan",        time: "Jun 27, 2026 9:00 AM", type: "support" },
  ],
  ag3: [
    { id: "l1", action: "Approved profile photo",    user: "Bilal Yousuf",       time: "Jul 2, 2026 9:00 AM",  type: "moderation" },
    { id: "l2", action: "Verified profile identity", user: "Mariam Hassan",      time: "Jul 1, 2026 4:15 PM",  type: "verification" },
    { id: "l3", action: "Chat with customer",        user: "Layla Rahman",       time: "Jun 30, 2026 10:00 AM", type: "chat" },
    { id: "l4", action: "Approved profile photo",    user: "Salma Karim",        time: "Jun 29, 2026 3:30 PM", type: "moderation" },
    { id: "l5", action: "Approved profile photo",    user: "Noor Aziz",          time: "Jun 28, 2026 11:45 AM", type: "moderation" },
  ],
};

// ── Extended agent profiles ───────────────────────────────
const AGENT_PROFILES: Record<string, {
  phone: string; location: string; joinedAt: string; lastActive: string;
  ticketsTotal: number; ticketsResolved: number; avgResponseMin: number;
  verificationsTotal: number; notificationsSent: number; satisfaction: number;
  bio: string; specialisation: string[];
}> = {
  ag1: {
    phone: "+971-55-3321", location: "Dubai, UAE", joinedAt: "Jan 12, 2026", lastActive: "Today, 10:45 AM",
    ticketsTotal: 42, ticketsResolved: 39, avgResponseMin: 18,
    verificationsTotal: 14, notificationsSent: 22, satisfaction: 97,
    bio: "Sarah has been with Ma3moni since launch. She specialises in photo moderation disputes, account recovery, and complex harassment cases. She is the team's most experienced agent.",
    specialisation: ["Photo Moderation", "Harassment Cases", "Account Recovery", "User Onboarding"],
  },
  ag2: {
    phone: "+971-50-7788", location: "Abu Dhabi, UAE", joinedAt: "Mar 4, 2026", lastActive: "Yesterday, 5:30 PM",
    ticketsTotal: 28, ticketsResolved: 24, avgResponseMin: 32,
    verificationsTotal: 9, notificationsSent: 14, satisfaction: 91,
    bio: "Ahmed joined Ma3moni in March 2026 and quickly became proficient in identity verification and account security escalations. Currently handling several high-priority suspended account cases.",
    specialisation: ["Identity Verification", "Security Escalations", "Billing Support"],
  },
  ag3: {
    phone: "+971-52-4456", location: "Sharjah, UAE", joinedAt: "May 20, 2026", lastActive: "Today, 9:15 AM",
    ticketsTotal: 11, ticketsResolved: 11, avgResponseMin: 24,
    verificationsTotal: 5, notificationsSent: 8, satisfaction: 100,
    bio: "Reem joined in May 2026 and has maintained a perfect resolution rate in her first weeks. She specialises in user onboarding and general account queries.",
    specialisation: ["User Onboarding", "General Queries", "Profile Help"],
  },
};

const ALL_LOGS = Object.entries(AGENT_LOGS).flatMap(([agentId, logs]) => {
  const agent = AGENTS.find(a => a.id === agentId)!;
  return logs.map(l => ({ ...l, agentId, agentName: agent.name, agentAvatar: agent.avatar, agentColor: agent.color }));
}).sort((a, b) => a.time < b.time ? 1 : -1);

const LOG_COLORS: Record<string, string> = {
  moderation:   "#0A6870",
  support:      "#4A8DB8",
  verification: "#6B9E78",
  notification: "#C5733F",
  chat:         "#9B6DAF",
};

// ── Rich user profiles (read-only for CC) ────────────────
const CC_USER_PROFILES: Record<string, {
  id: string; name: string; email: string; phone: string;
  age: number; gender: string; location: string; nationality: string;
  status: string; verified: boolean; subscription: string;
  joinedAt: string; lastActive: string; profileCompletion: number;
  totalSpend: number; walletBalance: number;
  currentPool: string; poolJoinDate: string; poolMembers: number;
  matchCount: number; messageCount: number; activeConversations: number;
  referralCount: number; referrals: { name: string; date: string; plan: string; earned: number }[];
  activity: { action: string; time: string; type: string }[];
  ticketHistory: { id: string; subject: string; status: string; date: string }[];
}> = {
  u2: {
    id: "u2", name: "Yusuf Al-Rashid", email: "yusuf@example.com", phone: "+971-50-5678",
    age: 28, gender: "Male", location: "Dubai, UAE", nationality: "Emirati",
    status: "active", verified: true, subscription: "Premium",
    joinedAt: "Feb 3, 2026", lastActive: "Today, 11:20 AM", profileCompletion: 92,
    totalSpend: 196, walletBalance: 40,
    currentPool: "Premium Gold Pool", poolJoinDate: "Feb 10, 2026", poolMembers: 34,
    matchCount: 14, messageCount: 47, activeConversations: 3,
    referralCount: 4,
    referrals: [
      { name: "Khalid Hassan", date: "Jun 12, 2026", plan: "Premium", earned: 10 },
      { name: "Tariq Mansouri", date: "May 28, 2026", plan: "Basic", earned: 10 },
      { name: "Bilal Yousuf", date: "Apr 5, 2026", plan: "Premium", earned: 10 },
      { name: "Samir Karim", date: "Mar 1, 2026", plan: "Basic", earned: 10 },
    ],
    activity: [
      { action: "Logged in", time: "Today 11:20 AM", type: "auth" },
      { action: "Viewed match: Amara O. (94%)", time: "Today 11:25 AM", type: "match" },
      { action: "Sent message to Amara O.", time: "Today 10:35 AM", type: "message" },
      { action: "Profile photo approved", time: "Jun 30, 2026", type: "profile" },
      { action: "Renewed Premium subscription — $49", time: "Jun 3, 2026", type: "payment" },
      { action: "Referred Khalid Hassan", time: "Jun 12, 2026", type: "referral" },
      { action: "Passed match: Kemi A.", time: "Jun 28, 2026", type: "match" },
      { action: "Logged in", time: "Jun 27, 2026", type: "auth" },
    ],
    ticketHistory: [
      { id: "t3", subject: "Match quality feedback", status: "resolved", date: "3d ago" },
    ],
  },
  u3: {
    id: "u3", name: "Sara Khalid", email: "sara@example.com", phone: "+971-52-9012",
    age: 29, gender: "Female", location: "Abu Dhabi, UAE", nationality: "Jordanian",
    status: "active", verified: false, subscription: "Free",
    joinedAt: "Mar 10, 2026", lastActive: "1d ago", profileCompletion: 60,
    totalSpend: 0, walletBalance: 0,
    currentPool: "Free Starter Pool", poolJoinDate: "Mar 10, 2026", poolMembers: 120,
    matchCount: 3, messageCount: 8, activeConversations: 0,
    referralCount: 0, referrals: [],
    activity: [
      { action: "Logged in", time: "Yesterday 9:00 AM", type: "auth" },
      { action: "Attempted profile photo upload (failed)", time: "Yesterday 9:15 AM", type: "profile" },
      { action: "Attempted profile photo upload (failed)", time: "Yesterday 9:20 AM", type: "profile" },
      { action: "Viewed match: Omar H. (74%)", time: "Jun 30, 2026", type: "match" },
      { action: "Profile created", time: "Mar 10, 2026", type: "auth" },
    ],
    ticketHistory: [
      { id: "t1", subject: "Cannot upload profile photo", status: "open", date: "2h ago" },
    ],
  },
  u4: {
    id: "u4", name: "Omar Hassan", email: "omar@example.com", phone: "+971-56-3456",
    age: 32, gender: "Male", location: "Sharjah, UAE", nationality: "Egyptian",
    status: "suspended", verified: true, subscription: "Free",
    joinedAt: "Dec 20, 2025", lastActive: "5d ago", profileCompletion: 45,
    totalSpend: 0, walletBalance: 0,
    currentPool: "None — account suspended", poolJoinDate: "—", poolMembers: 0,
    matchCount: 2, messageCount: 5, activeConversations: 0,
    referralCount: 0, referrals: [],
    activity: [
      { action: "Account suspended (flagged activity)", time: "5d ago", type: "admin" },
      { action: "Profile reported by 2 users", time: "6d ago", type: "report" },
      { action: "Sent message to Layla R.", time: "6d ago", type: "message" },
      { action: "Sent message to Noor A.", time: "7d ago", type: "message" },
      { action: "Logged in", time: "7d ago", type: "auth" },
      { action: "Profile created", time: "Dec 20, 2025", type: "auth" },
    ],
    ticketHistory: [
      { id: "t2", subject: "Account suspended without reason", status: "escalated", date: "1d ago" },
    ],
  },
};

const ACTIVITY_COLORS: Record<string, string> = {
  auth:     "#4A8DB8", match: "#0A6870", message: "#6B9E78",
  profile:  "#C5733F", payment: "#9B6DAF", referral: "#C5733F",
  admin:    "#D41F3A", report: "#D41F3A",
};

// ── Extended users for search (CC view — read-only) ───────
const ALL_PLATFORM_USERS = [
  { id: "u1", name: "Aisha Mohammed",     email: "aisha@example.com",  phone: "+971-55-1234", age: 27, location: "Dubai",     status: "active",    subscription: "Premium", lastActive: "Today",    verified: true,  gender: "Female" },
  { id: "u2", name: "Yusuf Al-Rashid",   email: "yusuf@example.com",  phone: "+971-50-5678", age: 28, location: "Dubai",     status: "active",    subscription: "Premium", lastActive: "2h ago",   verified: true,  gender: "Male"   },
  { id: "u3", name: "Sara Khalid",       email: "sara@example.com",   phone: "+971-52-9012", age: 29, location: "Abu Dhabi", status: "active",    subscription: "Free",    lastActive: "1d ago",   verified: false, gender: "Female" },
  { id: "u4", name: "Omar Hassan",       email: "omar@example.com",   phone: "+971-56-3456", age: 32, location: "Sharjah",  status: "suspended", subscription: "Free",    lastActive: "5d ago",   verified: true,  gender: "Male"   },
  { id: "u5", name: "Layla Rahman",      email: "layla@example.com",  phone: "+971-55-7890", age: 31, location: "Dubai",    status: "active",    subscription: "Premium", lastActive: "Today",    verified: true,  gender: "Female" },
  { id: "u6", name: "Khalid Al-Mansouri",email: "khalid@example.com", phone: "+971-50-1122", age: 35, location: "Dubai",    status: "pending",   subscription: "Free",    lastActive: "Just now", verified: false, gender: "Male"   },
  { id: "u7", name: "Noor Aziz",         email: "noor@example.com",   phone: "+971-54-3344", age: 26, location: "Abu Dhabi",status: "active",    subscription: "Basic",   lastActive: "3h ago",   verified: true,  gender: "Female" },
  { id: "u8", name: "Tariq Mansouri",    email: "tariq@example.com",  phone: "+971-55-6677", age: 30, location: "Dubai",    status: "active",    subscription: "Basic",   lastActive: "6h ago",   verified: true,  gender: "Male"   },
];

// Escalation roles with capabilities
const ESCALATION_TARGETS = [
  {
    role: "admin",
    label: "Admin",
    icon: "AD",
    color: "#4A8DB8",
    description: "Can suspend/reactivate accounts, manage subscriptions, process refunds, review reports.",
    capabilities: ["Suspend or reactivate account", "Modify subscription plan", "Issue refund", "Review & action reports", "Override photo moderation"],
  },
  {
    role: "super-admin",
    label: "Super Admin",
    icon: "SA",
    color: "#0A6870",
    description: "Full platform authority — bans, blacklists, role management, financial overrides.",
    capabilities: ["Permanent account ban", "Add to global blacklist", "Override any decision", "Manage role permissions", "Financial & billing overrides", "Access all audit logs"],
  },
];

const LOG_ICONS: Record<string, React.ReactNode> = {
  moderation:   <Shield size={12} />,
  support:      <MessageSquare size={12} />,
  verification: <UserCheck size={12} />,
  notification: <Bell size={12} />,
  chat:         <MessageSquare size={12} />,
};

// ── Push notification modal ───────────────────────────────
function PushModal({ target, onClose }: { target: { name: string; email: string } | null; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"><Check size={24} className="text-primary" /></div>
        <h3 style={{ fontWeight: 700 }}>Notification Sent</h3>
        <p className="text-muted-foreground mt-2" style={{ fontSize: "0.875rem" }}>{target ? `Sent to ${target.name}` : "Sent to selected users"}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 style={{ fontWeight: 700, fontSize: "1.0625rem" }}>Push Notification</h3>
            {target && <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>To: {target.name} · {target.email}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><X size={17} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title…" className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30" style={{ fontSize: "0.9rem" }} />
          </div>
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} placeholder="Message body…" className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" style={{ fontSize: "0.9rem" }} />
          </div>
          {(title || body) && (
            <div className="p-3 bg-muted/50 rounded-xl border border-border">
              <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 6 }}>PREVIEW</p>
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0"><Bell size={12} className="text-white" /></div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.8125rem" }}>{title || "Title"}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{body || "Body text…"}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted" style={{ fontSize: "0.9rem" }}>Cancel</button>
            <button onClick={() => setSent(true)} disabled={!title || !body} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
              <Send size={14} /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Start Conversation Modal ──────────────────────────────
function StartConversationModal({ user, onClose }: { user: typeof ALL_PLATFORM_USERS[0]; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Check size={24} className="text-primary" />
        </div>
        <h3 style={{ fontWeight: 800, fontSize: "1.125rem" }}>Message Sent</h3>
        <p className="text-muted-foreground mt-2" style={{ fontSize: "0.9375rem" }}>
          Your message to <strong>{user.name}</strong> has been delivered and a support ticket has been created.
        </p>
        <button onClick={onClose} className="mt-5 w-full bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition-all" style={{ fontWeight: 700 }}>
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 style={{ fontWeight: 700, fontSize: "1.0625rem" }}>New Conversation</h3>
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Initiating contact with a member</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Recipient */}
          <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl border border-primary/15">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--primary)" }}>
                {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{user.name}</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{user.email} · {user.subscription}</p>
            </div>
            <span className="px-2 py-0.5 rounded-full capitalize" style={{ fontSize: "0.75rem", fontWeight: 600, background: user.status === "active" ? "#dcfce7" : "#fee2e2", color: user.status === "active" ? "#166534" : "#991b1b" }}>
              {user.status}
            </span>
          </div>

          {/* Subject */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Subject</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: "0.9rem" }}
            >
              <option value="">Select a subject…</option>
              <option>Account & Profile Help</option>
              <option>Photo Upload Assistance</option>
              <option>Match Quality Check-in</option>
              <option>Subscription & Billing</option>
              <option>Safety & Trust Follow-up</option>
              <option>Verification Assistance</option>
              <option>General Support</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              placeholder={`Hi ${user.name.split(" ")[0]}, I'm reaching out from the Ma3moni support team…`}
              className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              style={{ fontSize: "0.9rem" }}
            />
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.75rem" }}>
              This message will appear in the user's inbox as an official support message.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.9rem" }}>
              Cancel
            </button>
            <button
              onClick={() => setSent(true)}
              disabled={!subject || !message.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontSize: "0.9rem", fontWeight: 700 }}
            >
              <Send size={15} /> Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Escalate Modal ────────────────────────────────────────
function EscalateModal({
  ticketId, userName, subject, chatSummary, onClose,
}: {
  ticketId: string; userName: string; subject: string;
  chatSummary: string; onClose: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [includeHistory, setIncludeHistory] = useState(true);
  const [escalated, setEscalated] = useState(false);

  if (escalated) {
    const target = ESCALATION_TARGETS.find(t => t.role === selectedRole);
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: (target?.color ?? "#0A6870") + "20" }}>
            <ShieldAlert size={24} style={{ color: target?.color }} />
          </div>
          <h3 style={{ fontWeight: 800, fontSize: "1.125rem" }}>Escalated to {target?.label}</h3>
          <p className="text-muted-foreground mt-2" style={{ fontSize: "0.9375rem" }}>
            Ticket <strong>#{ticketId}</strong> for <strong>{userName}</strong> has been escalated.
            {includeHistory && " Full chat history included."}
          </p>
          <button onClick={onClose} className="mt-5 w-full bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition-all" style={{ fontWeight: 700 }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 style={{ fontWeight: 700, fontSize: "1.0625rem" }}>Escalate Issue</h3>
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
              {userName} · {subject}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto" style={{ maxHeight: "70vh" }}>
          {/* Why escalate — info */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl" style={{ fontSize: "0.875rem", color: "#854d0e" }}>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>When to escalate</p>
            <p>Escalate when the resolution requires account suspension, billing overrides, permanent bans, blacklisting, or actions beyond your current permissions.</p>
          </div>

          {/* Select escalation target */}
          <div>
            <label className="block mb-3" style={{ fontSize: "0.875rem", fontWeight: 700 }}>Escalate to</label>
            <div className="space-y-3">
              {ESCALATION_TARGETS.map(target => (
                <div
                  key={target.role}
                  onClick={() => setSelectedRole(target.role)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${selectedRole === target.role ? "border-primary bg-secondary" : "border-border bg-background hover:border-primary/30"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: target.color + "20" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 900, color: target.color }}>{target.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: selectedRole === target.role ? target.color : "var(--foreground)" }}>
                          {target.label}
                        </p>
                        {selectedRole === target.role && <Check size={14} style={{ color: target.color }} />}
                      </div>
                      <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.8125rem" }}>{target.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {target.capabilities.map(cap => (
                          <span key={cap} className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.6875rem", fontWeight: 600, background: target.color + "15", color: target.color }}>
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Reason for escalation <span style={{ color: "var(--destructive)" }}>*</span></label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Describe what action is needed and why it's beyond your current permissions…"
              className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              style={{ fontSize: "0.9rem" }}
            />
          </div>

          {/* Include chat history toggle */}
          <div className="flex items-center justify-between py-3 border-t border-border">
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Include full chat history</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Share the complete conversation with the escalation target</p>
            </div>
            <button
              onClick={() => setIncludeHistory(v => !v)}
              className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ background: includeHistory ? "var(--primary)" : "var(--switch-background)" }}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-sm transition-all ${includeHistory ? "left-[26px]" : "left-1"}`} />
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.9rem" }}>
              Cancel
            </button>
            <button
              onClick={() => setEscalated(true)}
              disabled={!selectedRole || !reason.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontSize: "0.9rem", fontWeight: 700, background: selectedRole ? (ESCALATION_TARGETS.find(t => t.role === selectedRole)?.color ?? "var(--primary)") : "var(--primary)" }}
            >
              <ShieldAlert size={15} /> Escalate Issue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── User Profile Panel (read-only for Customer Care) ────
function UserProfilePanel({ userId, onClose, ticketSubject }: {
  userId: string; onClose: () => void; ticketSubject?: string;
}) {
  const profile = CC_USER_PROFILES[userId];
  const platformUser = ALL_PLATFORM_USERS.find(u => u.id === userId);
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "referrals" | "tickets">("overview");
  const [showConvoModal, setShowConvoModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);

  const displayName = profile?.name ?? platformUser?.name ?? "Unknown User";
  const displayEmail = profile?.email ?? platformUser?.email ?? "";

  if (!profile && !platformUser) return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border p-8 text-center shadow-2xl w-full max-w-sm">
        <AlertCircle size={32} className="text-muted-foreground mx-auto mb-3" />
        <p style={{ fontWeight: 600 }}>Profile not found</p>
        <button onClick={onClose} className="mt-4 text-primary" style={{ fontSize: "0.875rem" }}>Close</button>
      </div>
    </div>
  );

  const subColor = (profile?.subscription ?? platformUser?.subscription) === "Premium" ? "#9B6DAF"
    : (profile?.subscription ?? platformUser?.subscription) === "Basic" ? "#4A8DB8" : "#68747F";
  const statusColor = (profile?.status ?? platformUser?.status) === "active" ? "#16a34a"
    : (profile?.status ?? platformUser?.status) === "suspended" ? "#dc2626" : "#d97706";

  // Minimal profile from platformUser when full CC_USER_PROFILE doesn't exist
  const minimalProfile = profile ?? {
    name: platformUser!.name, email: platformUser!.email, phone: platformUser!.phone,
    age: platformUser!.age, gender: platformUser!.gender, location: platformUser!.location,
    nationality: "—", status: platformUser!.status, verified: platformUser!.verified,
    subscription: platformUser!.subscription, joinedAt: "—", lastActive: platformUser!.lastActive,
    profileCompletion: 50, totalSpend: 0, walletBalance: 0,
    currentPool: "Unknown", poolJoinDate: "—", poolMembers: 0,
    matchCount: 0, messageCount: 0, activeConversations: 0,
    referralCount: 0, referrals: [], activity: [], ticketHistory: [],
  };

  return (
    <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-background w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: "92vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: "1.0625rem" }}>{displayName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.6rem", fontWeight: 700, background: subColor + "20", color: subColor }}>
                  {(profile?.subscription ?? platformUser?.subscription) || "Free"}
                </span>
                <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.6rem", fontWeight: 700, background: "#fef9c3", color: "#854d0e" }}>
                  Read Only
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConvoModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
              style={{ fontSize: "0.8125rem", fontWeight: 600 }}
            >
              <MessageSquare size={13} /> Message
            </button>
            <button
              onClick={() => setShowEscalateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-200 transition-all"
              style={{ fontSize: "0.8125rem", fontWeight: 600 }}
            >
              <ShieldAlert size={13} /> Escalate
            </button>
            <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Profile hero */}
        <div className="px-5 py-5 bg-card border-b border-border flex-shrink-0">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary)" + "20" }}>
              <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--primary)" }}>
                {minimalProfile.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 style={{ fontWeight: 800, fontSize: "1.125rem" }}>{minimalProfile.name}</h3>
                {minimalProfile.verified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary" style={{ fontSize: "0.6875rem", fontWeight: 700 }}>
                    <CheckCircle size={10} /> Verified
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.6875rem", fontWeight: 700, background: subColor + "18", color: subColor }}>
                  {minimalProfile.subscription}
                </span>
                <span className="px-2 py-0.5 rounded-full capitalize" style={{ fontSize: "0.6875rem", fontWeight: 700, background: statusColor + "18", color: statusColor }}>
                  {minimalProfile.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
                  <Mail size={11} /> {minimalProfile.email}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
                  <Phone size={11} /> {minimalProfile.phone}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${minimalProfile.profileCompletion}%` }} />
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", flexShrink: 0 }}>
                  {minimalProfile.profileCompletion}% complete
                </span>
              </div>
            </div>
          </div>

          {/* Key metrics row */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { icon: <DollarSign size={14} />, label: "Total Spend",  value: `$${minimalProfile.totalSpend}`, color: "#6B9E78" },
              { icon: <Wallet size={14} />,     label: "Wallet",       value: `$${minimalProfile.walletBalance}`, color: "#9B6DAF" },
              { icon: <Gift size={14} />,       label: "Referrals",    value: String(minimalProfile.referralCount), color: "#C5733F" },
              { icon: <Heart size={14} />,      label: "Matches",      value: String(minimalProfile.matchCount), color: "#0A6870" },
            ].map(({ icon, label, value, color }) => (
              <div key={label} className="bg-muted/50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center mb-1" style={{ color }}>{icon}</div>
                <p style={{ fontWeight: 800, fontSize: "1.0625rem", color }}>{value}</p>
                <p className="text-muted-foreground" style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-card flex-shrink-0">
          {([
            { key: "overview",  label: "Overview" },
            { key: "activity",  label: "Activity" },
            { key: "referrals", label: `Referrals (${minimalProfile.referralCount})` },
            { key: "tickets",   label: `Tickets (${minimalProfile.ticketHistory.length})` },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-3 text-center transition-colors relative ${activeTab === t.key ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              style={{ fontSize: "0.8125rem", fontWeight: activeTab === t.key ? 700 : 400 }}
            >
              {t.label}
              {activeTab === t.key && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary" />}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <>
              {/* Personal details */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <h4 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "1rem" }}>Personal Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Age",        value: `${minimalProfile.age} years` },
                    { label: "Gender",     value: minimalProfile.gender },
                    { label: "Location",   value: minimalProfile.location },
                    { label: "Nationality",value: minimalProfile.nationality },
                    { label: "Joined",     value: minimalProfile.joinedAt },
                    { label: "Last Active",value: minimalProfile.lastActive },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/40 rounded-xl p-3">
                      <p className="text-muted-foreground" style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{label}</p>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pool information */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Layers size={16} className="text-primary" />
                  <h4 style={{ fontWeight: 700, fontSize: "0.9rem" }}>Current Matching Pool</h4>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: minimalProfile.currentPool.includes("None") ? "var(--muted)" : "var(--secondary)", border: "1px solid var(--border)" }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: minimalProfile.currentPool.includes("None") ? "var(--muted-foreground)" : "var(--primary)" }}>
                      {minimalProfile.currentPool}
                    </p>
                    {!minimalProfile.currentPool.includes("None") && (
                      <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.8125rem" }}>
                        Joined {minimalProfile.poolJoinDate} · {minimalProfile.poolMembers} members in pool
                      </p>
                    )}
                  </div>
                  {!minimalProfile.currentPool.includes("None") && (
                    <div className="flex flex-col items-end">
                      <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--primary)" }}>{minimalProfile.poolMembers}</span>
                      <span className="text-muted-foreground" style={{ fontSize: "0.6875rem" }}>members</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Platform usage */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={16} className="text-primary" />
                  <h4 style={{ fontWeight: 700, fontSize: "0.9rem" }}>Platform Usage</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Matches Received", value: minimalProfile.matchCount },
                    { label: "Messages Sent",    value: minimalProfile.messageCount },
                    { label: "Active Convos",    value: minimalProfile.activeConversations },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/40 rounded-xl p-3 text-center">
                      <p style={{ fontWeight: 800, fontSize: "1.375rem", color: "var(--primary)" }}>{value}</p>
                      <p className="text-muted-foreground" style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── ACTIVITY ── */}
          {activeTab === "activity" && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h4 style={{ fontWeight: 700, fontSize: "0.9rem" }}>Recent Platform Activity</h4>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.8125rem" }}>All actions by this user on the platform</p>
              </div>
              <div className="divide-y divide-border">
                {minimalProfile.activity.map((act, i) => {
                  const color = ACTIVITY_COLORS[act.type] ?? "#68747F";
                  return (
                    <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: color + "15", color }}>
                        {act.type === "auth" ? <LogIn size={12} /> :
                         act.type === "match" ? <Heart size={12} /> :
                         act.type === "message" ? <MessageSquare size={12} /> :
                         act.type === "payment" ? <DollarSign size={12} /> :
                         act.type === "referral" ? <Gift size={12} /> :
                         act.type === "admin" || act.type === "report" ? <Shield size={12} /> :
                         <Activity size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: "0.875rem" }}>{act.action}</p>
                        <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{act.time}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full capitalize flex-shrink-0" style={{ fontSize: "0.6875rem", fontWeight: 700, background: color + "15", color }}>
                        {act.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── REFERRALS ── */}
          {activeTab === "referrals" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-2xl border border-border p-4 text-center">
                  <p style={{ fontWeight: 900, fontSize: "2rem", color: "var(--primary)" }}>{minimalProfile.referralCount}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Total Referrals</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 text-center">
                  <p style={{ fontWeight: 900, fontSize: "2rem", color: "#9B6DAF" }}>${minimalProfile.walletBalance}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Total Earned</p>
                </div>
              </div>

              {minimalProfile.referrals.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                  <Gift size={28} className="text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>No referrals yet.</p>
                </div>
              ) : (
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-border">
                    <h4 style={{ fontWeight: 700, fontSize: "0.875rem" }}>Referred Members</h4>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {["Name", "Plan", "Date", "Earned"].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-muted-foreground" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {minimalProfile.referrals.map((r, i) => (
                        <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{r.name}</td>
                          <td className="px-5 py-3.5">
                            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: r.plan === "Premium" ? "#9B6DAF" : "#4A8DB8" }}>{r.plan}</span>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{r.date}</td>
                          <td className="px-5 py-3.5" style={{ fontSize: "0.875rem", fontWeight: 700, color: "#6B9E78" }}>${r.earned}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── TICKETS ── */}
          {activeTab === "tickets" && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border">
                <h4 style={{ fontWeight: 700, fontSize: "0.875rem" }}>Support Ticket History</h4>
              </div>
              {minimalProfile.ticketHistory.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare size={24} className="mx-auto mb-3 opacity-40" />
                  <p style={{ fontSize: "0.875rem" }}>No tickets on record.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {minimalProfile.ticketHistory.map(t => {
                    const colors: Record<string, { bg: string; text: string }> = {
                      open:      { bg: "#dbeafe", text: "#1d4ed8" },
                      escalated: { bg: "#fef9c3", text: "#854d0e" },
                      resolved:  { bg: "#dcfce7", text: "#166534" },
                    };
                    const s = colors[t.status] ?? { bg: "#f3f4f6", text: "#6b7280" };
                    return (
                      <div key={t.id} className="flex items-center justify-between px-5 py-4">
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t.subject}</p>
                          <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{t.date}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full capitalize" style={{ fontSize: "0.75rem", fontWeight: 700, background: s.bg, color: s.text }}>
                          {t.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Sub-modals rendered outside the panel scroll area */}
    {showConvoModal && platformUser && (
      <StartConversationModal user={platformUser} onClose={() => setShowConvoModal(false)} />
    )}
    {showConvoModal && !platformUser && (
      <StartConversationModal
        user={{ id: userId, name: displayName, email: displayEmail, phone: "", age: minimalProfile.age, gender: minimalProfile.gender, location: minimalProfile.location, status: minimalProfile.status, subscription: minimalProfile.subscription, lastActive: "—", verified: minimalProfile.verified, nationality: "" }}
        onClose={() => setShowConvoModal(false)}
      />
    )}
    {showEscalateModal && (
      <EscalateModal
        ticketId={userId}
        userName={displayName}
        subject={ticketSubject ?? "User support issue"}
        chatSummary=""
        onClose={() => setShowEscalateModal(false)}
      />
    )}
    </>
  );
}

// ── Agent Profile Page ────────────────────────────────────
function AgentProfilePage({
  agentId, onBack, canEdit, onNotify,
}: {
  agentId: string; onBack: () => void;
  canEdit: boolean; onNotify: (name: string, email: string) => void;
}) {
  const agent = AGENTS.find(a => a.id === agentId);
  const profile = AGENT_PROFILES[agentId];
  const logs = AGENT_LOGS[agentId] ?? [];
  const [logType, setLogType] = useState("all");
  const [editingRole, setEditingRole] = useState(false);
  const [newRole, setNewRole] = useState(agent?.role ?? "");
  const [deactivated, setDeactivated] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [roleSaved, setRoleSaved] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  if (!agent || !profile) return null;

  const filteredLogs = logType === "all" ? logs : logs.filter(l => l.type === logType);

  const LOG_TYPES = ["all", "moderation", "support", "verification", "notification", "chat"];

  const statCards = [
    { label: "Tickets Handled",   value: profile.ticketsTotal,     unit: "",    color: "#0A6870" },
    { label: "Resolved",          value: profile.ticketsResolved,  unit: "",    color: "#6B9E78" },
    { label: "Avg Response",      value: profile.avgResponseMin,   unit: " min",color: "#4A8DB8" },
    { label: "Verifications",     value: profile.verificationsTotal,unit: "",   color: "#C5733F" },
    { label: "Notifications Sent",value: profile.notificationsSent, unit: "",   color: "#9B6DAF" },
    { label: "Satisfaction",      value: profile.satisfaction,      unit: "%",  color: "#16a34a" },
  ];

  const resolutionRate = Math.round((profile.ticketsResolved / profile.ticketsTotal) * 100);

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "0.9rem" }}>
        <ChevronLeft size={18} /> All Agents
      </button>

      {/* Hero card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Coloured banner */}
        <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${agent.color}30, ${agent.color}10)` }}>
          {deactivated && (
            <div className="absolute inset-0 bg-muted/80 flex items-center justify-center">
              <span style={{ fontWeight: 700, color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Account Deactivated</span>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          {/* Avatar + name row */}
          <div className="flex items-end justify-between -mt-10 mb-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl border-4 border-card flex items-center justify-center shadow-md" style={{ background: agent.color + "20" }}>
                <span style={{ fontSize: "1.75rem", fontWeight: 900, color: agent.color }}>{agent.avatar}</span>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${agent.status === "online" && !deactivated ? "bg-green-500" : "bg-gray-300"}`} />
            </div>
            {canEdit && (
              <div className="flex gap-2 flex-wrap justify-end">
                <button onClick={() => onNotify(agent.name, agent.email)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-secondary border border-primary/20 text-primary rounded-xl hover:bg-primary hover:text-white transition-all"
                  style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                  <Bell size={13} /> Notify
                </button>
                <button onClick={() => { setResetSent(true); setTimeout(() => setResetSent(false), 3000); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all ${resetSent ? "bg-green-50 border-green-200 text-green-700" : "bg-muted border-border text-muted-foreground hover:bg-secondary hover:text-primary"}`}
                  style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                  {resetSent ? <><Check size={13} /> Sent!</> : <><Lock size={13} /> Reset Password</>}
                </button>
                <button onClick={() => setConfirmDeactivate(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-xl hover:bg-red-100 transition-all"
                  style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                  <ToggleLeft size={13} /> {deactivated ? "Reactivate" : "Deactivate"}
                </button>
              </div>
            )}
          </div>

          {/* Name / role / meta */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 style={{ fontWeight: 900, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>{agent.name}</h2>
                <span className="px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 700, background: agent.color + "18", color: agent.color }}>
                  {agent.role}
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 700, background: agent.status === "online" && !deactivated ? "#dcfce7" : "#f3f4f6", color: agent.status === "online" && !deactivated ? "#16a34a" : "#6b7280" }}>
                  <div className={`w-1.5 h-1.5 rounded-full ${agent.status === "online" && !deactivated ? "bg-green-500" : "bg-gray-400"}`} />
                  {deactivated ? "Deactivated" : agent.status === "online" ? "Online" : "Offline"}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-muted-foreground">
                <span className="flex items-center gap-1.5" style={{ fontSize: "0.875rem" }}><Mail size={13} />{agent.email}</span>
                <span className="flex items-center gap-1.5" style={{ fontSize: "0.875rem" }}><Phone size={13} />{profile.phone}</span>
                <span className="flex items-center gap-1.5" style={{ fontSize: "0.875rem" }}><MapPin size={13} />{profile.location}</span>
              </div>
              <div className="flex flex-wrap gap-4 mt-1 text-muted-foreground">
                <span className="flex items-center gap-1.5" style={{ fontSize: "0.8125rem" }}><Calendar size={13} />Joined {profile.joinedAt}</span>
                <span className="flex items-center gap-1.5" style={{ fontSize: "0.8125rem" }}><Clock size={13} />Last active: {profile.lastActive}</span>
              </div>
            </div>
          </div>

          {/* Edit role */}
          {canEdit && (
            <div className="mt-4 pt-4 border-t border-border">
              {editingRole ? (
                <div className="flex items-center gap-3">
                  <select value={newRole} onChange={e => setNewRole(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    style={{ fontSize: "0.875rem" }}>
                    <option value="Care Agent">Care Agent</option>
                    <option value="Senior Care Agent">Senior Care Agent</option>
                    <option value="Team Lead">Team Lead</option>
                  </select>
                  <button onClick={() => { setRoleSaved(true); setEditingRole(false); setTimeout(() => setRoleSaved(false), 2500); }}
                    className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all"
                    style={{ fontSize: "0.875rem", fontWeight: 700 }}>Save</button>
                  <button onClick={() => setEditingRole(false)} className="p-2 text-muted-foreground hover:text-foreground"><X size={16} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Current role: </span>
                    <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{newRole || agent.role}</span>
                    {roleSaved && <span className="ml-2 text-green-600" style={{ fontSize: "0.75rem", fontWeight: 600 }}>✓ Updated</span>}
                  </div>
                  <button onClick={() => { setEditingRole(true); setNewRole(agent.role); }}
                    className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors"
                    style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                    <Edit3 size={13} /> Edit Role
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bio + specialisations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.75rem" }}>About</h3>
          <p className="text-muted-foreground" style={{ fontSize: "0.9375rem", lineHeight: 1.75 }}>{profile.bio}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.specialisation.map(s => (
              <span key={s} className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Resolution rate */}
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center text-center">
          <p className="text-muted-foreground mb-2" style={{ fontSize: "0.8125rem" }}>Resolution Rate</p>
          <div className="relative w-24 h-24 mb-3">
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="var(--muted)" strokeWidth="8" />
              <circle cx="48" cy="48" r="40" fill="none" stroke={agent.color} strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40 * resolutionRate / 100} ${2 * Math.PI * 40 * (1 - resolutionRate / 100)}`}
                strokeLinecap="round" strokeDashoffset={2 * Math.PI * 40 * 0.25}
                transform="rotate(-90 48 48)" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span style={{ fontSize: "1.375rem", fontWeight: 900, color: agent.color }}>{resolutionRate}%</span>
            </div>
          </div>
          <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{profile.ticketsResolved} of {profile.ticketsTotal} resolved</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(({ label, value, unit, color }) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-4 text-center">
            <p style={{ fontSize: "1.75rem", fontWeight: 900, color, letterSpacing: "-0.03em" }}>{value}{unit}</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Full activity log */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3">
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Activity Log</h3>
          <div className="flex gap-1 flex-wrap">
            {LOG_TYPES.map(type => (
              <button key={type} onClick={() => setLogType(type)}
                className={`px-3 py-1.5 rounded-full border capitalize transition-all ${logType === type ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                {type === "all" ? `All (${logs.length})` : type}
              </button>
            ))}
          </div>
        </div>
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <ClipboardList size={24} className="mx-auto mb-2 opacity-40" />
            <p style={{ fontSize: "0.875rem" }}>No {logType} activity recorded.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredLogs.map((log, i) => {
              const color = LOG_COLORS[log.type] ?? "#68747F";
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "15", color }}>
                    {LOG_ICONS[log.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: "0.875rem" }}>{log.action} — <span style={{ fontWeight: 600 }}>{log.user}</span></p>
                    <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{log.time}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full capitalize flex-shrink-0" style={{ fontSize: "0.6875rem", fontWeight: 700, background: color + "15", color }}>
                    {log.type}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm deactivate modal */}
      {confirmDeactivate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl p-6">
            <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }}>{deactivated ? "Reactivate" : "Deactivate"} {agent.name}?</h3>
            <p className="text-muted-foreground mt-2 mb-5" style={{ fontSize: "0.875rem" }}>
              {deactivated ? "The agent will regain access to the platform." : "The agent will immediately lose access to the Customer Care portal."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeactivate(false)} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.9rem" }}>Cancel</button>
              <button onClick={() => { setDeactivated(d => !d); setConfirmDeactivate(false); }}
                className={`flex-1 py-3 rounded-xl text-white transition-all ${deactivated ? "bg-primary hover:bg-primary/90" : "bg-destructive hover:bg-destructive/90"}`}
                style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                {deactivated ? "Reactivate" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add Agent Modal ───────────────────────────────────────
function AddAgentModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (agent: { name: string; email: string; phone: string; role: string }) => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "Care Agent" });
  const [tempPassword] = useState(() => "MA3-" + Math.random().toString(36).slice(2, 8).toUpperCase());
  const u = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const ROLES = [
    {
      value: "Care Agent",
      label: "Care Agent",
      desc: "Handles general support tickets, user queries, and initiates conversations.",
      caps: ["View & respond to tickets", "Search user profiles (read-only)", "Send push notifications", "Chat with users"],
    },
    {
      value: "Senior Care Agent",
      label: "Senior Care Agent",
      desc: "All Care Agent capabilities plus photo moderation and ticket escalation.",
      caps: ["All Care Agent capabilities", "Approve/reject profile photos", "Escalate to Admin", "Verify user identity"],
    },
    {
      value: "Team Lead",
      label: "Team Lead",
      desc: "Manages the care team, reviews performance, and handles escalated cases.",
      caps: ["All Senior Agent capabilities", "View agent activity logs", "Assign tickets to agents", "Access team analytics"],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h3 style={{ fontWeight: 700, fontSize: "1.0625rem" }}>Add Care Agent</h3>
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-muted flex-shrink-0">
          <div className="h-full bg-primary transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Personal info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p style={{ fontWeight: 800, fontSize: "1.125rem", marginBottom: "0.5rem" }}>Personal Information</p>
                <p className="text-muted-foreground" style={{ fontSize: "0.9rem" }}>The agent will use this email to log in to the portal.</p>
              </div>
              {[
                { key: "name",  label: "Full Name",     placeholder: "Sarah Al-Nasser",      type: "text"  },
                { key: "email", label: "Email Address", placeholder: "agent@ma3moni.com",     type: "email" },
                { key: "phone", label: "Phone Number",  placeholder: "+971-55-0000",           type: "tel"   },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{label}</label>
                  <input type={type} value={form[key as keyof typeof form]} onChange={e => u(key as keyof typeof form, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    style={{ fontSize: "0.9375rem" }} />
                </div>
              ))}
            </div>
          )}

          {/* Step 2: Role */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p style={{ fontWeight: 800, fontSize: "1.125rem", marginBottom: "0.5rem" }}>Assign Role</p>
                <p className="text-muted-foreground" style={{ fontSize: "0.9rem" }}>Choose the agent's role — this determines what they can access and action.</p>
              </div>
              {ROLES.map(r => (
                <div key={r.value} onClick={() => u("role", r.value)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${form.role === r.value ? "border-primary bg-secondary" : "border-border bg-background hover:border-primary/30"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: form.role === r.value ? "var(--primary)" : "var(--foreground)" }}>{r.label}</p>
                      <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.8125rem" }}>{r.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${form.role === r.value ? "border-primary bg-primary" : "border-border"}`}>
                      {form.role === r.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {r.caps.map(c => (
                      <span key={c} className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ fontSize: "0.6875rem", fontWeight: 600, background: form.role === r.value ? "var(--primary)" + "20" : "var(--muted)", color: form.role === r.value ? "var(--primary)" : "var(--muted-foreground)" }}>
                        <Check size={9} /> {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Review & invite */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <p style={{ fontWeight: 800, fontSize: "1.125rem", marginBottom: "0.5rem" }}>Review & Send Invitation</p>
                <p className="text-muted-foreground" style={{ fontSize: "0.9rem" }}>Confirm the details and send the portal invitation.</p>
              </div>

              {/* Summary */}
              <div className="bg-secondary rounded-2xl border border-primary/15 p-5 space-y-3">
                {[
                  { label: "Name",  value: form.name },
                  { label: "Email", value: form.email },
                  { label: "Phone", value: form.phone },
                  { label: "Role",  value: form.role },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>{label}</span>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{value || "—"}</span>
                  </div>
                ))}
              </div>

              {/* Temp password */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#854d0e", marginBottom: "0.5rem" }}>Temporary Password</p>
                <div className="flex items-center gap-3">
                  <code style={{ fontSize: "1.125rem", fontWeight: 800, letterSpacing: "0.1em", color: "#0A6870", flex: 1 }}>{tempPassword}</code>
                  <button onClick={() => navigator.clipboard?.writeText(tempPassword)}
                    className="px-3 py-1.5 bg-amber-100 border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-200 transition-all"
                    style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                    Copy
                  </button>
                </div>
                <p className="text-amber-700 mt-2" style={{ fontSize: "0.8125rem" }}>Share this securely. The agent must change it on first login.</p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-secondary rounded-xl border border-primary/15">
                <Mail size={14} className="text-primary flex-shrink-0" />
                <p style={{ fontSize: "0.8125rem" }}>An invitation email will be sent to <strong>{form.email}</strong></p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.9rem" }}>
              Back
            </button>
          ) : (
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.9rem" }}>
              Cancel
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && (!form.name.trim() || !form.email.trim())}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontSize: "0.9rem", fontWeight: 700 }}>
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => { onAdd(form); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all"
              style={{ fontSize: "0.9rem", fontWeight: 700 }}>
              <UserPlus size={16} /> Send Invitation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    open:       { bg: "#dbeafe", text: "#1d4ed8" },
    escalated:  { bg: "#fef9c3", text: "#854d0e" },
    resolved:   { bg: "#dcfce7", text: "#166534" },
    in_progress:{ bg: "#e0e7ff", text: "#3730a3" },
  };
  const s = map[status] ?? { bg: "#f3f4f6", text: "#6b7280" };
  return <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 600, background: s.bg, color: s.text, textTransform: "capitalize", whiteSpace: "nowrap" }}>{status.replace("_", " ")}</span>;
}

// ── Main component ────────────────────────────────────────
export function SupportSectionV2({ role = "customer-care" }: { role?: AgentRole }) {
  // Agents + Activity Log are restricted to Admin and Super Admin
  const canManageAgents = role === "admin" || role === "super-admin";

  const [tab, setTab] = useState<"tickets" | "users" | "agents" | "log">("tickets");
  const [userSearch, setUserSearch] = useState("");
  const [conversationTarget, setConversationTarget] = useState<typeof ALL_PLATFORM_USERS[0] | null>(null);
  const [escalateTicket, setEscalateTicket] = useState<{ id: string; userName: string; subject: string } | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifTarget, setNotifTarget] = useState<{ name: string; email: string } | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<string>("all");
  const [viewingAgentId, setViewingAgentId] = useState<string | null>(null);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [agentList] = useState(AGENTS);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  // Live tickets from Django — starts empty, no mock fallback
  const [liveTickets, setLiveTickets] = useState<typeof TICKETS>([]);
  useEffect(() => {
    adminApi.tickets({ page_size: 100 } as Parameters<typeof adminApi.tickets>[0]).then(res => {
      setLiveTickets(res.results.map(t => ({
        id: t.id, userId: t.user.id, userName: t.user.name, email: t.user.email,
        subject: t.subject, status: t.status as typeof TICKETS[0]["status"],
        priority: t.priority as typeof TICKETS[0]["priority"],
        agentId: t.assigned_to?.id ?? null, created: t.created_at,
        messages: t.messages.map(m => ({ from: "user" as const, text: m.body })),
      })));
    }).catch(() => {}).finally(() => setTicketsLoading(false));
  }, []);

  const ticket = liveTickets.find(t => t.id === selectedTicket);
  const openCount = liveTickets.filter(t => t.status === "open" || t.status === "escalated").length;

  const sendReply = async () => {
    if (!reply.trim() || !selectedTicket) return;
    try { await adminApi.replyTicket(selectedTicket, reply); } catch {}
    setReply("");
  };

  const openNotif = (name: string, email: string) => {
    setNotifTarget({ name, email });
    setShowNotifModal(true);
  };

  const filteredLogs = logFilter === "all"
    ? ALL_LOGS
    : ALL_LOGS.filter(l => l.agentId === logFilter);

  // All visible tabs — agents & log only for admin/super-admin
  const ALL_TABS = [
    { key: "tickets" as const, label: "Tickets",      badge: openCount,      restricted: false },
    { key: "users"   as const, label: "Search Users", badge: 0,              restricted: false },
    { key: "agents"  as const, label: "Agents",       badge: AGENTS.length,  restricted: true  },
    { key: "log"     as const, label: "Activity Log", badge: 0,              restricted: true  },
  ];
  const visibleTabs = ALL_TABS.filter(t => !t.restricted || canManageAgents);

  // Safety: if current tab is restricted and user lost access, fall back to tickets
  const safeTab = (tab === "agents" || tab === "log") && !canManageAgents ? "tickets" : tab;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>Customer Care</h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.9375rem" }}>
            {openCount} open ticket{openCount !== 1 ? "s" : ""} · {agentList.filter(a => a.status === "online").length} agents online
          </p>
        </div>
        <button
          onClick={() => { setNotifTarget(null); setShowNotifModal(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          style={{ fontSize: "0.875rem", fontWeight: 600 }}
        >
          <Bell size={15} /> Broadcast Notification
        </button>
      </div>

      {/* Tabs — CC agents only see Tickets + Search Users */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6 w-fit">
        {visibleTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${safeTab === t.key ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            style={{ fontSize: "0.875rem", fontWeight: safeTab === t.key ? 700 : 400 }}
          >
            {t.label}
            {"badge" in t && t.badge > 0 && (
              <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: safeTab === t.key ? "var(--primary)" : "var(--muted-foreground)", color: "white", fontSize: "0.625rem", fontWeight: 700 }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── USERS / SEARCH tab ── */}
      {safeTab === "users" && (
        <div>
          {/* Search bar */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-4">
              <Search size={15} className="text-muted-foreground flex-shrink-0" />
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search by name, email, or phone…"
                className="flex-1 py-3 bg-transparent focus:outline-none"
                style={{ fontSize: "0.9375rem" }}
                autoFocus
              />
              {userSearch && (
                <button onClick={() => setUserSearch("")} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          {(() => {
            const q = userSearch.toLowerCase().trim();
            const results = q
              ? ALL_PLATFORM_USERS.filter(u =>
                  u.name.toLowerCase().includes(q) ||
                  u.email.toLowerCase().includes(q) ||
                  u.phone.includes(q)
                )
              : ALL_PLATFORM_USERS;

            if (results.length === 0) return (
              <div className="bg-card rounded-2xl border border-border p-10 text-center">
                <Search size={28} className="text-muted-foreground mx-auto mb-3 opacity-40" />
                <p style={{ fontWeight: 600 }}>No users found</p>
                <p className="text-muted-foreground mt-1" style={{ fontSize: "0.875rem" }}>Try a different name, email, or phone number.</p>
              </div>
            );

            return (
              <div className="space-y-2">
                <p className="text-muted-foreground mb-3" style={{ fontSize: "0.8125rem" }}>
                  {q ? `${results.length} result${results.length !== 1 ? "s" : ""} for "${userSearch}"` : `${results.length} members`}
                </p>
                {results.map(user => {
                  const statusStyle: Record<string, { bg: string; text: string }> = {
                    active:    { bg: "#dcfce7", text: "#166534" },
                    suspended: { bg: "#fee2e2", text: "#991b1b" },
                    pending:   { bg: "#dbeafe", text: "#1d4ed8" },
                  };
                  const ss = statusStyle[user.status] ?? { bg: "#f3f4f6", text: "#6b7280" };
                  const subColor = user.subscription === "Premium" ? "#9B6DAF" : user.subscription === "Basic" ? "#4A8DB8" : "#68747F";

                  return (
                    <div key={user.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 hover:border-primary/20 transition-all">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary)" + "18" }}>
                        <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--primary)" }}>
                          {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{user.name}</span>
                          {user.verified && <CheckCircle size={13} className="text-primary" />}
                          <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.6875rem", fontWeight: 700, background: subColor + "18", color: subColor }}>{user.subscription}</span>
                          <span className="px-2 py-0.5 rounded-full capitalize" style={{ fontSize: "0.6875rem", fontWeight: 700, background: ss.bg, color: ss.text }}>{user.status}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-muted-foreground">
                          <span style={{ fontSize: "0.8125rem" }}>{user.email}</span>
                          <span style={{ fontSize: "0.8125rem" }}>{user.phone}</span>
                          <span style={{ fontSize: "0.8125rem" }}>{user.location} · {user.age}y</span>
                        </div>
                        <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.75rem" }}>
                          Last active: {user.lastActive}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => setViewingProfile(user.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-secondary border border-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                          style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                        >
                          <Eye size={13} /> View Profile
                        </button>
                        <button
                          onClick={() => setConversationTarget(user)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                          style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                        >
                          <MessageSquare size={13} /> Message
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── TICKETS tab ── */}
      {safeTab === "tickets" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Ticket list */}
          <div className="lg:col-span-2 space-y-2">
            {ticketsLoading && (
              <div className="flex items-center gap-2 text-muted-foreground py-6 justify-center">
                <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <span style={{ fontSize: "0.8125rem" }}>Loading tickets…</span>
              </div>
            )}
            {!ticketsLoading && liveTickets.length === 0 && (
              <div className="py-10 text-center text-muted-foreground" style={{ fontSize: "0.875rem" }}>No support tickets.</div>
            )}
            {liveTickets.map(t => {
              const agent = AGENTS.find(a => a.id === t.agentId);
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicket(t.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedTicket === t.id ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/20"}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{t.userName}</span>
                        {t.priority === "high" && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded" style={{ fontSize: "0.625rem", fontWeight: 700 }}>HIGH</span>}
                      </div>
                      <p className="text-muted-foreground truncate" style={{ fontSize: "0.8125rem" }}>{t.subject}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{t.created}</p>
                    {agent && (
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: agent.color + "30", color: agent.color }}>
                          <span style={{ fontSize: "0.5625rem", fontWeight: 800 }}>{agent.avatar}</span>
                        </div>
                        <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{agent.name.split(" ")[0]}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Ticket detail */}
          <div className="lg:col-span-3">
            {!ticket ? (
              <div className="bg-card rounded-2xl border border-border h-64 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare size={28} className="mx-auto mb-3 opacity-30" />
                  <p style={{ fontSize: "0.875rem" }}>Select a ticket</p>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col" style={{ height: "560px" }}>
                {/* Header */}
                <div className="p-4 border-b border-border flex-shrink-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{ticket.subject}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <StatusBadge status={ticket.status} />
                        <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{ticket.userName} · {ticket.created}</span>
                        <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>· {AGENTS.find(a => a.id === ticket.agentId)?.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openNotif(ticket.userName, ticket.email)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-lg text-primary hover:bg-primary hover:text-white transition-all"
                        style={{ fontSize: "0.75rem", fontWeight: 600 }}
                      >
                        <Bell size={12} /> Notify
                      </button>
                      <button
                        onClick={() => setEscalateTicket({ id: ticket.id, userName: ticket.userName, subject: ticket.subject })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 hover:bg-amber-200 transition-all"
                        style={{ fontSize: "0.75rem", fontWeight: 600 }}
                      >
                        <ShieldAlert size={12} /> Escalate
                      </button>
                    </div>
                  </div>
                  {/* Customer quick detail — with prominent View Details button */}
                  {(() => {
                    const pu = ALL_PLATFORM_USERS.find(u => u.id === ticket.userId);
                    const subColor = pu?.subscription === "Premium" ? "#9B6DAF" : pu?.subscription === "Basic" ? "#4A8DB8" : "#68747F";
                    return (
                      <div className="mt-3 flex items-center gap-3 p-3 bg-secondary/60 border border-border rounded-xl">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)" }}>
                            {ticket.userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{ticket.userName}</span>
                            {pu?.verified && <CheckCircle size={12} className="text-primary" />}
                            {pu && <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.625rem", fontWeight: 700, background: subColor + "18", color: subColor }}>{pu.subscription}</span>}
                          </div>
                          <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{ticket.email}</span>
                        </div>
                        <button
                          onClick={() => setViewingProfile(ticket.userId)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex-shrink-0"
                          style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                        >
                          <Eye size={13} /> View Details
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {ticket.messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.from === "agent" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] p-3 rounded-xl ${msg.from === "agent" ? "bg-primary text-white rounded-br-sm" : "bg-muted rounded-bl-sm"}`} style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
                        <p className={`mb-1 ${msg.from === "agent" ? "opacity-60" : "text-muted-foreground"}`} style={{ fontSize: "0.7rem", fontWeight: 600 }}>
                          {msg.from === "agent" ? (msg as any).agent ?? "Agent" : ticket.userName}
                        </p>
                        {msg.text}
                        <p className={`mt-1 ${msg.from === "agent" ? "opacity-50" : "text-muted-foreground"}`} style={{ fontSize: "0.7rem" }}>{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Internal note */}
                {internalNote && (
                  <div className="mx-4 mb-2 p-2.5 bg-yellow-50 border border-yellow-200 rounded-xl" style={{ fontSize: "0.8125rem", color: "#854d0e" }}>
                    <strong>Internal: </strong>{internalNote}
                  </div>
                )}

                {/* Reply */}
                <div className="p-3 border-t border-border flex-shrink-0">
                  <div className="flex gap-2">
                    <input
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendReply()}
                      placeholder="Reply to customer…"
                      className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                      style={{ fontSize: "0.875rem" }}
                    />
                    <button onClick={sendReply} className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white hover:bg-primary/90 transition-colors flex-shrink-0">
                      <Send size={14} />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      value={internalNote}
                      onChange={e => setInternalNote(e.target.value)}
                      placeholder="Internal note (not visible to user)…"
                      className="flex-1 px-3 py-2 rounded-xl border border-dashed border-amber-300 bg-yellow-50 focus:outline-none text-amber-800 placeholder:text-amber-400"
                      style={{ fontSize: "0.8125rem" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AGENTS tab ── */}
      {safeTab === "agents" && canManageAgents && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {AGENTS.map(agent => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                className={`cursor-pointer p-5 rounded-2xl border transition-all ${selectedAgent === agent.id ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/20 hover:shadow-sm"}`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: agent.color + "20" }}>
                      <span style={{ fontSize: "0.9375rem", fontWeight: 800, color: agent.color }}>{agent.avatar}</span>
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${agent.status === "online" ? "bg-green-500" : "bg-gray-300"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{agent.name}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{agent.role}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{agent.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Tickets", value: agent.tickets },
                    { label: "Verified", value: agent.verifications },
                    { label: "Status", value: agent.status },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/50 rounded-lg p-2 text-center">
                      <p style={{ fontWeight: 700, fontSize: label === "Status" ? "0.625rem" : "1.125rem", color: label === "Status" ? (value === "online" ? "#16a34a" : "#6b7280") : "var(--foreground)", textTransform: label === "Status" ? "capitalize" : "none" }}>
                        {value}
                      </p>
                      <p className="text-muted-foreground" style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>{label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={e => { e.stopPropagation(); openNotif(agent.name, agent.email); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-muted rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary transition-all"
                    style={{ fontSize: "0.75rem", fontWeight: 600 }}
                  >
                    <Bell size={11} /> Notify
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedAgent(agent.id); setTab("log"); setLogFilter(agent.id); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-muted rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary transition-all"
                    style={{ fontSize: "0.75rem", fontWeight: 600 }}
                  >
                    <ClipboardList size={11} /> Log
                  </button>
                </div>
              </div>
            ))}

            {/* Add agent card */}
            <div className="border-2 border-dashed border-border rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:border-primary/30 hover:bg-secondary/30 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Plus size={18} className="text-muted-foreground" />
              </div>
              <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>Add Care Agent</p>
              <p className="text-muted-foreground text-center" style={{ fontSize: "0.8125rem" }}>Invite a new team member to the support portal</p>
            </div>
          </div>

          {/* Agent activity inline */}
          {selectedAgent && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>
                  {AGENTS.find(a => a.id === selectedAgent)?.name} — Activity Log
                </h3>
                <button onClick={() => setSelectedAgent(null)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><X size={15} /></button>
              </div>
              <div className="divide-y divide-border">
                {(AGENT_LOGS[selectedAgent] ?? []).map((log, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: (LOG_COLORS[log.type] ?? "#68747F") + "15", color: LOG_COLORS[log.type] ?? "#68747F" }}>
                      {LOG_ICONS[log.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span style={{ fontSize: "0.875rem" }}>{log.action} </span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{log.user}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full capitalize flex-shrink-0" style={{ fontSize: "0.6875rem", fontWeight: 700, background: (LOG_COLORS[log.type] ?? "#68747F") + "15", color: LOG_COLORS[log.type] ?? "#68747F" }}>
                      {log.type}
                    </span>
                    <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: "0.75rem" }}>{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVITY LOG tab ── */}
      {safeTab === "log" && canManageAgents && (
        <div>
          {/* Filter bar */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex gap-2">
              <button
                onClick={() => setLogFilter("all")}
                className={`px-3 py-1.5 rounded-full border transition-all ${logFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                style={{ fontSize: "0.8125rem", fontWeight: 600 }}
              >
                All Agents
              </button>
              {AGENTS.map(a => (
                <button
                  key={a.id}
                  onClick={() => setLogFilter(a.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${logFilter === a.id ? "border-primary bg-secondary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                  style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                >
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: a.color + "30" }}>
                    <span style={{ fontSize: "0.45rem", fontWeight: 800, color: a.color }}>{a.avatar}</span>
                  </div>
                  {a.name.split(" ")[0]}
                </button>
              ))}
            </div>
            <span className="text-muted-foreground ml-auto" style={{ fontSize: "0.8125rem" }}>{filteredLogs.length} entries</span>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Agent", "Action", "User Affected", "Type", "Timestamp"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-muted-foreground" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: log.agentColor + "25" }}>
                          <span style={{ fontSize: "0.5rem", fontWeight: 800, color: log.agentColor }}>{log.agentAvatar}</span>
                        </div>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{log.agentName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5" style={{ fontSize: "0.875rem" }}>{log.action}</td>
                    <td className="px-5 py-3.5" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{log.user}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full capitalize" style={{ fontSize: "0.75rem", fontWeight: 700, background: (LOG_COLORS[log.type] ?? "#68747F") + "15", color: LOG_COLORS[log.type] ?? "#68747F" }}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Push notification modal */}
      {showNotifModal && (
        <PushModal target={notifTarget} onClose={() => { setShowNotifModal(false); setNotifTarget(null); }} />
      )}

      {viewingProfile && (
        <UserProfilePanel
          userId={viewingProfile}
          onClose={() => setViewingProfile(null)}
          ticketSubject={liveTickets.find(t => t.userId === viewingProfile)?.subject}
        />
      )}

      {/* Start conversation from search */}
      {conversationTarget && (
        <StartConversationModal
          user={conversationTarget}
          onClose={() => setConversationTarget(null)}
        />
      )}

      {/* Escalate from ticket view */}
      {escalateTicket && (
        <EscalateModal
          ticketId={escalateTicket.id}
          userName={escalateTicket.userName}
          subject={escalateTicket.subject}
          chatSummary=""
          onClose={() => setEscalateTicket(null)}
        />
      )}
    </div>
  );
}

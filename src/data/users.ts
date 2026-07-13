// ── Shared admin user directory ───────────────────────────
// Single source of truth for the demo user list. Both the admin overview
// (AdminApp) and the Users section (UsersSectionV2) import from here so the
// two views can never drift apart.

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  location: string;
  gender: "male" | "female";
  status: "active" | "suspended" | "pending" | "deactivated";
  verified: boolean;
  subscription: "free" | "basic" | "premium";
  joined: string;
  lastActive: string;
  completion: number;
}

export const USERS: AdminUser[] = [
  { id: "u1", name: "Aisha Mohammed",     email: "aisha@example.com",  phone: "+971-55-1234", age: 27, location: "Dubai",     gender: "female", status: "active",    verified: true,  subscription: "premium", joined: "Jan 15, 2026", lastActive: "Today",    completion: 95 },
  { id: "u2", name: "Yusuf Al-Rashid",    email: "yusuf@example.com",  phone: "+971-50-5678", age: 28, location: "Dubai",     gender: "male",   status: "active",    verified: true,  subscription: "basic",   joined: "Feb 3, 2026",  lastActive: "2h ago",   completion: 72 },
  { id: "u3", name: "Sara Khalid",        email: "sara@example.com",   phone: "+971-52-9012", age: 29, location: "Abu Dhabi", gender: "female", status: "active",    verified: false, subscription: "free",    joined: "Mar 10, 2026", lastActive: "1d ago",   completion: 60 },
  { id: "u4", name: "Omar Hassan",        email: "omar@example.com",   phone: "+971-56-3456", age: 32, location: "Sharjah",   gender: "male",   status: "suspended", verified: true,  subscription: "free",    joined: "Dec 20, 2025", lastActive: "5d ago",   completion: 45 },
  { id: "u5", name: "Layla Rahman",       email: "layla@example.com",  phone: "+971-55-7890", age: 31, location: "Dubai",     gender: "female", status: "active",    verified: true,  subscription: "premium", joined: "Nov 8, 2025",  lastActive: "Today",    completion: 98 },
  { id: "u6", name: "Khalid Al-Mansouri", email: "khalid@example.com", phone: "+971-50-1122", age: 35, location: "Dubai",     gender: "male",   status: "pending",   verified: false, subscription: "free",    joined: "Jun 28, 2026", lastActive: "Just now", completion: 30 },
];

import { useState, useRef, useMemo, useEffect, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import {
  matches as matchesApi,
  messaging as messagingApi,
  notifications as notifsApi,
  moderation as moderationApi,
  subscriptions as subsApi,
  referrals as referralsApi,
  restoreUserToken,
  setUserTokens,
  type MatchProfile as ApiMatchProfile,
  type Conversation as ApiConversation,
  type AppNotification as ApiNotification,
  type ReferralStats,
} from "../../lib/api";
import {
  Home, Heart, MessageCircle, User, Bell, ChevronLeft,
  Settings, Star, Shield, Send, ArrowRight, Copy, Check,
  LogOut, Camera, Edit2, CreditCard, Gift, X, AlertCircle,
  MapPin, Briefcase, BookOpen, ChevronRight, MoreHorizontal,
  PartyPopper, UserX, Clock, SlidersHorizontal, Lock, CheckCheck, Search, ImagePlus, CheckCircle, Flag, Mail
} from "lucide-react";
import {
  CareerEducationSection,
  ValuesLifestyleSection,
  LifeGoalsSection,
  PartnerPrefsSection,
  PrivacySafetySection,
  AppSettingsSection,
  FoundPartnerSection,
  DeactivateSection,
} from "./user/ProfileSections";
import { BlogDetail } from "./BlogDetail";

interface UserAppProps {
  onSignOut: () => void;
}

type Tab = "home" | "matches" | "messages" | "profile";
type SubView =
  | "none"
  | "chat"
  | "match-detail"
  | "subscription"
  | "referral"
  | "notifications"
  | "edit-profile"
  | "photos"
  | "career-education"
  | "values-lifestyle"
  | "life-goals"
  | "partner-prefs"
  | "privacy-safety"
  | "app-settings"
  | "found-partner"
  | "deactivate"
  | "blog-list"
  | "blog-detail";

// ── Unsplash helper (for match discovery mock data only) ─
const p = (id: string, w = 600, h = 750) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`;

/**
 * Normalise a media URL returned from the Django backend:
 *  - Relative /media/... → prepend djangoBase
 *  - Cloudinary URL missing /image/upload/ → insert it
 *  - Otherwise return as-is
 *
 * Root cause: django-cloudinary-storage 0.3.0 can construct the URL as
 * MEDIA_URL + name  (e.g. https://res.cloudinary.com/{cloud}/profile_pictures/...)
 * which is MISSING the required /image/upload/ segment and loads as 404.
 */
function fixMediaUrl(raw: string, base: string): string {
  if (!raw) return "";
  // Normalise single-slash protocol stored by django-cloudinary-storage 0.3.0
  // "https:/res.cloudinary.com/..." → "https://res.cloudinary.com/..."
  if (raw.startsWith("https:/") && !raw.startsWith("https://")) raw = "https://" + raw.slice(7);
  else if (raw.startsWith("http:/") && !raw.startsWith("http://")) raw = "http://" + raw.slice(6);
  if (raw.startsWith("/")) return base + raw;
  // Fix missing /image/upload/ segment
  if (raw.includes("res.cloudinary.com") && !raw.includes("/image/upload/")) {
    const m = raw.match(/^(https?:\/\/res\.cloudinary\.com\/[^/]+)\/(.+)$/);
    if (m) return `${m[1]}/image/upload/${m[2]}`;
  }
  return raw;
}

const MATCHES = [
  {
    id: "1",
    name: "Amara O.", fullName: "Amara Okafor",
    age: 26, city: "Lagos", country: "Nigeria",
    nationality: "Nigerian", score: 94,
    photo: p("1613005341945-35e159e522f1"),
    photos: [
      p("1613005341945-35e159e522f1", 600, 750),
      p("1508002366005-75a695ee2d17", 600, 750),
      p("1611432579699-484f7990b127", 600, 750),
    ],
    highlights: ["Shared values", "Similar goals", "Compatible lifestyle"],
    bio: "I'm driven by purpose — in my work, my faith, and my relationships. I'm looking for someone who values depth over speed, and who sees marriage as a partnership built on shared values and genuine friendship.",
    compatibility: { values: 96, lifestyle: 92, goals: 94, communication: 90 },
    education: "MBA", institution: "Lagos Business School",
    profession: "Product Manager", company: "Jumia",
    height: 168, languages: ["English", "Yoruba", "French"],
    timeline: "Within 1 year", wantsChildren: "Yes — 2 to 3",
    religiosity: 4, familyImportance: "Very Important",
    lifestyle: ["Non-smoker", "Active / Fitness", "Traveler", "Health-conscious"],
    personality: ["Thoughtful", "Ambitious", "Nurturing", "Creative"],
    goals: ["Start a family", "Build a career", "Community service"],
    smoking: "Never", drinking: "Never", diet: "Halal",
  },
  {
    id: "2",
    name: "Zainab A.", fullName: "Zainab Al-Hassan",
    age: 28, city: "Abuja", country: "Nigeria",
    nationality: "Nigerian", score: 91,
    photo: p("1636754906126-58a76fa5c45a"),
    photos: [
      p("1636754906126-58a76fa5c45a", 600, 750),
      p("1505421031134-e57263cae630", 600, 750),
      p("1629145810320-aec9e63dd798", 600, 750),
    ],
    highlights: ["Deep values alignment", "Creative & structured", "Family-first"],
    bio: "Architecture taught me that the most beautiful structures are built on the strongest foundations. I believe the same is true of marriage — intention, patience, and the right partner.",
    compatibility: { values: 92, lifestyle: 89, goals: 91, communication: 93 },
    education: "Master's in Architecture", institution: "Ahmadu Bello University",
    profession: "Architect", company: "Design Studio Abuja",
    height: 165, languages: ["English", "Hausa", "Arabic"],
    timeline: "6 – 12 months", wantsChildren: "Yes — 2",
    religiosity: 4, familyImportance: "Very Important",
    lifestyle: ["Non-smoker", "Homebody", "Art & Culture", "Health-conscious"],
    personality: ["Creative", "Structured", "Calm", "Thoughtful"],
    goals: ["Build a career", "Buy a home", "Spiritual growth"],
    smoking: "Never", drinking: "Never", diet: "Halal",
  },
  {
    id: "3",
    name: "Fatou N.", fullName: "Fatou Ndiaye",
    age: 25, city: "Accra", country: "Ghana",
    nationality: "Ghanaian-Senegalese", score: 87,
    photo: p("1772714601002-fbb0fea8a911"),
    photos: [
      p("1772714601002-fbb0fea8a911", 600, 750),
      p("1707161256359-0919306e0d3c", 600, 750),
      p("1656473040206-53753fbbc767", 600, 750),
    ],
    highlights: ["Family-oriented", "Active lifestyle", "Warm personality"],
    bio: "I work with children every day and it's confirmed what I've always known — family is everything. I'm warm, patient, and ready to build something lasting with someone who shares those values.",
    compatibility: { values: 88, lifestyle: 90, goals: 85, communication: 84 },
    education: "BSc Nursing", institution: "University of Ghana",
    profession: "Pediatric Nurse", company: "Korle Bu Teaching Hospital",
    height: 162, languages: ["English", "French", "Wolof"],
    timeline: "1 – 2 years", wantsChildren: "Yes — 3",
    religiosity: 3, familyImportance: "Very Important",
    lifestyle: ["Non-smoker", "Active / Fitness", "Health-conscious", "Homebody"],
    personality: ["Nurturing", "Calm", "Energetic", "Thoughtful"],
    goals: ["Start a family", "Community service", "Spiritual growth"],
    smoking: "Never", drinking: "Never", diet: "Halal",
  },
  {
    id: "4",
    name: "Kemi A.", fullName: "Kemi Adeyemi",
    age: 30, city: "London", country: "UK",
    nationality: "Nigerian-British", score: 85,
    photo: p("1636302926027-9619142d7173"),
    photos: [
      p("1636302926027-9619142d7173", 600, 750),
      p("1662850886700-4ec19bd30d11", 600, 750),
      p("1632828167073-bd533fe560cb", 600, 750),
    ],
    highlights: ["Career-driven", "Well-travelled", "Balanced outlook"],
    bio: "I'm pragmatic but passionate. Ambitious in my career, deeply committed to family — I don't see those as opposites. I'm looking for someone built the same way.",
    compatibility: { values: 83, lifestyle: 86, goals: 88, communication: 84 },
    education: "LLB + Bar School", institution: "University of Lagos / Inns of Court",
    profession: "Barrister", company: "Gray's Inn Chambers",
    height: 170, languages: ["English", "Yoruba"],
    timeline: "1 – 2 years", wantsChildren: "Open",
    religiosity: 2, familyImportance: "Important",
    lifestyle: ["Non-smoker", "Social butterfly", "Traveler", "Foodie"],
    personality: ["Ambitious", "Extroverted", "Humorous", "Structured"],
    goals: ["Build a career", "Buy a home", "Travel the world"],
    smoking: "Never", drinking: "Socially", diet: "No restriction",
  },
  {
    id: "5",
    name: "Adaeze C.", fullName: "Adaeze Chukwu",
    age: 27, city: "Dubai", country: "UAE",
    nationality: "Nigerian", score: 79,
    photo: p("1665217026229-188aee86564b"),
    photos: [
      p("1665217026229-188aee86564b", 600, 750),
      p("1508002366005-75a695ee2d17", 600, 750),
      p("1611432579699-484f7990b127", 600, 750),
    ],
    highlights: ["Data-driven thinker", "Creative soul", "Dubai-based"],
    bio: "Data by day, dreamer by night. I believe in slow mornings, long conversations, and building something meaningful with someone who is as curious about the world as I am.",
    compatibility: { values: 78, lifestyle: 82, goals: 79, communication: 80 },
    education: "MSc Data Science", institution: "University of Cape Town",
    profession: "Data Scientist", company: "Majid Al Futtaim",
    height: 163, languages: ["English", "Igbo"],
    timeline: "1 – 2 years", wantsChildren: "Open to it",
    religiosity: 2, familyImportance: "Important",
    lifestyle: ["Non-smoker", "Active / Fitness", "Tech-savvy", "Traveler"],
    personality: ["Creative", "Introverted", "Thoughtful", "Ambitious"],
    goals: ["Entrepreneurship", "Academic growth", "Travel the world"],
    smoking: "Never", drinking: "Socially", diet: "No restriction",
  },
];

// Male mock profiles — shown to female users when no real API data is available
const MATCHES_MALE = [
  {
    id: "m1", name: "Yusuf A.", fullName: "Yusuf Al-Rashid",
    age: 29, city: "Dubai", country: "UAE", nationality: "Emirati", score: 93,
    photo: p("1603085356448-6857558a32b5", 600, 750),
    photos: [p("1603085356448-6857558a32b5", 600, 750)],
    highlights: ["Family-oriented", "Ambitious professional", "Deep faith"],
    bio: "Engineer by profession, family man at heart. I value integrity, hard work, and a partner who shares a vision for a purposeful life built on faith and mutual respect.",
    compatibility: { values: 95, lifestyle: 91, goals: 93, communication: 92 },
    education: "BEng Civil Engineering", institution: "University of Sharjah",
    profession: "Civil Engineer", company: "AECOM UAE",
    height: 180, languages: ["Arabic", "English"],
    timeline: "Within 1 year", wantsChildren: "Yes — 3",
    religiosity: 4, familyImportance: "Very Important",
    lifestyle: ["Non-smoker", "Active / Fitness", "Family-first"],
    personality: ["Ambitious", "Thoughtful", "Patient", "Traditional"],
    goals: ["Start a family", "Build a home", "Spiritual growth"],
    smoking: "Never", drinking: "Never", diet: "Halal",
  },
  {
    id: "m2", name: "Khalid M.", fullName: "Khalid Mansouri",
    age: 31, city: "Lagos", country: "Nigeria", nationality: "Nigerian", score: 90,
    photo: p("1765285353856-0d00e478f2c8", 600, 750),
    photos: [p("1765285353856-0d00e478f2c8", 600, 750)],
    highlights: ["Entrepreneur", "Strong values", "Community leader"],
    bio: "Built my business from nothing. I believe in patience, gratitude, and a life partner who stands with you through both the building and the living.",
    compatibility: { values: 90, lifestyle: 88, goals: 92, communication: 89 },
    education: "BSc Business Administration", institution: "University of Lagos",
    profession: "Entrepreneur", company: "KM Ventures",
    height: 178, languages: ["English", "Yoruba", "Hausa"],
    timeline: "6 – 12 months", wantsChildren: "Yes — 2",
    religiosity: 4, familyImportance: "Very Important",
    lifestyle: ["Non-smoker", "Homebody", "Community service"],
    personality: ["Ambitious", "Empathetic", "Humorous", "Spiritual"],
    goals: ["Start a family", "Entrepreneurship", "Community service"],
    smoking: "Never", drinking: "Never", diet: "Halal",
  },
  {
    id: "m3", name: "Omar H.", fullName: "Omar Hassan",
    age: 27, city: "Abuja", country: "Nigeria", nationality: "Nigerian", score: 87,
    photo: p("1667381371084-68280d99f5b3", 600, 750),
    photos: [p("1667381371084-68280d99f5b3", 600, 750)],
    highlights: ["Medical professional", "Calm personality", "Deep values"],
    bio: "Working as a doctor taught me that life is precious and relationships more so. I am looking for someone grounded in faith with whom I can build a life of purpose.",
    compatibility: { values: 86, lifestyle: 89, goals: 87, communication: 85 },
    education: "MBBS", institution: "Ahmadu Bello University",
    profession: "Medical Doctor", company: "National Hospital Abuja",
    height: 176, languages: ["English", "Arabic", "Hausa"],
    timeline: "1 – 2 years", wantsChildren: "Yes — 2 to 3",
    religiosity: 4, familyImportance: "Very Important",
    lifestyle: ["Non-smoker", "Health-conscious", "Active / Fitness"],
    personality: ["Calm", "Analytical", "Nurturing", "Traditional"],
    goals: ["Start a family", "Academic growth", "Spiritual growth"],
    smoking: "Never", drinking: "Never", diet: "Halal",
  },
  {
    id: "m4", name: "Ibrahim S.", fullName: "Ibrahim Al-Sayed",
    age: 33, city: "London", country: "UK", nationality: "Egyptian-British", score: 84,
    photo: p("1750612306471-46997387626a", 600, 750),
    photos: [p("1750612306471-46997387626a", 600, 750)],
    highlights: ["Finance professional", "Well-travelled", "Balanced outlook"],
    bio: "Finance by day, history books by night. I'm looking for a partner who appreciates growth, values deep conversations, and wants to build something lasting.",
    compatibility: { values: 83, lifestyle: 86, goals: 85, communication: 83 },
    education: "MSc Finance", institution: "London School of Economics",
    profession: "Investment Analyst", company: "Barclays Capital",
    height: 182, languages: ["English", "Arabic", "French"],
    timeline: "1 – 2 years", wantsChildren: "Open",
    religiosity: 3, familyImportance: "Important",
    lifestyle: ["Non-smoker", "Traveler", "Art & Culture"],
    personality: ["Analytical", "Extroverted", "Thoughtful", "Ambitious"],
    goals: ["Buy a home", "Travel the world", "Build a career"],
    smoking: "Never", drinking: "Never", diet: "Halal",
  },
  {
    id: "m5", name: "Tariq B.", fullName: "Tariq Balogun",
    age: 28, city: "Accra", country: "Ghana", nationality: "Ghanaian-Nigerian", score: 80,
    photo: p("1739566583814-fcead808e96f", 600, 750),
    photos: [p("1739566583814-fcead808e96f", 600, 750)],
    highlights: ["Tech entrepreneur", "Creative mind", "Family-first"],
    bio: "I build apps and communities. I am patient, faith-driven, and ready for a meaningful partnership with someone who values authenticity over perfection.",
    compatibility: { values: 80, lifestyle: 83, goals: 79, communication: 81 },
    education: "BSc Computer Science", institution: "University of Ghana",
    profession: "Software Developer", company: "Andela",
    height: 175, languages: ["English", "Twi"],
    timeline: "1 – 2 years", wantsChildren: "Yes — 2",
    religiosity: 3, familyImportance: "Important",
    lifestyle: ["Non-smoker", "Tech-savvy", "Active / Fitness"],
    personality: ["Creative", "Introverted", "Ambitious", "Humorous"],
    goals: ["Entrepreneurship", "Start a family", "Build a career"],
    smoking: "Never", drinking: "Never", diet: "Halal",
  },
];

// Male conversations/interests — shown when user is female
const CONVERSATIONS_MALE = [
  {
    id: "cm1", partnerId: "m1", partnerName: "Yusuf A.", preview: "Assalamu alaikum! Our compatibility score surprised me.", time: "5m ago", unread: 1, status: "active" as const,
    avatar: { color: "#0A6870", initials: "YA" }, photo: p("1603085356448-6857558a32b5", 80, 80),
    messages: [
      { id: "msg1", from: "them" as const, text: "Assalamu alaikum! I noticed our 93% compatibility and had to reach out. I really appreciated how you described your values.", time: "10:20 AM" },
      { id: "msg2", from: "me" as const,   text: "Wa alaikum assalam! Yes, it stood out to me too. What aspect of your work do you enjoy most?", time: "10:28 AM" },
      { id: "msg3", from: "them" as const, text: "Assalamu alaikum! Our compatibility score surprised me.", time: "10:35 AM" },
    ],
  },
  {
    id: "cm2", partnerId: "m2", partnerName: "Khalid M.", preview: "Looking forward to learning more about you.", time: "2h ago", unread: 0, status: "pending" as const,
    avatar: { color: "#C5733F", initials: "KM" }, photo: p("1765285353856-0d00e478f2c8", 80, 80),
    messages: [
      { id: "msg1", from: "them" as const, text: "Hello! Your profile resonated with me — the way you described what you're looking for feels very aligned with my values.", time: "9:15 AM" },
    ],
  },
];
const RECEIVED_INTERESTS_MALE = [
  { id: "rim1", matchId: "m3", name: "Omar H.", score: 87, photo: p("1667381371084-68280d99f5b3", 80, 80) },
  { id: "rim2", matchId: "m4", name: "Ibrahim S.", score: 84, photo: p("1750612306471-46997387626a", 80, 80) },
];

/**
 * Return the correct mock dataset based on the current user's gender.
 * Female users see male profiles; male users see female profiles.
 * Falls back to female profiles if gender is unknown.
 */
function genderAwareMocks(userGender: string) {
  const isFemale = userGender === "female";
  return {
    matches:           isFemale ? MATCHES_MALE : MATCHES,
    conversations:     isFemale ? CONVERSATIONS_MALE : CONVERSATIONS,
    receivedInterests: isFemale ? RECEIVED_INTERESTS_MALE : RECEIVED_INTERESTS,
  };
}

const CONVERSATIONS = [
  {
    id: "c1", partnerId: "1", partnerName: "Amara O.", preview: "That sounds like a wonderful idea!", time: "2m ago", unread: 2, status: "active",
    avatar: { color: "#0A6870", initials: "AO" },
    photo: p("1613005341945-35e159e522f1", 80, 80),
    messages: [
      { id: "m1", from: "them", text: "Assalamu alaikum! I saw we have a 94% compatibility score — I'm genuinely surprised at how aligned we are.", time: "10:20 AM" },
      { id: "m2", from: "me", text: "Wa alaikum assalam! Yes, I noticed that too. Your profile is really thoughtful and I appreciate that you included your community work.", time: "10:25 AM" },
      { id: "m3", from: "them", text: "Thank you! Community service is something I'm passionate about. I volunteer every month at the Ikeja Women's Shelter.", time: "10:28 AM" },
      { id: "m4", from: "me", text: "That's incredible. I've been involved in youth mentoring here. We should compare notes sometime.", time: "10:31 AM" },
      { id: "m5", from: "them", text: "That sounds like a wonderful idea!", time: "10:35 AM" },
    ],
  },
  {
    id: "c2", partnerId: "2", partnerName: "Zainab A.", preview: "Looking forward to talking more.", time: "1h ago", unread: 0, status: "pending",
    avatar: { color: "#7B6EA8", initials: "ZA" },
    photo: p("1636754906126-58a76fa5c45a", 80, 80),
    messages: [
      { id: "m1", from: "them", text: "Hello! I came across your profile and there's something about the way you described your values that really resonated with me. I'd love to connect.", time: "9:00 AM" },
    ],
  },
  {
    id: "c3", partnerId: "3", partnerName: "Fatou N.", preview: "Thank you so much for accepting!", time: "3h ago", unread: 1, status: "active",
    avatar: { color: "#C5733F", initials: "FN" },
    photo: p("1772714601002-fbb0fea8a911", 80, 80),
    messages: [
      { id: "m1", from: "me", text: "Hello Fatou, I came across your profile and your honesty about what you're looking for stood out.", time: "7:00 AM" },
      { id: "m2", from: "them", text: "Thank you so much for accepting!", time: "7:45 AM" },
    ],
  },
];

const NOTIFICATIONS = [
  { id: "n1", type: "match",   targetId: "1",  text: "New 94% match found — Amara O. is highly compatible with you",   time: "2 min ago", read: false },
  { id: "n2", type: "message", targetId: "c1", text: "Amara O. replied to your message",                                  time: "5 min ago", read: false },
  { id: "n3", type: "system",  targetId: "",   text: "Your profile photo has been approved by our moderation team",       time: "2h ago",    read: true  },
  { id: "n4", type: "match",   targetId: "2",  text: "New match: Zainab A. — 91% compatibility score",                    time: "5h ago",    read: true  },
  { id: "n5", type: "referral",targetId: "",   text: "Your referral Khalid A. joined Ma3moni! You've earned $10",         time: "1d ago",    read: true  },
];

const PLANS = [
  {
    id: "free", name: "Free", price: "$0", period: "", highlight: false,
    features: ["View 2 matches/day", "Basic profile", "Limited messaging"],
    cta: "Current Plan",
  },
  {
    id: "basic", name: "Basic", price: "$19", period: "/month", highlight: false,
    features: ["View 5 matches/day", "Full profile features", "Unlimited messaging", "Read receipts"],
    cta: "Upgrade",
  },
  {
    id: "premium", name: "Premium", price: "$49", period: "/month", highlight: true,
    features: ["Unlimited matches", "Priority visibility", "Advanced filters", "Profile boost", "Dedicated support"],
    cta: "Go Premium",
  },
];

// ── API → local shape mappers ─────────────────────────────
type MatchItem    = typeof MATCHES[0];
type ConvItem     = typeof CONVERSATIONS[0];
type NotifItem    = typeof NOTIFICATIONS[0];
type InterestItem = typeof RECEIVED_INTERESTS[0];

function mapApiMatch(m: ApiMatchProfile): MatchItem {
  const parts = m.full_name.trim().split(" ");
  const shortName = parts[0] + (parts[1] ? " " + parts[1][0] + "." : "");
  const ph0 = m.photos[0]?.image_url ?? "";
  return {
    id: m.id, name: shortName, fullName: m.full_name,
    age: m.age ?? 0, city: m.location_city, country: m.location_country,
    nationality: "", score: m.compatibility_score,
    photo: ph0, photos: m.photos.map(ph => ph.image_url),
    highlights: [], bio: m.bio ?? "",
    compatibility: { values: m.compatibility_score, lifestyle: m.compatibility_score, goals: m.compatibility_score, communication: m.compatibility_score },
    education: "", institution: "", profession: m.profession ?? "", company: "",
    height: 0, languages: [], timeline: "", wantsChildren: "",
    religiosity: 0, familyImportance: "",
    lifestyle: [], personality: [], goals: [],
    smoking: "Never", drinking: "Never", diet: "Halal",
  };
}

function mapApiConversation(c: ApiConversation): ConvItem {
  const initials = c.partner.full_name.split(" ").map((w: string) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
  return {
    id: c.id, partnerId: c.partner.id,
    partnerName: c.partner.full_name,
    preview: c.last_message?.content ?? "",
    time: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
    unread: c.unread_count, status: "active" as const,
    avatar: { color: "#0A6870", initials },
    photo: c.partner.photos[0]?.image_url ?? "",
    messages: [],
  };
}

function mapApiNotif(n: ApiNotification): NotifItem {
  const targetId = (n.data?.target_id as string | undefined) ?? "";
  return { id: n.id, type: n.type as NotifItem["type"], targetId, text: n.body, time: new Date(n.created_at).toLocaleString(), read: n.read };
}

// DummyAvatar — shown when a user has no approved profile photo
function DummyAvatar({ size = 40, gender }: { size?: number; gender?: string }) {
  const isFemale = gender === "female";
  return (
    <div className="rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center relative"
      style={{ width: size, height: size, background: "var(--muted)", border: "2px dashed var(--border)" }}>
      {/* Silhouette icon */}
      <svg viewBox="0 0 40 40" width={size * 0.65} height={size * 0.65} fill="none">
        {/* Head */}
        <circle cx="20" cy="14" r="7" fill="var(--muted-foreground)" opacity="0.4" />
        {/* Body */}
        <path d={isFemale ? "M8 38 Q10 24 20 24 Q30 24 32 38" : "M6 38 Q10 24 20 24 Q30 24 34 38"} fill="var(--muted-foreground)" opacity="0.4" />
        {isFemale && (
          /* Hijab hint */
          <path d="M10 14 Q10 8 20 7 Q30 8 30 14 Q30 20 20 20 Q10 20 10 14" fill="var(--muted-foreground)" opacity="0.25" />
        )}
      </svg>
      {/* "?" badge */}
      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-muted-foreground/40 flex items-center justify-center">
        <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "white" }}>?</span>
      </div>
    </div>
  );
}

function Avatar({ color, initials, size = 40, photo, gender }: { color: string; initials: string; size?: number; photo?: string; gender?: string }) {
  if (photo) {
    return (
      <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: size, height: size, border: `2px solid ${color}33` }}>
        <img src={photo} alt={initials} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
      </div>
    );
  }
  // No photo — show dummy silhouette
  if (!initials) return <DummyAvatar size={size} gender={gender} />;
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, background: color + "22", border: `2px solid ${color}33` }}
    >
      <span style={{ fontSize: size * 0.32, fontWeight: 700, color }}>{initials}</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "#0A6870" : score >= 80 ? "#C5733F" : "#68747F";
  return (
    <div
      className="rounded-xl flex flex-col items-center justify-center"
      style={{ width: 52, height: 52, background: color + "15", border: `2px solid ${color}30` }}
    >
      <span style={{ fontSize: "1.1rem", fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: "0.55rem", fontWeight: 600, color, opacity: 0.7, marginTop: 1 }}>MATCH</span>
    </div>
  );
}

function CompatBar({ label, value }: { label: string; value: number }) {
  const color = value >= 90 ? "#0A6870" : value >= 80 ? "#C5733F" : "#4A8DB8";
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground" style={{ fontSize: "0.75rem", width: "80px", flexShrink: 0 }}>{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color, width: "32px", textAlign: "right" }}>{value}%</span>
    </div>
  );
}

// ─── HOME TAB ────────────────────────────────────────────
// #13 — Journey milestones
// Journey milestones — computed dynamically so they reflect real app state.
function buildMilestones(plan: "free" | "basic" | "premium", profileStrength: number, foundPartner: boolean) {
  const today = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return [
    { key: "joined",      label: "Joined Ma3moni",       date: today,  done: true },
    { key: "profile",     label: "Profile completed",    date: profileStrength >= 80 ? today : "", done: profileStrength >= 80 },
    { key: "first_match", label: "First match received", date: today,  done: true  },
    { key: "first_msg",   label: "First message sent",   date: today,  done: true  },
    { key: "subscribed",  label: "Subscribed to a plan", date: plan !== "free" ? today : "", done: plan !== "free" },
    { key: "partner",     label: "Found a partner",      date: foundPartner ? today : "", done: foundPartner },
  ];
}

function HomeTab({ onOpenMatch, onOpenChat, onOpenNotif, setSubView, setTab, onOpenArticle, onOpenGuidance, displayName, firstName, profileStrength, profileData, plan, incompleteFields, foundPartner, conversations, matchesList }: {
  onOpenMatch: (id: string) => void;
  onOpenChat: (id: string) => void;
  onOpenNotif: () => void;
  setSubView: (v: SubView) => void;
  setTab: (t: Tab) => void;
  onOpenArticle: (slug: string) => void;
  onOpenGuidance: () => void;
  displayName: string;
  firstName: string;
  profileStrength: number;
  profileData: Record<string, unknown> | null;
  plan: "free" | "basic" | "premium";
  incompleteFields?: { key: string; label: string; section: SubView }[];
  foundPartner?: boolean;
  conversations?: ConvItem[];
  matchesList?: MatchItem[];
}) {
  const [showJourney, setShowJourney] = useState(false);
  const activeConvs = useMemo(() => (conversations ?? CONVERSATIONS).filter(c => c.status === "active").slice(0, 2), [conversations]);
  const milestones = useMemo(() => buildMilestones(plan, profileStrength, foundPartner ?? false), [plan, profileStrength, foundPartner]);
  const [homeArticles, setHomeArticles] = useState<import("../../lib/api").BlogArticle[]>([]);
  useEffect(() => {
    import("../../lib/api").then(({ blog }) => blog.articles().then(r => setHomeArticles(r.results.slice(0, 5))).catch(() => {}));
  }, []);

  return (
    <div className="pb-6">

      {/* #3 — Welcome card with real name + real strength */}
      <div className="mx-4 mt-4 bg-primary rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-white/5" />
        <p style={{ fontSize: "0.8125rem", opacity: 0.8 }}>Welcome back</p>
        <h3 style={{ fontWeight: 800, fontSize: "1.25rem", marginTop: 2 }}>{firstName}</h3>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${profileStrength}%` }} />
          </div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>{profileStrength}% complete</span>
        </div>
        {profileStrength < 100 && (
          <button
            onClick={() => {
              const first = incompleteFields?.[0];
              setSubView(first?.section ?? "edit-profile");
            }}
            className="mt-3 text-white/80 hover:text-white transition-colors" style={{ fontSize: "0.8125rem" }}>
            {incompleteFields?.[0] ? `Next: ${incompleteFields[0].label}` : "Complete your profile"} →
          </button>
        )}
      </div>

      {/* #13 — My Journey timeline */}
      <div className="mx-4 mt-4 bg-card rounded-2xl border border-border overflow-hidden">
        <button onClick={() => setShowJourney(s => !s)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Star size={13} className="text-primary" />
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>My Journey</span>
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground" style={{ fontSize: "0.625rem", fontWeight: 800 }}>
              {milestones.filter(m => m.done).length}/{milestones.length}
            </span>
          </div>
          <ChevronRight size={15} className={`text-muted-foreground transition-transform ${showJourney ? "rotate-90" : ""}`} />
        </button>
        {showJourney && (
          <div className="px-4 pb-4 space-y-2.5 view-enter">
            {milestones.map((m, i) => (
              <div key={m.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${m.done ? "border-primary bg-primary" : "border-border bg-card"}`}>
                    {m.done ? <Check size={11} className="text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-muted" />}
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="w-0.5 h-4 mt-0.5 rounded-full" style={{ background: m.done ? "var(--primary)" : "var(--border)" }} />
                  )}
                </div>
                <div className="flex-1 pt-0.5">
                  <p style={{ fontWeight: m.done ? 600 : 400, fontSize: "0.875rem", color: m.done ? "var(--foreground)" : "var(--muted-foreground)" }}>{m.label}</p>
                  {m.date && <p className="text-muted-foreground" style={{ fontSize: "0.6875rem" }}>{m.date}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* #1 — "See all" navigates to tab; #14 — compatibility dimension bars */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Your Top Matches</h3>
          <button onClick={() => setTab("matches")} className="text-primary hover:text-primary/80 transition-colors" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>See all →</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {(matchesList ?? MATCHES).slice(0, 3).map(m => (
            <button key={m.id} onClick={() => onOpenMatch(m.id)}
              className="flex-shrink-0 rounded-2xl overflow-hidden text-left hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all relative"
              style={{ width: "138px", height: "185px" }}>
              <img src={m.photo} alt={m.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,20,34,0.88) 0%, transparent 55%)" }} />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg" style={{ background: m.score >= 90 ? "#0A6870" : "#C5733F" }}>
                <span style={{ fontSize: "0.6875rem", fontWeight: 800, color: "white" }}>{m.score}%</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "white", lineHeight: 1.2 }}>{m.name}</p>
                <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.65)", marginTop: 1 }}>{m.city}</p>
                {/* #14 — compatibility bars */}
                <div className="flex gap-1 mt-2"
                  title={`Values ${m.compatibility.values}% · Lifestyle ${m.compatibility.lifestyle}% · Goals ${m.compatibility.goals}% · Comm ${m.compatibility.communication}%`}>
                  {Object.values(m.compatibility).map((v, i) => (
                    <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/25">
                      <div className="h-full rounded-full bg-white/85" style={{ width: `${v}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* #1 — "View all" navigates to tab; empty state when no active conversations */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Recent Messages</h3>
          <button onClick={() => setTab("messages")} className="text-primary hover:text-primary/80 transition-colors" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>View all →</button>
        </div>
        {activeConvs.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-5 text-center">
            <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>No active conversations yet — connect with a match to start.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeConvs.map(c => (
              <button key={c.id} onClick={() => onOpenChat(c.id)}
                className="w-full flex items-center gap-3 bg-card rounded-2xl border border-border p-4 hover:border-primary/20 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all text-left">
                <Avatar color={c.avatar.color} initials={c.avatar.initials} size={40} photo={c.photo} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{c.partnerName}</span>
                    <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{c.time}</span>
                  </div>
                  <p className="text-muted-foreground truncate mt-0.5" style={{ fontSize: "0.8125rem" }}>{c.preview}</p>
                </div>
                {c.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "white" }}>{c.unread}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions — plan-aware */}
      <div className="mt-6 px-4">
        <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            plan === "free"
              ? { icon: <CreditCard size={18} />, label: "Upgrade Plan",     sub: "Unlock full profiles & messaging",                  action: () => setSubView("subscription") }
              : plan === "basic"
                ? { icon: <Star size={18} />,     label: "My Subscription", sub: "Basic — upgrade to Premium for all features",         action: () => setSubView("subscription") }
                : { icon: <Star size={18} />,     label: "My Subscription", sub: "Premium — you're on our top plan",                    action: () => setSubView("subscription") },
            { icon: <Gift size={18} />, label: "Refer & Earn", sub: "Earn $10 per referral", action: () => setSubView("referral") },
          ].map(({ icon, label, sub, action }) => (
            <button key={label} onClick={action}
              className="bg-card rounded-2xl border border-border p-4 text-left hover:border-primary/20 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-primary mb-3">{icon}</div>
              <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>{label}</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* #9 — article cards have focus-visible rings */}
      <div className="mt-6">
        <div className="px-4 flex items-center justify-between mb-3">
          <div>
            <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Reading for your journey</h3>
            <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Guidance on values, faith &amp; marriage</p>
          </div>
          <button onClick={onOpenGuidance} className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
            See all <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: "none" }}>
          {homeArticles.length === 0 ? (
            <p className="text-muted-foreground py-4 px-1" style={{ fontSize: "0.8125rem" }}>No articles yet.</p>
          ) : homeArticles.map(a => (
            <button key={a.id} onClick={() => onOpenArticle(a.slug)}
              className="flex-shrink-0 rounded-2xl overflow-hidden bg-card border border-border text-left hover:border-primary/25 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all"
              style={{ width: 220 }}>
              <div className="relative h-28 overflow-hidden bg-muted">
                {a.cover_image
                  ? <img src={a.cover_image} alt={a.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><BookOpen size={22} className="text-muted-foreground" /></div>
                }
                {a.category && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white"
                    style={{ fontSize: "0.625rem", fontWeight: 700, background: "rgba(10,104,112,0.9)", backdropFilter: "blur(4px)" }}>
                    {a.category.name}
                  </span>
                )}
              </div>
              <div className="p-3">
                <p style={{ fontWeight: 700, fontSize: "0.8125rem", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.title}</p>
                <div className="flex items-center justify-between mt-2 text-muted-foreground">
                  <div className="flex items-center gap-1.5"><BookOpen size={11} /><span style={{ fontSize: "0.6875rem" }}>{Math.max(1, Math.ceil((a.content?.length ?? 0) / 1200))} min read</span></div>
                  {a.view_count > 0 && <span style={{ fontSize: "0.6875rem" }}>{a.view_count > 999 ? `${(a.view_count/1000).toFixed(1)}k` : a.view_count} views</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── GUIDANCE (in-app blog list) ─────────────────────────
// Minimal article type for the list view — covers both API articles and static fallbacks
interface ListArticle { id: string | number; title: string; category: string; photo: string; author: string; readTime?: string; slug?: string; }

function GuidanceListView({ onBack, onOpenArticle }: { onBack: () => void; onOpenArticle: (slug: string) => void }) {
  const [cat, setCat] = useState<string>("All");
  const [liveList, setLiveList] = useState<ListArticle[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    import("../../lib/api").then(({ blog }) => {
      blog.articles().then(res => {
        if (res.results.length) {
          setLiveList(res.results.map(a => ({
            id:       a.id,
            title:    a.title,
            category: a.category?.name ?? "General",
            photo:    a.cover_image ?? "",
            author:   a.author?.full_name ?? "",
            readTime: "",
            slug:     a.slug,
          })));
        }
      }).catch(() => {}).finally(() => setLoaded(true));
    });
  }, []);

  const merged: ListArticle[] = liveList;

  const cats = Array.from(new Set(merged.map(a => a.category)));
  const categories = ["All", ...cats];
  const list = cat === "All" ? merged : merged.filter(a => a.category === cat);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <button onClick={onBack} aria-label="Go back" className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Guidance &amp; Articles</h3>
        {!loaded && <div className="ml-auto w-3.5 h-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto px-4 py-3 border-b border-border flex-shrink-0" style={{ scrollbarWidth: "none" }}>
        {categories.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition-all ${cat === c ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card text-muted-foreground"}`}
            style={{ fontSize: "0.75rem", fontWeight: 600 }}>
            {c}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {list.length === 0 && loaded && (
          <p className="text-muted-foreground text-center py-12" style={{ fontSize: "0.9rem" }}>No articles published yet.</p>
        )}
        {list.map(a => (
          <button key={String(a.id)} onClick={() => { if (a.slug) onOpenArticle(a.slug); }}
            className="w-full flex gap-3 bg-card rounded-2xl border border-border p-3 hover:border-primary/25 hover:shadow-sm transition-all text-left">
            <div className="rounded-xl overflow-hidden flex-shrink-0 bg-muted" style={{ width: 88, height: 88 }}>
              {a.photo
                ? <img src={a.photo} alt={a.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><BookOpen size={22} className="text-muted-foreground" /></div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-primary" style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{a.category}</span>
              <p style={{ fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.4, marginTop: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.title}</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
                <BookOpen size={11} />
                {a.readTime && <><span style={{ fontSize: "0.6875rem" }}>{a.readTime}</span><span style={{ fontSize: "0.6875rem" }}>·</span></>}
                <span style={{ fontSize: "0.6875rem" }}>{a.author}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MATCHES TAB ─────────────────────────────────────────
// Real countdown — ticks every minute, seeded per match so each card shows
// a different value that persists across re-renders.
function MatchExpiry({ matchId }: { matchId: string }) {
  const seed = parseInt(matchId, 10) || 1;
  // Use a fixed epoch per match (session-scoped) so the countdown decreases in real time.
  const epochKey = `ma3_exp_${matchId}`;
  const getEpoch = () => {
    try {
      const stored = sessionStorage.getItem(epochKey);
      if (stored) return parseInt(stored, 10);
      // Seed initial hours deterministically (24–143h range)
      const initialMs = Date.now() + (24 + ((seed * 17 + 5) % 120)) * 3600_000;
      sessionStorage.setItem(epochKey, initialMs.toString());
      return initialMs;
    } catch { return Date.now() + 72 * 3600_000; }
  };

  const calcLeft = () => Math.max(0, Math.floor((getEpoch() - Date.now()) / 60_000)); // minutes
  const [minsLeft, setMinsLeft] = useState(calcLeft);

  useEffect(() => {
    const id = setInterval(() => setMinsLeft(calcLeft()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hoursLeft = Math.floor(minsLeft / 60);
  const daysLeft  = Math.floor(hoursLeft / 24);
  const label     = hoursLeft === 0 ? `${minsLeft}m left` : hoursLeft < 48 ? `${hoursLeft}h left` : `${daysLeft}d left`;
  const urgent    = hoursLeft < 36;

  return (
    <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{ background: urgent ? "rgba(212,31,58,0.82)" : "rgba(70,70,70,0.68)" }}>
      <Clock size={10} className="text-white" />
      <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "white" }}>{label}</span>
    </div>
  );
}

function MatchCard({ m, onPass, onView, sc, plan = "free", sentInterest = false, onInterest }: {
  m: typeof MATCHES[0];
  onPass: () => void;
  onView: () => void;
  sc: (s: number) => string;
  plan?: "free" | "basic" | "premium";
  sentInterest?: boolean;
  onInterest?: () => void;
}) {
  const startX = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeOut, setSwipeOut] = useState<"left" | "right" | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => { startX.current = e.clientX; };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    setSwipeOffset(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (startX.current === null) return;
    if (swipeOffset < -80) { setSwipeOut("left");  setTimeout(onPass,   280); }
    else if (swipeOffset > 80) { setSwipeOut("right"); setTimeout(onView, 280); }
    else setSwipeOffset(0);
    startX.current = null;
  };

  const tx = swipeOut === "left" ? -400 : swipeOut === "right" ? 400 : swipeOffset;
  const rotate = (swipeOffset / 20).toFixed(1);
  const opacity = swipeOut ? 0 : 1;

  return (
    <div
      className="rounded-3xl overflow-hidden shadow-md select-none"
      style={{
        background: "var(--card)",
        transform: `translateX(${tx}px) rotate(${rotate}deg)`,
        opacity,
        transition: swipeOut ? "transform 0.28s ease, opacity 0.28s ease" : swipeOffset !== 0 ? "none" : "transform 0.2s ease",
        cursor: "grab",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Large portrait photo */}
      <div className="relative" style={{ height: "460px" }}>
        {!imgLoaded && <div className="absolute inset-0 bg-muted animate-pulse z-10" />}
        <img src={m.photo} alt={m.fullName} loading="lazy" decoding="async" className="w-full h-full object-cover object-top"
          onLoad={() => setImgLoaded(true)} />

        {/* Swipe indicators */}
        {swipeOffset > 30 && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(10,104,112,0.3)" }}>
            <span style={{ fontSize: "3rem" }}>👀</span>
          </div>
        )}
        {swipeOffset < -30 && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(212,31,58,0.3)" }}>
            <span style={{ fontSize: "3rem" }}>✕</span>
          </div>
        )}

        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,16,28,0.96) 0%, rgba(8,16,28,0.55) 45%, rgba(0,0,0,0.1) 75%, transparent 100%)" }} />

        {/* Score badge with tooltip */}
        <div
          title={`${m.score}% match — Values ${m.compatibility.values}% · Lifestyle ${m.compatibility.lifestyle}% · Goals ${m.compatibility.goals}% · Communication ${m.compatibility.communication}%`}
          className="absolute top-4 right-4 rounded-2xl flex flex-col items-center justify-center shadow-lg cursor-help group"
          style={{ background: sc(m.score), minWidth: 58, padding: "8px 10px" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "white", lineHeight: 1 }}>{m.score}</span>
          <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "white", opacity: 0.8, letterSpacing: "0.08em", marginTop: 1 }}>MATCH %</span>
        </div>

        {/* Badges top-left */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}>
            <Shield size={11} className="text-white" />
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "white" }}>Verified</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: "rgba(197,115,63,0.85)" }}>
            <Star size={11} className="text-white" />
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "white" }}>Premium</span>
          </div>
          <MatchExpiry matchId={m.id} />
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <h3 style={{ fontWeight: 900, fontSize: "1.625rem", color: "white", lineHeight: 1, letterSpacing: "-0.025em" }}>{m.fullName}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1"><MapPin size={12} className="text-white/60" /><span style={{ fontSize: "0.875rem", color: "white", opacity: 0.8 }}>{m.city}, {m.country}</span></div>
            <span style={{ fontSize: "0.875rem", color: "white", opacity: 0.65 }}>·</span>
            <span style={{ fontSize: "0.875rem", color: "white", opacity: 0.8 }}>{m.age} yrs</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Briefcase size={12} className="text-white/60" />
            <span style={{ fontSize: "0.8125rem", color: "white", opacity: 0.75 }}>{m.profession} · {m.education}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
            {m.highlights.map(h => (
              <span key={h} className="px-3 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 600, background: "rgba(255,255,255,0.14)", color: "white" }}>{h}</span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {Object.entries(m.compatibility).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.55)", width: 75, flexShrink: 0, textTransform: "capitalize" }}>{k}</span>
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.18)" }}>
                  <div className="h-full rounded-full" style={{ width: `${v}%`, background: sc(m.score) }} />
                </div>
                <span style={{ fontSize: "0.625rem", color: "white", fontWeight: 800, width: 22, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions — free: Pass / Show Interest; paid: Pass / View Profile */}
      <div className="flex border-t border-border" style={{ background: "var(--card)" }}>
        <button onClick={onPass}
          className="flex-1 flex items-center justify-center gap-2 py-4 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95"
          style={{ fontSize: "0.9rem", fontWeight: 600 }}>
          <X size={17} /> Pass
        </button>
        <div className="w-px bg-border" />
        {plan === "free" ? (
          <button
            onClick={sentInterest ? undefined : onInterest}
            disabled={sentInterest}
            className={`flex-1 flex items-center justify-center gap-2 py-4 transition-all active:scale-95 ${sentInterest ? "text-green-600" : "text-primary hover:bg-secondary"}`}
            style={{ fontSize: "0.9rem", fontWeight: 700 }}>
            <Heart size={17} fill={sentInterest ? "currentColor" : "none"} />
            {sentInterest ? "Interest Sent ✓" : "Show Interest"}
          </button>
        ) : (
          <button onClick={onView}
            className="flex-1 flex items-center justify-center gap-2 py-4 text-primary hover:bg-secondary transition-all active:scale-95"
            style={{ fontSize: "0.9rem", fontWeight: 700 }}>
            <Heart size={17} /> View Profile
          </button>
        )}
      </div>
    </div>
  );
}

// ── Daily match limits per plan ──────────────────────────
const DAILY_LIMITS: Record<"free" | "basic" | "premium", number> = {
  free: 2,
  basic: 5,
  premium: Infinity,
};

function MatchesTab({ onOpenMatch, plan, onUpgrade, blocked, chattingIds, sentInterests, onInterest, matchesList, profileStrength = 100, incompleteFields = [], onCompleteProfile }: {
  onOpenMatch: (id: string) => void;
  plan: "free" | "basic" | "premium";
  onUpgrade: () => void;
  blocked: string[];
  chattingIds: Set<string>;
  sentInterests: string[];
  onInterest: (id: string, name: string) => void;
  matchesList?: MatchItem[];
  profileStrength?: number;
  incompleteFields?: { key: string; label: string; section: SubView }[];
  onCompleteProfile?: (section: SubView) => void;
}) {
  // ── Profile completion gate ────────────────────────────────────────────────
  if (profileStrength < 100) {
    const circ = 2 * Math.PI * 38;
    const offset = circ - (profileStrength / 100) * circ;
    const nextField = incompleteFields[0];
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-5 pt-5 pb-3 border-b border-border bg-card flex-shrink-0">
          <h2 style={{ fontWeight: 800, fontSize: "1.125rem" }}>Discover Matches</h2>
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col items-center px-5 py-8 gap-6">
          {/* Progress ring */}
          <div className="relative flex items-center justify-center" style={{ width: 112, height: 112 }}>
            <svg width="112" height="112" className="absolute inset-0" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="56" cy="56" r="38" fill="none" stroke="var(--muted)" strokeWidth="8" />
              <circle cx="56" cy="56" r="38" fill="none" stroke="var(--primary)" strokeWidth="8"
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }} />
            </svg>
            <div className="flex flex-col items-center">
              <span style={{ fontWeight: 900, fontSize: "1.5rem", color: "var(--primary)", lineHeight: 1 }}>{profileStrength}%</span>
              <span style={{ fontSize: "0.625rem", color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>complete</span>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center px-4">
            <h3 style={{ fontWeight: 800, fontSize: "1.25rem", lineHeight: 1.25, color: "var(--foreground)" }}>
              Complete your profile to see matches
            </h3>
            <p className="text-muted-foreground mt-2" style={{ fontSize: "0.9375rem", lineHeight: 1.55 }}>
              A complete profile helps our algorithm find your ideal match and shows you to compatible members.
            </p>
          </div>

          {/* Incomplete fields list */}
          {incompleteFields.length > 0 && (
            <div className="w-full rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)" }}>
                  {incompleteFields.length} thing{incompleteFields.length !== 1 ? "s" : ""} remaining
                </p>
              </div>
              {incompleteFields.map((f, i) => (
                <button
                  key={f.key}
                  onClick={() => onCompleteProfile?.(f.section)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors ${i < incompleteFields.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40 flex-shrink-0" />
                    <span style={{ fontSize: "0.9375rem", color: "var(--foreground)" }}>{f.label}</span>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* CTA */}
          {nextField && (
            <button
              onClick={() => onCompleteProfile?.(nextField.section)}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              style={{ fontWeight: 700, fontSize: "1rem" }}
            >
              {nextField.key === "avatar" ? "Upload profile photo" : `Add ${nextField.label.replace(/^(Add|Set|Write|Upload)\s/i, "").toLowerCase()}`} →
            </button>
          )}

          <p className="text-muted-foreground text-center" style={{ fontSize: "0.75rem" }}>
            Matches are shown once your profile reaches 100% · Your data is private &amp; secure
          </p>
        </div>
      </div>
    );
  }

  const DATA = matchesList ?? MATCHES;
  // Persist filter state in sessionStorage so it survives tab switches
  const [filter, setFilter] = useState<"all" | "high" | "new">(() => {
    try { return (sessionStorage.getItem("ma3_mfilter") as "all" | "high" | "new") ?? "all"; } catch { return "all"; }
  });
  const [passed, setPassed] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [adv, setAdv] = useState(() => {
    try {
      const raw = sessionStorage.getItem("ma3_madv");
      return raw ? JSON.parse(raw) : { minAge: 18, maxAge: 60, country: "any", minRelig: 0 };
    } catch { return { minAge: 18, maxAge: 60, country: "any", minRelig: 0 }; }
  });

  const canFilter = plan !== "free";
  const dailyLimit = DAILY_LIMITS[plan];
  const countries = useMemo(() => Array.from(new Set(DATA.map(m => m.country))).sort(), [DATA]);

  // Derive the current user's gender from their onboarding/profile data
  const userGender = useMemo(() => {
    try {
      const raw = localStorage.getItem("ma3moni_onboarding_progress");
      if (raw) return (JSON.parse(raw) as { form: Record<string,string> }).form?.gender ?? "";
    } catch {}
    return "";
  }, []);
  const oppositeGender = userGender === "male" ? "female" : userGender === "female" ? "male" : null;

  const filtered = useMemo(() => DATA.filter(m => {
    if (blocked.includes(m.id)) return false;
    if (chattingIds.has(m.id)) return false;
    if (passed.includes(m.id)) return false;
    // Only show opposite gender when the user's gender is set (backend enforces this too)
    if (oppositeGender && m.nationality !== undefined) {
      // If match has a gender field use it; otherwise rely on backend filtering
      const matchGender = (m as MatchItem & { gender?: string }).gender;
      if (matchGender && matchGender !== oppositeGender) return false;
    }
    if (filter === "high" && m.score < 88) return false;
    if (canFilter) {
      if (m.age < adv.minAge || m.age > adv.maxAge) return false;
      if (adv.country !== "any" && m.country !== adv.country) return false;
      if (adv.minRelig && (m.religiosity ?? 0) < adv.minRelig) return false;
    }
    return true;
  }), [DATA, filter, passed, canFilter, adv, blocked, chattingIds, oppositeGender]);

  const visible = useMemo(
    () => dailyLimit === Infinity ? filtered : filtered.slice(0, dailyLimit),
    [filtered, dailyLimit]
  );
  const limitReached = dailyLimit !== Infinity && filtered.length > dailyLimit;

  const handlePass = (m: (typeof MATCHES)[number]) => {
    setPassed(prev => [...prev, m.id]);
    toast(`Passed on ${m.fullName.split(" ")[0]}`, {
      action: { label: "Undo", onClick: () => setPassed(prev => prev.filter(id => id !== m.id)) },
    });
  };

  const persistAdv = (next: typeof adv) => { try { sessionStorage.setItem("ma3_madv", JSON.stringify(next)); } catch {} setAdv(next); };
  const persistFilter = (f: "all" | "high" | "new") => { try { sessionStorage.setItem("ma3_mfilter", f); } catch {} setFilter(f); };
  const resetAdv = () => persistAdv({ minAge: 18, maxAge: 60, country: "any", minRelig: 0 });
  const sc = (s: number) => s >= 90 ? "#0A6870" : s >= 85 ? "#C5733F" : "#68747F";

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h3 style={{ fontWeight: 800, fontSize: "1.0625rem" }}>Your Matches</h3>
          <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
            {visible.length} compatible {visible.length === 1 ? "profile" : "profiles"}
          </p>
        </div>
        <div className="flex gap-1.5">
          {(["all", "high", "new"] as const).map(f => (
            <button key={f} onClick={() => persistFilter(f)}
              className={`px-3 py-1.5 rounded-full border transition-all ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card text-muted-foreground"}`}
              style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              {f === "all" ? "All" : f === "high" ? "Best" : "New"}
            </button>
          ))}
        </div>
      </div>

      {/* Daily allowance bar */}
      {dailyLimit !== Infinity && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between rounded-xl bg-secondary/60 border border-border px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1">
                {Array.from({ length: dailyLimit }).map((_, i) => (
                  <div key={i} className="w-1.5 h-4 rounded-full transition-colors"
                    style={{ background: i < visible.length ? "var(--primary)" : "var(--muted)" }} />
                ))}
              </div>
              <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                {Math.min(visible.length, dailyLimit)} of {dailyLimit} daily matches used
              </span>
            </div>
            <button onClick={onUpgrade} className="text-primary hover:text-primary/80 transition-colors"
              style={{ fontSize: "0.75rem", fontWeight: 700 }}>
              Upgrade →
            </button>
          </div>
        </div>
      )}

      {/* Advanced filters row */}
      <div className="px-4 pb-3">
        <button
          onClick={() => canFilter ? setShowFilters(s => !s) : onUpgrade()}
          className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2.5 hover:border-primary/30 transition-colors"
        >
          <span className="flex items-center gap-2" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
            <SlidersHorizontal size={14} className="text-primary" />
            Advanced filters
            {canFilter && (adv.country !== "any" || adv.minAge > 18 || adv.maxAge < 60 || adv.minRelig > 0) && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </span>
          {canFilter
            ? <ChevronRight size={16} className={`text-muted-foreground transition-transform ${showFilters ? "rotate-90" : ""}`} />
            : <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: "0.6875rem", fontWeight: 700 }}>
                <Lock size={11} /> Basic+
              </span>}
        </button>

        {canFilter && showFilters && (
          <div className="mt-2 rounded-2xl border border-primary/15 bg-card shadow-lg p-5 space-y-5 view-enter">

            {/* Age range */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Age Range</span>
                <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                  {adv.minAge} – {adv.maxAge} yrs
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Min age", value: adv.minAge, min: 18, max: adv.maxAge, onChange: (v: number) => persistAdv({ ...adv, minAge: v }) },
                  { label: "Max age", value: adv.maxAge, min: adv.minAge, max: 60,  onChange: (v: number) => persistAdv({ ...adv, maxAge: v }) },
                ].map(({ label, value, min, max, onChange }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-muted-foreground w-16 flex-shrink-0" style={{ fontSize: "0.6875rem" }}>{label}</span>
                    <input type="range" min={min} max={max} value={value}
                      onChange={e => onChange(+e.target.value)}
                      className="flex-1 accent-primary h-1.5 rounded-full" />
                    <span className="w-8 text-right text-primary" style={{ fontSize: "0.75rem", fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Country — filter empty values */}
            <div>
              <span className="block mb-2" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Country</span>
              <div className="relative">
                <select
                  value={adv.country}
                  onChange={e => persistAdv({ ...adv, country: e.target.value })}
                  className="w-full appearance-none px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all pr-10"
                  style={{ fontSize: "0.875rem", color: adv.country === "any" ? "var(--muted-foreground)" : "var(--foreground)" }}
                >
                  <option value="any">🌍 Any country</option>
                  {countries.filter(c => c && c.trim() !== "").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Religiosity */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Min. Religiosity</span>
                <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                  {adv.minRelig === 0 ? "No minimum" : `${adv.minRelig}+ / 5`}
                </span>
              </div>
              <div className="flex gap-2">
                {[
                  { v: 0, l: "Any",   icon: "🌙" },
                  { v: 2, l: "Casual", icon: "🕌" },
                  { v: 3, l: "Pract.", icon: "📿" },
                  { v: 4, l: "Devout", icon: "⭐" },
                  { v: 5, l: "5/5",   icon: "✨" },
                ].map(({ v, l, icon }) => (
                  <button key={v} onClick={() => persistAdv({ ...adv, minRelig: v })}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${adv.minRelig === v ? "border-primary bg-primary/8 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30"}`}
                    style={{ fontSize: "0.5rem", fontWeight: adv.minRelig === v ? 700 : 400 }}>
                    <span style={{ fontSize: "1rem" }}>{icon}</span>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            <div className="flex items-center justify-between pt-1">
              <button onClick={resetAdv}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive transition-colors"
                style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                <X size={12} /> Reset all filters
              </button>
              <span className="text-muted-foreground" style={{ fontSize: "0.6875rem" }}>
                {filtered.length} match{filtered.length !== 1 ? "es" : ""} found
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 space-y-5">
        {visible.map(m => (
          <div key={m.id}>
            {/* "Best" reason label — shown only in the Best filter (item 9) */}
            {filter === "high" && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                  {(() => {
                    // Pick top 2 dimensions by score for a meaningful reason.
                    const dims = [
                      { label: "Strong values alignment",  score: m.compatibility.values },
                      { label: "Shared life goals",        score: m.compatibility.goals },
                      { label: "Compatible lifestyle",     score: m.compatibility.lifestyle },
                      { label: "Great communication",      score: m.compatibility.communication },
                    ].sort((a, b) => b.score - a.score).slice(0, 2);
                    return dims.map(d => d.label).join(" · ");
                  })()}
                </span>
              </div>
            )}
            <MatchCard m={m} sc={sc}
              plan={plan}
              sentInterest={sentInterests.includes(m.id)}
              onInterest={() => onInterest(m.id, m.fullName.split(" ")[0])}
              onPass={() => handlePass(m)}
              onView={() => onOpenMatch(m.id)} />
          </div>
        ))}

        {/* Limit reached wall */}
        {limitReached && (
          <div className="rounded-3xl border border-primary/20 bg-secondary/50 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/20">
              <Star size={22} className="text-primary-foreground" />
            </div>
            <p style={{ fontWeight: 800, fontSize: "1rem" }}>
              You've reached today's {dailyLimit}-match limit
            </p>
            <p className="text-muted-foreground mt-1.5" style={{ fontSize: "0.875rem" }}>
              {filtered.length - dailyLimit} more compatible{" "}
              {filtered.length - dailyLimit === 1 ? "profile is" : "profiles are"} waiting.
            </p>
            <button onClick={onUpgrade}
              className="mt-4 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              style={{ fontSize: "0.875rem", fontWeight: 700 }}>
              View Plans
            </button>
          </div>
        )}

        {/* Empty state */}
        {visible.length === 0 && !limitReached && (
          <div className="bg-card rounded-2xl border border-border p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Star size={24} className="text-primary" />
            </div>
            <p style={{ fontWeight: 700, fontSize: "1rem" }}>No matches fit these filters</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.875rem" }}>
              Try widening your criteria or reset your passes.
            </p>
            <button
              onClick={() => { setPassed([]); resetAdv(); setFilter("all"); }}
              className="mt-4 text-primary hover:text-primary/80 transition-colors"
              style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              Reset everything
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MESSAGES TAB ────────────────────────────────────────
// Simulated interests received from other users (in a real app, comes from the API)
const RECEIVED_INTERESTS = [
  { id: "ri1", matchId: "4", name: "Aisha S.", score: 83, photo: MATCHES.find(m => m.id === "4")?.photo ?? "" },
  { id: "ri2", matchId: "5", name: "Halima Y.", score: 88, photo: MATCHES.find(m => m.id === "5")?.photo ?? "" },
];

function MessagesTab({ onOpenChat, onOpenMatch, plan, onUpgrade, blocked, onBlock, onRequestBlock, onReport, sentInterests, onInterest, conversations, receivedInterests, matchesList }: {
  onOpenChat: (id: string) => void;
  onOpenMatch: (id: string) => void;
  plan: "free" | "basic" | "premium";
  onUpgrade: () => void;
  blocked: string[];
  onBlock: (matchId: string) => void;
  onRequestBlock?: (matchId: string, name: string) => void;
  onReport?: (matchId: string, name: string) => void;
  sentInterests: string[];
  onInterest: (id: string, name: string) => void;
  conversations?: ConvItem[];
  receivedInterests?: InterestItem[];
  matchesList?: MatchItem[];
  onGoToProfile?: () => void;
}) {
  const CONVS = conversations     ?? [];
  const RECVD = receivedInterests ?? [];
  const MDATA = matchesList       ?? [];
  // Track locally-resolved connection requests for optimistic UI.
  const [resolved, setResolved] = useState<Record<string, "accepted" | "declined">>({});
  const [dismissedInterests, setDismissedInterests] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  // Block is handled via onRequestBlock → global blockModal in UserApp.

  const pending = useMemo(
    () => CONVS.filter(c => c.status === "pending" && !resolved[c.id] && !blocked.includes(c.partnerId)),
    [CONVS, resolved, blocked]
  );
  const active = useMemo(
    () => CONVS.filter(c => (c.status === "active" || resolved[c.id] === "accepted") && !blocked.includes(c.partnerId)),
    [CONVS, resolved, blocked]
  );
  const visibleInterests = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RECVD.filter(r =>
      !dismissedInterests.includes(r.id) &&
      !blocked.includes(r.matchId) &&
      (!q || r.name.toLowerCase().includes(q))
    );
  }, [RECVD, dismissedInterests, blocked, query]);

  // Both plan AND approved photo are required to message
  const canMessage   = plan !== "free";
  const photoBlocked = false; // photo moderation removed

  const accept = (c: ConvItem) => {
    if (photoBlocked) {
      toast.error("You need a profile photo to start messaging.", { action: { label: "Add Photo", onClick: onGoToProfile } });
      return;
    }
    if (!canMessage) {
      toast("Upgrade to Basic or Premium to start messaging.", { action: { label: "Upgrade", onClick: onUpgrade } });
      return;
    }
    setResolved(prev => ({ ...prev, [c.id]: "accepted" }));
    toast.success(`You're now connected with ${c.partnerName}`);
    onOpenChat(c.id);
  };

  const decline = (c: (typeof CONVERSATIONS)[number]) => {
    setResolved(prev => ({ ...prev, [c.id]: "declined" }));
    toast(`Request from ${c.partnerName} declined`, {
      action: {
        label: "Undo",
        onClick: () => setResolved(prev => { const next = { ...prev }; delete next[c.id]; return next; }),
      },
    });
  };

  // Which interest card is expanded (bottom sheet style)
  const [expandedInterest, setExpandedInterest] = useState<string | null>(null);
  const expandedData = visibleInterests.find(r => r.id === expandedInterest) ?? null;

  return (
    <div className="pb-6">
      {/* ── No profile photo gate ─────────────────────────── */}
      {photoBlocked && (
        <div className="mx-4 mt-4 mb-2 flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-amber-200 bg-amber-50">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Camera size={16} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#92400e" }}>Profile photo required</p>
            <p className="text-amber-700 mt-0.5" style={{ fontSize: "0.75rem", lineHeight: 1.4 }}>
              You need an approved profile photo before you can message other members.
            </p>
            <button onClick={onGoToProfile}
              className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              style={{ fontSize: "0.75rem", fontWeight: 700 }}>
              Add Profile Photo →
            </button>
          </div>
        </div>
      )}
      {/* ── Interests received — compact avatar strip ─────── */}
      {visibleInterests.length > 0 && (
        <div className="pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between px-4 mb-2.5">
            <div className="flex items-center gap-2">
              <span style={{ fontWeight: 700, fontSize: "0.8125rem" }}>Showed interest</span>
              <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "white" }}>{visibleInterests.length}</span>
              </span>
            </div>
            {!canMessage && (
              <button onClick={onUpgrade} className="text-primary hover:text-primary/80 transition-colors" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                Upgrade to reply →
              </button>
            )}
          </div>

          {/* Horizontal scrolling avatar chips — one per interest */}
          <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
            {visibleInterests.map(r => {
              const sc = r.score >= 90 ? "#0A6870" : r.score >= 85 ? "#C5733F" : "#68747F";
              return (
                <button
                  key={r.id}
                  onClick={() => setExpandedInterest(expandedInterest === r.id ? null : r.id)}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-2xl p-1"
                  aria-label={`${r.name} showed interest`}
                >
                  {/* Avatar with heart badge and score ring */}
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/30">
                      {r.photo
                        ? <img src={r.photo} alt={r.name} loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
                        : <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary" style={{ fontWeight: 800 }}>{r.name[0]}</div>}
                    </div>
                    {/* Score badge */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full border border-background"
                      style={{ background: sc, fontSize: "0.5rem", fontWeight: 800, color: "white", whiteSpace: "nowrap" }}>
                      {r.score}%
                    </div>
                    {/* Heart pulse dot */}
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent border-2 border-background flex items-center justify-center">
                      <Heart size={8} className="text-white" fill="currentColor" />
                    </div>
                  </div>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 600, maxWidth: 60, textAlign: "center", lineHeight: 1.2 }} className="truncate w-full text-center">{r.name.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Expandable detail panel — slides in below the strip when a chip is tapped */}
          {expandedData && (() => {
            const r = expandedData;
            const match = MDATA.find(m => m.id === r.matchId);
            const sc = r.score >= 90 ? "#0A6870" : r.score >= 85 ? "#C5733F" : "#68747F";
            return (
              <div className="mx-4 mt-3 bg-card rounded-2xl border border-primary/20 overflow-hidden view-enter">
                {/* Compact profile row */}
                <button onClick={() => onOpenMatch(r.matchId)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-primary/10">
                    {r.photo
                      ? <img src={r.photo} alt={r.name} loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
                      : <div className="w-full h-full flex items-center justify-center text-primary" style={{ fontWeight: 800 }}>{r.name[0]}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{r.name}</span>
                      <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{match?.age} · {match?.city}</span>
                    </div>
                    {match && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-0.5 flex-1">
                          {Object.values(match.compatibility).map((v, i) => (
                            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-muted">
                              <div className="h-full rounded-full" style={{ width: `${v}%`, background: sc }} />
                            </div>
                          ))}
                        </div>
                        <span style={{ fontSize: "0.6875rem", fontWeight: 800, color: sc }}>{r.score}%</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={15} className="text-muted-foreground flex-shrink-0" />
                </button>

                {/* Actions */}
                <div className="flex border-t border-border">
                  <button onClick={() => { setDismissedInterests(prev => [...prev, r.id]); setExpandedInterest(null); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                    <X size={13} /> Dismiss
                  </button>
                  <div className="w-px bg-border" />
                  <button onClick={() => onOpenMatch(r.matchId)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-primary hover:bg-secondary transition-colors"
                    style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                    <User size={13} /> Profile
                  </button>
                  <div className="w-px bg-border" />
                  {canMessage ? (
                    <button onClick={() => {
                      const conv = CONVS.find(c => c.partnerId === r.matchId);
                      if (conv) { setDismissedInterests(prev => [...prev, r.id]); setExpandedInterest(null); onOpenChat(conv.id); }
                      else toast("Starting a new conversation…");
                    }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                      <MessageCircle size={13} /> Message
                    </button>
                  ) : (
                    <button onClick={onUpgrade}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-primary hover:bg-primary/5 transition-colors"
                      style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                      <Lock size={12} /> Upgrade
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Connection requests ───────────────────────────── */}
      {pending.length > 0 && (
        <div className="px-4 pt-2">
          <p style={{ fontWeight: 700, fontSize: "0.9375rem" }} className="mb-3">Connection Requests</p>
          {pending.map(c => (
            <div key={c.id} className="bg-secondary rounded-2xl border border-primary/20 p-4 mb-2 flex items-center gap-3">
              <Avatar color={c.avatar.color} initials={c.avatar.initials} size={44} photo={c.photo} />
              <div className="flex-1 min-w-0">
                <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{c.partnerName}</p>
                <p className="text-muted-foreground truncate" style={{ fontSize: "0.8125rem" }}>{c.messages[0].text}</p>
                {!canMessage && <p className="text-amber-600 mt-0.5" style={{ fontSize: "0.6875rem", fontWeight: 600 }}>Upgrade to respond</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => decline(c)} aria-label={`Decline`}
                  className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors">
                  <X size={15} />
                </button>
                <button onClick={() => accept(c)} aria-label={`Accept`}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors ${canMessage ? "bg-primary hover:bg-primary/90" : "bg-muted-foreground/50 cursor-default"}`}>
                  <Check size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Active Conversations ──────────────────────────── */}
      <div className="px-4 pt-4">
        <p style={{ fontWeight: 700, fontSize: "0.9375rem" }} className="mb-3">Active Conversations</p>
        {active.length === 0 ? (
          <div className="bg-card rounded-3xl border border-border p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={28} className="text-primary" />
            </div>
            <p style={{ fontWeight: 700, fontSize: "1rem" }}>No conversations yet</p>
            <p className="text-muted-foreground mt-1.5" style={{ fontSize: "0.875rem" }}>When you connect with a match, your conversation will appear here.</p>
            <div className="mt-5 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground mx-auto w-fit cursor-pointer hover:bg-primary/90 transition-colors">
              <Heart size={15} />
              <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>Browse Matches</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {active.map(c => (
              <div key={c.id} className="group relative bg-card rounded-2xl border border-border hover:border-primary/20 hover:shadow-sm transition-all overflow-hidden">
                <button onClick={() => onOpenChat(c.id)}
                  className="w-full flex items-center gap-3 p-4 text-left">
                  <div className="relative">
                    <Avatar color={c.avatar.color} initials={c.avatar.initials} size={44} photo={c.photo} />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{c.partnerName}</span>
                      <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{c.time}</span>
                    </div>
                    <p className="text-muted-foreground truncate mt-0.5" style={{ fontSize: "0.8125rem" }}>{c.preview}</p>
                  </div>
                  {c.unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "white" }}>{c.unread}</span>
                    </div>
                  )}
                </button>
                {/* Report + Block — appear on hover */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                  {onReport && (
                    <button
                      onClick={() => onReport(c.partnerId, c.partnerName)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all"
                      style={{ fontSize: "0.6875rem", fontWeight: 600 }}>
                      <Flag size={11} /> Report
                    </button>
                  )}
                  <button
                    onClick={() => onRequestBlock ? onRequestBlock(c.partnerId, c.partnerName) : onBlock(c.partnerId)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                    style={{ fontSize: "0.6875rem", fontWeight: 600 }}>
                    <UserX size={11} /> Block
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PROFILE TAB ─────────────────────────────────────────
function ProfileTab({ setSubView, onSignOut, displayName = "Yusuf", profileStrength = 72, profileData = null, plan = "free", incompleteFields = [], onAvatarSaved }: {
  setSubView: (v: SubView) => void;
  onSignOut: () => void;
  displayName?: string;
  profileStrength?: number;
  profileData?: Record<string, unknown> | null;
  plan?: "free" | "basic" | "premium";
  incompleteFields?: { key: string; label: string; section: SubView }[];
  onAvatarSaved?: () => void;
}) {
  const pf = profileData ?? {} as Record<string, unknown>;
  const firstName   = displayName.split(" ")[0];
  // #4 — derive sub-row descriptions from actual onboarding data
  const personalSub = [pf.fullName as string, pf.age ? `${pf.age}` : "", pf.city as string].filter(Boolean).join(" · ") || "Add personal info";
  const careerSub   = [pf.profession as string, pf.education as string].filter(Boolean).join(" · ") || "Add career & education";
  const valuesSub   = [pf.religiosity ? `Religiosity ${pf.religiosity}/5` : "", pf.smoking as string].filter(Boolean).join(" · ") || "Add values & lifestyle";
  const goalsSub    = [pf.marriageTimeline as string, pf.wantsChildren as string].filter(Boolean).join(" · ") || "Add life goals";

  // Avatar — persisted as base64 so it survives reloads.
  const djangoBase = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

  const [avatarSrc, setAvatarSrc] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(AVATAR_KEY);
      // Discard blob: URLs (expire on reload) and data: URLs (stale base64 from old code)
      if (!stored || stored.startsWith("blob:") || stored.startsWith("data:")) {
        if (stored) localStorage.removeItem(AVATAR_KEY);
        return null;
      }
      return stored;
    } catch { return null; }
  });

  // Always refresh avatar from API on mount so Cloudinary URL is current
  useEffect(() => {
    import("../../lib/api").then(({ auth: apiAuth }) => {
      apiAuth.me().then(me => {
        const first = me.photos.find(ph => ph.image_url && ph.image_url.length > 0);
        if (!first) return;
        const url = fixMediaUrl(first.image_url!, djangoBase);
        setAvatarSrc(url);
        try { localStorage.setItem(AVATAR_KEY, url); } catch {}
      }).catch(() => {});
    });
  }, []);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    // Show base64 preview immediately
    const b64 = await fileToBase64(file);
    setAvatarSrc(b64);
    try {
      const { auth: apiAuth } = await import("../../lib/api");
      await apiAuth.uploadPhoto(file);
      // Fetch the authoritative Cloudinary URL from the server
      const me = await apiAuth.me();
      const first = me.photos.find(ph => ph.image_url && ph.image_url.length > 0);
      if (first?.image_url) {
        const url = fixMediaUrl(first.image_url, djangoBase);
        setAvatarSrc(url);
        try { localStorage.setItem(AVATAR_KEY, url); } catch {}
      }
    } catch {
      // Keep b64 preview — will be replaced by real URL on next page load via me()
      try { localStorage.setItem(AVATAR_KEY, b64); } catch {}
    }
    onAvatarSaved?.();
    toast.success("Profile picture saved.");
  };

  // #11 — SVG ring geometry
  const R = 30; const circ = 2 * Math.PI * R;
  const ringOffset = circ - (profileStrength / 100) * circ;

  const PROFILE_ROWS: { icon: ReactNode; label: string; sub: string; view: SubView; color: string }[] = [
    { icon: <User size={15} />,     label: "Personal Info",        sub: personalSub, view: "edit-profile",      color: "#0A6870" },
    { icon: <Briefcase size={15} />,label: "Career & Education",   sub: careerSub,   view: "career-education",  color: "#4A8DB8" },
    { icon: <Heart size={15} />,    label: "Values & Lifestyle",   sub: valuesSub,   view: "values-lifestyle",  color: "#C5733F" },
    { icon: <Star size={15} />,     label: "Life Goals & Timeline",sub: goalsSub,    view: "life-goals",        color: "#6B9E78" },
    { icon: <BookOpen size={15} />, label: "Partner Preferences",  sub: "Filter by age, country & faith",       view: "partner-prefs",     color: "#9B6DAF" },
  ];

  const ACCOUNT_ROWS: { icon: ReactNode; label: string; sub: string; view: SubView; color: string }[] = [
    { icon: <BookOpen size={15} />,label: "Guidance & Articles", sub: "Reading on values, faith & marriage", view: "blog-list",      color: "#6B9E78" },
    { icon: <Gift size={15} />,    label: "Refer & Earn",    sub: "Earn $10 per referral",              view: "referral",       color: "#C5733F" },
    { icon: <Bell size={15} />,    label: "Notifications",   sub: "Manage your alerts",                 view: "notifications",  color: "#4A8DB8" },
    { icon: <Shield size={15} />,  label: "Privacy & Safety",sub: "Visibility, blocked users, data",    view: "privacy-safety", color: "#0A6870" },
    { icon: <Settings size={15} />,label: "Settings",        sub: "Language, theme, support",           view: "app-settings",   color: "#68747F" },
  ];

  return (
    <div className="pb-8">
      {/* Header — #2 initials avatar, #11 SVG ring, #3 real name, #6b plan badge */}
      <div className="px-4 pt-5">
        <div className="flex items-start gap-4">
          {/* SVG strength ring wrapping initials avatar */}
          <div className="relative flex-shrink-0" style={{ width: 82, height: 82 }}>
            <svg width="82" height="82" className="absolute inset-0 -rotate-90" aria-hidden="true">
              <circle cx="41" cy="41" r={R} fill="none" strokeWidth="3.5" stroke="var(--muted)" />
              <circle cx="41" cy="41" r={R} fill="none" strokeWidth="3.5" stroke="var(--primary)"
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={ringOffset}
                style={{ transition: "stroke-dashoffset 0.7s ease" }} />
            </svg>
            {/* Avatar — shows saved photo or initials fallback */}
            <div className="absolute inset-2 rounded-full overflow-hidden border-2 border-background bg-primary/10 flex items-center justify-center">
              {avatarSrc
                ? <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" loading="eager" decoding="async" />
                : <span style={{ fontWeight: 800, fontSize: "1.5rem", color: "var(--primary)" }}>{firstName.charAt(0).toUpperCase()}</span>}
              {/* No moderation overlays — photos save directly */}
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground"
              style={{ fontSize: "0.5rem", fontWeight: 800, whiteSpace: "nowrap" }}>{profileStrength}%</div>
            {/* Camera button — opens file picker */}
            <input ref={avatarInputRef} type="file" accept="image/*" className="sr-only"
              onChange={handleAvatarChange} aria-label="Upload profile picture" />
            <button onClick={() => avatarInputRef.current?.click()}
              className="absolute -top-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background hover:bg-primary/90 transition-colors"
              aria-label="Change profile photo">
              <Camera size={11} className="text-white" />
            </button>
          </div>
          <div className="flex-1 pt-1">
            <div className="flex items-center gap-2">
              <h2 style={{ fontWeight: 800, fontSize: "1.25rem" }}>{displayName}</h2>
              {avatarSrc && <Shield size={15} className="text-primary" aria-label="Verified" />}
            </div>
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{personalSub}</p>
            {profileStrength < 100 && (
              <button onClick={() => setSubView("edit-profile")} className="mt-1.5 text-primary hover:text-primary/80 transition-colors" style={{ fontSize: "0.75rem", fontWeight: 600 }}>Complete profile →</button>
            )}
          </div>
        </div>
        {/* Plan badge — reflects current plan */}
        {plan !== "free" ? (
          <div className="mt-4 flex items-center justify-between rounded-xl p-3"
            style={{ background: plan === "premium" ? "#C5733F" : "#4A8DB8" }}>
            <div className="flex items-center gap-2">
              <Star size={15} className="text-white fill-white" />
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "white" }}>{plan.charAt(0).toUpperCase() + plan.slice(1)} Member</span>
            </div>
            <button onClick={() => setSubView("subscription")} style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>Manage →</button>
          </div>
        ) : (
          <button onClick={() => setSubView("subscription")}
            className="mt-4 w-full flex items-center justify-between rounded-xl p-3 border border-primary/20 bg-secondary/60 hover:bg-secondary transition-colors">
            <div className="flex items-center gap-2"><Star size={15} className="text-primary" /><span style={{ fontSize: "0.875rem", fontWeight: 700 }}>Free Plan</span></div>
            <span className="text-primary" style={{ fontSize: "0.75rem", fontWeight: 700 }}>Upgrade →</span>
          </button>
        )}
      </div>

      {/* ── Profile completion suggestions ─────────────── */}
      {incompleteFields.length > 0 && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
            <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={15} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#92400e" }}>
                {profileStrength}% complete — {incompleteFields.length} thing{incompleteFields.length !== 1 ? "s" : ""} to do
              </p>
              <p className="text-amber-600" style={{ fontSize: "0.75rem" }}>Tap any item to complete it</p>
            </div>
          </div>
          <div className="divide-y divide-amber-200/60">
            {incompleteFields.slice(0, 5).map(f => (
              <button
                key={f.key}
                onClick={() => setSubView(f.section)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-100/60 transition-colors">
                <div className="w-5 h-5 rounded-full border-2 border-amber-300 flex-shrink-0" />
                <span style={{ fontSize: "0.875rem", color: "#92400e" }}>{f.label}</span>
                <ChevronRight size={14} className="text-amber-400 ml-auto flex-shrink-0" />
              </button>
            ))}
            {incompleteFields.length > 5 && (
              <div className="px-4 py-2.5 text-center">
                <span className="text-amber-600" style={{ fontSize: "0.75rem" }}>
                  +{incompleteFields.length - 5} more items
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 100% complete celebration */}
      {profileStrength === 100 && (
        <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <Check size={15} className="text-green-600" />
          </div>
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "#065f46" }}>
            Profile complete! You're more visible to quality matches.
          </p>
        </div>
      )}

      {/* Photos — placeholder slots, no hardcoded stock images */}
      <ProfilePhotoGrid />

      {/* Profile Detail sections */}
      <div className="px-4 mt-6 space-y-2">
        <p className="text-muted-foreground mb-3" style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Profile Details</p>
        {PROFILE_ROWS.map(({ icon, label, sub, view, color }) => (
          <button key={label} onClick={() => setSubView(view)}
            className="w-full flex items-center gap-3 bg-card rounded-xl border border-border p-4 hover:border-primary/20 hover:shadow-sm transition-all text-left">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "18", color }}>{icon}</div>
            <div className="flex-1 min-w-0">
              <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{label}</p>
              <p className="text-muted-foreground truncate" style={{ fontSize: "0.8125rem" }}>{sub}</p>
            </div>
            <ChevronRight size={15} className="text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* Found a Partner CTA */}
      <div className="px-4 mt-4">
        <button onClick={() => setSubView("found-partner")}
          className="w-full flex items-center gap-3 bg-gradient-to-r from-primary/8 to-accent/8 rounded-xl border border-primary/25 p-4 hover:border-primary/40 transition-all text-left">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 text-primary">
            <PartyPopper size={17} />
          </div>
          <div className="flex-1">
            <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--primary)" }}>Found a Partner?</p>
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Let us know — close this chapter together</p>
          </div>
          <ChevronRight size={15} className="text-primary flex-shrink-0" />
        </button>
      </div>

      {/* Account sections */}
      <div className="px-4 mt-5 space-y-2">
        <p className="text-muted-foreground mb-3" style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Account</p>
        {ACCOUNT_ROWS.map(({ icon, label, sub, view, color }) => (
          <button key={label} onClick={() => setSubView(view)}
            className="w-full flex items-center gap-3 bg-card rounded-xl border border-border p-4 hover:border-primary/20 transition-all text-left">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "15", color }}>{icon}</div>
            <div className="flex-1 min-w-0">
              <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{label}</p>
              <p className="text-muted-foreground truncate" style={{ fontSize: "0.8125rem" }}>{sub}</p>
            </div>
            <ChevronRight size={15} className="text-muted-foreground flex-shrink-0" />
          </button>
        ))}
        {/* Deactivate */}
        <button onClick={() => setSubView("deactivate")}
          className="w-full flex items-center gap-3 bg-card rounded-xl border border-border p-4 hover:border-amber-200 hover:bg-amber-50/50 transition-all text-left">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <UserX size={15} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "#92400e" }}>Pause or Deactivate</p>
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Temporarily hide or close your account</p>
          </div>
          <ChevronRight size={15} className="text-muted-foreground flex-shrink-0" />
        </button>
        {/* Sign out */}
        <button onClick={onSignOut}
          className="w-full flex items-center gap-3 bg-card rounded-xl border border-border p-4 hover:bg-red-50 hover:border-red-100 transition-all text-left">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <LogOut size={15} className="text-destructive" />
          </div>
          <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--destructive)" }} className="flex-1">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

// ─── SUB VIEWS ────────────────────────────────────────────
// Chat message — text or image. imageUrl is set for image messages.
type ChatMsg = {
  id: string;
  from: "me" | "them";
  text: string;
  imageUrl?: string;   // present for image messages
  time: string;
  status?: "sent" | "delivered" | "read" | "failed";
};

const nowTime = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function ChatView({ conversationId, onBack, plan, onRequestBlock, onViewPartnerProfile, onReport, conversations, onGoToProfile }: {
  conversationId: string;
  onBack: () => void;
  plan: "free" | "basic" | "premium";
  onRequestBlock?: (matchId: string, name: string) => void;
  onViewPartnerProfile?: (matchId: string) => void;
  onReport?: (matchId: string, name: string) => void;
  conversations?: ConvItem[];
  onGoToProfile?: () => void;
}) {
  const conv = (conversations ?? []).find(c => c.id === conversationId);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>((conv?.messages as ChatMsg[]) ?? []);
  // Show suggestions when the conversation has fewer than 2 messages so the
  // opener always gets a nudge regardless of how the panel was dismissed before.
  const [showSuggestions, setShowSuggestions] = useState(messages.length < 2);
  const [typing, setTyping] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const readReceipts = plan !== "free";
  const canSendImages = plan === "premium"; // only Premium can send images

  const scrollToBottom = (instant = false) =>
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: instant ? "instant" : "smooth" })
    );

  // Load real messages from backend when chat opens
  useEffect(() => {
    messagingApi.messages(conversationId).then(res => {
      if (res.results.length) {
        setMessages(res.results.map(m => ({
          id:       m.id,
          from:     m.sender.id === conv?.partnerId ? "them" : "me",
          text:     m.content ?? "",
          imageUrl: m.image_url ?? undefined,
          time:     new Date(m.sent_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          status:   m.read_at ? "read" : "delivered",
        } as ChatMsg)));
      }
    }).catch(() => {}).finally(() => scrollToBottom(true));
  }, [conversationId]);

  const send = (text: string, imageUrl?: string) => {
    if (!text.trim() && !imageUrl) return;
    const msgId = `m${Date.now()}`;
    setMessages(prev => [...prev, { id: msgId, from: "me", text, imageUrl, time: nowTime(), status: "sent" }]);
    setInput("");
    setShowSuggestions(false);
    scrollToBottom();

    if (text.trim()) {
      messagingApi.send(conversationId, text)
        .then(() => {
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: "delivered" } : m));
          if (readReceipts) {
            setTimeout(() => setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: "read" } : m)), 800);
          }
        })
        .catch(() => {
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: "failed" } : m));
          toast.error("Message not sent — check your connection and try again.");
        });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large — please choose a photo under 2 MB.");
      return;
    }
    // Show local preview immediately for instant feedback
    const localUrl = URL.createObjectURL(file);
    const id = `m${Date.now()}`;
    setMessages(prev => [...prev, { id, from: "me", text: "", imageUrl: localUrl, time: nowTime(), status: "sent" }]);
    setShowSuggestions(false);
    scrollToBottom();

    // Upload to backend → saved to Cloudinary under chats/{sender_email}/
    try {
      const msg = await messagingApi.sendImage(conversationId, file);
      const cloudUrl = msg.image_url ?? localUrl;
      setMessages(prev => prev.map(m => m.id === id ? { ...m, imageUrl: cloudUrl, status: "delivered" } : m));
    } catch {
      // Keep local preview if upload fails; mark delivered anyway
      setTimeout(() => setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "delivered" } : m)), 600);
    }
  };

  if (!conv) return (
    <div className="flex flex-col h-full bg-background items-center justify-center gap-3 text-muted-foreground">
      <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      <p style={{ fontSize: "0.875rem" }}>Loading conversation…</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxSrc(null)}>
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" aria-label="Close">
            <X size={20} className="text-white" />
          </button>
          <img src={lightboxSrc} alt="Full size" className="max-w-full max-h-full rounded-2xl object-contain" style={{ maxHeight: "88vh" }} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={onBack} aria-label="Go back" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={22} />
        </button>

        {/* Avatar — tappable to view partner profile */}
        <button
          onClick={() => onViewPartnerProfile?.(conv.partnerId)}
          disabled={!onViewPartnerProfile}
          aria-label={`View ${conv.partnerName}'s profile`}
          className="flex-shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-opacity hover:opacity-80 active:opacity-60 disabled:cursor-default">
          <Avatar color={conv.avatar.color} initials={conv.avatar.initials} size={36} photo={conv.photo} />
        </button>

        <div className="flex-1 min-w-0">
          {/* Name also tappable */}
          <button
            onClick={() => onViewPartnerProfile?.(conv.partnerId)}
            disabled={!onViewPartnerProfile}
            className="text-left disabled:cursor-default hover:text-primary transition-colors">
            <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{conv.partnerName}</p>
          </button>
          <div className="flex items-center gap-1.5">
            {typing ? (
              <span className="text-primary" style={{ fontSize: "0.75rem", fontWeight: 600 }}>typing…</span>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Active now</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onReport && (
            <button
              onClick={() => onReport(conv.partnerId, conv.partnerName)}
              aria-label="Report user"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors"
              style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              <Flag size={14} /> Report
            </button>
          )}
          {onRequestBlock && (
            <button
              onClick={() => onRequestBlock(conv.partnerId, conv.partnerName)}
              aria-label="Block user"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
              style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              <UserX size={14} /> Block
            </button>
          )}
        </div>
      </div>

      {/* Free-user guest chat banner */}
      {plan === "free" && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100">
          <AlertCircle size={13} className="text-amber-600 flex-shrink-0" />
          <span className="text-amber-700" style={{ fontSize: "0.75rem" }}>
            You're chatting as a free member because they initiated this conversation. Upgrade to message anyone.
          </span>
        </div>
      )}

      {/* No photo banner */}
      {false && (
        <div className="mx-3 mt-2 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-amber-50 border border-amber-200">
          <Camera size={15} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#92400e" }}>Profile photo required to message</p>
            <p style={{ fontSize: "0.6875rem", color: "#b45309" }}>Messages are read-only until you add an approved photo.</p>
          </div>
          <button onClick={onGoToProfile}
            className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            style={{ fontSize: "0.6875rem", fontWeight: 700 }}>
            Add Photo
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-10">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageCircle size={26} className="text-primary" />
            </div>
            <p style={{ fontWeight: 700, fontSize: "1rem" }}>Start the conversation</p>
            <p className="text-muted-foreground mt-1.5 max-w-xs" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
              Be warm and intentional — a good opening question shows genuine curiosity.
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl overflow-hidden ${msg.from === "me" ? "bg-primary text-white rounded-br-sm" : "bg-card border border-border rounded-bl-sm"}`}>
              {/* Image bubble with loading skeleton */}
              {msg.imageUrl && (
                <button onClick={() => setLightboxSrc(msg.imageUrl!)} className="block w-full relative" aria-label="View image"
                  style={{ maxWidth: 220, minHeight: 80 }}>
                  <div className="absolute inset-0 bg-muted rounded-t-2xl animate-pulse" />
                  <img src={msg.imageUrl} alt="Shared image" loading="lazy" decoding="async"
                    className="w-full object-cover rounded-t-2xl relative z-10"
                    style={{ maxWidth: 220, maxHeight: 220 }}
                    onLoad={e => { (e.target as HTMLElement).previousElementSibling?.classList.remove("animate-pulse"); }} />
                </button>
              )}
              {/* Text */}
              {msg.text && (
                <div className="px-4 py-2.5">
                  <p style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>{msg.text}</p>
                </div>
              )}
              {/* Timestamp + tick */}
              <div className={`px-4 pb-2 flex items-center gap-1 ${msg.from === "me" ? "justify-end text-white/60" : "text-muted-foreground"}`}>
                <span style={{ fontSize: "0.7rem" }}>{msg.time}</span>
                {msg.from === "me" && msg.status && (
                  msg.status === "failed"
                    ? <AlertCircle size={13} className="text-red-400" aria-label="Failed" />
                    : msg.status === "read" && readReceipts
                      ? <CheckCheck size={13} className="text-sky-300" aria-label="Read" />
                      : msg.status === "delivered" || msg.status === "read"
                        ? <CheckCheck size={13} aria-label="Delivered" />
                        : <Check size={13} aria-label="Sent" />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing bubble */}
        {typing && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-card border border-border flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
                  style={{ animation: "float 1s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggested openers */}
      {showSuggestions && (
        <div className="px-4 py-3 border-t border-border">
          <p className="text-muted-foreground mb-2" style={{ fontSize: "0.75rem" }}>Suggested openers:</p>
          <div className="flex flex-col gap-1.5">
            {["What do you value most in a relationship?", "What are your hobbies outside of work?", "How important is family to you?"].map(s => (
              <button key={s} onClick={() => send(s)}
                className="text-left px-3 py-2 bg-secondary rounded-xl text-secondary-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                style={{ fontSize: "0.8125rem" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input toolbar */}
      <div className="px-4 py-3 border-t border-border flex gap-2 bg-card">
        {/* Image button — Premium only */}
        {canSendImages ? (
          <>
            <input
              ref={imgInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleImageUpload}
              aria-label="Upload image"
            />
            <button
              onClick={() => imgInputRef.current?.click()}
              aria-label="Send image"
              className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary hover:bg-primary/10 transition-colors flex-shrink-0">
              <ImagePlus size={18} />
            </button>
          </>
        ) : (
          <button
            onClick={() => toast("Only Premium members can send images. Upgrade to share photos.", { action: { label: "Upgrade", onClick: () => {} } })}
            aria-label="Image sharing requires Premium"
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground transition-colors flex-shrink-0 relative group">
            <ImagePlus size={18} />
            <Lock size={10} className="absolute bottom-1 right-1" />
          </button>
        )}

        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send(input)}
          aria-label="Message"
          placeholder="Type a message…"
          className="flex-1 px-4 py-2.5 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          style={{ fontSize: "0.9rem" }}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim()}
          aria-label="Send message"
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed bg-primary hover:bg-primary/90">
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}

function MatchDetailView({ matchId, plan, onBack, onUpgrade, onMessage, isAlreadyChatting = false, sentInterest = false, onInterest, displayName, onReport, matchesList }: {
  matchId: string;
  plan: "free" | "basic" | "premium";
  onBack: () => void;
  onUpgrade: () => void;
  onMessage: (id: string) => void;
  isAlreadyChatting?: boolean;
  sentInterest?: boolean;
  onInterest?: (id: string, name: string) => void;
  displayName?: string;
  onReport?: (matchId: string, name: string) => void;
  matchesList?: MatchItem[];
}) {
  const match = (matchesList ?? []).find(m => m.id === matchId);
  const [activePhoto, setActivePhoto] = useState(0);
  const [localInterest, setLocalInterest] = useState(sentInterest);
  // Private note — Premium only, stored in localStorage per match.
  const noteKey = `ma3_note_${matchId}`;
  const [note, setNote] = useState(() => { try { return localStorage.getItem(noteKey) ?? ""; } catch { return ""; } });
  const [noteOpen, setNoteOpen] = useState(false);
  const saveNote = () => {
    try { localStorage.setItem(noteKey, note); } catch {}
    setNoteOpen(false);
    toast.success("Private note saved — only visible to you.");
  };
  if (!match) return null;

  const sc = match.score >= 90 ? "#0A6870" : match.score >= 85 ? "#C5733F" : "#68747F";
  const label = match.score >= 90 ? "Exceptional Match" : match.score >= 85 ? "Strong Match" : match.score >= 80 ? "Good Match" : "Compatible";
  const religiosity = ["", "Minimal", "Moderate", "Practicing", "Devout", "Very Devout"][match.religiosity] ?? "";

  // Only FREE members are restricted to the preview. Members with an active
  // subscription (basic or premium) get the full profile view.
  const isLocked = plan === "free";
  const detailScrollRef = useRef<HTMLDivElement>(null);
  const [showTopBtn, setShowTopBtn] = useState(false);

  return (
    <div
      ref={detailScrollRef}
      className="flex flex-col h-full bg-background overflow-y-auto"
      onScroll={e => setShowTopBtn((e.target as HTMLElement).scrollTop > 400)}>

      {/* Floating back-to-top button (appears after scrolling 400px) */}
      {showTopBtn && (
        <button
          onClick={() => detailScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="fixed bottom-6 right-4 z-50 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-all active:scale-90"
          style={{ boxShadow: "0 4px 14px rgba(10,104,112,0.4)" }}>
          <ArrowRight size={16} style={{ transform: "rotate(-90deg)" }} />
        </button>
      )}

      {/* ── Hero photo ── */}
      <div className="relative flex-shrink-0" style={{ height: "420px" }}>
        <img src={match.photos[activePhoto]} alt={match.fullName} decoding="async" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,16,28,0.9) 0%, rgba(8,16,28,0.35) 50%, transparent 100%)" }} />

        {/* Back */}
        <button onClick={onBack} aria-label="Go back" className="overlay-nav-btn absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
          <ChevronLeft size={20} />
        </button>

        {/* Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end">
          <div className="rounded-2xl flex flex-col items-center justify-center shadow-lg" style={{ background: sc, padding: "8px 12px", minWidth: 60 }}>
            <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "white", lineHeight: 1 }}>{match.score}</span>
            <span style={{ fontSize: "0.475rem", fontWeight: 800, color: "white", opacity: 0.8, letterSpacing: "0.06em", marginTop: 1 }}>MATCH %</span>
          </div>
          <div className="flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: "rgba(197,115,63,0.9)", backdropFilter: "blur(6px)" }}>
            <Star size={10} className="text-white" />
            <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "white" }}>Premium</span>
          </div>
        </div>

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 style={{ fontWeight: 900, fontSize: "1.875rem", color: "white", letterSpacing: "-0.025em", lineHeight: 1.05 }}>
            {match.fullName}
          </h2>
          <p style={{ fontSize: "1rem", color: "white", opacity: 0.75, marginTop: 4 }}>{match.age} · {match.city}, {match.country}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" }}>
              <Shield size={10} className="text-white" />
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "white" }}>Verified</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" }}>
              <Heart size={10} className="text-white" />
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "white" }}>{label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Photo gallery strip + actions ── */}
      <div className="flex flex-col bg-card border-b border-border">
        {/* Photo thumbnails row */}
        <div className="flex gap-1.5 px-4 pt-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {match.photos.map((ph, i) => (
            <button key={i}
              onClick={() => isLocked ? undefined : setActivePhoto(i)}
              aria-disabled={isLocked}
              className="rounded-xl overflow-hidden flex-shrink-0 transition-all relative"
              style={{ width: 64, height: 72, opacity: activePhoto === i ? 1 : 0.55, outline: !isLocked && activePhoto === i ? `2px solid var(--primary)` : "none", outlineOffset: 2 }}>
              <img src={ph} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover object-top"
                style={{ filter: isLocked && i > 0 ? "blur(6px)" : "none" }} />
              {isLocked && i > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                  <Lock size={14} className="text-white/80" />
                </div>
              )}
            </button>
          ))}
        </div>
        {/* Action buttons row */}
        <div className="flex items-center gap-2 px-4 pb-3">
          {onReport && (
            <button
              onClick={() => onReport(match.id, match.fullName.split(" ")[0])}
              aria-label="Report this profile"
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors border border-border"
              style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              <Flag size={13} /> Report
            </button>
          )}
          <div className="flex-1" />
          {isAlreadyChatting ? (
            <button onClick={() => onMessage(match.id)}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all"
              style={{ fontSize: "0.875rem", fontWeight: 700 }}>
              <MessageCircle size={14} /> Open Chat
            </button>
          ) : plan !== "free" ? (
            <button onClick={() => onMessage(match.id)}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all"
              style={{ fontSize: "0.875rem", fontWeight: 700 }}>
              <Send size={14} /> Message
            </button>
          ) : (
            <button
              onClick={() => { if (!localInterest) { setLocalInterest(true); onInterest?.(match.id, match.fullName.split(" ")[0]); } }}
              disabled={localInterest}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${localInterest ? "bg-green-100 text-green-700" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
              style={{ fontSize: "0.875rem", fontWeight: 700 }}>
              <Heart size={14} fill={localInterest ? "currentColor" : "none"} />
              {localInterest ? "Interested ✓" : "Show Interest"}
            </button>
          )}
        </div>
      </div>

      {/* ── Profile content ── */}
      <div className="p-4 space-y-4">

        {/* Score summary — always visible */}
        <div className="rounded-2xl p-5 text-white text-center" style={{ background: sc }}>
          <p style={{ fontSize: "0.8125rem", opacity: 0.8 }}>Overall Compatibility</p>
          <p style={{ fontSize: "3.25rem", fontWeight: 900, lineHeight: 1, marginTop: 4 }}>
            {match.score}<span style={{ fontSize: "1.25rem", opacity: 0.75 }}>%</span>
          </p>
          <p style={{ fontSize: "0.875rem", opacity: 0.7, marginTop: 4 }}>{label}</p>
        </div>

        {/* Highlights/tags — always visible (same as match card) */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.75rem" }}>Why you match</h3>
          <div className="flex flex-wrap gap-2">
            {match.highlights.map(h => (
              <span key={h} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ fontSize: "0.8125rem", fontWeight: 700, background: sc + "18", color: sc }}>
                <Check size={12} />{h}
              </span>
            ))}
          </div>
        </div>

        {/* Basic compat bars — always visible */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "1rem" }}>Compatibility Overview</h3>
          <div className="space-y-4">
            {Object.entries(match.compatibility).map(([k, v]) => (
              <CompatBar key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} />
            ))}
          </div>
        </div>

        {isLocked ? (
          /* ── UPGRADE WALL for free / basic plans ── */
          <div className="rounded-3xl overflow-hidden border border-primary/20" style={{ background: "var(--card)" }}>
            {/* Blurred preview of what's hidden */}
            <div className="relative px-5 pt-5 pb-2 select-none" style={{ userSelect: "none" }}>
              <div className="space-y-3" style={{ filter: "blur(5px)", pointerEvents: "none" }}>
                {[
                  ["Age", `${match.age} years`],
                  ["Nationality", match.nationality],
                  ["Religion", religiosity],
                  ["Profession", match.profession],
                  ["Marriage Timeline", match.timeline],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>{l}</span>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{v}</span>
                  </div>
                ))}
              </div>
              {/* Lock overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "linear-gradient(to bottom, transparent 0%, var(--card) 40%)" }}>
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 mb-3">
                  <Star size={24} className="text-primary-foreground" />
                </div>
                <p style={{ fontWeight: 800, fontSize: "1.0625rem", textAlign: "center" }}>
                  Unlock Full Profile
                </p>
                <p className="text-muted-foreground mt-1.5 text-center px-6" style={{ fontSize: "0.875rem" }}>
                  Subscribe to a Basic or Premium plan to see this match's full profile, biography, and message them directly.
                </p>
              </div>
            </div>

            {/* What's inside teasers */}
            <div className="px-5 pb-5 pt-2">
              <div className="grid grid-cols-2 gap-2 mb-4">
                {["Full Bio", "Career & Education", "Values & Lifestyle", "Life Goals", "Personality traits", "Direct Messaging"].map(f => (
                  <div key={f} className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0" />
                    <span className="text-muted-foreground" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={onUpgrade}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
                style={{ fontWeight: 700, fontSize: "1rem" }}>
                <Star size={17} />
                View Plans
              </button>

              <button
                onClick={onUpgrade}
                className="w-full mt-2 py-3.5 rounded-2xl border border-border text-foreground hover:bg-muted transition-all"
                style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                Start with Basic — $19/mo
              </button>
            </div>
          </div>
        ) : (
          /* ── FULL PROFILE for premium ── */
          <>
            {/* About / Bio */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.75rem" }}>About {match.fullName.split(" ")[0]}</h3>
              <p className="text-muted-foreground" style={{ fontSize: "0.9375rem", lineHeight: 1.75 }}>{match.bio}</p>
            </div>

            {/* Quick facts */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "1rem" }}>Personal Details</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Age",         value: `${match.age} years` },
                  { label: "Height",      value: `${match.height} cm` },
                  { label: "Nationality", value: match.nationality },
                  { label: "City",        value: `${match.city}, ${match.country}` },
                  { label: "Languages",   value: match.languages.join(", ") },
                  { label: "Religion",    value: religiosity },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/50 rounded-xl p-3">
                    <p className="text-muted-foreground" style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{label}</p>
                    <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Career & Education */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "1rem" }}>Career & Education</h3>
              <div className="space-y-3">
                {[
                  { icon: <Briefcase size={14} />, label: "Profession", value: `${match.profession} · ${match.company}` },
                  { icon: <BookOpen size={14} />, label: "Education", value: `${match.education}` },
                  { icon: <BookOpen size={14} />, label: "Institution", value: match.institution },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 text-primary mt-0.5">{icon}</div>
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{label}</p>
                      <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Values & Lifestyle */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "1rem" }}>Values & Lifestyle</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Religiosity", value: religiosity },
                  { label: "Family",      value: match.familyImportance },
                  { label: "Smoking",     value: match.smoking },
                  { label: "Drinks",      value: match.drinking },
                  { label: "Diet",        value: match.diet },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/50 rounded-xl p-3">
                    <p className="text-muted-foreground" style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{label}</p>
                    <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {match.lifestyle.map(t => (
                  <span key={t} className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Personality */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.75rem" }}>Personality</h3>
              <div className="flex flex-wrap gap-2">
                {match.personality.map(t => (
                  <span key={t} className="px-3 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-primary" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Goals & Timeline */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "1rem" }}>Life Goals & Timeline</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-muted/50 rounded-xl p-3 col-span-2">
                  <p className="text-muted-foreground" style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Marriage Timeline</p>
                  <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--primary)" }}>{match.timeline}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 col-span-2">
                  <p className="text-muted-foreground" style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Children</p>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{match.wantsChildren}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {match.goals.map(g => (
                  <span key={g} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                    <Check size={11} className="text-primary" />{g}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            {isAlreadyChatting ? (
              <button onClick={() => onMessage(match.id)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl hover:bg-primary/90 transition-all active:scale-[0.98]"
                style={{ fontWeight: 700, fontSize: "1rem" }}>
                <MessageCircle size={17} /> Continue Conversation
              </button>
            ) : plan === "premium" ? (
              // Premium: full message + "Send Introduction" templated opener
              <div className="space-y-3">
                <button onClick={() => onMessage(match.id)}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl hover:bg-primary/90 transition-all active:scale-[0.98]"
                  style={{ fontWeight: 700, fontSize: "1rem" }}>
                  <Send size={17} /> Send a Message to {match.fullName.split(" ")[0]}
                </button>
                <button
                  onClick={() => {
                    const senderName = (displayName ?? "").replace(/\s*\(.*\)/, "").trim() || "a fellow member";
                    const intro = `Assalamu alaikum ${match.fullName.split(" ")[0]}, my name is ${senderName}. I came across your profile and I was genuinely impressed by your values and goals — I think we could have a meaningful conversation. I'd love to connect if you're open to it.`;
                    toast("Introduction copied! Paste it as your first message.", { duration: 4000 });
                    navigator.clipboard?.writeText(intro).catch(() => {});
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-primary/30 text-primary hover:bg-primary/5 transition-all"
                  style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                  <Star size={15} /> Use Introduction Template
                </button>
              </div>
            ) : (
              <button onClick={() => onMessage(match.id)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl hover:bg-primary/90 transition-all active:scale-[0.98]"
                style={{ fontWeight: 700, fontSize: "1rem" }}>
                <Send size={17} /> Send a Message to {match.fullName.split(" ")[0]}
              </button>
            )}
          </>
        )}

        {/* Private notes — Premium only (item 14) */}
        {plan === "premium" && (
          <div className="mx-4 mb-4 rounded-2xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setNoteOpen(s => !s)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Edit2 size={15} className="text-primary" />
                <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Private note</span>
                {note && <span className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                {noteOpen ? "Close" : note ? "Edit" : "Add"}
              </span>
            </button>
            {noteOpen && (
              <div className="px-5 pb-5 space-y-3 view-enter">
                <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                  Only you can see this — jot down context, reminders, or impressions.
                </p>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={4}
                  placeholder={`Notes about ${match.fullName.split(" ")[0]}…`}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  style={{ fontSize: "0.9rem" }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => setNoteOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
                    style={{ fontSize: "0.875rem" }}>
                    Cancel
                  </button>
                  <button onClick={saveNote}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                    Save Note
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Verve card detection ─────────────────────────────────
// Verve (Nigeria) uses 16–19 digit card numbers starting with 5061, 6500–6599,
// 650002–650027, or 507865–507964. They don't always follow 4-4-4-4 grouping.
function detectCardType(digits: string): "verve" | "standard" {
  if (/^(5061|650[0-9]{2,3}|507865|507[89][0-9]{2}|5079[0-6][0-9])/.test(digits)) return "verve";
  return "standard";
}

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const type = detectCardType(digits);
  if (type === "verve") {
    // Verve: group as 4-4-4-4-3 (up to 19 digits, no strict grouping enforced)
    return digits.slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
  }
  // Standard Visa/MC/Amex: 4-4-4-4
  return digits.slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function CardNumberInput({ onTypeChange }: { onTypeChange?: (t: "verve" | "standard") => void }) {
  const [value, setValue] = useState("");
  const type = detectCardType(value.replace(/\s/g, ""));
  const maxLen = type === "verve" ? 23 : 19; // 19 digits + spaces

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setValue(formatted);
    onTypeChange?.(detectCardType(formatted.replace(/\s/g, "")));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Card Number</label>
        {type === "verve" && (
          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700" style={{ fontSize: "0.6875rem", fontWeight: 700 }}>
            Verve detected
          </span>
        )}
      </div>
      <input
        value={value}
        onChange={handleChange}
        placeholder="•••• •••• •••• ••••"
        maxLength={maxLen}
        inputMode="numeric"
        className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        style={{ fontSize: "0.9375rem", letterSpacing: "0.05em" }}
      />
    </div>
  );
}

function ExpiryInput() {
  const [value, setValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    setValue(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && value.endsWith("/")) {
      e.preventDefault();
      setValue(value.slice(0, -1));
    }
  };

  return (
    <div>
      <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Expiry</label>
      <input
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="MM/YY"
        maxLength={5}
        inputMode="numeric"
        className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        style={{ fontSize: "0.9375rem" }}
      />
    </div>
  );
}

function CvcInput({ cardType }: { cardType: "verve" | "standard" }) {
  const [value, setValue] = useState("");
  // Amex uses 4-digit CVC; Verve uses 3; all others use 3.
  const maxLen = cardType === "standard" ? 3 : 3; // can extend to 4 for Amex detection
  const placeholder = "•".repeat(maxLen);
  const hint = cardType === "verve" ? "3 digits on back" : "3 digits on back";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>CVC / CVV</label>
        <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{hint}</span>
      </div>
      <input
        value={value}
        onChange={e => setValue(e.target.value.replace(/\D/g, "").slice(0, maxLen))}
        placeholder={placeholder}
        maxLength={maxLen}
        inputMode="numeric"
        className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        style={{ fontSize: "0.9375rem", letterSpacing: "0.15em" }}
      />
    </div>
  );
}

function SubscriptionView({ onBack, onUpgrade, currentPlan = "free", displayName = "" }: {
  onBack: () => void;
  onUpgrade: (plan: "free" | "basic" | "premium") => void;
  currentPlan?: "free" | "basic" | "premium";
  displayName?: string;
}) {
  const [selected, setSelected] = useState<string | null>(currentPlan !== "free" ? currentPlan : null);
  const [paying, setPaying] = useState(false);
  const [payCardType, setPayCardType] = useState<"verve" | "standard">("standard");

  if (paying) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setPaying(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={22} />
          </button>
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Payment</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="bg-secondary rounded-2xl p-4 border border-primary/20">
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>You selected</p>
            <p style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--primary)" }}>
              {PLANS.find(p => p.id === selected)?.name} — {PLANS.find(p => p.id === selected)?.price}{PLANS.find(p => p.id === selected)?.period}
            </p>
          </div>
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Cardholder Name</label>
            <input placeholder={displayName || "Full name on card"} className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" style={{ fontSize: "0.9375rem" }} />
          </div>
          <CardNumberInput onTypeChange={ct => setPayCardType(ct)} />
          <div className="grid grid-cols-2 gap-3">
            {/* Expiry with auto-slash */}
            <ExpiryInput />
            <div>
              <CvcInput cardType={payCardType} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield size={13} className="text-primary" />
            <span style={{ fontSize: "0.75rem" }}>Secured by Credo · 256-bit SSL encryption</span>
          </div>
          <button
            onClick={() => {
              const tier = selected as "basic" | "premium";
              onUpgrade(tier);
              toast.success(`You're now on the ${tier === "premium" ? "Premium" : "Basic"} plan 🎉`);
              onBack();
            }}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl hover:bg-primary/90 transition-all active:scale-[0.98]"
            style={{ fontWeight: 700, fontSize: "1rem" }}
          >
            Confirm Payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Choose Your Plan</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <p className="text-muted-foreground mb-6" style={{ fontSize: "0.9375rem" }}>Unlock more matches, features, and better visibility.</p>
        <div className="space-y-3">
          {PLANS.map(plan => {
            const isCurrent = plan.id === currentPlan;
            const isSelected = plan.id === selected;
            return (
              <button key={plan.id}
                onClick={() => !isCurrent && setSelected(plan.id)}
                disabled={isCurrent}
                className={`w-full text-left rounded-2xl border p-5 transition-all ${
                  isCurrent ? "border-primary/40 bg-primary/5 cursor-default"
                    : isSelected ? "border-primary bg-secondary shadow-md shadow-primary/10"
                      : "border-border bg-card hover:border-primary/30"
                } ${plan.highlight && !isCurrent ? "ring-2 ring-primary/30" : ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontWeight: 800, fontSize: "1.0625rem" }}>{plan.name}</span>
                      {isCurrent && <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.7rem", fontWeight: 700, background: "var(--primary)", color: "white" }}>Current plan</span>}
                      {!isCurrent && plan.highlight && <span className="bg-accent text-accent-foreground px-2 py-0.5 rounded-full" style={{ fontSize: "0.7rem", fontWeight: 700 }}>POPULAR</span>}
                    </div>
                    <div className="flex items-baseline gap-0.5 mt-1">
                      <span style={{ fontSize: "1.625rem", fontWeight: 900, color: "var(--primary)" }}>{plan.price}</span>
                      <span className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>{plan.period}</span>
                    </div>
                  </div>
                  {isCurrent
                    ? <CheckCircle size={20} className="text-primary mt-1 flex-shrink-0" />
                    : <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${isSelected ? "border-primary bg-primary" : "border-border"}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>}
                </div>
                <div className="mt-4 space-y-2">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <Check size={13} className={isCurrent ? "text-primary/50" : "text-primary"} />
                      <span style={{ fontSize: "0.875rem", color: isCurrent ? "var(--muted-foreground)" : "var(--foreground)" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        {selected && selected !== "free" && selected !== currentPlan && (
          <button
            onClick={() => setPaying(true)}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl hover:bg-primary/90 transition-all active:scale-[0.98]"
            style={{ fontWeight: 700, fontSize: "1rem" }}
          >
            Continue to Payment
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

function ReferralView({ onBack, userEmail }: { onBack: () => void; userEmail?: string }) {
  const [copied, setCopied] = useState(false);
  const [apiStats, setApiStats] = useState<ReferralStats | null>(null);
  const [bonusPoints, setBonusPoints] = useState<number>(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      referralsApi.myCode().catch(() => null),
      import("../../lib/api").then(({ publicApi }) => publicApi.settings().catch(() => null)),
    ]).then(([stats, settings]) => {
      if (stats) setApiStats(stats);
      if (settings?.referral_bonus_points) setBonusPoints(settings.referral_bonus_points);
    }).finally(() => setLoading(false));
  }, []);

  const code = apiStats?.code ?? (() => {
    const base = (userEmail ?? "user").toLowerCase().replace(/[^a-z0-9]/g, "");
    let h = 0;
    for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) >>> 0;
    return `MA3-${(h % 9000 + 1000).toString()}`;
  })();

  const shareUrl = apiStats?.referral_url ?? `https://ma3moni.com/?ref=${code}`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Ma3moni — Marriage Platform",
          text: `Use my referral code ${code} when you sign up and we both earn ${bonusPoints} points!`,
          url: shareUrl,
        });
        return;
      } catch {}
    }
    // Fallback to copy.
    navigator.clipboard?.writeText(`${shareUrl} — referral code: ${code}`).catch(() => {});
    setCopied(true);
    toast.success("Share link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    toast.success("Referral code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Refer & Earn</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {/* Hero */}
        <div className="bg-primary rounded-2xl p-6 text-white text-center mb-6">
          <Gift size={36} className="mx-auto mb-3 opacity-80" />
          <h2 style={{ fontWeight: 800, fontSize: "1.5rem" }}>
            Earn {bonusPoints ? `${bonusPoints} pts` : "$10"} per referral
          </h2>
          <p style={{ fontSize: "0.9rem", opacity: 0.8, marginTop: 8 }}>
            Share your unique code with friends and earn when they subscribe.
          </p>
        </div>

        {/* Referral code — single line with copy + share */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-4">
          <p className="text-muted-foreground mb-2.5" style={{ fontSize: "0.8125rem" }}>Your referral code</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 bg-input-background rounded-xl px-3 py-2.5 flex items-center gap-2">
              <span style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "0.06em", color: "var(--primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{code}</span>
            </div>
            <button
              onClick={copyCode}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl transition-all flex-shrink-0 ${copied ? "bg-green-50 text-green-600 border border-green-200" : "bg-secondary text-primary hover:bg-primary hover:text-white border border-secondary"}`}
              style={{ fontSize: "0.8125rem", fontWeight: 600 }}
            >
              <Copy size={14} /> {copied ? "Copied!" : "Copy"}
            </button>
            {/* Native share sheet (falls back to copy on desktop) */}
            <button
              onClick={share}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex-shrink-0"
              style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              <ArrowRight size={14} style={{ transform: "rotate(-45deg)" }} /> Share
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-4 text-center animate-pulse">
                <div className="h-8 bg-muted rounded-lg mx-auto mb-1 w-12" />
                <div className="h-3 bg-muted rounded w-16 mx-auto" />
              </div>
            ))
          ) : [
            { value: String(apiStats?.total_signups ?? 0),   label: "Signups" },
            { value: String(apiStats?.total_converted ?? 0), label: "Converted" },
            { value: String(apiStats?.total_points ?? 0),    label: "Points" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-card rounded-2xl border border-border p-4 text-center">
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)" }}>{value}</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Monthly activity */}
        {apiStats?.monthly_stats && apiStats.monthly_stats.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-5 mb-6">
            <h3 style={{ fontWeight: 700, fontSize: "0.9375rem" }} className="mb-4">Monthly Referrals</h3>
            <div className="space-y-2">
              {apiStats.monthly_stats.slice(-6).map(m => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-muted-foreground w-20 flex-shrink-0" style={{ fontSize: "0.8125rem" }}>{m.month}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (m.signups / Math.max(...apiStats.monthly_stats.map(x => x.signups), 1)) * 100)}%` }} />
                  </div>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--primary)", minWidth: 20, textAlign: "right" }}>{m.signups}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 style={{ fontWeight: 700, fontSize: "0.9375rem" }} className="mb-4">How It Works</h3>
          {[
            { step: "1", text: "Share your code with friends looking for a partner" },
            { step: "2", text: "They sign up and enter your referral code" },
            { step: "3", text: `When they subscribe, you earn ${bonusPoints ? `${bonusPoints} points` : "$10"} instantly` },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3 mb-3 last:mb-0">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "white" }}>{step}</span>
              </div>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsView({ onBack, items = [], onMarkAllRead, onDeepLink, onRefresh }: {
  onBack: () => void;
  items?: typeof NOTIFICATIONS;
  onMarkAllRead?: () => void;
  onDeepLink?: (type: string, targetId: string) => void;
  onRefresh?: () => void;
}) {
  // Refresh on mount so the latest admin actions appear immediately
  useEffect(() => { onRefresh?.(); }, []);
  const iconMap = { match: <Heart size={15} />, message: <MessageCircle size={15} />, system: <Shield size={15} />, referral: <Gift size={15} /> };
  const colorMap: Record<string, string> = { match: "#0A6870", message: "#4A8DB8", system: "#6B9E78", referral: "#C5733F" };
  const labelMap: Record<string, string> = { match: "Matches", message: "Messages", system: "System", referral: "Referrals" };

  const hasUnread = items.some(n => !n.read);

  const markAllRead = () => {
    onMarkAllRead?.();
    toast.success("All notifications marked as read");
  };

  // Group by type
  const grouped = items.reduce<Record<string, typeof NOTIFICATIONS>>((acc, n) => {
    if (!acc[n.type]) acc[n.type] = [];
    acc[n.type].push(n);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={onBack} aria-label="Go back" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Notifications</h3>
        {hasUnread && (
          <button
            onClick={markAllRead}
            className="ml-auto text-primary hover:text-primary/80 transition-colors"
            style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
            Mark all read
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: (colorMap[type] ?? "#0A6870") + "20", color: colorMap[type] ?? "#0A6870" }}>
                {iconMap[type as keyof typeof iconMap] ?? <Bell size={11} />}
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: colorMap[type] ?? "#0A6870", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {labelMap[type] ?? type}
              </span>
              {items.some(n => !n.read) && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full" style={{ fontSize: "0.65rem", fontWeight: 800, background: colorMap[type] ?? "#0A6870", color: "white" }}>
                  {items.filter(n => !n.read).length}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {items.map(n => (
                <button key={n.id} onClick={() => onDeepLink?.(n.type, n.targetId ?? "")}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all hover:border-primary/30 hover:shadow-sm ${n.read ? "bg-card border-border" : "bg-secondary border-primary/20"}`}>
                  <div className="flex-1">
                    <p style={{ fontSize: "0.875rem", fontWeight: n.read ? 400 : 600 }}>{n.text}</p>
                    <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.75rem" }}>{n.time}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="bg-card rounded-3xl border border-border p-10 text-center mt-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bell size={26} className="text-primary" />
            </div>
            <p style={{ fontWeight: 700, fontSize: "1rem" }}>You're all caught up</p>
            <p className="text-muted-foreground mt-1.5" style={{ fontSize: "0.875rem" }}>New matches, messages and updates will show up here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN USER APP ────────────────────────────────────────
type UserPlan = "free" | "basic" | "premium";
const PLAN_KEY = "ma3moni_user_plan";

// ── Report user modal ─────────────────────────────────────
const REPORT_REASONS = [
  { value: "harassment",   label: "Harassment or threatening behaviour" },
  { value: "fake_profile", label: "Fake or misleading profile"          },
  { value: "inappropriate",label: "Inappropriate messages or content"   },
  { value: "scam",         label: "Scam or solicitation"                },
  { value: "spam",         label: "Spam or repetitive messages"         },
  { value: "other",        label: "Other"                               },
];

function ReportModal({ name, onConfirm, onCancel }: {
  name: string;
  matchId: string;
  onConfirm: (reason: string, category: string, details: string, evidence?: { type: string; content: string; time: string }[]) => void;
  onCancel: () => void;
}) {
  const [selected,  setSelected]  = useState("");
  const [details,   setDetails]   = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [images,    setImages]    = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  const canSubmit = !!selected;
  const MAX_IMAGES = 3;

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const remaining = MAX_IMAGES - images.length;
    const toProcess = files.slice(0, remaining);
    setUploading(true);
    const b64s = await Promise.all(toProcess.map(f => fileToBase64(f)));
    setImages(prev => [...prev, ...b64s].slice(0, MAX_IMAGES));
    setUploading(false);
  };

  const removeImage = (i: number) => setImages(prev => prev.filter((_, j) => j !== i));

  if (submitted) return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl border border-border w-full max-w-md shadow-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Check size={28} className="text-green-600" />
        </div>
        <p style={{ fontWeight: 800, fontSize: "1.125rem" }}>Report submitted</p>
        <p className="text-muted-foreground mt-2" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
          Thank you for helping keep Ma3moni safe. Our moderation team will review this within 24 hours.
        </p>
        <button onClick={onCancel} className="mt-6 w-full py-3.5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" style={{ fontWeight: 700 }}>
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-3xl border border-border w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <Flag size={18} className="text-red-500" />
              </div>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: "1.0625rem" }}>Report {name}</h3>
                <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Anonymous · reviewed within 24h</p>
              </div>
            </div>
            <button onClick={onCancel} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 space-y-2 pb-2">
          {/* Reason list */}
          {REPORT_REASONS.map(r => (
            <button
              key={r.value}
              onClick={() => setSelected(r.value)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all text-left ${
                selected === r.value ? "border-red-400 bg-red-50" : "border-border bg-card hover:border-red-200"
              }`}>
              <span style={{ fontSize: "0.875rem", fontWeight: selected === r.value ? 600 : 400, color: selected === r.value ? "#dc2626" : "var(--foreground)" }}>
                {r.label}
              </span>
              {selected === r.value && <Check size={15} className="text-red-500 flex-shrink-0" />}
            </button>
          ))}

          {/* Details + evidence — shown after reason picked */}
          {selected && (
            <div className="space-y-3 pt-1">
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={3}
                placeholder="Describe what happened — the more detail, the faster we can act…"
                className="w-full px-4 py-3 rounded-2xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                style={{ fontSize: "0.875rem" }}
              />

              {/* Evidence images */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Evidence photos</span>
                  <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Optional · {images.length}/{MAX_IMAGES}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {images.map((src, i) => (
                    <div key={i} className="relative group">
                      <img src={src} alt={`Evidence ${i + 1}`} className="w-20 h-20 rounded-xl object-cover border border-border" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {images.length < MAX_IMAGES && (
                    <button
                      onClick={() => imgRef.current?.click()}
                      disabled={uploading}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted flex flex-col items-center justify-center gap-1 hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50"
                      aria-label="Add evidence photo">
                      {uploading
                        ? <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
                        : <><ImagePlus size={18} className="text-muted-foreground" /><span className="text-muted-foreground" style={{ fontSize: "0.5625rem" }}>Add photo</span></>
                      }
                    </button>
                  )}
                </div>
                <input
                  ref={imgRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleImagePick}
                  aria-label="Upload evidence"
                />
                <p className="text-muted-foreground mt-1.5" style={{ fontSize: "0.6875rem" }}>
                  Screenshots of messages or inappropriate content help us act faster.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl border border-border hover:bg-muted transition-colors"
            style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
            Cancel
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => {
              const reason = REPORT_REASONS.find(r => r.value === selected)?.label ?? selected;
              const now    = new Date().toLocaleString();
              const evidence = images.map(img => ({ type: "image", content: img, time: now }));
              onConfirm(reason, selected, details, evidence.length ? evidence : undefined);
              setSubmitted(true);
            }}
            className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ fontSize: "0.9375rem", fontWeight: 700 }}>
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Block-with-reason modal ───────────────────────────────
const BLOCK_REASONS = [
  "Inappropriate messages",
  "Harassment or threats",
  "Fake or misleading profile",
  "Unsolicited or offensive content",
  "No longer interested",
  "Other",
];

function BlockModal({ name, onConfirm, onCancel }: {
  name: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");
  const reason = selected === "Other" ? custom.trim() : selected;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-3xl border border-border w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
              <UserX size={18} className="text-red-500" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: "1.0625rem" }}>Block {name}?</h3>
          </div>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
            They will be removed from your matches and cannot contact you. Please tell us why.
          </p>
        </div>
        <div className="px-6 space-y-2 pb-4">
          {BLOCK_REASONS.map(r => (
            <button key={r} onClick={() => setSelected(r)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all text-left ${selected === r ? "border-red-400 bg-red-50" : "border-border bg-card hover:border-red-200"}`}>
              <span style={{ fontSize: "0.9rem", fontWeight: selected === r ? 600 : 400, color: selected === r ? "#dc2626" : "var(--foreground)" }}>{r}</span>
              {selected === r && <Check size={15} className="text-red-500 flex-shrink-0" />}
            </button>
          ))}
          {selected === "Other" && (
            <textarea value={custom} onChange={e => setCustom(e.target.value)} rows={3}
              placeholder="Describe the reason…"
              className="w-full px-4 py-3 rounded-2xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-red-300 resize-none mt-1"
              style={{ fontSize: "0.9rem" }} autoFocus />
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onCancel} className="flex-1 py-3.5 rounded-2xl border border-border hover:bg-muted transition-colors" style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Cancel</button>
          <button onClick={() => reason && onConfirm(reason)} disabled={!reason}
            className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Block</button>
        </div>
      </div>
    </div>
  );
}

// ── Profile photo grid with real upload ──────────────────
const MAX_PHOTOS = 4;
const PHOTOS_KEY = "ma3moni_profile_photos";
const AVATAR_KEY = "ma3moni_avatar_photo";

// Convert a File to a base64 data-URL so it survives page reloads.
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Photos stored as simple {id, url} — no moderation status
interface StoredPhoto { id?: string; url: string; }

function ProfilePhotoGrid() {
  const djangoBase = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

  const [photos, setPhotos]       = useState<StoredPhoto[]>([]);
  const [loading, setLoading]     = useState(true);
  const [apiError, setApiError]   = useState<string | null>(null);
  const [brokenIdx, setBrokenIdx] = useState<Set<number>>(new Set());
  const inputRef                  = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox]   = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const resolveUrl = (raw: string) => fixMediaUrl(raw, djangoBase);

  const loadFromApi = async () => {
    setApiError(null);
    setBrokenIdx(new Set());
    try {
      const { auth: apiAuth } = await import("../../lib/api");
      const me = await apiAuth.me();
      const valid = me.photos
        .filter(ph => ph.image_url && ph.image_url.length > 0)
        .map(ph => ({ id: ph.id, url: resolveUrl(ph.image_url as string) }));
      setPhotos(valid);
      // Eagerly prefetch resolved URLs so images are in browser cache before render
      valid.forEach(ph => {
        const img = new Image();
        img.src = ph.url;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFromApi(); }, []);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    if (photos.length + files.length > MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed. Remove some first.`);
      return;
    }
    setUploading(true);
    const previews: StoredPhoto[] = await Promise.all(
      files.map(async f => ({ url: await fileToBase64(f) }))
    );
    setPhotos(prev => [...prev, ...previews].slice(0, MAX_PHOTOS));
    try {
      const { auth: apiAuth } = await import("../../lib/api");
      for (const file of files) {
        await apiAuth.uploadPhoto(file);
      }
      await loadFromApi();
      toast.success(`${files.length} photo${files.length > 1 ? "s" : ""} saved to your profile.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? (err as Error & { message: string }).message : "Upload failed. Please try again.";
      toast.error(msg);
      await loadFromApi();
    } finally {
      setUploading(false);
    }
  };

  const remove = async (i: number) => {
    const photo = photos[i];
    setPhotos(prev => prev.filter((_, j) => j !== i));
    if (photo.id) {
      try {
        const { auth: apiAuth } = await import("../../lib/api");
        await apiAuth.deletePhoto(photo.id);
      } catch {
        await loadFromApi();
        return;
      }
    }
    await loadFromApi();
  };

  return (
    <div className="px-4 mt-5">
      {lightbox && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Preview" className="max-w-full max-h-[88vh] rounded-2xl object-contain" />
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" aria-label="Close"><X size={20} className="text-white" /></button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleFiles} aria-label="Upload photos" />
      <div className="flex items-center justify-between mb-3">
        <h3 style={{ fontWeight: 700, fontSize: "0.875rem" }}>My Photos</h3>
        <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{photos.length} / {MAX_PHOTOS}</span>
      </div>
      {apiError && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertCircle size={14} className="text-destructive flex-shrink-0" />
          <span className="text-destructive flex-1" style={{ fontSize: "0.75rem" }}>Could not load photos: {apiError}</span>
          <button onClick={loadFromApi} className="text-destructive underline flex-shrink-0" style={{ fontSize: "0.75rem" }}>Retry</button>
        </div>
      )}
      {loading ? (
        <div className="flex gap-2">
          {[0, 1].map(i => (
            <div key={i} className="w-20 h-20 rounded-xl bg-muted animate-pulse flex-shrink-0" />
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {photos.filter(ph => ph.url).map((ph, i) => (
            <div key={ph.id ?? i} className="relative flex-shrink-0 group">
              <button onClick={() => !brokenIdx.has(i) && setLightbox(ph.url)}
                className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/40 block relative bg-muted"
                title={ph.url}>
                {brokenIdx.has(i) ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
                    <AlertCircle size={14} className="text-destructive" />
                    <span className="text-destructive text-center px-1" style={{ fontSize: "0.5rem" }}>Load error</span>
                  </div>
                ) : (
                  <img src={ph.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                    onError={() => setBrokenIdx(prev => new Set([...prev, i]))} />
                )}
              </button>
              {i === 0 && (
                <span className="absolute -top-1.5 left-0 right-0 flex justify-center">
                  <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground" style={{ fontSize: "0.5rem", fontWeight: 800 }}>MAIN</span>
                </span>
              )}
              <button onClick={() => remove(i)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove photo">
                <X size={11} />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button onClick={() => inputRef.current?.click()} disabled={uploading}
              className="flex-shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 bg-muted border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 focus:outline-none disabled:opacity-60 transition-colors"
              aria-label="Add photo">
              {uploading
                ? <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                : <><Camera size={18} className="text-muted-foreground" /><span className="text-muted-foreground" style={{ fontSize: "0.625rem" }}>Add</span></>
              }
            </button>
          )}
        </div>
      )}
      {!loading && photos.length === 0 && !apiError && (
        <p className="text-muted-foreground mt-2" style={{ fontSize: "0.75rem" }}>Tap + to upload up to {MAX_PHOTOS} photos.</p>
      )}
      <PhotoDebugPanel />
    </div>
  );
}

type PhotoDebugData = {
  USE_CLOUDINARY: boolean;
  CLOUDINARY_STORAGE_cloud: string;
  cloudinary_sdk_cloud: string;
  MEDIA_URL: string;
  photos: Array<{
    id: string;
    image_name: string | null;
    build_media_url: string | null;
    cloudinary: { exists: boolean; secure_url?: string; format?: string; error?: string; public_id?: string } | null;
  }>;
  cloudinary_folder_listing: Array<{ public_id: string; secure_url: string; format: string }> | { error: string };
};

function PhotoDebugPanel() {
  const [open, setOpen]         = useState(false);
  const [data, setData]         = useState<PhotoDebugData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [fixing, setFixing]     = useState(false);
  const [fixResult, setFixResult] = useState<string | null>(null);
  const [err, setErr]           = useState<string | null>(null);

  const run = async () => {
    setLoading(true); setErr(null); setFixResult(null);
    try {
      const { auth: apiAuth } = await import("../../lib/api");
      setData(await apiAuth.photoDebug());
      setOpen(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const fixUrls = async () => {
    setFixing(true); setFixResult(null);
    try {
      const { auth: apiAuth } = await import("../../lib/api");
      const res = await apiAuth.fixPhotoUrls();
      setFixResult(`Fixed ${res.fixed.length} photo(s). Failed: ${res.failed.length}. Refresh the page to see updated photos.`);
      await run();
    } catch (e: unknown) {
      setFixResult(`Fix failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="mt-3">
      <button onClick={run} disabled={loading}
        className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        style={{ fontSize: "0.7rem" }}>
        <Search size={11} /> {loading ? "Checking…" : "Diagnose photo issue"}
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-xl border border-border bg-muted/60 text-left" style={{ fontSize: "0.7rem" }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontWeight: 700 }}>Photo Diagnostics</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground"><X size={12} /></button>
          </div>
          {err && <p className="text-destructive break-all">Error: {err}</p>}
          {fixResult && <p className="text-primary break-all mb-2">{fixResult}</p>}
          {data && (
            <div className="space-y-1">
              <p>
                <span className="text-muted-foreground">USE_CLOUDINARY: </span>
                <span className={data.USE_CLOUDINARY ? "text-green-600" : "text-destructive"}>{String(data.USE_CLOUDINARY)}</span>
              </p>
              <p><span className="text-muted-foreground">Cloud: </span>{data.CLOUDINARY_STORAGE_cloud}</p>
              <p style={{ fontWeight: 600 }} className="mt-1">Photos ({data.photos.length}):</p>
              {data.photos.map(ph => (
                <div key={ph.id} className="pl-2 border-l-2 border-border space-y-0.5 mb-1">
                  <p className="break-all" style={{ color: ph.build_media_url ? "inherit" : "var(--destructive)" }}>
                    url: {ph.build_media_url ?? "null"}
                  </p>
                  {ph.cloudinary && (
                    <p className={ph.cloudinary.exists ? "text-green-600" : "text-destructive"}>
                      cloudinary: {ph.cloudinary.exists
                        ? `✓ exists (.${ph.cloudinary.format})`
                        : `✗ NOT FOUND — ${ph.cloudinary.error ?? "404"}`}
                    </p>
                  )}
                  {ph.cloudinary?.exists && ph.cloudinary.secure_url && (
                    <p className="break-all text-green-600">real url: {ph.cloudinary.secure_url}</p>
                  )}
                </div>
              ))}
              {data.photos.some(ph => ph.cloudinary?.exists) && (
                <button onClick={fixUrls} disabled={fixing}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground w-full"
                  style={{ fontSize: "0.7rem", fontWeight: 600 }}>
                  {fixing ? "Fixing…" : "Fix All Photo URLs"}
                </button>
              )}
              <p style={{ fontWeight: 600 }} className="mt-2">
                Cloudinary folder ({Array.isArray(data.cloudinary_folder_listing)
                  ? data.cloudinary_folder_listing.length
                  : "err"} files):
              </p>
              {Array.isArray(data.cloudinary_folder_listing) ? (
                data.cloudinary_folder_listing.length === 0
                  ? <p className="text-destructive pl-2">Empty — uploads are NOT reaching Cloudinary.</p>
                  : data.cloudinary_folder_listing.map(r => (
                    <div key={r.public_id} className="pl-2 border-l-2 border-green-600/40 space-y-0.5 mb-1">
                      <p className="break-all text-green-700">id: {r.public_id}</p>
                      <p className="break-all text-muted-foreground">url: {r.secure_url}</p>
                    </div>
                  ))
              ) : (
                <p className="text-destructive pl-2">Listing error: {(data.cloudinary_folder_listing as { error: string }).error}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Personal Info edit (controlled + persisted) ───────────
function PersonalInfoEdit({ onBack, profileData, onSaved }: { onBack: () => void; profileData: Record<string, unknown> | null; onSaved?: () => void }) {
  const pf = profileData ?? {};
  const fullName = (pf.fullName as string) ?? "";
  const parts = fullName.trim().split(" ");
  const [form, setForm] = useState({
    firstName: parts[0] ?? "",
    lastName:  parts.slice(1).join(" ") ?? "",
    gender:    (pf.gender    as string) ?? "",
    dob:       (pf.dob       as string) ?? "",
    city:      (pf.city      as string) ?? "",
    country:   (pf.country   as string) ?? "",
    bio:       (pf.bio       as string) ?? "",
    phone:     (pf.phone     as string) ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(() => {
    try { return localStorage.getItem("ma3moni_phone_verified") === "true"; } catch { return false; }
  });
  // Phone OTP flow states
  const [phoneOtpStep, setPhoneOtpStep] = useState<"idle" | "sending" | "verifying" | "done">("idle");
  const [phoneOtpDigits, setPhoneOtpDigits] = useState(["", "", "", "", "", ""]);
  const [phoneOtpError, setPhoneOtpError] = useState("");
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const u = <K extends keyof typeof form>(k: K, v: string) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    try {
      const raw = localStorage.getItem("ma3moni_onboarding_progress");
      const existing = raw ? (JSON.parse(raw) as { form: Record<string, unknown> }).form : {};
      // Only update the editable fields — name and gender are locked
      localStorage.setItem("ma3moni_onboarding_progress", JSON.stringify({
        step: 8,
        form: { ...existing, dob: form.dob, city: form.city, country: form.country, bio: form.bio, phone: form.phone },
      }));
    } catch {}
    // Persist editable fields to backend — name/gender remain as-is
    try {
      const { auth: apiAuth } = await import("../../lib/api");
      const patch: Record<string, unknown> = {
        location_city:    form.city.trim() || undefined,
        location_country: form.country.trim() || undefined,
        bio:              form.bio.trim() || undefined,
      };
      if (form.dob) patch.date_of_birth = form.dob;
      apiAuth.updateProfile(patch as never).catch(() => {});
    } catch {}
    setSaved(true);
    toast.success("Personal info saved");
    setTimeout(() => { setSaved(false); onSaved ? onSaved() : onBack(); }, 900);
  };

  const sendPhoneOtp = async () => {
    if (!form.phone.trim()) { toast.error("Enter your phone number first."); return; }
    setPhoneOtpStep("sending");
    setPhoneOtpError("");
    setPhoneOtpDigits(["", "", "", "", "", ""]);
    try {
      const { auth: apiAuth } = await import("../../lib/api");
      await apiAuth.sendOtp(form.phone.trim());
      setPhoneOtpStep("verifying");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setPhoneOtpStep("idle");
      toast.error("Could not send OTP. Check the number and try again.");
    }
  };

  const verifyPhoneOtp = async () => {
    const code = phoneOtpDigits.join("");
    if (code.length !== 6) { setPhoneOtpError("Enter all 6 digits."); return; }
    setPhoneOtpStep("sending");
    setPhoneOtpError("");
    try {
      const { auth: apiAuth } = await import("../../lib/api");
      await apiAuth.verifyOtp(form.phone.trim(), code);
      setPhoneVerified(true);
      try { localStorage.setItem("ma3moni_phone_verified", "true"); } catch {}
      setPhoneOtpStep("done");
      toast.success("Phone number verified! +5% to your compatibility score.");
    } catch {
      setPhoneOtpStep("verifying");
      setPhoneOtpError("Invalid or expired code. Try again.");
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";
  const labelCls = "block mb-1.5 text-foreground";

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Sticky header with Save */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <button onClick={onBack} aria-label="Go back" className="p-1 text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft size={22} /></button>
        <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Personal Info</h3>
        <button onClick={save} disabled={saved}
          className={`px-4 py-1.5 rounded-lg transition-all ${saved ? "bg-green-50 text-green-700 border border-green-200" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
          style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
          {saved ? <span className="flex items-center gap-1"><Check size={12} />Saved</span> : "Save"}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* ── Locked fields notice ─────────────────────────────── */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-2.5">
          <Lock size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#92400e" }}>Name, gender &amp; email are locked</p>
            <p className="text-amber-700 mt-0.5" style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>
              These cannot be changed to keep Ma3moni safe and trustworthy. To request a correction,{" "}
              <a href="mailto:support@ma3moni.com" className="underline font-semibold">contact our team</a>.
            </p>
          </div>
        </div>

        {/* Name — read-only */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              First Name <span className="text-muted-foreground" style={{ fontSize: "0.7rem", fontWeight: 400 }}>(locked)</span>
            </label>
            <div className={`${inputCls} bg-muted/50 cursor-not-allowed select-none flex items-center`} style={{ fontSize: "0.9375rem", color: "var(--muted-foreground)" }}>
              {form.firstName || <span className="opacity-50">—</span>}
            </div>
          </div>
          <div>
            <label className={labelCls} style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              Last Name <span className="text-muted-foreground" style={{ fontSize: "0.7rem", fontWeight: 400 }}>(locked)</span>
            </label>
            <div className={`${inputCls} bg-muted/50 cursor-not-allowed select-none flex items-center`} style={{ fontSize: "0.9375rem", color: "var(--muted-foreground)" }}>
              {form.lastName || <span className="opacity-50">—</span>}
            </div>
          </div>
        </div>

        {/* Gender — read-only */}
        <div>
          <label className={labelCls} style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
            Gender <span className="text-muted-foreground" style={{ fontSize: "0.7rem", fontWeight: 400 }}>(locked)</span>
          </label>
          <div className="grid grid-cols-2 gap-3 opacity-60 pointer-events-none select-none">
            {[
              { value: "male",   label: "Male",   icon: "♂" },
              { value: "female", label: "Female", icon: "♀" },
            ].map(g => (
              <div
                key={g.value}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 ${
                  form.gender === g.value
                    ? "border-primary bg-primary/8 text-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}>
                <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{g.icon}</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: form.gender === g.value ? 700 : 400 }}>{g.label}</span>
                {form.gender === g.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
            ))}
          </div>
        </div>

        {/* Email — read-only (locked) */}
        <div>
          <label className={labelCls} style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
            Email <span className="text-muted-foreground" style={{ fontSize: "0.7rem", fontWeight: 400 }}>(locked)</span>
          </label>
          <div className={`${inputCls} bg-muted/50 cursor-not-allowed select-none flex items-center gap-2`} style={{ fontSize: "0.9375rem", color: "var(--muted-foreground)" }}>
            <Mail size={14} className="flex-shrink-0 opacity-50" />
            {(() => { try { return localStorage.getItem("ma3moni_login_email") || "—"; } catch { return "—"; } })()}
          </div>
        </div>

        <div>
          <label className={labelCls} style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Date of Birth</label>
          <input type="date" value={form.dob} onChange={e => u("dob", e.target.value)} className={inputCls} style={{ fontSize: "0.9375rem" }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={{ fontSize: "0.8125rem", fontWeight: 600 }}>City</label>
            <input value={form.city} onChange={e => u("city", e.target.value)} placeholder="City" className={inputCls} style={{ fontSize: "0.9375rem" }} />
          </div>
          <div>
            <label className={labelCls} style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Country</label>
            <input value={form.country} onChange={e => u("country", e.target.value)} placeholder="Country" className={inputCls} style={{ fontSize: "0.9375rem" }} />
          </div>
        </div>
        <div>
          <label className={labelCls} style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Bio</label>
          <textarea value={form.bio} onChange={e => u("bio", e.target.value)} rows={4}
            placeholder="A short introduction about yourself — what you value, what you're looking for…"
            className={`${inputCls} resize-none`} style={{ fontSize: "0.9375rem" }} />
        </div>

        {/* ── Phone number + OTP verification ─────────── */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-foreground" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Phone Number</label>
            <div className="flex items-center gap-1.5">
              {phoneVerified || phoneOtpStep === "done"
                ? <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200" style={{ fontSize: "0.7rem", fontWeight: 700, color: "#065f46" }}><CheckCircle size={11} className="text-green-600" /> Verified</span>
                : <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: "0.7rem" }}><Lock size={10} /> Private</span>
              }
            </div>
          </div>
          <p className="text-muted-foreground mb-3" style={{ fontSize: "0.75rem" }}>Only visible to you and admins. Verifying adds +5% to your compatibility score.</p>

          <div className="flex gap-2">
            <input
              type="tel"
              value={form.phone}
              onChange={e => { u("phone", e.target.value); setPhoneOtpStep("idle"); setPhoneVerified(false); }}
              placeholder="+234 800 000 0000"
              className={`${inputCls} flex-1`}
              style={{ fontSize: "0.9375rem" }}
            />
            {!phoneVerified && phoneOtpStep !== "done" && (
              <button
                type="button"
                onClick={phoneOtpStep === "idle" ? sendPhoneOtp : undefined}
                disabled={phoneOtpStep === "sending" || !form.phone.trim()}
                className="flex-shrink-0 px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-50 transition-all"
                style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                {phoneOtpStep === "sending" ? <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /> : "Verify"}
              </button>
            )}
          </div>

          {/* OTP digit input */}
          {phoneOtpStep === "verifying" && (
            <div className="mt-4">
              <p className="text-muted-foreground mb-3" style={{ fontSize: "0.8125rem" }}>
                Enter the 6-digit code sent to <strong>{form.phone}</strong>
              </p>
              <div className="flex gap-2 justify-center mb-3">
                {phoneOtpDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "");
                      const next = [...phoneOtpDigits];
                      next[i] = val.slice(-1);
                      setPhoneOtpDigits(next);
                      setPhoneOtpError("");
                      if (val && i < 5) otpRefs.current[i + 1]?.focus();
                    }}
                    onKeyDown={e => {
                      if (e.key === "Backspace" && !d && i > 0) otpRefs.current[i - 1]?.focus();
                    }}
                    onPaste={e => {
                      const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                      if (text.length === 6) { setPhoneOtpDigits(text.split("")); otpRefs.current[5]?.focus(); }
                    }}
                    className="w-10 h-11 text-center rounded-xl border-2 border-border bg-input-background focus:outline-none focus:border-primary transition-all"
                    style={{ fontSize: "1.25rem", fontWeight: 700, borderColor: d ? "var(--primary)" : undefined }}
                  />
                ))}
              </div>
              {phoneOtpError && (
                <p className="text-destructive mb-2 text-center" style={{ fontSize: "0.75rem" }}>{phoneOtpError}</p>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setPhoneOtpStep("idle")}
                  className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors"
                  style={{ fontSize: "0.875rem" }}>Cancel</button>
                <button type="button" onClick={verifyPhoneOtp}
                  disabled={phoneOtpDigits.join("").length !== 6}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  style={{ fontSize: "0.875rem", fontWeight: 700 }}>Confirm</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function UserApp({ onSignOut }: UserAppProps) {
  const [tab, setTab] = useState<Tab>("home");
  const [subView, setSubView] = useState<SubView>("none");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [blogFrom, setBlogFrom] = useState<"none" | "blog-list">("none");
  const [userPlan, setUserPlan] = useState<UserPlan>(() =>
    (localStorage.getItem(PLAN_KEY) as UserPlan | null) ?? "free"
  );
  // ── Live API data (falls back to mock when offline) ─────────
  // Seed mock data with the correct gender from the start
  const _initGender = (() => { try { const r = localStorage.getItem("ma3moni_onboarding_progress"); return r ? (JSON.parse(r) as { form: Record<string,string> }).form?.gender ?? "" : ""; } catch { return ""; } })();
  const _initMocks  = genderAwareMocks(_initGender);

  const [liveMatches,       setLiveMatches]       = useState<MatchItem[]>([]);
  const [liveConversations, setLiveConversations] = useState<ConvItem[]>([]);
  const [liveInterests,     setLiveInterests]     = useState<InterestItem[]>([]);


  const [blocked, setBlocked] = useState<string[]>([]);
  const [foundPartner, setFoundPartner] = useState(() => {
    try { return localStorage.getItem("ma3moni_found_partner") === "true"; } catch { return false; }
  });
  const [sentInterests, setSentInterests] = useState<string[]>([]);

  const chattingPartnerIds = useMemo(
    () => new Set(liveConversations.map(c => c.partnerId)),
    [liveConversations]
  );

  const [blockModal, setBlockModal] = useState<{ matchId: string; name: string } | null>(null);
  const [reportModal, setReportModal] = useState<{ matchId: string; name: string } | null>(null);

  // ── Hydrate localStorage profile from backend on mount ──────
  // Runs once on mount. Fetches /me/ and merges backend profile fields into
  // the localStorage key so data survives logout/device changes.
  useEffect(() => {
    import("../../lib/api").then(({ auth }) => {
      auth.me().then(me => {
        const p = me.profile;
        if (!p) return;
        const PROFILE_KEY = "ma3moni_onboarding_progress";
        try {
          const raw = localStorage.getItem(PROFILE_KEY);
          const existing: Record<string, unknown> = raw
            ? (JSON.parse(raw) as { form?: Record<string, unknown> }).form ?? {}
            : {};
          // Map backend fields → frontend localStorage keys (only overwrite if empty)
          const hydrated: Record<string, unknown> = { ...existing };
          const set = (k: string, v: unknown) => { if (!hydrated[k] && v) hydrated[k] = v; };
          set("fullName",        p.full_name);
          set("gender",          p.gender);
          set("dob",             p.date_of_birth);
          set("nationality",     p.nationality);
          set("ethnicity",       p.ethnicity);
          set("city",            p.location_city);
          set("country",         p.location_country);
          set("bio",             p.bio);
          set("education",       p.education);
          set("profession",      p.profession);
          set("bloodGroup",      p.blood_group);
          set("genotype",        p.genotype);
          set("marriageTimeline",(p as Record<string,unknown>).marriage_timeline);
          set("wantsChildren",   (p as Record<string,unknown>).children_preference);
          set("careerAmbition",  (p as Record<string,unknown>).career_ambition_level);
          set("communicationStyle", (p as Record<string,unknown>).communication_style);
          set("phone",              me.phone);
          if (Array.isArray(p.personality_traits) && p.personality_traits.length && !hydrated.personality)
            hydrated.personality = p.personality_traits;
          if (Array.isArray((p as Record<string,unknown>).interests) && ((p as Record<string,unknown>).interests as unknown[]).length && !hydrated.goals)
            hydrated.goals = (p as Record<string,unknown>).interests;
          if (p.pref_age_min && !hydrated.prefAgeMin) hydrated.prefAgeMin = p.pref_age_min;
          if (p.pref_age_max && !hydrated.prefAgeMax) hydrated.prefAgeMax = p.pref_age_max;
          localStorage.setItem(PROFILE_KEY, JSON.stringify({ step: 8, form: hydrated }));
          setProfileVersion(v => v + 1);
        } catch {}
      }).catch(() => {});
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Immediate plan sync on mount — don't wait for 30s poll ──
  useEffect(() => {
    import("../../lib/api").then(({ auth }) => {
      auth.me().then(me => {
        if (me.plan && me.plan !== (localStorage.getItem(PLAN_KEY) ?? "free")) {
          setUserPlan(me.plan as UserPlan);
          try { localStorage.setItem(PLAN_KEY, me.plan); } catch {}
        }
      }).catch(() => {});
    });
  }, []);

  // ── Bootstrap: fetch live data on mount ──────────────────────
  useEffect(() => {
    matchesApi.discover().then(res => {
      setLiveMatches(res.results.map(mapApiMatch));
    }).catch(() => {});

    messagingApi.list().then(res => {
      setLiveConversations(res.results.map(mapApiConversation));
    }).catch(() => {});

    matchesApi.receivedInterests().then(res => {
      setLiveInterests(res.results.map(r => ({
        id: r.id, matchId: r.sender.id, name: r.sender.full_name,
        score: r.sender.compatibility_score, photo: r.sender.photos[0]?.image_url ?? "",
      })));
    }).catch(() => {});

    matchesApi.sentInterests().then(res => { setSentInterests(res.results.map(r => r.receiver.id)); }).catch(() => {});
    moderationApi.blocks().then(res => { setBlocked(res.results.map(b => b.blocked.id)); }).catch(() => {});
    notifsApi.list().then(res => { if (res.results.length) setNotifItems(res.results.map(mapApiNotif)); }).catch(() => {});
  }, []);

  // ── Actions wired to API ──────────────────────────────────────
  const submitReport = useCallback(async (
    matchId: string, _name: string, _reason: string,
    category: string, details: string,
    evidence?: { type: string; content: string; time: string }[],
  ) => {
    try {
      await moderationApi.reportUser(
        matchId,
        category as import("../../lib/api").ReportCategory,
        details,
        evidence,
      );
    } catch {
      // Fail silently — user sees success regardless
    }
    toast.success("Report submitted — our team will review it within 24 hours.");
    setReportModal(null);
  }, []);

  const blockMatch = useCallback(async (matchId: string, reason?: string) => {
    setBlocked(prev => [...prev, matchId]);
    setBlockModal(null);
    toast.success(`Profile blocked.${reason ? ` Reason: ${reason}` : ""}`);
    try { await moderationApi.blockUser(matchId, reason ?? ""); } catch {}
  }, []);

  const showInterest = useCallback(async (matchId: string, name: string) => {
    setSentInterests(prev => [...prev, matchId]);
    toast.success(`Interest sent to ${name}! They'll be notified.`);
    try { await matchesApi.sendInterest(matchId); } catch {}
  }, []);

  // #7 — lifted so bell badge + NotificationsView share the same state
  const [notifItems, setNotifItems] = useState<NotifItem[]>([]);
  const unreadNotifs = useMemo(() => notifItems.filter(n => !n.read).length, [notifItems]);

  // ── In-app notification sound via Web Audio API ───────────────
  // Plays a short two-tone chime when a push message is forwarded from the SW
  // or when new unread notifications arrive. Requires a user gesture first
  // (browser policy), so we only attempt after the first user interaction.
  const playNotifSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      gain.connect(ctx.destination);
      [880, 1046].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        osc.connect(gain);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + 0.6);
      });
    } catch {}
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "PUSH_RECEIVED") playNotifSound();
    };
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, [playNotifSound]);

  // Sync from Django every 30s — picks up admin plan grants
  useEffect(() => {
    const sync = async () => {
      // Always restore USER token first so admin logins don't contaminate these calls
      restoreUserToken();

      // 1. Sync plan from /me/ — most reliable source of truth
      try {
        const { auth } = await import("../../lib/api");
        const me = await auth.me();
        if (me.plan) {
          const stored = localStorage.getItem(PLAN_KEY) ?? "free";
          if (me.plan !== stored) {
            setUserPlan(me.plan as UserPlan);
            try { localStorage.setItem(PLAN_KEY, me.plan); } catch {}
          }
        }
      } catch { /* offline */ }

      // 2. Sync notifications
      try {
        const res = await notifsApi.list();
        setNotifItems(res.results.map(mapApiNotif));
        // Also check for subscription notification as fallback plan source
        const subNotif = res.results.find(n =>
          n.type === "subscription" &&
          (n.title.includes("Activated") || n.title.includes("🎉"))
        );
        if (subNotif?.data?.plan) {
          const p = subNotif.data.plan as UserPlan;
          setUserPlan(p);
          try { localStorage.setItem(PLAN_KEY, p); } catch {}
        }
      } catch { /* offline */ }
    };

    sync(); // run immediately on mount
    const id = setInterval(sync, 30_000);
    return () => clearInterval(id);
  }, []);

  // Friendly name per demo account — shown when no onboarding data exists yet.
  const DEMO_NAMES: Record<string, string> = {
    "free-user@ma3moni.com":    "Yusuf (Free)",
    "basic-user@ma3moni.com":   "Khalid (Basic)",
    "premium-user@ma3moni.com": "Omar (Premium)",
    "yusuf@example.com":        "Yusuf",
    "demo@ma3moni.com":         "Demo User",
  };

  // Derive display name + profile strength from onboarding localStorage.
  // Falls back to the logged-in email's demo name so each account shows
  // a distinct, plan-appropriate label instead of the hardcoded "Yusuf".
  // Increment this whenever a profile section saves so profileData re-reads
  // from localStorage and profileStrength recomputes immediately.
  const [profileVersion, setProfileVersion] = useState(0);

  // Declared here (after profileVersion) to avoid temporal dead zone error
  // Photo moderation removed — photos save directly, no gate on messaging

  const profileData = useMemo(() => {
    try {
      const raw = localStorage.getItem("ma3moni_onboarding_progress");
      if (raw) return (JSON.parse(raw) as { form: Record<string, unknown> }).form;
    } catch {}
    return null;
  }, [profileVersion]); // re-runs every time a section saves

  const loginEmail  = (() => { try { return localStorage.getItem("ma3moni_login_email") ?? ""; } catch { return ""; } })();
  const displayName = (profileData?.fullName as string) || DEMO_NAMES[loginEmail] || loginEmail.split("@")[0] || "Member";
  const firstName   = displayName.split(" ")[0].replace(/\s*\(.*\)/, ""); // strip plan suffix for greeting
  // Comprehensive field checklist — each item has a label (shown in suggestions)
  // and a check function that returns true when that item is complete.
  const PROFILE_FIELDS: { key: string; label: string; section: SubView; check: (p: Record<string, unknown>) => boolean }[] = [
    { key: "fullName",        label: "Add your full name",              section: "edit-profile",     check: p => !!(p.fullName as string)?.trim() },
    { key: "gender",          label: "Set your gender",                 section: "edit-profile",     check: p => p.gender === "male" || p.gender === "female" },
    { key: "age",             label: "Add your date of birth",          section: "edit-profile",     check: p => !!p.age || !!p.dob },
    { key: "city",            label: "Add your city & country",         section: "edit-profile",     check: p => !!(p.city as string)?.trim() && !!(p.country as string)?.trim() },
    { key: "bio",             label: "Write a short bio",               section: "edit-profile",     check: p => !!(p.bio as string)?.trim() },
    { key: "profession",      label: "Add career & education",          section: "career-education", check: p => !!(p.profession as string)?.trim() },
    { key: "education",       label: "Add your education level",        section: "career-education", check: p => !!p.education },
    { key: "religiosity",     label: "Set your religiosity level",      section: "values-lifestyle", check: p => !!p.religiosity },
    { key: "lifestyle",       label: "Add lifestyle tags",              section: "values-lifestyle", check: p => Array.isArray(p.lifestyle) && (p.lifestyle as unknown[]).length > 0 },
    { key: "personality",     label: "Add personality traits",          section: "values-lifestyle", check: p => Array.isArray(p.personality) && (p.personality as unknown[]).length > 0 },
    { key: "marriageTimeline",label: "Set your marriage timeline",      section: "life-goals",       check: p => !!p.marriageTimeline },
    { key: "wantsChildren",   label: "Set your children preference",    section: "life-goals",       check: p => !!p.wantsChildren },
    { key: "goals",           label: "Add your life goals",             section: "life-goals",       check: p => Array.isArray(p.goals) && (p.goals as unknown[]).length > 0 },
    // Avatar photo — checked against localStorage directly (not stored in onboarding form)
    { key: "avatar",          label: "Upload a profile photo",          section: "photos",            check: () => !!(() => { try { return localStorage.getItem(AVATAR_KEY); } catch { return null; } })() },
  ];

  const profileStrength = useMemo(() => {
    if (!profileData) return 0;
    const filled = PROFILE_FIELDS.filter(f => f.check(profileData)).length;
    return Math.round((filled / PROFILE_FIELDS.length) * 100);
  }, [profileData]);

  const incompleteFields = useMemo(() => {
    if (!profileData) return PROFILE_FIELDS;
    return PROFILE_FIELDS.filter(f => !f.check(profileData));
  }, [profileData]);

  const upgradePlan = async (plan: UserPlan) => {
    try {
      const res = await subsApi.create(plan, "monthly");
      if (res.checkout_url) {
        // Store pending plan so we can activate it after Credo redirect
        localStorage.setItem("ma3moni_pending_plan",      plan);
        localStorage.setItem("ma3moni_pending_reference", res.reference ?? "");
        window.location.href = res.checkout_url;
        return;
      }
      // Dev mode — no Credo configured, plan activated directly
      if (res.plan) {
        setUserPlan(res.plan as UserPlan);
        localStorage.setItem(PLAN_KEY, res.plan);
        toast.success(`You're now on the ${res.plan} plan!`);
        return;
      }
    } catch { toast.error("Payment gateway unavailable. Please try again."); }
    setUserPlan(plan);
    localStorage.setItem(PLAN_KEY, plan);
  };

  // Handle Credo redirect back — verify payment and activate plan
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") !== "1") return;
    const reference   = params.get("ref") ?? localStorage.getItem("ma3moni_pending_reference") ?? "";
    const pendingPlan = (localStorage.getItem("ma3moni_pending_plan") ?? "basic") as UserPlan;
    if (!reference) return;
    // Clean URL
    window.history.replaceState({}, "", window.location.pathname);
    subsApi.verify(reference, pendingPlan).then(res => {
      if (res.status === "success") {
        const plan = (res.plan ?? pendingPlan) as UserPlan;
        setUserPlan(plan);
        localStorage.setItem(PLAN_KEY, plan);
        localStorage.removeItem("ma3moni_pending_plan");
        localStorage.removeItem("ma3moni_pending_reference");
        toast.success(`🎉 Payment confirmed! You're now on the ${plan} plan.`);
      } else {
        toast.error("Payment could not be verified. Contact support if charged.");
      }
    }).catch(() => {
      // Optimistic fallback — trust Credo redirect with subscribed=1
      setUserPlan(pendingPlan);
      localStorage.setItem(PLAN_KEY, pendingPlan);
      localStorage.removeItem("ma3moni_pending_plan");
      localStorage.removeItem("ma3moni_pending_reference");
      toast.success(`You're now on the ${pendingPlan} plan!`);
    });
  }, []);

  const openChat = (id: string) => {
    setActiveChatId(id);
    setSubView("chat");
  };

  const openMatch = (id: string) => {
    setActiveMatchId(id);
    setSubView("match-detail");
  };

  // Open an article; remember where it was opened from so "back" returns there.
  const openArticle = (id: string, from: "none" | "blog-list") => {
    setActiveArticleId(id);
    setBlogFrom(from);
    setSubView("blog-detail");
  };

  const goBack = () => {
    setSubView("none");
    setActiveChatId(null);
    setActiveMatchId(null);
    setActiveArticleId(null);
    setBlogFrom("none");
  };

  const navItems: { key: Tab; icon: ReactNode; label: string }[] = [
    { key: "home", icon: <Home size={20} />, label: "Home" },
    { key: "matches", icon: <Heart size={20} />, label: "Matches" },
    { key: "messages", icon: <MessageCircle size={20} />, label: "Messages" },
    { key: "profile", icon: <User size={20} />, label: "Profile" },
  ];

  const totalUnread = liveConversations.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="size-full flex items-center justify-center bg-muted/50">
      <div className="w-full h-full max-w-[430px] bg-background flex flex-col overflow-hidden shadow-2xl">
        {/* Header (hidden during sub-views) */}
        {subView === "none" && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Heart size={13} className="text-primary-foreground fill-primary-foreground" />
              </div>
              <span className="logo-font" style={{ fontWeight: 800, fontSize: "1.0625rem" }}>Ma3moni</span>
              {userPlan !== "free" && (
                <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", background: userPlan === "premium" ? "#C5733F" : "#4A8DB8", color: "white" }}>
                  {userPlan}
                </span>
              )}
            </div>
            <button onClick={() => setSubView("notifications")} aria-label={`Notifications${unreadNotifs > 0 ? `, ${unreadNotifs} unread` : ""}`} className="relative p-2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg transition-colors">
              <Bell size={20} />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                  <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "white" }}>{unreadNotifs}</span>
                </span>
              )}
            </button>
          </div>
        )}

        {/* Global block-with-reason modal */}
        {blockModal && (
          <BlockModal
            name={blockModal.name}
            onConfirm={(reason) => { blockMatch(blockModal.matchId, reason); goBack(); }}
            onCancel={() => setBlockModal(null)}
          />
        )}

        {reportModal && (
          <ReportModal
            name={reportModal.name}
            matchId={reportModal.matchId}
            onConfirm={(reason, category, details, evidence) => submitReport(reportModal.matchId, reportModal.name, reason, category, details, evidence)}
            onCancel={() => setReportModal(null)}
          />
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          {subView === "none" && (
            <div className="size-full overflow-y-auto">
              {tab === "home"     && <HomeTab onOpenMatch={openMatch} onOpenChat={openChat} onOpenNotif={() => setSubView("notifications")} setSubView={setSubView} setTab={setTab} onOpenArticle={(id) => openArticle(id, "none")} onOpenGuidance={() => setSubView("blog-list")} displayName={displayName} firstName={firstName} profileStrength={profileStrength} profileData={profileData} plan={userPlan} incompleteFields={incompleteFields} foundPartner={foundPartner} conversations={liveConversations} matchesList={liveMatches} />}
              {tab === "matches"  && <MatchesTab onOpenMatch={openMatch} plan={userPlan} onUpgrade={() => setSubView("subscription")} blocked={blocked} chattingIds={chattingPartnerIds} sentInterests={sentInterests} onInterest={showInterest} matchesList={liveMatches} profileStrength={profileStrength} incompleteFields={incompleteFields} onCompleteProfile={(section) => setSubView(section)} />}
              {tab === "messages" && <MessagesTab onOpenChat={openChat} onOpenMatch={openMatch} plan={userPlan} onUpgrade={() => setSubView("subscription")} blocked={blocked} onBlock={blockMatch} onRequestBlock={(matchId, name) => setBlockModal({ matchId, name })} onReport={(matchId, name) => setReportModal({ matchId, name })} sentInterests={sentInterests} onInterest={showInterest} conversations={liveConversations} receivedInterests={liveInterests} matchesList={liveMatches} />}
              {tab === "profile" && <ProfileTab setSubView={setSubView} onSignOut={onSignOut} displayName={displayName} profileStrength={profileStrength} profileData={profileData} plan={userPlan} incompleteFields={incompleteFields} onAvatarSaved={() => setProfileVersion(v => v + 1)} />}
            </div>
          )}

          {subView === "chat" && activeChatId && (
            <ChatView
              conversationId={activeChatId}
              onBack={goBack}
              plan={userPlan}
              conversations={liveConversations}
              onGoToProfile={() => { goBack(); setTab("profile"); }}
              onRequestBlock={(matchId, name) => setBlockModal({ matchId, name })}
              onReport={(matchId, name) => setReportModal({ matchId, name })}
              onViewPartnerProfile={(matchId) => {
                setActiveMatchId(matchId);
                setSubView("match-detail");
              }}
            />
          )}

          {subView === "match-detail" && activeMatchId && (
            <MatchDetailView
              matchId={activeMatchId}
              plan={userPlan}
              onBack={goBack}
              onUpgrade={() => setSubView("subscription")}
              isAlreadyChatting={chattingPartnerIds.has(activeMatchId)}
              sentInterest={sentInterests.includes(activeMatchId)}
              onInterest={(id, name) => showInterest(id, name)}
              onMessage={async (id) => {
                const existing = liveConversations.find(c => c.partnerId === id);
                if (existing) { openChat(existing.id); return; }
                try {
                  const apiConv = await messagingApi.start(id);
                  const convItem = mapApiConversation(apiConv);
                  setLiveConversations(prev => [convItem, ...prev.filter(c => c.id !== convItem.id)]);
                  openChat(convItem.id);
                } catch (err: unknown) {
                  const detail = (err as { data?: { detail?: string } })?.data?.detail;
                  if (detail === "both_free") {
                    toast.error("Upgrade to Basic or Premium to start messaging.");
                  } else {
                    toast.error("Could not start conversation. Please try again.");
                  }
                }
              }}
              displayName={displayName}
              onReport={(matchId, name) => setReportModal({ matchId, name })}
              matchesList={liveMatches}
            />
          )}

          {subView === "subscription" && <SubscriptionView onBack={goBack} onUpgrade={upgradePlan} currentPlan={userPlan} displayName={displayName} />}
          {subView === "referral" && <ReferralView onBack={goBack} userEmail={(() => { try { return localStorage.getItem("ma3moni_login_email") ?? undefined; } catch { return undefined; } })()} />}
          {subView === "notifications" && <NotificationsView onBack={goBack} items={notifItems}
            onRefresh={() => notifsApi.list().then(r => { if (r.results.length) setNotifItems(r.results.map(mapApiNotif)); }).catch(() => {})}
            onMarkAllRead={() => { setNotifItems(prev => prev.map(n => ({ ...n, read: true }))); notifsApi.markAllRead().catch(() => {}); }} onDeepLink={(type, targetId) => {
              if (type === "match" && targetId) {
                // Open the specific match's full profile
                setActiveMatchId(targetId);
                setSubView("match-detail");
              } else if (type === "match") {
                // No specific ID — go to matches tab
                setTab("matches"); setSubView("none");
              } else if (type === "message" && targetId) {
                // Open the specific conversation
                setActiveChatId(targetId);
                setSubView("chat");
              } else if (type === "message") {
                setTab("messages"); setSubView("none");
              } else if (type === "referral") {
                setSubView("referral");
              } else {
                setSubView("none");
              }
            }} />}

          {subView === "blog-list" && (
            <GuidanceListView onBack={goBack} onOpenArticle={(id) => openArticle(id, "blog-list")} />
          )}

          {subView === "blog-detail" && activeArticleId != null && (
            <BlogDetail
              articleId={activeArticleId}
              backLabel={blogFrom === "blog-list" ? "Back to Articles" : "Back to Home"}
              onBack={() => (blogFrom === "blog-list" ? setSubView("blog-list") : goBack())}
              onStart={() => { goBack(); setTab("matches"); }}
              onOpenArticle={(id) => setActiveArticleId(id)}
            />
          )}

          {subView === "edit-profile" && (
            <PersonalInfoEdit onBack={goBack} profileData={profileData} onSaved={() => { setProfileVersion(v => v + 1); goBack(); }} />
          )}
          {subView === "photos" && (
            <div className="flex flex-col h-full bg-background">
              <div className="flex items-center px-4 py-3 border-b border-border bg-card flex-shrink-0">
                <button onClick={goBack} aria-label="Go back" className="p-1 text-muted-foreground hover:text-foreground transition-colors mr-3"><ChevronLeft size={22} /></button>
                <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Profile Photos</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <p className="text-muted-foreground mb-4" style={{ fontSize: "0.875rem" }}>
                  Profiles with photos receive <strong>3× more matches</strong>. Upload up to 6 photos.
                </p>
                <ProfilePhotoGrid />
              </div>
            </div>
          )}
          {subView === "career-education"  && <CareerEducationSection onBack={goBack} onSaved={() => { setProfileVersion(v => v + 1); goBack(); }} />}
          {subView === "values-lifestyle"  && <ValuesLifestyleSection onBack={goBack} onSaved={() => { setProfileVersion(v => v + 1); goBack(); }} />}
          {subView === "life-goals"        && <LifeGoalsSection        onBack={goBack} onSaved={() => { setProfileVersion(v => v + 1); goBack(); }} />}
          {subView === "partner-prefs"     && <PartnerPrefsSection      onBack={goBack} onSaved={() => { setProfileVersion(v => v + 1); goBack(); }} />}
          {subView === "privacy-safety"    && <PrivacySafetySection onBack={goBack} plan={userPlan} onUpgrade={() => setSubView("subscription")} />}
          {subView === "app-settings"      && <AppSettingsSection onBack={goBack} />}
          {subView === "found-partner"     && <FoundPartnerSection onBack={goBack} onComplete={() => { setFoundPartner(true); try { localStorage.setItem("ma3moni_found_partner","true"); } catch {} goBack(); }} />}
          {subView === "deactivate"        && <DeactivateSection onBack={goBack} onSignOut={onSignOut} />}
        </div>

        {/* Bottom nav (hidden during sub-views) */}
        {subView === "none" && (
          <div className="flex border-t border-border bg-card flex-shrink-0">
            {navItems.map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-label={label}
                aria-current={tab === key ? "page" : undefined}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all relative focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 ${tab === key ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {/* #10 — filled pill replaces thin top line */}
                <div className={`flex items-center justify-center rounded-2xl px-4 py-1.5 transition-all ${tab === key ? "bg-primary/12" : ""}`}>
                  <div className="relative">
                    {icon}
                    {key === "messages" && totalUnread > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent rounded-full flex items-center justify-center">
                        <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "white" }}>{totalUnread}</span>
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: "0.625rem", fontWeight: tab === key ? 800 : 400, letterSpacing: tab === key ? "0.01em" : "normal", color: tab === key ? "var(--primary)" : undefined }}>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

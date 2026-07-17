// ── Ma3moni API Client ────────────────────────────────────────
// Typed HTTP client for the Django REST Framework backend.
// Base URL is read from VITE_API_URL (default: http://localhost:8000).
// All endpoints mirror the Phase 0-10 spec exactly.

const BASE = (import.meta.env.VITE_API_URL ?? "https://ma3moni-backend26.onrender.com").replace(/\/$/, "");
/** Exposed so other modules can resolve relative media URLs from Django */
export const DJANGO_BASE = BASE;

/**
 * Fire-and-forget ping to wake the Render free-tier server from sleep.
 * Call once on app mount — any response (even 4xx) proves the server is up.
 * Times out after 50 s (Render cold starts can take ~30-45 s).
 */
export async function wakeUpServer(): Promise<void> {
  try {
    // Ping the root health endpoint (returns {"status":"ok"}) to wake Render from sleep.
    await fetch(`${BASE}/`, {
      method: "GET",
      signal: AbortSignal.timeout(50_000),
    });
  } catch {
    // Ignore — the point is to trigger the cold start, not to read the response
  }
}

// ── Token storage keys ────────────────────────────────────────
// Admin and user tokens are COMPLETELY ISOLATED — they never share a slot.
// ACCESS_KEY / REFRESH_KEY are legacy keys kept only as a read-fallback for
// user sessions created before USER_ACCESS_KEY was introduced. Nothing writes
// to them anymore, so they cannot be overwritten by an admin or user login.
const ACCESS_KEY        = "ma3moni_access_token";   // legacy user token (read-only fallback)
const REFRESH_KEY       = "ma3moni_refresh_token";  // legacy user refresh (read-only fallback)
const ADMIN_ACCESS_KEY  = "ma3moni_admin_access_token";
const ADMIN_REFRESH_KEY = "ma3moni_admin_refresh_token";
const USER_ACCESS_KEY   = "ma3moni_user_access_token";
const USER_REFRESH_KEY  = "ma3moni_user_refresh_token";

function ls(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function lset(key: string, val: string) { try { localStorage.setItem(key, val); } catch {} }

/** Returns the correct access token for a given API path.
 *  Admin endpoints use ONLY the admin slot; all other endpoints prefer the user
 *  slot but fall back to the admin token so that admins can call blog/user APIs
 *  without needing a separate user session. */
function tokenForPath(path: string): string | null {
  if (path.startsWith("/api/admin/")) {
    return ls(ADMIN_ACCESS_KEY);           // admin endpoints: admin token only
  }
  // Non-admin paths: user token first, legacy fallback, then admin token as last resort
  return ls(USER_ACCESS_KEY) ?? ls(ACCESS_KEY) ?? ls(ADMIN_ACCESS_KEY);
}
function refreshForPath(path: string): string | null {
  if (path.startsWith("/api/admin/")) {
    return ls(ADMIN_REFRESH_KEY);
  }
  return ls(USER_REFRESH_KEY) ?? ls(REFRESH_KEY) ?? ls(ADMIN_REFRESH_KEY);
}

export function getAccessToken()  { return ls(ACCESS_KEY); }
export function getRefreshToken() { return ls(REFRESH_KEY); }
export function getAdminToken()   { return ls(ADMIN_ACCESS_KEY); }

export function setTokens(access: string, refresh: string) {
  lset(ACCESS_KEY, access);
  lset(REFRESH_KEY, refresh);
}

/** Store admin JWT in its own slot — NEVER touches the user/legacy slots. */
export function setAdminTokens(access: string, refresh: string) {
  lset(ADMIN_ACCESS_KEY, access);
  lset(ADMIN_REFRESH_KEY, refresh);
}

/** Store user JWT in its own slot — NEVER touches the admin slot. */
export function setUserTokens(access: string, refresh: string) {
  lset(USER_ACCESS_KEY, access);
  lset(USER_REFRESH_KEY, refresh);
}

export function restoreUserToken(): boolean  { return !!(ls(USER_ACCESS_KEY) ?? ls(ACCESS_KEY)); }
export function restoreAdminToken(): boolean { return !!(ls(ADMIN_ACCESS_KEY)); }

/** Clear only the USER tokens (admin stays logged in). */
export function clearTokens() {
  try {
    localStorage.removeItem(USER_ACCESS_KEY);
    localStorage.removeItem(USER_REFRESH_KEY);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem("ma3moni_user_session");
  } catch {}
}

/** Clear only the ADMIN tokens (user stays logged in). */
export function clearAdminTokens() {
  try {
    localStorage.removeItem(ADMIN_ACCESS_KEY);
    localStorage.removeItem(ADMIN_REFRESH_KEY);
    localStorage.removeItem("ma3moni_admin_session");
  } catch {}
}

// ── Shared types ──────────────────────────────────────────────
export type UserPlan   = "free" | "basic" | "premium";
export type DjangoRole = "user" | "admin" | "super_admin" | "blog_admin" | "moderator" | "cc_agent";

// Maps Django role strings to the frontend AdminRole union.
// moderator is treated as admin-level in the UI (has moderation access).
export type FrontendAdminRole = "super-admin" | "admin" | "blog-admin" | "customer-care";

export function toFrontendRole(role: DjangoRole): FrontendAdminRole | null {
  const map: Partial<Record<DjangoRole, FrontendAdminRole>> = {
    super_admin: "super-admin",
    admin:       "admin",
    moderator:   "admin",
    blog_admin:  "blog-admin",
    cc_agent:    "customer-care",
  };
  return map[role] ?? null;
}

export interface AuthUser {
  id: string;
  email: string;
  phone?: string;   // private — only returned for own account and admin views
  role: DjangoRole;
  plan: UserPlan;
  is_verified: boolean;
}

export interface Profile {
  full_name:          string;
  gender:             "male" | "female" | null;
  date_of_birth:      string | null;
  nationality:        string;
  ethnicity:          string;
  blood_group:        string;
  genotype:           string;
  last_location:      string;
  location_city:      string;
  location_country:   string;
  bio:                string;
  marital_status:     string;
  sect:               string;
  prayer_frequency:   string;
  quran_recitation:   string;
  hijab_preference:   string;
  education:          string;
  profession:         string;
  income_range:       string;
  living_situation:   string;
  smoking:            "none" | "occasionally" | "regularly";
  drinking:           "none" | "occasionally" | "regularly";
  personality_traits: string[];
  pref_age_min:       number | null;
  pref_age_max:       number | null;
  pref_location:      string;
  pref_nationality:   string;
  completion_score:   number;
  found_partner:      boolean;
}

export interface ProfilePhoto {
  id:          string;
  image_url:   string;
  order:       number;
  uploaded_at: string;
}

export interface MeResponse {
  id:         string;
  email:      string;
  role:       DjangoRole;
  plan:       UserPlan;
  profile:    Profile;
  photos:     ProfilePhoto[];
}

// ── API error ─────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Core fetcher ──────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function refreshAccessToken(path: string): Promise<string> {
  const isAdmin  = path.startsWith("/api/admin/");
  const refresh  = refreshForPath(path);
  if (!refresh) throw new ApiError(401, "No refresh token");

  const res = await fetch(`${BASE}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    if (isAdmin) clearAdminTokens(); else clearTokens();
    throw new ApiError(401, "Session expired. Please sign in again.");
  }
  const data = await res.json();
  const newRefresh = data.refresh ?? refresh;
  // Store back into the correct slot
  if (isAdmin) setAdminTokens(data.access, newRefresh);
  else         setUserTokens(data.access, newRefresh);
  return data.access;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: { multipart?: boolean; signal?: AbortSignal } = {},
): Promise<T> {
  const url = `${BASE}${path}`;
  // Pick the correct token for this endpoint (admin vs user) — no juggling.
  const accessToken = tokenForPath(path);

  const headers: Record<string, string> = {};
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  if (!opts.multipart) headers["Content-Type"] = "application/json";

  const fetchOpts: RequestInit = {
    method,
    headers,
    signal: opts.signal,
    body: opts.multipart
      ? (body as FormData)
      : body !== undefined
        ? JSON.stringify(body)
        : undefined,
  };

  let res = await fetch(url, fetchOpts);

  // Auto-refresh on 401
  if (res.status === 401 && refreshForPath(path)) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken(path);
        refreshQueue.forEach(cb => cb(newToken));
        refreshQueue = [];
      } finally {
        isRefreshing = false;
      }
    } else {
      await new Promise<string>(resolve => refreshQueue.push(resolve));
    }

    // Retry with the freshly-picked token for this path
    const newAccess = tokenForPath(path);
    if (newAccess) headers["Authorization"] = `Bearer ${newAccess}`;
    res = await fetch(url, { ...fetchOpts, headers });
  }

  if (!res.ok) {
    let errData: unknown;
    try { errData = await res.json(); } catch { errData = null; }
    const message =
      (errData as Record<string, string>)?.detail ??
      (errData as Record<string, string>)?.message ??
      `HTTP ${res.status}`;
    throw new ApiError(res.status, message, errData);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

const get    = <T>(path: string, signal?: AbortSignal) => request<T>("GET", path, undefined, { signal });
const post   = <T>(path: string, body?: unknown)       => request<T>("POST", path, body);
const patch  = <T>(path: string, body?: unknown)       => request<T>("PATCH", path, body);
const del    = <T>(path: string)                       => request<T>("DELETE", path);
const upload = <T>(path: string, form: FormData)       => request<T>("POST", path, form, { multipart: true });

// ═══════════════════════════════════════════════════════════════
// AUTH — /api/auth/
// ═══════════════════════════════════════════════════════════════
export interface LoginResponse {
  access:  string;
  refresh: string;
  user: AuthUser & { phone?: string; profile_complete: boolean };
}

export interface RegisterResponse {
  access:  string;
  refresh: string;
  user:    AuthUser & { phone?: string; profile_complete: boolean };
}

export const auth = {
  /** identifier = email address OR phone number */
  login: (identifier: string, password: string) =>
    post<LoginResponse>("/api/auth/login/", { identifier, password }),

  register: (email: string, password: string, full_name: string, phone?: string) =>
    post<RegisterResponse>("/api/auth/register/", { email, password, full_name, ...(phone ? { phone } : {}) }),

  /** Send OTP to the given email or phone (no auth required). */
  sendOtp: (identifier: string) =>
    post<{ detail: string }>("/api/auth/send-otp/", { identifier }),

  /** Verify the 6-digit OTP. Returns fresh tokens + updated user on success. */
  verifyOtp: (identifier: string, code: string) =>
    post<LoginResponse>("/api/auth/verify-otp/", { identifier, code }),

  logout: (refresh: string) =>
    post<void>("/api/auth/logout/", { refresh }),

  refresh: (refresh: string) =>
    post<{ access: string; refresh: string }>("/api/auth/refresh/", { refresh }),

  verifyEmail: (token: string) =>
    post<{ detail: string }>("/api/auth/verify-email/", { token }),

  forgotPassword: (email: string) =>
    post<{ detail: string }>("/api/auth/forgot-password/", { email }),

  resetPassword: (token: string, new_password: string) =>
    post<{ detail: string }>("/api/auth/reset-password/", { token, new_password }),

  changePassword: (old_password: string, new_password: string) =>
    post<{ detail: string }>("/api/auth/change-password/", { old_password, new_password }),

  me: () => get<MeResponse>("/api/auth/me/"),

  updateProfile: (data: Partial<Profile>) =>
    patch<MeResponse>("/api/auth/me/", data),

  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append("image", file);
    return upload<ProfilePhoto>("/api/auth/photos/", form);
  },

  deletePhoto: (id: string) =>
    del<void>(`/api/auth/photos/${id}/`),

  reorderPhoto: (id: string, order: number) =>
    patch<ProfilePhoto>(`/api/auth/photos/${id}/reorder/`, { order }),

  photoDebug: () =>
    get<{
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
    }>("/api/auth/photos/debug/"),

  fixPhotoUrls: () =>
    post<{ fixed: Array<{ id: string; url: string }>; failed: Array<{ id: string; reason: string }> }>(
      "/api/auth/photos/fix/"
    ),

  adminForgotPassword: (email: string) =>
    post<{ detail: string }>("/api/auth/admin-forgot-password/", { email }),
};

// ═══════════════════════════════════════════════════════════════
// MATCHES — /api/matches/ & /api/interests/
// ═══════════════════════════════════════════════════════════════
export interface MatchProfile {
  id:               string;
  full_name:        string;
  age:              number;
  location_city:    string;
  location_country: string;
  profession:       string;
  bio:              string;
  photos:           ProfilePhoto[];
  completion_score: number;
  compatibility_score: number;
}

export interface DiscoverResponse {
  results:         MatchProfile[];
  remaining_today: number;
  count:           number;
  next:            string | null;
}

export interface Interest {
  id:         string;
  sender:     MatchProfile;
  receiver:   MatchProfile;
  status:     "sent" | "seen" | "accepted" | "declined";
  sent_at:    string;
  seen_at:    string | null;
}

export interface DiscoverFilters {
  min_age?:      number;
  max_age?:      number;
  city?:         string;
  nationality?:  string;
  page?:         number;
  page_size?:    number;
}

export const matches = {
  discover: (filters: DiscoverFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
    const qs = params.toString();
    return get<DiscoverResponse>(`/api/matches/discover/${qs ? "?" + qs : ""}`);
  },

  detail: (id: string) =>
    get<MatchProfile>(`/api/matches/${id}/`),

  active: () =>
    get<{ results: MatchProfile[] }>("/api/matches/active/"),

  sendInterest: (userId: string) =>
    post<Interest>(`/api/interests/send/${userId}/`),

  receivedInterests: () =>
    get<{ results: Interest[] }>("/api/interests/received/"),

  sentInterests: () =>
    get<{ results: Interest[] }>("/api/interests/sent/"),

  respondToInterest: (id: string, action: "accepted" | "declined") =>
    patch<Interest>(`/api/interests/${id}/respond/`, { action }),
};

// ═══════════════════════════════════════════════════════════════
// MESSAGING — /api/conversations/
// ═══════════════════════════════════════════════════════════════
export interface Message {
  id:           string;
  sender:       { id: string; full_name: string; photo_url: string | null };
  content:      string;
  message_type: "text" | "image" | "system";
  image_url:    string | null;
  sent_at:      string;
  read_at:      string | null;
}

export interface Conversation {
  id:              string;
  partner:         MatchProfile;
  last_message:    Message | null;
  unread_count:    number;
  last_message_at: string | null;
}

export const messaging = {
  list: (q?: string) =>
    get<{ results: Conversation[] }>(`/api/conversations/${q ? "?q=" + encodeURIComponent(q) : ""}`),

  start: (userId: string) =>
    post<Conversation>(`/api/conversations/start/${userId}/`),

  messages: (conversationId: string, cursor?: string) =>
    get<{ results: Message[]; next: string | null }>(
      `/api/conversations/${conversationId}/messages/${cursor ? "?cursor=" + cursor : ""}`
    ),

  send: (conversationId: string, content: string) =>
    post<Message>(`/api/conversations/${conversationId}/send/`, { content, message_type: "text" }),

  sendImage: (conversationId: string, file: File) => {
    const form = new FormData();
    form.append("image", file);
    return upload<Message>(`/api/conversations/${conversationId}/send-image/`, form);
  },

  markRead: (messageId: string) =>
    patch<void>(`/api/messages/${messageId}/read/`),
};

// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTIONS — /api/subscriptions/ & /api/plans/
// ═══════════════════════════════════════════════════════════════
export interface Plan {
  name:                     UserPlan;
  price_monthly:            number;
  price_yearly:             number;
  features:                 string[];
  stripe_price_id_monthly:  string;   // reused as credo_code_monthly
  stripe_price_id_yearly:   string;   // reused as credo_code_yearly
  credo_code_monthly?:      string;
  credo_code_yearly?:       string;
}

export interface Subscription {
  plan:                  Plan;
  status:                "active" | "cancelled" | "expired" | "trialing";
  billing_cycle:         "monthly" | "yearly";
  current_period_end:    string | null;
  cancel_at_period_end:  boolean;
}

export interface PaymentRecord {
  id:          string;
  amount:      number;
  currency:    string;
  status:      "completed" | "refunded" | "failed";
  description: string;
  created_at:  string;
}

export const subscriptions = {
  plans: () =>
    get<Plan[]>("/api/plans/"),

  status: () =>
    get<Subscription>("/api/subscriptions/status/"),

  // Initiates payment — Credo returns a checkout_url to redirect the user to
  create: (plan: UserPlan, billing_cycle: "monthly" | "yearly") =>
    post<{ checkout_url: string | null; reference?: string; plan?: string }>("/api/subscriptions/create/", { plan, billing_cycle }),

  // Called after Credo redirects back with ?ref=... to confirm payment
  verify: (reference: string, plan: UserPlan) =>
    post<{ status: string; plan: string }>("/api/subscriptions/verify/", { reference, plan }),

  cancel: () =>
    post<{ detail: string }>("/api/subscriptions/cancel/"),

  billingHistory: () =>
    get<{ results: PaymentRecord[] }>("/api/billing/history/"),
};

// ═══════════════════════════════════════════════════════════════
// REFERRALS — /api/referrals/
// ═══════════════════════════════════════════════════════════════
export interface ReferralStats {
  code:           string;
  referral_url:   string;
  total_signups:  number;
  total_converted: number;
  total_points:   number;
  monthly_stats:  Array<{ month: string; signups: number }>;
}

export const referrals = {
  myCode: () =>
    get<ReferralStats>("/api/referrals/my-code/"),

  apply: (code: string) =>
    post<{ detail: string }>(`/api/referrals/apply/${code}/`),

  leaderboard: () =>
    get<{ results: Array<{ rank: number; name: string; signups: number; points: number }> }>(
      "/api/referrals/leaderboard/"
    ),
};

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS — /api/notifications/
// ═══════════════════════════════════════════════════════════════
export interface AppNotification {
  id:         string;
  type:       "system" | "match" | "message" | "referral" | "interest" | "subscription";
  title:      string;
  body:       string;
  data:       Record<string, unknown>;
  read:       boolean;
  created_at: string;
}

export const notifications = {
  list: () =>
    get<{ results: AppNotification[]; unread_count: number }>("/api/notifications/"),

  markRead: (id: string) =>
    patch<void>(`/api/notifications/${id}/read/`),

  markAllRead: () =>
    patch<void>("/api/notifications/read-all/"),

  registerDevice: (registration_token: string, platform: "ios" | "android" | "web") =>
    post<{ id: string }>("/api/notifications/register-device/", { registration_token, platform }),

  removeDevice: (id: string) =>
    del<void>(`/api/notifications/devices/${id}/`),
};

// ═══════════════════════════════════════════════════════════════
// BLOG — /api/blog/
// ═══════════════════════════════════════════════════════════════
export interface BlogCategory {
  id:   string;
  name: string;
  slug: string;
}

export interface BlogArticle {
  id:            string;
  title:         string;
  slug:          string;
  content:       string;
  excerpt:       string;
  cover_image:   string;
  author:        { id: string; full_name: string };
  category:      BlogCategory;
  status:        "draft" | "published" | "archived";
  published_at:  string | null;
  view_count:    number;
  likes_count:   number;
  dislikes_count: number;
  user_vote:     1 | -1 | null;
}

export const blog = {
  categories: () =>
    get<BlogCategory[]>("/api/blog/categories/"),

  articles: (params: { category?: string; search?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.search)   qs.set("search",   params.search);
    if (params.page)     qs.set("page",      String(params.page));
    const suffix = qs.toString() ? `?${qs}` : "";
    return get<{ results: BlogArticle[]; count: number; next: string | null }>(`/api/blog/articles/${suffix}`);
  },

  article: (slug: string) =>
    get<BlogArticle>(`/api/blog/articles/${slug}/`),

  vote: (id: string, vote: 1 | -1) =>
    post<{ likes_count: number; dislikes_count: number; user_vote: 1 | -1 }>(
      `/api/blog/articles/${id}/vote/`, { vote }
    ),

};

// ── Admin-only blog API — routed through /api/admin/blog/ ────
// All calls here use the admin JWT token automatically (tokenForPath
// routes /api/admin/ paths to ADMIN_ACCESS_KEY with no fallback logic).
export const adminBlog = {
  // Reads — admin sees all statuses (draft + published + archived)
  listArticles: (params: { category?: string; search?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.search)   qs.set("search",   params.search);
    if (params.page)     qs.set("page",      String(params.page));
    const suffix = qs.toString() ? `?${qs}` : "";
    return get<{ results: BlogArticle[]; count: number; next: string | null }>(`/api/admin/blog/articles/${suffix}`);
  },
  listCategories: () => get<BlogCategory[]>("/api/admin/blog/categories/"),

  createArticle: (data: { title?: string; excerpt?: string; content?: string; category_id?: string; status?: string }) =>
    post<BlogArticle>("/api/admin/blog/articles/", data),

  updateArticle: (id: string, data: { title?: string; excerpt?: string; content?: string; category_id?: string; status?: string }) =>
    patch<BlogArticle>(`/api/admin/blog/articles/${id}/`, data),

  deleteArticle: (id: string) =>
    del<void>(`/api/admin/blog/articles/${id}/`),

  publishArticle: (id: string) =>
    post<BlogArticle>(`/api/admin/blog/articles/${id}/publish/`),

  uploadCover: (id: string, file: File) => {
    const form = new FormData();
    form.append("cover", file);
    return upload<{ cover_image: string }>(`/api/admin/blog/articles/${id}/cover/`, form);
  },

  createCategory: (name: string) =>
    post<BlogCategory>("/api/admin/blog/categories/create/", { name }),

  updateCategory: (id: string, name: string) =>
    patch<BlogCategory>(`/api/admin/blog/categories/${id}/`, { name }),

  deleteCategory: (id: string) =>
    del<void>(`/api/admin/blog/categories/${id}/`),
};

// ═══════════════════════════════════════════════════════════════
// PUBLIC SETTINGS — /api/settings/  (no auth required)
// ═══════════════════════════════════════════════════════════════
export interface PublicSettings {
  referral_bonus_points:   number;
  maintenance_mode:        boolean;
  max_daily_matches_free:  number;
  max_daily_matches_basic: number;
}

export const publicApi = {
  settings: () => get<PublicSettings>("/api/settings/"),
};

// ═══════════════════════════════════════════════════════════════
// MODERATION — /api/users/:id/report|block, /api/support/
// ═══════════════════════════════════════════════════════════════
export type ReportCategory =
  | "harassment" | "fake_profile" | "inappropriate_content"
  | "spam" | "scam" | "other";

export interface SupportTicket {
  id:          string;
  subject:     string;
  category:    string;
  status:      "open" | "in_progress" | "escalated" | "resolved" | "closed";
  priority:    "low" | "medium" | "high" | "urgent";
  created_at:  string;
  updated_at:  string;
  messages:    Array<{ sender: { id: string; full_name: string }; body: string; sent_at: string }>;
}

export const moderation = {
  reportUser: (userId: string, category: ReportCategory, description: string, evidence?: { type: string; content: string; time: string }[]) =>
    post<{ id: string }>(`/api/users/${userId}/report/`, { category, description, evidence: evidence ?? [] }),

  blockUser: (userId: string, reason: string) =>
    post<void>(`/api/users/${userId}/block/`, { reason }),

  unblockUser: (userId: string) =>
    del<void>(`/api/users/${userId}/unblock/`),

  blocks: () =>
    get<{ results: Array<{ id: string; blocked: MatchProfile; blocked_at: string }> }>("/api/blocks/"),

  createTicket: (subject: string, category: string, description: string) =>
    post<SupportTicket>("/api/support/tickets/", { subject, category, description }),

  myTickets: () =>
    get<{ results: SupportTicket[] }>("/api/support/tickets/"),

  ticketDetail: (id: string) =>
    get<SupportTicket>(`/api/support/tickets/${id}/`),

  replyTicket: (id: string, body: string) =>
    post<void>(`/api/support/tickets/${id}/reply/`, { body }),
};

// ═══════════════════════════════════════════════════════════════
// ADMIN PANEL — /api/admin/
// ═══════════════════════════════════════════════════════════════
export interface AdminUserRecord {
  id:               string;
  name:             string;
  email:            string;
  phone:            string;
  age:              number;
  location:         string;
  gender:           "male" | "female";
  status:           "active" | "suspended" | "pending" | "deactivated";
  subscription:     UserPlan;
  verified:         boolean;
  joined:           string;
  last_active:      string;
  completion:       number;
}

export interface AdminUserDetail extends AdminUserRecord {
  profile:              Profile;
  photos:               ProfilePhoto[];
  matches_count:        number;
  conversations_count:  number;
  reports_filed_count:  number;
  reports_received_count: number;
  referrals_made_count: number;
}

export interface AdminReport {
  id:                       string;
  reporter:                 { id: string; name: string; email: string };
  reported_user:            { id: string; name: string; email: string; subscription: UserPlan; status: string; joined: string };
  category:                 ReportCategory;
  description:              string;
  status:                   "pending" | "under_review" | "actioned" | "dismissed";
  priority:                 "low" | "medium" | "high";
  evidence:                 Array<{ type: string; content: string; time: string }>;
  action_history:           Array<{ action: string; by: string; date: string; type: string }>;
  admin_notes:              string;
  prior_reports_against_user: number;
  created_at:               string;
}

export interface AdminTicket extends SupportTicket {
  user:        { id: string; name: string; email: string };
  assigned_to: { id: string; name: string } | null;
}

export interface PlatformSettings {
  max_daily_matches_free:      number;
  max_daily_matches_basic:     number;
  max_photos:                  number;
  match_expiry_days:           number;
  referral_bonus_points:       number;
  maintenance_mode:            boolean;
  revenue_permission_for_admin: boolean;
}

// All possible granular permissions assignable per staff member
export const ALL_PERMISSIONS = [
  "delete_user", "suspend_user", "view_user_details", "view_user_activity",
  "manage_reports", "manage_blacklist", "manage_blog", "view_analytics",
  "view_financials", "send_push_notifications", "grant_subscription",
  "view_admin_activity", "manage_roles",
] as const;
export type Permission = typeof ALL_PERMISSIONS[number];

export interface StaffMember {
  id:          string;
  name:        string;
  email:       string;
  role:        DjangoRole;
  is_active:   boolean;
  is_verified: boolean;
  joined:      string;
  last_active: string;
  permissions?: Permission[];  // granular overrides set by super_admin
}

export interface ActivityEntry {
  id:        string;
  actor:     string;  // user name or admin name
  actor_role: "user" | "admin";
  action:    string;
  detail:    string;
  timestamp: string;
  type:      "auth" | "match" | "message" | "profile" | "subscription" | "admin" | "moderation";
}

export const adminApi = {
  // Users
  users: (params: {
    search?: string; status?: string; gender?: string;
    subscription?: string; sort?: string; order?: string;
    page?: number; page_size?: number;
  } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return get<{ results: AdminUserRecord[]; count: number }>(`/api/admin/users/?${qs}`);
  },

  userDetail: (id: string) =>
    get<AdminUserDetail>(`/api/admin/users/${id}/`),

  updateUserStatus: (id: string, status: "active" | "suspended" | "deactivated") =>
    patch<void>(`/api/admin/users/${id}/status/`, { status }),

  deleteUser: (id: string) =>
    del<void>(`/api/admin/users/${id}/delete/`),

  grantSubscription: (id: string, plan: UserPlan, days: number) =>
    post<{ detail: string; plan: string }>(`/api/admin/users/${id}/grant-subscription/`, { plan, days }),

  resetUserPassword: (id: string, expires_in_hours: number) =>
    post<{ temp_password: string; expires_in_hours: number; expires_at: string; detail: string }>(
      `/api/admin/users/${id}/reset-password/`, { expires_in_hours }
    ),

  pushToUser: (id: string, type: string, title: string, body: string, data: Record<string, unknown> = {}) =>
    post<void>(`/api/admin/users/${id}/push/`, { type, title, body, data }),

  bulkPush: (
    filter: { gender?: string; subscription?: string; status?: string },
    type: string, title: string, body: string,
  ) => post<{ queued_count: number }>("/api/admin/users/bulk-push/", { filter, type, title, body }),

  // Reports
  reports: (params: { category?: string; status?: string; priority?: string; search?: string } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    return get<{ results: AdminReport[] }>(`/api/admin/reports/?${qs}`);
  },

  updateReport: (id: string, data: { status?: string; admin_notes?: string; action?: string }) =>
    patch<AdminReport>(`/api/admin/reports/${id}/`, data),

  // Blacklist
  blacklist: () =>
    get<{ results: Array<{ id: string; type: string; value: string; reason: string; added_at: string; active: boolean }> }>(
      "/api/admin/blacklist/"
    ),

  addBlacklist: (type: string, value: string, reason: string) =>
    post<void>("/api/admin/blacklist/", { type, value, reason }),

  removeBlacklist: (id: string) =>
    del<void>(`/api/admin/blacklist/${id}/`),

  toggleBlacklist: (id: string) =>
    patch<void>(`/api/admin/blacklist/${id}/toggle/`),

  // Support tickets (admin view)
  tickets: (params: { status?: string; priority?: string; search?: string } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    return get<{ results: AdminTicket[] }>(`/api/admin/support/tickets/?${qs}`);
  },

  assignTicket: (id: string, agent_id: string) =>
    patch<void>(`/api/admin/support/tickets/${id}/assign/`, { agent_id }),

  updateTicketStatus: (id: string, status: string) =>
    patch<void>(`/api/admin/support/tickets/${id}/status/`, { status }),

  replyTicket: (id: string, body: string) =>
    post<void>(`/api/admin/support/tickets/${id}/reply/`, { body }),

  // Photo moderation
  photoQueue: () =>
    get<{ results: Array<{ id: string; user: AdminUserRecord; photo_url: string; submitted_at: string }> }>(
      "/api/admin/moderation/photos/"
    ),

  reviewPhoto: (id: string, status: "approved" | "rejected") =>
    patch<void>(`/api/admin/moderation/photos/${id}/`, { status }),

  // Roles
  roles: () =>
    get<{ results: Array<{ id: string; name: string; badge: string; permissions: string[]; desc: string; users: string[] }> }>(
      "/api/admin/roles/"
    ),

  assignRole: (user_id: string, role: DjangoRole) =>
    post<void>("/api/admin/roles/assign/", { user_id, role }),

  // Platform settings
  settings: () =>
    get<PlatformSettings>("/api/admin/settings/"),

  updateSettings: (data: Partial<PlatformSettings>) =>
    patch<PlatformSettings>("/api/admin/settings/", data),

  // Staff / admin accounts (super_admin only)
  staff: () =>
    get<{ results: StaffMember[] }>("/api/admin/staff/"),

  createStaff: (data: { email: string; password: string; role: DjangoRole; name: string }) =>
    post<StaffMember>("/api/admin/staff/create/", data),

  updateStaff: (id: string, data: { role?: DjangoRole; name?: string; password?: string; is_active?: boolean }) =>
    patch<StaffMember>(`/api/admin/staff/${id}/`, data),

  deleteStaff: (id: string) =>
    del<void>(`/api/admin/staff/${id}/delete/`),

  // Granular permissions per staff member (super_admin only)
  setPermissions: (staffId: string, permissions: Permission[]) =>
    patch<StaffMember>(`/api/admin/staff/${staffId}/`, { permissions }),

  // Activity feeds
  userActivity: (userId: string) =>
    get<{ results: ActivityEntry[] }>(`/api/admin/users/${userId}/activity/`),

  platformActivity: (type?: "user" | "admin") =>
    get<{ results: ActivityEntry[] }>(`/api/admin/activity/${type ? "?type=" + type : ""}`),
};

// ═══════════════════════════════════════════════════════════════
// ANALYTICS — /api/admin/analytics/
// ═══════════════════════════════════════════════════════════════
export interface AnalyticsOverview {
  total_users:          number;
  active_today:         number;
  new_this_month:       number;
  total_matches:        number;
  interests_sent:       number;
  partners_found:       number;
  referrals_this_month: number;
  revenue_mtd?:         number;
  quick_actions: {
    pending_photo_reviews: number;
    open_tickets:          number;
    pending_reports:       number;
  };
}

export const analytics = {
  overview: () =>
    get<AnalyticsOverview>("/api/admin/analytics/overview/"),

  users: (period: "30d" | "90d" | "1y" = "90d") =>
    get<{
      series: Array<{ month: string; total: number; new: number }>;
      gender: Array<{ name: string; value: number; color: string }>;
    }>(`/api/admin/analytics/users/?period=${period}`),

  matches: () =>
    get<{
      series: Array<{ month: string; matches: number }>;
      interests_series: Array<{ month: string; interests_sent: number }>;
    }>("/api/admin/analytics/matches/"),

  subscriptions: () =>
    get<{
      distribution: Array<{ name: string; value: number; color: string }>;
      kpis: { free_count: number; basic_count: number; premium_count: number; total_paying: number; paying_percentage: number };
    }>("/api/admin/analytics/subscriptions/"),

  revenue: () =>
    get<{
      series: Array<{ month: string; amount: number }>;
      kpis: { mrr: number; arr: number; arpu: number; churn_rate: number; new_this_month: number };
    }>("/api/admin/analytics/revenue/"),

  referrals: () =>
    get<{
      monthly: Array<{ month: string; signups: number }>;
      total_referrals: number;
    }>("/api/admin/analytics/referrals/"),

  partners: () =>
    get<{
      monthly: Array<{ month: string; count: number }>;
      cumulative: Array<{ month: string; count: number }>;
      total_partners_found: number;
    }>("/api/admin/analytics/partners/"),
};

// ═══════════════════════════════════════════════════════════════
// WebSocket URL helper — used by chat consumer
// ═══════════════════════════════════════════════════════════════
export function wsUrl(conversationId: string): string {
  const base = (import.meta.env.VITE_API_URL ?? "https://ma3moni-backend26.onrender.com")
    .replace(/^http/, "ws")
    .replace(/\/$/, "");
  const token = getAccessToken() ?? "";
  return `${base}/ws/chat/${conversationId}/?token=${token}`;
}

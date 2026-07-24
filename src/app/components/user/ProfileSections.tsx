import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Check, X, AlertTriangle,
  Shield, Bell, Lock, Eye, EyeOff, Trash2, PauseCircle,
  Globe, UserX, Star, BookOpen, Briefcase, Target,
  Heart, PartyPopper, Camera, Download, LogOut, KeyRound,
} from "lucide-react";
import { auth as apiAuth } from "../../../lib/api";
import {
  applyTheme as applyThemePref,
  applyLanguage as applyLanguagePref,
  getStoredTheme,
  getStoredLanguage,
  isRTL,
  type ThemePref,
} from "../../../lib/preferences";

// ─── Profile persistence ──────────────────────────────────
// All profile sections write into the same localStorage key used by onboarding
// so UserApp can derive displayName / profileStrength from saved data.
const PROFILE_KEY = "ma3moni_onboarding_progress";

function readProfile(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return (JSON.parse(raw) as { form: Record<string, unknown> }).form ?? {};
  } catch {}
  return {};
}

function saveProfile(patch: Record<string, unknown>) {
  try {
    const current = readProfile();
    const merged = { ...current, ...patch };
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ step: 8, form: merged }));
  } catch {}
}

// ─── Shared shell ─────────────────────────────────────────
function Shell({
  title, onBack, onSave, saved, children,
}: {
  title: string; onBack: () => void; onSave?: () => void;
  saved?: boolean; children: ReactNode;
}) {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <button onClick={onBack} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>{title}</h3>
        {onSave ? (
          <button
            onClick={onSave}
            className={`px-4 py-1.5 rounded-lg transition-all ${saved ? "bg-green-50 text-green-700 border border-green-200" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
            style={{ fontSize: "0.8125rem", fontWeight: 700 }}
          >
            {saved ? <span className="flex items-center gap-1"><Check size={12} />Saved</span> : "Save"}
          </button>
        ) : <div style={{ width: 56 }} />}
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

// Primitives
const FL = ({ children, opt }: { children: ReactNode; opt?: boolean }) => (
  <label className="flex items-center gap-1.5 mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
    {children}
    {opt && <span className="text-muted-foreground font-normal text-xs">(optional)</span>}
  </label>
);

const TI = ({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <input
    type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
    style={{ fontSize: "0.9375rem" }}
  />
);

const SI = ({ value, onChange, opts }: { value: string; onChange: (v: string) => void; opts: { value: string; label: string }[] }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
    style={{ fontSize: "0.9375rem" }}>
    <option value="">Select…</option>
    {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

function CardPick<T extends string>({ value, onChange, opts, cols = 2 }: {
  value: T | ""; onChange: (v: T) => void;
  opts: { value: T; label: string; desc?: string }[]; cols?: number;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {opts.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`p-3 rounded-xl border text-left transition-all ${value === o.value ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/30"}`}>
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: value === o.value ? "var(--primary)" : "var(--foreground)" }}>{o.label}</p>
          {o.desc && <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.75rem" }}>{o.desc}</p>}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onChange, label, desc }: { on: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-3 min-w-0">
        <p style={{ fontSize: "0.9375rem", fontWeight: 500 }}>{label}</p>
        {desc && <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{desc}</p>}
      </div>
      <button onClick={() => onChange(!on)} className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0" style={{ background: on ? "var(--primary)" : "var(--muted)" }}>
        <div className={`w-4 h-4 rounded-full absolute top-1 shadow-sm transition-all ${on ? "left-[26px] bg-white" : "left-1 bg-muted-foreground/60"}`} />
      </button>
    </div>
  );
}

const Divider = ({ title }: { title: string }) => (
  <p className="text-muted-foreground mt-6 mb-3" style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{title}</p>
);

// ═══════════════════════════════════════════════════════
// 1. CAREER & EDUCATION
// ═══════════════════════════════════════════════════════
export function CareerEducationSection({ onBack, onSaved }: { onBack: () => void; onSaved?: () => void }) {
  const [f, setF] = useState(() => {
    const p = readProfile();
    return {
      jobTitle:    (p.profession    as string) || "",
      company:     (p.company       as string) || "",
      industry:    (p.industry      as string) || "technology",
      empType:     (p.empType       as string) || "full-time",
      education:   (p.education     as string) || "masters",
      institution: (p.institution   as string) || "",
      fieldOfStudy:(p.fieldOfStudy  as string) || "",
      gradYear:    (p.gradYear      as string) || "",
    };
  });
  const [saved, setSaved] = useState(false);
  const s = () => {
    saveProfile({ profession: f.jobTitle, company: f.company, industry: f.industry, empType: f.empType, education: f.education, institution: f.institution, fieldOfStudy: f.fieldOfStudy, gradYear: f.gradYear });
    apiAuth.updateProfile({ profession: f.jobTitle, education: f.education }).catch(() => {});
    setSaved(true); toast.success("Changes saved");
    setTimeout(() => { setSaved(false); onSaved ? onSaved() : onBack(); }, 900);
  };
  const u = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));

  return (
    <Shell title="Career & Education" onBack={onBack} onSave={s} saved={saved}>
      <div className="p-5 space-y-5">
        <Divider title="Career" />
        <div><FL>Job Title</FL><TI value={f.jobTitle} onChange={v => u("jobTitle", v)} placeholder="Software Engineer" /></div>
        <div><FL>Company / Organisation</FL><TI value={f.company} onChange={v => u("company", v)} placeholder="Company name" /></div>
        <div>
          <FL>Industry</FL>
          <SI value={f.industry} onChange={v => u("industry", v)} opts={[
            { value: "technology", label: "Technology" }, { value: "finance", label: "Finance & Banking" },
            { value: "healthcare", label: "Healthcare" }, { value: "education", label: "Education" },
            { value: "engineering", label: "Engineering" }, { value: "law", label: "Law & Legal" },
            { value: "architecture", label: "Architecture & Design" }, { value: "government", label: "Government & Public Sector" },
            { value: "media", label: "Media & Communications" }, { value: "business", label: "Business & Management" },
            { value: "hospitality", label: "Hospitality & Tourism" }, { value: "retail", label: "Retail & Commerce" },
            { value: "other", label: "Other" },
          ]} />
        </div>
        <div>
          <FL>Employment Type</FL>
          <CardPick value={f.empType as never} onChange={v => u("empType", v)} cols={2} opts={[
            { value: "full-time", label: "Full-time" }, { value: "self-employed", label: "Self-employed" },
            { value: "freelance", label: "Freelance / Contract" }, { value: "student", label: "Student" },
          ]} />
        </div>
        <Divider title="Education" />
        <div>
          <FL>Highest Education Level</FL>
          <SI value={f.education} onChange={v => u("education", v)} opts={[
            { value: "high-school", label: "High School / Secondary" },
            { value: "diploma", label: "Diploma / Certificate" },
            { value: "bachelors", label: "Bachelor's Degree" },
            { value: "masters", label: "Master's Degree" },
            { value: "phd", label: "PhD / Doctorate" },
            { value: "other", label: "Other" },
          ]} />
        </div>
        <div><FL>University / Institution</FL><TI value={f.institution} onChange={v => u("institution", v)} placeholder="University name" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><FL>Field of Study</FL><TI value={f.fieldOfStudy} onChange={v => u("fieldOfStudy", v)} placeholder="e.g. Computer Science" /></div>
          <div><FL>Graduation Year</FL><TI value={f.gradYear} onChange={v => u("gradYear", v)} placeholder="2021" type="number" /></div>
        </div>
      </div>
    </Shell>
  );
}

// ═══════════════════════════════════════════════════════
// 2. VALUES & LIFESTYLE
// ═══════════════════════════════════════════════════════
const LIFESTYLE_TAGS = ["Non-smoker", "Active / Fitness", "Traveler", "Homebody", "Health-conscious", "Social butterfly", "Foodie", "Early riser", "Night owl", "Pet lover", "Art & Culture", "Tech-savvy", "Minimalist", "Outdoor lover"];

const PERSONALITY_OPTS = ["Introverted", "Extroverted", "Thoughtful", "Energetic", "Humorous", "Calm", "Ambitious", "Nurturing", "Creative", "Structured"];
const MAX_PERSONALITY = 5;

export function ValuesLifestyleSection({ onBack, onSaved }: { onBack: () => void; onSaved?: () => void }) {
  const [f, setF] = useState(() => {
    const p = readProfile();
    return {
      religiosity:      Number(p.religiosity      ?? 3),
      familyImportance: (p.familyImportance as string) || "high",
      smoking:          (p.smoking          as string) || "never",
      drinking:         (p.drinking         as string) || "never",
      diet:             (p.diet             as string) || "no-restriction",
      exercise:         (p.exercise         as string) || "regularly",
      socialStyle:      (p.socialStyle      as string) || "ambivert",
      lifestyle:        (p.lifestyle        as string[]) || [],
      personality:      (p.personality      as string[]) || [],
    };
  });
  const [saved, setSaved] = useState(false);
  const toApiSmoke  = (v: string): "none" | "occasionally" | "regularly" =>
    v === "never" ? "none" : (v === "occasionally" ? "occasionally" : v === "regularly" ? "regularly" : "none");
  const toApiDrink  = (v: string): "none" | "occasionally" | "regularly" =>
    (v === "never" || v === "non-drinker") ? "none" : (v === "socially" ? "occasionally" : v === "regularly" ? "regularly" : "none");
  const s = () => {
    saveProfile({ religiosity: f.religiosity, familyImportance: f.familyImportance, smoking: f.smoking, drinking: f.drinking, diet: f.diet, exercise: f.exercise, socialStyle: f.socialStyle, lifestyle: f.lifestyle, personality: f.personality });
    apiAuth.updateProfile({
      smoking: toApiSmoke(f.smoking),
      drinking: toApiDrink(f.drinking),
      personality_traits: f.personality,
      prayer_frequency: String(f.religiosity),
    }).catch(() => {});
    setSaved(true); toast.success("Changes saved");
    setTimeout(() => { setSaved(false); onSaved ? onSaved() : onBack(); }, 900);
  };
  const u = <K extends keyof typeof f>(k: K, v: typeof f[K]) => setF(p => ({ ...p, [k]: v }));
  const toggleTag = (t: string) => setF(p => ({ ...p, lifestyle: p.lifestyle.includes(t) ? p.lifestyle.filter(x => x !== t) : [...p.lifestyle, t] }));
  const togglePersonality = (t: string) => setF(p => ({
    ...p,
    personality: p.personality.includes(t)
      ? p.personality.filter(x => x !== t)
      : p.personality.length < MAX_PERSONALITY ? [...p.personality, t] : p.personality,
  }));

  return (
    <Shell title="Values & Lifestyle" onBack={onBack} onSave={s} saved={saved}>
      <div className="p-5 space-y-6">
        <Divider title="Values" />

        {/* Religiosity */}
        <div>
          <FL>Spiritual Practice Level</FL>
          <input type="range" min={1} max={5} value={f.religiosity} onChange={e => u("religiosity", parseInt(e.target.value))} className="w-full accent-primary mt-3" />
          <div className="flex justify-between text-muted-foreground mt-2" style={{ fontSize: "0.75rem" }}>
            <span>Secular / None</span>
            <span style={{ fontWeight: 700, color: "var(--primary)" }}>{["","Light","Moderate","Practising","Devout","Very Devout"][f.religiosity]}</span>
            <span>Very Devout</span>
          </div>
        </div>

        {/* Family importance */}
        <div>
          <FL>Family Importance</FL>
          <CardPick value={f.familyImportance as never} onChange={v => u("familyImportance", v)} cols={1} opts={[
            { value: "high", label: "Very Important", desc: "Family is central to my life and decisions" },
            { value: "medium", label: "Important", desc: "I value family time and maintain strong ties" },
            { value: "low", label: "Personal Space First", desc: "I value independence and boundaries" },
          ]} />
        </div>

        <Divider title="Habits" />
        <div className="grid grid-cols-2 gap-4">
          {([
            { k: "smoking", label: "Smoking", opts: [{ value: "never", label: "Never" }, { value: "occasionally", label: "Occasionally" }, { value: "regularly", label: "Regularly" }] },
            { k: "drinking", label: "Alcohol", opts: [{ value: "never", label: "Never" }, { value: "socially", label: "Socially" }, { value: "regularly", label: "Regularly" }] },
            { k: "diet", label: "Diet", opts: [{ value: "no-restriction", label: "No restriction" }, { value: "halal", label: "Halal" }, { value: "kosher", label: "Kosher" }, { value: "vegetarian", label: "Vegetarian" }, { value: "vegan", label: "Vegan" }] },
            { k: "exercise", label: "Exercise", opts: [{ value: "daily", label: "Daily" }, { value: "regularly", label: "3–5×/week" }, { value: "sometimes", label: "Sometimes" }, { value: "rarely", label: "Rarely" }] },
          ] as const).map(({ k, label, opts }) => (
            <div key={k}>
              <FL>{label}</FL>
              <SI value={f[k as keyof typeof f] as string} onChange={v => u(k as keyof typeof f, v as never)} opts={opts as { value: string; label: string }[]} />
            </div>
          ))}
        </div>

        {/* Social style */}
        <div>
          <FL>Social Style</FL>
          <CardPick value={f.socialStyle as never} onChange={v => u("socialStyle", v)} cols={3} opts={[
            { value: "introvert", label: "Introvert", desc: "Recharge alone" },
            { value: "ambivert", label: "Ambivert", desc: "Balance of both" },
            { value: "extrovert", label: "Extrovert", desc: "Energised by people" },
          ]} />
        </div>

        <Divider title="Lifestyle Tags" />
        <p className="text-muted-foreground -mt-1 mb-2" style={{ fontSize: "0.8125rem" }}>Select all that apply — visible on your profile.</p>
        <div className="flex flex-wrap gap-2">
          {LIFESTYLE_TAGS.map(t => {
            const sel = f.lifestyle.includes(t);
            return (
              <button key={t} type="button" onClick={() => toggleTag(t)}
                className={`px-3 py-1.5 rounded-full border-2 transition-all flex items-center gap-1.5 ${
                  sel
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-dashed border-muted-foreground/30 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
                style={{ fontSize: "0.8125rem", fontWeight: sel ? 600 : 400 }}>
                {!sel && <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>+</span>}
                {t}
              </button>
            );
          })}
        </div>

        <Divider title="Personality Traits" />
        <div className="flex items-center justify-between -mt-1 mb-2">
          <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Choose up to {MAX_PERSONALITY} that describe you.</p>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: f.personality.length === MAX_PERSONALITY ? "var(--primary)" : "var(--muted-foreground)" }}>
            {f.personality.length}/{MAX_PERSONALITY}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERSONALITY_OPTS.map(t => {
            const sel = f.personality.includes(t);
            const atMax = f.personality.length >= MAX_PERSONALITY;
            return (
              <button key={t} type="button"
                onClick={() => togglePersonality(t)}
                disabled={!sel && atMax}
                className={`px-3 py-1.5 rounded-full border-2 transition-all flex items-center gap-1.5 ${
                  sel
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : atMax
                      ? "border-border bg-muted text-muted-foreground/40 cursor-not-allowed"
                      : "border-dashed border-muted-foreground/30 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
                style={{ fontSize: "0.8125rem", fontWeight: sel ? 600 : 400 }}>
                {sel
                  ? <Check size={12} className="flex-shrink-0" />
                  : !atMax && <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>+</span>}
                {t}
              </button>
            );
          })}
        </div>
        {f.personality.length === 0 && (
          <p className="text-amber-600 mt-1" style={{ fontSize: "0.75rem" }}>⚠ Select at least one trait — required for profile completion</p>
        )}
      </div>
    </Shell>
  );
}

// ═══════════════════════════════════════════════════════
// 3. LIFE GOALS & TIMELINE
// ═══════════════════════════════════════════════════════
const GOALS_LIST = ["Start a family", "Build a career", "Buy a home", "Travel the world", "Community service", "Entrepreneurship", "Academic growth", "Spiritual growth", "Creative pursuits", "Financial independence"];

export function LifeGoalsSection({ onBack, onSaved }: { onBack: () => void; onSaved?: () => void }) {
  const [f, setF] = useState(() => {
    const p = readProfile();
    return {
      timeline:       (p.marriageTimeline as string) || "1-2years",
      wantsChildren:  (p.wantsChildren    as string) || "yes",
      numChildren:    (p.numChildren      as string) || "2-3",
      careerAmbition: (p.careerAmbition   as string) || "balanced",
      goals:          (p.goals            as string[]) || [],
      note:           (p.goalsNote        as string) || "",
    };
  });
  const [saved, setSaved] = useState(false);
  const s = () => {
    saveProfile({ marriageTimeline: f.timeline, wantsChildren: f.wantsChildren, numChildren: f.numChildren, careerAmbition: f.careerAmbition, goals: f.goals, goalsNote: f.note });
    // Save all relevant fields to backend so data persists across devices
    const childrenPref = f.wantsChildren === "yes"
      ? `yes-${f.numChildren}`
      : f.wantsChildren;
    apiAuth.updateProfile({
      marriage_timeline:     f.timeline,
      children_preference:   childrenPref,
      career_ambition_level: f.careerAmbition,
      interests:             f.goals.length ? f.goals : undefined,
    } as never).catch(() => {});
    setSaved(true); toast.success("Changes saved");
    setTimeout(() => { setSaved(false); onSaved ? onSaved() : onBack(); }, 900);
  };
  const u = <K extends keyof typeof f>(k: K, v: typeof f[K]) => setF(p => ({ ...p, [k]: v }));
  const toggleGoal = (g: string) => setF(p => ({ ...p, goals: p.goals.includes(g) ? p.goals.filter(x => x !== g) : [...p.goals, g] }));

  return (
    <Shell title="Life Goals & Timeline" onBack={onBack} onSave={s} saved={saved}>
      <div className="p-5 space-y-6">
        <Divider title="Marriage Timeline" />
        <div className="space-y-2">
          {[
            { value: "6months", label: "Within 6 months", desc: "I'm ready to commit very soon" },
            { value: "6-12months", label: "6 – 12 months", desc: "I'm actively searching" },
            { value: "1-2years", label: "1 – 2 years", desc: "I'm taking my time" },
            { value: "2plus", label: "No rush — 2+ years", desc: "When the right person comes along" },
          ].map(({ value, label, desc }) => (
            <button key={value} type="button" onClick={() => u("timeline", value)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${f.timeline === value ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/20"}`}>
              <div className="text-left">
                <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: f.timeline === value ? "var(--primary)" : "var(--foreground)" }}>{label}</p>
                <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${f.timeline === value ? "border-primary bg-primary" : "border-border"}`}>
                {f.timeline === value && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>

        <Divider title="Children" />
        <div>
          <FL>Do you want children?</FL>
          <CardPick value={f.wantsChildren as never} onChange={v => u("wantsChildren", v)} cols={2} opts={[
            { value: "yes", label: "Yes" }, { value: "no", label: "No" },
            { value: "open", label: "Open to it" }, { value: "have-children", label: "Already have children" },
          ]} />
        </div>
        {f.wantsChildren === "yes" && (
          <div>
            <FL>Preferred number</FL>
            <CardPick value={f.numChildren as never} onChange={v => u("numChildren", v)} cols={4} opts={[
              { value: "1", label: "1" }, { value: "2-3", label: "2–3" }, { value: "4+", label: "4+" }, { value: "flexible", label: "Flexible" },
            ]} />
          </div>
        )}

        <Divider title="Career & Ambition" />
        <CardPick value={f.careerAmbition as never} onChange={v => u("careerAmbition", v)} cols={1} opts={[
          { value: "high", label: "Highly Ambitious", desc: "Career and professional growth are a top priority" },
          { value: "balanced", label: "Balanced", desc: "Career and family life hold equal importance" },
          { value: "family-first", label: "Family-First", desc: "Home life and family take priority over career" },
        ]} />

        <Divider title="Life Goals" />
        <p className="text-muted-foreground -mt-1 mb-2" style={{ fontSize: "0.8125rem" }}>Select all that resonate — helps us find aligned matches.</p>
        <div className="flex flex-wrap gap-2">
          {GOALS_LIST.map(g => (
            <button key={g} type="button" onClick={() => toggleGoal(g)}
              className={`px-3 py-1.5 rounded-full border transition-all ${f.goals.includes(g) ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30"}`}
              style={{ fontSize: "0.8125rem" }}>
              {g}
            </button>
          ))}
        </div>

        <div>
          <FL opt>Note on your readiness</FL>
          <textarea value={f.note} onChange={e => u("note", e.target.value)}
            placeholder="Anything you'd like matches to know about where you are in your journey…"
            rows={3} className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" style={{ fontSize: "0.9375rem" }} />
        </div>
      </div>
    </Shell>
  );
}

// ═══════════════════════════════════════════════════════
// 4. PARTNER PREFERENCES
// ═══════════════════════════════════════════════════════
const IMP_OPTS = [
  { value: "must-have", label: "Must Have" },
  { value: "important", label: "Important" },
  { value: "nice-to-have", label: "Nice to Have" },
  { value: "not-important", label: "Not Important" },
];

export function PartnerPrefsSection({ onBack, onSaved }: { onBack: () => void; onSaved?: () => void }) {
  const [f, setF] = useState(() => {
    const p = readProfile();
    return {
      ageMin:         Number(p.prefAgeMin      ?? 24),
      ageMax:         Number(p.prefAgeMax      ?? 35),
      location:       (p.prefLocation   as string) || "same-country",
      educationImp:   (p.educationImp   as string) || "important",
      religiosityImp: (p.religiosityImp as string) || "must-have",
      incomeImp:      (p.incomeImp      as string) || "not-important",
      smoking:        (p.prefSmoking    as string) || "non-smoker",
      drinking:       (p.prefDrinking   as string) || "non-drinker",
      children:       (p.prefChildren   as string) || "doesnt-matter",
      nationality:    (p.prefNationality as string) || "open",
      heightMin:      (p.prefHeightMin  as string) || "",
      heightMax:      (p.prefHeightMax  as string) || "",
    };
  });
  const [saved, setSaved] = useState(false);
  const s = () => {
    saveProfile({ prefAgeMin: f.ageMin, prefAgeMax: f.ageMax, prefLocation: f.location, educationImp: f.educationImp, religiosityImp: f.religiosityImp, incomeImp: f.incomeImp, prefSmoking: f.smoking, prefDrinking: f.drinking, prefChildren: f.children, prefNationality: f.nationality, prefHeightMin: f.heightMin, prefHeightMax: f.heightMax });
    apiAuth.updateProfile({
      pref_age_min: f.ageMin,
      pref_age_max: f.ageMax,
      pref_location: f.location,
      pref_nationality: f.nationality,
    }).catch(() => {});
    setSaved(true); toast.success("Changes saved");
    setTimeout(() => { setSaved(false); onSaved ? onSaved() : onBack(); }, 900);
  };
  const u = <K extends keyof typeof f>(k: K, v: typeof f[K]) => setF(p => ({ ...p, [k]: v }));

  return (
    <Shell title="Partner Preferences" onBack={onBack} onSave={s} saved={saved}>
      <div className="p-5 space-y-6">
        <Divider title="Age Range" />
        <div className="space-y-3">
          {(["Min", "Max"] as const).map((lbl, i) => {
            const key = i === 0 ? "ageMin" : "ageMax";
            const val = f[key];
            return (
              <div key={lbl}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>{lbl} age</span>
                  <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--primary)" }}>{val}</span>
                </div>
                <input type="range" min={18} max={70} value={val}
                  onChange={e => u(key, parseInt(e.target.value))} className="w-full accent-primary" />
              </div>
            );
          })}
          <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-2.5 border border-primary/15">
            <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Range</span>
            <span style={{ fontWeight: 700, color: "var(--primary)" }}>{f.ageMin} – {f.ageMax} years old</span>
          </div>
        </div>

        <Divider title="Location" />
        <CardPick value={f.location as never} onChange={v => u("location", v)} cols={3} opts={[
          { value: "same-city", label: "Same City" },
          { value: "same-country", label: "Same Country" },
          { value: "worldwide", label: "Worldwide" },
        ]} />

        <Divider title="Importance Weights" />
        <p className="text-muted-foreground -mt-1 mb-3" style={{ fontSize: "0.8125rem" }}>
          Tell us how important each trait is — this directly shapes your compatibility score.
        </p>
        {[
          { key: "educationImp", label: "Education Level" },
          { key: "religiosityImp", label: "Spiritual Practice Alignment" },
          { key: "incomeImp", label: "Income / Financial Stability" },
        ].map(({ key, label }) => (
          <div key={key} className="pb-5 border-b border-border last:border-0">
            <FL>{label}</FL>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {IMP_OPTS.map(o => (
                <button key={o.value} type="button" onClick={() => u(key as keyof typeof f, o.value as never)}
                  className={`px-3 py-2.5 rounded-xl border text-left transition-all ${f[key as keyof typeof f] === o.value ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/30"}`}
                  style={{ fontSize: "0.8125rem", fontWeight: f[key as keyof typeof f] === o.value ? 700 : 500, color: f[key as keyof typeof f] === o.value ? "var(--primary)" : "var(--foreground)" }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <Divider title="Other Preferences" />
        <div>
          <FL>Smoking</FL>
          <CardPick value={f.smoking as never} onChange={v => u("smoking", v)} cols={1} opts={[
            { value: "non-smoker", label: "Non-smoker only" },
            { value: "occasional-ok", label: "Occasional is fine" },
            { value: "doesnt-matter", label: "Doesn't matter" },
          ]} />
        </div>
        <div>
          <FL>Drinking (Alcohol)</FL>
          <CardPick value={f.drinking as never} onChange={v => u("drinking", v)} cols={1} opts={[
            { value: "non-drinker", label: "Non-drinker only" },
            { value: "social-ok", label: "Social drinking is fine" },
            { value: "doesnt-matter", label: "Doesn't matter" },
          ]} />
        </div>
        <div>
          <FL>Children</FL>
          <CardPick value={f.children as never} onChange={v => u("children", v)} cols={2} opts={[
            { value: "wants-children", label: "Wants children" },
            { value: "has-children-ok", label: "Has children — OK" },
            { value: "no-children", label: "No children preferred" },
            { value: "doesnt-matter", label: "Doesn't matter" },
          ]} />
        </div>
        <div>
          <FL>Nationality</FL>
          <CardPick value={f.nationality as never} onChange={v => u("nationality", v)} cols={2} opts={[
            { value: "same", label: "Same nationality" },
            { value: "open", label: "Open to all" },
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><FL opt>Min Height (cm)</FL><TI value={f.heightMin} onChange={v => u("heightMin", v)} placeholder="e.g. 160" type="number" /></div>
          <div><FL opt>Max Height (cm)</FL><TI value={f.heightMax} onChange={v => u("heightMax", v)} placeholder="e.g. 190" type="number" /></div>
        </div>
      </div>
    </Shell>
  );
}

// ═══════════════════════════════════════════════════════
// 5. PRIVACY & SAFETY
// ═══════════════════════════════════════════════════════
export function PrivacySafetySection({ onBack, plan = "free", onUpgrade }: {
  onBack: () => void;
  plan?: "free" | "basic" | "premium";
  onUpgrade?: () => void;
}) {
  const [vis, setVis] = useState("matches");
  const [msgPerm, setMsgPerm] = useState("matches");
  const [tog, setTog] = useState({ lastActive: true, score: true, receipts: true, showAge: true, showCity: true, twoFa: false });
  const [saved, setSaved] = useState(false);
  const s = () => { setSaved(true); toast.success("Changes saved"); setTimeout(() => setSaved(false), 2500); };
  const t = (k: keyof typeof tog) => setTog(p => ({ ...p, [k]: !p[k] }));

  // Free members get a limited set of controls; advanced privacy controls
  // require an active subscription (Basic or Premium).
  const isPaid = plan !== "free";
  const upgrade = () => { toast("Upgrade to Basic or Premium for advanced privacy controls"); onUpgrade?.(); };

  // Visibility & messaging options that are locked on the free plan.
  const VIS_OPTS = [
    { v: "public",  l: "Visible to everyone",   d: "Any member can view your profile", premium: false },
    { v: "matches", l: "Matches only",           d: "Only compatible matches can see you", premium: false },
    { v: "hidden",  l: "Hidden",                 d: "Profile not shown — you browse only", premium: true },
  ];
  const MSG_OPTS = [
    { v: "matches",  l: "Compatibility matches only", premium: false },
    { v: "verified", l: "Verified members only",      premium: true },
    { v: "nobody",   l: "Nobody (read-only mode)",    premium: true },
  ];

  return (
    <Shell title="Privacy & Safety" onBack={onBack} onSave={s} saved={saved}>
      <div className="p-5">
        {!isPaid && (
          <button onClick={upgrade}
            className="w-full flex items-center gap-3 mb-6 rounded-2xl border border-primary/25 bg-secondary/60 px-4 py-3 text-left hover:border-primary/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <Lock size={16} className="text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>Advanced privacy is a paid feature</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Free plans get essential controls. Upgrade to unlock the full set.</p>
            </div>
            <ChevronRight size={16} className="text-primary" />
          </button>
        )}

        <Divider title="Profile Visibility" />
        <div className="space-y-2 mb-6">
          {VIS_OPTS.map(({ v, l, d, premium }) => {
            const locked = premium && !isPaid;
            return (
              <button key={v} onClick={() => (locked ? upgrade() : setVis(v))}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${vis === v && !locked ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/20"} ${locked ? "opacity-70" : ""}`}>
                <div className="text-left">
                  <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: vis === v && !locked ? "var(--primary)" : "var(--foreground)" }}>{l}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{d}</p>
                </div>
                {locked
                  ? <span className="flex items-center gap-1 text-muted-foreground flex-shrink-0" style={{ fontSize: "0.6875rem", fontWeight: 700 }}><Lock size={12} /> Premium</span>
                  : vis === v && <Check size={15} className="text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        <Divider title="Who Can Message You" />
        <div className="space-y-2 mb-6">
          {MSG_OPTS.map(({ v, l, premium }) => {
            const locked = premium && !isPaid;
            return (
              <button key={v} onClick={() => (locked ? upgrade() : setMsgPerm(v))}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${msgPerm === v && !locked ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/20"} ${locked ? "opacity-70" : ""}`}>
                <span style={{ fontWeight: 500, fontSize: "0.9375rem", color: msgPerm === v && !locked ? "var(--primary)" : "var(--foreground)" }}>{l}</span>
                {locked
                  ? <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: "0.6875rem", fontWeight: 700 }}><Lock size={12} /> Premium</span>
                  : msgPerm === v && <Check size={14} className="text-primary" />}
              </button>
            );
          })}
        </div>

        <Divider title="Privacy Controls" />
        {isPaid ? (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border mb-6">
            {[
              { k: "lastActive", l: "Show last active status",           d: "Others see when you were last online" },
              { k: "score",      l: "Show compatibility score to matches", d: "Matches see your % with them" },
              { k: "receipts",   l: "Read receipts",                      d: "Senders know when you've read their message" },
              { k: "showAge",    l: "Show exact age",                     d: "Display your age on profile" },
              { k: "showCity",   l: "Show city",                          d: "Your city is visible to matches" },
            ].map(({ k, l, d }) => (
              <div key={k} className="px-4">
                <Toggle on={tog[k as keyof typeof tog]} onChange={() => t(k as keyof typeof tog)} label={l} desc={d} />
              </div>
            ))}
          </div>
        ) : (
          <button onClick={upgrade}
            className="w-full bg-card rounded-2xl border border-border p-5 mb-6 text-center hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Lock size={20} className="text-primary" />
            </div>
            <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Granular privacy controls</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
              Control last-active status, read receipts, compatibility-score visibility, and what shows on your profile — available on Basic &amp; Premium.
            </p>
            <span className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
              <Star size={14} /> Upgrade to unlock
            </span>
          </button>
        )}

        <Divider title="Security" />
        <div className="bg-card rounded-2xl border border-border px-4 divide-y divide-border mb-2">
          <Toggle on={tog.twoFa} onChange={() => t("twoFa")} label="Two-Factor Authentication" desc="Require a code on every login" />
        </div>
        <button onClick={() => setShowChangePw(true)}
          className="w-full flex items-center justify-between bg-card rounded-xl border border-border px-4 py-3.5 mb-6 hover:border-primary/20 transition-all text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <KeyRound size={15} className="text-primary" />
            </div>
            <div>
              <p style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Change Password</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Update your account password</p>
            </div>
          </div>
          <ChevronRight size={15} className="text-muted-foreground" />
        </button>

        <Divider title="Blocked Users" />
        <div className="bg-muted rounded-xl p-4 text-center text-muted-foreground mb-6" style={{ fontSize: "0.875rem" }}>
          No blocked users.
        </div>

        <button className="w-full flex items-center justify-between bg-card rounded-xl border border-border px-4 py-3.5 hover:border-primary/20 transition-all">
          <div className="text-left">
            <p style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Download My Data</p>
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Export a copy of all your Ma3moni data</p>
          </div>
          <Download size={16} className="text-muted-foreground" />
        </button>
      </div>
    </Shell>
  );
}

// ═══════════════════════════════════════════════════════
// Support & Legal document content
// ═══════════════════════════════════════════════════════
type DocKey =
  | "help" | "contact" | "feedback" | "rate"
  | "privacy" | "terms" | "guidelines";

// Simple content block types for rendering.
type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "li"; items: string[] }
  | { type: "qa"; q: string; a: string };

const DOC_TITLES: Record<DocKey, string> = {
  help: "Help Centre",
  contact: "Contact Support",
  feedback: "Send Feedback",
  rate: "Rate Ma3moni",
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  guidelines: "Community Guidelines",
};

const DOC_CONTENT: Partial<Record<DocKey, Block[]>> = {
  help: [
    { type: "p", text: "Find quick answers to the most common questions. Still stuck? Reach us from Contact Support." },
    { type: "qa", q: "How are my matches chosen?", a: "Matches are ranked by a compatibility score built from your values, lifestyle, life goals, and partner preferences — not endless swiping. Higher scores mean stronger alignment on what matters for marriage." },
    { type: "qa", q: "Who can see my full profile?", a: "Free members see a limited preview of their matches. Members on a Basic or Premium plan can view full profiles of their suggested matches, and premium members unlock advanced filters." },
    { type: "qa", q: "How do I verify my profile?", a: "Go to Profile → Verification and complete the 3-step ID check. Verified members earn a badge and rank higher in match visibility." },
    { type: "qa", q: "How do I cancel my subscription?", a: "Open Profile → Subscription → Manage Plan → Cancel. Your benefits remain active until the end of the current billing period." },
  ],
  contact: [
    { type: "p", text: "Our support team is here to help with account, matching, billing, and safety questions." },
    { type: "h", text: "Email" },
    { type: "p", text: "support@ma3moni.com — we reply within 24 hours (Sun–Thu)." },
    { type: "h", text: "Live chat" },
    { type: "p", text: "Available in-app from 9:00 AM to 9:00 PM (GST), 7 days a week." },
    { type: "h", text: "Safety & urgent concerns" },
    { type: "p", text: "For harassment, safety, or account-security issues, email safety@ma3moni.com and we will prioritise your case." },
  ],
  feedback: [
    { type: "p", text: "We build Ma3moni around our community. Tell us what's working and what we can improve — every message is read by the product team." },
  ],
  rate: [
    { type: "p", text: "Enjoying Ma3moni? A rating helps other intentional singles find us. It only takes a moment." },
  ],
  privacy: [
    { type: "p", text: "Last updated: July 2026. This policy explains what we collect, why, and the control you have over your data." },
    { type: "h", text: "Information we collect" },
    { type: "li", items: [
      "Account details you provide (name, email, date of birth, gender).",
      "Profile content — photos, bio, values, lifestyle, and partner preferences.",
      "Usage data such as matches viewed, messages sent, and device information.",
    ] },
    { type: "h", text: "How we use it" },
    { type: "li", items: [
      "To compute compatibility scores and suggest relevant matches.",
      "To keep the community safe through moderation and verification.",
      "To process subscriptions and prevent fraud.",
    ] },
    { type: "h", text: "Your rights" },
    { type: "p", text: "You can export or delete your data at any time from Settings → Download My Data or Profile → Account Status. We never sell your personal data to third parties." },
    { type: "h", text: "Data retention" },
    { type: "p", text: "Deactivated accounts are held for 90 days for recovery, then permanently deleted." },
  ],
  terms: [
    { type: "p", text: "Last updated: July 2026. By creating an account you agree to these terms." },
    { type: "h", text: "Eligibility" },
    { type: "p", text: "You must be at least 18 years old and legally able to marry. Ma3moni is intended for individuals genuinely seeking marriage." },
    { type: "h", text: "Acceptable use" },
    { type: "li", items: [
      "Provide truthful information and use your own photos.",
      "Treat other members with respect and honesty.",
      "Do not solicit, harass, scam, or promote other services.",
    ] },
    { type: "h", text: "Subscriptions & billing" },
    { type: "p", text: "Paid plans renew automatically until cancelled. Fees are non-refundable except where required by law." },
    { type: "h", text: "Termination" },
    { type: "p", text: "We may suspend or remove accounts that violate these terms or our Community Guidelines." },
  ],
  guidelines: [
    { type: "p", text: "Ma3moni is a respectful, marriage-first community. These guidelines keep it safe and sincere for everyone." },
    { type: "h", text: "Do" },
    { type: "li", items: [
      "Be genuine — represent yourself honestly.",
      "Communicate with respect and modesty.",
      "Report anyone who makes you uncomfortable.",
    ] },
    { type: "h", text: "Don't" },
    { type: "li", items: [
      "Share explicit, misleading, or offensive content.",
      "Ask for money or promote external platforms.",
      "Create fake or duplicate profiles.",
    ] },
    { type: "p", text: "Violations may lead to warnings, suspension, or a permanent ban. Repeat or severe breaches are escalated to our safety team." },
  ],
};

function DocView({ docKey, onBack }: { docKey: DocKey; onBack: () => void }) {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const blocks = DOC_CONTENT[docKey] ?? [];

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <button onClick={onBack} aria-label="Go back" className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>{DOC_TITLES[docKey]}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {blocks.map((b, i) => {
          if (b.type === "h") return <p key={i} style={{ fontWeight: 700, fontSize: "0.9375rem" }} className="pt-1">{b.text}</p>;
          if (b.type === "p") return <p key={i} className="text-muted-foreground" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>{b.text}</p>;
          if (b.type === "li") return (
            <ul key={i} className="space-y-1.5">
              {b.items.map((it, j) => (
                <li key={j} className="flex items-start gap-2 text-muted-foreground" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                  <Check size={14} className="text-primary flex-shrink-0 mt-0.5" /> {it}
                </li>
              ))}
            </ul>
          );
          // qa
          return (
            <div key={i} className="bg-card rounded-xl border border-border p-4">
              <p style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 4 }}>{b.q}</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.8125rem", lineHeight: 1.65 }}>{b.a}</p>
            </div>
          );
        })}

        {/* Feedback form */}
        {docKey === "feedback" && (
          <div className="space-y-3">
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={5}
              placeholder="Share your thoughts, ideas, or issues…"
              className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              style={{ fontSize: "0.9rem" }}
            />
            <button
              onClick={() => { if (!feedback.trim()) { toast.error("Please write your feedback first"); return; } toast.success("Thank you! Your feedback has been sent."); setFeedback(""); }}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              style={{ fontSize: "0.9375rem", fontWeight: 700 }}
            >
              Send Feedback
            </button>
          </div>
        )}

        {/* Rating */}
        {docKey === "rate" && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 my-4">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setRating(n)} aria-label={`Rate ${n} stars`} className="transition-transform active:scale-90">
                  <Star size={34} className={n <= rating ? "text-amber-400" : "text-muted-foreground"} fill={n <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            <button
              onClick={() => { if (!rating) { toast.error("Please choose a rating"); return; } toast.success(rating >= 4 ? "Thank you! Redirecting you to the app store…" : "Thanks — we'll use this to improve."); }}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              style={{ fontSize: "0.9375rem", fontWeight: 700 }}
            >
              Submit Rating
            </button>
          </div>
        )}

        {/* Contact quick actions */}
        {docKey === "contact" && (
          <a href="mailto:support@ma3moni.com"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            style={{ fontSize: "0.9375rem", fontWeight: 700 }}>
            Email Support
          </a>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 6. SETTINGS
// ═══════════════════════════════════════════════════════
function ChangePasswordView({ onBack }: { onBack: () => void }) {
  const [f, setF] = useState({ oldPw: "", newPw: "", confirmPw: "" });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError("");
    if (!f.oldPw) { setError("Enter your current password."); return; }
    if (f.newPw.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (f.newPw !== f.confirmPw) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await apiAuth.changePassword(f.oldPw, f.newPw);
      setDone(true);
      toast.success("Password changed successfully");
      setTimeout(onBack, 1500);
    } catch (err: unknown) {
      const msg = (err as { data?: { old_password?: string[]; detail?: string } })?.data;
      setError(msg?.old_password?.[0] ?? msg?.detail ?? "Failed to change password. Check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <button onClick={onBack} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Change Password</h3>
        <div style={{ width: 32 }} />
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <FL>Current Password</FL>
          <div className="relative">
            <input type={showOld ? "text" : "password"} value={f.oldPw} onChange={e => { setF(p => ({ ...p, oldPw: e.target.value })); setError(""); }}
              placeholder="Enter current password" autoComplete="current-password"
              className="w-full px-4 py-3.5 pr-12 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              style={{ fontSize: "0.9375rem" }} />
            <button type="button" onClick={() => setShowOld(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <FL>New Password</FL>
          <div className="relative">
            <input type={showNew ? "text" : "password"} value={f.newPw} onChange={e => { setF(p => ({ ...p, newPw: e.target.value })); setError(""); }}
              placeholder="Min. 8 characters" autoComplete="new-password"
              className="w-full px-4 py-3.5 pr-12 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              style={{ fontSize: "0.9375rem" }} />
            <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <FL>Confirm New Password</FL>
          <input type={showNew ? "text" : "password"} value={f.confirmPw} onChange={e => { setF(p => ({ ...p, confirmPw: e.target.value })); setError(""); }}
            placeholder="Re-enter new password" autoComplete="new-password"
            className="w-full px-4 py-3.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            style={{ fontSize: "0.9375rem" }} />
        </div>
        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertTriangle size={15} className="text-destructive flex-shrink-0 mt-0.5" />
            <p style={{ fontSize: "0.875rem", color: "var(--destructive)" }}>{error}</p>
          </div>
        )}
        <button
          onClick={submit}
          disabled={loading || done}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ fontWeight: 700, fontSize: "1rem" }}>
          {loading
            ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Updating…</>
            : done
              ? <><Check size={16} /> Changed!</>
              : <><KeyRound size={16} /> Change Password</>}
        </button>
        <p className="text-muted-foreground text-center" style={{ fontSize: "0.8125rem" }}>
          You'll stay logged in after changing your password.
        </p>
      </div>
    </div>
  );
}

export function AppSettingsSection({ onBack }: { onBack: () => void }) {
  const [openDoc, setOpenDoc] = useState<DocKey | null>(null);
  const [showChangePw, setShowChangePw] = useState(false);
  const [notifs, setNotifs] = useState({ matches: true, messages: true, approvals: true, promos: false, digest: true, push: true });
  const [lang, setLang] = useState(getStoredLanguage);
  const [theme, setTheme] = useState<ThemePref>(getStoredTheme);
  const [saved, setSaved] = useState(false);

  // Theme + language go through the shared preferences module (single source
  // of truth, also used by PWAProvider on boot) so the swap is reflected
  // immediately and consistently across the whole app.
  const handleTheme = (value: string) => {
    const t = value as ThemePref;
    setTheme(t);
    applyThemePref(t);
    toast.success(`${value.charAt(0).toUpperCase() + value.slice(1)} theme applied`);
  };
  const handleLanguage = (value: string) => {
    setLang(value);
    applyLanguagePref(value);
    toast.success(isRTL(value) ? "Right-to-left layout enabled" : "Language updated");
  };
  const s = () => { setSaved(true); toast.success("Changes saved"); setTimeout(() => setSaved(false), 2500); };
  const tn = (k: keyof typeof notifs) => setNotifs(p => ({ ...p, [k]: !p[k] }));

  // Sub-views that take over the section
  if (openDoc) return <DocView docKey={openDoc} onBack={() => setOpenDoc(null)} />;
  if (showChangePw) return <ChangePasswordView onBack={() => setShowChangePw(false)} />;

  return (
    <Shell title="Settings" onBack={onBack} onSave={s} saved={saved}>
      <div className="p-5">
        <Divider title="Notifications" />
        <div className="bg-card rounded-2xl border border-border divide-y divide-border mb-6">
          {[
            { k: "push",      l: "Push Notifications",    d: "Master switch for all push alerts" },
            { k: "matches",   l: "New Matches",            d: "When a new compatibility match is found" },
            { k: "messages",  l: "Messages",               d: "When someone sends you a message" },
            { k: "approvals", l: "Profile Updates",        d: "Photo approvals and account changes" },
            { k: "digest",    l: "Weekly Summary",         d: "A weekly recap of matches and activity" },
            { k: "promos",    l: "Promotions & Offers",    d: "Subscription deals and platform news" },
          ].map(({ k, l, d }) => (
            <div key={k} className="px-4">
              <Toggle on={notifs[k as keyof typeof notifs]} onChange={() => tn(k as keyof typeof notifs)} label={l} desc={d} />
            </div>
          ))}
        </div>

        <Divider title="Display" />
        <div className="space-y-4 mb-6">
          <div>
            <FL>Language</FL>
            <SI value={lang} onChange={handleLanguage} opts={[
              { value: "en", label: "English" }, { value: "ar", label: "Arabic — العربية" },
              { value: "fr", label: "French — Français" }, { value: "tr", label: "Turkish — Türkçe" },
            ]} />
          </div>
          <div>
            <FL>Theme</FL>
            <CardPick value={theme as never} onChange={handleTheme} cols={3} opts={[
              { value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" },
            ]} />
          </div>
        </div>

        <Divider title="Support" />
        <div className="space-y-2 mb-6">
          {([
            { key: "help", label: "Help Centre" },
            { key: "contact", label: "Contact Support" },
            { key: "feedback", label: "Send Feedback" },
            { key: "rate", label: "Rate Ma3moni" },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setOpenDoc(key)} className="w-full flex items-center justify-between bg-card rounded-xl border border-border px-4 py-3.5 hover:border-primary/20 transition-all text-left">
              <span style={{ fontSize: "0.9375rem", fontWeight: 500 }}>{label}</span>
              <ChevronRight size={15} className="text-muted-foreground" />
            </button>
          ))}
        </div>

        <Divider title="Legal" />
        <div className="space-y-2">
          {([
            { key: "privacy", label: "Privacy Policy" },
            { key: "terms", label: "Terms of Service" },
            { key: "guidelines", label: "Community Guidelines" },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setOpenDoc(key)} className="w-full flex items-center justify-between bg-card rounded-xl border border-border px-4 py-3.5 hover:border-primary/20 transition-all text-left">
              <span style={{ fontSize: "0.9375rem", fontWeight: 500 }}>{label}</span>
              <ChevronRight size={15} className="text-muted-foreground" />
            </button>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-8" style={{ fontSize: "0.8125rem" }}>
          Ma3moni v2.1.0 · Built for intentional relationships
        </p>
      </div>
    </Shell>
  );
}

// ═══════════════════════════════════════════════════════
// 7. FOUND A PARTNER
// ═══════════════════════════════════════════════════════
export function FoundPartnerSection({ onBack, onComplete }: { onBack: () => void; onComplete?: () => void }) {
  const [step, setStep] = useState<"intro" | "form" | "done">("intro");
  const [f, setF] = useState({ partnerName: "", howMet: "match", story: "", share: true, pauseAfter: true });

  if (step === "done") return (
    <div className="flex flex-col h-full bg-background items-center justify-center p-8 text-center">
      <div style={{ fontSize: "3.5rem", marginBottom: "1.25rem" }}>🎉</div>
      <h2 style={{ fontWeight: 900, fontSize: "1.75rem", letterSpacing: "-0.025em" }}>Congratulations!</h2>
      <p className="text-muted-foreground mt-3 mb-8 max-w-xs" style={{ fontSize: "1rem", lineHeight: 1.7 }}>
        Your story has been recorded. We're honoured Ma3moni played a part. Wishing you both a lifetime of happiness.
      </p>
      {f.pauseAfter && (
        <div className="w-full bg-secondary rounded-2xl border border-primary/20 p-4 mb-6">
          <div className="flex items-center gap-2 text-primary justify-center">
            <PauseCircle size={15} />
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Your profile has been paused</span>
          </div>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem" }}>Reactivate anytime from Settings.</p>
        </div>
      )}
      <button onClick={() => { onComplete?.(); onBack(); }} className="bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl hover:bg-primary/90 transition-all" style={{ fontWeight: 700, fontSize: "1rem" }}>
        Back to Profile
      </button>
    </div>
  );

  if (step === "form") return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <button onClick={() => setStep("intro")} className="p-1 text-muted-foreground hover:text-foreground"><ChevronLeft size={22} /></button>
        <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Tell Us Your Story</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <FL opt>Your partner's first name</FL>
          <TI value={f.partnerName} onChange={v => setF(p => ({ ...p, partnerName: v }))} placeholder="e.g. Aisha" />
        </div>
        <div>
          <FL>How did you connect?</FL>
          <CardPick value={f.howMet as never} onChange={v => setF(p => ({ ...p, howMet: v }))} cols={2} opts={[
            { value: "match", label: "Via compatibility match" },
            { value: "referral", label: "Via referral" },
          ]} />
        </div>
        <div>
          <FL opt>Your story</FL>
          <textarea value={f.story} onChange={e => setF(p => ({ ...p, story: e.target.value }))}
            placeholder="How did you know they were the one? We'd love to hear…" rows={4}
            className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" style={{ fontSize: "0.9375rem" }} />
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.75rem" }}>Stories may be featured on our success stories page (names kept private).</p>
        </div>
        <div className="bg-card rounded-2xl border border-border divide-y divide-border">
          <div className="px-4">
            <Toggle on={f.share} onChange={v => setF(p => ({ ...p, share: v }))} label="Share story on Ma3moni" desc="Your story (anonymised) may inspire others" />
          </div>
          <div className="px-4">
            <Toggle on={f.pauseAfter} onChange={v => setF(p => ({ ...p, pauseAfter: v }))} label="Pause my profile after submitting" desc="Hides your profile from new matches" />
          </div>
        </div>
        <button onClick={() => setStep("done")}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl hover:bg-primary/90 transition-all"
          style={{ fontWeight: 700, fontSize: "1rem" }}>
          <Heart size={17} className="fill-white" /> Submit My Story
        </button>
      </div>
    </div>
  );

  // Intro
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <button onClick={onBack} className="p-1 text-muted-foreground hover:text-foreground"><ChevronLeft size={22} /></button>
        <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Found a Partner</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center text-center">
        <div style={{ fontSize: "3rem", marginTop: "1rem", marginBottom: "1.25rem" }}>💑</div>
        <h2 style={{ fontWeight: 900, fontSize: "1.625rem", letterSpacing: "-0.025em" }}>Did you find your partner?</h2>
        <p className="text-muted-foreground mt-3 mb-7" style={{ fontSize: "1rem", lineHeight: 1.7, maxWidth: "280px" }}>
          If you found your match on Ma3moni, we'd love to know. Let us close this chapter with you.
        </p>
        <div className="w-full space-y-3 mb-8">
          {[
            { emoji: "💑", title: "Record your success", desc: "Tell us a little about your journey together" },
            { emoji: "📖", title: "Inspire others", desc: "Your story (anonymised) helps the next person" },
            { emoji: "⏸️", title: "Pause your profile", desc: "We'll remove you from active matching" },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="flex items-start gap-4 text-left bg-card rounded-2xl border border-border p-4">
              <span style={{ fontSize: "1.5rem" }}>{emoji}</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{title}</p>
                <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setStep("form")}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl hover:bg-primary/90 transition-all active:scale-[0.98]"
          style={{ fontWeight: 700, fontSize: "1rem" }}>
          <Heart size={17} className="fill-white" /> Yes, I Found My Partner
        </button>
        <button onClick={onBack} className="mt-3 text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "0.875rem" }}>
          Not yet — back to profile
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 8. DEACTIVATE / DELETE
// ═══════════════════════════════════════════════════════
export function DeactivateSection({ onBack, onSignOut }: { onBack: () => void; onSignOut: () => void }) {
  const [step, setStep] = useState<"menu" | "pause" | "deactivate" | "delete">("menu");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState<"pause" | "deactivate" | null>(null);

  if (done === "pause") return (
    <div className="flex flex-col h-full bg-background items-center justify-center p-8 text-center">
      <PauseCircle size={48} className="text-primary mb-5" />
      <h2 style={{ fontWeight: 800, fontSize: "1.5rem" }}>Profile Paused</h2>
      <p className="text-muted-foreground mt-2 mb-6" style={{ fontSize: "0.9375rem" }}>Your profile is hidden. Reactivate anytime from Settings.</p>
      <button onClick={onBack} className="bg-primary text-primary-foreground px-7 py-3.5 rounded-2xl hover:bg-primary/90 transition-all" style={{ fontWeight: 700 }}>Done</button>
    </div>
  );

  if (done === "deactivate") return (
    <div className="flex flex-col h-full bg-background items-center justify-center p-8 text-center">
      <UserX size={48} className="text-muted-foreground mb-5" />
      <h2 style={{ fontWeight: 800, fontSize: "1.5rem" }}>Account Deactivated</h2>
      <p className="text-muted-foreground mt-2 mb-6" style={{ fontSize: "0.9375rem" }}>Your account is deactivated. Data retained for 90 days.</p>
      <button onClick={onSignOut} className="bg-primary text-primary-foreground px-7 py-3.5 rounded-2xl hover:bg-primary/90 transition-all" style={{ fontWeight: 700 }}>Sign Out</button>
    </div>
  );

  const goBack = () => step === "menu" ? onBack() : setStep("menu");

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <button onClick={goBack} className="p-1 text-muted-foreground hover:text-foreground"><ChevronLeft size={22} /></button>
        <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>
          {step === "menu" ? "Account Status" : step === "pause" ? "Pause Profile" : step === "deactivate" ? "Deactivate Account" : "Delete Account"}
        </h3>
      </div>

      {step === "menu" && (
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <p className="text-muted-foreground mb-2" style={{ fontSize: "0.9375rem" }}>Choose what you'd like to do with your account.</p>
          {[
            { key: "pause", color: "#4A8DB8", icon: <PauseCircle size={20} />, title: "Pause Profile", desc: "Hide your profile temporarily. Account and data preserved — reactivate anytime." },
            { key: "deactivate", color: "#C5733F", icon: <UserX size={20} />, title: "Deactivate Account", desc: "Suspend your account. Profile removed. Data held for 90 days then deleted." },
            { key: "delete", color: "#D41F3A", icon: <Trash2 size={20} />, title: "Delete Permanently", desc: "Permanently delete your account and all data. Cannot be undone." },
          ].map(({ key, color, icon, title, desc }) => (
            <button key={key} onClick={() => setStep(key as never)}
              className="w-full flex items-start gap-4 bg-card rounded-2xl border border-border p-5 hover:border-current/20 transition-all text-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: color + "18", color }}>
                {icon}
              </div>
              <div className="flex-1">
                <p style={{ fontWeight: 700, fontSize: "1rem", color }}>{title}</p>
                <p className="text-muted-foreground mt-1" style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>{desc}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground mt-1 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {step === "pause" && (
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#1d4ed8" }}>Your profile will be hidden</p>
            <p className="text-blue-700 mt-1" style={{ fontSize: "0.875rem" }}>No new matches or messages — but data is fully preserved. Come back anytime.</p>
          </div>
          <div>
            <FL opt>Why are you pausing?</FL>
            <SI value={reason} onChange={setReason} opts={[
              { value: "break", label: "Taking a break" },
              { value: "someone", label: "Getting to know someone" },
              { value: "busy", label: "Too busy right now" },
              { value: "other", label: "Other reason" },
            ]} />
          </div>
          <button onClick={() => setDone("pause")} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all" style={{ fontWeight: 700, fontSize: "1rem" }}>
            Pause My Profile
          </button>
          <button onClick={() => setStep("menu")} className="w-full text-center text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "0.875rem" }}>Cancel</button>
        </div>
      )}

      {step === "deactivate" && (
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-amber-800 mb-1">
              <AlertTriangle size={15} />
              <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>This will suspend your account</span>
            </div>
            <p className="text-amber-700" style={{ fontSize: "0.875rem" }}>Profile, matches, and messages are removed. Data held 90 days before permanent deletion.</p>
          </div>
          <div>
            <FL>Reason for deactivating</FL>
            <SI value={reason} onChange={setReason} opts={[
              { value: "found-partner", label: "Found a partner" },
              { value: "not-ready", label: "Not ready for marriage yet" },
              { value: "not-satisfied", label: "Not satisfied with the platform" },
              { value: "privacy", label: "Privacy concerns" },
              { value: "other", label: "Other" },
            ]} />
          </div>
          <button onClick={() => setDone("deactivate")} className="w-full py-4 rounded-2xl bg-amber-500 text-white hover:bg-amber-600 transition-all" style={{ fontWeight: 700, fontSize: "1rem" }}>
            Deactivate My Account
          </button>
          <button onClick={() => setStep("menu")} className="w-full text-center text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "0.875rem" }}>Cancel</button>
        </div>
      )}

      {step === "delete" && (
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-red-800 mb-1">
              <AlertTriangle size={15} />
              <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Permanent — cannot be undone</span>
            </div>
            <p className="text-red-700" style={{ fontSize: "0.875rem" }}>All data — profile, matches, messages, photos, subscriptions — will be permanently deleted.</p>
          </div>
          <div>
            <FL>Type DELETE to confirm</FL>
            <TI value={confirm} onChange={setConfirm} placeholder="DELETE" />
          </div>
          <button disabled={confirm !== "DELETE"} onClick={onSignOut}
            className="w-full py-4 rounded-2xl bg-destructive text-white hover:bg-destructive/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontWeight: 700, fontSize: "1rem" }}>
            Permanently Delete Account
          </button>
          <button onClick={() => setStep("menu")} className="w-full text-center text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "0.875rem" }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

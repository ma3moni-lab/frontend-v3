import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Check, Heart, X, RefreshCw, ChevronDown } from "lucide-react";

// ── Country list (ISO 3166-1 alpha-2 sorted by name) ──────────────────────────
const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin",
  "Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi",
  "Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia",
  "Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica",
  "Dominican Republic","East Timor","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia",
  "Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece",
  "Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India",
  "Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya",
  "Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein",
  "Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands",
  "Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco",
  "Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria",
  "North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea",
  "Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis",
  "Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia",
  "Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia",
  "South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland",
  "Syria","Taiwan","Tajikistan","Tanzania","Thailand","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey",
  "Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay",
  "Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

// ── Ethnicity list ─────────────────────────────────────────────────────────────
const ETHNICITIES = [
  "Arab","African","African-American","Amazigh/Berber","Asian","Black British","Caribbean","Chinese",
  "East African","Filipino","Hausa","Igbo","Indian","Iranian/Persian","Kurdish","Malay","Mixed",
  "North African","Pakistani","Somali","South Asian","Southeast Asian","Turkish","West African","Yoruba",
  "Other",
];

// ── Dropdown select helper ─────────────────────────────────────────────────────
function SelectInput({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: string[]; placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none px-4 py-3.5 pr-10 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        style={{ fontSize: "0.9375rem" }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}

const SAVE_KEY = "ma3moni_onboarding_progress";

function validateStep(step: number, form: FormState): string | null {
  if (step === 1) {
    if (!form.firstName.trim()) return "Please enter your first name.";
    if (!form.lastName.trim())  return "Please enter your last name.";
    if (!form.birthYear || isNaN(+form.birthYear) || +form.birthYear < 1950 || +form.birthYear > 2006)
      return "Please enter a valid birth year (1950–2006).";
    if (!form.gender) return "Please select your gender.";
  }
  if (step === 2) {
    if (!form.nationality)    return "Please select your nationality.";
    if (!form.country.trim()) return "Please enter your country of residence.";
    if (!form.city.trim())    return "Please enter your city.";
    if (!form.education)      return "Please select your education level.";
  }
  if (step === 3 && !form.familyImportance) return "Please select how important family is to you.";
  if (step === 6 && !form.marriageTimeline) return "Please select your marriage timeline.";
  if (step === 7 && !form.partnerLocation)  return "Please select a location preference.";
  return null;
}

interface OnboardingProps {
  onComplete: () => void;
  onBack: () => void;
}

const TOTAL_STEPS = 7;

type Gender = "male" | "female";
type EducationLevel = "high-school" | "bachelors" | "masters" | "phd" | "other";
type MarriageTimeline = "6months" | "6-12months" | "1-2years" | "2plus";
type CommunicationStyle = "verbal" | "written" | "quality-time" | "mixed";

const educationLabels: Record<EducationLevel, string> = {
  "high-school": "High School",
  "bachelors": "Bachelor's Degree",
  "masters": "Master's Degree",
  "phd": "PhD / Doctorate",
  "other": "Other",
};

const timelineLabels: Record<MarriageTimeline, string> = {
  "6months": "Within 6 months",
  "6-12months": "6 – 12 months",
  "1-2years": "1 – 2 years",
  "2plus": "No rush, 2+ years",
};

const lifestyleOptions = ["Non-smoker", "Active / Fitness", "Traveler", "Homebody", "Social butterfly", "Health-conscious", "Tech-savvy", "Art & Culture"];
const personalityOptions = ["Introverted", "Extroverted", "Thoughtful", "Energetic", "Humorous", "Calm", "Ambitious", "Nurturing", "Creative", "Structured"];
const lifeGoalOptions = ["Start a family", "Build a career", "Travel the world", "Own a home", "Community service", "Entrepreneurship", "Academic growth", "Spiritual growth"];

type BloodGroup = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
type Genotype   = "AA" | "AS" | "AC" | "SS" | "SC" | "CC";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENOTYPES:   Genotype[]   = ["AA", "AS", "AC", "SS", "SC", "CC"];

interface FormState {
  firstName: string;
  lastName: string;
  birthYear: string;
  gender: Gender | "";
  nationality: string;
  ethnicity: string;
  bloodGroup: BloodGroup | "";
  genotype: Genotype | "";
  country: string;
  city: string;
  education: EducationLevel | "";
  profession: string;
  religiosity: number;
  familyImportance: "high" | "medium" | "low" | "";
  communicationStyle: CommunicationStyle | "";
  lifestyle: string[];
  personality: string[];
  lifeGoals: string[];
  careerAmbition: "high" | "balanced" | "low" | "";
  marriageTimeline: MarriageTimeline | "";
  partnerAgeMin: number;
  partnerAgeMax: number;
  partnerLocation: "same-city" | "same-country" | "worldwide" | "";
  educationImportance: "must-have" | "important" | "nice-to-have" | "not-important" | "";
}

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  birthYear: "",
  gender: "",
  nationality: "",
  ethnicity: "",
  bloodGroup: "",
  genotype: "",
  country: "",
  city: "",
  education: "",
  profession: "",
  religiosity: 3,
  familyImportance: "",
  communicationStyle: "",
  lifestyle: [],
  personality: [],
  lifeGoals: [],
  careerAmbition: "",
  marriageTimeline: "",
  partnerAgeMin: 24,
  partnerAgeMax: 35,
  partnerLocation: "",
  educationImportance: "",
};

const STEP_LABELS = [
  "About You",
  "Location",
  "Faith & Family",
  "Lifestyle",
  "Personality",
  "Goals & Timeline",
  "Preferences",
];

function ProgressBar({ step, total }: { step: number; total: number }) {
  const label = STEP_LABELS[step - 1] ?? "";
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Step {step} of {total}</span>
          {label && (
            <>
              <span className="text-muted-foreground" style={{ fontSize: "0.8125rem", opacity: 0.5 }}>·</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{label}</span>
            </>
          )}
        </div>
        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--primary)" }}>{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
      <div className="flex mt-3 gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= step - 1 ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-foreground mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
      style={{ fontSize: "0.9375rem" }}
    />
  );
}

function CardSelect<T extends string>({
  value, onChange, options, cols = 2
}: {
  value: T | ""; onChange: (v: T) => void; options: { value: T; label: string; desc?: string }[]; cols?: number;
}) {
  return (
    <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`p-4 rounded-xl border text-left transition-all ${value === opt.value ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/30"}`}
        >
          <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: value === opt.value ? "var(--primary)" : "var(--foreground)" }}>
            {opt.label}
          </div>
          {opt.desc && <div className="text-muted-foreground mt-0.5" style={{ fontSize: "0.8125rem" }}>{opt.desc}</div>}
        </button>
      ))}
    </div>
  );
}

function MultiSelect({ value = [], onChange, options }: { value?: string[]; onChange: (v: string[]) => void; options: string[] }) {
  const safe = value ?? [];
  const toggle = (opt: string) => {
    onChange(safe.includes(opt) ? safe.filter(v => v !== opt) : [...safe, opt]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-4 py-2 rounded-full border transition-all ${safe.includes(opt) ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:border-primary/30 text-foreground"}`}
          style={{ fontSize: "0.875rem" }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function Onboarding({ onComplete, onBack }: OnboardingProps) {
  const savedRaw = (() => { try { return JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null"); } catch { return null; } })();
  const isResuming = savedRaw && savedRaw.step > 1;

  const [step, setStep]       = useState<number>(savedRaw?.step ?? 1);
  // Merge saved form with initialForm so any new array fields added later
  // always start as [] rather than undefined if the save pre-dates them.
  const [form, setForm] = useState<FormState>(() => {
    if (!savedRaw?.form) return initialForm;
    return { ...initialForm, ...savedRaw.form };
  });
  const [completed, setCompleted] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [showResumeBanner, setShowResumeBanner] = useState(isResuming);

  const persist = (newStep: number, newForm: FormState) => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ step: newStep, form: newForm })); } catch {}
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    setError(null);
    persist(step, updated);
  };

  const next = () => {
    const err = validateStep(step, form);
    if (err) { setError(err); return; }
    setError(null);
    if (step < TOTAL_STEPS) {
      setDirection("forward");
      const n = step + 1; setStep(n); persist(n, form);
    } else {
      const fullName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ");
      const saved = { ...form, fullName };
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ step: TOTAL_STEPS, form: saved })); } catch {}

      // Push to backend — best effort, non-blocking
      import("../../lib/api").then(({ auth: apiAuth }) => {
        const payload: Record<string, unknown> = {
          full_name:            fullName,
          gender:               form.gender,
          nationality:          form.nationality,
          ethnicity:            form.ethnicity,
          location_country:     form.country,
          location_city:        form.city,
          profession:           form.profession,
          education:            form.education,
          // Additional fields collected during onboarding
          date_of_birth:        form.birthYear ? `${form.birthYear}-01-01` : undefined,
          marriage_timeline:    form.marriageTimeline || undefined,
          communication_style:  form.communicationStyle || undefined,
          career_ambition_level: form.careerAmbition || undefined,
          personality_traits:   form.personality.length ? form.personality : undefined,
          interests:            form.lifestyle.length ? form.lifestyle : undefined,
          pref_age_min:         form.partnerAgeMin || undefined,
          pref_age_max:         form.partnerAgeMax || undefined,
          pref_location:        form.partnerLocation || undefined,
          pref_education:       form.educationImportance || undefined,
        };
        if (form.bloodGroup) payload.blood_group = form.bloodGroup;
        if (form.genotype)   payload.genotype    = form.genotype;
        apiAuth.updateProfile(payload as never).catch(() => {});
      }).catch(() => {});

      setCompleted(true);
    }
  };

  const prev = () => {
    setError(null);
    if (step > 1) {
      setDirection("back");
      const p = step - 1; setStep(p); persist(p, form);
    } else onBack();
  };

  if (completed) {
    const fullName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ") || "Your Profile";
    const religiosityLabel = ["", "Light", "Moderate", "Practising", "Devout", "Very Devout"][form.religiosity] ?? "";
    const timelineLabel = form.marriageTimeline ? {
      "6months": "Within 6 months", "6-12months": "6–12 months",
      "1-2years": "1–2 years", "2plus": "No rush (2+ years)",
    }[form.marriageTimeline] ?? "" : "";

    const chips = [
      form.gender === "male" ? "Man" : form.gender === "female" ? "Woman" : "",
      form.nationality,
      form.city && form.country ? `${form.city}, ${form.country}` : form.country,
      form.education ? { "high-school": "High School", bachelors: "Bachelor's", masters: "Master's", phd: "PhD", other: "Other" }[form.education] ?? form.education : "",
      religiosityLabel ? `${religiosityLabel} practice` : "",
      timelineLabel ? `Marriage: ${timelineLabel}` : "",
    ].filter(Boolean);

    return (
      <div className="size-full bg-background overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center mx-auto mb-4">
              <span style={{ fontSize: "2rem", fontWeight: 900, color: "var(--primary)" }}>
                {form.firstName.charAt(0).toUpperCase() || "✓"}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 mb-3">
              <Check size={13} className="text-green-600" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#065f46" }}>Profile Created</span>
            </div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.025em" }}>Welcome, {form.firstName || "there"}!</h2>
            <p className="text-muted-foreground mt-1.5" style={{ fontSize: "0.9375rem" }}>
              Here's a summary of your profile before you start matching.
            </p>
          </div>

          {/* Profile card */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden mb-5 shadow-sm">
            {/* Name & chips */}
            <div className="px-5 py-4 border-b border-border">
              <h3 style={{ fontWeight: 800, fontSize: "1.25rem" }}>{fullName}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {chips.map(c => (
                  <span key={c} className="px-2.5 py-1 rounded-full bg-secondary border border-primary/15 text-foreground" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{c}</span>
                ))}
              </div>
            </div>

            {/* Sections */}
            {[
              {
                title: "Background",
                rows: [
                  { label: "Nationality", val: form.nationality },
                  { label: "Ethnicity", val: form.ethnicity },
                  { label: "Lives in", val: [form.city, form.country].filter(Boolean).join(", ") },
                  { label: "Profession", val: form.profession },
                  ...(form.bloodGroup ? [{ label: "Blood Group", val: form.bloodGroup }] : []),
                  ...(form.genotype   ? [{ label: "Genotype",    val: form.genotype }] : []),
                ],
              },
              {
                title: "Values & Lifestyle",
                rows: [
                  { label: "Spiritual Practice", val: religiosityLabel },
                  { label: "Family",      val: form.familyImportance === "high" ? "Very Important" : form.familyImportance === "medium" ? "Important" : "Values independence" },
                  ...(form.lifestyle.length ? [{ label: "Lifestyle", val: form.lifestyle.join(", ") }] : []),
                  ...(form.personality.length ? [{ label: "Personality", val: form.personality.join(", ") }] : []),
                ],
              },
              {
                title: "Goals & Timeline",
                rows: [
                  { label: "Marriage", val: timelineLabel },
                  { label: "Career", val: form.careerAmbition === "high" ? "Highly Ambitious" : form.careerAmbition === "balanced" ? "Balanced" : form.careerAmbition === "low" ? "Family-First" : "" },
                  ...(form.lifeGoals.length ? [{ label: "Life Goals", val: form.lifeGoals.join(", ") }] : []),
                ],
              },
              {
                title: "Partner Preferences",
                rows: [
                  { label: "Age Range", val: `${form.partnerAgeMin}–${form.partnerAgeMax} years` },
                  { label: "Location", val: form.partnerLocation === "same-city" ? "Same City" : form.partnerLocation === "same-country" ? "Same Country" : form.partnerLocation === "worldwide" ? "Worldwide" : "" },
                ],
              },
            ].map(section => (
              <div key={section.title} className="px-5 py-4 border-b border-border last:border-0">
                <p className="text-muted-foreground mb-3" style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{section.title}</p>
                <div className="space-y-2">
                  {section.rows.filter(r => r.val).map(r => (
                    <div key={r.label} className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: "0.8125rem" }}>{r.label}</span>
                      <span className="text-right" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5 mb-6">
            <span style={{ fontSize: "1rem" }}>💡</span>
            <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "#92400e" }}>
              <strong>Add photos after logging in</strong> — profiles with photos receive 3× more matches. You can upload from your Profile tab.
            </p>
          </div>

          <button
            onClick={onComplete}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl hover:bg-primary/90 active:scale-[0.98] transition-all"
            style={{ fontWeight: 700, fontSize: "1.0625rem" }}>
            <Heart size={18} className="fill-current" />
            Start Finding Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full bg-background overflow-y-auto">
      <div className="min-h-full max-w-lg mx-auto px-6 py-10 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={prev} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={18} />
            <span style={{ fontSize: "0.875rem" }}>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Heart size={13} className="text-primary-foreground fill-primary-foreground" />
            </div>
            <span className="logo-font" style={{ fontWeight: 700, fontSize: "1rem" }}>Ma3moni</span>
          </div>
          <div style={{ width: "60px" }} />
        </div>

        <ProgressBar step={step} total={TOTAL_STEPS} />

        {/* Resume banner */}
        {showResumeBanner && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-secondary text-secondary-foreground rounded-xl border border-primary/20">
            <RefreshCw size={15} className="text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-secondary-foreground" style={{ fontWeight: 600, fontSize: "0.875rem" }}>Welcome back — you're on step {step} of {TOTAL_STEPS}</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Continue where you left off</p>
            </div>
            <button onClick={() => setShowResumeBanner(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Step content — slides based on direction */}
        <div className={`flex-1 ${direction === "forward" ? "view-slide-right" : "view-slide-left"}`} key={step}>
          {step === 1 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "1.625rem", letterSpacing: "-0.02em" }}>Let's start with you</h2>
              <p className="text-muted-foreground mt-2 mb-8" style={{ fontSize: "0.9375rem" }}>Your basic info helps us build your profile.</p>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>First Name</FieldLabel>
                    <TextInput value={form.firstName} onChange={v => update("firstName", v)} placeholder="Fatima" />
                  </div>
                  <div>
                    <FieldLabel>Last Name</FieldLabel>
                    <TextInput value={form.lastName} onChange={v => update("lastName", v)} placeholder="Al-Hassan" />
                  </div>
                </div>
                <div>
                  <FieldLabel>Year of Birth</FieldLabel>
                  <TextInput value={form.birthYear} onChange={v => update("birthYear", v)} placeholder="1995" />
                </div>
                <div>
                  <FieldLabel>I am a</FieldLabel>
                  <CardSelect
                    value={form.gender}
                    onChange={v => update("gender", v)}
                    options={[
                      { value: "male", label: "Man", desc: "Looking for a woman" },
                      { value: "female", label: "Woman", desc: "Looking for a man" },
                    ]}
                    cols={2}
                  />
                </div>

                {/* Health info — optional */}
                <div className="pt-2 border-t border-border">
                  <p className="text-muted-foreground mb-4" style={{ fontSize: "0.8125rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--foreground)" }}>Health info</span> — optional, but can improve compatibility matches
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>Blood Group</FieldLabel>
                      <SelectInput
                        value={form.bloodGroup}
                        onChange={v => update("bloodGroup", v as BloodGroup)}
                        options={BLOOD_GROUPS}
                        placeholder="Select…"
                      />
                    </div>
                    <div>
                      <FieldLabel>Genotype</FieldLabel>
                      <SelectInput
                        value={form.genotype}
                        onChange={v => update("genotype", v as Genotype)}
                        options={GENOTYPES}
                        placeholder="Select…"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "1.625rem", letterSpacing: "-0.02em" }}>Your background</h2>
              <p className="text-muted-foreground mt-2 mb-8" style={{ fontSize: "0.9375rem" }}>Shared context helps build stronger connections.</p>
              <div className="space-y-5">
                <div>
                  <FieldLabel>Nationality</FieldLabel>
                  <SelectInput
                    value={form.nationality}
                    onChange={v => update("nationality", v)}
                    options={COUNTRIES}
                    placeholder="Select your nationality…"
                  />
                </div>
                <div>
                  <FieldLabel>Ethnicity</FieldLabel>
                  <SelectInput
                    value={form.ethnicity}
                    onChange={v => update("ethnicity", v)}
                    options={ETHNICITIES}
                    placeholder="Select your ethnicity…"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Country of Residence</FieldLabel>
                    <TextInput value={form.country} onChange={v => update("country", v)} placeholder="UAE" />
                  </div>
                  <div>
                    <FieldLabel>City</FieldLabel>
                    <TextInput value={form.city} onChange={v => update("city", v)} placeholder="Dubai" />
                  </div>
                </div>
                <div>
                  <FieldLabel>Profession</FieldLabel>
                  <TextInput value={form.profession} onChange={v => update("profession", v)} placeholder="Software Engineer" />
                </div>
                <div>
                  <FieldLabel>Education Level</FieldLabel>
                  <CardSelect
                    value={form.education}
                    onChange={v => update("education", v as EducationLevel)}
                    options={Object.entries(educationLabels).map(([value, label]) => ({ value: value as EducationLevel, label }))}
                    cols={2}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "1.625rem", letterSpacing: "-0.02em" }}>Your values</h2>
              <p className="text-muted-foreground mt-2 mb-8" style={{ fontSize: "0.9375rem" }}>Shared values are the foundation of a lasting partnership.</p>
              <div className="space-y-7">
                <div>
                  <FieldLabel>Spiritual Practice Level</FieldLabel>
                  <div className="mt-4">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={form.religiosity}
                      onChange={e => update("religiosity", parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-muted-foreground mt-2" style={{ fontSize: "0.75rem" }}>
                      <span>Secular / None</span>
                      <span className="font-medium" style={{ color: "var(--primary)" }}>{["","Light","Moderate","Practising","Devout","Very Devout"][form.religiosity]}</span>
                      <span>Very Devout</span>
                    </div>
                  </div>
                </div>
                <div>
                  <FieldLabel>Family Importance</FieldLabel>
                  <CardSelect
                    value={form.familyImportance}
                    onChange={v => update("familyImportance", v as "high" | "medium" | "low")}
                    options={[
                      { value: "high", label: "Very Important", desc: "Family is central to my life" },
                      { value: "medium", label: "Important", desc: "I value family time greatly" },
                      { value: "low", label: "Personal Space", desc: "I value independence" },
                    ]}
                    cols={1}
                  />
                </div>
                <div>
                  <FieldLabel>Lifestyle (select all that apply)</FieldLabel>
                  <div className="mt-3">
                    <MultiSelect value={form.lifestyle} onChange={v => update("lifestyle", v)} options={lifestyleOptions} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "1.625rem", letterSpacing: "-0.02em" }}>How you connect</h2>
              <p className="text-muted-foreground mt-2 mb-8" style={{ fontSize: "0.9375rem" }}>Communication compatibility matters as much as shared values.</p>
              <div className="space-y-7">
                <div>
                  <FieldLabel>Communication Style</FieldLabel>
                  <CardSelect
                    value={form.communicationStyle as never}
                    onChange={v => update("communicationStyle", v as CommunicationStyle)}
                    options={[
                      { value: "verbal", label: "Verbal", desc: "I express myself through talking" },
                      { value: "written", label: "Written", desc: "I communicate best in text" },
                      { value: "quality-time", label: "Quality Time", desc: "Actions over words" },
                      { value: "mixed", label: "Mixed", desc: "I adapt to context" },
                    ]}
                    cols={2}
                  />
                </div>
                <div>
                  <FieldLabel>Personality Traits (choose up to 5)</FieldLabel>
                  <div className="mt-3">
                    <MultiSelect
                      value={form.personality}
                      onChange={v => update("personality", v.slice(0, 5))}
                      options={personalityOptions}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "1.625rem", letterSpacing: "-0.02em" }}>Your goals</h2>
              <p className="text-muted-foreground mt-2 mb-8" style={{ fontSize: "0.9375rem" }}>Aligned goals create a shared future.</p>
              <div className="space-y-7">
                <div>
                  <FieldLabel>Life Goals (select all that apply)</FieldLabel>
                  <div className="mt-3">
                    <MultiSelect value={form.lifeGoals} onChange={v => update("lifeGoals", v)} options={lifeGoalOptions} />
                  </div>
                </div>
                <div>
                  <FieldLabel>Career Ambition</FieldLabel>
                  <CardSelect
                    value={form.careerAmbition}
                    onChange={v => update("careerAmbition", v as "high" | "balanced" | "low")}
                    options={[
                      { value: "high", label: "Highly Ambitious", desc: "Career is a top priority" },
                      { value: "balanced", label: "Balanced", desc: "Career and family equally" },
                      { value: "low", label: "Family-First", desc: "Home and family take priority" },
                    ]}
                    cols={1}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "1.625rem", letterSpacing: "-0.02em" }}>Your timeline</h2>
              <p className="text-muted-foreground mt-2 mb-8" style={{ fontSize: "0.9375rem" }}>Knowing when you're ready helps us match you appropriately.</p>
              <div>
                <FieldLabel>When are you looking to get married?</FieldLabel>
                <div className="mt-4 space-y-3">
                  {Object.entries(timelineLabels).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update("marriageTimeline", value as MarriageTimeline)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${form.marriageTimeline === value ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/30"}`}
                    >
                      <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: form.marriageTimeline === value ? "var(--primary)" : "var(--foreground)" }}>
                        {label}
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${form.marriageTimeline === value ? "border-primary bg-primary" : "border-border"}`}>
                        {form.marriageTimeline === value && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "1.625rem", letterSpacing: "-0.02em" }}>Partner preferences</h2>
              <p className="text-muted-foreground mt-2 mb-8" style={{ fontSize: "0.9375rem" }}>Tell us what matters most to you in a partner.</p>
              <div className="space-y-8">
                <div>
                  <FieldLabel>Age Range</FieldLabel>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex-1 bg-input-background rounded-xl px-4 py-3 text-center" style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--primary)" }}>
                      {form.partnerAgeMin}
                    </div>
                    <span className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>to</span>
                    <div className="flex-1 bg-input-background rounded-xl px-4 py-3 text-center" style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--primary)" }}>
                      {form.partnerAgeMax}
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <label className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Min age: {form.partnerAgeMin}</label>
                    <input type="range" min={18} max={60} value={form.partnerAgeMin} onChange={e => update("partnerAgeMin", parseInt(e.target.value))} className="w-full accent-primary" />
                    <label className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Max age: {form.partnerAgeMax}</label>
                    <input type="range" min={18} max={70} value={form.partnerAgeMax} onChange={e => update("partnerAgeMax", parseInt(e.target.value))} className="w-full accent-primary" />
                  </div>
                </div>

                <div>
                  <FieldLabel>Location Preference</FieldLabel>
                  <CardSelect
                    value={form.partnerLocation}
                    onChange={v => update("partnerLocation", v as "same-city" | "same-country" | "worldwide")}
                    options={[
                      { value: "same-city", label: "Same City" },
                      { value: "same-country", label: "Same Country" },
                      { value: "worldwide", label: "Worldwide" },
                    ]}
                    cols={3}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <FieldLabel>Education Level</FieldLabel>
                  </div>
                  <p className="text-muted-foreground mb-3" style={{ fontSize: "0.8125rem" }}>How important is your partner's education level?</p>
                  {(["must-have", "important", "nice-to-have", "not-important"] as const).map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => update("educationImportance", level)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl mb-2 border transition-all ${form.educationImportance === level ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/30"}`}
                    >
                      <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: form.educationImportance === level ? "var(--primary)" : "var(--foreground)" }}>
                        {level === "must-have" ? "Must Have" : level === "important" ? "Important" : level === "nice-to-have" ? "Nice to Have" : "Not Important"}
                      </span>
                      {form.educationImportance === level && <Check size={16} className="text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>{/* end step content */}

        {/* Validation error */}
        {error && (
          <div className="mt-4 flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <X size={15} className="text-destructive flex-shrink-0" />
            <p style={{ fontSize: "0.875rem", color: "var(--destructive)" }}>{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              onClick={prev}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-border hover:bg-muted transition-colors"
              style={{ fontSize: "0.9375rem" }}
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}
          <button
            onClick={next}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98]"
            style={{ fontSize: "0.9375rem", fontWeight: 600 }}
          >
            {step === TOTAL_STEPS ? "Complete Profile" : "Continue"}
            {step < TOTAL_STEPS && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

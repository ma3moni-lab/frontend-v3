// ── Shared user-preferences (theme + language) ────────────
// Single source of truth for reading, applying and persisting the
// appearance/language preferences. Both PWAProvider (on boot) and the
// Settings screen (on change) go through here, so the logic can't drift.

export type ThemePref = "light" | "dark" | "system";

const THEME_KEY = "ma3moni_theme";
const LANG_KEY = "ma3moni_lang";
const RTL_LANGS = ["ar"];

export function getStoredTheme(): ThemePref {
  try { return (localStorage.getItem(THEME_KEY) as ThemePref) ?? "system"; } catch { return "system"; }
}

export function getStoredLanguage(): string {
  try { return localStorage.getItem(LANG_KEY) ?? "en"; } catch { return "en"; }
}

export function isDark(theme: ThemePref): boolean {
  return (
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
}

/** Apply the theme to <html> and persist it. */
export function applyTheme(theme: ThemePref, persist = true): void {
  if (persist) { try { localStorage.setItem(THEME_KEY, theme); } catch {} }
  document.documentElement.classList.toggle("dark", isDark(theme));
}

/** Apply the language + text direction to <html> and persist it. */
export function applyLanguage(lang: string, persist = true): void {
  if (persist) { try { localStorage.setItem(LANG_KEY, lang); } catch {} }
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
}

export function isRTL(lang: string): boolean {
  return RTL_LANGS.includes(lang);
}

/** Restore both preferences on app boot. */
export function restorePreferences(): void {
  applyTheme(getStoredTheme(), false);
  applyLanguage(getStoredLanguage(), false);
}

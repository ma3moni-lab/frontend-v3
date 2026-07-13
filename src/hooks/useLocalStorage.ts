import { useState, useCallback } from "react";

/**
 * Persistent state backed by localStorage.
 * Handles SSR, JSON serialisation, and invalid stored values gracefully.
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const next = value instanceof Function ? value(storedValue) : value;
      setStoredValue(next);
      localStorage.setItem(key, JSON.stringify(next));
    } catch (err) {
      console.warn(`useLocalStorage: could not write key "${key}"`, err);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try { localStorage.removeItem(key); } catch {}
    setStoredValue(defaultValue);
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue] as const;
}

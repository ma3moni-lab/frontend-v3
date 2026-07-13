import { useEffect, useRef } from "react";

const positions = new Map<string, number>();

/**
 * Saves and restores the scroll position of a container when the key changes.
 * Usage: pass a ref to the scrollable element and a unique key (e.g. current tab name).
 */
export function useScrollRestore(key: string) {
  const ref = useRef<HTMLDivElement>(null);

  // Save current position before key changes
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Restore saved position for this key
    const saved = positions.get(key) ?? 0;
    el.scrollTop = saved;

    return () => {
      // Save on cleanup (key changing / unmount)
      if (ref.current) positions.set(key, ref.current.scrollTop);
    };
  }, [key]);

  return ref;
}

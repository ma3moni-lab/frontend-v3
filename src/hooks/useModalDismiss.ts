import { useEffect, useRef } from "react";

/**
 * Accessibility helper for modals/overlays:
 *  - Moves focus to the first focusable element on mount
 *  - Traps Tab/Shift+Tab inside the modal
 *  - Closes on Escape
 *  - Locks background scroll while open
 */
export function useModalDismiss(onClose: () => void, active = true) {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const FOCUSABLE = [
      'a[href]', 'button:not([disabled])', 'input:not([disabled])',
      'select:not([disabled])', 'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    // Move focus to first focusable child of the topmost modal in the DOM.
    const modal = document.querySelector<HTMLElement>('[role="dialog"], .modal-root');
    const firstFocusable = modal?.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const root = modal ?? document.body;
      const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        el => !el.closest('[aria-hidden="true"]')
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      else trapFocus(e);
    };

    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, active]);

  return containerRef;
}

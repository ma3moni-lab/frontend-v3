import { useRef, useCallback } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;  // px needed to trigger, default 60
}

/**
 * Returns pointer event props to attach to a swipeable element.
 * Works on both touch (mobile) and mouse (desktop).
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 60 }: SwipeHandlers) {
  const startX = useRef<number | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    startX.current = e.clientX;
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (startX.current === null) return;
    const diff = e.clientX - startX.current;
    startX.current = null;
    if (diff < -threshold) onSwipeLeft?.();
    else if (diff > threshold) onSwipeRight?.();
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { onPointerDown, onPointerUp };
}

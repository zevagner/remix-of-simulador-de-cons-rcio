import { useRef, useState, useCallback } from 'react';

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Minimum distance (px) to trigger an action on release. Default 70. */
  threshold?: number;
  /** Maximum vertical drift (px) before treating as a vertical scroll and aborting. Default 30. */
  verticalTolerance?: number;
  /** Disable swipe entirely. */
  disabled?: boolean;
  /** Disable swipe in a specific direction (still allows the other). */
  disableLeft?: boolean;
  disableRight?: boolean;
}

/**
 * Lightweight horizontal swipe detector for touch devices.
 * Returns translateX (for visual feedback) + touch handlers to spread on the element.
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 70,
  verticalTolerance = 30,
  disabled = false,
  disableLeft = false,
  disableRight = false,
}: UseSwipeGestureOptions) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const aborted = useRef(false);
  const [translateX, setTranslateX] = useState(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
    aborted.current = false;
  }, [disabled]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || startX.current === null || startY.current === null || aborted.current) return;
    const t = e.touches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;

    // Treat as vertical scroll → bail out
    if (Math.abs(dy) > verticalTolerance && Math.abs(dy) > Math.abs(dx)) {
      aborted.current = true;
      setTranslateX(0);
      return;
    }

    // Block direction if disabled
    if ((dx < 0 && disableLeft) || (dx > 0 && disableRight)) return;

    // Resistance: dampen beyond threshold for nice feel
    const damped = Math.abs(dx) > threshold
      ? Math.sign(dx) * (threshold + (Math.abs(dx) - threshold) * 0.3)
      : dx;
    setTranslateX(damped);
  }, [disabled, threshold, verticalTolerance, disableLeft, disableRight]);

  const onTouchEnd = useCallback(() => {
    if (disabled || aborted.current) {
      setTranslateX(0);
      startX.current = startY.current = null;
      return;
    }
    if (translateX > threshold && !disableRight) {
      onSwipeRight?.();
    } else if (translateX < -threshold && !disableLeft) {
      onSwipeLeft?.();
    }
    setTranslateX(0);
    startX.current = startY.current = null;
  }, [disabled, translateX, threshold, onSwipeLeft, onSwipeRight, disableLeft, disableRight]);

  const onTouchCancel = useCallback(() => {
    setTranslateX(0);
    startX.current = startY.current = null;
    aborted.current = false;
  }, []);

  return {
    translateX,
    swipeHandlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel },
    isSwiping: translateX !== 0,
  };
}

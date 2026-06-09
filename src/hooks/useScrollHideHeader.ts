import { useState, useEffect, useRef } from 'react';

/**
 * Hook that hides a header on scroll down and shows it on scroll up (mobile only).
 * Returns { headerVisible, headerRef } to attach to the header element.
 */
export function useScrollHideHeader(threshold = 10) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    // Only apply on mobile
    if (window.innerWidth > 768) return;

    const container = document.querySelector('main');
    if (!container) return;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = container.scrollTop;
        const delta = currentY - lastScrollY.current;

        if (delta > threshold && currentY > 60) {
          setVisible(false);
        } else if (delta < -threshold) {
          setVisible(true);
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return visible;
}

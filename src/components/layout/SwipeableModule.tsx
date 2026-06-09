import { useRef, type ReactNode } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

import { MODULE_ORDER } from '@/config/modules';

interface SwipeableModuleProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  children: ReactNode;
}

export function SwipeableModule({ activeModule, onModuleChange, children }: SwipeableModuleProps) {
  const isMobile = useIsMobile();
  const isScrolling = useRef(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (isScrolling.current) return;
    
    const threshold = 80;
    const currentIndex = MODULE_ORDER.indexOf(activeModule);
    if (currentIndex === -1) return;

    if (info.offset.x < -threshold && Math.abs(info.offset.x) > Math.abs(info.offset.y * 1.5)) {
      const next = MODULE_ORDER[currentIndex + 1];
      if (next) onModuleChange(next);
    } else if (info.offset.x > threshold && Math.abs(info.offset.x) > Math.abs(info.offset.y * 1.5)) {
      const prev = MODULE_ORDER[currentIndex - 1];
      if (prev) onModuleChange(prev);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeModule}
        initial={{ opacity: 0, x: isMobile ? 20 : 0, y: isMobile ? 0 : 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: isMobile ? -20 : 0, y: isMobile ? 0 : -10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full min-w-0"
        {...(isMobile ? {
          drag: 'x' as const,
          dragConstraints: { left: 0, right: 0 },
          dragElastic: 0.2,
          onDragEnd: handleDragEnd,
          onTouchStart: () => { isScrolling.current = false; },
          onTouchMove: (e: React.TouchEvent) => {
            // If vertical scroll is dominant, mark as scrolling
            if (!isScrolling.current && e.touches[0]) {
              // Will be handled by the threshold check in dragEnd
            }
          },
        } : {})}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

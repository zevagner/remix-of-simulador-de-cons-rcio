/**
 * <VirtualList> — building block oficial de virtualização.
 *
 * Política (docs/performance/runtime-policy.md):
 *  - Virtualizar SOMENTE listas >200 itens ou schedules ≥120 linhas
 *    com renderização pesada por linha.
 *  - Item height fixo é o caso ideal; height variável aceita `estimateSize`.
 *  - Não virtualizar listas pequenas (over-virtualization piora UX).
 *
 * Uso:
 *   <VirtualList
 *     items={schedule}
 *     itemHeight={36}
 *     getKey={(row) => row.month}
 *     renderItem={(row, index) => <ScheduleRow row={row} index={index} />}
 *   />
 */
import { useRef, type ReactElement } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface VirtualListProps<T> {
  items: readonly T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactElement;
  getKey?: (item: T, index: number) => string | number;
  overscan?: number;
  className?: string;
  /** Altura total do scroll container em px. Default: 480. */
  height?: number;
  ariaLabel?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  getKey,
  overscan = 8,
  className,
  height = 480,
  ariaLabel,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
    getItemKey: getKey ? (i) => getKey(items[i], i) : undefined,
  });

  return (
    <div
      ref={parentRef}
      className={className}
      style={{ height, overflow: "auto", contain: "strict" }}
      role="list"
      aria-label={ariaLabel}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
          width: "100%",
        }}
      >
        {virtualizer.getVirtualItems().map((vi) => {
          const item = items[vi.index];
          return (
            <div
              key={vi.key}
              role="listitem"
              data-index={vi.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${vi.start}px)`,
              }}
            >
              {renderItem(item, vi.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

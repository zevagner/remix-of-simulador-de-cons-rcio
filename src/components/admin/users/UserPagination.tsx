import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number] | 'all';

interface UserPaginationProps {
  page: number;
  limit: PageSize;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: PageSize) => void;
}

/** Build a compact list of page numbers with ellipsis. */
function buildPageList(current: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) pages.push('ellipsis');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}

export function UserPagination({ page, limit, total, onPageChange, onLimitChange }: UserPaginationProps) {
  const showAll = limit === 'all';
  const pageSize = showAll ? Math.max(total, 1) : limit;
  const totalPages = showAll ? 1 : Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(total, safePage * pageSize);

  const pageList = buildPageList(safePage, totalPages);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Exibindo <strong className="text-foreground">{from}–{to}</strong> de{' '}
          <strong className="text-foreground">{total}</strong>
        </span>

        <div className="flex items-center gap-1.5 ml-2">
          <span className="hidden sm:inline">Por página:</span>
          <Select
            value={String(limit)}
            onValueChange={(v) => onLimitChange(v === 'all' ? 'all' : (Number(v) as PageSize))}
          >
            <SelectTrigger className="h-8 w-[88px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
              ))}
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!showAll && totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={safePage === 1}
            aria-label="Primeira página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pageList.map((p, idx) =>
            p === 'ellipsis' ? (
              <span key={`e-${idx}`} className="px-1 text-muted-foreground">…</span>
            ) : (
              <Button
                key={p}
                variant={p === safePage ? 'default' : 'ghost'}
                size="sm"
                className={cn('h-8 min-w-8 px-2', p === safePage && 'pointer-events-none')}
                onClick={() => onPageChange(p)}
                aria-current={p === safePage ? 'page' : undefined}
              >
                {p}
              </Button>
            ),
          )}

          <Button
            variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage === totalPages}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={safePage === totalPages}
            aria-label="Última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

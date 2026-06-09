import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Flame } from 'lucide-react';
import type { FilterOption } from './UserFilters';

interface ExecutiveSummaryCardProps {
  totalUsers: number;
  hotCount: number;
  noProposalCount: number;
  newIdleCount: number;
  onFilterChange: (f: FilterOption) => void;
}

export function ExecutiveSummaryCard({ totalUsers, hotCount, noProposalCount, newIdleCount, onFilterChange }: ExecutiveSummaryCardProps) {
  const hasPriorities = hotCount > 0 || noProposalCount > 0 || newIdleCount > 0;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Resumo Executivo</h3>
          </div>
          {hasPriorities && (
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onFilterChange('hot')}>
              <Flame className="h-3 w-3 mr-1" /> Ver prioritários
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-2 rounded-md bg-muted/40 border border-border/50">
            <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
            <p className="text-caption text-muted-foreground">Total de usuários</p>
          </div>
          <div className="text-center p-2 rounded-md bg-muted/30 border border-border/40 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onFilterChange('hot')}>
            <p className="text-2xl font-bold text-success">{hotCount}</p>
            <p className="text-caption text-success/80">🔥 Quentes</p>
          </div>
          <div className="text-center p-2 rounded-md bg-muted/30 border border-border/40 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onFilterChange('no-proposals')}>
            <p className="text-2xl font-bold text-warning">{noProposalCount}</p>
            <p className="text-caption text-warning/80">Sem proposta</p>
          </div>
          <div className="text-center p-2 rounded-md bg-muted/30 border border-border/40 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onFilterChange('new')}>
            <p className="text-2xl font-bold text-muted-foreground">{newIdleCount}</p>
            <p className="text-caption text-muted-foreground">Novos sem uso</p>
          </div>
        </div>

        {hotCount > 0 && (
          <p className="text-sm text-foreground/80">
            Hoje você tem <strong className="text-success">{hotCount} {hotCount === 1 ? 'usuário pronto' : 'usuários prontos'}</strong> para avançar
          </p>
        )}
        {hotCount === 0 && noProposalCount > 0 && (
          <p className="text-sm text-foreground/80">
            <strong className="text-warning">{noProposalCount} {noProposalCount === 1 ? 'usuário ativo' : 'usuários ativos'}</strong> {noProposalCount === 1 ? 'precisa' : 'precisam'} de ajuda para converter
          </p>
        )}
      </CardContent>
    </Card>
  );
}

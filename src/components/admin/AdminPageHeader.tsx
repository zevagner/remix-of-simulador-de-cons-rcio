import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Building2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/hooks/useAdminQueries';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  /** Mostra o chip "Tenant: Todos" — usado em métricas globais. */
  showTenantScope?: boolean;
  /** Lista de chaves React-Query a invalidar no refresh. Se omitido, invalida adminKeys.all. */
  invalidateKeys?: readonly unknown[][];
}

/**
 * Cabeçalho executivo padrão das telas Admin.
 * Mostra título + chip de tenant + freshness ("Atualizado às HH:MM") + botão Atualizar.
 * Atende a Onda Executiva (consolidação): aumenta confiança operacional sem inflar UI.
 */
export function AdminPageHeader({ title, subtitle, showTenantScope = true, invalidateKeys }: AdminPageHeaderProps) {
  const qc = useQueryClient();
  const [refreshedAt, setRefreshedAt] = useState<Date>(() => new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { setRefreshedAt(new Date()); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (invalidateKeys && invalidateKeys.length > 0) {
        await Promise.all(invalidateKeys.map(k => qc.invalidateQueries({ queryKey: k })));
      } else {
        await qc.invalidateQueries({ queryKey: adminKeys.all });
      }
      setRefreshedAt(new Date());
    } finally {
      setRefreshing(false);
    }
  };

  const hh = String(refreshedAt.getHours()).padStart(2, '0');
  const mm = String(refreshedAt.getMinutes()).padStart(2, '0');

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {showTenantScope && (
            <Badge variant="outline" className="gap-1.5 font-normal">
              <Building2 className="h-3 w-3" />
              Tenant: Todos
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            Atualizado às {hh}:{mm}
          </span>
          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing} className="h-8">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>
    </div>
  );
}

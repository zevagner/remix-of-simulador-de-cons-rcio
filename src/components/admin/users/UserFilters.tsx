import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Filter, Search, X } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export type SortOption = 'priority-desc' | 'name-asc' | 'name-desc' | 'email-asc' | 'email-desc' | 'date-desc' | 'date-asc' | 'usage-desc' | 'usage-asc' | 'engagement-desc' | 'proposals-desc';
export type FilterOption = 'all' | 'active' | 'new' | 'high-usage' | 'no-proposals' | 'engaged' | 'hot' | 'warm' | 'cold' | 'email-caixa' | 'email-external' | 'email-missing';

export const SORT_LABELS: Record<SortOption, string> = {
  'priority-desc': 'Maior potencial primeiro',
  'name-asc': 'Nome (A → Z)',
  'name-desc': 'Nome (Z → A)',
  'email-asc': 'Email (A → Z)',
  'email-desc': 'Email (Z → A)',
  'date-desc': 'Mais recentes primeiro',
  'date-asc': 'Mais antigos primeiro',
  'usage-desc': 'Maior uso primeiro',
  'usage-asc': 'Menor uso primeiro',
  'engagement-desc': 'Maior engajamento',
  'proposals-desc': 'Mais propostas',
};

const FILTER_OPTIONS = [
  { value: 'all' as const, label: 'Todos' },
  { value: 'hot' as const, label: '🔥 Quentes' },
  { value: 'warm' as const, label: '⚠️ Desenvolvimento' },
  { value: 'cold' as const, label: '💤 Frios' },
  { value: 'active' as const, label: 'Ativos' },
  { value: 'new' as const, label: 'Novos (30d)' },
  { value: 'no-proposals' as const, label: 'Sem propostas' },
  { value: 'email-caixa' as const, label: '✉️ @caixa.gov.br' },
  { value: 'email-external' as const, label: '✉️ Externos' },
  { value: 'email-missing' as const, label: '✉️ Sem email' },
];

interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  sortBy: SortOption;
  onSortChange: (v: SortOption) => void;
  filterBy: FilterOption;
  onFilterChange: (v: FilterOption) => void;
  resultCount: number;
}

export function UserFilters({ searchQuery, onSearchChange, sortBy, onSortChange, filterBy, onFilterChange, resultCount }: UserFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative sm:max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Buscar por nome ou email..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
            aria-label="Buscar usuários por nome ou email"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="sm:w-56">
            <ArrowUpDown className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>Filtros:</span>
        </div>
        {FILTER_OPTIONS.map(opt => (
          <div key={opt.value} className="flex items-center gap-1.5">
            <Checkbox
              id={`filter-${opt.value}`}
              checked={filterBy === opt.value}
              onCheckedChange={() => onFilterChange(opt.value)}
            />
            <Label htmlFor={`filter-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</Label>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {resultCount} usuário{resultCount !== 1 ? 's' : ''} encontrado{resultCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

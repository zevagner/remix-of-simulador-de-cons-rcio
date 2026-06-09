import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, X, Shield, XCircle, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { EngagementBadge, getEngagementLevel } from './EngagementBadge';
import { RecommendationBadge } from './RecommendationBadge';
import { SmartMessageGenerator } from '@/components/shared/SmartMessageGenerator';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/services/users';
import type { UserEngagementMetrics } from '@/hooks/useAdminQueries';
import type { UserRole } from '@/services/auth';
import type { EngagementLevel } from '@/services/smartMessages';
import { emailTieBreaker } from './userSortHelpers';

function getSmartLevel(score: number, isNew: boolean): EngagementLevel {
  if (isNew && score < 30) return 'new';
  return getEngagementLevel(score);
}

// ─── Column sorting types ───

type SortColumn = 'nome' | 'email' | 'role' | 'created_at' | 'proposals' | 'simulations' | 'args' | 'engagement';
type SortDirection = 'asc' | 'desc' | null;

interface ColumnSort {
  column: SortColumn | null;
  direction: SortDirection;
}

function SortableHeader({
  label,
  column,
  currentSort,
  onSort,
  align = 'left',
}: {
  label: string;
  column: SortColumn;
  currentSort: ColumnSort;
  onSort: (col: SortColumn) => void;
  align?: 'left' | 'center' | 'right';
}) {
  const isActive = currentSort.column === column;
  const Icon = isActive
    ? currentSort.direction === 'asc' ? ArrowUp : ArrowDown
    : ArrowUpDown;

  return (
    <th
      className={cn(
        'p-3 font-medium select-none cursor-pointer transition-colors hover:bg-muted/80',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        align === 'left' && 'text-left',
        isActive && 'text-primary',
      )}
      onClick={() => onSort(column)}
    >
      <span className={cn(
        'inline-flex items-center gap-1',
        align === 'center' && 'justify-center',
      )}>
        {label}
        <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground/70')} />
      </span>
    </th>
  );
}

// ─── Main component ───

interface UserTableDesktopProps {
  users: UserProfile[];
  getMetrics: (uid: string) => UserEngagementMetrics;
  editingId: string | null;
  editForm: { nome: string; role: UserRole };
  onEditFormChange: (f: { nome: string; role: UserRole }) => void;
  onStartEdit: (u: UserProfile) => void;
  onSaveEdit: (userId: string) => void;
  onCancelEdit: () => void;
  onToggleApproval: (u: UserProfile) => void;
  onDelete: (u: UserProfile) => void;
  isSaving: boolean;
  /** Global sort key from parent — used to reset local column sort when admin picks a global option. */
  globalSortKey?: string;
  /** Open the user profile drawer when the row (outside action buttons) is clicked. */
  onRowClick?: (u: UserProfile) => void;
}

export function UserTableDesktop({
  users, getMetrics, editingId, editForm, onEditFormChange,
  onStartEdit, onSaveEdit, onCancelEdit, onToggleApproval, onDelete, isSaving,
  globalSortKey, onRowClick,
}: UserTableDesktopProps) {
  const [sort, setSort] = useState<ColumnSort>({ column: null, direction: null });

  // When the global sort preference changes, clear the local column sort so
  // the parent's order is honored (last-in-wins between global ↔ local).
  const lastGlobalKey = useRef(globalSortKey);
  useEffect(() => {
    if (globalSortKey !== lastGlobalKey.current) {
      lastGlobalKey.current = globalSortKey;
      setSort({ column: null, direction: null });
    }
  }, [globalSortKey]);

  const handleSort = useCallback((column: SortColumn) => {
    setSort(prev => {
      if (prev.column !== column) return { column, direction: 'asc' };
      if (prev.direction === 'asc') return { column, direction: 'desc' };
      return { column: null, direction: null }; // 3rd click → reset
    });
  }, []);

  const sortedUsers = useMemo(() => {
    if (!sort.column || !sort.direction) return users;

    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...users].sort((a, b) => {
      const ma = getMetrics(a.user_id);
      const mb = getMetrics(b.user_id);

      switch (sort.column) {
        case 'nome':
          return dir * a.nome.localeCompare(b.nome, 'pt-BR');
        case 'email': {
          const cmp = (a.email ?? '').localeCompare(b.email ?? '', 'pt-BR');
          return cmp !== 0 ? dir * cmp : emailTieBreaker(a, b);
        }
        case 'role':
          return dir * a.role.localeCompare(b.role, 'pt-BR');
        case 'created_at':
          return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        case 'proposals':
          return dir * (ma.proposals - mb.proposals);
        case 'simulations':
          return dir * (ma.simulations - mb.simulations);
        case 'args':
          return dir * (ma.argumentsCopied - mb.argumentsCopied);
        case 'engagement':
          return dir * (ma.engagement - mb.engagement);
        default:
          return 0;
      }
    });
  }, [users, sort, getMetrics]);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <SortableHeader label="Nome" column="nome" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Email" column="email" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Role" column="role" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Criado em" column="created_at" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Propostas" column="proposals" currentSort={sort} onSort={handleSort} align="center" />
                <SortableHeader label="Simulações" column="simulations" currentSort={sort} onSort={handleSort} align="center" />
                <SortableHeader label="Args" column="args" currentSort={sort} onSort={handleSort} align="center" />
                <SortableHeader label="Engajamento" column="engagement" currentSort={sort} onSort={handleSort} align="center" />
                <th className="text-left p-3 font-medium">Recomendação</th>
                <th className="text-right p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map(u => {
                const m = getMetrics(u.user_id);
                const isNew = (Date.now() - new Date(u.created_at).getTime()) < 30 * 24 * 60 * 60 * 1000;
                const isEditing = editingId === u.user_id;
                return (
                  <tr
                    key={`${u.user_id}-${isEditing ? 'edit' : 'view'}`}
                    className={cn(
                      'border-b border-border hover:bg-muted/30',
                      getEngagementLevel(m.engagement) === 'hot' && 'bg-success/[0.03]',
                      !isEditing && onRowClick && 'cursor-pointer',
                    )}
                    onClick={!isEditing && onRowClick ? () => onRowClick(u) : undefined}
                  >
                    {isEditing ? (
                      <>
                        <td className="p-2"><Input value={editForm.nome} onChange={e => onEditFormChange({ ...editForm, nome: e.target.value })} className="h-8 text-sm" maxLength={100} /></td>
                        <td className="p-3 text-muted-foreground max-w-[220px] truncate" title={u.email}>{u.email || '—'}</td>
                        <td className="p-2">
                          <select value={editForm.role} onChange={e => onEditFormChange({ ...editForm, role: e.target.value as UserRole })} className="h-8 rounded border border-input bg-background px-2 text-sm">
                            <option value="user">Usuário</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="p-3">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="p-3 text-center text-muted-foreground">{m.proposals}</td>
                        <td className="p-3 text-center text-muted-foreground">{m.simulations}</td>
                        <td className="p-3 text-center text-muted-foreground">{m.argumentsCopied}</td>
                        <td className="p-3 text-center"><EngagementBadge score={m.engagement} showAction lastActivityAt={m.lastActivityAt} /></td>
                        <td className="p-3"><RecommendationBadge metrics={m} isNew={isNew} nome={u.nome} /></td>
                        <td className="p-3 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" onClick={() => onSaveEdit(u.user_id)} disabled={isSaving}><Shield className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={onCancelEdit}><X className="h-4 w-4" /></Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3"><span className="font-medium">{u.nome}</span></td>
                        <td className="p-3 text-muted-foreground max-w-[220px] truncate" title={u.email}>
                          <div className="flex items-center gap-2">
                            {u.email || '—'}
                            {u.email?.toLowerCase().endsWith('@caixa.gov.br') ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-100 font-bold border border-blue-800/50">CAIXA</span>
                            ) : u.email?.toLowerCase().endsWith('@caixaconsorcio.com.br') ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-600/40 text-orange-100 font-bold border border-orange-500/50">CONSÓRCIO</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{u.role}</span></td>
                        <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="p-3 text-center text-muted-foreground">{m.proposals}</td>
                        <td className="p-3 text-center text-muted-foreground">{m.simulations}</td>
                        <td className="p-3 text-center text-muted-foreground">{m.argumentsCopied}</td>
                        <td className="p-3 text-center"><EngagementBadge score={m.engagement} showAction lastActivityAt={m.lastActivityAt} /></td>
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <RecommendationBadge metrics={m} isNew={isNew} nome={u.nome} />
                          <SmartMessageGenerator level={getSmartLevel(m.engagement, isNew)} defaultName={u.nome} compact className="mt-1" />
                        </td>
                        <td className="p-3 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" onClick={() => onStartEdit(u)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => onToggleApproval(u)} title="Desativar" className="text-destructive hover:text-destructive"><XCircle className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => onDelete(u)} title="Excluir" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

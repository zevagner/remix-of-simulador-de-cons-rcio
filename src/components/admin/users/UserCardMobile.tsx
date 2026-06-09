import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, XCircle, Trash2, FileText, BarChart3, Copy } from 'lucide-react';
import { EngagementBadge } from './EngagementBadge';
import { RecommendationBadge } from './RecommendationBadge';
import { MetricPill } from './MetricPill';
import { SmartMessageGenerator } from '@/components/shared/SmartMessageGenerator';
import type { UserProfile } from '@/services/users';
import type { UserEngagementMetrics } from '@/hooks/useAdminQueries';
import type { UserRole } from '@/services/auth';
import type { EngagementLevel } from '@/services/smartMessages';
import { getEngagementLevel } from './EngagementBadge';

function getSmartLevel(score: number, isNew: boolean): EngagementLevel {
  if (isNew && score < 30) return 'new';
  return getEngagementLevel(score);
}

interface UserCardMobileProps {
  user: UserProfile;
  metrics: UserEngagementMetrics;
  isNew: boolean;
  isEditing: boolean;
  editForm: { nome: string; role: UserRole };
  onEditFormChange: (f: { nome: string; role: UserRole }) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleApproval: () => void;
  onDelete: () => void;
  isSaving: boolean;
}

export function UserCardMobile({
  user: u, metrics: m, isNew, isEditing, editForm, onEditFormChange,
  onStartEdit, onSaveEdit, onCancelEdit, onToggleApproval, onDelete, isSaving,
}: UserCardMobileProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        {isEditing ? (
          <div className="space-y-3">
            <Input value={editForm.nome} onChange={e => onEditFormChange({ ...editForm, nome: e.target.value })} placeholder="Nome" maxLength={100} />
            <select value={editForm.role} onChange={e => onEditFormChange({ ...editForm, role: e.target.value as UserRole })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="user">Usuário</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2">
              <Button size="sm" onClick={onSaveEdit} disabled={isSaving}>Salvar</Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{u.nome}</p>
                {u.email && <p className="text-xs text-muted-foreground truncate" title={u.email}>{u.email}</p>}
                <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{u.role}</span>
                <EngagementBadge score={m.engagement} showAction lastActivityAt={m.lastActivityAt} />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <MetricPill icon={FileText} value={m.proposals} label="Propostas" />
              <MetricPill icon={BarChart3} value={m.simulations} label="Simulações" />
              <MetricPill icon={Copy} value={m.argumentsCopied} label="Args copiados" />
            </div>
            <RecommendationBadge metrics={m} isNew={isNew} nome={u.nome} />
            <SmartMessageGenerator level={getSmartLevel(m.engagement, isNew)} defaultName={u.nome} compact className="mt-1" />
            <div className="flex gap-1 pt-1">
              <Button size="sm" variant="ghost" onClick={onStartEdit}><Pencil className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={onToggleApproval} title="Desativar" className="text-destructive hover:text-destructive">
                <XCircle className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete} title="Excluir" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

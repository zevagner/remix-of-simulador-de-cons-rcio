import { useMemo } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Layout, FileText, Download, Sparkles, Activity,
  CheckCircle2, Ban, Trash2, ArrowRight,
} from 'lucide-react';
import { useUserEvents, useUserProposalEvents, type UserEngagementMetrics } from '@/hooks/useAdminQueries';
import type { UserProfile } from '@/services/users';

interface UserProfileDrawerProps {
  user: UserProfile | null;
  metrics: UserEngagementMetrics;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleApproval: (u: UserProfile) => void;
  onDelete: (u: UserProfile) => void;
  isTogglePending?: boolean;
}

// Static map (no template literals) — alinhado com governança Tailwind.
const EVENT_ICON_MAP = {
  module_access: Layout,
  proposal_generated: FileText,
  pdf_generated: Download,
  ai_call: Sparkles,
} as const;

function getEventIcon(name: string) {
  return (EVENT_ICON_MAP as Record<string, typeof Activity>)[name] ?? Activity;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `há ${days}d`;
  return d.toLocaleDateString('pt-BR');
}

function DomainBadge({ email }: { email: string | null | undefined }) {
  const e = email?.toLowerCase() ?? '';
  if (e.endsWith('@caixa.gov.br')) {
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-100 font-bold border border-blue-800/50">CAIXA</span>;
  }
  if (e.endsWith('@caixaconsorcio.com.br')) {
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-600/40 text-orange-100 font-bold border border-orange-500/50">CONSÓRCIO</span>;
  }
  return null;
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="bg-muted/30">
      <CardContent className="p-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold text-foreground mt-0.5">{value}</p>
      </CardContent>
    </Card>
  );
}

export function UserProfileDrawer({
  user, metrics, open, onOpenChange,
  onToggleApproval, onDelete, isTogglePending,
}: UserProfileDrawerProps) {
  const userId = user?.user_id ?? null;
  const { data: events = [], isLoading: eventsLoading } = useUserEvents(userId);
  const { data: pipeline = [], isLoading: pipelineLoading } = useUserProposalEvents(userId);

  const initials = useMemo(() => (user ? getInitials(user.nome) : ''), [user]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        {user && (
          <>
            {/* 1. CABEÇALHO */}
            <SheetHeader className="p-5 border-b border-border bg-muted/20">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-lg shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <SheetTitle className="text-base truncate">{user.nome}</SheetTitle>
                  <SheetDescription className="text-xs truncate">{user.email || '—'}</SheetDescription>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <DomainBadge email={user.email} />
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${user.approved ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                      {user.approved ? 'Ativo' : 'Inativo'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Cadastro: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="p-5 space-y-6">
              {/* 2. RESUMO DE ATIVIDADE */}
              <section>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Resumo de atividade</h3>
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard label="Sessões" value={metrics.sessions} />
                  <MetricCard label="Propostas" value={metrics.proposals} />
                  <MetricCard label="Simulações" value={metrics.simulations} />
                  <MetricCard label="Engajamento" value={`${metrics.engagement}/100`} />
                </div>
              </section>

              {/* 3. ÚLTIMOS EVENTOS */}
              <section>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Últimos eventos</h3>
                {eventsLoading ? (
                  <p className="text-xs text-muted-foreground">Carregando…</p>
                ) : events.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum evento registrado.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {events.map((ev) => {
                      const Icon = getEventIcon(ev.event_name);
                      const mod = (ev.event_data as Record<string, unknown> | null)?.module;
                      return (
                        <li key={ev.id} className="flex items-start gap-2 text-xs">
                          <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-foreground truncate">
                              <span className="font-medium">{ev.event_name}</span>
                              {typeof mod === 'string' && <span className="text-muted-foreground"> · {mod}</span>}
                            </p>
                            <p className="text-[10px] text-muted-foreground/70">{formatRelative(ev.created_at)}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* 4. HISTÓRICO DO PIPELINE */}
              <section>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Histórico do pipeline</h3>
                {pipelineLoading ? (
                  <p className="text-xs text-muted-foreground">Carregando…</p>
                ) : pipeline.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma movimentação de proposta.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {pipeline.map((ev) => (
                      <li key={ev.id} className="flex items-center gap-2 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {ev.from_status ?? '—'}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {ev.to_status ?? '—'}
                        </span>
                        <span className="ml-auto text-[10px] text-muted-foreground/70">
                          {formatRelative(ev.created_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* 5. AÇÕES */}
              <section className="pt-2 border-t border-border space-y-2">
                <Button
                  size="sm"
                  variant={user.approved ? 'outline' : 'default'}
                  className="w-full"
                  onClick={() => onToggleApproval(user)}
                  disabled={isTogglePending}
                >
                  {user.approved ? (
                    <><Ban className="h-4 w-4 mr-1" /> Desativar acesso</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-1" /> Ativar acesso</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(user)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Excluir usuário
                </Button>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

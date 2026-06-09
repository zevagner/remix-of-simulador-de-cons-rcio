import { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, Calendar, UserCircle2, Link as LinkIcon, AlertOctagon, ShieldAlert, ShieldCheck as ShieldOk, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  governanceSections,
  groupLabels,
  groupOrder,
  changelogEntries,
  type GovernanceSection,
  type GovernanceCriticality,
  type GovernanceStatus,
  type GovernanceMaturity,
} from '@/data/governance';
import { GovernanceBlockView } from './GovernanceBlockView';

const CRITICALITY_STYLES: Record<GovernanceCriticality, { label: string; cls: string; Icon: typeof AlertOctagon }> = {
  critical: { label: 'Crítico', cls: 'border-destructive/40 text-destructive bg-destructive/5', Icon: AlertOctagon },
  high: { label: 'Alto', cls: 'border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/5', Icon: ShieldAlert },
  medium: { label: 'Médio', cls: 'border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-500/5', Icon: ShieldOk },
  low: { label: 'Baixo', cls: 'border-border text-muted-foreground bg-muted/40', Icon: ShieldOk },
};

const STATUS_STYLES: Record<GovernanceStatus, string> = {
  enforced: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5',
  active: 'border-primary/40 text-primary bg-primary/5',
  'in-evolution': 'border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/5',
  planned: 'border-border text-muted-foreground bg-muted/40',
};

const STATUS_LABEL: Record<GovernanceStatus, string> = {
  enforced: 'Enforced',
  active: 'Ativo',
  'in-evolution': 'Em evolução',
  planned: 'Planejado',
};

const MATURITY_LABEL: Record<GovernanceMaturity, string> = {
  foundational: 'Fundacional',
  mature: 'Maduro',
  evolving: 'Em evolução',
  experimental: 'Experimental',
};

function ChangelogList() {
  const areaTone: Record<string, string> = {
    arquitetura: 'bg-primary/10 text-primary',
    segurança: 'bg-destructive/10 text-destructive',
    crm: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    ia: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    pdf: 'bg-amber-500/10 text-amber-600 dark:text-amber-500',
    compliance: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    ux: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  };
  return (
    <ol className="relative border-l border-border ml-2 space-y-4">
      {changelogEntries.map((e, i) => (
        <li key={i} className="ml-4">
          <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-caption font-mono text-muted-foreground">{e.date}</span>
            <span className={cn('text-caption uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded', areaTone[e.area] ?? 'bg-muted')}>
              {e.area}
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground">{e.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{e.summary}</p>
        </li>
      ))}
    </ol>
  );
}

function copyDeepLink(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('section', id);
    void navigator.clipboard?.writeText(url.toString());
    toast({ title: 'Link copiado', description: 'Deep-link da seção pronto para compartilhar.' });
  } catch {
    /* no-op */
  }
}

function SectionView({ section }: { section: GovernanceSection }) {
  const isChangelog = section.id === 'changelog';
  const crit = section.criticality ? CRITICALITY_STYLES[section.criticality] : null;
  return (
    <div className="space-y-5">
      <header className="space-y-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3 text-caption text-muted-foreground flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Atualizado em {section.updatedAt}
          </span>
          {section.owner && (
            <span className="inline-flex items-center gap-1">
              <UserCircle2 className="h-3 w-3" />
              Owner: <span className="font-medium text-foreground">{section.owner}</span>
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 ml-auto text-caption"
            onClick={() => copyDeepLink(section.id)}
          >
            <LinkIcon className="h-3 w-3 mr-1" /> Copiar link
          </Button>
        </div>

        <div>
          <h1 className="text-xl font-semibold text-foreground">{section.label}</h1>
          <p className="text-sm text-muted-foreground">{section.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {crit && (
            <Badge variant="outline" className={cn('text-caption gap-1', crit.cls)}>
              <crit.Icon className="h-3 w-3" /> {crit.label}
            </Badge>
          )}
          {section.status && (
            <Badge variant="outline" className={cn('text-caption', STATUS_STYLES[section.status])}>
              {STATUS_LABEL[section.status]}
            </Badge>
          )}
          {section.maturity && (
            <Badge variant="outline" className="text-caption">
              {MATURITY_LABEL[section.maturity]}
            </Badge>
          )}
        </div>

        {section.executiveSummary && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex gap-3">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1.5">
              <p className="text-caption font-semibold uppercase tracking-wider text-primary">Resumo executivo</p>
              <p className="text-sm leading-relaxed text-foreground">{section.executiveSummary}</p>
              {(section.impact || section.risk) && (
                <div className="grid sm:grid-cols-2 gap-2 pt-1">
                  {section.impact && (
                    <p className="text-caption text-muted-foreground">
                      <span className="font-semibold text-foreground">Impacto: </span>
                      {section.impact}
                    </p>
                  )}
                  {section.risk && (
                    <p className="text-caption text-muted-foreground">
                      <span className="font-semibold text-foreground">Risco residual: </span>
                      {section.risk}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {section.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {section.tags.map((t) => (
              <span key={t} className="text-caption px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="space-y-4">
        {isChangelog ? (
          <ChangelogList />
        ) : (
          section.blocks.map((b, i) => <GovernanceBlockView key={i} block={b} />)
        )}
      </div>
    </div>
  );
}

const SECTION_PARAM = 'section';

function readSectionFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get(SECTION_PARAM);
  } catch {
    return null;
  }
}

function writeSectionToUrl(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(SECTION_PARAM, id);
    window.history.replaceState({}, '', url);
  } catch {
    /* no-op */
  }
}

export function AdminGovernance() {
  const initial =
    governanceSections.find((s) => s.id === readSectionFromUrl())?.id ?? governanceSections[0].id;
  const [activeId, setActiveId] = useState(initial);
  const [query, setQuery] = useState('');

  // Mantém URL sincronizada para deep-link / share, sem novo router.
  useEffect(() => {
    writeSectionToUrl(activeId);
  }, [activeId]);

  // Reage a back/forward do navegador.
  useEffect(() => {
    const onPop = () => {
      const id = readSectionFromUrl();
      if (id && governanceSections.some((s) => s.id === id)) {
        setActiveId(id);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return governanceSections;
    return governanceSections.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        (s.executiveSummary?.toLowerCase().includes(q) ?? false) ||
        s.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<GovernanceSection['group'], GovernanceSection[]>();
    filtered.forEach((s) => {
      const arr = map.get(s.group) ?? [];
      arr.push(s);
      map.set(s.group, arr);
    });
    return map;
  }, [filtered]);

  const active = governanceSections.find((s) => s.id === activeId) ?? governanceSections[0];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Governança da Plataforma</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Documentação executiva-técnica viva: arquitetura, segurança, compliance e evolução.
          </p>
        </div>
        <Badge variant="outline" className="text-caption">
          Apenas administradores
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-5">
        <aside className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar seção…"
              className="pl-8 h-9 text-sm"
            />
          </div>

          <nav className="space-y-4">
            {groupOrder.map((g) => {
              const items = grouped.get(g);
              if (!items?.length) return null;
              return (
                <div key={g} className="space-y-1">
                  <p className="text-caption font-semibold uppercase tracking-wider text-muted-foreground px-2">
                    {groupLabels[g]}
                  </p>
                  {items.map((s) => {
                    const dot =
                      s.criticality === 'critical'
                        ? 'bg-destructive'
                        : s.criticality === 'high'
                          ? 'bg-amber-500'
                          : s.criticality === 'medium'
                            ? 'bg-primary/60'
                            : 'bg-muted-foreground/30';
                    return (
                      <button
                        key={s.id}
                        onClick={() => setActiveId(s.id)}
                        className={cn(
                          'w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2',
                          activeId === s.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dot)} />
                        <span className="truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground px-2">Nenhuma seção encontrada.</p>
            )}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="rounded-xl border border-border bg-card p-5 md:p-6">
            <SectionView section={active} />
          </div>
        </main>
      </div>
    </div>
  );
}

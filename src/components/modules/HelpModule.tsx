/**
 * HelpModule — Camada educacional viva da plataforma.
 *
 * Renderer institucional alinhado à V2 (LOCKED FOR PRODUCTION):
 * Simulador · Plataforma Patrimonial · Edição Consultiva (capítulos
 * Investimento Patrimonial e Operações Estruturadas) · Compare
 * Workspace · Carteira · Pós-venda. Exibe categorias, resumos
 * executivos, blocos consultivos (Quando usar / NÃO usar / Perfil
 * ideal / Erro comum / Como explicar / Exemplo / Estratégia /
 * Objeção / Aprofundamento), trilhas de aprendizado, related
 * articles e versionamento.
 *
 * Conteúdo vive em src/data/helpContent.ts (single source).
 * Léxico oficial: mem://governance/v2-product-constitution.
 */
import { useState, useMemo } from 'react';
import {
  Search, BookOpen, AlertTriangle, History, Sparkles, Navigation,
  Lightbulb, ArrowRight, Map, ChevronRight, ChevronDown,
} from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollAffordance } from '@/components/shared/ScrollAffordance';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { VERSION_HISTORY, APP_VERSION } from '@/config/versionConfig';
import {
  categories, trails, glossary, probabilityTable, practicalTips,
  consultiveBlockMeta, articleById,
  type HelpArticle, type ConsultiveBlock,
} from '@/data/helpContent';

interface HelpModuleProps {}

const normalize = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Tons → classes Tailwind via design tokens (sem cor hardcoded).
const TONE_CLASSES: Record<string, string> = {
  success: 'border-l-success/60 bg-success/5',
  danger:  'border-l-destructive/60 bg-destructive/5',
  info:    'border-l-primary/60 bg-primary/5',
  warning: 'border-l-warning/60 bg-warning/5',
  primary: 'border-l-primary/60 bg-primary/5',
  neutral: 'border-l-muted-foreground/40 bg-muted/40',
};

function ConsultiveBlockView({ block }: { block: ConsultiveBlock }) {
  const meta = consultiveBlockMeta[block.kind];
  return (
    <div className={`rounded-md border-l-4 ${TONE_CLASSES[meta.tone]} px-3 py-2.5`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base leading-none">{meta.emoji}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {block.title ?? meta.label}
        </span>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
        {block.body}
      </p>
    </div>
  );
}

function ArticleView({ article }: { article: HelpArticle }) {
  return (
    <div className="space-y-4">
      {/* Resumo executivo */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Resumo executivo
          </span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">{article.executiveSummary}</p>
      </div>

      {/* Para quem / Quando usar */}
      {(article.forWho || article.whenToUse) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {article.forWho && (
            <div className="rounded-md bg-muted/40 p-2.5">
              <div className="text-caption font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                Para quem serve
              </div>
              <p className="text-sm text-foreground/85">{article.forWho}</p>
            </div>
          )}
          {article.whenToUse && (
            <div className="rounded-md bg-muted/40 p-2.5">
              <div className="text-caption font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                Quando ler
              </div>
              <p className="text-sm text-foreground/85">{article.whenToUse}</p>
            </div>
          )}
        </div>
      )}

      {/* Explicação */}
      <div>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {article.explanation}
        </p>
      </div>

      {/* Blocos consultivos */}
      {article.blocks && article.blocks.length > 0 && (
        <div className="space-y-2">
          {article.blocks.map((b, i) => (
            <ConsultiveBlockView key={i} block={b} />
          ))}
        </div>
      )}

      {/* Related */}
      {article.related && article.related.length > 0 && (
        <div className="rounded-md border bg-card p-3">
          <div className="text-caption font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Continue lendo
          </div>
          <div className="flex flex-wrap gap-1.5">
            {article.related.map((rid) => {
              const ref = articleById[rid];
              if (!ref) return null;
              return (
                <Badge key={rid} variant="secondary" className="text-xs gap-1 cursor-default">
                  <ArrowRight className="h-3 w-3" />
                  {ref.article.title}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {article.updatedAt && (
        <div className="text-caption text-muted-foreground/70 text-right">
          Revisado em {article.updatedAt}
        </div>
      )}
    </div>
  );
}

export function HelpModule(_props: HelpModuleProps) {
  const [search, setSearch] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id ?? '');
  const [showAllVersions, setShowAllVersions] = useState(false);

  // Busca cruza: título de artigo, resumo, explicação, blocos, glossário, tips
  const searchHits = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return null;

    const articles = categories.flatMap((c) =>
      c.articles
        .filter((a) => {
          const hay = normalize(
            [
              a.title,
              a.executiveSummary,
              a.explanation,
              a.forWho ?? '',
              a.whenToUse ?? '',
              ...(a.blocks?.map((b) => b.body) ?? []),
            ].join(' ')
          );
          return hay.includes(q);
        })
        .map((a) => ({ article: a, categoryTitle: c.title, categoryId: c.id }))
    );

    const glossaryHits = glossary.filter(
      (g) => normalize(g.term).includes(q) || normalize(g.definition).includes(q)
    );

    const tipHits = practicalTips.filter((t) => normalize(t.tip).includes(q));

    return { articles, glossaryHits, tipHits };
  }, [search]);

  return (
    <div className="space-y-6">
      <ModuleHeader title="Central de Ajuda" subtitle="Aprender a vender com profundidade" moduleId="help" />

      {/* Editorial lead institucional */}
      <section className="editorial-section">
        <div className="editorial-section-mark">
          <span className="editorial-counter">00</span>
          <span className="module-eyebrow">Academia consultiva</span>
        </div>
        <h2 className="editorial-headline">
          Biblioteca <em>editorial</em> de método e raciocínio
        </h2>
        <p className="editorial-headline-lead">
          Trilhas, casos práticos, objeções típicas e glossário institucional —
          formação contínua para vender consórcio com profundidade técnica.
        </p>
      </section>


      {/* Busca global */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por estratégia, módulo, termo financeiro, objeção..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {/* Resultado da busca: prioridade visual */}
      {searchHits && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Resultados para "{search}"
              </h3>
              <Badge variant="outline" className="text-xs">
                {searchHits.articles.length + searchHits.glossaryHits.length + searchHits.tipHits.length} encontrados
              </Badge>
            </div>

            {searchHits.articles.length > 0 && (
              <div className="space-y-3">
                <div className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                  Artigos
                </div>
                <Accordion type="multiple" className="w-full">
                  {searchHits.articles.map(({ article, categoryTitle }) => (
                    <AccordionItem key={article.id} value={article.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2 text-left">
                          <Badge variant="secondary" className="text-caption">{categoryTitle}</Badge>
                          <span className="text-sm font-medium">{article.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ArticleView article={article} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {searchHits.glossaryHits.length > 0 && (
              <div className="space-y-2">
                <div className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                  Glossário
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {searchHits.glossaryHits.map((g) => (
                    <div key={g.term} className="flex items-start gap-2">
                      <Badge variant="secondary" className="mt-0.5 shrink-0">{g.term}</Badge>
                      <span className="text-sm text-muted-foreground leading-relaxed">{g.definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchHits.tipHits.length > 0 && (
              <div className="space-y-2">
                <div className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                  Dicas
                </div>
                <ul className="space-y-1.5">
                  {searchHits.tipHits.map((t, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span>{t.emoji}</span>{t.tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {searchHits.articles.length === 0 && searchHits.glossaryHits.length === 0 && searchHits.tipHits.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum resultado. Tente outro termo.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trilhas — agora mini playbooks consultivos */}
      {!searchHits && (
        <section className="editorial-section">
          <div className="editorial-section-mark">
            <span className="editorial-counter">02</span>
            <span className="module-eyebrow">Trilhas consultivas</span>
          </div>
          <h3 className="editorial-headline mb-1">
            Mini <em>playbooks</em>: como pensar, conduzir e fechar
          </h3>
          <p className="editorial-headline-lead mb-4">
            Cada trilha é um caminho de raciocínio com casos práticos, objeções típicas e leitura ordenada.
          </p>
            <Accordion type="multiple" className="w-full space-y-2">
              {trails.map((trail) => {
                const Icon = trail.icon;
                return (
                  <AccordionItem
                    key={trail.id}
                    value={trail.id}
                    className="rounded-lg border bg-card px-3"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-start gap-3 text-left flex-1">
                        <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{trail.title}</div>
                          <p className="text-xs text-muted-foreground mt-0.5">{trail.description}</p>
                          {trail.audience && (
                            <Badge variant="secondary" className="mt-1.5 text-caption font-normal">
                              👤 {trail.audience}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-4">
                      {trail.playbookSummary && (
                        <div className="rounded-md border-l-4 border-l-primary/60 bg-primary/5 px-3 py-2.5">
                          <div className="text-caption font-semibold uppercase tracking-wide text-primary mb-1">
                            Resumo do playbook
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed">{trail.playbookSummary}</p>
                        </div>
                      )}

                      {trail.outcomes && trail.outcomes.length > 0 && (
                        <div className="rounded-md bg-muted/40 p-3">
                          <div className="text-caption font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Ao final você saberá
                          </div>
                          <ul className="space-y-1">
                            {trail.outcomes.map((o, i) => (
                              <li key={i} className="text-xs text-foreground/85 flex items-start gap-1.5">
                                <span className="text-success mt-0.5">✓</span>
                                <span>{o}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {trail.prerequisites && trail.prerequisites.length > 0 && (
                        <div className="text-caption text-muted-foreground">
                          <span className="font-semibold">Pré-requisitos: </span>
                          {trail.prerequisites.map((id) => trails.find((t) => t.id === id)?.title ?? id).join(' · ')}
                        </div>
                      )}

                      {trail.phases && trail.phases.length > 0 && (
                        <div>
                          <div className="text-caption font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            Fases do playbook
                          </div>
                          <ol className="space-y-2">
                            {trail.phases.map((p, i) => (
                              <li key={i} className="rounded-md border bg-card p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-caption">{i + 1}</Badge>
                                  <span className="text-sm font-semibold">{p.title}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2 italic">🎯 {p.goal}</p>
                                <ul className="space-y-1 mb-2">
                                  {p.actions.map((a, j) => (
                                    <li key={j} className="text-xs text-foreground/85 flex items-start gap-1.5">
                                      <span className="text-muted-foreground/75">›</span>
                                      <span>{a}</span>
                                    </li>
                                  ))}
                                </ul>
                                {p.script && (
                                  <div className="mt-2 rounded border-l-2 border-l-primary/60 bg-primary/5 px-2 py-1.5">
                                    <span className="text-caption font-semibold uppercase tracking-wide text-primary">🗣️ Script</span>
                                    <p className="text-xs text-foreground/90 mt-0.5 leading-relaxed">{p.script}</p>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {trail.caseStudies && trail.caseStudies.length > 0 && (
                        <div>
                          <div className="text-caption font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            Casos práticos
                          </div>
                          <div className="space-y-2">
                            {trail.caseStudies.map((c, i) => (
                              <div key={i} className="rounded-md border-l-4 border-l-accent/60 bg-accent/5 p-3">
                                <div className="text-sm font-semibold mb-1.5">📌 {c.profile}</div>
                                <div className="grid gap-1.5 text-xs">
                                  <div><span className="font-semibold text-muted-foreground">Situação:</span> {c.situation}</div>
                                  <div><span className="font-semibold text-muted-foreground">Raciocínio:</span> {c.reasoning}</div>
                                  <div><span className="font-semibold text-muted-foreground">Estratégia:</span> {c.strategy}</div>
                                  <div><span className="font-semibold text-muted-foreground">Desfecho:</span> {c.outcome}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {trail.objections && trail.objections.length > 0 && (
                        <div>
                          <div className="text-caption font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            Objeções típicas
                          </div>
                          <div className="space-y-2">
                            {trail.objections.map((o, i) => (
                              <div key={i} className="rounded-md border-l-4 border-l-warning/60 bg-warning/5 p-3">
                                <div className="text-sm font-semibold mb-1">🛡️ "{o.objection}"</div>
                                <div className="text-xs text-muted-foreground italic mb-1">Reframe: {o.reframe}</div>
                                <p className="text-xs text-foreground/90 leading-relaxed">
                                  <span className="font-semibold">Resposta:</span> {o.response}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="text-caption font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Leitura recomendada (na ordem)
                        </div>
                        <ol className="space-y-1">
                          {trail.steps.map((s, i) => {
                            const ref = articleById[s.articleId];
                            if (!ref) return null;
                            return (
                              <li key={s.articleId} className="text-xs text-foreground/85 flex items-start gap-1.5">
                                <span className="text-muted-foreground/75 shrink-0">{i + 1}.</span>
                                <div>
                                  <span className="font-medium">{ref.article.title}</span>
                                  {s.note && <span className="text-muted-foreground"> — {s.note}</span>}
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
        </section>
      )}

      {/* Tips rápidas */}
      {!searchHits && (
        <section className="editorial-section">
          <div className="editorial-section-mark">
            <span className="editorial-counter">03</span>
            <span className="module-eyebrow">Dicas práticas</span>
          </div>
          <h3 className="editorial-headline mb-4">
            Atalhos de <em>raciocínio</em> consultivo
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {practicalTips.map((t, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30">
                <span className="text-lg shrink-0">{t.emoji}</span>
                <span className="text-sm text-muted-foreground leading-relaxed">{t.tip}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categorias institucionais */}
      {!searchHits && (
        <section className="editorial-section">
          <div className="editorial-section-mark">
            <span className="editorial-counter">04</span>
            <span className="module-eyebrow">Conhecimento institucional</span>
          </div>
          <h3 className="editorial-headline mb-4">
            Biblioteca <em>técnica</em> por categoria
          </h3>

            <Tabs value={activeCategoryId} onValueChange={setActiveCategoryId} className="w-full">
              <div className="overflow-x-auto">
                <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0 mb-4">
                  {categories.map((c) => {
                    const Icon = c.icon;
                    return (
                      <TabsTrigger
                        key={c.id}
                        value={c.id}
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-xs">{c.title}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {categories.map((c) => (
                <TabsContent key={c.id} value={c.id} className="space-y-4 mt-0">
                  <div className="rounded-lg border bg-muted/30 p-3.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{c.title}</span>
                      {c.badge && <Badge variant="secondary" className="text-caption">{c.badge}</Badge>}
                      <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" />
                        {c.subtitle}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {c.executiveSummary}
                    </p>
                  </div>

                  <Accordion type="multiple" className="w-full">
                    {c.articles.map((a) => (
                      <AccordionItem key={a.id} value={a.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <span className="text-sm font-medium text-left">{a.title}</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ArticleView article={a} />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>
              ))}
            </Tabs>
        </section>
      )}

      {/* Zonas de Contemplação */}
      {!searchHits && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <h3 className="text-base font-semibold">Zonas de Contemplação</h3>
            </div>
            <ScrollAffordance>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Cor</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Zona</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Significado</th>
                  </tr>
                </thead>
                <tbody>
                  {probabilityTable.map((row) => (
                    <tr key={row.label} className="border-b last:border-0">
                      <td className="py-3 pr-4"><span className={`inline-block h-4 w-4 rounded-full ${row.color}`} /></td>
                      <td className="py-3 pr-4 font-medium">{row.zone}</td>
                      <td className="py-3 text-muted-foreground">{row.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollAffordance>
          </CardContent>
        </Card>
      )}

      {/* Glossário */}
      {!searchHits && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-4 w-4" />
              </div>
              <h3 className="text-base font-semibold">Glossário</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {glossary.map((g) => (
                <div key={g.term} className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-0.5 shrink-0">{g.term}</Badge>
                  <span className="text-sm text-muted-foreground leading-relaxed">{g.definition}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de versões */}
      {!searchHits && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15 text-warning">
                <History className="h-4 w-4" />
              </div>
              <h3 className="text-base font-semibold">Histórico de Versões</h3>
              <Badge variant="outline" className="ml-auto text-xs">v{APP_VERSION}</Badge>
            </div>
            <div className="space-y-4">
              {(showAllVersions ? VERSION_HISTORY : VERSION_HISTORY.slice(0, 3)).map((release, idx) => (
                <div key={release.version} className={`rounded-lg border p-card-sm ${idx === 0 ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {idx === 0 && <Sparkles className="h-4 w-4 text-warning" />}
                    <span className="font-semibold text-sm">Versão {release.version}</span>
                    <span className="text-xs text-muted-foreground">— {release.date}</span>
                    {idx === 0 && <Badge className="text-xs ml-auto">Atual</Badge>}
                  </div>
                  <ul className="space-y-1">
                    {release.features.map((f, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-warning mt-0.5">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {VERSION_HISTORY.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllVersions((v) => !v)}
                  aria-expanded={showAllVersions}
                  className="w-full inline-flex items-center justify-center gap-1.5 text-sm text-primary hover:underline py-2"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAllVersions ? 'rotate-180' : ''}`} />
                  {showAllVersions
                    ? 'Recolher histórico'
                    : `Ver histórico completo (${VERSION_HISTORY.length - 3} versões anteriores)`}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

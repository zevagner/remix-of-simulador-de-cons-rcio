# Governance Module — Structure Audit

**Data:** 2026-05-12
**Escopo:** Admin → Governança da Plataforma
**Status:** Mapeamento. NÃO expandir nesta onda.

---

## 1. Mapa completo da estrutura

### 1.1 Posicionamento no Admin

`src/pages/AdminPage.tsx` expõe 7 áreas administrativas (consolidação executiva 11 → 7):

| # | id | Label | Componente |
|---|----|----|-----------|
| 1 | dashboard | Visão Geral | AdminDashboard |
| 2 | users | Usuários | AdminUsers |
| 3 | feedbacks | Feedbacks | AdminFeedbacks |
| 4 | analytics | Analytics | AdminAnalytics |
| 5 | ai | Performance IA | AdminAICenter |
| 6 | audit | Auditoria | AdminAuditCenter |
| 7 | **governance** | **Governança** | **AdminGovernance** |

Governança é a única área **conceitual / documental**. As outras 6 são operacionais (dados ao vivo, ações, métricas). A separação é correta e intencional.

### 1.2 Subseções da Governança (10 seções)

Renderizadas em sidebar interno agrupado por `group`:

```
Fundações
  └─ architecture     (Arquitetura)
Segurança & Compliance
  ├─ security         (Segurança)
  ├─ compliance       (Compliance / LGPD)
  └─ multitenant      (Isolamento de tenants)
Produto
  ├─ ai               (Inteligência Artificial)
  └─ storage-pdf      (Storage & PDFs)
Operações
  ├─ audits           (Auditorias / memória institucional)
  ├─ changelog        (Changelog vivo)
  ├─ roadmap          (Roadmap técnico)
  └─ status           (Status da plataforma)
```

### 1.3 Fluxo UX

- Layout: 2 colunas — `aside` 240px (busca + nav agrupada) + `main` (card com seção ativa).
- Seleção via `useState(activeId)` local — sem URL/route deep-link.
- Busca filtra seções por label, subtitle e tags (`useMemo`, case-insensitive).
- Header de seção: data de atualização, label, subtitle, tags.
- Conteúdo: blocos heterogêneos renderizados pelo `GovernanceBlockView`.

---

## 2. Arquitetura da documentação viva

### 2.1 Modelo

**TypeScript object registry** — não é MDX, JSON, markdown ou CMS.

- Cada seção é um arquivo `.ts` em `src/data/governance/sections/`.
- Cada seção exporta um `GovernanceSection` tipado.
- `src/data/governance/index.ts` é o **registry barrel** que agrega o array `governanceSections` na ordem de exibição.
- `groupLabels` traduz o `group` para rótulo PT-BR.
- `changelogEntries` é exportado separado (consumido por componente especializado, não por blocks).

### 2.2 Vantagens do modelo

- Type-safe end-to-end (autocomplete, refactor seguro).
- Versionável via git como qualquer código.
- Cada seção é arquivo isolado → baixíssimo conflito de merge.
- Sem runtime de markdown / sem dependências extras.
- Tree-shakeable.

### 2.3 Limitações

- Edição exige deploy (não é editável por não-devs).
- Sem versionamento por seção (só git history global).
- Sem suporte nativo a tabelas longas, imagens ou diagramas embutidos.
- Sem deep-link por seção (não é compartilhável por URL).

---

## 3. Componentes utilizados

| Componente | Responsabilidade | LOC |
|---|---|---|
| `AdminGovernance.tsx` | Container, busca, agrupamento, seleção, header da seção | 172 |
| `GovernanceBlockView.tsx` | Renderer polimórfico por `kind` de bloco | 96 |
| `ChangelogList` (interno) | Timeline visual com tone por área | inline |
| `SectionView` (interno) | Header padrão + iteração de blocos OU changelog | inline |

Total: **2 componentes** + 2 internos. Superfície de manutenção mínima.

Reusa apenas: `Input`, `Badge`, `cn`, `lucide-react` icons. Zero dependência externa de viewer/MDX/markdown.

---

## 4. Sistema de tipagem (`types.ts`)

### 4.1 `GovernanceBlockKind` — 6 tipos

| kind | Uso | Campos consumidos |
|---|---|---|
| `paragraph` | Texto longo | `title?`, `text` |
| `bullets` | Lista de pontos | `title?`, `items[]` |
| `kv` | Matriz chave/valor (capabilities) | `title?`, `pairs[]` |
| `callout` | Destaque info/positive/warn/critical | `title?`, `text`, `tone` |
| `code` | Snippet curto | `title?`, `code`, `language?` |
| `audit-link` | Referência a relatório em `.lovable/audit/` | `auditPath`, `auditDescription` |

### 4.2 `GovernanceSection` — modelo unificado

Campos: `id`, `label`, `subtitle` (verbo no imperativo ≤ 8 palavras), `group` (4 valores), `updatedAt` (ISO), `tags[]`, `blocks[]`.

### 4.3 `ChangelogEntry` — schema separado

`{ date, title, area, summary }` com `area` enum de 7 categorias (arquitetura, segurança, crm, ia, pdf, compliance, ux).

### 4.4 Maturidade conceitual

- Bloco `code` está declarado no tipo e no renderer, mas **nenhuma seção atual o usa**.
- Bloco `audit-link` é o pilar de rastreabilidade: 11 referências cruzadas para `.lovable/audit/`.
- Bloco `kv` é o motor visual mais denso e diferenciado — usado em architecture, multitenant, storage, status.
- Bloco `callout` carrega `tone` semântico mapeado para cor + ícone — princípio "uma garantia visual por seção".

**Tipos ausentes / candidatos a adicionar:** `timeline`, `version`, `incident`, `flag`, `metric`, `responsible-person`, `decision-record` (ADR).

---

## 5. Relação com auditorias

- Bloco `audit-link` é **referência simbólica**, não carregamento ativo. Aponta para `path` em `.lovable/audit/` mas **não renderiza o conteúdo do .md**.
- 11 auditorias estão referenciadas (de 36+ existentes em `.lovable/audit/`). Cobertura: ~30%.
- A seção `audits` funciona como **índice navegável da memória institucional**.
- O `changelog` é a **única documentação viva auto-suficiente** (não depende de .md externo).
- Não existe verificação automática de path quebrado de auditoria.

---

## 6. Governança visual

### 6.1 Por que está sendo percebida como referência estética do Admin

1. **Densidade controlada**: header padronizado (data + label + subtitle + tags) cria ritmo visual previsível.
2. **Hierarquia tipográfica clara**: 4 níveis (h2 admin, h1 seção, h3 bloco, body).
3. **Tonalidade semântica**: callouts (info/positive/warn/critical) têm bg, border e ícone próprios derivados dos design tokens.
4. **Sidebar com agrupamento institucional** (Fundações, Segurança, Produto, Operações) — comunica maturidade SaaS imediatamente.
5. **Timeline do changelog** com chip de área colorida + linha vertical + dot conectado: padrão "release notes corporativos".
6. **Uso disciplinado de `text-muted-foreground`, `text-foreground`, `bg-muted/40`** — zero cor hardcoded, 100% tokens.
7. **Microcopy** dos subtitles segue padrão verbo-imperativo curto: "Entender…", "Conhecer…", "Garantir…".
8. **Badge "Apenas administradores"** no topo dá tom institucional/restrito.

### 6.2 Pontos a manter inalterados ao expandir

- Subtitle ≤ 8 palavras, verbo no infinitivo (ato consultivo).
- 1 callout por seção, no máximo.
- Tags em chips minúsculos `text-[10px]`.
- `kv` para matrizes de capacidade; `bullets` para garantias; `paragraph` para princípios.

---

## 7. Escalabilidade

### 7.1 O que a arquitetura **suporta sem refatoração**

- Adicionar dezenas de novas seções: basta criar arquivo + push no array do `index.ts`.
- Adicionar novos `groups`: estender union em `types.ts` + `groupLabels` + ordem de iteração no `AdminGovernance` (atualmente hardcoded `['foundations', 'security', 'product', 'operations']`).
- Adicionar tags ilimitadas (busca já cobre).
- Reordenar seções (basta reordenar o array exportado).

### 7.2 O que **exige extensão controlada do tipo**

- Novos `kind` de bloco (timeline, ADR, version-matrix, flag-table, metric-card, incident-log, responsible).
- Conteúdo dinâmico (status real-time, contagens vivas, build version atual).
- Deep-link por seção (`/admin/governance/architecture`).

### 7.3 O que **exige refatoração**

- Edição por usuários não-devs (precisaria backend de conteúdo).
- Versionamento por seção independente.
- Renderização de markdown completo (precisaria dependência MDX/marked).

---

## 8. Gaps encontrados

| # | Gap | Severidade | Impacto |
|---|---|---|---|
| 1 | Iteração de groups está hardcoded em `AdminGovernance.tsx` (linha do `.map`) | Baixa | Adicionar group exige editar componente, não só types |
| 2 | Sem deep-link por seção (state local, não URL) | Média | Não compartilhável; perde estado em F5 |
| 3 | Bloco `code` declarado mas não utilizado | Baixa | Sintoma de tipo declarado em excesso |
| 4 | `audit-link` é decorativo: não verifica se o arquivo existe nem abre o conteúdo | Média | Risco de link morto; perde rastreabilidade real |
| 5 | `roadmap` e `status` são manualmente atualizados — risco de defasagem | Média | "Status: Operacional" pode mentir |
| 6 | `changelog` está acoplado à seção `changelog` por `id === 'changelog'` (string magic no `SectionView`) | Baixa | Difícil adicionar segundo "tipo especial" sem refatorar |
| 7 | Sem testes unitários para o registry (schema, paths de auditoria, datas válidas) | Média | Regressão silenciosa possível |
| 8 | `updatedAt` é manual — não reflete último commit real do arquivo | Baixa | Confiança visual na data depende de disciplina humana |
| 9 | Sem responsável (owner) por seção | Média | Para SaaS corporativo faltará "quem mantém isto" |
| 10 | Sem campo `version` ou `since` por bloco/seção | Baixa | Difícil saber quando uma garantia entrou em vigor |

---

## 9. Oportunidades de expansão (sem inflar)

### 9.1 Reaproveitamento direto (zero novo tipo)

- **LGPD detalhado**: nova seção em `security` group, usando `paragraph` + `bullets` + `kv` + `audit-link`.
- **Infraestrutura operacional**: nova seção em `foundations`, usando `kv` (camadas, regiões, dependências).
- **Observabilidade**: seção em `operations`, `bullets` + `audit-link`.
- **Isolamento institucional avançado**: estender `multitenant` com `kv` extra.

### 9.2 Pequenas extensões de tipo (alto valor / baixo custo)

- `kind: 'timeline'` — para Roadmap por trimestre.
- `kind: 'metric'` — para health-checks ao vivo (precisa fonte de dados).
- `kind: 'responsible'` — owner + canal de contato.
- Campo opcional `since: string` em `GovernanceBlock`.
- Campo opcional `owner: string` em `GovernanceSection`.

### 9.3 Conexões institucionais

- Auto-popular `audit-link` lendo `.lovable/audit/*.md` em build (script Node).
- Sincronizar `changelogEntries` com release tags do git.
- Extrair `version` do `public/version.json` para um `kind: 'version'`.

---

## 10. Separação conceitual (validação de fronteiras)

| Área | Confusão possível? | Veredicto |
|---|---|---|
| Governança × Central de Ajuda | Help é orientado a tarefas do usuário final (consultor); Governança é institucional (admin/TI/compliance) | **Bem separado** |
| Governança × Analytics | Analytics é dado vivo agregado; Governança é decisão arquitetural e princípio | **Bem separado** |
| Governança × Auditoria operacional (AdminAuditCenter) | Audit Center mostra **eventos** (audit_logs ao vivo); Governança apresenta **princípios e estrutura** | **Bem separado** — mas oportunidade de cross-link |
| Governança × CRM | Sem sobreposição | **Bem separado** |
| Governança × Performance IA | Performance IA mede consumo/latência; Governança documenta **garantias e princípios** de IA | **Bem separado** |

Risco real: usuário admin pode procurar "lista de auditorias geradas" tanto em Governança→Auditorias quanto em AdminAuditCenter. Recomendação futura: adicionar nota cruzada explícita em cada lado.

---

## 11. Maturidade institucional

> "A área já parece um núcleo real de governança SaaS?"

**Resposta: SIM, no nível conceitual e visual. AINDA NÃO no nível operacional vivo.**

| Critério | Status |
|---|---|
| Identidade visual de plataforma corporativa | ✅ Atingido |
| Separação clara: princípio × dado × evento | ✅ Atingido |
| Documentação viva tipada e versionável | ✅ Atingido |
| Memória institucional referenciada | 🟡 Parcial (links sem renderização) |
| Cobertura de domínios institucionais (arch, sec, IA, multi-tenant, storage, compliance, audits, changelog, roadmap, status) | ✅ 10 áreas |
| Conteúdo dinâmico real (status, métricas, versão) | ❌ Tudo manual |
| Owners definidos por área | ❌ Ausente |
| Versionamento de garantias | ❌ Ausente |
| Deep-link e compartilhabilidade | ❌ Ausente |
| Rastreabilidade auditável de mudanças | 🟡 Via git, não via UI |

---

## 12. Riscos estruturais

1. **Defasagem silenciosa** de status/roadmap/changelog — manutenção 100% humana.
2. **Inflar com novas seções sem governança curatorial** — risco de perder a estética premium atual.
3. **Tipo `block` virar grab-bag** se cada onda adicionar novos `kind` sem critério.
4. **Audit-links órfãos** se relatórios forem renomeados ou movidos.
5. **Acoplamento string-magic** ao `id === 'changelog'` se outras seções precisarem de renderer próprio.
6. **Falta de owner** torna escalonamento entre múltiplos engenheiros inseguro.

---

## 13. Before / After conceitual

### Before (estado pré-Governança)
- Documentação dispersa em `.lovable/audit/*.md`, `.lovable/memory/**/*.md`, `ARCHITECTURE.md`.
- Sem visão consolidada para admin/TI/compliance dentro do produto.
- Memória institucional acessível só via filesystem do projeto.

### After (estado atual)
- Núcleo único navegável dentro do Admin com **10 seções** agrupadas em 4 fundações.
- Tipagem polimórfica de blocos cobre 80% das necessidades de comunicação institucional.
- Auditorias aparecem como índice navegável (referência simbólica).
- Visualmente reconhecida como **a área de maior maturidade visual do Admin**.
- Pronto para expansão controlada (LGPD, infra, observabilidade, incident log) **sem refatoração estrutural**.

---

## 14. Score final da Governança

| Dimensão | Nota (0–10) | Justificativa |
|---|---|---|
| Arquitetura de informação | 9 | Agrupamento e hierarquia maduros |
| Tipagem & extensibilidade | 8 | Sólida, mas tipo `code` ocioso e faltam timeline/metric |
| Renderização & componentes | 9 | 2 componentes, polimorfismo limpo |
| Estética & escaneabilidade | 10 | Referência visual do Admin |
| Cobertura de domínios | 8 | 10 áreas; falta LGPD detalhado, infra, observabilidade |
| Rastreabilidade | 6 | Audit-links sem verificação nem renderização |
| Conteúdo dinâmico | 3 | Tudo manual; status pode mentir |
| Escalabilidade técnica | 9 | Adicionar seção é trivial |
| Maturidade institucional | 8 | Falta owner, versionamento, deep-link |
| Separação conceitual | 10 | Fronteiras com Help/Analytics/Audit/IA bem desenhadas |

**Score consolidado: 8.0 / 10 — núcleo institucional sólido, pronto para expansão curatorial.**

---

## 15. Recomendações para a próxima onda (NÃO executar agora)

1. Adicionar campo `owner` opcional em `GovernanceSection`.
2. Adicionar campo `since` opcional em `GovernanceBlock`.
3. Substituir iteração hardcoded de groups por iteração derivada de `groupLabels`.
4. Verificação em build de `auditPath` existente em `.lovable/audit/`.
5. Deep-link `?section=architecture` (URLSearchParams local, sem router novo).
6. Adicionar 4 seções novas usando **só os tipos existentes**: LGPD, Infraestrutura, Observabilidade, Incident Log.
7. Após (6), avaliar necessidade real de novos `kind` (timeline, metric, responsible).
8. Renderer próprio para "seções especiais" via campo `customRenderer?: 'changelog' | 'status'` (remover string-magic).

---

## 16. Conclusão

O módulo **Governança da Plataforma** já é, hoje, um **núcleo institucional real e funcional**. Não é fachada nem placeholder. Sua estética madura e sua arquitetura de conteúdo tipada o credenciam como **referência interna do Admin** e como **peça apresentável a TI corporativo, auditoria externa e compliance**.

A próxima onda deve **expandir profundidade** (LGPD, infra, observabilidade, isolamento avançado) **antes** de expandir tipos de bloco. O tipo system atual cobre confortavelmente as próximas 4–6 seções planejadas, e qualquer extensão de `kind` deve vir **depois** de pressão real de conteúdo, nunca antes.

**Veredicto:** estrutura aprovada. Pronta para receber visão institucional ampliada **sem refatoração**.

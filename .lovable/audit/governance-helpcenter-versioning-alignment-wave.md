# Onda 37 — Governance + Help Center + Versioning Alignment

**Data:** 2026-05-14
**Versão lançada:** 2.4.0
**Classificação:** Non-breaking (visual / arquitetural / governança)
**Escopo:** Documentação institucional. **Zero alteração** em runtime, hooks, providers, Supabase, RLS, edges ou lógica financeira.

---

## 1. Resumo executivo

O produto passou por uma transformação profunda nas Ondas 33–36 (redesign visual, canonical canvas, app shell modernization, landing overhaul, motion/polish, sidebar restructuring, card unification, **remoção integral do Tour Guiado**, copiloto contextual consolidado, CSS consolidation, design governance, canonical primitives, UX cleanup).

Esta onda **alinha a documentação institucional ao produto real**, lança a **versão 2.4.0** e elimina referências mortas a features descontinuadas.

---

## 2. Auditoria — achados

| Área | Status anterior | Ação |
|---|---|---|
| `src/config/versionConfig.ts` | v2.3.0 (02/05) — sem Ondas 33–36; entrada 2.0.0 mencionava "Tours guiados (Intro.js)" | ✅ v2.4.0 publicada; 2.0.0 reescrito para "Onboarding consultivo (descontinuado em 2.4.0)" |
| `src/data/governance/sections/changelog.ts` | Última entrada 2026-05-13 | ✅ +4 entradas em 2026-05-14 |
| `src/data/governance/sections/roadmap.ts` | Listava "brandConfig.ts" como próxima onda (já implementado) | ✅ Reescrito com próximas ondas reais (health-check, release notes, bundle gate) |
| `src/data/governance/sections/architecture.ts` | `updatedAt: 2026-05-12`, sem registro do estado visual atual | ✅ +bloco "Estado visual atual (v2.4.0)" + audit-links da Onda 37 e remoção do Tour |
| `src/data/governance/sections/status.ts` | `updatedAt: 2026-05-12` | ✅ Atualizado para 2026-05-14 |
| `src/data/helpContent.ts` | 2 menções "onboarding" | ✅ Mantidas — significam treinamento consultivo (não Tour). Zero menção a Intro.js. |
| `src/components/modules/HelpModule.tsx` | Renderiza `VERSION_HISTORY` automaticamente | ✅ UI reflete v2.4.0 sem code change |
| Tour residual em `src/` | `rg` confirma zero matches funcionais | ✅ Limpo |

---

## 3. Mudanças aplicadas

### 3.1 `src/config/versionConfig.ts`
- `APP_VERSION = "2.4.0"`
- `NEW_FEATURES` reescrito (8 itens consolidando Ondas 33–36)
- Nova entrada **v2.4.0 (14/05/2026)** no topo de `VERSION_HISTORY` com 13 features
- Entrada **v2.0.0** corrigida: "Tours guiados (Intro.js)" → "Onboarding consultivo guiado nos módulos principais (descontinuado em 2.4.0 — substituído pela Central de Ajuda institucional)"
- **Histórico 1.0.0 → 2.3.0 preservado integralmente.**

### 3.2 `src/data/governance/sections/changelog.ts`
- 4 novas entradas em 2026-05-14 (produto/ux/simulador/documentação)
- `updatedAt` → `2026-05-14`
- Tag `v2.4.0` adicionada

### 3.3 `src/data/governance/sections/roadmap.ts`
- Reescrito: "Próximas ondas (pós v2.4.0)" — health-check, release notes públicos, bundle gate em CI, feature flags por tenant, lints de regras hardcoded, expansão Adaptive
- Removido item "brandConfig.ts" (concluído)

### 3.4 `src/data/governance/sections/architecture.ts`
- `updatedAt` → `2026-05-14`
- Novo bloco `kv` "Estado visual atual (v2.4.0)" — Canvas, Sistema editorial, Sidebar, Motion, Onboarding, Cockpit
- 2 novos `audit-link` (Onda 37 e Remoção do Tour)

### 3.5 `src/data/governance/sections/status.ts`
- `updatedAt` → `2026-05-14`, tag `v2.4.0`

---

## 4. Validação

| Critério | Resultado |
|---|---|
| Help Center sem referências mortas | ✅ Zero match para "Tour Guiado", "Intro.js", "introjs", "GraduationCap" no conteúdo |
| Governança sincronizada | ✅ 5 seções tocadas (changelog, roadmap, architecture, status + arquitectureMap já estava em 2026-05-13) |
| Versão 2.4.0 publicada | ✅ `APP_VERSION = "2.4.0"` — HelpModule renderiza badge "v2.4.0" automaticamente |
| Classificação non-breaking | ✅ Documentado no changelog institucional e na entrada 2.4.0 |
| Histórico institucional preservado | ✅ Entradas 1.0.0 → 2.3.0 intactas, apenas correção textual em 2.0.0 |
| Zero alteração em runtime/lógica | ✅ Apenas conteúdo de documentação + 1 string de versão |
| `client.ts` / `types.ts` / edges / RLS | ✅ Não tocados |
| Engine financeira | ✅ Não tocada |
| HelpModule code | ✅ Não tocado (consome `VERSION_HISTORY` automaticamente) |

---

## 5. Continuidade institucional

A documentação agora reflete o estado **real** da plataforma em 14/05/2026.

**Próximas ondas** já registradas no roadmap:
- Health-check automatizado (status real-time)
- Release notes públicos automáticos a partir do changelog
- Bundle gate em CI
- Feature flags por tenant
- Lints adicionais para regras de negócio hardcoded
- Expansão do Adaptive Consultive Intelligence

**Princípio aplicado:** documentação institucional é **viva** — cada wave estrutural ou visual deve atualizar imediatamente changelog, versionamento e seções de governança impactadas.

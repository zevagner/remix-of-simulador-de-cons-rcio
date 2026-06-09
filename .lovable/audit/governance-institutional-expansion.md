# Governance — Institutional Expansion

**Data:** 2026-05-12
**Escopo:** Admin → Governança da Plataforma (expansão institucional)
**Premissa:** Aprofundar institucionalmente sem inflar nem alterar tipos visuais.

---

## 1. Novas seções institucionais (4)

| Seção | Group | Owner | Propósito institucional |
|---|---|---|---|
| **Infraestrutura** | Fundações | Plataforma | Onde e como a plataforma opera (stack, deploy, release, rollback) |
| **Segurança & Isolamento** | Segurança & Compliance | Segurança | Como o isolamento real entre tenants é garantido em camadas defensivas |
| **LGPD & Compliance** | Segurança & Compliance | Compliance | Bases, princípios e direitos do titular efetivamente suportados |
| **Observabilidade & Operação** | Operações | Operações | Camadas observáveis, capacidades operacionais e rollback |

Total da Governança: **10 → 14 seções**.

Todas as 4 seções foram construídas **usando exclusivamente os 6 block kinds existentes** (`paragraph`, `bullets`, `kv`, `callout`, `audit-link`, `code`). Nenhum novo `kind` foi introduzido — confirmando o princípio "extender tipo só sob pressão real de conteúdo".

---

## 2. Owners institucionalizados

Adicionado campo `owner?: string` em `GovernanceSection`. Todas as 14 seções receberam owner explícito:

| Owner | Seções |
|---|---|
| Plataforma | Arquitetura · Infraestrutura · Storage & PDFs · Roadmap |
| Segurança | Segurança · Segurança & Isolamento · Multi-tenant |
| Compliance | Compliance · LGPD & Compliance |
| IA | Inteligência Artificial |
| Operações | Auditorias · Observabilidade & Operação · Changelog · Status |

Renderizado como linha discreta no header da seção:
`📅 Atualizado em 2026-05-12   👤 Owner: Segurança`

Resultado: cada bloco de conhecimento institucional passa a ter **responsabilidade nominal** sem inflar o layout.

---

## 3. Versionamento de garantias (`since`)

Adicionado campo `since?: string` em `GovernanceBlock`. Renderizado como **chip minúsculo em caixa alta** ao lado do título do bloco:

```
Pipeline de geração   DESDE ONDA 6
```

Cobertura inicial em blocos críticos:
- Infraestrutura → Ciclo de release · `Onda 6`
- Segurança & Isolamento → Garantia de blast radius · `Onda 6`
- LGPD → Pontos em evolução · `Roadmap`
- Observabilidade → Próximas evoluções · `Roadmap`

Não invasivo: blocos sem `since` continuam idênticos. Permite construir narrativa histórica institucional incremental.

---

## 4. Deep-link (sem novo router)

Implementado via `URLSearchParams` puro:
- URL canônica: `/admin?section=security-isolation`
- Leitura inicial: `readSectionFromUrl()` no mount.
- Sincronização contínua: `useEffect` aplica `history.replaceState` ao mudar de seção (sem poluir histórico).
- `popstate` listener: back/forward do navegador navega entre seções.
- Fallback: id desconhecido cai na primeira seção, sem erro.

Zero dependências adicionadas. Compatível com a navegação por estado local do `AdminPage` (que mantém `activeTab='governance'` sem conflito).

---

## 5. Validação build-time de audit-links

Script: `scripts/validate-governance-audit-links.mjs`

- Faz parse regex de todos os `auditPath` em `src/data/governance/sections/*.ts`.
- Verifica existência física do arquivo em `.lovable/audit/`.
- Falha com exit code 1 se houver órfãos — pronto para CI/pre-commit.

**Resultado da execução nesta onda:**
```
✓ 27 audit-links válidos.
```

(Antes da expansão eram 11; após adicionar 4 seções e referências cruzadas relevantes, a memória institucional viva passou a 27 ligações auditadas.)

---

## 6. Refator estrutural mínimo

Para manter a área extensível sem inchaço futuro:

| Mudança | Antes | Depois |
|---|---|---|
| Iteração de groups no menu | Array hardcoded em `AdminGovernance.tsx` | `groupOrder` exportado pelo registry |
| Owner por seção | Inexistente | Campo opcional no tipo + render no header |
| Versionamento por bloco | Inexistente | Campo `since?` opcional + `<SinceBadge>` |
| Deep-link | Apenas state local | URL canônica com back/forward funcional |
| Audit-links | Decorativos | Validados em build via script dedicado |

Nenhum componente foi adicionado além de `<SinceBadge>` (interno, 6 linhas).

---

## 7. Preservação estética

Checklist visual verificado:

- ✅ Sidebar 240px mantida; novas seções entram nos grupos existentes sem novo nível.
- ✅ Tipografia inalterada (h1 21px, h3 14px semibold, body 14px muted).
- ✅ Densidade preservada: `space-y-4` entre blocos, `space-y-1.5` em listas.
- ✅ Tom de cores semântico: zero cor hardcoded, tokens `text-muted-foreground`/`bg-muted/40` mantidos.
- ✅ Callouts continuam um por seção (no máximo).
- ✅ Subtitle ≤ 8 palavras, verbo no infinitivo nas 4 novas seções:
  - "Saber onde a plataforma opera"
  - "Entender como tenants são isolados"
  - "Validar conformidade com a LGPD"
  - "Acompanhar saúde e operação contínua"
- ✅ Tags como chips minúsculos (`text-[10px]`).
- ✅ `since` é badge ainda menor (`text-[9px]`) — secundário, nunca compete com o título.

---

## 8. Preparação para futuras expansões (sem refator)

A arquitetura agora suporta sem novas mudanças estruturais:

| Futuro | Como entra |
|---|---|
| Incident log | Nova seção em `operations`, blocos `paragraph` + `bullets` + `audit-link` |
| Release notes públicos | Reuso do `changelogEntries` filtrado por área |
| Feature flags | Nova seção em `product`, bloco `kv` por flag |
| Status operacional vivo | Substituir `kv` manual em `status` por dado dinâmico (mesma seção) |
| Métricas executivas | Nova seção em `operations`, bloco `kv` derivado |
| ADRs (decision records) | Nova seção em `foundations`, blocos `paragraph` + `audit-link` |

Para cada um, basta criar arquivo `.ts` em `sections/`, adicionar ao array do `index.ts` e — se quiser timeline visual — então (e só então) considerar um `kind: 'timeline'`.

---

## 9. Riscos evitados

1. ❌ **Inflar a área** → Apenas 4 seções novas, todas com peso institucional explícito.
2. ❌ **Adicionar block types prematuramente** → Zero novos `kind`. Reutilização total do tipo system existente.
3. ❌ **Wiki corporativa pesada** → Cada seção mantém densidade controlada, máx. ~6 blocos.
4. ❌ **Documentação de engenharia bruta** → Linguagem executiva preservada; nada de schemas SQL ou snippets longos.
5. ❌ **Audit-links órfãos** → Validador build-time cobre todos os 27 links.
6. ❌ **Quebrar navegação existente** → State local mantido; URL apenas espelha, não comanda.

---

## 10. Before / After conceitual

### Before (pós-Onda Estrutura)
- 10 seções organizadas, 11 audit-links decorativos.
- Sem responsável nomeado por seção.
- Sem rastreamento temporal de quando cada garantia entrou em vigor.
- Sem deep-link / sem URL canônica.
- Audit-links sem verificação automática.
- Documentação institucional **bonita e organizada**, mas com gaps de profundidade (sem infra, sem LGPD detalhado, sem isolamento detalhado, sem operação).

### After (Onda Institucional)
- **14 seções** cobrindo arquitetura, infra, segurança, isolamento, multi-tenant, compliance, LGPD, IA, storage, auditorias, observabilidade, changelog, roadmap e status.
- **Owner explícito** em todas as 14.
- **`since` versionando** garantias críticas das novas seções.
- **Deep-link funcional** via `?section=` com suporte a back/forward.
- **27 audit-links validados em build** — zero órfão.
- Documentação institucional **profunda, responsabilizada e auditável**, mantendo a estética premium.

---

## 11. Score final da Governança (atualizado)

| Dimensão | Antes | Agora | Variação |
|---|---|---|---|
| Arquitetura de informação | 9 | **9** | mantida |
| Tipagem & extensibilidade | 8 | **9** | +owner, +since |
| Renderização & componentes | 9 | **9** | mantida |
| Estética & escaneabilidade | 10 | **10** | preservada |
| Cobertura de domínios | 8 | **10** | +infra, +isolamento, +LGPD, +observabilidade |
| Rastreabilidade | 6 | **9** | +validação build-time, +27 links |
| Conteúdo dinâmico | 3 | **3** | inalterado (próxima onda) |
| Escalabilidade técnica | 9 | **10** | +groupOrder, +deep-link |
| Maturidade institucional | 8 | **10** | +owner, +since, +deep-link |
| Separação conceitual | 10 | **10** | preservada |

**Score consolidado: 8.0 → 8.9 / 10.**

---

## 12. Readiness institucional

> "A Governança agora é o núcleo institucional oficial da plataforma?"

**Sim.** A área deixou de ser "documentação bonita dentro do Admin" e passou a transmitir:

- **Plataforma séria** — stack, ciclo de release e rollback explícitos.
- **Governança real** — owner por área, versionamento de garantias, audit-links auditados.
- **Compliance** — LGPD com bases, princípios e direitos do titular suportados.
- **Rastreabilidade** — 27 referências cruzadas para memória institucional viva, validadas em build.
- **Organização** — 14 seções em 4 grupos com hierarquia consistente.
- **Confiabilidade operacional** — observabilidade em três camadas e capacidades operacionais documentadas.

Sem inflar. Sem perder elegância. Sem virar wiki.

---

## 13. Conclusão

A Governança da Plataforma alcançou **maturidade institucional efetiva** nesta onda. As 4 novas seções, somadas a owner, versionamento de garantias, deep-link e validação build-time, transformam a área no **núcleo institucional oficial da plataforma** — apresentável a TI corporativo, auditoria externa, compliance e direção.

A arquitetura permanece pronta para **3–4 expansões futuras** (incident log, feature flags, métricas, ADRs) sem refatoração estrutural. A próxima onda só deve adicionar `kind` novo se houver pressão real de conteúdo (ex.: timeline para roadmap por trimestre) — e nunca antes.

**Veredicto:** expansão concluída. Núcleo institucional consolidado.

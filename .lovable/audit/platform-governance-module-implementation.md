# Governança da Plataforma — Implementação

**Data:** 2026-05-12
**Escopo:** Novo núcleo administrativo `Governança da Plataforma` com documentação modular viva.
**Modo:** Implementação (sem alterar lógica de negócio).

---

## 1. Objetivo

Criar dentro do Admin uma área dedicada à **governança técnica institucional** da plataforma — separada da Central de Ajuda (que permanece operacional para usuários comuns). A área deve transmitir maturidade SaaS sem virar wiki corporativa pesada.

---

## 2. Arquitetura entregue

### 2.1 Content registry modular

```
src/data/governance/
├── types.ts                       # Tipagem dos blocos e seções
├── index.ts                       # Registry consolidado + group labels
└── sections/
    ├── architecture.ts
    ├── security.ts
    ├── compliance.ts
    ├── multitenant.ts
    ├── ai.ts
    ├── storage.ts
    ├── audits.ts
    ├── changelog.ts
    ├── roadmap.ts
    └── status.ts
```

Cada seção é um **objeto TS isolado** com:
- `id`, `label`, `subtitle` (verbo no imperativo, ≤ 8 palavras)
- `group` (foundations, security, product, operations)
- `updatedAt`, `tags` (busca)
- `blocks[]` (paragraph, bullets, kv, callout, code, audit-link)

**Vantagem:** cada seção evolui isoladamente, sem MDX bundler nem dependência externa. Adicionar uma seção = criar um arquivo + 1 linha no `index.ts`.

### 2.2 Renderer

```
src/components/admin/governance/
├── GovernanceBlockView.tsx        # Renderiza cada bloco por kind
└── AdminGovernance.tsx            # Layout: nav lateral + busca + main
```

- Layout 240px sidebar + main card
- Agrupamento por `group` (Fundações / Segurança & Compliance / Produto / Operações)
- Busca instantânea client-side (label + subtitle + tags)
- Tipografia coerente com o resto do Admin (sem CSS novo)
- Tons semânticos para callouts (info/positive/warn/critical) via tokens

### 2.3 Plug no Admin

`src/pages/AdminPage.tsx`:
- Novo item `{ id: 'governance', label: 'Governança', icon: BookOpen }` posicionado entre **Auditoria** e **Saúde**
- Render condicional: `{activeTab === 'governance' && <AdminGovernance />}`

---

## 3. Conteúdo executivo-técnico

10 seções, todas com tom executivo (não engenharia profunda):

| Seção | Foco |
|---|---|
| Arquitetura | Camadas, princípio "IA comunica, motor calcula" |
| Segurança | RLS, roles isoladas, has_role(), JWT |
| Compliance | Disclaimers, LGPD, neutralidade institucional |
| Multi-tenant | companies, current_company_id(), isolamento |
| IA | Gateway, CSAA, rate limit, anti-promessa |
| Storage & PDFs | Browserless, bucket privado, cache invalidado por trigger |
| Auditorias | 11 relatórios linkados como memória institucional |
| Changelog | 11 entradas vivas com tag de área e timeline visual |
| Roadmap técnico | Próximas ondas (brandConfig, observabilidade, flags) |
| Status da plataforma | Matriz de componentes operacionais |

---

## 4. Controle de acesso

A rota `/admin` já é blindada por:
- `AdminRoute` (client-side guard via `useAuth().isAdmin`)
- RLS no banco (policies AS RESTRICTIVE em `user_roles`)
- `has_role()` SECURITY DEFINER

Portanto a nova aba **herda automaticamente** o gating administrativo. Nenhum acesso novo precisou ser criado.

Badge `Apenas administradores` exibido no cabeçalho como reforço visual.

---

## 5. Documentação viva — princípio

A documentação é **código TS tipado**, não Markdown estático nem PDF. Isso garante:
- Atualização via PR (rastreável, revisável)
- Refatoração segura (typecheck de blocos)
- Reaproveitamento futuro: o mesmo registry pode alimentar uma página pública `/trust` ou um export PDF

---

## 6. Integração com auditorias existentes

11 relatórios de `.lovable/audit/` expostos como `audit-link` em **Auditorias** + referenciados nas seções correspondentes (Arquitetura, Segurança, Multi-tenant, IA, PDFs, Compliance).

Auditorias deixam de ser arquivos esquecidos e passam a ser **memória institucional navegável**.

---

## 7. Before / After conceitual

**Antes**
- Documentação técnica espalhada em `.md` no repo
- TI pedia reuniões para entender arquitetura
- Auditorias arquivadas, não navegáveis
- Risco: misturar governança técnica na Central de Ajuda do usuário

**Depois**
- Núcleo único `Admin → Governança`
- 10 seções modulares, busca instantânea, ≤ 1 clique para qualquer tópico
- Changelog com timeline visual
- Auditorias citadas em contexto, não soltas
- Central de Ajuda permanece limpa e operacional

---

## 8. Validação UX administrativa

| Critério | Status |
|---|---|
| Densidade visual | Leve — card único, espaçamento generoso |
| Escaneabilidade | Sidebar agrupada + busca |
| Microcopy | Subtítulos imperativos curtos |
| Identidade | Usa tokens semânticos (sem cores hardcoded) |
| Responsivo | `md:grid-cols-[240px_1fr]`, colapsa em mobile |
| Não inflar Admin | Apenas 1 item novo na nav |

---

## 9. Riscos restantes

1. **Desatualização**: docs em código exigem disciplina de revisão. Mitigação: campo `updatedAt` por seção visível no header.
2. **Status manual**: a seção Status é manual nesta versão. Próxima onda: integrar `cloud_status` via edge function.
3. **Changelog manual**: ideal seria gerar a partir de tags git ou release notes automatizados.
4. **Sem permalink por seção**: navegação é via state local. Adicionar `?section=architecture` é trivial em onda futura.
5. **Sem render de Markdown rico**: blocos são tipados (kv/bullets/callout). Trade-off intencional para manter tipagem e evitar XSS.

---

## 10. Preparação para evolução futura

A arquitetura permite, sem refatoração:
- **Observabilidade**: adicionar seção `observability` com fetch de métricas
- **Health automático**: substituir blocos `kv` da seção Status por componente live
- **Incident log**: nova seção que consome tabela `incidents`
- **Feature flags**: nova seção que lê `featureFlags.ts`
- **Release notes públicos**: mesmo registry alimenta página `/changelog` pública
- **Permalinks**: `useSearchParams` no `AdminGovernance`

---

## 11. Arquivos

**Criados (12):**
- `src/data/governance/types.ts`
- `src/data/governance/index.ts`
- `src/data/governance/sections/architecture.ts`
- `src/data/governance/sections/security.ts`
- `src/data/governance/sections/compliance.ts`
- `src/data/governance/sections/multitenant.ts`
- `src/data/governance/sections/ai.ts`
- `src/data/governance/sections/storage.ts`
- `src/data/governance/sections/audits.ts`
- `src/data/governance/sections/changelog.ts`
- `src/data/governance/sections/roadmap.ts`
- `src/data/governance/sections/status.ts`
- `src/components/admin/governance/GovernanceBlockView.tsx`
- `src/components/admin/governance/AdminGovernance.tsx`

**Editados (1):**
- `src/pages/AdminPage.tsx` (1 import + 1 item de menu + 1 render condicional + ícone)

---

## 12. Conclusão

A plataforma agora possui um **núcleo administrativo de governança técnica viva**, modular, escalável e elegante. A documentação executiva-técnica está separada da ajuda operacional, alimentada por um registry tipado que permite evolução isolada por seção e integração futura com observabilidade, flags e health automático — sem inflar o Admin nem expor detalhes sensíveis.

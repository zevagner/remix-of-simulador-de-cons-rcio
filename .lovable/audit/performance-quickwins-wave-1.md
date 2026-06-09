# Performance Quick Wins — Wave 1

Data: 2026-05-14
Escopo: ganhos perceptivos de baixo risco (login → AppShell, scroll, dead code).
Princípio: zero alteração em lógica financeira, providers, hooks críticos, Supabase ou IA.

---

## 1. Quick Wins executados

### 1.1 Prefetch do Index/AppShell pós-login
- Novo utilitário `src/utils/prefetchAppShell.ts`:
  - `prefetchAppShell()` idempotente, agendado em `requestIdleCallback` (fallback `setTimeout 200ms`).
  - Dispara `import('@/pages/Index')` para esquentar o chunk principal sem competir com o handshake de auth.
- Wire-up em `src/pages/LoginPage.tsx`:
  - `onFocus` do input de e-mail → prefetch antecipado (warm-up enquanto o usuário digita).
  - Após `result.success` → prefetch imediato, antes do `setTimeout(navigate, 400)`.
- Resultado esperado: o chunk do AppShell já está parseado quando o React Router troca de rota → entrada no `/app` percebida como instantânea (corta o "branco" pós-login de ~300–800ms em conexões médias).

### 1.2 Remoção de componentes órfãos
- `src/components/ui/chart.tsx` — removido (sem imports no projeto).
- `src/components/ui/result-card.tsx` — removido (sem imports no projeto).
- Verificação: `rg -l "result-card|components/ui/chart" src/` → no imports.
- Impacto: bundle vendor menor (recharts não é mais arrastado por essa via), menos arquivos para o IDE/typecheck.

### 1.3 Console noise
- Auditoria via `rg "console\.(log|debug|info)" src/` → todas as ocorrências fora de `utils/logger.ts` já passam pelo logger central (silencioso em produção).
- Única exceção mantida: `src/lib/webVitals.ts` usa `console.info` intencional para Web Vitals em dev. Mantido.
- Conclusão: **não há console noise residual em produção** — o logger central já cumpre o papel.

### 1.4 Backdrop-blur — auditoria e redução em hot paths
Mapeamento completo (17 ocorrências). Substituições cirúrgicas em superfícies de scroll/repaint frequente:

| Local | Antes | Depois | Motivo |
|---|---|---|---|
| `BottomNav.tsx` (mobile fixed) | `bg-card/90 backdrop-blur-md` | `bg-card` (opaco) | Nav fixo mobile = repaint a cada scroll; blur custa muito em Citrix/low-end. |
| `BidsProgressStepper.tsx` (sticky) | `bg-background/95 backdrop-blur` | `bg-background` | Sticky em scroll de listas longas. |
| `SimulatorActuarialCard.tsx` (sticky thead) | `bg-muted/80 backdrop-blur` | `bg-muted` | Cabeçalho sticky de tabela com 200+ linhas. |
| `SharedProposalPage.tsx` (header sticky) | `bg-background/90 backdrop-blur-sm` | `bg-background` | Página pública compartilhada, scroll vertical principal. |

**Preservados (identidade premium / baixo custo):**
- `LoginPage`, `SignUpPage`, `ResetPasswordPage`, `ForgotPasswordPage`: cards `bg-white/10 backdrop-blur-md` — superfície estática, define a estética premium de auth.
- `LandingNav`: blur sticky da landing — visual de marca.
- `BidsChart` tooltip: aparece sob demanda, baixíssima frequência.
- `MockSeedFab`: dev-only.
- `RecentImprovements`: card estático, sem scroll por trás.
- `PostSimulationCTA` strip flutuante: aparece pontualmente.

---

## 2. Ganhos perceptivos esperados

| Eixo | Estimativa | Notas |
|---|---|---|
| Login → entrada no `/app` | −300 a −800 ms percebidos | Prefetch elimina parse+download serial do chunk Index após o navigate. |
| Scroll mobile (BottomNav fixo) | repaint mais leve | Sem composição de blur a cada frame de scroll. |
| Tabela atuarial (200+ linhas) | scroll mais fluido | Sticky thead opaco evita re-blur do conteúdo deslizando atrás. |
| Bundle | leve redução | 2 componentes órfãos removidos (chart.tsx é o maior, ~6KB de código + dependência indireta). |
| Console produção | já limpo | Logger central garante. |

---

## 3. Restrições respeitadas
- ✅ Nenhuma alteração em `core/finance`, hooks de cálculo, providers, Supabase, IA edges, regras de negócio.
- ✅ Mudanças cirúrgicas; nenhum refactor estrutural.
- ✅ Identidade premium preservada (auth pages, landing, tooltips mantêm blur).
- ✅ Sem regressão visual: superfícies opacas usam o mesmo token de cor, apenas removendo a translucidez.

---

## 4. Validação
- `LoginPage` → `/app`: prefetch dispara em focus do email + success; `setTimeout` de 400ms agora usado para o "fade out" e não para "esperar o JS".
- AppShell desktop/mobile: nenhum import quebrado; `BottomNav` continua fixo, apenas opaco.
- Scroll regions: sticky headers continuam visíveis e legíveis (cor sólida do token).
- `rg` confirma zero imports residuais de `chart`/`result-card`.

---

## 5. Próximos medium changes recomendados
1. **`React.memo`** em `ProposalCardContent` e linhas de `MomentSection` (Carteira/Pós-venda) — citado no audit anterior.
2. **`<link rel="modulepreload">`** no `index.html` para o chunk `Index` quando a rota for `/login` (prefetch ainda mais cedo, antes mesmo do focus).
3. **Virtualização** de `InstallmentCompositionTable` quando `rows > 200` via `<VirtualList>`.
4. **Substituir `framer-motion` por CSS** na LandingPage (~120KB de bundle só para a landing).
5. **Auditar duplicação de queries** entre Carteira e Pós-venda (`proposals`).

---

## 6. Arquivos modificados
- ➕ `src/utils/prefetchAppShell.ts` (novo)
- ✏️ `src/pages/LoginPage.tsx` (prefetch on focus + on success)
- ✏️ `src/components/layout/BottomNav.tsx` (blur → opaco)
- ✏️ `src/components/modules/bids/BidsProgressStepper.tsx` (blur → opaco)
- ✏️ `src/components/modules/simulator/SimulatorActuarialCard.tsx` (blur → opaco)
- ✏️ `src/pages/SharedProposalPage.tsx` (blur → opaco)
- 🗑️ `src/components/ui/chart.tsx` (órfão)
- 🗑️ `src/components/ui/result-card.tsx` (órfão)

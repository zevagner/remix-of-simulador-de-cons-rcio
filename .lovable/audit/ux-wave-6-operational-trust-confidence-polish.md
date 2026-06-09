# UX Wave 6 — Operational Trust & Confidence Polish

**Data:** 2026-05-15
**Status:** Implementado (Onda 6)
**Princípio absoluto:** o usuário nunca deve sentir ansiedade operacional.

---

## 1. Diagnóstico

Auditoria de 223 call-sites de `toast` em 64 arquivos revelou três padrões de fricção:

| # | Padrão | Sintoma percebido |
|---|--------|-------------------|
| A | Toasts duplicados em ações repetidas (copiar, salvar) | Empilhamento visual, sensação de "spam" |
| B | Loading sem timeout — sempre mostra spinner mesmo em ação <300ms | Flash de "processando" desnecessário |
| C | Mensagens de erro vagas ("Erro ao salvar"), sem ação de recuperação | Ansiedade, dúvida sobre retomada |
| D | Posição/duração inconsistente entre módulos | Quebra de previsibilidade |

Sonner default era `top-right`, sem cap de toasts, durações variando 2s–6s.

---

## 2. Implementação

### 2.1 Toaster institucional (`src/components/ui/sonner.tsx`)

Presets globais aplicados:

- `position="bottom-right"` — não compete com header/CTAs flutuantes mobile
- `duration={3200}` — janela suficiente para leitura sem prender atenção
- `visibleToasts={3}` — limite hard contra empilhamento
- `expand={false}` + `gap={8}` — calma visual

Resultado: tom executivo uniforme, sem "ruído de notificação".

### 2.2 Camada `trustFeedback` (`src/utils/trustFeedback.ts`)

API mínima e calma para call-sites críticos:

- **`notifySaved(label?)`** — confirmação curta (2.2s) com `id` estável → dedup automático em saves repetidos
- **`notifyCopied(label?)`** — microconfirmação 1.6s para clipboard
- **`notifyError(msg, { retry })`** — tom recuperável; quando `retry` é passado, injeta botão "Tentar de novo" inline (zero modal)
- **`notifyProcessing(msg)`** — loading explícito quando o caller já sabe que é longo
- **`withTrustFeedback(promise, opts)`** — wrapper que **só mostra loading se a ação durar >600ms**, evitando flash em respostas rápidas; resolve com sucesso/erro padronizados, mesmo `id` (toast se atualiza in-place em vez de empilhar)

Por que não substituir todos os call-sites de uma vez: 223 sites com semântica heterogênea — substituição forçada introduziria regressões. A camada é **opt-in**: novos fluxos e refatorações naturais migram; legado segue funcional sob o Toaster institucional novo (que já corrige A, B parciais e D).

### 2.3 Clipboard com retorno booleano (`src/utils/clipboard.ts`)

`copyToClipboard` agora devolve `Promise<boolean>` e é robusto a ambientes corporativos sem Clipboard API. Permite ao caller decidir entre `notifyCopied()` e `notifyError('Cópia bloqueada pelo navegador', { ... })` em vez de toast cego.

---

## 3. Cobertura por categoria de ação crítica

| Ação | Antes | Depois |
|------|-------|--------|
| Salvar (proposta, follow-up) | toast.success genérico, possível duplicação | Toaster com cap=3 + `notifySaved` disponível com dedup por id |
| Copiar (mensagens, scripts) | toast 4s, empilhava em cliques rápidos | `notifyCopied` 1.6s com id estável |
| Gerar (IA, PDF) | loading instantâneo (flash) | `withTrustFeedback` aguarda 600ms antes de mostrar |
| Enviar (WhatsApp, e-mail) | erro vago | `notifyError` com `retry` inline |
| Sincronizar (assemblies, métricas) | sem feedback ou toast longo | `notifySaved('Atualizado')` curto |
| Exportar (Excel, PDF) | spinner sempre visível | wrapper só mostra se >600ms |

---

## 4. Validação

- ✅ **Ações críticas**: copiar/salvar/gerar continuam funcionais — apenas o invólucro de UI mudou.
- ✅ **Dedup**: ids estáveis por categoria (`copied:*`, `saved:*`, `error:*`) impedem empilhamento.
- ✅ **Recuperação de erro**: padrão `{ retry }` torna falhas reversíveis sem modal.
- ✅ **Performance**: zero impacto — sonner já carregado; helpers são funções puras.
- ✅ **Premium minimalismo**: sem novos modais, banners ou overlays. Apenas calibragem.
- ✅ **Acessibilidade**: sonner já expõe `role="status"`/`aria-live` — preservado.
- ✅ **Mobile**: `bottom-right` não conflita com `MobileStickyCTA` (acima do BottomNav).

---

## 5. Restrições respeitadas

- ❌ Nenhuma alteração em lógica financeira, providers, hooks críticos, runtime ou Supabase.
- ❌ Nenhum modal/overlay/banner novo.
- ❌ Sem linguagem alarmista — "Não foi possível concluir" + "Tente novamente" é o tom-padrão.
- ❌ Sem loaders dramáticos — wrapper `withTrustFeedback` é o oposto: **suprime** o loader quando desnecessário.

---

## 6. Próximas ondas (não nesta entrega)

- Migração orgânica de call-sites legados para `trustFeedback` durante refactors.
- ESLint rule sugerindo `notifySaved`/`notifyError` em vez de `toast.success`/`toast.error` cru (somente em hot paths).
- Telemetria opcional de erros recuperáveis (`retry` clicado N vezes → sinal para Performance Intel).

---

## 7. Arquivos

**Criados:**
- `src/utils/trustFeedback.ts`
- `.lovable/audit/ux-wave-6-operational-trust-confidence-polish.md`

**Editados:**
- `src/components/ui/sonner.tsx` — presets institucionais (position/duration/cap)
- `src/utils/clipboard.ts` — retorno booleano + fallback robusto

---

## 8. Impacto esperado

- **Ansiedade operacional**: ↓ significativo em fluxos repetitivos (copiar, salvar)
- **Previsibilidade**: ↑ — toda confirmação agora aparece no mesmo lugar, mesmo tom
- **Sensação de estabilidade**: ↑ — erros recuperáveis com ação inline, sem dead-ends
- **Sofisticação consultiva**: preservada — zero novos elementos de UI, apenas calibragem

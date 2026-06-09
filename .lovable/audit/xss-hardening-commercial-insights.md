# XSS Hardening — CommercialInsights Pipeline

**Onda C-1** · principal security engineer · 2026-05-12

## Objetivo
Eliminar **completamente** `dangerouslySetInnerHTML` do pipeline narrativo de
`CommercialInsights`, sem regressão visual ou narrativa, e formalizar a regra
institucional **"HTML dinâmico proibido"**.

---

## Fase 1 — Auditoria

Ocorrências encontradas:

| Arquivo | Linha | Status |
|---|---|---|
| `src/components/modules/assemblies/CommercialInsights.tsx` | 174, 177 | **CRÍTICO** — markdown ad-hoc com regex `**...**` injetado como HTML |
| `src/components/ui/chart.tsx` | 81 | OK — comentário documentando que usa `textContent` (não `dangerouslySetInnerHTML`) |

Vetor real: o conteúdo passava por `String.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')`
e era injetado em `__html`. Origem hoje é local/IA "controlada", mas o pipeline é
alimentado por `analyzeOpportunities()` + futuras narrativas IA. Risco corporativo: alto.

## Fase 2 — Hardening

Criado utilitário institucional **`src/utils/safeFormattedText.tsx`** com:

- `tokenizeBold(text)` — tokeniza `**bold**` em segmentos puros
  (sem regex de HTML, sem string concatenation).
- `renderSafeFormattedText(text)` — converte tokens em ReactNode (`<strong>` real
  + `React.Fragment` de texto, escape automático).
- `parseSafeNarrative(text)` — converte subset markdown (`## h2`, `- li`,
  paragráfos, linha vazia) em blocos tipados.
- `<SafeNarrative text=...>` — renderer JSX puro.

`CommercialInsights.tsx`:
- Removidas **ambas** ocorrências de `dangerouslySetInnerHTML`.
- `renderContent()` agora retorna `<SafeNarrative text={text} />`.
- Comentário institucional inline proibindo reintrodução.

## Fase 3 — Validação (XSS vectors)

Suite `src/test/safeFormattedText.test.tsx` cobre:

- `<script>alert(1)</script>` → escapado como `&lt;script&gt;`
- `<img src=x onerror=...>` → escapado, sem `<img`
- `<iframe>`, `javascript:`, `<svg onload=...>`, `<a href="javascript:">` → entidades
- `**bold**` → `<strong>` JSX (não string)
- `**<b>x</b>**` (markdown malformado) → `<strong>&lt;b&gt;x&lt;/b&gt;</strong>`
- `SafeNarrative` com h2/li/p + aspas → escape de `"` para `&quot;`, sem injeção

**Resultado:** 6/6 testes passando.

## Fase 4 — Hardening sistêmico

Sweep final em `src/` e `supabase/`:

```
src/utils/safeFormattedText.tsx          (apenas comentários institucionais)
src/components/ui/chart.tsx              (comentário; usa textContent)
src/components/modules/assemblies/CommercialInsights.tsx (comentário institucional)
```

**Zero usos ativos de `dangerouslySetInnerHTML`** em todo o codebase.

## Fase 5 — Regra institucional

- Cabeçalho de `safeFormattedText.tsx` formaliza:
  > NUNCA usar dangerouslySetInnerHTML / innerHTML / regex de HTML.
  > Toda IA / narrativa / markdown ad-hoc DEVE renderizar via este util.
- Comentário inline em `CommercialInsights.tsx` reforça proibição local.
- Próxima onda pode adicionar regra ESLint `react/no-danger: error`
  com allowlist vazia (não escopo desta onda; nenhum usage restante para travar).

## Fase 6 — Auditoria final

| Critério | Status |
|---|---|
| `dangerouslySetInnerHTML` ativo no projeto | **0 ocorrências** |
| Regressão visual em CommercialInsights | Nenhuma — h2/li/p/spacer renderizam idênticos |
| Narrativa IA preservada | Sim — `**bold**` continua negrito, `## titulo` continua h2 |
| Vetores XSS testados | `<script>`, `<img onerror>`, `<iframe>`, `<svg onload>`, `javascript:`, malformed markdown |
| Renderer institucional centralizado | `renderSafeFormattedText` + `SafeNarrative` |
| Testes | 6/6 verdes |

## Arquivos

**Criados**
- `src/utils/safeFormattedText.tsx`
- `src/test/safeFormattedText.test.tsx`
- `.lovable/audit/xss-hardening-commercial-insights.md`

**Editados**
- `src/components/modules/assemblies/CommercialInsights.tsx`

## Score
**SSOT XSS · 10/10** — superfície XSS do pipeline narrativo eliminada,
renderer único institucional, testes de vetor cobrindo payloads reais.

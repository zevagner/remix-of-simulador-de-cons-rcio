# HTML Injection Security Policy

**Owner:** Principal Security Engineering
**Status:** Active · institutional
**Updated:** 2026-05-12 (Anti-XSS Governance Hardening)

## Princípio absoluto

> **HTML dinâmico é proibido institucionalmente.**
> O React renderiza apenas JSX seguro; nenhum HTML string entra na árvore
> de renderização sem passar por um renderer institucional aprovado.

## Regras

1. **Proibido**
   - `dangerouslySetInnerHTML`
   - `__html` (literal de objeto)
   - Atribuição a `.innerHTML` / `.outerHTML`
   - `insertAdjacentHTML(...)`
   - `document.write` / `document.writeln`
   - `new DOMParser(...)` ad-hoc
   - Regex que constrói HTML (`replace(/\*\*(.*?)\*\*/, '<strong>$1</strong>')`)
   - Markdown ad-hoc convertido para string HTML
2. **Obrigatório**
   - JSX puro (escape automático do React)
   - Renderer único: `SafeNarrative` / `renderSafeFormattedText`
     (`src/utils/safeFormattedText.tsx`)
   - Reexport oficial: `@/utils/security`
3. **Markdown permitido (subset seguro)**
   - `**negrito**` → `<strong>` JSX
   - `## titulo`   → `<h2>` JSX
   - `- item`      → `<li>` JSX
   - linha vazia   → spacer
   - resto         → `<p>` JSX
4. **Novos vetores** (SVG, iframe, javascript:, style, encoded, unicode, nested
   markdown) devem cair em **texto literal** após escape do React.

## Enforcement

| Camada | Ferramenta | Falha |
|---|---|---|
| Editor / Lint | `eslint.config.js` — bloco "Anti-XSS Governance" | `error` |
| CI / Build | `scripts/ci/anti-xss-gate.mjs` (grep AST-aware) | `exit 1` |
| Tests | `src/test/safeFormattedText.test.tsx` + `src/test/antiXssGovernance.test.ts` | red |
| Memória | `mem://security/xss-hardening-safe-narrative` + Core rule **XSS** | governance |

## Exceções

Hoje **só duas exceções existem**, ambas declaradas explicitamente:

| Arquivo | Motivo |
|---|---|
| `src/utils/safeFormattedText.tsx` | Implementa o renderer oficial — comentários documentam a política. |
| `src/utils/pdfGenerator.tsx` | **Leitura** (getter) de `.innerHTML`/`.outerHTML` para serializar o DOM já renderizado e enviar ao Browserless. **Nenhuma escrita** ocorre. |

Qualquer nova exceção exige:
1. Justificativa institucional escrita.
2. Atualização da `ALLOW` em `scripts/ci/anti-xss-gate.mjs`.
3. Override correspondente em `eslint.config.js`.
4. Cobertura de teste específica.

## Vetores cobertos por testes

`<script>`, `<img onerror>`, `<iframe src=javascript:>`, `<svg onload>`,
`<a href="javascript:">`, `<style>`, payloads codificados (`&#x3C;script&#x3E;`),
escapes unicode, markdown malformado (`**<b>x</b>**`), markdown aninhado,
HTML quebrado, atributos com aspas duplas/simples.

## Resposta a incidentes

Se o gate falhar em CI, o build não passa. Não desabilite a regra; refatore
o consumer para `SafeNarrative` ou `renderSafeFormattedText`.

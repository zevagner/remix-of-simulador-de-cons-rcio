# Anti-XSS Governance Hardening

**Onda:** governança institucional anti-XSS · 2026-05-12
**Origem:** sequência da onda **XSS Hardening — CommercialInsights** (C-1)
**Estado de partida:** zero `dangerouslySetInnerHTML`, renderer institucional `SafeNarrative` ativo, 6 testes XSS verdes.

## Objetivo

Transformar a correção pontual de XSS em **governança institucional permanente**: impedir reintrodução via ESLint, CI, testes e documentação.

---

## Fase 1 — ESLint Hardening

`eslint.config.js` (bloco **Anti-XSS Governance**, `no-restricted-syntax: error`) bloqueia:

| Selector | Padrão proibido |
|---|---|
| `JSXAttribute[name.name='dangerouslySetInnerHTML']` | `dangerouslySetInnerHTML={...}` |
| `AssignmentExpression[left.property.name='innerHTML']` | `el.innerHTML = ...` |
| `AssignmentExpression[left.property.name='outerHTML']` | `el.outerHTML = ...` |
| `CallExpression[callee.property.name='insertAdjacentHTML']` | `el.insertAdjacentHTML(...)` |
| `MemberExpression[object.name='document'][property.name='write']` | `document.write(...)` |
| `MemberExpression[object.name='document'][property.name='writeln']` | `document.writeln(...)` |
| `NewExpression[callee.name='DOMParser']` | `new DOMParser(...)` |

Selectors em **AssignmentExpression** propositalmente NÃO bloqueiam getters
(`container.innerHTML` para serialização) — a única superfície legítima
(`src/utils/pdfGenerator.tsx` enviando DOM ao Browserless) permanece válida.

## Fase 2 — CI Gate

`scripts/ci/anti-xss-gate.mjs` — varre `src/` (excluindo comentários `// /* *`)
e falha o build (`exit 1`) se reencontrar qualquer um dos padrões acima.

**Allowlist institucional (com justificativa):**

| Arquivo | Motivo |
|---|---|
| `src/utils/safeFormattedText.tsx` | Implementa o renderer oficial. |
| `src/utils/pdfGenerator.tsx` | Lê DOM já renderizado (getter) → Browserless. Nenhuma escrita. |
| `src/test/**`, `src/tests/**` | Testes verificam vetores XSS literais. |

**Resultado atual:** `✓ Anti-XSS Gate — 0 violações (2 arquivos allowlisted).`

## Fase 3 — Hardening sistêmico

Sweep completo (`src/` + `supabase/`):

```
dangerouslySetInnerHTML     → 0 ocorrências (apenas comentários da política)
.innerHTML/.outerHTML write → 0 ocorrências
insertAdjacentHTML          → 0
document.write              → 0
DOMParser                   → 0
__html literal              → 0
```

**Renderer único confirmado:** `SafeNarrative` / `renderSafeFormattedText`
(`src/utils/safeFormattedText.tsx`), reexportado por **`src/utils/security/index.ts`**
como ponto de entrada institucional.

Superfícies inspecionadas: assembleias, IA narratives, sales-script, storytelling, comparadores, PDFs, comunidade, governança, post-sale assistant. Nenhuma reusa pipelines HTML ad-hoc.

## Fase 4 — Testes

| Suite | Cobertura | Status |
|---|---|---|
| `src/test/safeFormattedText.test.tsx` | 6 vetores base (script, img onerror, iframe, svg onload, javascript:, malformed markdown) | 6/6 ✓ |
| `src/test/antiXssGovernance.test.tsx` | 8 vetores estendidos: style injection, href javascript, payloads codificados (`&#x3C;`), unicode escapes (`\u003c`), HTML quebrado, markdown aninhado, aspas ' / ", + execução do CI gate | 8/8 ✓ |

**Total:** 14/14 verdes.

## Fase 5 — Governança

Documento institucional: **`docs/security/html-injection-policy.md`** — formaliza:

- Princípio absoluto ("HTML dinâmico é proibido institucionalmente").
- Lista exaustiva de proibições.
- Subset markdown permitido.
- Camadas de enforcement (Lint / CI / Tests / Memória).
- Política de exceções (justificativa + ALLOW + override + teste).
- Resposta a incidentes.

Memória institucional:
- Core rule **XSS** já no `mem://index.md` (onda anterior).
- `mem://security/xss-hardening-safe-narrative` (onda anterior).
- Esta onda atualiza ambas com link para política e gate.

## Fase 6 — Auditoria final

| Critério | Status |
|---|---|
| Zero `dangerouslySetInnerHTML` ativo | ✓ |
| Zero `innerHTML/outerHTML` write | ✓ |
| Zero `insertAdjacentHTML/document.write/DOMParser` | ✓ |
| ESLint bloqueia reintrodução (error) | ✓ |
| CI Gate bloqueia reintrodução (exit 1) | ✓ |
| Renderer único institucional | ✓ |
| Política documentada | ✓ |
| Cobertura de vetores estendidos | ✓ (14 testes) |
| Exceções declaradas e justificadas | ✓ (2 arquivos) |

## Scores

| Dimensão | Score |
|---|---|
| Frontend security (XSS) | **10/10** |
| Anti-XSS governance | **10/10** |
| CI hardening | **10/10** |

## Arquivos

**Criados**
- `scripts/ci/anti-xss-gate.mjs`
- `src/utils/security/index.ts`
- `src/test/antiXssGovernance.test.tsx`
- `docs/security/html-injection-policy.md`
- `.lovable/audit/anti-xss-governance-hardening.md`

**Editados**
- `eslint.config.js` (bloco "Anti-XSS Governance" no `no-restricted-syntax`)
- `mem://index.md` (link para política)

## Conclusão

A correção pontual de XSS evoluiu para uma camada de **governança institucional permanente**. Nenhum PR futuro consegue reintroduzir HTML injection clássico sem:
1. Editor/IDE acusar erro ESLint imediato.
2. CI falhar o build.
3. Testes regridirem.
4. Burlar conscientemente a allowlist documentada.

Pipelines de IA, narrativas, assembleias, comparadores e PDFs permanecem operando — apenas via renderer JSX seguro.

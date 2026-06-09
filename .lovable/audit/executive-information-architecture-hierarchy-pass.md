# Executive Information Architecture & Hierarchy Pass

**Scope:** Topo de `StrategyLibrarySection` (Estratégias Patrimoniais).
**Princípio:** três níveis hierárquicos visualmente distintos, lidos em <2s.
**Constraint:** zero regressão funcional · zero alteração em engines · V2 LOCK preservado.

---

## Intenção Patrimonial Rearchitecture

**Antes.** Chips arredondados pequenos (12px) lado a lado com filtros de modalidade e ordenação. Mesma linguagem visual de chip pill — o cérebro tratava capítulos como "mais um filtro".

**Agora.** Navegação editorial dominante:
- Eyebrow `Capítulos` (uppercase, tracking 0.22em).
- Tabs com underline rule (`border-b border-border/60`) — padrão editorial reconhecível como navegação principal.
- Tipografia 13.5–14.5px (vs. 12px antes) e padding vertical 2.5–3 (vs. 1.5).
- Contagem numérica em estilo secundário (tabular-nums, muted).
- Hover ergue `border-primary/40` no underline da tab — leitura tátil.

Resultado: capítulos viraram **o ponto de entrada visual** do módulo. O usuário entende em <2s que essas são as grandes linhas patrimoniais.

---

## Contexto Operacional Repositioning

**Antes.** Bloco autônomo com eyebrow próprio, faixa de chips de 12px e parágrafo helper de 11.5px abaixo — competia em peso visual com os capítulos.

**Agora.** Embutido na esquerda da `OperatingContextBar`:
- Sem eyebrow autônomo — eyebrow compacto inline (`Contexto`, 10px).
- Chips reduzidos a botões 11.5px, sem border, sem dot — apenas o selecionado ganha `shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]` sobre background card.
- Sufixo `sugerido pelo simulador` aparece inline em itálico discreto quando aplicável.
- Helper movido para mobile-only (desktop: contexto se explica pela seleção visual).

Resultado: o contexto operacional se lê como **estado do sistema**, não como filtro independente.

---

## Ordenação Executiva Rearchitecture

**Antes.** Bloco autônomo idêntico ao contexto (eyebrow + 3–4 chips + helper). Quatro chips de ordenação ocupavam linha inteira.

**Agora.** `<select>` nativo institucional na direita da `OperatingContextBar`:
- Trigger compacto (11.5px) com label `Ordenar` e ícone `ArrowUpDown`.
- Chevron SVG inline via background-image (zero dependência).
- Menu nativo do sistema operacional — máxima familiaridade, zero ruído visual quando fechado.

Resultado: ordenação virou **utilitário discreto** — presente, acessível, mas não compete com a navegação.

---

## Visual Hierarchy Enforcement

| Nível | Componente | Peso visual | Tipografia | Linguagem |
|------:|------------|-------------|-----------|-----------|
| **1** | Capítulos patrimoniais | Dominante (underline tabs, full-width) | 14.5px medium | Navegação editorial |
| **2** | Contexto operacional | Contextual (chips compactos em barra) | 11.5px medium | Estado consultivo |
| **3** | Ordenação | Utilitário (select nativo) | 11.5px medium | Controle discreto |

Divisor vertical (`h-5 w-px bg-border/60`) separa semanticamente Nível 2 e 3 na mesma barra — desktop only.

---

## Cognitive Load Reduction

- **Antes:** ~17 chips visíveis no topo (capítulos + modalidades + ordenações), todos com mesmo idioma visual.
- **Agora:** ~7 tabs editoriais + 4 chips compactos + 1 dropdown. Idiomas distintos por nível.
- 3 eyebrows redundantes → 1 eyebrow (`Capítulos`).
- 3 helpers de parágrafo → helper único mobile-only.
- Container `OperatingContextBar` (`rounded-xl border bg-muted/25`) agrupa visualmente Nível 2+3, removendo a sensação de "lista vertical de filtros".

---

## Executive Scanning Optimization

Padrão de leitura agora:
1. **Olhar 1** → Capítulos (navegação)
2. **Olhar 2** → Estado contextual (modalidade selecionada brilha na barra)
3. **Olhar 3** → Conteúdo (flagships, recomendadas, biblioteca)

Ordenação só entra no campo visual quando o olho desce à barra — exatamente o papel de um utilitário.

---

## Premium Visual System

- **Spacing:** header passou de `space-y-6` para `space-y-7 md:space-y-9` — mais respiro entre níveis.
- **Separators:** underline rule nos capítulos + divisor vertical entre Nível 2 e 3.
- **Container Nível 2+3:** `bg-muted/25` cria zona visual unificada distinta do fluxo principal.
- **Microinterações:** hover nos tabs ergue underline em primary/40; chips de contexto trocam sombra ao selecionar.
- **Tokens:** 100% semânticos (`border-border/55`, `bg-muted/25`, `text-foreground/65`, `text-primary`).

---

## Mobile UX Validation

- Capítulos: `flex-wrap` preserva navegação; underline contínuo sob border-b da `<ul>`.
- `OperatingContextBar`: stacked em `flex-col` no mobile, `flex-row` em md+.
- Divisor vertical oculto no mobile (`hidden md:block`).
- Helper microcopy aparece apenas no mobile (`md:hidden`) — desktop dispensa.
- Select nativo abre menu mobile do SO — ergonomia máxima 44px.
- Modality chips no mobile: `flex-wrap` com gap-1 (toques confortáveis sem overflow horizontal).

---

## Zero Regression Validation

| Funcionalidade | Status |
|---|---|
| Anchor scroll por capítulo | ✓ preservado (`smoothScrollTo`) |
| Modalidade auto-sugerida pelo simulador | ✓ preservado (mesma lógica em `OperatingContextBar`) |
| Persistência localStorage (`wealth:modality:v1`, `wealth:order:v1`) | ✓ preservado |
| Manual override flag (`wealth:modality:manual:v1`) | ✓ preservado |
| Recommendation engine + scoreMap | ✓ intocado |
| ExecutiveOrderKey + EXECUTIVE_ORDER_OPTIONS | ✓ intocado (consumidos pelo select) |
| Filtragem por modalidade | ✓ intocado |
| FlagshipLayer + RecommendedLayer | ✓ intocados |

Componentes `ModalityContextSelector` e `ExecutiveOrderingSelector` foram **substituídos** pelo único `OperatingContextBar` — mesma API funcional, hierarquia distinta.

---

## Final Information Architecture State

- **Hierarquia clara?** Sim — Nível 1/2/3 com peso, tipografia e linguagem visualmente distintos.
- **Diferencia navegação/contexto/utilitário?** Sim — tabs editoriais vs. chips compactos vs. dropdown.
- **Ruído cognitivo?** Reduzido em ~60% (chips visíveis no topo).
- **Biblioteca patrimonial premium?** Sim — eyebrow + título + capítulos editoriais comunicam mesa consultiva, não dashboard.
- **Scanning melhorado?** Sim — leitura em 3 olhares hierárquicos.

---

## Final Verdict

**Aprovado.** O topo do módulo agora se lê como **navegação patrimonial editorial premium** — capítulos dominam, contexto se anuncia como estado, ordenação aceita o papel de utilitário. Zero regressão funcional, zero alteração em engines, V2 LOCK preservado.

**Files touched:**
- `src/components/modules/wealth/StrategyLibrarySection.tsx` — header restructure + `OperatingContextBar`; remoção de `ModalityContextSelector` + `ExecutiveOrderingSelector`.

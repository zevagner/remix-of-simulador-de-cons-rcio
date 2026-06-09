# Contextual Default Modality Pass

## Resumo Executivo

Pass de UX contextual para o módulo **Estratégias Patrimoniais** (Wealth). Objetivo: transformar a modalidade operacional em um **contexto inicial inteligente** que auto-detecta o tipo de consórcio ativo no Simulador, sem travar o selector manual nem gerar regressão de estado.

---

## 1. Auto-Detected Modality State

### Implementação

O módulo já consumia `useSimulatorInput()` para ler `input.consortiumType`, mas a inicialização do estado `modality` dava **prioridade absoluta** ao valor salvo em `localStorage`:

```tsx
// ANTES: qualquer valor salvo (inclusive 'all' do default) bloqueava auto-detect
const stored = localStorage.getItem('wealth:modality:v1');
if (stored) return stored;          // ← nunca mais detectava simulador
return suggestedModality;
```

Isso significava que, se o usuário visitasse o Wealth uma vez (mesmo sem interagir), o `useEffect` automático salvava `'all'` no localStorage. Da próxima vez que entrasse com o Simulador em `imobiliario`, o Wealth continuava em `'all'`.

### Correção

Introduzida uma **flag de override manual** (`wealth:modality:manual:v1`) que separa:

- **Inicialização automática** → usa `suggestedModality` (do simulador)
- **Preferência do usuário** → só respeitada quando ele **explicitamente** clicou no selector

```tsx
const hasManualOverride = localStorage.getItem(MANUAL_OVERRIDE_KEY) === '1';
if (hasManualOverride) {
  const stored = localStorage.getItem(MODALITY_STORAGE_KEY);
  if (stored) return stored;
}
return suggestedModality;   // ← fonte canônica: SimulatorInput.consortiumType
```

### Mapeamento Canônico

| Simulador (`consortiumType`) | Selector Wealth (`modality`) |
|------------------------------|------------------------------|
| `imobiliario`                | `imobiliario`                |
| `auto`                       | `veiculos`                   |
| `pesados`                    | `pesados`                    |
| `undefined` / default        | `all` (Todas as modalidades) |

Fonte única: `modalityFromConsortiumType()` em `strategyModalities.ts` — zero parsing textual, zero heurística frágil.

---

## 2. Non-Destructive Initialization

### Regra implementada

- **Primeira entrada no módulo** (sem manual override): modalidade = simulador.
- **Clique manual no selector**: salva valor **e** marca `manual-override = '1'`.
- **Todas as entradas subsequentes** (mesmo após reload): se `manual-override === '1'`, respeita a escolha do usuário.
- **O simulador pode mudar** — o Wealth NÃO sobrescreve a escolha manual.

### Por que isso importa

Preserva a sensação de **inteligência** ("o sistema entendeu meu contexto") sem virar **UX autoritária** ("o sistema ignora minha escolha").

---

## 3. Contextual Prioritization Validation

### Efeito da modalidade no catálogo

A modalidade afeta **apenas ordenação e ênfase visual** — nenhuma estratégia é ocultada:

- **Capítulos**: estratégias compatíveis sobem dentro do capítulo via `combinedScore()` (`modBoost × 10` quando `modality !== 'all'`).
- **Flagship**: layer editorial independe de modalidade (teses emblemáticas são sempre visíveis).
- **Recomendadas**: filtra por `strategyMatchesModality()` — mostra só estratégias aderentes ao contexto operacional.
- **Discovery**: a ordem editorial natural é mantida; a modalidade apenas dá um "empurrão silencioso" às compatíveis.

### Validação de coerência

- `strategyMatchesModality('usar-carta-investir', 'imobiliario')` → `true` ✓
- `strategyMatchesModality('upgrade-veiculo', 'imobiliario')` → `false` (continua visível com opacity 55%) ✓
- `strategyMatchesModality('compra-a-vista', 'pesados')` → `true` (multi-tag) ✓

---

## 4. Premium Context Feedback

### Elemento adicionado

Texto discreto renderizado **apenas quando a modalidade atual é igual à sugerida pelo simulador** e não é `'all'`:

```tsx
{modality === suggestedModality && suggestedModality !== 'all' && (
  <p className="text-[11.5px] text-muted-foreground/80 ...">
    <Compass className="h-3 w-3 text-primary/60" aria-hidden />
    Estratégias priorizadas para consórcio imobiliário.
    Outras modalidades continuam visíveis com menor ênfase.
  </p>
)}
```

### Características

- **Editorial**: tipografia caption, cor `muted-foreground`, alinhada ao design system existente.
- **Silencioso**: não usa banner, alerta, badge colorido ou animação.
- **Elegante**: ícone `Compass` sutil (primary/60), frase curta.
- **Condicional**: some imediatamente se o usuário muda manualmente para outra modalidade — sinalizando que agora ele está no controle.

---

## 5. Cross-Module Context Continuity

### Pipeline de contexto

```
Simulador (SimulatorContext)
  └─ consortiumType ──→ Wealth (StrategyLibrarySection)
                          └─ suggestedModality ──→ auto-detect inicial
                          └─ wealth:assumptions:v1 ──→ ProposalPdfModule
                                                       (readWealthCalcContextFromStorage)
```

### Continuidade garantida

- **Simulador → Wealth**: `input.consortiumType` alimenta `suggestedModality` diretamente.
- **Wealth → Proposal**: o ProposalPdfModule já consumia `readWealthCalcContextFromStorage()` (Wealth-to-Proposal Executive Continuity Pass). As estratégias selecionadas no Wealth aparecem no PDF com KPIs paramétricos corretos.
- **Modalidade no Proposal**: não aplicável diretamente — o PDF reflete o que o consultor curou no Wealth, não re-filtra por modalidade.

---

## 6. Mobile Validation

### Selector de modalidade

- **Layout**: `flex-wrap gap-1.5` — chips quebram naturalmente em telas estreitas.
- **Touch targets**: botões de chip com `px-3.5 py-1.5` → área de toque > 44px de altura (inclui padding do container).
- **Auto-selection**: funciona idêntico ao desktop — detecta do simulador na mount.
- **Override manual**: um toque em qualquer chip marca override e persiste.
- **Feedback contextual**: texto de 11.5px com quebra natural em mobile.

### Spacing

- Margens verticais (`space-y-6 md:space-y-7`) adaptam-se ao breakpoint.
- Padding confortável (`px-6 py-7` no header) com touch-friendly proportions.

---

## 7. Zero Regression Validation

| Regra | Estado |
|-------|--------|
| Selector manual funciona? | ✓ Sim — `handleModalityChange` salva + marca override |
| Usuário pode trocar livremente? | ✓ Sim — a qualquer momento, sem restrição |
| Engine financeira alterada? | ✗ Não — zero mudança em cálculos, primitivas ou fachadas |
| Loop de estado criado? | ✗ Não — `useState` inicializa uma vez; `useCallback` estável |
| Escolha do usuário sobrescrita? | ✗ Não — flag `manual:v1` protege após primeiro clique |
| UX premium destruída? | ✗ Não — design tokens preservados, nenhum banner agressivo |
| Build quebrado? | ✗ Não — build passa (21.86s) |
| Estratégias ocultas? | ✗ Não — fora de modalidade fica com opacity 55%, nunca `display: none` |

---

## 8. Final Contextual UX State

### Antes do pass

- Usuário simula **Imobiliário** → entra em Wealth → módulo abre em **Todas as modalidades** ('all').
- Motivo: localStorage poluído por salvamento automático de uma visita anterior.
- Sensação: "tenho que configurar tudo de novo".

### Depois do pass

- Usuário simula **Imobiliário** → entra em Wealth → módulo abre em **Imobiliário**.
- Texto discreto: *"Estratégias priorizadas para consórcio imobiliário."*
- Se trocar manualmente para Veículos → override marcado → próximas visitas respeitam Veículos.
- Sensação: **"o sistema entendeu meu contexto"**.

---

## Final Verdict

✅ **O módulo agora entende automaticamente o contexto operacional** vindo do Simulador, sem depender de seleção manual inicial.

✅ **A seleção manual continua soberana** — uma vez exercida, é preservada para sempre (via `manual-override` flag).

✅ **Zero regressão** — engine financeira, ordenação executiva, capítulos editoriais e visual premium permanecem intactos.

✅ **A experiência evoluiu de "biblioteca que exige configuração" para "consultoria patrimonial que entende automaticamente o cenário do usuário"**.

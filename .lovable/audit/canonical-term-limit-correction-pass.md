# Canonical Term Limit Correction Pass

## Remove All 240 References

Auditado todo `src/` (exceto `*.test.*`, `*.md`, `*.css`). Referências a `240` relacionadas a prazo de Imobiliário **removidas em 6 pontos**:

| Arquivo | Antes | Depois |
|---|---|---|
| `src/config/consortiumRates.ts:36` | `imobiliario: 240` (MAX_TERM_MONTHS) | `imobiliario: 200` |
| `src/components/modules/structured-ops/StructuredOpsCardForm.tsx:120` | `max={240}` hardcoded | `max={200}` |
| `src/components/modules/investment/InvestmentAssumptions.tsx:59` | `maxTermMonths \|\| 240` (2×) | `maxTermMonths \|\| 200` |
| `src/utils/dev/mockSeed.ts:118` | `pick([180, 200, 220, 240])` para imovel | `pick([140, 160, 180, 200])` |
| `src/utils/normalizeInputByConsortiumType.ts:9` | comentário "imob 240" | "imob 200" |
| `src/pages/LandingPage.tsx:113` | mock visual "Imóvel · 240 meses" | "Imóvel · 200 meses" |

**Referências a `240` remanescentes** são todas **não-relacionadas** a prazo: alturas de gráfico PDF (`height={240}` px), larguras de tooltip (`max-w-[240px]`), tokens de motion (`240ms`) e comentário de schedule. Não há mais `240` ligado a prazo de Imobiliário em qualquer ponto da UI, fallback ou constante.

Como `MAX_TERM_MONTHS` é a fonte única consumida por `SimulatorConsortiumDataCard`, `normalizeInputByConsortiumType`, `businessRules` façade e `WealthAssumptionsContext`, a correção propaga automaticamente para todos os consumidores.

## Label Enforcement

`src/components/modules/simulator/SimulatorConsortiumDataCard.tsx` — campo Prazo.

**Antes:**
```tsx
<Label title="Prazo máximo permitido para Imobiliário: 240 meses">
  Prazo da operação
  <span className="ml-1 opacity-60 tabular-nums">· máx 240m</span>
</Label>
```

**Depois:**
```tsx
<Label className="text-caption font-medium text-muted-foreground leading-none">
  Prazo
</Label>
```

Removidos: descritivo "da operação", helper "máx Nm", tooltip `title`. Label final = **apenas `Prazo`**. Zero hint, zero texto auxiliar, zero redundância — o valor `200` já é o que aparece no input.

## Canonical Product Consistency

Regra oficial CAIXA agora refletida unicamente em `MAX_TERM_MONTHS.imobiliario = 200`. Toda derivação canônica:

- `<Input max={MAX_TERM_MONTHS[input.consortiumType]} />` — clamp em 200 para Imobiliário.
- `normalizeInputByConsortiumType` — clamp ao trocar modalidade.
- `WealthAssumptionsContext.analysisMonths` — segue `DEFAULT_TERM_MONTHS.imobiliario = 200` (já era 200).
- `InvestmentModule` fallback — `DEFAULT_TERM_MONTHS[type]`.

Usuário nunca mais verá 240 vinculado a prazo de Imobiliário em nenhuma superfície do produto.

## Mobile Cleanup

Label colapsado de 2 elementos (`Label` + `<span>` helper) para 1 elemento de texto puro. Resultado:

- Sem multiline em `<380px`.
- Sem overflow (caption de 1 palavra cabe em qualquer grid).
- Densidade visual reduzida — card "Dados do Consórcio" mais escaneável.
- Zero tooltip nativo (`title` removido) — sem ruído em hover desktop nem long-press mobile.

## Zero Regression Validation

- ✅ Engine financeira intocada — apenas o **valor** de uma constante de regra foi corrigido.
- ✅ Nenhum novo hint, texto explicativo ou label descritivo introduzido.
- ✅ `MAX_TERM_MONTHS` segue como fonte única (`@/config/consortiumRates`) — façade `businessRules` reflete automaticamente.
- ✅ Demais modalidades (auto: 80, pesados: 100) inalteradas.
- ✅ Sem reintrodução de `240` em nenhum fallback de UI.
- ✅ Tailwind estático, sem template literals.

## Final Consistency State

| Pergunta | Status |
|---|---|
| Toda referência a 240 foi removida? | Sim (6/6 pontos relacionados a prazo Imobiliário) |
| O label está apenas "Prazo"? | Sim |
| O produto está consistente com regras reais CAIXA? | Sim (MAX = 200 meses) |
| Mobile ficou limpo e premium? | Sim (1 linha, sem helper, sem tooltip) |

## Final Verdict

`240` eliminado do contexto Imobiliário em toda a base. Label reduzido ao mínimo essencial (`Prazo`). Fonte única `MAX_TERM_MONTHS.imobiliario = 200` propaga canonicamente. Zero regressão, zero engine touch, zero UX writing residual. Pass concluído.

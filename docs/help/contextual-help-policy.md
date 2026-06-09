# Contextual Help Policy

> Política institucional para ajuda contextual integrada à operação.
> Última revisão: 2026-05.

## Princípio absoluto

**Ajuda contextual deve aumentar clareza, não criar ruído visual.**

Toda surface contextual existe para reduzir erro consultivo,
financeiro ou comercial em um ponto de decisão real. Se não há
ponto de decisão, não há surface.

## Onde usar

✅ **Use** em:
- Pontos de interpretação (resultado de simulação, comparador, OE).
- Pontos de configuração crítica (taxa de adm, lance, INCC, reduzida).
- Pontos de risco consultivo (alavancagem, OE para perfil errado).
- Pontos de objeção típica (à vista vs consórcio, INCC, SAC × PRICE).

🚫 **NÃO use** em:
- Inputs triviais (nome, telefone, e-mail).
- Botões de ação primária ("Salvar", "Próximo").
- Áreas onde o próprio rótulo já é autoexplicativo.
- Mais de 1 surface por bloco visual (≤ 1 a cada ~150px de altura).

## Hierarquia visual

| Componente | Quando usar | Discrição |
|---|---|---|
| `HelpHint` (popover) | Conceito que pode gerar dúvida — opt-in pelo usuário | Ícone (i) 14px, cor muted-foreground |
| `ContextualInsightStrip` | Pós-resultado, interpretação guiada — sempre visível | Faixa fina, border-l tonal |
| `RelatedArticles` (futuro) | Footer de módulos longos, descoberta | Lista 3 itens máx |

## Tom

- Institucional, sem verbos de marketing ("incrível", "potencialize").
- Frases curtas, ação primeiro, racional depois.
- Quando citar cliente, usar aspas: `"..."` (linguagem pronta).
- Preferir `Quando usar / Quando NÃO usar / Erro comum / Como explicar / Estratégia / Objeção`.

## Conteúdo

- Surfaces vivem em `src/lib/contextualHelp/registry.ts`.
- Insights e artigos NÃO são duplicados — `articleIds` referencia
  `helpContent.ts`.
- Máx 3 articleIds por surface, máx 2 insights, 1 riskNote opcional.
- Ao criar surface novo: justifique no PR — "este ponto de decisão
  causa erro comum X".

## Anti-drift

- Toda mudança em explicação institucional → atualizar
  `helpContent.ts`, NUNCA o registry.
- IA, PDF e Help Center consomem a mesma fonte (governance + helpContent).
- Não criar tooltip ad-hoc com `title=""` em pontos críticos —
  use `HelpHint`.

## Telemetria

- `trackHelpInteraction(surfaceId, action)` é opt-in e silencioso.
- Sem PII. Apenas surfaceId + action (`open` / `article-click` / `insight-view`).
- Útil para detectar surfaces ignorados (gap educacional) ou hot
  spots (oportunidade de tour guiado).

## Governance gates

- Componentes oficiais: `@/components/help/HelpHint`,
  `@/components/help/ContextualInsightStrip`.
- Registry oficial: `@/lib/contextualHelp/registry`.
- Conteúdo oficial: `@/data/helpContent`.
- Política oficial: este arquivo.

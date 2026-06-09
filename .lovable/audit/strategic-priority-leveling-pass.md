# Strategic Priority Leveling Pass

**Escopo:** corrigir a classificação semântica do grupo de abertura do módulo Estratégias Patrimoniais. Substituir a interpretação "Compra à Vista = flagship principal absoluta" por **grupo estratégico principal equilibrado** com 7 estratégias de mesmo peso editorial.

---

## Correção Aplicada

- Removida a wording "flagship principal absoluta" do audit anterior.
- Removida a wording "flagships" do comentário do `STRATEGY_LIBRARY_ORDERED` em `strategyLibraryData.ts` — substituída por "estratégias priorizadas", reforçando que `priority` controla **apenas ordem**, não hierarquia visual.
- Renomeada a variável interna `flagships → prioritized` na construção da lista ordenada.

## Equilíbrio Visual Validado

`StrategyLibrarySection.tsx` já renderiza **todos os 24 cards de forma idêntica**, sem qualquer diferenciação ligada a `priority`. Auditoria do componente confirma:

| Atributo visual | Tratamento |
|---|---|
| Tamanho do card | Igual em todos (grid 1/2/3 col responsivo) |
| Border / radius / shadow | `rounded-2xl border bg-card shadow-sm` — idêntico |
| Header (chip + ícone + título + tagline) | Mesmo template para os 24 |
| CTA | "Abrir/Fechar Estratégia Completa" — único e igual |
| Blocos expandidos | Mesmos 5 (Racional / Vantagens / Riscos / Cálculos / Cenários / Comparativos) |
| Badge promocional | **Nenhum** em nenhuma estratégia |
| Hero / destaque / spotlight | **Inexistente** |
| Accent color | Definido por **tese** (primary/success/warning), não por priority |

**Compra à Vista não tem badge, não é maior, não tem hero, não tem spotlight, não tem CTA diferente.** Apenas aparece primeira na sequência, junto das outras 6 priorizadas.

## Grupo Estratégico Principal Equilibrado

As 7 estratégias abrem o módulo no MESMO nível editorial, na ordem listada pelo usuário:

```
Compra à Vista                     · compra-a-vista
Usar a Carta para Investir         · leverage-patrimonial
Aplicar em Investimentos           · escada-patrimonial
Multiplicação de Cotas             · multiplicacao-cotas
Gerar Renda com Aluguel            · alavancagem-imobiliaria
Comprar e Valorizar                · reforma-ampliacao
Entrar para Revender               · autoquitacao-estruturada
```

Todas com mesmo peso visual, mesma hierarquia, mesmo padrão de KPI e mesmo padrão de expansão. As 17 demais estratégias seguem em sequência preservando a ordem do catálogo.

## Verdict

✅ Wording corrigido em código e em auditoria. Nenhuma estratégia domina perceptivamente — o grupo de 7 é editorialmente equivalente; `priority` é apenas índice de ordenação, sem efeito visual.

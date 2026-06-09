# Toggle Interaction Fidelity — Fix Wave (revisão 2)

## Causa raiz real

A primeira correção (remoção de `block align-middle` do `<Switch>` do Seguro Prestamista) tratou apenas um sintoma adjacente. O knob continuou parado horizontalmente porque havia uma segunda camada bloqueando o `transform` do thumb do Radix Switch: regras globais de `prefers-reduced-motion` em `src/index.css` aplicavam `transform: none !important` a *todos* os descendentes de containers institucionais.

Regras envolvidas (todas em `@media (prefers-reduced-motion: reduce)`):

1. Wave 12 — `[data-spatial-shell='true'] *, [data-signature-shell='true'] *`
2. Wave 13 — idem (duplicata)
3. Wave 14 — `body :where(main, [role="main"]) *` (a mais ampla — cobre o app inteiro)
4. Wave 15 — `:where(.bg-landing-bg) *`

O `SwitchPrimitives.Thumb` depende exclusivamente de `transform: translateX(...)` (Tailwind `data-[state=checked]:translate-x-5`) para mover o knob. Com `transform: none !important` vencendo por especificidade + `!important`, apenas a cor da track mudava no clique. Em ambientes corporativos / Citrix / GPOs com `prefers-reduced-motion: reduce` ativo (cenário comum no usuário-alvo), o toggle ficava visualmente "morto".

## Correção aplicada

Em todas as 4 regras de reduced-motion acima, o seletor foi exonerado de `[role="switch"]` e seus descendentes:

```css
@media (prefers-reduced-motion: reduce) {
  body :where(main, [role="main"]) *:not([role="switch"]):not([role="switch"] *) {
    transition: none !important;
    transform: none !important;
  }
}
```

Isso preserva a política de motion safety para todo o resto da plataforma, mas devolve ao knob do Switch a permissão de aplicar `translateX`. A `transition` do Switch também volta a fluir naturalmente — pequena animação que não desrespeita `prefers-reduced-motion` porque é deslocamento funcional de affordance, não decorativo.

## Validação no preview

- Estado OFF → knob à esquerda, track `bg-input` (cinza).
- Clique → knob desliza para a direita, track `bg-primary` (azul Caixa).
- Clique novamente → knob volta para a esquerda, track cinza.

Mesmo fix beneficia automaticamente todos os 13 outros `<Switch>` do produto, já que o seletor é genérico (`[role="switch"]`).

## Escopo preservado

- Nenhuma alteração em `src/components/ui/switch.tsx`.
- Nenhuma alteração em `SimulatorConsortiumDataCard.tsx` neste passo.
- Engine financeira, elegibilidade do MIP, hooks e Supabase intocados.
- Política de reduced motion mantida em todo o resto da UI.

## Arquivos alterados

- `src/index.css` — 4 regras de `prefers-reduced-motion` exoneradas para `[role="switch"]`.

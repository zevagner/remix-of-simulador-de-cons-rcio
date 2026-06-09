# Adaptive Consultive Intelligence — Política Institucional

> Versão 1.0 · Onda Adaptive Consultive Intelligence

## Princípio absoluto

> A adaptação **ajuda o consultor**, não substitui o raciocínio dele.

A inteligência adaptativa da plataforma calibra **tom**, **ênfase** e
**profundidade** de orientação. Ela **não** muda regra de negócio,
preço, taxa, ou recomendação financeira oficial.

## Limites de adaptação (allowed surfaces)

| Camada | O que pode adaptar | O que **não** pode |
|---|---|---|
| Help Hint / Insight Strip | Selecionar quais insights/insighs mostrar | Mudar o conteúdo institucional |
| Adaptive Suggestion | Sugerir próximo módulo, trilha educacional, frase consultiva | Forçar rota, abrir modal, interromper fluxo |
| Cockpit | Frase única consultiva | Substituir KPIs ou triggers do Copilot |
| IA narrativa | Calibrar tom (analítico vs simples) | Inventar dados, prometer garantia |

## Fonte única de sinais

- `DiagnosticContext` — pilares declarados pelo consultor.
- `SimulatorContext` — crédito, parcela, capacidade.
- `ClientJourneyContext` — slots e recomendação do diagnóstico.

A derivação acontece em `src/lib/adaptive/profile.ts` via
`deriveConsultiveProfile()` — função **pura**, **determinística**,
sem efeitos colaterais. Hook único de leitura: `useAdaptiveProfile()`.

## Privacidade & explainability

- O perfil **não é persistido em servidor**, **não é enviado para edges**
  e **não alimenta analytics individuais**.
- Vive apenas em memória do cliente durante a sessão.
- O consultor pode sempre ver os sinais brutos no Diagnóstico — não
  há "caixa preta".
- `confidence` exposto no objeto: quando `< 0.35`, todas as funções
  adaptativas devolvem `null` (perfil insuficiente → sem sugestão).

## Anti-padrões proibidos

- ❌ Modal automático com base em perfil
- ❌ Bloqueio de fluxo ("você precisa preencher X antes")
- ❌ Sugestão que se repete em loop (use `sessionStorage` dismiss)
- ❌ Infantilização ("parece que você não entendeu...")
- ❌ Recomendação de produto financeiro com base em perfil derivado
- ❌ Tracking comportamental enviado para servidor

## Tom institucional

- Frase única, ≤ 120 caracteres, sem ponto de exclamação.
- Verbo no infinitivo ou imperativo brando ("considere", "vale aprofundar").
- Nunca prometer resultado. Nunca usar "garantido", "imperdível",
  "exclusivo".

## Disclosure progressivo

A sugestão aparece **uma única vez por contexto** por sessão. O
consultor pode dispensar com X. Aprofundamento (trilha, módulo)
abre apenas sob clique explícito.

## Governança

- Mudanças no modelo `ConsultiveProfile` exigem atualização desta
  política e do registro `mem://adaptive/consultive-intelligence-wave`.
- Novos surfaces adaptativos devem ser revisados quanto a privacidade
  e tom antes de entrar em produção.
- Auditoria viva em `.lovable/audit/adaptive-consultive-intelligence-wave.md`.

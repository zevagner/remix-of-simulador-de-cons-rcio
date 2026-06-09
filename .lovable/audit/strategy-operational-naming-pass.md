# Strategy Operational Naming Pass

## Problema
Os títulos dos cards da Biblioteca Patrimonial estavam conceituais ("Escada de Tier", "Estrutura PJ/Holding Pré-crescimento", "Múltiplas Cotas Paralelas", "Renda Passiva Programada"). O usuário não encontrava a estratégia pelo nome usado na operação real. Caso emblemático: "Venda da Carta de Crédito" existia como cenário em Investimentos, mas não tinha card encontrável na biblioteca.

## Regra de naming (nova)
1. Título começa por verbo ou substantivo operacional (`Comprar`, `Quitar`, `Doar`, `Carta para…`, `Renda Mensal com…`).
2. Inclui o ativo/instrumento real (carta, cota, aluguel, lance, holding).
3. Pitch (tagline) responde em uma linha: o que faz + como faz + o que o cliente ganha.
4. Proibido: "tier", "estrutura", "engenharia", "patrimônio escalável" sem o substantivo operacional.

## Tabela de renomeações (24/24)

| id | antes | depois |
|---|---|---|
| compra-a-vista | Compra à Vista | Comprar à Vista com Carta Dobrada |
| compra-hibrida | Compra com Entrada Parcial | Comprar com Entrada e Diluir o Resto |
| compra-planejada | Compra Programada em 24–60 Meses | Comprar em 24–60 Meses sem Juros |
| aquisicao-acelerada | Lance para Contemplação Rápida | Dar Lance para Contemplar Rápido |
| leverage-patrimonial | Múltiplas Cotas Paralelas | Comprar Várias Cartas ao Mesmo Tempo |
| alavancagem-imobiliaria | Portfólio de Imóveis para Aluguel | Comprar Imóveis para Alugar |
| multiplicacao-cotas | Multiplicação de Cotas | Usar a Contemplação para Comprar Outra Cota |
| escada-patrimonial | Escada de Tier — Vender e Subir | Venda da Carta de Crédito |
| reinvestimento-estruturado | Renda Reaplicada em Novas Cotas | Reinvestir Aluguel/Renda em Novas Cotas |
| autoquitacao-estruturada | Autoquitação com Aluguel | Quitar a Cota com o Próprio Aluguel |
| patrimonio-escalavel | Estrutura PJ/Holding Pré-crescimento | Abrir PJ ou Holding antes de Comprar as Cotas |
| reforma-ampliacao | Reforma e Ampliação de Imóvel | Carta para Reformar ou Ampliar Imóvel |
| retrofit-patrimonial | Retrofit de Imóvel Antigo | Carta para Retrofit de Imóvel Antigo |
| energia-solar | Energia Solar | Carta para Energia Solar |
| upgrade-veiculo | Troca de Veículo a Cada 3–4 Anos | Trocar de Carro a Cada 3–4 Anos |
| renovacao-frota | Renovação de Frota | Renovar a Frota da Empresa em Ciclos |
| expansao-produtiva | Expansão Produtiva (Máquinas e Indústria) | Carta para Máquinas e Expansão Industrial |
| equipamentos-pesados | Equipamentos Pesados | Carta para Equipamentos Pesados |
| agronegocio | Maquinário Agrícola (Trator, Colheitadeira, Implemento) | Carta para Trator, Colheitadeira e Implementos |
| patrimonio-rural | Aquisição de Terras Rurais | Carta para Comprar ou Expandir Terras |
| renda-passiva | Renda Passiva Programada | Renda Mensal com Cartas Quitadas |
| patrimonio-gerador-caixa | Portfólio Selecionado por Cap Rate | Portfólio de Imóveis Selecionados pelo Aluguel |
| holding-patrimonial | Holding Patrimonial | Montar Holding Patrimonial |
| planejamento-sucessorio | Doação de Cotas com Usufruto Vitalício | Doar Cotas com Usufruto Vitalício |

## Integridade financeira
- Nenhuma alteração em `useInvestmentCalculations`, engines `@/core/finance`, ranking, KPIs, fórmulas.
- Apenas `title` e `tagline` em `strategyLibraryData.ts` foram tocados.
- IDs, `priority`, `chapter`, `calculations`, `comparisons`, `scenarios` permanecem idênticos — todas as referências cruzadas (decisionDeskInsights, telemetria, recomendações) seguem válidas.

## Verdict
PASS — biblioteca encontrável por nome operacional; zero impacto matemático/financeiro.

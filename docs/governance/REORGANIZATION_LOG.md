# Log de Reorganização de Módulos

## [1.0.0] - 2026-05-29

### Módulo Proposta Premium (antes: Proposta Completa)
- **Status:** Auditado, renomeado, sem quebras.
- **Alterações:**
  - Renomeado de "Proposta Completa" para "Proposta Premium" no `ModuleHeader` e no menu lateral (`src/config/modules.ts`, ID `proposal-pdf`).
  - Módulo mantido independente das reorganizações dos módulos Abordagem e Proposta.
  - Auditoria realizada: 743 linhas de código validadas.
  - Funcionalidades preservadas: lógica de blocos, `buildData`, fallbacks e alertas de dados ausentes.
  - Geração de PDF Premium validada.

### Estado atual dos módulos de conversão:
- **Abordagem:** 3 abas (Antes da conversa / Durante a conversa / Funil de vendas).
- **Proposta:** 2 abas (Proposta completa / Mensagem rápida) + link para Abordagem.
- **Proposta Premium:** Wizard de blocos selecionáveis + geração de PDF consultivo.

# ROPA — Registro das Operações de Tratamento de Dados Pessoais

> Record of Processing Activities · LGPD Art. 37
> **Versão:** 1.0 (Onda 1 — Governança Corporativa)
> **Última revisão:** 2026-06-01
> **Owner:** Plataforma / Encarregado designado pelo controlador
> **Ciclo de revisão:** a cada nova finalidade, categoria de dado ou subprocessador.

---

## 1. Operações de tratamento

### Op-01 · Autenticação e gestão de conta do consultor
| Campo | Valor |
|---|---|
| Categoria de dado | E-mail, nome, role, hash de senha (gerenciado por Supabase Auth) |
| Titular | Consultor (usuário da plataforma) |
| Finalidade | Acesso autenticado, controle de papéis (admin/user) |
| Base legal | Execução de contrato (Art. 7º, V) |
| Retenção | Vinculada à conta; purge sob solicitação (`account-purge`) |
| Operador | Plataforma |
| Subprocessador | Lovable Cloud (Supabase Auth) |
| Compartilhamento | Nenhum externo |

### Op-02 · Cadastro de cliente final na Carteira/CRM
| Campo | Valor |
|---|---|
| Categoria de dado | Nome, telefone, e-mail (opcional), estágio comercial, observações |
| Titular | Cliente final do consultor |
| Finalidade | Relacionamento comercial e follow-up |
| Base legal | Legítimo interesse do controlador (Art. 7º, IX) |
| Retenção | Vinculada ao consultor; cascade purge na exclusão da conta |
| Operador | Plataforma |
| Subprocessador | Lovable Cloud |
| Compartilhamento | Apenas com o próprio cliente via link de proposta (token assinado, revogável) |

### Op-03 · Simulação financeira e geração de proposta
| Campo | Valor |
|---|---|
| Categoria de dado | Parâmetros de simulação + nome do cliente (display) |
| Titular | Cliente final |
| Finalidade | Geração de proposta consultiva ilustrativa |
| Base legal | Legítimo interesse (Art. 7º, IX) |
| Retenção | Proposta vinculada ao consultor; PDF gerado com TTL 90d em storage |
| Operador | Plataforma |
| Subprocessador | Browserless.io (render PDF, stateless, sem retenção) |
| Compartilhamento | Cliente final via link assinado |

### Op-04 · Geração de narrativa por IA (storytelling, objeção, abordagem)
| Campo | Valor |
|---|---|
| Categoria de dado | Parâmetros de simulação + PII **mascarada** (`[CLIENTE]`, `[EMAIL]`, `[CPF]`, `[PHONE]`) |
| Titular | Cliente final (indiretamente) |
| Finalidade | Apoio comunicacional ao consultor |
| Base legal | Legítimo interesse (Art. 7º, IX) — sem decisão automatizada |
| Retenção | Sem persistência no gateway; resposta volatiliza ao cliente |
| Operador | Plataforma |
| Subprocessador | Lovable AI Gateway (OpenAI/Google) |
| Compartilhamento | Apenas com o gateway; sem treinamento |

### Op-05 · Logs de auditoria e admin
| Campo | Valor |
|---|---|
| Categoria de dado | `user_id`, action, entity, metadata sem PII |
| Titular | Consultor / administrador |
| Finalidade | Rastreabilidade de ações críticas e administrativas |
| Base legal | Obrigação legal + legítimo interesse (Art. 7º, II e IX) |
| Retenção | 365 dias (`audit_logs`) via `data-retention-purge` |
| Operador | Plataforma |
| Subprocessador | Lovable Cloud |
| Compartilhamento | Apenas leitura admin via RPC com `has_role('admin')` |

### Op-06 · Telemetria de uso (analytics)
| Campo | Valor |
|---|---|
| Categoria de dado | Evento, módulo, `user_id` tokenizado |
| Titular | Consultor |
| Finalidade | Melhoria de produto |
| Base legal | Consentimento (Art. 7º, I) — `src/lib/consent.ts` |
| Retenção | 180 dias (`analytics_events`) |
| Operador | Plataforma |
| Subprocessador | Lovable Cloud |
| Compartilhamento | Nenhum externo |

### Op-07 · Observabilidade de erros (opcional)
| Campo | Valor |
|---|---|
| Categoria de dado | Stack trace, evento sanitizado (`sanitizeLogPayload`), user id parcial |
| Titular | Consultor |
| Finalidade | Detecção e diagnóstico de incidentes |
| Base legal | Legítimo interesse (Art. 7º, IX) |
| Retenção | 30–90 dias (config Sentry) |
| Operador | Plataforma |
| Subprocessador | Sentry (opt-in via DSN) |
| Compartilhamento | Nenhum externo |

### Op-08 · Compartilhamento de proposta ao cliente final
| Campo | Valor |
|---|---|
| Categoria de dado | Dados da proposta + nome do cliente |
| Titular | Cliente final |
| Finalidade | Apresentação da simulação ao titular |
| Base legal | Legítimo interesse / execução de tratativas pré-contratuais (Art. 7º, V) |
| Retenção | Token revogável; PDF TTL 90d |
| Operador | Plataforma |
| Subprocessador | Lovable Cloud (storage) |
| Compartilhamento | Cliente final via link assinado |

### Op-09 · Exportação e exclusão pelo titular (LGPD Art. 18)
| Campo | Valor |
|---|---|
| Categoria de dado | Todos os dados vinculados ao `user_id` |
| Titular | Consultor (e indiretamente clientes finais sob sua tutela) |
| Finalidade | Cumprimento dos direitos do titular |
| Base legal | Obrigação legal (Art. 7º, II) |
| Retenção | Export: ZIP via signed URL 1h. Purge: cascade ordenada irreversível. |
| Operador | Plataforma |
| Subprocessador | Lovable Cloud |
| Compartilhamento | Apenas com o próprio titular |

## 2. Resumo de subprocessadores

Ver `.lovable/governance/subprocessors.md` (fonte canônica).

## 3. Itens pendentes de decisão humana

- Designação formal do Encarregado pelo controlador.
- Atualização da ROPA quando o controlador adicionar nova finalidade fora deste escopo.
- Registro de DPAs assinados (anexar referência contratual neste documento).

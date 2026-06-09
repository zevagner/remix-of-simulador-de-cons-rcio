---
name: Enterprise Trust Visibility
description: Onda Governance Visibility — página pública /confianca (TrustCenterPage) com 7 seções (Arquitetura, IA, Dados/LGPD, Documentos, Uploads, Observabilidade, Suboperadores); footer da Landing linka Central de Confiança + Privacidade + Termos; honestidade arquitetural (Roadmap badge para malware scanning)
type: feature
---
**Camada visível de governança institucional — torna maturidade técnica perceptível.**

## Surfaces públicas
- **`/confianca`** (`src/pages/TrustCenterPage.tsx`) — Central de Confiança executiva. 7 seções com anchor nav. Inclui bloco de due diligence corporativa.
- **`/privacidade`** — Política de Privacidade completa (fonte canônica detalhada, preservada).
- **`/termos`** — Termos de Uso (preservado).
- **Footer da Landing** — linka Central de Confiança (destaque), Privacidade, Termos.

## Princípios institucionais
- **Honestidade arquitetural**: itens não-implementados ganham badge `Roadmap` (ex.: malware scanning enterprise). Proibido fingir cobertura inexistente.
- **Zero security theater**: nada de "100% seguro", buzzwords vazias, selos não-certificados.
- **Trust Center é executivo, não duplicação**: descreve controle + onde vive; detalhamento fica em `/privacidade` e `subprocessors.md`.
- **Cobertura due diligence corporativa**: TI/jurídico valida primeiro nível sem abrir aplicação. Documentos formais (DPA) sob solicitação via canal de feedback (categoria Privacidade).

## Cobertura (12 perguntas TI-corporativa)
Isolamento RLS · uso de IA com PII masking · retenção · LGPD Art. 18 · suboperadores · uploads (honestidade Roadmap) · PDFs com watermark + signed URLs · audit logs · masking em logs · IA não decide financeiro sozinha.

## Arquivos
- `src/pages/TrustCenterPage.tsx` (novo, ~200 linhas)
- `src/App.tsx` rota `/confianca` (lazy)
- `src/pages/LandingPage.tsx` footer atualizado + import `Link`
- `.lovable/audit/enterprise-governance-trust-visibility-pass.md`

## Não tocar
- Política de Privacidade e Termos (fontes canônicas detalhadas)
- `PrivacyCenter` in-app (autoatendimento LGPD Art. 18)
- `.lovable/governance/subprocessors.md` (fonte canônica de suboperadores)
- Edges de retenção/export/purge/masking/anti-XSS
- Engine financeira, IA gateway

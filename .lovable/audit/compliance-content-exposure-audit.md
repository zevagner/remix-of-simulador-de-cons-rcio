# Auditoria de Conteúdo, Compliance e Exposição Informacional

**Data:** 2026-05-12
**Escopo:** todo o sistema (Simulador, Cockpit, Comparador, Investimentos, Estudo de Lances, Op. Estruturadas, Abordagem, Proposta, Carteira, Pós-venda, Central de Ajuda, Configurações, IA, microcopy, prompts, FAQ, onboarding, mensagens de erro, logs, placeholders).
**Pergunta-guia:** *"isso parece software consultivo independente ou ferramenta corporativa interna?"*

---

## 1. Sumário executivo

O sistema **já tem identidade visual neutra** ("Simulador de Consórcio Inteligente"), conteúdo de Help orientado a uso (não institucional) e disclaimers regulatórios bem padronizados. Porém, **persistem amarras explícitas ao domínio @caixa.gov.br** em fluxo de auth, filtros de admin e nomenclatura técnica residual ("regra oficial CAIXA", `caixa-introjs-*`, `caixa-onboarding-completed`, "Caixa Consórcio" no rodapé do PDF). Há também **memória do projeto exigindo `brandConfig.ts` que NÃO existe** — proibição declarada, mas sem fachada.

Risco macro: **médio**. O produto parece consultivo, mas, em pontos pontuais, parece "extensão interna da Caixa".

---

## 2. Achados por severidade

### 🔴 Crítico (revisar antes de qualquer publicação externa)

| # | Local | Achado | Risco |
|---|------|--------|-------|
| C1 | `src/utils/emailValidation.ts` | `ALLOWED_DOMAINS = ['caixa.gov.br']` + mensagens "Cadastro permitido apenas para e-mails corporativos da Caixa" | **Reputacional + Compliance.** Posiciona o produto como "sistema interno Caixa" no primeiro contato. |
| C2 | `src/pages/LoginPage.tsx`, `SignUpPage.tsx`, `ForgotPasswordPage.tsx` | Placeholder `nome@caixa.gov.br` + toast "Utilize seu e-mail corporativo (@caixa.gov.br)" | **Reputacional.** Reforça a mesma percepção em telas públicas. |
| C3 | `src/components/auth/EmailMigrationModal.tsx` | "Para continuar usando o sistema, atualize para seu e-mail @caixa.gov.br" | **Reputacional.** Modal vê texto institucional ao usuário. |
| C4 | `src/utils/normalizeInputByConsortiumType.ts:27` | Comentário `// Fonte única: MAX_TERM_MONTHS em consortiumRates (regra oficial CAIXA)` | **Reputacional + Compliance.** Sugere homologação. Apenas comentário de código (não exposto), mas viola memória `Branding`. |
| C5 | `mem://index.md` Core "Branding" exige `brandConfig.ts` que **não existe** no repo | Regra declarada sem fachada efetiva | **Governança.** Permite reincidência. |

### 🟠 Médio

| # | Local | Achado |
|---|------|--------|
| M1 | `src/components/pdf/proposta/pages/CoverPage.tsx`, `primitives.tsx`, `PdfLayout.tsx` | Texto "Caixa Consórcio" hardcoded no rodapé/capa do PDF do cliente final |
| M2 | `src/components/admin/AdminUsers.tsx`, `users/UserFilters.tsx` | Filtro `email-caixa` com label `✉️ @caixa.gov.br`. Faz sentido para admin, mas amarra UI ao domínio |
| M3 | `src/utils/tourHelper.ts`, `src/hooks/useOnboarding.ts` | Classes CSS `caixa-introjs-tooltip`, `caixa-introjs-highlight`, storage key `caixa-onboarding-completed` |
| M4 | `src/components/modules/comparator/ConsortiumComparisonTab.tsx` | `id="cc-caixa-card"` + label "Consórcio 1" exposto no Tour |
| M5 | `src/components/modules/simulator/InstallmentCompositionTable.tsx:496` | Classe `bg-caixa-orange/20` (token Tailwind nominal) |
| M6 | `src/utils/dev/mockSeed.ts:150` | "OBS EXTENSA" com perfil fictício realista contendo termos como "DECORE", "FGTS", "lance livre vs lance fixo" — mock só roda em dev, mas string vive no bundle |
| M7 | `src/utils/aiValidators.ts` + edges | Disclaimer "simulação ilustrativa" presente em prompts — **OK e necessário**; auditar apenas se aparece duplicado em UI |
| M8 | `src/components/community/RequestCommunityHelpFromSimulationButton.tsx` + `Button.tsx` | Termo "Caso restrito" pode ser lido como "documento sigiloso interno". Trocar por "Caso privado" ou "Apenas para mim" |

### 🟡 Baixo

| # | Local | Achado |
|---|------|--------|
| B1 | `src/data/helpContent.ts` | Conteúdo geral é orientado a uso e neutro. Termo "Pipeline" coexiste com "Carteira" no glossário — manter (clareza didática), mas evitar em UI voltada ao gerente |
| B2 | `src/data/objections/data.ts` | Algumas respostas têm tom muito "corporativo institucional" (ex: "as parcelas são previsíveis para o fluxo de caixa da empresa"). Aceitável; só padronizar voz |
| B3 | `src/config/versionConfig.ts` | Changelog técnico exposto com termos como "effective cost", "RPC", "cap server-side" — destinado a admin, mas vive no bundle do cliente |
| B4 | `src/hooks/useProposalsQueries.ts:61` | Comentário `@deprecated Motor interno migrado para RPC list_proposals_page` — só código, baixo risco |
| B5 | `src/data/helpContent.ts:256` | "Hub com 5 abas: Investimento, Comparador, Estudo de Lances, Op. Estruturadas e Assembleias." — descritivo, OK |
| B6 | `src/utils/clientScoring.ts:43,77` | Comentários "Helpers internos" — só código |

### 🟢 Cosmético

| # | Local | Achado |
|---|------|--------|
| G1 | `src/utils/tourHelper.ts` | Botão "Tour Guiado" → "Como usar" (já recomendado na auditoria de polimento) |
| G2 | `helpContent.ts:159` "Evolução no sistema" → "Como o acesso evolui" |
| G3 | `helpContent.ts:148` "Como o sistema te ajuda" → "Como a IA apoia a venda" (mais discreto) |
| G4 | Rodapé `LandingPage.tsx:452` "Plataforma de Consórcio" — manter neutro, OK |

---

## 3. Central de Ajuda — análise dedicada

**Veredicto:** **✅ Boa.** Conteúdo é orientado a uso ("o que faz / como usar"), tom consultivo, sem siglas internas, sem fluxos corporativos, sem referências a agência/gerência/matriz/superintendência. Glossário é técnico-de-mercado (Carta de Crédito, Cota, Assembleia, INCC, IPCA, CDI, CET, SAC, PRICE) — **adequado a usuário externo**.

**Ressalvas leves (🟡):**
- "Diagnóstico", "Análise (módulo)", "Carteira", "Pipeline", "Score de engajamento", "Storytelling", "Gatilho mental" são **termos de produto** — OK; documentar consistente.
- Privacidade (item 181) é vaga ("anonimização automática"): convém citar **base legal LGPD** (legítimo interesse / execução de contrato) em uma frase, sem inflar.
- Section "Comunidade" deveria reforçar que **dados pessoais nunca são compartilhados**, só métricas/perfis anônimos — já cita, mas pode ganhar 1 frase mais firme.

**Não encontrado:**
- ❌ Sem instruções operacionais internas.
- ❌ Sem orientações que pareçam treinamento corporativo.
- ❌ Sem fluxos ou processos institucionais expostos.
- ❌ Sem termos restritos da Caixa.

---

## 4. Compliance e LGPD

| Tema | Status | Comentário |
|------|--------|------------|
| Disclaimer de simulação ilustrativa | ✅ Centralizado em `src/config/copy/disclaimers.ts` e replicado em UI/PDF/IA | Manter como está |
| "Sem garantia de contemplação" | ✅ Memória global obriga; presente em IA, UI e PDF | OK |
| RLS por `user_id` | ✅ Padrão; memória `Operational Data Isolation` confirma | OK |
| Anonimização Comunidade | ✅ Implementada; texto poderia citar base legal | Quick win |
| Logs/IDs internos na UI | ✅ Não detectado; UUIDs só em rotas de admin | OK |
| Stack traces ao usuário | ✅ Não detectado; toasts amigáveis | OK |
| `mockSeed.ts` em prod | 🟡 String com perfil realista vive no bundle | Mover para `import.meta.env.DEV` guard ou `__DEV__` macro de build |
| Email allow-list em código | 🔴 `caixa.gov.br` hardcoded | Mover para `brandConfig.ts` (configurável por tenant) |
| Termo "Caso restrito" | 🟠 Sugere documento sigiloso | "Privado" / "Apenas para mim" |

**Risco LGPD agregado: baixo**. Não há exposição de dados pessoais; todos os módulos operam sob RLS por `user_id`. O risco maior é **de percepção**, não de tratamento.

---

## 5. Identidade do produto

**Pergunta:** *plataforma consultiva independente ou ferramenta corporativa interna?*

**Hoje:** **75% consultiva / 25% interna**.
- ✅ Logo neutro ("Simulador de Consórcio Inteligente")
- ✅ Title/meta tags neutros
- ✅ Conteúdo de Help neutro
- ✅ Disclaimers profissionais
- ❌ Auth amarra explicitamente ao @caixa.gov.br
- ❌ PDF assina "Caixa Consórcio"
- ❌ Tokens CSS/storage nomeados `caixa-*`
- ❌ Comentário "regra oficial CAIXA" em utilitário

**Após plano de neutralização (abaixo):** **95% consultiva**.

---

## 6. IA — auditoria de prompts e respostas

| Aspecto | Status |
|--------|--------|
| Cláusula global "nunca prometer garantia" | ✅ Memória `AI Standardization`, presente nas 4 edges |
| Estrutura CSAA (classificar/contexto/recomendar/ajustar) | ✅ Padronizada |
| Disclaimer "simulação ilustrativa" como regra de output | ✅ `aiValidators.ts` |
| Tom corporativo nos pitches | ✅ Memória `Cockpit Boundary` proíbe verbos marketing |
| Exposição de processo interno na resposta | ❌ Nada detectado |
| Recomendação sensível (juros prometidos, contemplação garantida) | ❌ Bloqueado por validator |

**IA está limpa.** Sem achados críticos. Auditar apenas que `promptFragments.ts` (memória `AI Edges Map`) **não cite "Caixa"** literalmente — verificação rápida sugerida na próxima sub-onda.

---

## 7. Riscos reputacionais

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Cliente final receber PDF assinado "Caixa Consórcio" e interpretar como documento oficial homologado | **Alta** | **Alto** | M1 — substituir por nome do produto neutro + disclaimer "documento gerado por simulador comercial" no rodapé |
| Inspeção/auditoria interna da Caixa exigir conformidade adicional ao ver "regra oficial CAIXA" no código | Média | Médio | C4 — remover comentário; reescrever neutro |
| Concorrente capturar print de "Cadastro permitido apenas para e-mails corporativos da Caixa" e questionar oficialidade | Média | Alto | C1/C2/C3 — substituir por allow-list configurável + microcopy neutro |
| Vazamento de mock com perfil realista | Baixa | Médio | M6 — guard `import.meta.env.DEV` |

---

## 8. Plano de neutralização (recomendações)

### Onda Compliance 1 (quick wins, ≤ 1 sessão)

1. **Criar `src/config/brandConfig.ts`** — fachada única exigida pela memória, mas inexistente.
   ```ts
   export const BRAND = {
     productName: 'Simulador de Consórcio Inteligente',
     pdfFooterName: 'Simulador Inteligente',
     allowedEmailDomains: ['caixa.gov.br'], // configurável
     supportEmail: '',
   } as const;
   ```
2. **Substituir hardcodes**: `emailValidation.ts`, `LoginPage`, `SignUpPage`, `ForgotPasswordPage`, `EmailMigrationModal`, `AdminUsers`, `UserFilters` consomem `BRAND.allowedEmailDomains`.
3. **Reescrever microcopy de auth**:
   - "Cadastro permitido apenas para e-mails corporativos da Caixa (@caixa.gov.br)" → **"Cadastro restrito a e-mails autorizados. Confira com seu administrador."**
   - "Utilize seu e-mail corporativo da Caixa" → **"E-mail não autorizado para acesso."**
   - Placeholder `nome@caixa.gov.br` → **`seu.email@empresa.com`**
4. **PDF (M1)**: trocar "Caixa Consórcio" por `BRAND.pdfFooterName` + disclaimer "Simulação comercial. Não é proposta oficial nem documento institucional."
5. **C4**: comentário "regra oficial CAIXA" → "regra do regulamento do grupo".
6. **M3/M4**: renomear `caixa-introjs-*` → `app-tour-*` e `caixa-onboarding-completed` → `app:onboarding:completed`. Renomear `cc-caixa-card` → `cc-primary-card`.
7. **M5**: token Tailwind `caixa-orange` → `brand-accent` ou `secondary` (já existe).
8. **M8**: "Caso restrito" → **"Caso privado"** em ambos `RequestCommunityHelp*` buttons.

### Onda Compliance 2 (≤ 1 sessão)

9. Adicionar `import.meta.env.DEV` guard em `mockSeed.ts` para garantir tree-shaking em prod.
10. Versão do changelog: separar **changelog técnico (admin)** de **novidades (usuário)** — `versionConfig.ts` já tem `NEW_FEATURES` curtos; só validar que apenas `NEW_FEATURES` aparece em UI pública.
11. Help → Privacidade: 1 frase mencionando base legal LGPD (legítimo interesse/execução de contrato) sem inflar.
12. Help → Comunidade: reforço explícito "**Dados pessoais do cliente nunca são compartilhados.**"

### Onda Compliance 3 (governança contínua)

13. Adicionar lint rule (eslint custom rule ou `no-restricted-syntax`): proibir literais `'caixa.gov.br'`, `'CAIXA'`, `'Caixa Consórcio'` fora de `brandConfig.ts`.
14. CI grep que falha se `regex /\bcaixa\b/i` aparecer em arquivo `*.tsx` (excluindo testes e brandConfig).
15. Documentar em `mem://compliance/...` regra "todo conteúdo voltado ao cliente final passa por brandConfig".

---

## 9. Before / After conceitual

**Antes:**
- Login: *"Cadastro permitido apenas para e-mails corporativos da Caixa (@caixa.gov.br)."*
- PDF rodapé: *"Caixa Consórcio"*
- Código: *"// regra oficial CAIXA"*
- Storage: *`caixa-onboarding-completed`*
- Tour: *"Tour Guiado"*
- Comunidade: *"Caso restrito"*

**Depois:**
- Login: *"Cadastro restrito a e-mails autorizados pelo administrador."*
- PDF rodapé: *"Simulador Inteligente · Simulação comercial, não é documento oficial"*
- Código: *"// regra do regulamento do grupo"*
- Storage: *`app:onboarding:completed`*
- Tour: *"Como usar"*
- Comunidade: *"Caso privado"*

**Resultado:** o sistema deixa de **declarar** vínculo institucional em pontos públicos, mantendo a regra de allow-list por trás de uma fachada configurável.

---

## 10. Score final de exposição institucional

| Dimensão | Hoje | Após Onda 1 | Após Onda 1+2+3 |
|---|---|---|---|
| Conteúdo Help | 9.0 | 9.5 | 9.5 |
| Microcopy de auth | 4.0 | 9.0 | 9.5 |
| PDF cliente | 6.0 | 9.0 | 9.0 |
| Identidade visual | 8.5 | 9.0 | 9.5 |
| Tokens / código | 6.5 | 9.0 | 9.8 |
| IA / prompts | 9.0 | 9.0 | 9.5 |
| Compliance LGPD | 8.5 | 9.0 | 9.5 |
| Risco reputacional | 6.5 | 9.0 | 9.5 |
| **Geral** | **7.2** | **9.1** | **9.5** |

---

## 11. Riscos restantes (após plano completo)

1. **Allow-list ainda contém "caixa.gov.br"** por necessidade operacional — risco mitigado por estar em config, não em microcopy.
2. **Glossário usa termos do produto** ("Score de engajamento", "Cadência") — aceitável; são termos públicos do SaaS.
3. **Versão do changelog técnico** vive no bundle — risco baixo; considerar API endpoint dedicada se sensível.

---

## 12. Conclusão

O sistema **já tem fundação consultiva sólida**. Os achados críticos são **pontuais e cirúrgicos** — todos resolvíveis em uma sessão dedicada, sem alterar regras de negócio, backend, multi-tenant ou RLS. A principal entrega faltante é o **`brandConfig.ts` exigido pela própria memória do projeto** mas inexistente — criá-lo desbloqueia toda a Onda Compliance 1.

> Após o plano: o sistema transmite **plataforma consultiva profissional, sofisticada e neutra** — sem parecer sistema interno corporativo bancário.

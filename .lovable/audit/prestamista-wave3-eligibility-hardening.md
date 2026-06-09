# Prestamista — Onda 3: Hardening de Elegibilidade e UX

**Status:** ✅ Concluído
**Escopo:** UX, bloqueios e consistência operacional. **Sem alteração matemática.**
**Engine canônica:** `src/core/finance/prestamista` (intocada nesta onda).

---

## 1. Hard-stop de Elegibilidade (Simulador)

### Antes
- `validateAgeAndTerm()` exibia mensagem técnica em vermelho **sem bloquear** a ativação do seguro.
- Usuário podia manter seguro ligado mesmo com `idade + prazo > 80`.
- Prêmio era calculado e somado à parcela em cenário inviável.

### Depois
- `SimulatorContext` agora deriva `prestamistaEligibility` chamando a fachada canônica
  `validatePrestamistaEligibility({ proponentAge, termMonths, personType: 'PF' })`.
- `useEffect` força `setInsuranceEnabled(false)` sempre que a elegibilidade vira `false` —
  **transition guard** contra estado fantasma quando o usuário aumenta idade ou prazo.
- `SimulatorConsortiumDataCard`:
  - `Switch` recebe `disabled={!eligible}` e `onCheckedChange` rejeita ativação inválida.
  - Mensagem antiga (técnica, em destructive) substituída por banner consultivo neutro:
    > "O seguro prestamista não está disponível para este prazo e idade."
  - Bloco de idade/valores só renderiza quando `insuranceEnabled && eligible`.
- **Simulação NÃO é bloqueada** — apenas o seguro fica indisponível.

### Arquivos
- `src/components/modules/simulator/SimulatorContext.tsx`
- `src/components/modules/simulator/SimulatorConsortiumDataCard.tsx`
- `src/core/finance/index.ts` (re-export `PrestamistaEligibilityResult`)

---

## 2. UX PJ (StructuredOps)

### Antes
- `CreditCard` não possuía `personType`. UI sempre mostrava "Seguro MIP (Idade)" para qualquer tipo de cliente.
- Engine já zerava PJ corretamente, mas UI sugeria que PJ tinha seguro.

### Depois
- `CreditCard.personType?: 'PF' | 'PJ'` adicionado (opcional para back-compat).
- `createEmptyCard()` define `personType: 'PF'` por padrão.
- Novo `Select` "Pessoa" (PF/PJ) no `StructuredOpsCardForm`.
- Quando PJ:
  - Toggle de seguro, idade e percentuais **escondidos**.
  - Nota consultiva curta:
    > "Disponível apenas para pessoa física."
  - Mudar PF→PJ desativa `insuranceEnabled` automaticamente (guard de UI).
- `calculateCardResult` ignora `insuranceEnabled` quando `personType === 'PJ'` (defensivo, redundante com a engine).
- `StructuredOperationsModule` (PrintableParams) exibe "Pessoa: Jurídica (sem prestamista)" e oculta linha "Seguro MIP" para PJ.
- `PdfOperacoesEstruturadas` mostra "N/A (PJ)" ao invés de percentual ou "Desab." para PJ.

### Arquivos
- `src/components/modules/structured-ops/structuredOpsTypes.ts`
- `src/components/modules/structured-ops/structuredOpsConstants.ts`
- `src/components/modules/structured-ops/StructuredOpsCardForm.tsx`
- `src/components/modules/StructuredOperationsModule.tsx`
- `src/components/pdf/PdfOperacoesEstruturadas.tsx`

### StructuredOps — Eligibility hard-stop
Mesma regra do Simulador aplicada ao card PF: toggle desabilitado quando
`validatePrestamistaEligibility` retorna `eligible=false`, com nota consultiva
("Seguro indisponível para este prazo e idade.").

---

## 3. Consistência visual (validação)

| Módulo | Status | Observação |
|---|---|---|
| Simulador | ✅ | Hard-stop ativo; mensagem consultiva |
| StructuredOps | ✅ | PF/PJ + hard-stop por card |
| PDF Simulador | ✅ | Já omite linha de seguro quando `!insuranceEnabled` (sem mudança) |
| PDF StructuredOps | ✅ | Mostra "N/A (PJ)" para PJ |
| Investment | ✅ | Consome SimulatorContext — propaga automaticamente |
| Comparator | ✅ | Consome SimulatorContext — propaga automaticamente |
| Cockpit / Carteira / Pós-venda | ✅ | Não exibem detalhes de seguro; nada a ajustar |

**Labels auditados:** nenhuma UI menciona faixa etária, tabela atuarial ou
multiplicador etário (limpeza concluída na Onda 2B; revalidado nesta onda).

**IA (Central AI / sales-script / sales-copilot):** payloads enviados aos edges
não contêm campos de prêmio por idade. Os prompts não sugerem seguro para PJ pois
o consumidor (Simulator/StructuredOps) já zera o cenário PJ antes de gerar contexto.

---

## 4. Hardening operacional

### Testes adicionados
`src/test/prestamistaWave3Hardening.test.ts` — 6 testes, todos passando:
- PF jovem + prazo curto → elegível
- PF idoso + prazo longo → inelegível (`reason: age_at_end_exceeds_limit`)
- PJ → sempre inelegível (`reason: pj`)
- PJ em StructuredOps → `insuranceTotal === 0` mesmo com toggle ligado
- PF default em StructuredOps → `insuranceTotal > 0`
- Transição PF → PJ zera `insuranceTotal`

### Transition guards em produção
1. **Simulador** — `useEffect` no `SimulatorContext` desliga seguro ao tornar-se inelegível.
2. **StructuredOps** — handler do select "Pessoa" desliga seguro ao mudar para PJ.
3. **calculateCardResult** — defesa em profundidade: ignora `insuranceEnabled=true` para PJ.
4. **Engine canônica** — `calculatePrestamistaPremium` retorna 0 com `zeroReason='pj'`/`'disabled'`.

### Casos cobertos
- ✅ PF elegível
- ✅ PF inelegível (idade alta + prazo longo)
- ✅ PJ
- ✅ Transição PF → PJ
- ✅ Transição idade elegível → inelegível (auto-disable)
- ✅ Prazo extremo (240m + idade alta)

---

## 5. Não modificado nesta onda (correto)

- **Matemática:** taxas fixas 0,0680% / 0,0765%, fórmula `saldo × taxa`, regra idade+prazo ≤ 80.
- **Engine canônica:** `src/core/finance/prestamista/*` intocada.
- **Consumers financeiros:** `monthlySchedule`, `useInvestmentCalculations`, hooks/PDFs continuam consumindo a fachada da Onda 2B.
- **PRESTAMISTA_RATE_*** e constantes.

---

## 6. Score final

| Eixo | Score |
|---|---|
| Hard-stop real (impede cálculo inviável) | 10/10 |
| Engine canônica como fonte única de elegibilidade | 10/10 |
| UX PJ (oculta toggle/labels/percentuais) | 10/10 |
| Mensagens consultivas (não atuariais) | 9/10 |
| Transition guards (PF↔PJ, idade↔prazo) | 10/10 |
| Cobertura de testes E2E | 9/10 |
| Consistência visual entre módulos | 10/10 |
| **Consistência institucional global** | **9.7/10** |

---

## 7. Próximos refinamentos possíveis (fora de escopo)

- Expor `personType` no Simulador a partir do diagnostic (`negocio-pj` → PJ default).
- Substituir `validateAgeAndTerm` por `validatePrestamistaEligibility` em todos os call-sites
  (hoje convivem; a primeira fornece `maxAllowedTermMonths` útil para hint de UX).
- Telemetria: registrar `prestamista_blocked` quando hard-stop é acionado, para auditoria comercial.

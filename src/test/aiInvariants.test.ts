/**
 * Testes de invariantes de prompt — guardrails para edges narrativas.
 *
 * Não testa qualidade da IA (isso é benchmark separado). Testa que:
 *   1. GLOBAL_AI_RULES é detectável em saídas reais via validators.
 *   2. Fragmentos compostos não conflitam entre si.
 *   3. Validador `isPromiseSafe` rejeita o que deve rejeitar e aceita o resto.
 *
 * Espelhamos os validators do edge em src/utils/aiValidators.ts (mesma lógica)
 * para poder testar no Vitest sem precisar de Deno runtime.
 */
import { describe, it, expect } from 'vitest';
import {
  isPromiseSafe,
  findForbiddenPromise,
  hasReplyHook,
  composePromptFragments,
  CONSULTATIVE_TONE,
  TRUST_REINFORCEMENT,
  OBJECTION_HANDLING,
  URGENCY_FRAMING,
  REPLY_HOOK_INSTRUCTION,
  GLOBAL_AI_RULES,
} from '@/utils/aiValidators';

describe('AI invariants — promise safety', () => {
  it.each([
    'Você vai ser contemplado em 6 meses',
    'Garantimos a aprovação',
    'É garantido pelo banco',
    'Sem risco nenhum',
    'Retorno garantido de 12%',
    'Será contemplado no próximo mês',
  ])('rejeita promessa: "%s"', (txt) => {
    expect(isPromiseSafe(txt)).toBe(false);
    expect(findForbiddenPromise(txt)).not.toBeNull();
  });

  it.each([
    'O histórico mostra contemplação em torno de 18 meses',
    'Tende a aumentar a chance de contemplação',
    'Aumenta a chance de aprovação no comitê',
    'Vamos avaliar juntos a melhor estratégia',
  ])('aceita texto seguro: "%s"', (txt) => {
    expect(isPromiseSafe(txt)).toBe(true);
  });
});

describe('AI invariants — reply hook', () => {
  it.each([
    'Posso te ligar amanhã às 10h?',
    'Faz sentido pra você?',
    'Prefere às 14h ou 16h?',
    'Me confirma se topa essa proposta',
  ])('detecta gancho: "%s"', (txt) => {
    expect(hasReplyHook(txt)).toBe(true);
  });

  it('rejeita texto sem gancho', () => {
    expect(hasReplyHook('Aqui estão os números da sua simulação.')).toBe(false);
  });
});

describe('AI invariants — fragment composition', () => {
  it('compõe fragmentos sem duplicar separadores', () => {
    const out = composePromptFragments(CONSULTATIVE_TONE, TRUST_REINFORCEMENT);
    expect(out).toContain('TOM CONSULTIVO');
    expect(out).toContain('REFORÇO DE CONFIANÇA');
    expect(out.match(/\n{3,}/)).toBeNull();
  });

  it('ignora fragmentos vazios', () => {
    const out = composePromptFragments(CONSULTATIVE_TONE, '', OBJECTION_HANDLING);
    expect(out).toContain('TOM CONSULTIVO');
    expect(out).toContain('TRATAMENTO DE OBJEÇÃO');
  });

  it('GLOBAL_AI_RULES menciona explicitamente proibição de promessa', () => {
    expect(GLOBAL_AI_RULES.toLowerCase()).toContain('garantido');
    expect(GLOBAL_AI_RULES.toLowerCase()).toContain('nunca');
  });

  it('URGENCY_FRAMING e REPLY_HOOK_INSTRUCTION são complementares (não conflitam)', () => {
    const out = composePromptFragments(URGENCY_FRAMING, REPLY_HOOK_INSTRUCTION);
    // Urgência + gancho = ok. Não deve haver "garantido" misturado.
    expect(isPromiseSafe(out)).toBe(true);
  });
});

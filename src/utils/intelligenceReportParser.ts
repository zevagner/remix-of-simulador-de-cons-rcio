/**
 * Utilitários puros para o módulo Admin → Inteligência.
 * - Parser de seções H2 do markdown gerado pela IA.
 * - Quebra de blocos numerados / com bullets em itens.
 * - Mapeamento keyword → aba do Admin.
 */

export const ACTION_MAP: Array<{ keywords: string[]; module: string; label: string }> = [
  { keywords: ['funil', 'simulação', 'simulacoes', 'conversão', 'conversao', 'proposta', 'lead', 'pdf', 'envio', 'enviada'], module: 'analytics', label: 'Ver Analytics' },
  { keywords: ['feedback', 'bug', 'erro', 'sugestão', 'sugestao', 'pendente'], module: 'feedbacks', label: 'Ver Feedbacks' },
  { keywords: ['retenção', 'retencao', 'churn', 'usuário', 'usuario', 'ativo', 'engajamento'], module: 'users', label: 'Ver Usuários' },
  { keywords: ['comunidade', 'caso', 'resposta', 'resolução', 'resolucao'], module: 'dashboard', label: 'Ver Painel' },
  { keywords: ['performance', 'lcp', 'cls', 'inp', 'velocidade', 'web vitals'], module: 'performance', label: 'Ver Performance' },
  { keywords: ['auditoria', 'log', 'ação', 'acao', 'deletou', 'destrutiva'], module: 'audit', label: 'Ver Auditoria' },
  { keywords: ['assembleia', 'grupo', 'lance', 'contemplação', 'contemplacao'], module: 'assemblies-ops', label: 'Ver Assembleias' },
];

export interface ActionTarget {
  module: string;
  label: string;
}

export function resolveAction(text: string): ActionTarget {
  const lc = text.toLowerCase();
  for (const entry of ACTION_MAP) {
    if (entry.keywords.some((k) => lc.includes(k))) {
      return { module: entry.module, label: entry.label };
    }
  }
  return { module: 'dashboard', label: 'Ver Painel' };
}

/** Extrai uma seção H2 do markdown (case-insensitive, casa por substring). */
export function extractSection(markdown: string, titleSubstring: string): string | null {
  const lines = markdown.split('\n');
  const target = titleSubstring.toLowerCase();
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.+)$/);
    if (m && m[1].toLowerCase().includes(target)) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start, end).join('\n').trim();
}

/** Remove seções inteiras do markdown (por title substring) — para evitar duplicação visual. */
export function removeSections(markdown: string, titleSubstrings: string[]): string {
  const lines = markdown.split('\n');
  const targets = titleSubstrings.map((t) => t.toLowerCase());
  const out: string[] = [];
  let skipping = false;
  for (const line of lines) {
    const m = line.match(/^##\s+(.+)$/);
    if (m) {
      const lower = m[1].toLowerCase();
      skipping = targets.some((t) => lower.includes(t));
      if (skipping) continue;
    }
    if (!skipping) out.push(line);
  }
  return out.join('\n').trim();
}

/**
 * Divide um bloco em itens. Aceita:
 *  - listas numeradas "1. ..." ou "1) ..."
 *  - bullets "- ..." ou "* ..."
 * Itens podem ocupar várias linhas (continuação indentada / vazia até próximo marcador).
 */
export function splitItems(section: string): string[] {
  if (!section) return [];
  const lines = section.split('\n');
  const items: string[] = [];
  let buf: string[] = [];
  const isMarker = (l: string) => /^\s*(?:\d+[.)]|[-*•])\s+/.test(l);

  const flush = () => {
    const text = buf.join('\n').trim();
    if (text) items.push(text);
    buf = [];
  };

  for (const line of lines) {
    if (isMarker(line)) {
      flush();
      buf.push(line.replace(/^\s*(?:\d+[.)]|[-*•])\s+/, ''));
    } else {
      buf.push(line);
    }
  }
  flush();

  // Se nenhum marcador foi encontrado, devolve o bloco inteiro como item único (útil para "nenhum alerta").
  if (items.length === 0 && section.trim()) return [section.trim()];
  return items;
}

/** Quebra cada item em problema/ação/impacto quando rotulado; senão, devolve só o texto cru. */
export interface RecommendationParts {
  raw: string;
  problema?: string;
  acao?: string;
  impacto?: string;
}

export function parseRecommendation(item: string): RecommendationParts {
  const lines = item.split('\n').map((l) => l.trim()).filter(Boolean);
  const out: RecommendationParts = { raw: item.trim() };
  const labelRe = /^\*{0,2}(problema|ação|acao|impacto(?:\s+esperado)?)\*{0,2}\s*:\s*(.+)$/i;
  for (const line of lines) {
    const m = line.match(labelRe);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key.startsWith('problema')) out.problema = val;
    else if (key.startsWith('ação') || key.startsWith('acao')) out.acao = val;
    else if (key.startsWith('impacto')) out.impacto = val;
  }
  return out;
}

/** Dispara navegação entre abas do Admin. */
export function navigateAdminTab(tab: string) {
  window.dispatchEvent(new CustomEvent('admin:navigate', { detail: { tab } }));
}

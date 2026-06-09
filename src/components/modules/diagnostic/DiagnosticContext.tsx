import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

// ═══════ TYPES ═══════

export type ClientObjective =
  | 'comprar-imovel'
  | 'investir'
  | 'trocar-imovel'
  | 'sair-aluguel'
  | 'patrimonio'
  | 'negocio-pj'
  | '';

export type ClientSituation =
  | 'pagando-aluguel'
  | 'tem-fgts'
  | 'saindo-financiamento'
  | 'pj-custo-alto'
  | 'saldo-parado'
  | 'primeiro-imovel'
  | '';

export type UrgencyLevel = 'alta' | 'media' | 'baixa' | '';

// ─── Onda P8: dimensões adicionais de perfil (genérico, não só imóvel) ───
export type ObjetivoPrincipal =
  | 'imovel_moradia'
  | 'imovel_investimento'
  | 'troca_imovel'
  | 'veiculo'
  | 'troca_veiculo'
  | 'investimento'
  | 'patrimonio_produtivo'
  | 'expandir_operacao'
  | '';

export type Prioridade =
  | 'menor_parcela'
  | 'menor_custo'
  | 'rapidez'
  | 'manter_liquidez'
  | '';

export type Urgencia = 'imediato' | 'curto_prazo' | 'sem_pressa' | '';

/** Quão familiarizado/confortável o cliente está com consórcio.
 *  Usado para calibrar abordagem (script, objeções e tom da proposta). */
export type ConfiancaConsorcio = 'alta' | 'media' | 'baixa' | '';

/** Perfil derivado dos 5 pilares — alimenta Investment, Objections, Proposal e Copiloto. */
export type ClientProfile = 'urgencia' | 'economico' | 'equilibrio';

/** Modificador comportamental derivado da confiança no consórcio.
 *  Combina com ClientProfile para calibrar tom (Abordagem), argumento (Copiloto) e narrativa (Proposta). */
export type ClientBehavior = 'confiante' | 'neutro' | 'resistente';

// ─── SubObjetivo (refinamento opcional, não afeta lógica de cálculo) ───
// Usado apenas para enriquecer mensagens (IA, WhatsApp, storytelling).
// Os enums atuais (objetivoPrincipal, clientObjective) permanecem intactos.
export type SubObjetivo =
  // Imóvel moradia
  | 'compra'
  | 'reforma'
  | 'construcao'
  // Imóvel investimento
  | 'aluguel'
  | 'valorizacao'
  // Veículo (compra ou troca)
  | 'primeiro_veiculo'
  | 'uso_profissional'
  | 'upgrade'
  // Investimento financeiro
  | 'patrimonio'
  | 'protecao'
  | 'aposentadoria'
  // Patrimônio produtivo
  | 'estruturacao_rural'
  | 'maquinas_implementos'
  | 'sucessao_consolidacao'
  // Expandir operação
  | 'frota_pesados'
  | 'sede_galpao'
  | 'capacidade_produtiva'
  | '';

export interface DiagnosticData {
  // ─── Campos legados (preservados) ───
  clientObjective: ClientObjective;
  clientSituation: ClientSituation;
  monthlyCapacity: number;
  urgencyLevel: UrgencyLevel;
  clientName: string;

  // ─── Novos campos (Onda P8) — opcionais, não quebram integrações ───
  /** Categoria genérica do objetivo (imóvel, veículo, investimento) */
  objetivoPrincipal: ObjetivoPrincipal;
  /** Capacidade mensal nominal (espelha monthlyCapacity para semântica P8) */
  capacidadeMensal: number;
  /** Cliente declarou ter capital disponível? */
  temCapitalDisponivel: boolean;
  /** Valor do capital disponível (apenas se temCapitalDisponivel = true) */
  capitalDisponivel: number;
  /** Critério principal de decisão */
  prioridade: Prioridade;
  /** Janela de execução desejada */
  urgencia: Urgencia;
  /** Refinamento opcional do objetivo (não impacta cálculos) */
  subObjetivo: SubObjetivo;
  /** Pilar 5: confiança/familiaridade do cliente com consórcio. */
  confiancaConsorcio: ConfiancaConsorcio;
}

export interface DiagnosticContextType {
  data: DiagnosticData;
  updateField: <K extends keyof DiagnosticData>(key: K, value: DiagnosticData[K]) => void;
  isComplete: boolean;
  hasStarted: boolean;
  /** Perfil derivado dos 5 pilares (urgência > econômico > equilíbrio). */
  clientProfile: ClientProfile;
  /** Comportamento derivado da confiança no consórcio (confiante/neutro/resistente). */
  clientBehavior: ClientBehavior;
  /** Rótulo combinado pronto para exibição (ex.: "⚡ Urgente + Resistente"). */
  clientProfileLabel: string;
  reset: () => void;
}

// ═══════ DEFAULTS ═══════

const defaultData: DiagnosticData = {
  clientObjective: '',
  clientSituation: '',
  monthlyCapacity: 0,
  urgencyLevel: '',
  clientName: '',
  // Onda P8
  objetivoPrincipal: '',
  capacidadeMensal: 0,
  temCapitalDisponivel: false,
  capitalDisponivel: 0,
  prioridade: '',
  urgencia: '',
  subObjetivo: '',
  confiancaConsorcio: '',
};

// ═══════ CONTEXT ═══════

const DiagnosticContext = createContext<DiagnosticContextType | null>(null);

export function useDiagnosticContext() {
  const ctx = useContext(DiagnosticContext);
  if (!ctx) throw new Error('useDiagnosticContext must be used within DiagnosticProvider');
  return ctx;
}

export function useDiagnosticContextSafe(): DiagnosticContextType | null {
  return useContext(DiagnosticContext);
}

// ═══════ LABELS ═══════

export const OBJECTIVE_OPTIONS: { value: ClientObjective; label: string; emoji: string }[] = [
  { value: 'comprar-imovel', label: 'Comprar imóvel', emoji: '🏠' },
  { value: 'sair-aluguel', label: 'Sair do aluguel', emoji: '🔑' },
  { value: 'investir', label: 'Investir / rentabilizar', emoji: '📈' },
  { value: 'trocar-imovel', label: 'Trocar de imóvel', emoji: '🔄' },
  { value: 'patrimonio', label: 'Formar patrimônio', emoji: '💎' },
  { value: 'negocio-pj', label: 'Uso empresarial (PJ)', emoji: '🏢' },
];

export const SITUATION_OPTIONS: { value: ClientSituation; label: string; emoji: string }[] = [
  { value: 'pagando-aluguel', label: 'Pagando aluguel', emoji: '🏠' },
  { value: 'tem-fgts', label: 'Tem FGTS disponível', emoji: '💎' },
  { value: 'saindo-financiamento', label: 'Saindo de financiamento', emoji: '🏦' },
  { value: 'pj-custo-alto', label: 'PJ com custo alto', emoji: '🏢' },
  { value: 'saldo-parado', label: 'Saldo parado na conta', emoji: '💰' },
  { value: 'primeiro-imovel', label: 'Primeiro imóvel', emoji: '⭐' },
];

export const URGENCY_OPTIONS: { value: UrgencyLevel; label: string; emoji: string; description: string }[] = [
  { value: 'alta', label: 'Alta', emoji: '🔴', description: 'Precisa resolver nos próximos 3 meses' },
  { value: 'media', label: 'Média', emoji: '🟡', description: 'Planejando para 6-12 meses' },
  { value: 'baixa', label: 'Baixa', emoji: '🟢', description: 'Sem pressa, planejamento de longo prazo' },
];

// ─── Onda P8: novas opções ───
export const OBJETIVO_PRINCIPAL_OPTIONS: { value: ObjetivoPrincipal; label: string; emoji: string }[] = [
  { value: 'imovel_moradia', label: 'Imóvel para moradia', emoji: '🏠' },
  { value: 'imovel_investimento', label: 'Imóvel para investimento', emoji: '🏢' },
  { value: 'troca_imovel', label: 'Trocar de imóvel', emoji: '🔄' },
  { value: 'veiculo', label: 'Veículo', emoji: '🚗' },
  { value: 'troca_veiculo', label: 'Trocar de carro', emoji: '🔁' },
  { value: 'investimento', label: 'Investimento financeiro', emoji: '📈' },
  { value: 'patrimonio_produtivo', label: 'Estruturar patrimônio produtivo', emoji: '🌱' },
  { value: 'expandir_operacao', label: 'Expandir operação', emoji: '📈' },
];

export const PRIORIDADE_OPTIONS: { value: Prioridade; label: string; emoji: string; description: string }[] = [
  { value: 'menor_parcela', label: 'Menor parcela', emoji: '💸', description: 'Prioriza acessibilidade mensal' },
  { value: 'menor_custo', label: 'Menor custo total', emoji: '🧮', description: 'Prioriza eficiência financeira' },
  { value: 'rapidez', label: 'Rapidez', emoji: '⚡', description: 'Quer resolver o quanto antes' },
  { value: 'manter_liquidez', label: 'Manter liquidez', emoji: '💧', description: 'Prefere preservar capital disponível' },
];

export const URGENCIA_P8_OPTIONS: { value: Urgencia; label: string; emoji: string; description: string }[] = [
  { value: 'imediato', label: 'Imediato', emoji: '🔥', description: 'Próximos 1-3 meses' },
  { value: 'curto_prazo', label: 'Curto prazo', emoji: '⏱️', description: '3-12 meses' },
  { value: 'sem_pressa', label: 'Sem pressa', emoji: '🌱', description: 'Mais de 12 meses' },
];

export const CONFIANCA_CONSORCIO_OPTIONS: { value: ConfiancaConsorcio; label: string; emoji: string; description: string }[] = [
  { value: 'alta', label: 'Já conhece bem', emoji: '✅', description: 'Já teve ou estudou consórcio' },
  { value: 'media', label: 'Conhece pouco', emoji: '🤔', description: 'Ouviu falar, tem dúvidas' },
  { value: 'baixa', label: 'Está descobrindo', emoji: '🆕', description: 'Primeira vez avaliando' },
];

// ─── SubObjetivo: opções agrupadas por objetivoPrincipal ───
export interface SubObjetivoOption {
  value: SubObjetivo;
  label: string;
  emoji: string;
  description: string;
}

export const SUB_OBJETIVO_OPTIONS: Record<Exclude<ObjetivoPrincipal, ''>, SubObjetivoOption[]> = {
  imovel_moradia: [
    { value: 'compra', label: 'Compra', emoji: '🏠', description: 'Adquirir imóvel pronto' },
    { value: 'reforma', label: 'Reforma', emoji: '🛠️', description: 'Reformar imóvel atual' },
    { value: 'construcao', label: 'Construção', emoji: '🏗️', description: 'Construir em terreno' },
  ],
  imovel_investimento: [
    { value: 'aluguel', label: 'Renda de aluguel', emoji: '💰', description: 'Imóvel para alugar' },
    { value: 'valorizacao', label: 'Valorização', emoji: '📈', description: 'Ganho com revenda' },
  ],
  troca_imovel: [
    { value: 'compra', label: 'Compra', emoji: '🏠', description: 'Adquirir imóvel pronto' },
    { value: 'reforma', label: 'Reforma', emoji: '🛠️', description: 'Reformar imóvel atual' },
    { value: 'construcao', label: 'Construção', emoji: '🏗️', description: 'Construir em terreno' },
  ],
  veiculo: [
    { value: 'primeiro_veiculo', label: 'Primeiro veículo', emoji: '🚗', description: 'Primeiro carro' },
    { value: 'uso_profissional', label: 'Uso profissional', emoji: '💼', description: 'Trabalho/serviço' },
    { value: 'upgrade', label: 'Upgrade', emoji: '⬆️', description: 'Modelo melhor' },
  ],
  troca_veiculo: [
    { value: 'primeiro_veiculo', label: 'Primeiro veículo', emoji: '🚗', description: 'Primeiro carro' },
    { value: 'uso_profissional', label: 'Uso profissional', emoji: '💼', description: 'Trabalho/serviço' },
    { value: 'upgrade', label: 'Upgrade', emoji: '⬆️', description: 'Modelo melhor' },
  ],
  investimento: [
    { value: 'patrimonio', label: 'Formar patrimônio', emoji: '💎', description: 'Construir riqueza' },
    { value: 'protecao', label: 'Proteção financeira', emoji: '🛡️', description: 'Reserva e segurança' },
    { value: 'aposentadoria', label: 'Aposentadoria', emoji: '🌅', description: 'Planejamento longo prazo' },
  ],
  patrimonio_produtivo: [
    { value: 'estruturacao_rural', label: 'Estruturação rural', emoji: '🌾', description: 'Terra, benfeitoria, sede rural' },
    { value: 'maquinas_implementos', label: 'Máquinas e implementos', emoji: '🚜', description: 'Máquinas agrícolas e implementos' },
    { value: 'sucessao_consolidacao', label: 'Sucessão e consolidação', emoji: '🧬', description: 'Sucessão e consolidação familiar' },
  ],
  expandir_operacao: [
    { value: 'frota_pesados', label: 'Frota e pesados', emoji: '🚛', description: 'Frota, caminhões, pesados' },
    { value: 'sede_galpao', label: 'Sede ou galpão', emoji: '🏭', description: 'Sede, galpão, imóvel operacional' },
    { value: 'capacidade_produtiva', label: 'Capacidade produtiva', emoji: '⚙️', description: 'Equipamento gerador, expansão produtiva' },
  ],
};

/** SubObjetivo sugerido por padrão para cada objetivoPrincipal (pré-seleção). */
export const DEFAULT_SUB_OBJETIVO: Record<Exclude<ObjetivoPrincipal, ''>, SubObjetivo> = {
  imovel_moradia: 'compra',
  imovel_investimento: 'aluguel',
  troca_imovel: 'compra',
  veiculo: 'primeiro_veiculo',
  troca_veiculo: 'upgrade',
  investimento: 'patrimonio',
  patrimonio_produtivo: 'estruturacao_rural',
  expandir_operacao: 'frota_pesados',
};

/** Label legível de um subObjetivo (busca cross-grupo, retorna '' se vazio). */
export function getSubObjetivoLabel(value: SubObjetivo): string {
  if (!value) return '';
  for (const opts of Object.values(SUB_OBJETIVO_OPTIONS)) {
    const found = opts.find(o => o.value === value);
    if (found) return found.label;
  }
  return '';
}

// ═══════ PROVIDER ═══════

export function DiagnosticProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DiagnosticData>(defaultData);

  const updateField = useCallback(<K extends keyof DiagnosticData>(key: K, value: DiagnosticData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setData(defaultData), []);

  const hasStarted = data.clientObjective !== '' || data.clientSituation !== '' || data.monthlyCapacity > 0 || data.urgencyLevel !== '';
  const isComplete = data.clientObjective !== '' && data.clientSituation !== '' && data.monthlyCapacity > 0 && data.urgencyLevel !== '';

  /** Perfil derivado dos 5 pilares — ordem: urgência > econômico > equilíbrio. */
  const clientProfile = useMemo<ClientProfile>(() => {
    if (data.urgencia === 'imediato' || data.prioridade === 'rapidez') return 'urgencia';
    if (data.prioridade === 'menor_custo' || data.prioridade === 'manter_liquidez') return 'economico';
    return 'equilibrio';
  }, [data.urgencia, data.prioridade]);

  /** Comportamento derivado da confiança no consórcio. */
  const clientBehavior = useMemo<ClientBehavior>(() => {
    if (data.confiancaConsorcio === 'alta') return 'confiante';
    if (data.confiancaConsorcio === 'baixa') return 'resistente';
    return 'neutro';
  }, [data.confiancaConsorcio]);

  /** Rótulo combinado pronto para exibição. */
  const clientProfileLabel = useMemo<string>(() => {
    const baseMap: Record<ClientProfile, string> = {
      urgencia: '⚡ Urgente',
      economico: '🧮 Econômico',
      equilibrio: '⚖️ Equilíbrio',
    };
    const behaviorMap: Record<ClientBehavior, string> = {
      confiante: 'Confiante',
      neutro: 'Neutro',
      resistente: 'Resistente',
    };
    return `${baseMap[clientProfile]} + ${behaviorMap[clientBehavior]}`;
  }, [clientProfile, clientBehavior]);

  const value = useMemo<DiagnosticContextType>(() => ({
    data, updateField, isComplete, hasStarted, clientProfile, clientBehavior, clientProfileLabel, reset,
  }), [data, updateField, isComplete, hasStarted, clientProfile, clientBehavior, clientProfileLabel, reset]);

  return (
    <DiagnosticContext.Provider value={value}>
      {children}
    </DiagnosticContext.Provider>
  );
}

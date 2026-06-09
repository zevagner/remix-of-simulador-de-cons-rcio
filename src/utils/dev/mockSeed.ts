/**
 * Mock seed generator (DEV/Admin only) — gera carteira realista para testar
 * Carteira (proposals) e Pós-venda (post_sale_clients/events).
 *
 * Marcação: TODO registro inserido recebe `notes` prefixado com `[MOCK]` para
 * permitir limpeza segura sem tocar em dados reais.
 */
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

export const MOCK_TAG = '[MOCK]';

// ─── Bancos de dados realistas ─────────────────────────────────────
const FIRST_NAMES_M = ['Anderson', 'Bruno', 'Carlos Eduardo', 'Diego', 'Eduardo', 'Fábio', 'Gustavo', 'Henrique', 'Igor', 'João Paulo', 'Lucas', 'Marcelo', 'Nilton', 'Otávio', 'Paulo Henrique', 'Rafael', 'Rodrigo', 'Thiago', 'Vinícius', 'Wesley', 'Felipe', 'Murilo', 'Ricardo', 'Leonardo', 'Antônio'];
const FIRST_NAMES_F = ['Adriana', 'Beatriz', 'Camila', 'Daniela', 'Eliane', 'Fernanda', 'Gabriela', 'Helena', 'Isabela', 'Juliana', 'Kelly', 'Larissa', 'Mariana', 'Natália', 'Patrícia', 'Renata', 'Simone', 'Tatiane', 'Vanessa', 'Yasmin', 'Letícia', 'Carolina', 'Amanda', 'Priscila', 'Bianca'];
const SURNAMES = ['Silva', 'Souza', 'Oliveira', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Carvalho', 'Lima', 'Gomes', 'Ribeiro', 'Martins', 'Araújo', 'Barbosa', 'Cardoso', 'Mendes', 'Ferreira', 'Nascimento', 'Moreira', 'Cavalcanti', 'Pinto', 'Teixeira', 'Moura', 'Andrade', 'Vieira'];
const CITIES = ['São Paulo/SP', 'Rio de Janeiro/RJ', 'Belo Horizonte/MG', 'Curitiba/PR', 'Porto Alegre/RS', 'Salvador/BA', 'Recife/PE', 'Fortaleza/CE', 'Brasília/DF', 'Goiânia/GO', 'Campinas/SP', 'Ribeirão Preto/SP', 'Sorocaba/SP', 'Niterói/RJ', 'Juiz de Fora/MG', 'Londrina/PR', 'Caxias do Sul/RS', 'Uberlândia/MG', 'Joinville/SC', 'Florianópolis/SC'];

interface ProfileTemplate {
  segment: string;
  occupation: string;
  incomeRange: [number, number];
  patrimonyRange: [number, number];
  consortiumPool: ('imovel' | 'auto' | 'pesados')[];
  creditRange: [number, number];
  triggers: string[];
  goals: string[];
}

const PROFILES: ProfileTemplate[] = [
  { segment: 'Assalariado popular', occupation: 'Operador de produção', incomeRange: [3500, 6500], patrimonyRange: [20000, 80000], consortiumPool: ['imovel', 'auto'], creditRange: [120000, 220000], triggers: ['aluguel', 'fgts'], goals: ['Sair do aluguel', 'Primeiro imóvel via FGTS'] },
  { segment: 'Assalariado classe média', occupation: 'Analista pleno', incomeRange: [7000, 14000], patrimonyRange: [80000, 250000], consortiumPool: ['imovel', 'auto'], creditRange: [250000, 500000], triggers: ['aluguel', 'fgts', 'financiamento'], goals: ['Trocar de imóvel', 'Sair de financiamento caro'] },
  { segment: 'MEI / Autônomo', occupation: 'Prestador de serviços MEI', incomeRange: [5000, 12000], patrimonyRange: [40000, 180000], consortiumPool: ['auto', 'imovel', 'pesados'], creditRange: [80000, 350000], triggers: ['liquidez', 'pj'], goals: ['Frota para o negócio', 'Imóvel comercial'] },
  { segment: 'Empresário PME', occupation: 'Sócio-administrador', incomeRange: [18000, 45000], patrimonyRange: [400000, 1500000], consortiumPool: ['imovel', 'pesados', 'auto'], creditRange: [400000, 1200000], triggers: ['pj', 'sucessao', 'investidor'], goals: ['Expansão de frota', 'Sucessão patrimonial', 'Sede própria'] },
  { segment: 'Investidor', occupation: 'Investidor / Rentista', incomeRange: [25000, 80000], patrimonyRange: [800000, 5000000], consortiumPool: ['imovel'], creditRange: [500000, 1500000], triggers: ['investidor', 'liquidez', 'sucessao'], goals: ['Carta para alavancagem', 'Renda passiva via locação', 'Diversificação patrimonial'] },
  { segment: 'Alta renda', occupation: 'Médico especialista', incomeRange: [35000, 90000], patrimonyRange: [1200000, 4000000], consortiumPool: ['imovel', 'auto'], creditRange: [800000, 2000000], triggers: ['liquidez', 'investidor'], goals: ['Imóvel de alto padrão', 'Segunda carta para investimento'] },
  { segment: 'Produtor rural', occupation: 'Produtor agropecuário', incomeRange: [15000, 60000], patrimonyRange: [500000, 3000000], consortiumPool: ['pesados', 'imovel', 'auto'], creditRange: [200000, 900000], triggers: ['agro', 'pj'], goals: ['Renovação de maquinário', 'Caminhão para escoamento'] },
  { segment: 'Servidor público', occupation: 'Servidor público estadual', incomeRange: [8000, 18000], patrimonyRange: [100000, 350000], consortiumPool: ['imovel', 'auto'], creditRange: [200000, 450000], triggers: ['fgts', 'aluguel', 'financiamento'], goals: ['Imóvel próprio', 'Trocar de carro sem juros'] },
];

const STATUSES = ['prospeccao', 'aguardando_retorno', 'em_avaliacao', 'proposta_ajustada', 'fechado', 'perdido'] as const;
// Distribuição realista: muitos topo de funil, poucos fechados/perdidos.
const STATUS_WEIGHTS: Record<typeof STATUSES[number], number> = {
  prospeccao: 28, aguardando_retorno: 22, em_avaliacao: 18, proposta_ajustada: 12, fechado: 12, perdido: 8,
};

const POST_SALE_STATUSES = ['ativo', 'contemplado', 'quitado', 'inadimplente'] as const;
const POST_SALE_PRIORITIES = ['baixa', 'normal', 'alta'] as const;

// Slugs canônicos validados pelo trigger validate_next_action_type
// (ligar, whatsapp, enviar_proposta, reuniao, follow_up, outro).
// Texto descritivo da ação vai em next_action_notes — não no enum.
const NEXT_ACTIONS = [
  'ligar',
  'whatsapp',
  'enviar_proposta',
  'reuniao',
  'follow_up',
  'outro',
] as const;

const POST_SALE_NOTES_LIB = [
  'Cliente segue firme com a estratégia. Próxima assembleia em 35 dias.',
  'Acumulou FGTS adicional, reavaliar lance embutido.',
  'Vendeu imóvel, possui liquidez para lance livre agressivo.',
  'Pediu para ser contatado apenas após contemplação.',
  'Segunda carta possível em 12 meses — perfil consultivo positivo.',
  'Inadimplência pontual no mês anterior, regularizada.',
  'Cliente referenciou primo interessado em consórcio de auto.',
];

// ─── Helpers ───────────────────────────────────────────────────────
function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min: number, max: number) { return Math.random() * (max - min) + min; }
function weightedPick<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [k, w] of entries) { r -= w; if (r <= 0) return k; }
  return entries[0][0];
}
function fullName() {
  const isF = Math.random() < 0.45;
  const first = isF ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
  return `${first} ${pick(SURNAMES)} ${pick(SURNAMES)}`;
}
function phone() {
  const ddd = pick(['11', '21', '31', '41', '51', '61', '62', '71', '81', '85']);
  return `(${ddd}) 9${randInt(1000, 9999)}-${randInt(1000, 9999)}`;
}
function daysAgo(days: number): string {
  const d = new Date(); d.setDate(d.getDate() - days);
  return d.toISOString();
}
function dateOnly(daysOffset: number): string {
  const d = new Date(); d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}
function roundTo(n: number, step: number) { return Math.round(n / step) * step; }

// Cálculo simplificado de parcela (taxa adm 22% diluída).
function estimateInstallment(credit: number, term: number) {
  return roundTo((credit * 1.22) / term, 10);
}

interface MockProposal {
  proposal: TablesInsert<'proposals'>;
  profile: ProfileTemplate;
  status: typeof STATUSES[number];
}

function generateProposal(userId: string, idx: number): MockProposal {
  const profile = pick(PROFILES);
  const consortiumType = pick(profile.consortiumPool);
  const credit = roundTo(randFloat(profile.creditRange[0], profile.creditRange[1]), 10000);
  const term =
    consortiumType === 'imovel' ? pick([140, 160, 180, 200]) :
    consortiumType === 'pesados' ? pick([100, 120, 150]) :
    pick([60, 72, 84, 100]);
  const installment = estimateInstallment(credit, term);
  const totalCost = installment * term;
  const status = weightedPick(STATUS_WEIGHTS);
  const trigger = pick(profile.triggers);
  const goal = pick(profile.goals);
  const city = pick(CITIES);
  const age = randInt(25, 64);
  const income = roundTo(randFloat(profile.incomeRange[0], profile.incomeRange[1]), 100);
  const patrimony = roundTo(randFloat(profile.patrimonyRange[0], profile.patrimonyRange[1]), 5000);
  const hasFgts = trigger === 'fgts' || Math.random() < 0.35;
  const fgtsAmount = hasFgts ? roundTo(randFloat(8000, 95000), 500) : 0;
  const useReducedInstallment = Math.random() < 0.3;
  const useEmbeddedBid = Math.random() < 0.25;

  // Edge cases (~10%)
  const isEdgeCase = Math.random() < 0.1;
  const longName = isEdgeCase && Math.random() < 0.5
    ? `${fullName()} de ${pick(SURNAMES)} ${pick(SURNAMES)} Junior`
    : null;
  const clientName = longName ?? fullName();

  const observations = [
    `${profile.segment}, ${age} anos, ${city}.`,
    `Renda mensal estimada: R$ ${income.toLocaleString('pt-BR')}. Patrimônio: R$ ${patrimony.toLocaleString('pt-BR')}.`,
    `Profissão: ${profile.occupation}. Objetivo: ${goal}.`,
    hasFgts ? `Possui FGTS acumulado de ~R$ ${fgtsAmount.toLocaleString('pt-BR')} (intenção de uso no lance).` : 'Sem FGTS aproveitável no momento.',
    useReducedInstallment ? 'Optou por parcela reduzida (0.7x) nos primeiros meses.' : '',
    useEmbeddedBid ? 'Estratégia inclui lance embutido para acelerar contemplação.' : '',
    isEdgeCase && Math.random() < 0.4
      ? 'OBS EXTENSA: cliente já contratou consórcio anterior em 2019, foi contemplado por sorteio no 14º mês, quitou via FGTS, hoje busca segunda carta para alavancagem patrimonial; possui restritivo antigo já regularizado e renda comprovada via DECORE; pediu reavaliação trimestral da estratégia de lance livre vs lance fixo.'
      : '',
  ].filter(Boolean).join(' ');

  const scoreInteresse = randInt(35, 98);
  const tags: string[] = [profile.segment.toLowerCase().split(' ')[0]];
  if (hasFgts) tags.push('fgts');
  if (income > 25000) tags.push('alta-renda');
  if (useEmbeddedBid) tags.push('lance-embutido');
  if (useReducedInstallment) tags.push('parcela-reduzida');

  const createdOffset = randInt(1, 180);
  const nextAction = !['fechado', 'perdido'].includes(status) ? pick(NEXT_ACTIONS) : null;
  const nextDate = nextAction ? dateOnly(randInt(-3, 14)) : null;

  const proposal: TablesInsert<'proposals'> = {
    user_id: userId,
    client_name: clientName,
    client_phone: phone(),
    consortium_type: consortiumType,
    credit_value: credit,
    term_months: term,
    installment,
    total_cost: totalCost,
    plan_type: 'tradicional',
    proposal_format: 'whatsapp',
    proposal_content: `${MOCK_TAG} Proposta consultiva — ${goal}. Carta R$ ${credit.toLocaleString('pt-BR')} em ${term}m, parcela ~R$ ${installment.toLocaleString('pt-BR')}. Score interesse: ${scoreInteresse}/100. Tags: ${tags.join(', ')}.`,
    notes: `${MOCK_TAG} ${observations}`,
    status,
    prospect_trigger: trigger,
    next_action_type: nextAction ?? null,
    next_action_notes: nextAction ? `Lead ${profile.segment} — ${goal}` : null,
    next_contact_date: nextDate,
    bid_percent: useEmbeddedBid ? randInt(15, 45) : null,
    bid_zone: useEmbeddedBid ? pick(['conservador', 'competitivo', 'agressivo']) : null,
    group_number: randInt(1500, 9800),
    created_at: daysAgo(createdOffset),
    updated_at: daysAgo(Math.max(0, createdOffset - randInt(0, 30))),
  };

  return { proposal, profile, status };
}

// ─── Seed principal ────────────────────────────────────────────────
export interface SeedSummary {
  proposals: number;
  postSaleClients: number;
  postSaleEvents: number;
  bySegment: Record<string, number>;
  byStatus: Record<string, number>;
  byConsortium: Record<string, number>;
}

export async function generateMockData(count = 110): Promise<SeedSummary> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const summary: SeedSummary = {
    proposals: 0, postSaleClients: 0, postSaleEvents: 0,
    bySegment: {}, byStatus: {}, byConsortium: {},
  };

  const proposalsBatch: TablesInsert<'proposals'>[] = [];
  const generated: MockProposal[] = [];
  for (let i = 0; i < count; i++) {
    const m = generateProposal(user.id, i);
    generated.push(m);
    proposalsBatch.push(m.proposal);
    summary.bySegment[m.profile.segment] = (summary.bySegment[m.profile.segment] || 0) + 1;
    summary.byStatus[m.status] = (summary.byStatus[m.status] || 0) + 1;
    summary.byConsortium[m.proposal.consortium_type] = (summary.byConsortium[m.proposal.consortium_type] || 0) + 1;
  }

  // Insert proposals em chunks de 50
  const insertedProposals: { id: string; client_name: string; consortium_type: string; credit_value: number; term_months: number; group_number: number | null }[] = [];
  for (let i = 0; i < proposalsBatch.length; i += 50) {
    const chunk = proposalsBatch.slice(i, i + 50);
    const { data, error } = await supabase.from('proposals').insert(chunk).select('id,client_name,consortium_type,credit_value,term_months,group_number');
    if (error) throw new Error(`Falha ao inserir propostas: ${error.message}`);
    insertedProposals.push(...(data ?? []));
    summary.proposals += data?.length ?? 0;
  }

  // Pós-venda: 35% das propostas fechadas viram clientes pós-venda + alguns sem proposta
  const closedIdxs = generated
    .map((g, i) => g.status === 'fechado' ? i : -1)
    .filter(i => i >= 0);

  const postSaleClients: TablesInsert<'post_sale_clients'>[] = [];
  for (const i of closedIdxs) {
    const g = generated[i];
    const ip = insertedProposals[i];
    if (!ip) continue;
    const status = weightedPick({ ativo: 60, contemplado: 25, quitado: 8, inadimplente: 7 } as Record<typeof POST_SALE_STATUSES[number], number>);
    const priority = weightedPick({ normal: 60, alta: 25, baixa: 15 } as Record<typeof POST_SALE_PRIORITIES[number], number>);
    const groupEntry = dateOnly(-randInt(60, 720));
    const contemplated = status === 'contemplado' || status === 'quitado';
    postSaleClients.push({
      user_id: user.id,
      proposal_id: ip.id,
      client_name: ip.client_name,
      client_phone: phone(),
      consortium_type: ip.consortium_type,
      credit_value: ip.credit_value,
      term_months: ip.term_months,
      group_number: ip.group_number,
      plan_modality: 'tradicional',
      status,
      priority,
      group_entry_date: groupEntry,
      contemplation_date: contemplated ? dateOnly(-randInt(5, 200)) : null,
      last_contact_date: dateOnly(-randInt(0, 60)),
      notes: `${MOCK_TAG} ${pick(POST_SALE_NOTES_LIB)}`,
    });
  }

  // Adiciona ~15 clientes pós-venda "órfãos" (sem proposta vinculada)
  for (let k = 0; k < 15; k++) {
    const profile = pick(PROFILES);
    const consortiumType = pick(profile.consortiumPool);
    const credit = roundTo(randFloat(profile.creditRange[0], profile.creditRange[1]), 10000);
    const term = consortiumType === 'imovel' ? 200 : 72;
    postSaleClients.push({
      user_id: user.id,
      client_name: fullName(),
      client_phone: phone(),
      consortium_type: consortiumType,
      credit_value: credit,
      term_months: term,
      group_number: randInt(1500, 9800),
      plan_modality: 'tradicional',
      status: weightedPick({ ativo: 70, contemplado: 20, quitado: 5, inadimplente: 5 } as Record<typeof POST_SALE_STATUSES[number], number>),
      priority: pick(POST_SALE_PRIORITIES),
      group_entry_date: dateOnly(-randInt(90, 900)),
      last_contact_date: dateOnly(-randInt(0, 90)),
      notes: `${MOCK_TAG} ${pick(POST_SALE_NOTES_LIB)}`,
    });
  }

  // Insert post_sale_clients em chunks
  const insertedPostSale: { id: string }[] = [];
  for (let i = 0; i < postSaleClients.length; i += 50) {
    const chunk = postSaleClients.slice(i, i + 50);
    const { data, error } = await supabase.from('post_sale_clients').insert(chunk).select('id');
    if (error) throw new Error(`Falha ao inserir pós-venda: ${error.message}`);
    insertedPostSale.push(...(data ?? []));
    summary.postSaleClients += data?.length ?? 0;
  }

  // Eventos: 1-3 por cliente pós-venda
  const events: TablesInsert<'post_sale_events'>[] = [];
  for (const c of insertedPostSale) {
    const evCount = randInt(1, 3);
    for (let e = 0; e < evCount; e++) {
      const isNextAction = e === 0 && Math.random() < 0.6;
      const isContact = !isNextAction && Math.random() < 0.7;
      events.push({
        client_id: c.id,
        user_id: user.id,
        event_type: isNextAction ? 'opportunity' : isContact ? 'contact' : 'note',
        description: isNextAction
          ? `${MOCK_TAG} ${pick(NEXT_ACTIONS)}`
          : isContact
          ? `${MOCK_TAG} Contato realizado via ${pick(['WhatsApp', 'ligação', 'e-mail'])} — cliente confirmou interesse na próxima assembleia.`
          : `${MOCK_TAG} ${pick(POST_SALE_NOTES_LIB)}`,
        event_date: dateOnly(isNextAction ? randInt(1, 21) : -randInt(0, 90)),
        metadata: isNextAction ? { kind: 'next_action', mock: true } : { mock: true },
      });
    }
  }
  for (let i = 0; i < events.length; i += 100) {
    const chunk = events.slice(i, i + 100);
    const { data, error } = await supabase.from('post_sale_events').insert(chunk).select('id');
    if (error) throw new Error(`Falha ao inserir eventos: ${error.message}`);
    summary.postSaleEvents += data?.length ?? 0;
  }

  return summary;
}

// ─── Limpeza (apenas registros [MOCK] do usuário atual) ────────────
export async function clearMockData(): Promise<{ proposals: number; postSaleClients: number; postSaleEvents: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Eventos com metadata.mock = true
  const { data: evDel, error: evErr } = await supabase
    .from('post_sale_events')
    .delete()
    .eq('user_id', user.id)
    .filter('metadata->>mock', 'eq', 'true')
    .select('id');
  if (evErr) throw new Error(`Falha limpando eventos: ${evErr.message}`);

  // Pós-venda com notes começando em [MOCK]
  const { data: psDel, error: psErr } = await supabase
    .from('post_sale_clients')
    .delete()
    .eq('user_id', user.id)
    .ilike('notes', `${MOCK_TAG}%`)
    .select('id');
  if (psErr) throw new Error(`Falha limpando pós-venda: ${psErr.message}`);

  // Propostas com notes começando em [MOCK]
  const { data: prDel, error: prErr } = await supabase
    .from('proposals')
    .delete()
    .eq('user_id', user.id)
    .ilike('notes', `${MOCK_TAG}%`)
    .select('id');
  if (prErr) throw new Error(`Falha limpando propostas: ${prErr.message}`);

  return {
    proposals: prDel?.length ?? 0,
    postSaleClients: psDel?.length ?? 0,
    postSaleEvents: evDel?.length ?? 0,
  };
}

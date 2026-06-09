/**
 * Service layer for assemblies CRUD — uses normalized groups + assembly_results tables.
 * Reads via the assemblies_normalized view for backward compatibility.
 * Writes go to groups + assembly_results directly.
 */
import { supabase } from '@/integrations/supabase/client';
import { AssemblyRecord, ConsortiumType } from '@/types/consortium';

// ─── Helpers ───

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user.id;
}

async function getGroupIdsForUser(userId: string, consortiumType?: ConsortiumType): Promise<string[]> {
  let query = supabase.from('groups').select('id').eq('user_id', userId);
  if (consortiumType) query = query.eq('consortium_type', consortiumType);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(g => g.id);
}

// ─── Row → Record mapping (from view or joined data) ───

function rowToRecord(row: Record<string, unknown>): AssemblyRecord {
  return {
    id: row.id as string,
    consortiumType: row.consortium_type as ConsortiumType,
    groupNumber: row.group_number as number,
    assemblyMonth: row.assembly_month as string,
    assemblyDate: row.assembly_date ? new Date(row.assembly_date as string) : new Date(0),
    hasEmbeddedBid: row.has_embedded_bid as boolean,
    embeddedBidMaxPercent: Number(row.embedded_bid_max_percent),
    creditRange: (row.credit_range as string) || '',
    participants: row.participants as number,
    totalTerm: row.total_term as number,
    remainingTerm: row.remaining_term as number,
    firstAssemblyDate: (row.first_assembly_date as string) || undefined,
    nextAssemblyDate: (row.next_assembly_date as string) || undefined,
    installmentDueDate: (row.installment_due_date as string) || undefined,
    avgBid3Months: Number(row.avg_bid_3_months),
    minBidLastAssembly: Number(row.min_bid_last_assembly),
    maxBidLastAssembly: Number(row.max_bid_last_assembly),
    contemplationsBySorteio: row.contemplations_by_sorteio as number,
    contemplationsByLanceLivre: row.contemplations_by_lance_livre as number,
    contemplationsByLanceFixo: row.contemplations_by_lance_fixo as number,
    contemplationsLastAssembly: row.contemplations_last_assembly as number,
    contemplationsCancelled: row.contemplations_cancelled as number,
    totalContemplations: row.total_contemplations as number,
    sorteio: row.sorteio as number,
    cancelled: row.cancelled as number,
    lanceFixo: row.lance_fixo as number,
    lanceLivre: row.lance_livre as number,
    minBidPercentage: Number(row.min_bid_percentage),
    avgBidPercentage: Number(row.avg_bid_percentage),
    maxBidPercentage: Number(row.max_bid_percentage),
    contemplationsByLance: row.contemplations_by_lance as number,
    createdAt: row.created_at as string,
  };
}

/** Fetch all assemblies via the normalized view */
export async function fetchAssemblies(): Promise<AssemblyRecord[]> {
  const allRows: Record<string, unknown>[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('assemblies_normalized')
      .select('id, group_id, consortium_type, group_number, assembly_month, assembly_date, has_embedded_bid, embedded_bid_max_percent, credit_range, participants, total_term, remaining_term, first_assembly_date, next_assembly_date, installment_due_date, avg_bid_3_months, min_bid_last_assembly, max_bid_last_assembly, contemplations_by_sorteio, contemplations_by_lance_livre, contemplations_by_lance_fixo, contemplations_last_assembly, contemplations_cancelled, total_contemplations, sorteio, cancelled, lance_fixo, lance_livre, min_bid_percentage, avg_bid_percentage, max_bid_percentage, contemplations_by_lance, created_at')
      .order('assembly_month', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      if (error.message?.includes('assemblies_normalized')) {
        return fetchAssembliesLegacy();
      }
      throw error;
    }
    if (!data || data.length === 0) break;
    allRows.push(...(data as Record<string, unknown>[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allRows.map(rowToRecord);
}

/** Legacy fallback — reads from old assemblies table */
async function fetchAssembliesLegacy(): Promise<AssemblyRecord[]> {
  const allRows: Record<string, unknown>[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('assemblies')
      .select('id, group_number, consortium_type, assembly_month, assembly_date, has_embedded_bid, embedded_bid_max_percent, credit_range, participants, total_term, remaining_term, first_assembly_date, next_assembly_date, installment_due_date, avg_bid_3_months, min_bid_last_assembly, max_bid_last_assembly, contemplations_by_sorteio, contemplations_by_lance_livre, contemplations_by_lance_fixo, contemplations_last_assembly, contemplations_cancelled, total_contemplations, sorteio, cancelled, lance_fixo, lance_livre, min_bid_percentage, avg_bid_percentage, max_bid_percentage, contemplations_by_lance, created_at')
      .order('assembly_month', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    allRows.push(...(data as Record<string, unknown>[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allRows.map(rowToRecord);
}

/** Upsert assemblies into normalized tables (groups + assembly_results) */
export async function upsertAssemblies(records: AssemblyRecord[], userId: string): Promise<number> {
  if (records.length === 0) return 0;

  // 1. Extract unique groups
  const groupMap = new Map<string, AssemblyRecord>();
  for (const r of records) {
    const key = `${r.consortiumType}:${r.groupNumber}`;
    if (!groupMap.has(key) || (r.assemblyDate && r.assemblyDate > (groupMap.get(key)!.assemblyDate || new Date(0)))) {
      groupMap.set(key, r);
    }
  }

  // 2. Upsert groups
  const groupRows = Array.from(groupMap.values()).map(r => ({
    user_id: userId,
    consortium_type: r.consortiumType,
    group_number: r.groupNumber,
    total_term: r.totalTerm,
    remaining_term: r.remainingTerm,
    participants: r.participants,
    has_embedded_bid: r.hasEmbeddedBid,
    embedded_bid_max_percent: r.embeddedBidMaxPercent,
    first_assembly_date: r.firstAssemblyDate || null,
    next_assembly_date: r.nextAssemblyDate || null,
    installment_due_date: r.installmentDueDate || null,
  }));

  const chunkSize = 200;
  for (let i = 0; i < groupRows.length; i += chunkSize) {
    const chunk = groupRows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('groups')
      .upsert(chunk, { onConflict: 'user_id,consortium_type,group_number' });
    if (error) throw error;
  }

  // 3. Fetch group IDs for mapping
  const { data: groupsData, error: groupsError } = await supabase
    .from('groups')
    .select('id, consortium_type, group_number')
    .eq('user_id', userId);

  if (groupsError) throw groupsError;

  const groupIdMap = new Map<string, string>();
  for (const g of (groupsData ?? [])) {
    groupIdMap.set(`${g.consortium_type}:${g.group_number}`, g.id);
  }

  // 4. Upsert assembly results
  const resultRows = records.map(r => {
    const groupId = groupIdMap.get(`${r.consortiumType}:${r.groupNumber}`);
    if (!groupId) throw new Error(`Group not found: ${r.consortiumType}:${r.groupNumber}`);
    return {
      group_id: groupId,
      assembly_month: r.assemblyMonth,
      assembly_date: r.assemblyDate instanceof Date ? r.assemblyDate.toISOString() : null,
      credit_range: r.creditRange || '',
      avg_bid_3_months: r.avgBid3Months,
      min_bid_last_assembly: r.minBidLastAssembly,
      max_bid_last_assembly: r.maxBidLastAssembly,
      contemplations_by_sorteio: r.contemplationsBySorteio,
      contemplations_by_lance_livre: r.contemplationsByLanceLivre,
      contemplations_by_lance_fixo: r.contemplationsByLanceFixo,
      contemplations_by_lance: r.contemplationsByLance,
      contemplations_last_assembly: r.contemplationsLastAssembly,
      contemplations_cancelled: r.contemplationsCancelled,
      total_contemplations: r.totalContemplations,
      sorteio: r.sorteio,
      cancelled: r.cancelled,
      lance_fixo: r.lanceFixo,
      lance_livre: r.lanceLivre,
      min_bid_percentage: r.minBidPercentage,
      avg_bid_percentage: r.avgBidPercentage,
      max_bid_percentage: r.maxBidPercentage,
    };
  });

  let totalUpserted = 0;
  for (let i = 0; i < resultRows.length; i += chunkSize) {
    const chunk = resultRows.slice(i, i + chunkSize);
    const { error, data } = await supabase
      .from('assembly_results')
      .upsert(chunk, { onConflict: 'group_id,assembly_month' })
      .select('id');
    if (error) throw error;
    totalUpserted += data?.length || chunk.length;
  }

  // 5. Tabela legacy `assemblies`: writes cortados na Onda
  // "Assemblies Edge Ingestion & Canonical Pipeline Wave".
  // Fonte canônica única = groups + assembly_results.
  // Leitura legacy permanece como fallback em fetchAssembliesLegacy.
  // DROP formal previsto após 2 ciclos sem writes (ver audit doc).

  return totalUpserted;
}

/** Delete assemblies by consortium type — scoped to current user */
export async function deleteAssembliesByType(consortiumType: ConsortiumType): Promise<void> {
  const userId = await getCurrentUserId();
  const groupIds = await getGroupIdsForUser(userId, consortiumType);

  if (groupIds.length > 0) {
    await supabase.from('assembly_results').delete().in('group_id', groupIds);
    await supabase.from('groups').delete().eq('consortium_type', consortiumType).eq('user_id', userId);
  }
  // Legacy `assemblies` table is frozen (Wave: Assemblies Edge Ingestion). No writes.
}

/** Delete all assemblies — scoped to current user */
export async function deleteAllAssemblies(): Promise<void> {
  const userId = await getCurrentUserId();
  const groupIds = await getGroupIdsForUser(userId);

  if (groupIds.length > 0) {
    await supabase.from('assembly_results').delete().in('group_id', groupIds);
  }
  await supabase.from('groups').delete().eq('user_id', userId);
  // Legacy `assemblies` table is frozen. No writes.
}

/** Delete assemblies for specific months of a type (pruning) — scoped to current user */
export async function deleteAssembliesByMonths(
  consortiumType: ConsortiumType,
  months: string[]
): Promise<void> {
  if (months.length === 0) return;

  const userId = await getCurrentUserId();
  const groupIds = await getGroupIdsForUser(userId, consortiumType);

  if (groupIds.length > 0) {
    await supabase
      .from('assembly_results')
      .delete()
      .in('group_id', groupIds)
      .in('assembly_month', months);
  }

  // Legacy `assemblies` table is frozen. No writes.
}

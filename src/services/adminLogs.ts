import { supabase } from '@/integrations/supabase/client';

export interface AdminLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_user_id: string | null;
  details: string | null;
  created_at: string;
}

/**
 * Minimizes PII (Personally Identifiable Information) in admin logs.
 * Replaces full emails with their domain and removes redundant names.
 */
function sanitizeDetails(details: string | null): string | null {
  if (!details) return null;

  let sanitized = details;

  // Mask emails: user@domain.com -> @domain.com
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '@$1');

  // Remove redundant "nome: " or "name: " labels that usually precede PII
  // We prefer using target_user_id for traceability
  sanitized = sanitized.replace(/nome:\s*[^,]+(,\s*)?/gi, '');
  sanitized = sanitized.replace(/name:\s*[^,]+(,\s*)?/gi, '');

  return sanitized.trim() || null;
}

export async function logAdminAction(adminUserId: string, action: string, targetUserId?: string, details?: string) {
  const sanitizedDetails = sanitizeDetails(details ?? null);
  
  await supabase.from('admin_logs').insert({
    admin_user_id: adminUserId,
    action,
    target_user_id: targetUserId ?? null,
    details: sanitizedDetails,
  });
}

export async function getAdminLogs(): Promise<AdminLog[]> {
  const { data } = await supabase
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  return (data ?? []) as AdminLog[];
}

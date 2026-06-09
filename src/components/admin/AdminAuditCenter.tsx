import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AdminPageHeader } from './AdminPageHeader';

const AdminAuditLogs = lazy(() => import('./AdminAuditLogs').then(m => ({ default: m.AdminAuditLogs })));
const AdminLogs = lazy(() => import('./AdminLogs').then(m => ({ default: m.AdminLogs })));

/**
 * Centro unificado de auditoria — consolida:
 *  • Ações de negócio (proposals, pós-venda, PDFs, simulações)
 *  • Ações administrativas (criação/edição/exclusão de usuário)
 * Substitui as antigas abas "Logs" + "Auditoria" separadas.
 */
export function AdminAuditCenter() {
  const [tab, setTab] = useState<'business' | 'admin'>('business');
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Auditoria"
        subtitle="Trilha unificada de ações de negócio e ações administrativas."
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'business' | 'admin')}>
        <TabsList>
          <TabsTrigger value="business">Ações de negócio</TabsTrigger>
          <TabsTrigger value="admin">Ações administrativas</TabsTrigger>
        </TabsList>
        <TabsContent value="business" className="mt-4">
          <Suspense fallback={<div className="py-10 text-center text-sm text-muted-foreground animate-pulse">Carregando auditoria de negócio...</div>}>
            <AdminAuditLogs />
          </Suspense>
        </TabsContent>
        <TabsContent value="admin" className="mt-4">
          <Suspense fallback={<div className="py-10 text-center text-sm text-muted-foreground animate-pulse">Carregando logs administrativos...</div>}>
            <AdminLogs />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AdminAIUsage } from './AdminAIUsage';
import { AdminAIPerformance } from './AdminAIPerformance';
import { AdminPageHeader } from './AdminPageHeader';

/**
 * Centro unificado de Performance IA — consolida:
 *  • Uso (volume por modelo, custo, latência)
 *  • Performance (cache hit/miss, bid híbrido, qualidade)
 * Fonte canônica única: eventos `ai_call` (instrumentação shared).
 */
export function AdminAICenter() {
  const [tab, setTab] = useState<'usage' | 'perf'>('usage');
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Performance IA"
        subtitle="Uso, custo, latência e cache. Fonte canônica: eventos ai_call."
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'usage' | 'perf')}>
        <TabsList>
          <TabsTrigger value="usage">Uso & Custo</TabsTrigger>
          <TabsTrigger value="perf">Cache & Qualidade</TabsTrigger>
        </TabsList>
        <TabsContent value="usage" className="mt-4">
          <AdminAIUsage />
        </TabsContent>
        <TabsContent value="perf" className="mt-4">
          <AdminAIPerformance />
        </TabsContent>
      </Tabs>
    </div>
  );
}

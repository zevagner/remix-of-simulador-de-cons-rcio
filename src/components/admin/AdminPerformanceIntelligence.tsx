/**
 * Performance Intelligence Dashboard — visibilidade operacional consolidada.
 *
 * Lazy-loaded (chunk isolado). Subscriber leve do `runtimeMetrics` store:
 * - mostra Web Vitals (FCP/LCP/CLS/INP/TTFB) com thresholds oficiais
 * - render hotspots (componentes >16ms via PerfProfiler opt-in)
 * - runtime warnings recentes
 * - cards executivos (Runtime Health, Mobile, Citrix Readiness)
 *
 * Sem polling, sem timers. Re-render apenas quando `emitMetric` dispara
 * (debounced via rAF) ou no botão "Atualizar".
 */
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Activity,
  Gauge,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  Network,
  Cpu,
  RefreshCw,
  Timer,
  HardDrive,
  Hourglass,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getMetricsSnapshot,
  subscribeMetrics,
  VITAL_THRESHOLDS,
  classifyVital,
  type RuntimeMetricEvent,
  type RuntimeRating,
} from "@/lib/runtimeMetrics";
import { cn } from "@/lib/utils";
import { AdminPageHeader } from "./AdminPageHeader";

const RATING_COLORS: Record<RuntimeRating, string> = {
  good: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  "needs-improvement": "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400",
  poor: "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400",
};

const RATING_LABEL: Record<RuntimeRating, string> = {
  good: "Excelente",
  "needs-improvement": "Atenção",
  poor: "Crítico",
};

function fmt(name: string, value: number): string {
  const t = VITAL_THRESHOLDS[name];
  if (!t) return value.toFixed(1);
  if (t.unit === "ms") return `${Math.round(value)} ms`;
  return value.toFixed(3);
}

function useLiveMetrics(): RuntimeMetricEvent[] {
  const [snapshot, setSnapshot] = useState<RuntimeMetricEvent[]>(() => getMetricsSnapshot());
  useEffect(() => {
    let raf = 0;
    const unsub = subscribeMetrics(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setSnapshot(getMetricsSnapshot());
      });
    });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      unsub();
    };
  }, []);
  return snapshot;
}

function latestVitals(events: RuntimeMetricEvent[]) {
  const latest = new Map<string, RuntimeMetricEvent>();
  for (const e of events) {
    if (e.type !== "web-vital") continue;
    const prev = latest.get(e.name);
    if (!prev || prev.timestamp < e.timestamp) latest.set(e.name, e);
  }
  return ["LCP", "INP", "CLS", "FCP", "TTFB"]
    .map((name) => latest.get(name))
    .filter((x): x is RuntimeMetricEvent => Boolean(x));
}

function VitalCard({ event }: { event: RuntimeMetricEvent }) {
  const rating = (event.rating ?? classifyVital(event.name, event.value)) as RuntimeRating;
  const t = VITAL_THRESHOLDS[event.name];
  return (
    <Card className="border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{event.name}</CardTitle>
          <Badge variant="outline" className={cn("text-caption", RATING_COLORS[rating])}>
            {RATING_LABEL[rating]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{fmt(event.name, event.value)}</div>
        {t && (
          <p className="text-caption text-muted-foreground mt-1">
            Bom ≤ {t.good}
            {t.unit} · Ruim &gt; {t.poor}
            {t.unit}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ExecutiveCards({ events }: { events: RuntimeMetricEvent[] }) {
  const vitals = latestVitals(events);
  const renderEvents = events.filter((e) => e.type === "render");
  const renderStorms = renderEvents.filter((e) => e.value > 50).length;
  const poorVitals = vitals.filter((v) => (v.rating ?? classifyVital(v.name, v.value)) === "poor").length;

  const runtimeHealth: RuntimeRating =
    poorVitals === 0 && renderStorms === 0 ? "good" : poorVitals > 1 ? "poor" : "needs-improvement";

  const inp = vitals.find((v) => v.name === "INP");
  const mobileHealth: RuntimeRating = !inp
    ? "good"
    : inp.value > 500
      ? "poor"
      : inp.value > 200
        ? "needs-improvement"
        : "good";

  const ttfb = vitals.find((v) => v.name === "TTFB");
  const citrixReady: RuntimeRating = !ttfb
    ? "good"
    : ttfb.value > 1800
      ? "poor"
      : ttfb.value > 800
        ? "needs-improvement"
        : "good";

  const cards = [
    { label: "Runtime Health", icon: Activity, rating: runtimeHealth, hint: `${poorVitals} vitals críticos · ${renderStorms} render storms` },
    { label: "Mobile Health", icon: Smartphone, rating: mobileHealth, hint: inp ? `INP ${Math.round(inp.value)}ms` : "Sem dados" },
    { label: "Citrix/VPN Ready", icon: Network, rating: citrixReady, hint: ttfb ? `TTFB ${Math.round(ttfb.value)}ms` : "Sem dados" },
    { label: "React Stability", icon: Cpu, rating: renderStorms === 0 ? "good" : renderStorms > 5 ? "poor" : ("needs-improvement" as RuntimeRating), hint: `${renderEvents.length} commits >16ms` },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="border">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className={cn("text-caption", RATING_COLORS[c.rating])}>
                  {RATING_LABEL[c.rating]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-caption text-muted-foreground mt-1">{c.hint}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function RenderHotspots({ events }: { events: RuntimeMetricEvent[] }) {
  const renders = events.filter((e) => e.type === "render");
  const grouped = useMemo(() => {
    const m = new Map<string, { count: number; max: number; avg: number; total: number }>();
    for (const e of renders) {
      const k = e.module ?? e.name;
      const cur = m.get(k) ?? { count: 0, max: 0, avg: 0, total: 0 };
      cur.count += 1;
      cur.total += e.value;
      cur.max = Math.max(cur.max, e.value);
      cur.avg = cur.total / cur.count;
      m.set(k, cur);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].max - a[1].max).slice(0, 10);
  }, [renders]);

  if (grouped.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
        Nenhum render hotspot detectado.
        <p className="text-caption mt-1">
          Ative diagnóstico com <code className="px-1 bg-muted rounded">?perf=1</code> ou{" "}
          <code className="px-1 bg-muted rounded">localStorage.setItem('perf:profile','1')</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {grouped.map(([id, s]) => {
        const rating: RuntimeRating = s.max > 50 ? "poor" : s.max > 32 ? "needs-improvement" : "good";
        return (
          <div key={id} className="flex items-center justify-between p-3 rounded-md border bg-card">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{id}</p>
              <p className="text-caption text-muted-foreground">
                {s.count}× · média {s.avg.toFixed(1)}ms · pico {s.max.toFixed(1)}ms
              </p>
            </div>
            <Badge variant="outline" className={cn("text-caption shrink-0", RATING_COLORS[rating])}>
              {RATING_LABEL[rating]}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

function RecentEvents({ events }: { events: RuntimeMetricEvent[] }) {
  const recent = events.slice(-30).reverse();
  if (recent.length === 0) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Sem eventos recentes.</div>;
  }
  return (
    <div className="space-y-1 max-h-[400px] overflow-y-auto">
      {recent.map((e, i) => {
        const rating = (e.rating ?? "good") as RuntimeRating;
        return (
          <div key={i} className="flex items-center gap-2 text-xs p-2 rounded border bg-card">
            <Badge variant="outline" className={cn("text-caption shrink-0", RATING_COLORS[rating])}>
              {e.type}
            </Badge>
            <span className="font-medium truncate">{e.name}</span>
            <span className="ml-auto tabular-nums text-muted-foreground shrink-0">
              {e.type === "web-vital" ? fmt(e.name, e.value) : `${e.value.toFixed(1)}ms`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RuntimePanel({ events }: { events: RuntimeMetricEvent[] }) {
  const longTasks = events.filter((e) => e.type === "long-task");
  const memorySamples = events.filter((e) => e.type === "memory");
  const lastMem = memorySamples[memorySamples.length - 1];
  const device = events.filter((e) => e.type === "device").slice(-1)[0];
  const loginTimings = events.filter((e) => e.type === "login-timing");

  const ltCount = longTasks.length;
  const ltMax = longTasks.reduce((m, e) => Math.max(m, e.value), 0);
  const ltAvg = ltCount ? longTasks.reduce((s, e) => s + e.value, 0) / ltCount : 0;
  const ltRating: RuntimeRating = ltMax > 200 ? "poor" : ltMax > 100 ? "needs-improvement" : "good";

  const memMeta = (lastMem?.meta ?? {}) as Record<string, number | string | boolean | undefined>;
  const memRating: RuntimeRating = (lastMem?.rating ?? "good") as RuntimeRating;

  const devMeta = (device?.meta ?? {}) as Record<string, number | string | boolean | undefined>;
  const deviceClass = (devMeta.deviceClass as string) ?? "—";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Hourglass className="h-3.5 w-3.5" /> Long Tasks
              </CardTitle>
              <Badge variant="outline" className={cn("text-caption", RATING_COLORS[ltRating])}>
                {RATING_LABEL[ltRating]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{ltCount}</div>
            <p className="text-caption text-muted-foreground mt-1">
              tarefas &gt; 50ms · pico {Math.round(ltMax)}ms · média {Math.round(ltAvg)}ms
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <HardDrive className="h-3.5 w-3.5" /> Heap (JS)
              </CardTitle>
              <Badge variant="outline" className={cn("text-caption", RATING_COLORS[memRating])}>
                {RATING_LABEL[memRating]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {lastMem ? (
              <>
                <div className="text-2xl font-bold tabular-nums">{memMeta.usedMB} MB</div>
                <p className="text-caption text-muted-foreground mt-1">
                  {memMeta.pct}% de {memMeta.limitMB} MB · growth {memMeta.growthMB} MB
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Não suportado neste browser.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5" /> Device class
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{deviceClass}</div>
            <p className="text-caption text-muted-foreground mt-1">
              {devMeta.cores ?? "?"} cores · {devMeta.deviceMemoryGB ?? "?"} GB ·{" "}
              {devMeta.effectiveType ?? "—"} · {devMeta.isMobile ? "mobile" : "desktop"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" /> Login → App
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loginTimings.length === 0 ? (
            <p className="text-xs text-muted-foreground">Faça login para capturar timings reais.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {(["auth", "hydration", "total"] as const).map((step) => {
                const ev = loginTimings.filter((e) => e.name === step).slice(-1)[0];
                if (!ev) return (
                  <div key={step} className="p-3 rounded border text-center">
                    <p className="text-caption uppercase text-muted-foreground">{step}</p>
                    <p className="text-sm text-muted-foreground mt-1">—</p>
                  </div>
                );
                const r = (ev.rating ?? "good") as RuntimeRating;
                return (
                  <div key={step} className="p-3 rounded border text-center">
                    <p className="text-caption uppercase text-muted-foreground">{step}</p>
                    <p className="text-lg font-bold tabular-nums mt-1">{Math.round(ev.value)} ms</p>
                    <Badge variant="outline" className={cn("text-caption mt-1", RATING_COLORS[r])}>
                      {RATING_LABEL[r]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPerformanceIntelligence() {
  const events = useLiveMetrics();
  const vitals = latestVitals(events);
  const [, force] = useState(0);
  const refresh = useCallback(() => force((n) => n + 1), []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Performance Intelligence"
        subtitle="Visibilidade operacional consolidada"
      />
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
      </div>

      <ExecutiveCards events={events} />

      <Tabs defaultValue="vitals">
        <TabsList>
          <TabsTrigger value="vitals">
            <Zap className="h-4 w-4 mr-1" /> Web Vitals
          </TabsTrigger>
          <TabsTrigger value="runtime">
            <Timer className="h-4 w-4 mr-1" /> Runtime real
          </TabsTrigger>
          <TabsTrigger value="renders">
            <Activity className="h-4 w-4 mr-1" /> Render Hotspots
          </TabsTrigger>
          <TabsTrigger value="events">
            <AlertTriangle className="h-4 w-4 mr-1" /> Eventos recentes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="mt-4">
          {vitals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Coletando Web Vitals... interaja com a aplicação para gerar métricas.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {vitals.map((v) => (
                <VitalCard key={v.name} event={v} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="runtime" className="mt-4">
          <RuntimePanel events={events} />
        </TabsContent>

        <TabsContent value="renders" className="mt-4">
          <RenderHotspots events={events} />
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <RecentEvents events={events} />
        </TabsContent>
      </Tabs>

      <Card className="border-dashed">
        <CardContent className="pt-4 text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Baselines institucionais:</strong> LCP ≤ 2.5s · INP ≤ 200ms · CLS ≤ 0.1 · FCP ≤ 1.8s · TTFB ≤ 800ms.
          </p>
          <p>
            <strong>Hardening:</strong> dashboard lazy-loaded, sem polling, buffer circular (500), zero PII.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

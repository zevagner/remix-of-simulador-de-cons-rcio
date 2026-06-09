import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * MANUAL CHUNKS — Performance Hardening Wave
 *
 * Política institucional de bundle splitting (ver
 * docs/performance/bundle-policy.md).
 *
 * Objetivos:
 *  - Reduzir o entry inicial separando libs pesadas em chunks dedicados.
 *  - Manter cache de longo prazo (mudanças em features não invalidam vendor).
 *  - Permitir que rotas/áreas pesadas (charts, exceljs, dnd, intro.js,
 *    sentry) carreguem sob demanda.
 *
 * Regras:
 *  - Não criar chunk "financial-core" — `@/core/finance` deve permanecer
 *    inline com o consumer principal (zero indireção em hot paths).
 *  - Toda nova lib pesada (>50 KB gzipped) DEVE ganhar chunk dedicado aqui.
 *  - Ordem importa: agrupamentos mais específicos primeiro.
 */
function manualChunks(id: string): string | undefined {
  if (!id.includes("node_modules")) return undefined;

  // Charts — NÃO agrupar manualmente. Forçar `vendor-charts` com
  // recharts/d3/victory-vendor causou TDZ ("Cannot access 'S' before
  // initialization") em produção por ciclos entre d3-* e victory-vendor.
  // Deixar o Rollup montar o grafo natural evita o boot quebrado, mantendo
  // a lazy-load das telas analíticas (que já consomem recharts sob demanda).
  // Excel — exceljs ~250 KB; usado apenas no parser de assembleias.
  if (/[\\/]node_modules[\\/]exceljs[\\/]/.test(id)) {
    return "vendor-excel";
  }
  // Animation — framer-motion ~120 KB; transições de UI.
  if (/[\\/]node_modules[\\/]framer-motion[\\/]/.test(id)) {
    return "vendor-motion";
  }
  // Sentry — observabilidade; pesado, não-crítico no boot.
  if (/[\\/]node_modules[\\/]@sentry[\\/]/.test(id)) {
    return "vendor-sentry";
  }
  // Drag & drop — dnd-kit; usado apenas no Kanban CRM.
  if (/[\\/]node_modules[\\/]@dnd-kit[\\/]/.test(id)) {
    return "vendor-dnd";
  }
  // Markdown renderer — apenas em surfaces específicas.
  if (/[\\/]node_modules[\\/]react-markdown[\\/]/.test(id)) {
    return "vendor-markdown";
  }
  // Supabase SDK — sempre necessário, mas isolado para cache estável.
  if (/[\\/]node_modules[\\/]@supabase[\\/]/.test(id)) {
    return "vendor-supabase";
  }
  // React Query — TanStack Query.
  if (/[\\/]node_modules[\\/]@tanstack[\\/]/.test(id)) {
    return "vendor-query";
  }
  // Radix UI — primitives; agrupar para cache.
  if (/[\\/]node_modules[\\/]@radix-ui[\\/]/.test(id)) {
    return "vendor-radix";
  }
  // React core — entry crítico, isolar para long-term cache.
  if (
    /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(
      id,
    )
  ) {
    return "vendor-react";
  }

  return undefined;
}

export default defineConfig(({ mode }) => ({
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    // Aumenta o threshold de aviso para evitar ruído em chunks vendor
    // legítimos (charts, excel) — gates reais ficam no plano de bundle policy.
    chunkSizeWarningLimit: 600,
    // Security Hardening Wave 1 — desabilita source maps em produção para
    // dificultar engenharia reversa do bundle. Em dev, sourcemaps continuam
    // ativos por padrão (DX preservada).
    sourcemap: mode === "development",
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
}));

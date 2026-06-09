/**
 * CrossModuleLink — primitiva de continuidade operacional entre módulos.
 *
 * UX Wave 3 — Cross-Module Operational Scanning.
 *
 * Apresentacional. Sem estado próprio, sem cálculos, sem efeitos.
 * Usa `useModuleNavigation()` (já provido em todo o /app) para
 * navegar para outro módulo preservando a sessão.
 *
 * Padrão visual único: chip discreto com seta, tom institucional.
 * NÃO inventa breadcrumbs, overlays ou mega-nav — apenas materializa
 * o "próximo passo cross-module" no contexto do conteúdo atual.
 */
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';

export interface CrossModuleLinkProps {
  /** Módulo destino (ex: 'proposals', 'post-sale', 'analysis'). */
  to: string;
  /** Rótulo curto, voz consultiva (ex: "Acompanhar no Pós-venda"). */
  label: string;
  /** Variante visual. `inline` para usar dentro de cards/headers; `chip` para barras de meta. */
  variant?: 'inline' | 'chip';
  /** Classes adicionais opcionais (não substituem tokens). */
  className?: string;
  /** Identificador opcional para analytics/telemetria externa. */
  'data-source'?: string;
}

const BASE = 'inline-flex items-center gap-1 text-caption font-medium transition-colors';

const VARIANT_CLASSES: Record<NonNullable<CrossModuleLinkProps['variant']>, string> = {
  inline: 'text-primary hover:text-primary/80 hover:underline underline-offset-2',
  chip:
    'px-2 py-0.5 rounded-full border border-primary/25 bg-primary/5 text-primary ' +
    'hover:bg-primary/10 hover:border-primary/40',
};

export function CrossModuleLink({
  to,
  label,
  variant = 'inline',
  className,
  ...rest
}: CrossModuleLinkProps) {
  const { navigateTo } = useModuleNavigation();
  return (
    <button
      type="button"
      onClick={() => navigateTo(to)}
      className={cn(BASE, VARIANT_CLASSES[variant], className)}
      {...rest}
    >
      <span className="truncate max-w-[180px]">{label}</span>
      <ArrowRight className="h-3 w-3 shrink-0" aria-hidden />
    </button>
  );
}

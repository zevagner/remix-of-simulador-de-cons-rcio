import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { ArrowRight, User, CheckCircle2, Compass, Target, Clock, Wallet, ShieldCheck, Package } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';
import {
  useDiagnosticContext,
  OBJETIVO_PRINCIPAL_OPTIONS,
  PRIORIDADE_OPTIONS,
  URGENCIA_P8_OPTIONS,
  CONFIANCA_CONSORCIO_OPTIONS,
  SUB_OBJETIVO_OPTIONS,
  DEFAULT_SUB_OBJETIVO,
  getSubObjetivoLabel,
  type ObjetivoPrincipal,
  type Prioridade,
  type Urgencia,
  type ConfiancaConsorcio,
  type SubObjetivo,
  type ClientObjective,
  type ClientSituation,
  type UrgencyLevel,
} from './diagnostic/DiagnosticContext';

import { CurrencyInput } from '@/components/ui/currency-input';
import { cn } from '@/lib/utils';
import { ResetButton } from '@/components/ui/ResetButton';
import { useTrackModuleAccess } from '@/hooks/useTrackModuleAccess';
import { MobileStickyCTA } from '@/components/shared/MobileStickyCTA';

// ─── Mirror P8 → campos legados (preserva integrações com Storytelling/Proposta) ───
const OBJETIVO_TO_LEGACY: Record<Exclude<ObjetivoPrincipal, ''>, ClientObjective> = {
  imovel_moradia: 'comprar-imovel',
  imovel_investimento: 'investir',
  troca_imovel: 'trocar-imovel',
  veiculo: 'comprar-imovel', // melhor aproximação no enum legado
  troca_veiculo: 'trocar-imovel', // melhor aproximação no enum legado
  investimento: 'investir',
  patrimonio_produtivo: 'patrimonio', // estruturação patrimonial
  expandir_operacao: 'negocio-pj',     // expansão operacional
};

const URGENCIA_TO_LEGACY: Record<Exclude<Urgencia, ''>, UrgencyLevel> = {
  imediato: 'alta',
  curto_prazo: 'media',
  sem_pressa: 'baixa',
};

// Situação derivada do objetivo (mantém storytelling funcional)
const OBJETIVO_TO_SITUATION: Record<Exclude<ObjetivoPrincipal, ''>, ClientSituation> = {
  imovel_moradia: 'pagando-aluguel',
  imovel_investimento: 'saldo-parado',
  troca_imovel: 'primeiro-imovel',
  veiculo: 'saldo-parado',
  troca_veiculo: 'saldo-parado',
  investimento: 'saldo-parado',
  patrimonio_produtivo: 'saldo-parado',
  expandir_operacao: 'pj-custo-alto',
};

export function DiagnosticModule() {
  useTrackModuleAccess('diagnostic');
  const { data, updateField, clientProfile, clientBehavior, clientProfileLabel, reset } = useDiagnosticContext();
  const { navigateTo } = useModuleNavigation();
  const [step, setStep] = useState(0);

  // Helper: ao alterar objetivo P8, espelha para legado e pré-seleciona subObjetivo
  const setObjetivoPrincipal = (v: ObjetivoPrincipal) => {
    updateField('objetivoPrincipal', v);
    if (v) {
      updateField('clientObjective', OBJETIVO_TO_LEGACY[v]);
      updateField('clientSituation', OBJETIVO_TO_SITUATION[v]);
      // Pré-seleciona subObjetivo padrão se ainda não houver um válido para este grupo
      const validForGroup = SUB_OBJETIVO_OPTIONS[v].some(o => o.value === data.subObjetivo);
      if (!validForGroup) {
        updateField('subObjetivo', DEFAULT_SUB_OBJETIVO[v]);
      }
    } else {
      updateField('subObjetivo', '');
    }
  };

  // Helper: ao alterar capacidade P8, espelha para legado
  const setCapacidadeMensal = (v: number) => {
    updateField('capacidadeMensal', v);
    updateField('monthlyCapacity', v);
  };

  // Helper: ao alterar urgência P8, espelha para legado
  const setUrgencia = (v: Urgencia) => {
    updateField('urgencia', v);
    if (v) updateField('urgencyLevel', URGENCIA_TO_LEGACY[v]);
  };

  const isImovel = data.objetivoPrincipal === 'imovel_moradia' || data.objetivoPrincipal === 'imovel_investimento' || data.objetivoPrincipal === 'troca_imovel';
  const isVeiculo = data.objetivoPrincipal === 'veiculo' || data.objetivoPrincipal === 'troca_veiculo';
  const isInvestimento = data.objetivoPrincipal === 'investimento';

  const steps = [
    { key: 'clientName', label: 'Cliente' },
    { key: 'objetivoPrincipal', label: 'Objetivo' },
    { key: 'capacidadeMensal', label: 'Parcela confortável' },
    { key: 'prioridade', label: 'Prioridade' },
    { key: 'urgencia', label: 'Prazo' },
    { key: 'confiancaConsorcio', label: 'Confiança' },
    { key: 'bem', label: isInvestimento ? 'Resumo' : 'Resumo do perfil' },
  ];

  const currentStepComplete = (() => {
    switch (step) {
      case 0: return data.clientName.trim().length > 0;
      case 1: return data.objetivoPrincipal !== '';
      case 2: return data.capacidadeMensal > 0;
      case 3: return data.prioridade !== '';
      case 4: return data.urgencia !== '';
      case 5: return data.confiancaConsorcio !== '';
      case 6: return true; // resumo
      default: return false;
    }
  })();

  const handleContinue = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      navigateTo('simulator');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <ModuleHeader
        title="Diagnóstico"
        subtitle="Entenda o cliente antes de simular"
        moduleId="diagnostic"
      />


      <div className="max-w-2xl mx-auto w-full space-y-5">
        {/* Progress */}
        <div className="flex items-center gap-1 px-1">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1 flex-1">
              <div className={cn(
                'h-1.5 rounded-full flex-1 transition-colors',
                i < step ? 'bg-primary' :
                i === step ? 'bg-primary/50' :
                'bg-muted'
              )} />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-baseline gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Passo {step + 1} de {steps.length}
            </p>
            <span className="text-muted-foreground/40">·</span>
            <p className="text-sm font-medium text-foreground">
              {steps[step].label}
            </p>
          </div>
          <ResetButton onReset={() => { reset(); setStep(0); }} moduleName="o Diagnóstico" />
        </div>


      {/* Step 0: Nome */}
      {step === 0 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Nome do cliente</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Identifique o cliente para personalizar toda a jornada de venda.
            </p>
            <div>
              <Label htmlFor="client-name">Nome</Label>
              <Input
                id="client-name"
                placeholder="Ex: João Silva"
                value={data.clientName}
                onChange={(e) => updateField('clientName', e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Objetivo principal (categoria do bem/serviço) */}
      {step === 1 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Compass className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Qual é o objetivo principal?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Define toda a narrativa: cenários, recomendações e dados do bem coletados a seguir.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OBJETIVO_PRINCIPAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setObjetivoPrincipal(opt.value as ObjetivoPrincipal)}
                  className={cn(
                    'flex items-center gap-3 p-card-sm rounded-xl border text-left transition-[colors,box-shadow,transform]',
                    'hover:border-primary/50 hover:bg-primary/5',
                    data.objetivoPrincipal === opt.value
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                      : 'border-border'
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="font-medium text-sm">{opt.label}</span>
                  {data.objetivoPrincipal === opt.value && (
                    <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                  )}
                </button>
              ))}
            </div>

            {/* Sub-objetivo: refinamento opcional, aparece após escolher o objetivo principal */}
            {data.objetivoPrincipal && SUB_OBJETIVO_OPTIONS[data.objetivoPrincipal].length > 0 && (
              <div className="pt-4 border-t border-border/50 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">
                    Refinar objetivo <span className="text-muted-foreground font-normal">(opcional)</span>
                  </p>
                  {data.subObjetivo && (
                    <button
                      type="button"
                      onClick={() => updateField('subObjetivo', '')}
                      className="text-caption text-muted-foreground hover:text-foreground underline"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUB_OBJETIVO_OPTIONS[data.objetivoPrincipal].map((sub) => {
                    const active = data.subObjetivo === sub.value;
                    return (
                      <button
                        key={sub.value}
                        type="button"
                        onClick={() => updateField('subObjetivo', active ? '' : (sub.value as SubObjetivo))}
                        title={sub.description}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-[colors,box-shadow,transform]',
                          'hover:border-primary/50',
                          active
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border text-foreground/80'
                        )}
                      >
                        <span>{sub.emoji}</span>
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-caption text-muted-foreground">
                  Usado para personalizar mensagens e propostas com IA. Não afeta cálculos.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Capacidade mensal */}
      {step === 2 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Quanto pode investir por mês?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Base para o motor de decisão sugerir cartas e prazos compatíveis.
            </p>
            <div>
              <Label htmlFor="capacidade-mensal">Valor mensal disponível</Label>
              <CurrencyInput
                id="capacidade-mensal"
                value={data.capacidadeMensal}
                onChange={setCapacidadeMensal}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Prioridade */}
      {step === 3 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">O que é mais importante para o cliente?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Critério principal que o motor de decisão usará para ranquear cenários.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRIORIDADE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateField('prioridade', opt.value as Prioridade)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border text-left transition-[colors,box-shadow,transform]',
                    'hover:border-primary/50 hover:bg-primary/5',
                    data.prioridade === opt.value
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                      : 'border-border'
                  )}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-caption text-muted-foreground">{opt.description}</p>
                  </div>
                  {data.prioridade === opt.value && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Urgência (prazo) */}
      {step === 4 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Quando pretende adquirir?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              A janela de execução define a estratégia de lance e os grupos mais adequados.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {URGENCIA_P8_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setUrgencia(opt.value as Urgencia)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-card-sm rounded-lg border text-center transition-[colors,box-shadow,transform]',
                    'hover:border-primary/50 hover:bg-primary/5',
                    data.urgencia === opt.value
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                      : 'border-border'
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-caption text-muted-foreground">{opt.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Confiança no consórcio (5º pilar) */}
      {step === 5 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Quanto o cliente já conhece sobre consórcio?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Define o tom da abordagem: quem conhece quer números; quem está descobrindo precisa de educação.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CONFIANCA_CONSORCIO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateField('confiancaConsorcio', opt.value as ConfiancaConsorcio)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-card-sm rounded-lg border text-center transition-[colors,box-shadow,transform]',
                    'hover:border-primary/50 hover:bg-primary/5',
                    data.confiancaConsorcio === opt.value
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                      : 'border-border'
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-caption text-muted-foreground">{opt.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Resumo + perfil derivado */}
      {step === 6 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">
                {isImovel && 'Resumo — perfil para imóvel'}
                {isVeiculo && 'Resumo — perfil para veículo'}
                {isInvestimento && 'Resumo — perfil para investimento'}
                {!data.objetivoPrincipal && 'Resumo do diagnóstico'}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Os parâmetros específicos do bem (valor da carta, prazo, taxa) serão definidos no Simulador, com base neste perfil.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div>
                <p className="text-muted-foreground">Cliente</p>
                <p className="font-medium">{data.clientName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Objetivo</p>
                <p className="font-medium">
                  {OBJETIVO_PRINCIPAL_OPTIONS.find(o => o.value === data.objetivoPrincipal)?.label || '—'}
                  {data.subObjetivo && (
                    <span className="text-muted-foreground font-normal"> · {getSubObjetivoLabel(data.subObjetivo)}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Capacidade/mês</p>
                <p className="font-medium">
                  {data.capacidadeMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Prioridade</p>
                <p className="font-medium">
                  {PRIORIDADE_OPTIONS.find(o => o.value === data.prioridade)?.label || '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Prazo</p>
                <Badge variant="outline" className="text-xs">
                  {URGENCIA_P8_OPTIONS.find(o => o.value === data.urgencia)?.emoji}{' '}
                  {URGENCIA_P8_OPTIONS.find(o => o.value === data.urgencia)?.label}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Confiança</p>
                <p className="font-medium">
                  {CONFIANCA_CONSORCIO_OPTIONS.find(o => o.value === data.confiancaConsorcio)?.label || '—'}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-3 pt-2 border-t border-primary/20">
                <p className="text-muted-foreground">Perfil sugerido</p>
                <Badge className="text-xs mt-1">{clientProfileLabel}</Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {clientProfile === 'urgencia' && 'Priorize contemplação rápida.'}
                  {clientProfile === 'economico' && 'Priorize custo total.'}
                  {clientProfile === 'equilibrio' && 'Balanceie prazo e custo.'}
                  {' '}
                  {clientBehavior === 'confiante' && 'Cliente confiante — vá direto à proposta.'}
                  {clientBehavior === 'neutro' && 'Cliente neutro — explique pontos-chave.'}
                  {clientBehavior === 'resistente' && 'Cliente resistente — trate objeções primeiro.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation — desktop/tablet inline */}
      <div className="hidden md:flex items-center justify-between gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            ← Voltar
          </Button>
        )}
        <div className="flex-1" />
        <Button
          onClick={handleContinue}
          disabled={!currentStepComplete}
          size="lg"
          className="gap-2 px-8 py-3"
        >
          {step < steps.length - 1 ? (
            <>Próximo <ArrowRight className="h-4 w-4" /></>
          ) : (
            <>Continuar para Simulação <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      </div>

      {/* Mobile: sticky CTA fica visível durante todo o scroll do passo */}
      <MobileStickyCTA
        helperText={!currentStepComplete ? `Preencha "${steps[step].label}" para continuar` : undefined}
      >
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="px-4">
            ←
          </Button>
        )}
        <Button
          onClick={handleContinue}
          disabled={!currentStepComplete}
          className="flex-1 gap-2"
        >
          {step < steps.length - 1 ? (
            <>Próximo <ArrowRight className="h-4 w-4" /></>
          ) : (
            <>Continuar para Simulação <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      </MobileStickyCTA>
      </div>
    </div>
  );
}

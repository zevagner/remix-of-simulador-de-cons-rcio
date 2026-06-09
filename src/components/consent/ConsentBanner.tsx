/**
 * ConsentBanner — banner discreto, exibido apenas para usuários autenticados
 * que ainda não decidiram sobre analytics. Sem dark patterns, sem "aceitar tudo"
 * exagerado.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getConsent, setAnalyticsConsent, subscribeConsent } from "@/lib/consent";

export function ConsentBanner() {
  const [status, setStatus] = useState(() => getConsent().analytics);

  useEffect(() => {
    return subscribeConsent((s) => setStatus(s.analytics));
  }, []);

  if (status !== "unknown") return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de telemetria"
      className="fixed bottom-4 left-1/2 z-50 w-[min(96vw,560px)] -translate-x-1/2 rounded-xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-sm animate-fade-in"
    >
      <p className="text-sm text-foreground">
        Usamos telemetria interna (eventos de uso, sem PII) para melhorar a
        plataforma. Você pode permitir ou recusar. Dados financeiros e da sua
        operação <strong>nunca</strong> são compartilhados com terceiros para
        publicidade. Veja nossa{" "}
        <Link to="/privacidade" className="underline hover:text-primary transition-colors">
          Política de Privacidade
        </Link>.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Monitoramento de erros técnicos é sempre ativo para garantir o
        funcionamento da plataforma. Métricas de performance são coletadas
        apenas com seu consentimento.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Esta aplicação não utiliza cookies de rastreamento ou scripts de terceiros.
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAnalyticsConsent(false)}
        >
          Recusar
        </Button>
        <Button size="sm" onClick={() => setAnalyticsConsent(true)}>
          Permitir telemetria
        </Button>
      </div>
    </div>
  );
}

export default ConsentBanner;

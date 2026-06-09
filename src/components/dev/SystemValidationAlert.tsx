import { useEffect, useState } from "react";
import { AlertTriangle, X, ChevronDown, ChevronUp } from "lucide-react";
import { validateSystem, type ValidationReport } from "@/utils/decisionEngine";
import { recordValidationFailure } from "@/utils/systemValidationLog";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

/**
 * Alerta visual de regressão — renderiza APENAS para administradores autenticados
 * (ou em DEV) quando validateSystem() detecta inconsistências.
 * Não bloqueia uso do app; apenas informa.
 */
export function SystemValidationAlert() {
  const { isAdmin } = useAuth();
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const allowed = isAdmin || import.meta.env.DEV;

  useEffect(() => {
    if (!allowed) return;
    let r: ValidationReport;
    try {
      r = validateSystem();
    } catch (e) {
      r = {
        ok: false,
        cases: [],
        failures: [
          {
            name: "validateSystem() lançou exceção",
            passed: false,
            expected: "execução sem erro",
            received: String(e),
          },
        ],
      };
    }
    setReport(r);
    if (!r.ok) recordValidationFailure(r, "boot_alert");
  }, [allowed]);

  if (!allowed) return null;
  if (!report || report.ok || dismissed) return null;

  return (
    <div
      role="alert"
      className={cn(
        "fixed bottom-4 left-4 z-[9999] max-w-sm rounded-lg border-2 border-destructive",
        "bg-background shadow-lg text-foreground"
      )}
    >
      <div className="flex items-start gap-2 p-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-destructive">
            ⚠️ Sistema com inconsistência detectada
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {report.failures.length} de {report.cases.length} testes falharam
            {isAdmin ? " (visível para admin)" : " (DEV)"}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" /> Ocultar detalhes
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" /> Ver detalhes
              </>
            )}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1">
              {report.failures.map((f, i) => (
                <li
                  key={i}
                  className="rounded border border-destructive/30 bg-destructive/5 p-2 text-xs"
                >
                  <p className="font-medium text-foreground">{f.name}</p>
                  <p className="mt-1 text-muted-foreground">
                    <span className="font-semibold">Esperado:</span>{" "}
                    <code className="font-mono">{JSON.stringify(f.expected)}</code>
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-semibold">Recebido:</span>{" "}
                    <code className="font-mono">{JSON.stringify(f.received)}</code>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Fechar alerta"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

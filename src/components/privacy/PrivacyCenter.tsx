/**
 * Privacy Center — LGPD Art. 18 self-service.
 *
 * Discreet, no dark patterns:
 *  - Export my data (ZIP, signed URLs 24h)
 *  - Manage analytics consent
 *  - Delete my account (typed confirmation)
 *  - Retention policy summary
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getConsent, setAnalyticsConsent, subscribeConsent } from "@/lib/consent";
import { useEffect } from "react";

export function PrivacyCenter() {
  const [exporting, setExporting] = useState(false);
  const [purging, setPurging] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [consent, setConsent] = useState(getConsent());

  useEffect(() => subscribeConsent(setConsent), []);

  async function handleExport() {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada.");
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-export`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!res.ok) throw new Error(`Falha (${res.status})`);
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(cd);
      const filename = match?.[1] ?? `meus-dados-${Date.now()}.zip`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("Exportação pronta.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  async function handlePurge() {
    if (confirm !== "EXCLUIR") {
      toast.error('Digite EXCLUIR para confirmar.');
      return;
    }
    setPurging(true);
    try {
      const { data, error } = await supabase.functions.invoke("account-purge", {
        body: { confirm: "EXCLUIR" },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      toast.success("Conta excluída. Você será desconectado.");
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
      }, 1500);
    } catch (e) {
      toast.error((e as Error).message);
      setPurging(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Central de Privacidade
        </h1>
        <p className="text-sm text-muted-foreground">
          Seus direitos sob a LGPD (Art. 18): acessar, exportar, revogar consentimento e excluir.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" /> Exportar meus dados
          </CardTitle>
          <CardDescription>
            Arquivo ZIP com perfil, propostas, pós-venda, eventos, auditoria e links assinados (24h) para seus PDFs.
            Nenhum dado de terceiros é incluído.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? "Gerando..." : "Baixar exportação (ZIP)"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consentimento — Analytics</CardTitle>
          <CardDescription>
            Status atual:{" "}
            <Badge variant={consent.analytics === "granted" ? "default" : "secondary"}>
              {consent.analytics === "granted" ? "Permitido" : consent.analytics === "denied" ? "Bloqueado" : "Não decidido"}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAnalyticsConsent(true)}>Permitir</Button>
          <Button variant="outline" size="sm" onClick={() => setAnalyticsConsent(false)}>Bloquear</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Política de Retenção
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>• PDFs de proposta: <strong>90 dias</strong></p>
          <p>• Eventos de analytics: <strong>180 dias</strong></p>
          <p>• Trilhas de auditoria: <strong>365 dias</strong></p>
          <p>• URLs assinadas de exportação: <strong>24 horas</strong></p>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" /> Excluir minha conta
          </CardTitle>
          <CardDescription>
            Ação irreversível. Remove perfil, propostas, pós-venda, PDFs, analytics, auditoria e acesso.
            Digite <code className="font-mono font-semibold">EXCLUIR</code> para confirmar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Digite EXCLUIR"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={purging}
          />
          <Button
            variant="destructive"
            onClick={handlePurge}
            disabled={purging || confirm !== "EXCLUIR"}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {purging ? "Excluindo..." : "Excluir conta permanentemente"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default PrivacyCenter;

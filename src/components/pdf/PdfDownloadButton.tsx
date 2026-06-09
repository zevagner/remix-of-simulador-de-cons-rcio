import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2, Share2, Image as ImageIcon, Trash2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import { logger } from '@/utils/logger';
import {
  usePdfProfile, buildPdfFilename, processLogoFile,
  type PdfManagerProfile,
} from '@/hooks/usePdfProfile';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

export interface PdfBuildContext extends PdfManagerProfile {
  /** Nome do cliente, fornecido no modal */
  clientName: string;
}

interface PdfDownloadButtonProps {
  /** Recebe contexto completo (cliente + gerente) e retorna o React element do PDF */
  buildPdfElement: (ctx: PdfBuildContext) => React.ReactElement;
  /** Nome curto do módulo, usado no padrão [Modulo]_[Cliente]_[Data].pdf */
  moduleName: string;
  /** Pré-preenche o campo cliente (ex.: vindo do diagnóstico) */
  defaultClientName?: string;
  /** Sufixo opcional adicionado ao módulo no nome do arquivo (ex.: "Grupo123") */
  filenameSuffix?: string;
  disabled?: boolean;
  label?: string;
}

export function PdfDownloadButton({
  buildPdfElement,
  moduleName,
  defaultClientName = '',
  filenameSuffix,
  disabled = false,
  label,
}: PdfDownloadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { profile, save } = usePdfProfile();
  const { user } = useAuth();
  const [clientName, setClientName] = useState(defaultClientName);
  const [draft, setDraft] = useState<PdfManagerProfile>(profile);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleLogoFile = useCallback(async (file: File | undefined | null) => {
    if (!file) return;
    setLogoUploading(true);
    const result = await processLogoFile(file);
    setLogoUploading(false);
    if (result.ok === false) {
      toast({ title: 'Logo inválido', description: result.error, variant: 'destructive' });
      return;
    }
    setDraft((d) => ({ ...d, logoDataUrl: result.dataUrl }));
  }, [toast]);

  const removeLogo = useCallback(() => {
    setDraft((d) => ({ ...d, logoDataUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Sincroniza draft quando o modal abre (perfil pode ter mudado em outra aba)
  useEffect(() => {
    if (isOpen) {
      setDraft({
        ...profile,
        // Pré-preenche email/nome com o usuário logado, se vazio
        managerName: profile.managerName || (user?.nome ?? ''),
        email: profile.email || (user?.email ?? ''),
      });
      setClientName((prev) => prev || defaultClientName);
    }
  }, [isOpen, profile, user, defaultClientName]);

  const handle = useCallback(async (mode: 'download' | 'share', forceRegenerate = false) => {
    // [AUDIT] Fase 1 — Click no botão PDF Premium
    // eslint-disable-next-line no-console
    console.group('[PDF] CLICK');
    // eslint-disable-next-line no-console
    logger.log('mode:', mode, 'forceRegenerate:', forceRegenerate);
    // eslint-disable-next-line no-console
    console.groupEnd();
    setIsGenerating(true);
    setIsOpen(false);
    // Persiste o perfil do gerente
    save(draft);
    const filename = buildPdfFilename(`${moduleName}${filenameSuffix ? `-${filenameSuffix}` : ''}`, clientName);
    try {
      const ctx: PdfBuildContext = { ...draft, clientName };
      const element = buildPdfElement(ctx);
      const { trackEvent } = await import('@/services/analyticsTracker');
      const { logAction } = await import('@/services/auditLog');
      if (mode === 'share') {
        const { sharePdfFromElement } = await import('@/utils/pdfGenerator');
        await sharePdfFromElement({ filename, element, forceRegenerate });
      } else {
        const { generatePdfFromElement } = await import('@/utils/pdfGenerator');
        await generatePdfFromElement({ filename, element, forceRegenerate });
      }
      trackEvent('pdf_generated', { filename, mode, module: moduleName, forceRegenerate });
      logAction({ action: 'generate_pdf', entity: 'pdf', metadata: { filename, mode, module: moduleName, forceRegenerate } });
      if (forceRegenerate) {
        toast({ title: 'PDF regenerado', description: 'Gerado novamente ignorando o cache.' });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        logger.error('Erro ao gerar PDF:', err);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [draft, clientName, save, moduleName, filenameSuffix, buildPdfElement, toast]);

  if (isGenerating) {
    return (
      <Button variant="outline" disabled className="print-hide">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Gerando PDF…
      </Button>
    );
  }

  const setField = (k: keyof PdfManagerProfile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="print-hide gap-1.5 text-xs" disabled={disabled}>
          <FileDown className="h-3.5 w-3.5" />
          {label || 'Gerar PDF'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isMobile ? 'Compartilhar PDF' : 'Gerar PDF'}</DialogTitle>
          <DialogDescription>
            Identifique o cliente e confirme seus dados de gerente. Os seus dados ficam salvos para os próximos PDFs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Cliente */}
          <div className="space-y-2 rounded-md border border-border p-3">
            <div className="text-xs font-semibold text-primary uppercase tracking-wide">Cliente</div>
            <div className="grid gap-2">
              <Label htmlFor="pdf-client">Nome do cliente *</Label>
              <Input
                id="pdf-client"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: João da Silva"
                autoFocus
              />
            </div>
          </div>

          {/* Gerente */}
          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="text-xs font-semibold text-primary uppercase tracking-wide">Seus dados (gerente)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="pdf-mgr">Nome</Label>
                <Input id="pdf-mgr" value={draft.managerName} onChange={setField('managerName')} placeholder="Ex: Maria Souza" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pdf-role">Cargo</Label>
                <Input id="pdf-role" value={draft.managerRole} onChange={setField('managerRole')} placeholder="Ex: Gerente Comercial" />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="pdf-agency">Agência</Label>
                <Input id="pdf-agency" value={draft.agencyName} onChange={setField('agencyName')} placeholder="Ex: Agência Centro 1234" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pdf-phone">Telefone</Label>
                <Input id="pdf-phone" type="tel" inputMode="tel" autoComplete="tel" value={draft.phone} onChange={setField('phone')} placeholder="(00) 0000-0000" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pdf-wpp">WhatsApp</Label>
                <Input id="pdf-wpp" type="tel" inputMode="tel" autoComplete="tel" value={draft.whatsapp} onChange={setField('whatsapp')} placeholder="(00) 90000-0000" />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="pdf-email">E-mail</Label>
                <Input id="pdf-email" type="email" value={draft.email} onChange={setField('email')} placeholder="gerente@caixa.gov.br" />
              </div>
            </div>
          </div>

          {/* Logo (opcional) */}
          <div className="space-y-2 rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-primary uppercase tracking-wide">Logo (opcional)</div>
              {draft.logoDataUrl ? (
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive" onClick={removeLogo}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
                </Button>
              ) : null}
            </div>

            <div className="flex items-start gap-3">
              <div className="space-y-1">
                <div
                  className="flex items-center justify-start rounded border border-dashed border-border bg-card overflow-hidden"
                  style={{ width: '200px', height: '80px' }}
                  aria-label="Visualização no PDF"
                  title="Visualização no PDF (200×80px)"
                >
                  {draft.logoDataUrl ? (
                    <img
                      src={draft.logoDataUrl}
                      alt=""
                      className="block"
                      style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain' }}
                      onError={() => removeLogo()}
                    />
                  ) : (
                    <div className="w-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <p className="text-caption text-muted-foreground text-center">Visualização no PDF</p>
              </div>
              <div className="flex-1 space-y-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    handleLogoFile(e.target.files?.[0]);
                    if (e.target) e.target.value = '';
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={logoUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoUploading ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Processando…</>
                  ) : (
                    <><ImageIcon className="h-3.5 w-3.5 mr-1.5" />{draft.logoDataUrl ? 'Substituir logo' : 'Inserir logo'}</>
                  )}
                </Button>
                <p className="text-caption text-muted-foreground leading-tight">
                  PNG ou JPG, até 500KB. Redimensionado para caber em 200×80px, proporção preservada. Fundo original mantido.
                </p>
              </div>
            </div>

            <p className="text-caption text-muted-foreground italic">
              O uso de logotipos é de responsabilidade do usuário.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {isMobile ? (
            <Button onClick={() => handle('share')} className="w-full" disabled={!clientName.trim()}>
              <Share2 className="h-4 w-4 mr-2" />Compartilhar PDF
            </Button>
          ) : (
            <Button onClick={() => handle('download')} className="w-full sm:w-auto" disabled={!clientName.trim()}>
              <FileDown className="h-4 w-4 mr-2" />Gerar PDF
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => handle(isMobile ? 'share' : 'download', true)}
            className="w-full sm:w-auto"
            disabled={!clientName.trim()}
            title="Ignora o cache e gera uma nova versão"
          >
            <RefreshCw className="h-4 w-4 mr-2" />Gerar novamente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

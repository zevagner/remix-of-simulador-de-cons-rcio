import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AccessRequestModalProps {
  open: boolean;
  onClose: () => void;
}

const INSTRUCTIONS_TEXT = `Assunto: Acesso ao Simulador de Consórcio

Nome completo:
Matrícula:
Unidade/Agência:
Telefone (opcional):`;

export function AccessRequestModal({ open, onClose }: AccessRequestModalProps) {
  const [copied, setCopied] = useState(false);
  

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSTRUCTIONS_TEXT);
      setCopied(true);
      toast({ title: 'Instruções copiadas!' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({ title: 'Não foi possível copiar', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-landing-dark border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-landing-gold" />
            Solicitar Acesso
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Envie uma mensagem no Teams para solicitar sua liberação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <p className="text-sm text-white/80">
              Envie uma mensagem no <strong className="text-landing-gold">Microsoft Teams</strong> para:
            </p>
            <p className="text-lg font-bold text-landing-gold tracking-wide">C112296</p>
          </div>

          <div className="bg-card/5 border border-white/10 rounded-lg p-4">
            <p className="text-xs text-white/50 mb-2 font-medium uppercase tracking-wider">Mensagem sugerida</p>
            <pre className="text-sm text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
              {INSTRUCTIONS_TEXT}
            </pre>
          </div>

          <Button
            onClick={handleCopy}
            variant="outline"
            className="w-full border-landing-gold/40 text-landing-gold hover:bg-landing-gold/10"
          >
            {copied ? (
              <><Check className="mr-2 h-4 w-4" /> Copiado!</>
            ) : (
              <><Copy className="mr-2 h-4 w-4" /> Copiar instruções</>
            )}
          </Button>

          <p className="text-xs text-white/50 text-center leading-relaxed">
            Após o envio da mensagem, o administrador criará sua conta e informará suas credenciais de acesso.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

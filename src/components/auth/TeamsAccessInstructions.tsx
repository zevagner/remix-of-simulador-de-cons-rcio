import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/utils/clipboard';

const TEAMS_MESSAGE = `Olá, gostaria de solicitar acesso ao Simulador de Consórcio.

Nome:
Matrícula:
Unidade:`;

/**
 * Reusable Teams access instructions block.
 * Shows the contact info, suggested message, and a copy button.
 * Used in post-signup screen and when a pending user tries to login.
 */
export function TeamsAccessInstructions() {
  const [copied, setCopied] = useState(false);
  

  const handleCopy = async () => {
    try {
      await copyToClipboard(TEAMS_MESSAGE);
      setCopied(true);
      toast({ title: 'Mensagem copiada!' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({ title: 'Não foi possível copiar', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-3 text-left">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-landing-gold shrink-0" />
        <p className="text-sm text-white/80 font-medium">
          Solicite a liberação via Microsoft Teams
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-white/70">
          Envie uma mensagem para:
        </p>
        <p className="text-lg font-bold text-landing-gold tracking-wide">C112296</p>
      </div>

      <p className="text-xs text-white/60">Com as seguintes informações:</p>

      <div className="bg-card/5 border border-white/10 rounded-lg p-4">
        <pre className="text-sm text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
          {TEAMS_MESSAGE}
        </pre>
      </div>

      <Button
        onClick={handleCopy}
        variant="outline"
        className="w-full border-landing-gold/40 text-landing-gold hover:bg-landing-gold/10"
        type="button"
      >
        {copied ? (
          <><Check className="mr-2 h-4 w-4" /> Copiado!</>
        ) : (
          <><Copy className="mr-2 h-4 w-4" /> Copiar mensagem</>
        )}
      </Button>

      <p className="text-xs text-white/50 text-center leading-relaxed">
        Seu acesso será liberado após validação pelo administrador.
      </p>
    </div>
  );
}

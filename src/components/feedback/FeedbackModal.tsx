import { useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Send } from 'lucide-react';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModule?: string;
}

const MODULE_LABELS: Record<string, string> = {
  simulator: 'Simulador',
  comparator: 'Comparador',
  investment: 'Investimento',
  advanced: 'Op. Estruturadas',
  assemblies: 'Assembleias',
  bids: 'Estudo de Lances',
  summary: 'Resumo',
  help: 'Central de Ajuda',
};

export function FeedbackModal({ open, onOpenChange, currentModule }: FeedbackModalProps) {
  const [type, setType] = useState<'erro' | 'sugestao'>('sugestao');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({ title: 'Descreva sua mensagem', variant: 'destructive' });
      return;
    }
    if (!user) return;

    setLoading(true);
    const { error } = await supabase.from('feedbacks').insert({
      user_id: user.userId,
      type,
      message: message.trim(),
      module: currentModule ?? null,
    });
    setLoading(false);

    if (error) {
      toast({ title: 'Erro ao enviar feedback', variant: 'destructive' });
      return;
    }

    toast({ title: 'Obrigado pelo feedback! 🙏' });
    setMessage('');
    setType('sugestao');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reportar erro / sugestão</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <select
              value={type}
              onChange={e => setType(e.target.value as 'erro' | 'sugestao')}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="erro">🐛 Erro</option>
              <option value="sugestao">💡 Sugestão</option>
            </select>
          </div>

          {currentModule && (
            <div className="text-xs text-muted-foreground">
              Módulo atual: <span className="font-medium text-foreground">{MODULE_LABELS[currentModule] ?? currentModule}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Mensagem *</Label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Descreva o erro encontrado ou sua sugestão..."
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/1000</p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Enviando...' : <><Send className="h-4 w-4 mr-2" /> Enviar Feedback</>}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

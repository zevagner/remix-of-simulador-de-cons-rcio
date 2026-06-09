import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';

interface FeedbackButtonProps {
  currentModule?: string;
}

export function FeedbackButton({ currentModule }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        // - bottom usa safe-area + offset acima do bottom-nav (h~64px) para nunca cobrir conteúdo
        // - tamanho reduzido em telas <360px (h-8/w-8) e padrão (h-10/w-10) acima
        // - opacity baixa em repouso para minimizar obstrução visual
        className="fixed left-3 md:left-auto md:right-6 z-40 bg-primary text-primary-foreground rounded-full p-2 shadow-lg h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center opacity-60 hover:opacity-100 hover:scale-105 active:scale-[0.97] transition-[colors,box-shadow,transform] duration-150"
        style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
        title="Reportar erro / sugestão"
        aria-label="Reportar erro ou sugestão"
      >
        <MessageSquarePlus className="h-4 w-4" />
      </button>

      <FeedbackModal open={open} onOpenChange={setOpen} currentModule={currentModule} />
    </>
  );
}

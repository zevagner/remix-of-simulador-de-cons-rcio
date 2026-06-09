import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <WifiOff className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Modo Offline</h2>
        <p className="text-muted-foreground text-sm">
          Alguns recursos podem não funcionar sem conexão com a internet.
          O simulador continua disponível se já estiver carregado.
        </p>
      </div>
    </div>
  );
}

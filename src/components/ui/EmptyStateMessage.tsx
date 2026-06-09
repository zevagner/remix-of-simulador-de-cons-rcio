import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmptyStateMessageProps {
  title?: string;
  message: string;
  className?: string;
}

export function EmptyStateMessage({ 
  title = 'Preencha os dados', 
  message, 
  className = '' 
}: EmptyStateMessageProps) {
  return (
    <Alert className={`border-warning/30 bg-warning/10 ${className}`}>
      <AlertCircle className="h-4 w-4 text-warning" />
      <AlertDescription className="text-foreground">
        <span className="font-medium">{title}:</span> {message}
      </AlertDescription>
    </Alert>
  );
}

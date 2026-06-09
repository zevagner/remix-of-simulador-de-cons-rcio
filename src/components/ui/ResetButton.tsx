import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ResetButtonProps {
  onReset: () => void;
  moduleName?: string;
}

export function ResetButton({ onReset, moduleName = 'esta simulação' }: ResetButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleReset = () => {
    onReset();
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="print-hide">
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resetar Simulação</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja resetar os dados de {moduleName}? Os valores atuais serão perdidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset}>
            Confirmar Reset
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import { createContext, useContext } from 'react';

/**
 * Sinaliza que um submódulo está sendo renderizado dentro de um shell pai
 * (ex: AnalysisModule), que já fornece o ModuleHeader.
 * Quando true, o `ModuleHeader` interno se oculta para evitar duplicação visual.
 */
export const ModuleShellContext = createContext<{ suppressHeader: boolean }>({
  suppressHeader: false,
});

export function useModuleShell() {
  return useContext(ModuleShellContext);
}

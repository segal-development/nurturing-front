import { Loader2 } from 'lucide-react';

/**
 * Componente de loading para lazy-loaded pages.
 * Se muestra mientras se carga el código de una página.
 */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-segal-blue dark:text-gray-300" />
        <p className="text-segal-dark/60 dark:text-gray-400">Cargando...</p>
      </div>
    </div>
  );
}

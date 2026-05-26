/**
 * ExportSysgalButton
 *
 * Botón para descargar el Excel (CSV) de SYSGAL para el rango de fechas seleccionado.
 * El CSV lo genera la VM (única whitelisteada en SYSGAL) de forma asincrónica:
 *   click -> POST (encola job en la VM) -> poll del estado -> descarga.
 */

import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { metricasService } from '@/api/metricas.service';

interface ExportSysgalButtonProps {
  tipo: 'contratos' | 'clientes-ingreso';
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
  label: string; // ej. "Contratos Nuevos"
  className?: string;
}

type Estado = 'idle' | 'generando' | 'listo' | 'error';

const POLL_MS = 3000;
const MAX_INTENTOS = 25; // ~75s

export function ExportSysgalButton({ tipo, desde, hasta, label, className = '' }: ExportSysgalButtonProps) {
  const [estado, setEstado] = useState<Estado>('idle');
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intentosRef = useRef(0);

  const limpiar = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Reset cuando cambia el rango o el tipo (otro flujo / otras fechas)
  useEffect(() => {
    limpiar();
    setEstado('idle');
    setCount(null);
    setError(null);
    tokenRef.current = null;
    intentosRef.current = 0;
  }, [tipo, desde, hasta]);

  // Limpiar al desmontar
  useEffect(() => () => limpiar(), []);

  const filename = `${tipo}-${desde}_al_${hasta}.csv`;

  const generar = async () => {
    setEstado('generando');
    setError(null);
    intentosRef.current = 0;
    try {
      tokenRef.current = await metricasService.createExport(tipo, desde, hasta);

      pollRef.current = setInterval(async () => {
        intentosRef.current += 1;
        if (intentosRef.current > MAX_INTENTOS) {
          limpiar();
          setError('Tardó demasiado, reintentá');
          setEstado('error');
          return;
        }
        try {
          const s = await metricasService.getExportStatus(tokenRef.current as string);
          if (s.estado === 'listo') {
            limpiar();
            setCount(s.count ?? null);
            setEstado('listo');
          } else if (s.estado === 'error') {
            limpiar();
            setError(s.error ?? 'Error generando el export');
            setEstado('error');
          }
        } catch {
          /* errores transitorios de polling: ignorar y reintentar */
        }
      }, POLL_MS);
    } catch {
      setError('No se pudo iniciar la generación');
      setEstado('error');
    }
  };

  const descargar = async () => {
    if (!tokenRef.current) return;
    try {
      await metricasService.downloadExport(tokenRef.current, filename);
    } catch {
      setError('No se pudo descargar');
      setEstado('error');
    }
  };

  if (estado === 'generando') {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando desde SYSGAL…
      </Button>
    );
  }

  if (estado === 'listo') {
    return (
      <Button variant="default" size="sm" onClick={descargar} className={className}>
        <Download className="mr-2 h-4 w-4" /> Descargar Excel ({count ?? '?'} registros)
      </Button>
    );
  }

  if (estado === 'error') {
    return (
      <Button variant="outline" size="sm" onClick={generar} className={className}>
        <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" /> {error} — reintentar
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={generar} className={className}>
      <Download className="mr-2 h-4 w-4" /> Descargar Excel — {label} (rango seleccionado)
    </Button>
  );
}

export default ExportSysgalButton;

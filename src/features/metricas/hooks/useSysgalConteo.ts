/**
 * useSysgalConteo
 *
 * Encapsula la consulta ASÍNCRONA del dato oficial de SYSGAL para un rango (contratos nuevos o
 * clientes por fecha de ingreso). La VM (única whitelisteada en SYSGAL) procesa el pedido y este
 * hook hace polling hasta tener el conteo. Reutilizable por la tarjeta y por el embudo.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { metricasService } from '@/api/metricas.service';

export type SysgalConteoEstado = 'generando' | 'listo' | 'error';

const POLL_MS = 3000;
const MAX_INTENTOS = 25; // ~75s

export interface SysgalRechazado {
  rut: string;
  nombre: string;
  email: string;
  telefono: string;
  razones: string[];
}

export interface UseSysgalConteo {
  estado: SysgalConteoEstado;
  count: number | null;
  rechazados: SysgalRechazado[];
  error: string | null;
  descargar: (nombreArchivo?: string) => Promise<void>;
  reintentar: () => void;
}

export function useSysgalConteo(
  tipo: 'contratos' | 'clientes-ingreso',
  desde: string,
  hasta: string,
): UseSysgalConteo {
  const [estado, setEstado] = useState<SysgalConteoEstado>('generando');
  const [count, setCount] = useState<number | null>(null);
  const [rechazados, setRechazados] = useState<SysgalRechazado[]>([]);
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

  const arrancar = useCallback(() => {
    limpiar();
    setEstado('generando');
    setCount(null);
    setRechazados([]);
    setError(null);
    intentosRef.current = 0;
    let vivo = true;

    metricasService
      .createExport(tipo, desde, hasta)
      .then((token) => {
        if (!vivo) return;
        tokenRef.current = token;
        pollRef.current = setInterval(async () => {
          intentosRef.current += 1;
          if (intentosRef.current > MAX_INTENTOS) {
            limpiar();
            setError('Tardó demasiado, reintente');
            setEstado('error');
            return;
          }
          try {
            const s = await metricasService.getExportStatus(token);
            if (s.estado === 'listo') {
              limpiar();
              setCount(s.count ?? null);
              setRechazados(s.rechazados ?? []);
              setEstado('listo');
            } else if (s.estado === 'error') {
              limpiar();
              setError(s.error ?? 'Error consultando SYSGAL');
              setEstado('error');
            }
          } catch {
            /* errores transitorios de polling: ignorar y reintentar */
          }
        }, POLL_MS);
      })
      .catch(() => {
        if (vivo) {
          setError('No se pudo consultar SYSGAL');
          setEstado('error');
        }
      });

    return () => {
      vivo = false;
      limpiar();
    };
  }, [tipo, desde, hasta]);

  useEffect(() => {
    const cancelar = arrancar();
    return cancelar;
  }, [arrancar]);

  const descargar = useCallback(
    async (nombreArchivo?: string) => {
      if (!tokenRef.current) return;
      await metricasService.downloadExport(
        tokenRef.current,
        nombreArchivo ?? `${tipo}-${desde}_al_${hasta}.csv`,
      );
    },
    [tipo, desde, hasta],
  );

  return { estado, count, rechazados, error, descargar, reintentar: arrancar };
}

/**
 * SysgalRangoCard
 *
 * Muestra, como NÚMERO visible, lo que SYSGAL reporta para el rango de fechas seleccionado
 * (contratos nuevos u "clientes por fecha de ingreso"), y permite descargar el Excel.
 *
 * El dato lo trae la VM (única whitelisteada en SYSGAL) de forma asincrónica: al cambiar el
 * rango, la tarjeta encola el pedido, hace polling y muestra el conteo cuando está listo.
 * No es instantáneo (~10s) porque el panel no puede pegarle a SYSGAL directo.
 */

import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { metricasService } from '@/api/metricas.service';
import { formatNumber } from '../utils/formatters';

interface SysgalRangoCardProps {
  tipo: 'contratos' | 'clientes-ingreso';
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
  label: string; // ej. "Contratos Nuevos"
  nota?: string; // aclaración contextual (ej. el corrimiento de 3 días del onboarding)
  className?: string;
}

type Estado = 'generando' | 'listo' | 'error';

const POLL_MS = 3000;
const MAX_INTENTOS = 25; // ~75s

function formatFecha(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function SysgalRangoCard({ tipo, desde, hasta, label, nota, className = '' }: SysgalRangoCardProps) {
  const esUnDia = desde === hasta;
  const [estado, setEstado] = useState<Estado>('generando');
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

  // Arranca la consulta a SYSGAL para el rango actual. Devuelve un cleanup que la cancela.
  const arrancar = () => {
    limpiar();
    setEstado('generando');
    setCount(null);
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
            setError('Tardó demasiado, reintentá');
            setEstado('error');
            return;
          }
          try {
            const s = await metricasService.getExportStatus(token);
            if (s.estado === 'listo') {
              limpiar();
              setCount(s.count ?? null);
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
  };

  // Re-consulta cuando cambia el tipo (flujo) o el rango de fechas.
  useEffect(() => {
    const cancelar = arrancar();
    return cancelar;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, desde, hasta]);

  const descargar = async () => {
    if (!tokenRef.current) return;
    try {
      await metricasService.downloadExport(tokenRef.current, `${tipo}-${desde}_al_${hasta}.csv`);
    } catch {
      setError('No se pudo descargar el Excel');
      setEstado('error');
    }
  };

  const unidad = tipo === 'contratos' ? 'contratos nuevos' : 'clientes por fecha de ingreso';

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-segal-blue dark:text-segal-turquoise" />
          <CardTitle>SYSGAL — {label}</CardTitle>
        </div>
        <CardDescription>
          {esUnDia ? (
            <>Dato oficial de SYSGAL · {formatFecha(desde)}</>
          ) : (
            <>
              Dato oficial de SYSGAL para el rango · del {formatFecha(desde)} al {formatFecha(hasta)}
            </>
          )}
          {nota && (
            <span className="mt-1 block font-medium text-segal-blue dark:text-segal-turquoise">
              {nota}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {estado === 'generando' && (
          <div className="flex h-[72px] items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Consultando SYSGAL…
          </div>
        )}

        {estado === 'listo' && (
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-4xl font-bold leading-none">{formatNumber(count ?? 0)}</span>
              <span className="mt-1 text-sm text-muted-foreground">
                {unidad} {esUnDia ? 'ese día' : 'en este rango'}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={descargar}>
              <Download className="mr-2 h-4 w-4" /> Descargar Excel
            </Button>
          </div>
        )}

        {estado === 'error' && (
          <div className="flex h-[72px] items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" /> {error}
            <Button variant="ghost" size="sm" onClick={arrancar}>
              Reintentar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SysgalRangoCard;

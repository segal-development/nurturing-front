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
  /**
   * Onboarding: rango de CONTACTO (lo que el usuario eligió). Cuando viene, la tarjeta muestra
   * esas fechas como "contactados" y aclara que los ingresos consultados (desde/hasta) son 3
   * días antes. Para contratos no se pasa (no hay corrimiento).
   */
  contacto?: { desde: string; hasta: string };
  className?: string;
}

type Estado = 'generando' | 'listo' | 'error';

const POLL_MS = 3000;
const MAX_INTENTOS = 25; // ~75s

function formatFecha(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function rangoTexto(desde: string, hasta: string): string {
  return desde === hasta
    ? `el ${formatFecha(desde)}`
    : `del ${formatFecha(desde)} al ${formatFecha(hasta)}`;
}

export function SysgalRangoCard({ tipo, desde, hasta, label, contacto, className = '' }: SysgalRangoCardProps) {
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
            setError('Tardó demasiado, reintente');
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

  const unidad = tipo === 'contratos' ? 'contratos nuevos' : 'clientes';
  // Subtítulo del número: onboarding muestra las fechas de CONTACTO (lo que se eligió);
  // contratos muestra el rango consultado.
  const subtitulo = contacto
    ? `clientes contactados ${rangoTexto(contacto.desde, contacto.hasta)}`
    : `${unidad} ${rangoTexto(desde, hasta)}`;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-segal-blue dark:text-segal-turquoise" />
          <CardTitle>SYSGAL — {label}</CardTitle>
        </div>
        <CardDescription>Dato oficial de SYSGAL para el rango seleccionado.</CardDescription>
      </CardHeader>
      <CardContent>
        {estado === 'generando' && (
          <div className="flex h-[72px] items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Consultando SYSGAL…
          </div>
        )}

        {estado === 'listo' && (
          <div>
            <div className="flex items-end justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-4xl font-bold leading-none">{formatNumber(count ?? 0)}</span>
                <span className="mt-1 text-sm text-muted-foreground">{subtitulo}</span>
              </div>
              <Button variant="outline" size="sm" onClick={descargar}>
                <Download className="mr-2 h-4 w-4" /> Descargar Excel
              </Button>
            </div>
            {contacto && (
              <p className="mt-3 text-xs text-muted-foreground">
                Son los que ingresaron {rangoTexto(desde, hasta)} — la campaña les escribe a los 3 días.
              </p>
            )}
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

/**
 * EmbudoCampana
 *
 * Vista simple y consistente de la campaña como EMBUDO: cada número sale del anterior.
 *   SYSGAL reportó → Entraron al flujo → Recibieron el email → Abrieron
 * El dato de SYSGAL se trae async (hook useSysgalConteo); el resto viene del dashboard.
 * Las diferencias entre pasos se explican abajo de cada uno, así no parece inconsistente.
 */

import type { ReactNode } from 'react';
import { ArrowRight, Download, Loader2, AlertTriangle, FileText, UserPlus, MailCheck, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSysgalConteo } from '../hooks/useSysgalConteo';
import { formatNumber } from '../utils/formatters';

interface EmbudoCampanaProps {
  tipo: 'contratos' | 'clientes-ingreso';
  desde: string; // YYYY-MM-DD (rango consultado a SYSGAL)
  hasta: string;
  /** Onboarding: rango de contacto elegido (para la aclaración del delay de 3 días). */
  contacto?: { desde: string; hasta: string };
  esOnboarding: boolean;
  incorporados: number; // entraron al flujo en el período
  recibieron: number; // envíos exitosos (entregados) del período
  aperturasUnicas: number; // aperturas únicas de esos envíos
  tasaApertura: number; // %
  conProblemas: number; // prospectos con dato que impide el envío
  className?: string;
}

function Paso({
  icon,
  label,
  valor,
  nota,
}: {
  icon: ReactNode;
  label: string;
  valor: ReactNode;
  nota?: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 px-2 text-center">
      <span className="text-segal-blue dark:text-segal-turquoise">{icon}</span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-3xl font-bold leading-none">{valor}</span>
      {nota ? <span className="text-xs text-muted-foreground">{nota}</span> : <span className="text-xs">&nbsp;</span>}
    </div>
  );
}

function Flecha() {
  return <ArrowRight className="hidden h-5 w-5 shrink-0 text-muted-foreground/50 sm:block" />;
}

export function EmbudoCampana({
  tipo,
  desde,
  hasta,
  contacto,
  esOnboarding,
  incorporados,
  recibieron,
  aperturasUnicas,
  tasaApertura,
  conProblemas,
  className = '',
}: EmbudoCampanaProps) {
  const { estado, count, error, descargar, reintentar } = useSysgalConteo(tipo, desde, hasta);
  const unidad = tipo === 'contratos' ? 'contratos nuevos' : 'clientes';

  // Paso 1 (SYSGAL): número async.
  const valorSysgal: ReactNode =
    estado === 'listo' ? (
      formatNumber(count ?? 0)
    ) : estado === 'error' ? (
      <AlertTriangle className="h-6 w-6 text-amber-500" />
    ) : (
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    );

  // Nota del paso 2: cuánto del total de SYSGAL entró (la diferencia, si la hay).
  const sinEntrar = estado === 'listo' && count !== null ? Math.max(count - incorporados, 0) : 0;
  const notaEntraron =
    estado !== 'listo' || count === null
      ? null
      : sinEntrar === 0
        ? 'entraron todos'
        : `${formatNumber(sinEntrar)} aún no`;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Resumen de la campaña</CardTitle>
            <CardDescription>
              Cómo se lee de izquierda a derecha: cada número sale del anterior.
            </CardDescription>
          </div>
          {estado === 'listo' && (
            <Button variant="outline" size="sm" onClick={() => descargar()}>
              <Download className="mr-2 h-4 w-4" /> Excel SYSGAL
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Paso
            icon={<FileText className="h-5 w-5" />}
            label="SYSGAL reportó"
            valor={valorSysgal}
            nota={estado === 'error' ? 'no se pudo consultar' : unidad}
          />
          <Flecha />
          <Paso
            icon={<UserPlus className="h-5 w-5" />}
            label="Entraron al flujo"
            valor={formatNumber(incorporados)}
            nota={notaEntraron}
          />
          <Flecha />
          <Paso
            icon={<MailCheck className="h-5 w-5" />}
            label="Recibieron el email"
            valor={formatNumber(recibieron)}
            nota={conProblemas > 0 ? `${formatNumber(conProblemas)} con dato malo` : null}
          />
          <Flecha />
          <Paso
            icon={<Eye className="h-5 w-5" />}
            label="Abrieron"
            valor={formatNumber(aperturasUnicas)}
            nota={`${tasaApertura}% de apertura`}
          />
        </div>

        {estado === 'error' && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" /> {error}
            <Button variant="ghost" size="sm" onClick={reintentar}>
              Reintentar
            </Button>
          </div>
        )}

        {esOnboarding && contacto && (
          <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
            La campaña le escribe al cliente <strong>3 días después de ingresar</strong>. Por eso los
            recién incorporados todavía pueden no figurar en "Recibieron" — el envío está programado.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default EmbudoCampana;

/**
 * EmbudoCampana
 *
 * Vista simple y consistente de la campaña como EMBUDO: cada número sale del anterior.
 *   SYSGAL reportó → Entraron al flujo → Recibieron el email → Abrieron
 * El dato de SYSGAL se trae async (hook useSysgalConteo); el resto viene del dashboard.
 * Las diferencias entre pasos se explican abajo de cada uno, así no parece inconsistente.
 */

import type { ReactNode } from 'react';
import { ArrowRight, Download, Loader2, AlertTriangle, FileText, UserPlus, MailCheck, MessageSquare, Eye } from 'lucide-react';
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
  incorporados: number; // cohorte: entraron al flujo en la ventana
  recibieron: number; // de esa cohorte, cuántos recibieron por cualquier canal
  recibieronEmail: number; // de esa cohorte, cuántos recibieron el EMAIL
  recibieronSms: number; // de esa cohorte, cuántos recibieron el SMS
  aperturasUnicas: number; // de esa cohorte, cuántos abrieron
  tasaApertura: number; // % (abrieron / recibieron de la cohorte)
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
  recibieronEmail,
  recibieronSms,
  aperturasUnicas,
  tasaApertura,
  className = '',
}: EmbudoCampanaProps) {
  const { estado, count, rechazados, error, descargar, reintentar } = useSysgalConteo(tipo, desde, hasta);
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

  // Nota del paso 2: cuántos NO entraron al flujo. Si tenemos detalle (rechazados con razón),
  // pointea al usuario al detalle abajo. Si no, fallback genérico.
  const sinEntrar = estado === 'listo' && count !== null ? Math.max(count - incorporados, 0) : 0;
  const notaEntraron =
    estado !== 'listo' || count === null
      ? null
      : sinEntrar === 0
        ? 'entraron todos'
        : rechazados.length > 0
          ? `${formatNumber(rechazados.length)} no entraron — ver abajo`
          : `${formatNumber(sinEntrar)} aún no`;

  // ¿El flujo usa SMS además de email? Si llegó al menos un SMS, mostramos los dos canales
  // por separado para que un problema de un canal (ej. emails caídos por Athena) no quede
  // tapado por el éxito del otro. Si es email-only, mantenemos el paso único.
  const usaSms = recibieronSms > 0;

  // Caída por canal: los que entraron pero todavía no recibieron por ese canal.
  const sinRecibirEmail = Math.max(incorporados - recibieronEmail, 0);
  const sinRecibirSms = Math.max(incorporados - recibieronSms, 0);
  const notaEmail = sinRecibirEmail > 0 ? `${formatNumber(sinRecibirEmail)} sin recibir aún` : 'todos';
  const notaSms = sinRecibirSms > 0 ? `${formatNumber(sinRecibirSms)} sin recibir aún` : 'todos';

  // Email-only: caída total contra "recibieron" (cualquier canal, == email aquí).
  const sinRecibir = Math.max(incorporados - recibieron, 0);
  const notaRecibieron = sinRecibir > 0 ? `${formatNumber(sinRecibir)} sin recibir aún` : null;

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
          {usaSms ? (
            <>
              <Paso
                icon={<MailCheck className="h-5 w-5" />}
                label="Recibieron email"
                valor={formatNumber(recibieronEmail)}
                nota={notaEmail}
              />
              <Flecha />
              <Paso
                icon={<MessageSquare className="h-5 w-5" />}
                label="Recibieron SMS"
                valor={formatNumber(recibieronSms)}
                nota={notaSms}
              />
            </>
          ) : (
            <Paso
              icon={<MailCheck className="h-5 w-5" />}
              label="Recibieron el email"
              valor={formatNumber(recibieron)}
              nota={notaRecibieron}
            />
          )}
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

        {/* Por qué SYSGAL los reportó pero NO entraron al flujo. Pueden ser datos malos en
            SYSGAL (corregir allá) o situación legítima (ej. ya estaba en otro flujo activo). */}
        {rechazados.length > 0 && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {rechazados.length} {rechazados.length === 1 ? 'cliente' : 'clientes'} de SYSGAL
                no entraron al flujo — detalle abajo
              </span>
            </div>
            <p className="mb-2 text-xs text-amber-800 dark:text-amber-300">
              Las razones marcadas como "datos malos en SYSGAL" hay que corregirlas allá. Las
              marcadas "ya en otro flujo" son esperadas (no se duplica el contacto).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-amber-200 text-left text-amber-900 dark:border-amber-900/50 dark:text-amber-200">
                    <th className="py-1 pr-3 font-medium">RUT</th>
                    <th className="py-1 pr-3 font-medium">Nombre</th>
                    <th className="py-1 pr-3 font-medium">Email</th>
                    <th className="py-1 pr-3 font-medium">Teléfono</th>
                    <th className="py-1 pr-3 font-medium">Por qué no entró</th>
                  </tr>
                </thead>
                <tbody>
                  {rechazados.map((r) => (
                    <tr key={r.rut + r.nombre} className="border-b border-amber-100 last:border-0 dark:border-amber-900/30">
                      <td className="py-1 pr-3 font-mono text-amber-950 dark:text-amber-100">{r.rut || '—'}</td>
                      <td className="py-1 pr-3 text-amber-950 dark:text-amber-100">{r.nombre || '—'}</td>
                      <td className="py-1 pr-3 text-amber-950 dark:text-amber-100">{r.email || '—'}</td>
                      <td className="py-1 pr-3 text-amber-950 dark:text-amber-100">{r.telefono || '—'}</td>
                      <td className="py-1 pr-3 text-amber-800 dark:text-amber-300">
                        {r.razones
                          .map((rz) =>
                            rz === 'sin_email'
                              ? 'sin email (corregir en SYSGAL)'
                              : rz === 'email_invalido'
                                ? 'email inválido (corregir en SYSGAL)'
                                : rz === 'sin_telefono'
                                  ? 'sin teléfono'
                                  : rz === 'sin_nombre'
                                    ? 'sin nombre (corregir en SYSGAL)'
                                    : rz === 'en_otro_flujo_activo'
                                      ? 'ya en otro flujo activo'
                                      : rz === 'no_se_creo'
                                        ? 'pendiente próximo sync horario'
                                        : rz === 'no_asignado'
                                          ? 'pendiente asignación (próximo sync horario)'
                                          : rz,
                          )
                          .join(' + ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {esOnboarding && contacto && (
          <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
            La campaña le escribe al cliente <strong>exactamente 3 días después de ingresar</strong>.
            Por eso "SYSGAL reportó" muestra los ingresos de <strong>ese día (hoy − 3)</strong>; si
            ese día no ingresó nadie, da 0. Los números del embudo son <strong>de toda esa cohorte
            </strong>: de los X que SYSGAL reportó, cuántos entraron al flujo y cuántos recibieron
            el email (en cualquier momento, no solo hoy).
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default EmbudoCampana;

/**
 * EmbudosPorEtapa
 *
 * Tabla compacta — una fila por etapa del flujo Clientes por Fecha Ingreso (5 etapas).
 * Cada fila muestra SYSGAL, Entraron, Recibieron, Abrieron + tasas. Expandible: al hacer
 * click se muestra el detalle de "quiénes no entraron" (rechazados de SYSGAL) usando el
 * mismo job que el embudo principal.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSysgalConteo } from '../hooks/useSysgalConteo';
import { formatNumber } from '../utils/formatters';
import type { EmbudoEtapaMetric } from '@/types/metricas';

interface EmbudosPorEtapaProps {
  etapas: EmbudoEtapaMetric[];
  className?: string;
}

function razonTexto(rz: string): string {
  switch (rz) {
    case 'sin_email': return 'sin email (corregir en SYSGAL)';
    case 'email_invalido': return 'email inválido (corregir en SYSGAL)';
    case 'sin_telefono': return 'sin teléfono';
    case 'sin_nombre': return 'sin nombre (corregir en SYSGAL)';
    case 'en_otro_flujo_activo': return 'ya en otro flujo activo';
    case 'no_se_creo': return 'pendiente próximo sync horario';
    case 'no_asignado': return 'pendiente asignación (próximo sync horario)';
    default: return rz;
  }
}

function EtapaRow({ etapa }: { etapa: EmbudoEtapaMetric }) {
  const [expanded, setExpanded] = useState(false);
  const { estado, count, rechazados } = useSysgalConteo('clientes-ingreso', etapa.desde_ingreso, etapa.hasta_ingreso);

  const sysgalCell =
    estado === 'listo' ? formatNumber(count ?? 0) :
    estado === 'error' ? <AlertTriangle className="inline h-4 w-4 text-amber-500" /> :
    <Loader2 className="inline h-4 w-4 animate-spin text-muted-foreground" />;

  const tieneRechazados = estado === 'listo' && rechazados.length > 0;
  const labelCorto = etapa.label.replace('Clientes Ingreso: ', '').replace(/ de ingresar.*$/, '');

  return (
    <>
      <tr
        className={`border-b transition-colors ${tieneRechazados ? 'cursor-pointer hover:bg-muted/50' : ''}`}
        onClick={() => tieneRechazados && setExpanded((v) => !v)}
      >
        <td className="py-2 pl-3 pr-2 text-sm">
          <div className="flex items-center gap-2">
            {tieneRechazados ? (
              expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : <span className="w-4" />}
            <div>
              <div className="font-medium">{labelCorto}</div>
              <div className="text-xs text-muted-foreground">+{etapa.offset_dias}d · ingreso {etapa.desde_ingreso}</div>
            </div>
          </div>
        </td>
        <td className="px-2 py-2 text-center text-sm font-medium">{sysgalCell}</td>
        <td className="px-2 py-2 text-center text-sm font-medium">{formatNumber(etapa.entraron)}</td>
        <td className="px-2 py-2 text-center text-sm font-medium">{formatNumber(etapa.recibieron)}</td>
        <td className="px-2 py-2 text-center text-sm font-medium">{formatNumber(etapa.abrieron)}</td>
        <td className="px-2 py-2 text-center text-sm">{etapa.tasa_entrega}%</td>
        <td className="px-2 py-2 text-center text-sm">{etapa.tasa_apertura}%</td>
        <td className="px-2 py-2 pr-3 text-center text-sm">{etapa.tasa_ctr}%</td>
      </tr>

      {expanded && tieneRechazados && (
        <tr className="border-b bg-amber-50/50 dark:bg-amber-950/10">
          <td colSpan={8} className="px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              {rechazados.length} de SYSGAL no entraron a esta etapa
            </div>
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
                        {r.razones.map(razonTexto).join(' + ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function EmbudosPorEtapa({ etapas, className = '' }: EmbudosPorEtapaProps) {
  if (!etapas || etapas.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Embudo por etapa</CardTitle>
        <CardDescription>
          Una fila por cada email del drip. Click en la fila para ver quiénes de SYSGAL no entraron
          a esa etapa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pl-3 pr-2">Etapa</th>
                <th className="px-2 py-2 text-center">SYSGAL</th>
                <th className="px-2 py-2 text-center">Entraron</th>
                <th className="px-2 py-2 text-center">Recibieron</th>
                <th className="px-2 py-2 text-center">Abrieron</th>
                <th className="px-2 py-2 text-center">% Entrega</th>
                <th className="px-2 py-2 text-center">% Apertura</th>
                <th className="px-2 py-2 pr-3 text-center">CTR</th>
              </tr>
            </thead>
            <tbody>
              {etapas.map((etapa) => (
                <EtapaRow key={etapa.stage_id} etapa={etapa} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="space-y-1">
            <p>
              <strong>¿Por qué SYSGAL &gt; Entraron en cohortes de hace más de una semana?</strong>
            </p>
            <p>
              La diferencia corresponde a <strong>duplicados históricos</strong> de prospectos en la base
              de datos (mismo RUT cargado más de una vez en sincronizaciones anteriores). Cuando el sync
              encuentra un RUT que ya existe, no lo vuelve a insertar — por eso esos clientes aparecen en
              SYSGAL pero no como nuevos en el flujo. Es deuda técnica conocida con plan de dedup en
              curso; no refleja prospectos perdidos por el sistema actual.
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              Las cohortes recientes (+3d, +4d) sí cuadran 1:1 porque el sync con UPSERT por RUT está
              vigente desde el 28/05.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EmbudosPorEtapa;

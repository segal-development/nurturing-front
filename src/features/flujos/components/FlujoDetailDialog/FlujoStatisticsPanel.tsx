/**
 * Panel de estadísticas completas para un flujo
 * 
 * Muestra:
 * 1. Resumen de rendimiento (tasas y costos)
 * 2. Funnel de conversión visual
 * 3. Rendimiento por etapa con barras de progreso
 */

/** Threshold above which failure rate triggers a warning alert (percentage) */
const FAILURE_RATE_WARNING_THRESHOLD = 5

import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Mail, 
  MessageSquare, 
  DollarSign,
  Users,
  Send,
  MousePointerClick,
  Eye,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { useFlujoAnalytics } from '../../hooks/useFlujoAnalytics'

interface FlujoStatisticsPanelProps {
  flujoId: number | undefined
}

/**
 * Metric card component for summary stats
 */
function MetricCard({ 
  label, 
  value, 
  suffix = '',
  icon: Icon,
  color = 'blue',
  subtext,
}: { 
  label: string
  value: string | number
  suffix?: string
  icon: React.ElementType
  color?: 'blue' | 'green' | 'red' | 'purple' | 'amber'
  subtext?: string
}) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100/50 border-blue-200 text-blue-700',
    green: 'from-emerald-50 to-emerald-100/50 border-emerald-200 text-emerald-700',
    red: 'from-red-50 to-red-100/50 border-red-200 text-red-700',
    purple: 'from-purple-50 to-purple-100/50 border-purple-200 text-purple-700',
    amber: 'from-amber-50 to-amber-100/50 border-amber-200 text-amber-700',
  }

  const iconColorClasses = {
    blue: 'text-blue-500',
    green: 'text-emerald-500',
    red: 'text-red-500',
    purple: 'text-purple-500',
    amber: 'text-amber-500',
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${iconColorClasses[color]}`} />
        <p className="text-xs font-semibold opacity-80">{label}</p>
      </div>
      <p className="text-2xl font-bold">
        {value}{suffix}
      </p>
      {subtext && (
        <p className="text-xs opacity-60 mt-1">{subtext}</p>
      )}
    </div>
  )
}

/**
 * Funnel step component
 */
function FunnelStep({
  label,
  value,
  rate,
  isLast = false,
  color,
}: {
  label: string
  value: number
  rate?: number
  isLast?: boolean
  color: string
}) {
  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div className={`w-24 h-16 ${color} rounded-lg flex flex-col items-center justify-center text-white shadow-md`}>
          <span className="text-lg font-bold">{value.toLocaleString()}</span>
          <span className="text-xs opacity-90">{label}</span>
        </div>
        {rate !== undefined && (
          <span className="text-xs text-segal-dark/60 mt-1 font-medium">{rate}%</span>
        )}
      </div>
      {!isLast && (
        <div className="flex items-center mx-2">
          <div className="w-8 h-0.5 bg-segal-blue/30" />
          <TrendingDown className="h-4 w-4 text-segal-blue/40 -ml-1" />
        </div>
      )}
    </div>
  )
}

/**
 * Stage performance row with progress bar
 */
function StageRow({
  label,
  enviados,
  abiertos,
  clickeados,
  tasaApertura,
  tasaClick,
  tipoMensaje,
  maxEnviados,
}: {
  label: string
  enviados: number
  abiertos: number | null
  clickeados: number | null
  tasaApertura: number | null
  tasaClick: number | null
  tipoMensaje: 'email' | 'sms' | 'ambos'
  maxEnviados: number
}) {
  const barWidth = maxEnviados > 0 ? (enviados / maxEnviados) * 100 : 0
  const isEmail = tipoMensaje === 'email' || tipoMensaje === 'ambos'

  return (
    <div className="bg-white rounded-lg border border-segal-blue/10 p-4 hover:border-segal-blue/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {tipoMensaje === 'sms' ? (
            <MessageSquare className="h-4 w-4 text-green-500" />
          ) : tipoMensaje === 'ambos' ? (
            <div className="flex gap-0.5">
              <Mail className="h-3 w-3 text-blue-500" />
              <MessageSquare className="h-3 w-3 text-green-500" />
            </div>
          ) : (
            <Mail className="h-4 w-4 text-blue-500" />
          )}
          <span className="font-medium text-segal-dark">{label}</span>
        </div>
        <span className="text-sm font-semibold text-segal-blue">{enviados.toLocaleString()} enviados</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-segal-blue/10 rounded-full h-2 mb-3">
        <div 
          className="bg-gradient-to-r from-segal-blue to-segal-blue/70 h-2 rounded-full transition-all duration-500"
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Stats row */}
      {isEmail && (
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-blue-500" />
            <span className="text-segal-dark/70">
              {abiertos?.toLocaleString() ?? 0} abiertos
              {tasaApertura !== null && (
                <span className="text-blue-600 font-semibold ml-1">({tasaApertura}%)</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MousePointerClick className="h-3 w-3 text-purple-500" />
            <span className="text-segal-dark/70">
              {clickeados?.toLocaleString() ?? 0} clicks
              {tasaClick !== null && (
                <span className="text-purple-600 font-semibold ml-1">({tasaClick}%)</span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export function FlujoStatisticsPanel({ flujoId }: FlujoStatisticsPanelProps) {
  const { data: analytics, isLoading, error } = useFlujoAnalytics(flujoId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-segal-blue" />
        <span className="ml-3 text-segal-dark/60">Cargando estadísticas...</span>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
        <p className="text-red-700 font-medium">Error al cargar estadísticas</p>
        <p className="text-sm text-red-600/70 mt-1">Intenta recargar la página</p>
      </div>
    )
  }

  const { resumen, funnel, etapas, totales } = analytics

  // Check if there's any data
  const hasData = totales.envios.total > 0 || totales.prospectos.total > 0

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-segal-blue/5 rounded-lg border border-segal-blue/10">
        <BarChart3 className="h-12 w-12 text-segal-blue/40 mb-3" />
        <p className="text-segal-dark/60 font-medium">Sin datos aún</p>
        <p className="text-sm text-segal-dark/40 mt-1">
          Ejecuta el flujo para ver las estadísticas
        </p>
      </div>
    )
  }

  // Find max enviados for progress bars
  const maxEnviados = Math.max(...etapas.map(e => e.enviados), 1)

  return (
    <div className="space-y-8">
      {/* Section 1: Summary Metrics */}
      <div>
        <h3 className="text-lg font-bold text-segal-dark mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-segal-blue" />
          Resumen de Rendimiento
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Tasa de Apertura"
            value={resumen.tasa_apertura}
            suffix="%"
            icon={Eye}
            color="blue"
            subtext={`${totales.envios.abiertos.toLocaleString()} abiertos`}
          />
          <MetricCard
            label="Tasa de Click"
            value={resumen.tasa_click}
            suffix="%"
            icon={MousePointerClick}
            color="purple"
            subtext={`${totales.envios.clickeados.toLocaleString()} clicks`}
          />
          <MetricCard
            label="Tasa de Fallo"
            value={resumen.tasa_fallo}
            suffix="%"
            icon={AlertCircle}
            color={resumen.tasa_fallo > FAILURE_RATE_WARNING_THRESHOLD ? 'red' : 'amber'}
            subtext={`${totales.envios.fallidos.toLocaleString()} fallidos`}
          />
          <MetricCard
            label="Costo por Conversión"
            value={`$${resumen.costo_por_conversion.toLocaleString()}`}
            icon={DollarSign}
            color="green"
            subtext={`Total: $${resumen.costo_total.toLocaleString()}`}
          />
        </div>

        {/* Additional summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100 flex items-center gap-3">
            <Mail className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-xl font-bold text-blue-700">{resumen.emails_enviados.toLocaleString()}</p>
              <p className="text-xs text-blue-600/70">Emails enviados</p>
            </div>
          </div>
          <div className="bg-green-50/50 rounded-lg p-3 border border-green-100 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-xl font-bold text-green-700">{resumen.sms_enviados.toLocaleString()}</p>
              <p className="text-xs text-green-600/70">SMS enviados</p>
            </div>
          </div>
          <div className="bg-segal-blue/5 rounded-lg p-3 border border-segal-blue/10 flex items-center gap-3">
            <Users className="h-8 w-8 text-segal-blue" />
            <div>
              <p className="text-xl font-bold text-segal-dark">{totales.prospectos.total.toLocaleString()}</p>
              <p className="text-xs text-segal-dark/60">Prospectos en flujo</p>
            </div>
          </div>
          <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-xl font-bold text-emerald-700">{totales.prospectos.completados.toLocaleString()}</p>
              <p className="text-xs text-emerald-600/70">Completados ({funnel.tasa_conversion}%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Conversion Funnel */}
      <div>
        <h3 className="text-lg font-bold text-segal-dark mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-segal-blue" />
          Funnel de Conversión
        </h3>
        
        <div className="bg-gradient-to-r from-slate-50 to-segal-blue/5 rounded-xl p-6 border border-segal-blue/10">
          <div className="flex items-center justify-center flex-wrap gap-2">
            <FunnelStep 
              label="Prospectos" 
              value={funnel.prospectos} 
              color="bg-segal-dark"
            />
            <FunnelStep 
              label="Enviados" 
              value={funnel.enviados} 
              color="bg-segal-blue"
            />
            <FunnelStep 
              label="Abiertos" 
              value={funnel.abiertos} 
              rate={funnel.tasa_apertura}
              color="bg-blue-500"
            />
            <FunnelStep 
              label="Clicks" 
              value={funnel.clickeados} 
              rate={funnel.tasa_click_sobre_abiertos}
              color="bg-purple-500"
            />
            <FunnelStep 
              label="Conversión" 
              value={funnel.conversiones} 
              rate={funnel.tasa_conversion}
              color="bg-emerald-500"
              isLast
            />
          </div>
          
          {/* Funnel insights */}
          <div className="mt-6 pt-4 border-t border-segal-blue/10">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-segal-dark/70">
                  <span className="font-semibold">{funnel.tasa_apertura}%</span> abrieron
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-segal-dark/70">
                  <span className="font-semibold">{funnel.tasa_click_sobre_abiertos}%</span> clickearon
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-segal-dark/70">
                  <span className="font-semibold">{funnel.tasa_conversion}%</span> convirtieron
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Per-Stage Performance */}
      {etapas.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-segal-dark mb-4 flex items-center gap-2">
            <Send className="h-5 w-5 text-segal-blue" />
            Rendimiento por Etapa
          </h3>
          
          <div className="space-y-3">
            {etapas.map((etapa, index) => (
              <StageRow
                key={etapa.node_id}
                label={etapa.label || `Etapa ${index + 1}`}
                enviados={etapa.enviados}
                abiertos={etapa.abiertos}
                clickeados={etapa.clickeados}
                tasaApertura={etapa.tasa_apertura}
                tasaClick={etapa.tasa_click}
                tipoMensaje={etapa.tipo_mensaje}
                maxEnviados={maxEnviados}
              />
            ))}
          </div>
        </div>
      )}

      {/* Alerts section */}
      {totales.prospectos.cancelados > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Prospectos Cancelados</p>
              <p className="text-sm text-red-700 mt-1">
                {totales.prospectos.cancelados.toLocaleString()} prospecto(s) cancelado(s) en este flujo
              </p>
            </div>
          </div>
        </div>
      )}

      {totales.envios.fallidos > 0 && resumen.tasa_fallo > FAILURE_RATE_WARNING_THRESHOLD && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Tasa de Fallo Alta</p>
              <p className="text-sm text-amber-700 mt-1">
                La tasa de fallo es del {resumen.tasa_fallo}%. Revisa los emails/números de los prospectos.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

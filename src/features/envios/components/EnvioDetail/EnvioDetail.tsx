/**
 * EnvioDetail Component
 * Displays comprehensive details about a single shipment
 *
 * Features:
 * - Shipment metadata and status
 * - Recipient information
 * - Channel and flow information
 * - Content display with syntax highlighting
 * - Error details for failed shipments
 * - Dark mode support
 * - Accessibility compliant
 */

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  Check,
  Copy,
  Mail,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle,
  X,
  Loader2,
} from 'lucide-react'
import { useEnvioDetail } from '@/features/envios/hooks'

interface EnvioDetailProps {
  envioId: number
  onClose?: () => void
}

type StatusType = 'enviado' | 'pendiente' | 'fallido'

const STATUS_CONFIG: Record<StatusType, { color: string; icon: React.ReactNode; label: string }> = {
  enviado: {
    color: 'text-green-600 dark:text-green-400',
    icon: <CheckCircle className="h-5 w-5" />,
    label: 'Enviado',
  },
  pendiente: {
    color: 'text-yellow-600 dark:text-yellow-400',
    icon: <Clock className="h-5 w-5" />,
    label: 'Pendiente',
  },
  fallido: {
    color: 'text-red-600 dark:text-red-400',
    icon: <AlertTriangle className="h-5 w-5" />,
    label: 'Fallido',
  },
}

export function EnvioDetail({ envioId, onClose }: EnvioDetailProps) {
  const { data: envio, isLoading, isError, error, refetch } = useEnvioDetail(envioId)
  const [copiedEmail, setCopiedEmail] = useState(false)

  const handleCopyEmail = async () => {
    if (envio?.metadata?.destinatario) {
      try {
        await navigator.clipboard.writeText(envio.metadata.destinatario)
        setCopiedEmail(true)
        setTimeout(() => setCopiedEmail(false), 2000)
      } catch (err) {
        console.error('Failed to copy email:', err)
      }
    }
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center p-8"
        role="status"
        aria-label="Cargando detalles del envío"
      >
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-segal-blue" />
          <p className="text-sm text-segal-dark/70 dark:text-slate-400">
            Cargando detalles del envío...
          </p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            Error al cargar el envío
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-segal-dark/70 dark:text-slate-300">
            {error?.message || 'No se pudo cargar el detalle del envío. Intenta nuevamente.'}
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="dark:bg-slate-800 dark:border-slate-600 dark:text-white"
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!envio) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-900 m-4">
        <CardHeader>
          <CardTitle className="text-yellow-600 dark:text-yellow-400">
            Envío no disponible
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-segal-dark/70 dark:text-slate-300">
            No se encontró el envío solicitado.
          </p>
        </CardContent>
      </Card>
    )
  }

  const statusConfig = STATUS_CONFIG[envio.estado as StatusType]
  const formattedCreatedDate = format(new Date(envio.fecha_creacion), 'dd/MM/yyyy HH:mm', {
    locale: es,
  })
  const formattedSentDate = envio.fecha_enviado
    ? format(new Date(envio.fecha_enviado), 'dd/MM/yyyy HH:mm', { locale: es })
    : null

  return (
    <div className="space-y-4 p-4 dark:bg-slate-950">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-segal-dark dark:text-white">
            Detalles del Envío
          </h2>
          <p className="text-sm text-segal-dark/60 dark:text-slate-400">ID: {envio.id}</p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="dark:hover:bg-slate-800 dark:text-slate-300"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="detalles" className="w-full">
        <TabsList className="grid w-full grid-cols-2 dark:bg-slate-900 dark:border-slate-700">
          <TabsTrigger
            value="detalles"
            className="dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:text-slate-300"
          >
            Detalles
          </TabsTrigger>
          <TabsTrigger
            value="contenido"
            className="dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:text-slate-300"
          >
            Contenido
          </TabsTrigger>
        </TabsList>

        {/* Detalles Tab */}
        <TabsContent value="detalles" className="space-y-4">
          {/* Status Card */}
          <Card className="dark:bg-slate-900 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className={statusConfig.color}>{statusConfig.icon}</span>
                <span className="text-segal-dark dark:text-white">Estado del Envío</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                  envio.estado === 'enviado'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : envio.estado === 'fallido'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}
              >
                {statusConfig.icon}
                {statusConfig.label}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-segal-dark/60 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Creado
                  </p>
                  <p className="text-sm font-medium text-segal-dark dark:text-white">
                    {formattedCreatedDate}
                  </p>
                </div>
                {formattedSentDate && (
                  <div>
                    <p className="text-xs text-segal-dark/60 dark:text-slate-400 uppercase tracking-wide mb-1">
                      Enviado
                    </p>
                    <p className="text-sm font-medium text-segal-dark dark:text-white">
                      {formattedSentDate}
                    </p>
                  </div>
                )}
              </div>

              {/* Error message for failed envios */}
              {envio.estado === 'fallido' && envio.metadata?.error && (
                <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                    Razón del error:
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-300">{envio.metadata.error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recipient Card */}
          <Card className="dark:bg-slate-900 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-5 w-5 text-segal-blue" />
                <span className="text-segal-dark dark:text-white">Destinatario</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-segal-dark/60 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Nombre
                </p>
                <p className="text-sm font-medium text-segal-dark dark:text-white">
                  {envio.prospecto?.nombre || 'No disponible'}
                </p>
              </div>

              <div>
                <p className="text-xs text-segal-dark/60 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Email/Teléfono
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-segal-dark dark:text-white">
                    {envio.metadata?.destinatario}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyEmail}
                    className="dark:hover:bg-slate-800 dark:text-slate-300"
                    aria-label="Copiar email"
                  >
                    {copiedEmail ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {copiedEmail && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Copiado!</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Channel & Flow Card */}
          <Card className="dark:bg-slate-900 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-segal-turquoise" />
                <span className="text-segal-dark dark:text-white">Canal y Flujo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-segal-dark/60 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Canal
                  </p>
                  <div className="flex items-center gap-2">
                    {envio.canal === 'email' ? (
                      <Mail className="h-4 w-4 text-blue-500" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-green-500" />
                    )}
                    <p className="text-sm font-medium text-segal-dark dark:text-white">
                      {envio.canal === 'email' ? '📧 Email' : '📱 SMS'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-segal-dark/60 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Flujo
                  </p>
                  <p className="text-sm font-medium text-segal-dark dark:text-white">
                    {envio.flujo?.nombre || `Flujo ${envio.flujo_id}`}
                  </p>
                </div>
              </div>

              {envio.etapa && (
                <div>
                  <p className="text-xs text-segal-dark/60 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Etapa
                  </p>
                  <p className="text-sm font-medium text-segal-dark dark:text-white">
                    Día {envio.etapa.dia_envio}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Subject (if available) */}
          {envio.metadata?.asunto && (
            <Card className="dark:bg-slate-900 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-base text-segal-dark dark:text-white">Asunto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-segal-dark dark:text-slate-300">
                  {envio.metadata.asunto}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Contenido Tab */}
        <TabsContent value="contenido" className="space-y-4">
          <Card className="dark:bg-slate-900 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-base text-segal-dark dark:text-white">
                Contenido del Envío
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                {envio.canal === 'email' ? 'Cuerpo del email' : 'Mensaje SMS'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-segal-light/50 dark:bg-slate-800 border border-segal-blue/20 dark:border-slate-700 rounded p-4 max-h-96 overflow-y-auto">
                <p className="text-sm text-segal-dark dark:text-slate-300 whitespace-pre-wrap break-words font-mono">
                  {envio.contenido}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* HTML Preview (if applicable) */}
          {envio.canal === 'email' && envio.contenido.includes('<') && (
            <Card className="dark:bg-slate-900 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-base text-segal-dark dark:text-white">
                  Vista Previa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white dark:bg-slate-800 border border-segal-blue/20 dark:border-slate-700 rounded p-4 max-h-96 overflow-y-auto">
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: envio.contenido }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EnvioDetail

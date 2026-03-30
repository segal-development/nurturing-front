/**
 * PlantillaPreviewDrawer - Modal para previsualizar plantillas
 *
 * Muestra el contenido renderizado de una plantilla (Email como HTML, SMS como texto)
 * con variables reemplazadas por datos de ejemplo.
 *
 * Para nodos tipo "ambos", muestra tabs para alternar entre Email y SMS.
 */

import { Mail, MessageSquare, Info, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePlantillaPreview } from '@/features/flujos/hooks/usePlantillas'
import type { TipoMensaje } from '@/types/flujo'

// ============================================================================
// TYPES
// ============================================================================

interface PlantillaPreviewDrawerProps {
  /** Controla si el modal está abierto */
  isOpen: boolean
  /** Callback para cerrar el modal */
  onClose: () => void
  /** ID de la plantilla SMS (o principal si tipo no es 'ambos') */
  plantillaId?: number
  /** ID de la plantilla Email (solo si tipo es 'ambos') */
  plantillaIdEmail?: number
  /** Tipo de mensaje del nodo */
  tipoMensaje?: TipoMensaje
  /** Nombre del nodo para el título */
  nodeLabel?: string
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Vista de carga mientras se obtiene la plantilla
 */
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-[500px] gap-3 text-segal-dark/60">
      <Loader2 className="h-10 w-10 animate-spin" />
      <p className="text-sm">Cargando preview...</p>
    </div>
  )
}

/**
 * Vista de error o plantilla no encontrada
 */
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[500px] gap-3 text-red-500">
      <Info className="h-10 w-10" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

/**
 * Preview de email renderizado en iframe
 */
function EmailPreview({ html, asunto }: { html: string; asunto?: string | null }) {
  return (
    <div className="flex flex-col h-full">
      {/* Asunto */}
      {asunto && (
        <div className="px-4 py-3 bg-segal-blue/5 border-b border-segal-blue/10 rounded-t-lg">
          <p className="text-xs font-medium text-segal-dark/60 mb-1">Asunto:</p>
          <p className="text-sm font-semibold text-segal-dark">{asunto}</p>
        </div>
      )}

      {/* Email renderizado en iframe */}
      <div className="flex-1 bg-gray-100 rounded-b-lg overflow-hidden">
        <iframe
          srcDoc={html}
          title="Email Preview"
          className="w-full h-full border-0 bg-white"
          sandbox="allow-same-origin"
          style={{ minHeight: '500px' }}
        />
      </div>
    </div>
  )
}

/**
 * Preview de SMS como texto
 */
function SMSPreview({ contenido }: { contenido: string }) {
  const caracteresUsados = contenido.length
  const limite = 160
  const excedeLimite = caracteresUsados > limite

  return (
    <div className="flex flex-col h-full p-6">
      {/* Simulación de celular */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-[320px] bg-gray-900 rounded-[40px] p-3 shadow-2xl">
          {/* Pantalla del celular */}
          <div className="bg-white rounded-[32px] p-4 min-h-[500px] flex flex-col">
            {/* Header del mensaje */}
            <div className="text-center pb-3 border-b border-gray-200 mb-4">
              <p className="text-xs text-gray-500">Mensaje de texto</p>
              <p className="text-sm font-semibold text-gray-800">Grupo Segal</p>
            </div>
            
            {/* Burbuja de mensaje */}
            <div className="flex-1">
              <div className="bg-green-500 text-white rounded-2xl rounded-tl-sm p-4 max-w-[85%] shadow-md">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {contenido}
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-2 ml-2">Ahora</p>
            </div>

            {/* Contador de caracteres */}
            <div className="pt-3 border-t border-gray-200 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Caracteres:</span>
                <span
                  className={`text-sm font-bold ${
                    excedeLimite ? 'text-red-500' : 'text-green-600'
                  }`}
                >
                  {caracteresUsados}/{limite}
                </span>
              </div>
              {excedeLimite && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ El mensaje excede el límite y podría truncarse
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Badge de variables detectadas
 */
function VariablesBadge({ variables }: { variables: string[] }) {
  if (variables.length === 0) return null

  return (
    <div className="px-4 py-3 bg-amber-50 border-t border-amber-200 rounded-b-lg">
      <p className="text-xs text-amber-800">
        <span className="font-semibold">Variables usadas: </span>
        {variables.map((v) => `{{${v}}}`).join(', ')}
      </p>
    </div>
  )
}

/**
 * Contenido de una tab individual (Email o SMS)
 */
function TabContent({
  plantillaId,
  tipo,
}: {
  plantillaId: number | undefined
  tipo: 'email' | 'sms'
}) {
  const { data: preview, isLoading, error } = usePlantillaPreview(plantillaId, !!plantillaId)

  if (!plantillaId) {
    return <ErrorState message={`No hay plantilla de ${tipo.toUpperCase()} configurada`} />
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (error || !preview) {
    return <ErrorState message="Error al cargar la plantilla" />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        {preview.tipo === 'email' ? (
          <EmailPreview html={preview.contenido} asunto={preview.asunto} />
        ) : (
          <SMSPreview contenido={preview.contenido} />
        )}
      </div>
      <VariablesBadge variables={preview.variables} />
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PlantillaPreviewDrawer({
  isOpen,
  onClose,
  plantillaId,
  plantillaIdEmail,
  tipoMensaje,
  nodeLabel,
}: PlantillaPreviewDrawerProps) {
  // Determinar qué tabs mostrar
  const showBothTabs = tipoMensaje === 'ambos'
  const showEmailOnly = tipoMensaje === 'email'
  const showSMSOnly = tipoMensaje === 'sms'

  // IDs de plantillas según tipo
  const emailId = showEmailOnly ? plantillaId : plantillaIdEmail
  const smsId = showSMSOnly ? plantillaId : (showBothTabs ? plantillaId : undefined)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw] h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-segal-blue/10 shrink-0">
          <DialogTitle className="text-xl font-bold text-segal-dark">
            Preview de Plantilla
          </DialogTitle>
          <DialogDescription className="text-segal-dark/60">
            {nodeLabel || 'Etapa'} — {tipoMensaje === 'ambos' ? 'Email + SMS' : tipoMensaje?.toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-h-0">
          {showBothTabs ? (
            /* Tabs para Email + SMS */
            <Tabs defaultValue="email" className="h-full flex flex-col">
              <div className="px-6 pt-4 shrink-0">
                <TabsList className="w-full max-w-md">
                  <TabsTrigger value="email" className="flex-1 gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="sms" className="flex-1 gap-2">
                    <MessageSquare className="h-4 w-4" />
                    SMS
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="email" className="flex-1 overflow-auto mt-0 px-6 pb-4">
                <TabContent plantillaId={emailId} tipo="email" />
              </TabsContent>

              <TabsContent value="sms" className="flex-1 overflow-auto mt-0 px-6 pb-4">
                <TabContent plantillaId={smsId} tipo="sms" />
              </TabsContent>
            </Tabs>
          ) : showEmailOnly ? (
            /* Solo Email */
            <div className="h-full overflow-auto p-6">
              <TabContent plantillaId={emailId} tipo="email" />
            </div>
          ) : showSMSOnly ? (
            /* Solo SMS */
            <div className="h-full overflow-auto p-6">
              <TabContent plantillaId={smsId} tipo="sms" />
            </div>
          ) : (
            /* Sin tipo definido */
            <ErrorState message="No hay tipo de mensaje configurado" />
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-200 shrink-0">
          <p className="text-xs text-blue-700 flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            Preview con datos de ejemplo. El mensaje real usará los datos de cada prospecto.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

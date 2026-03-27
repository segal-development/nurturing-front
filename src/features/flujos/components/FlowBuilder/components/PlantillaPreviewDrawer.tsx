/**
 * PlantillaPreviewDrawer - Drawer lateral para previsualizar plantillas
 *
 * Muestra el contenido renderizado de una plantilla (Email como HTML, SMS como texto)
 * con variables reemplazadas por datos de ejemplo.
 *
 * Para nodos tipo "ambos", muestra tabs para alternar entre Email y SMS.
 */

import { Mail, MessageSquare, X, Info, Loader2 } from 'lucide-react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePlantillaPreview } from '@/features/flujos/hooks/usePlantillas'
import type { TipoMensaje } from '@/types/flujo'

// ============================================================================
// TYPES
// ============================================================================

interface PlantillaPreviewDrawerProps {
  /** Controla si el drawer está abierto */
  isOpen: boolean
  /** Callback para cerrar el drawer */
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
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-segal-dark/60">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm">Cargando preview...</p>
    </div>
  )
}

/**
 * Vista de error o plantilla no encontrada
 */
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-500">
      <Info className="h-8 w-8" />
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
        <div className="px-4 py-3 bg-segal-blue/5 border-b border-segal-blue/10">
          <p className="text-xs font-medium text-segal-dark/60 mb-1">Asunto:</p>
          <p className="text-sm font-semibold text-segal-dark">{asunto}</p>
        </div>
      )}

      {/* Email renderizado */}
      <div className="flex-1 overflow-hidden">
        <iframe
          srcDoc={html}
          title="Email Preview"
          className="w-full h-full border-0"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  )
}

/**
 * Preview de SMS como texto
 */
function SMSPreview({ contenido }: { contenido: string }) {
  // Calcular caracteres
  const caracteresUsados = contenido.length
  const limite = 160
  const excedeLimite = caracteresUsados > limite

  return (
    <div className="flex flex-col h-full p-4">
      {/* Simulación de mensaje SMS */}
      <div className="flex-1 flex items-start justify-center pt-8">
        <div className="max-w-[280px] w-full">
          {/* Burbuja de mensaje */}
          <div className="bg-green-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
            <p className="text-sm text-segal-dark whitespace-pre-wrap leading-relaxed">
              {contenido}
            </p>
          </div>

          {/* Contador de caracteres */}
          <div className="flex justify-end mt-2">
            <span
              className={`text-xs font-medium ${
                excedeLimite ? 'text-red-500' : 'text-segal-dark/50'
              }`}
            >
              {caracteresUsados}/{limite} caracteres
              {excedeLimite && ' (se truncará)'}
            </span>
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
    <div className="px-4 py-2 bg-amber-50 border-t border-amber-200">
      <p className="text-xs text-amber-800">
        <span className="font-medium">Variables usadas: </span>
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
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction="right">
      <DrawerContent className="w-[600px] sm:max-w-[600px]">
        {/* Header */}
        <DrawerHeader className="border-b border-segal-blue/10">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-lg">
                Preview de Plantilla
              </DrawerTitle>
              <DrawerDescription>
                {nodeLabel || 'Etapa'} — {tipoMensaje === 'ambos' ? 'Email + SMS' : tipoMensaje?.toUpperCase()}
              </DrawerDescription>
            </div>
            <DrawerClose className="rounded-full p-2 hover:bg-segal-blue/5 transition-colors">
              <X className="h-5 w-5 text-segal-dark/60" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {showBothTabs ? (
            /* Tabs para Email + SMS */
            <Tabs defaultValue="email" className="h-full flex flex-col">
              <div className="px-4 pt-4">
                <TabsList className="w-full">
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

              <TabsContent value="email" className="flex-1 overflow-hidden mt-0">
                <TabContent plantillaId={emailId} tipo="email" />
              </TabsContent>

              <TabsContent value="sms" className="flex-1 overflow-hidden mt-0">
                <TabContent plantillaId={smsId} tipo="sms" />
              </TabsContent>
            </Tabs>
          ) : showEmailOnly ? (
            /* Solo Email */
            <TabContent plantillaId={emailId} tipo="email" />
          ) : showSMSOnly ? (
            /* Solo SMS */
            <TabContent plantillaId={smsId} tipo="sms" />
          ) : (
            /* Sin tipo definido */
            <ErrorState message="No hay tipo de mensaje configurado" />
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 bg-blue-50 border-t border-blue-200">
          <p className="text-xs text-blue-700 flex items-center gap-2">
            <Info className="h-3.5 w-3.5 shrink-0" />
            Preview con datos de ejemplo. El mensaje real usará los datos de cada prospecto.
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

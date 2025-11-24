/**
 * Diálogo para ver detalles completos de un flujo
 * Muestra información del flujo, sus etapas y estadísticas
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Mail,
  MessageSquare,
  ArrowRight,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import type { FlujoNurturing, EtapaFlujo } from '@/types/flujo'

interface FlujoDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flujo: FlujoNurturing | null
  onEdit?: () => void
  onExecute?: () => void
}

export function FlujoDetailDialog({
  open,
  onOpenChange,
  flujo,
  onEdit,
  onExecute,
}: FlujoDetailDialogProps) {
  if (!flujo) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[70vw] max-h-[85vh] bg-white border border-segal-blue/20 shadow-2xl overflow-y-auto">
        <DialogHeader className="border-b border-segal-blue/10 pb-4 sticky top-0 bg-white z-10">
          <DialogTitle className="text-2xl font-bold text-segal-dark">{flujo?.nombre || 'Detalles del Flujo'}</DialogTitle>
          <DialogDescription className="text-segal-dark/70">
            Información completa y etapas del flujo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
              <p className="text-sm text-segal-dark/60 font-semibold mb-1">Tipo de Deudor</p>
              <p className="text-lg font-bold text-segal-dark">
                {typeof flujo.tipo_prospecto === 'string'
                  ? flujo.tipo_prospecto
                  : flujo.tipo_prospecto?.nombre || 'Sin especificar'}
              </p>
            </div>

            <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
              <p className="text-sm text-segal-dark/60 font-semibold mb-1">Estado</p>
              <div className="flex items-center gap-2">
                {flujo.activo ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-segal-green" />
                    <span className="text-lg font-bold text-segal-green">Activo</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-segal-red" />
                    <span className="text-lg font-bold text-segal-red">Inactivo</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
              <p className="text-sm text-segal-dark/60 font-semibold mb-1 flex items-center gap-2">
                <User className="h-4 w-4" />
                Creado por
              </p>
              <p className="text-lg font-bold text-segal-dark">
                {typeof flujo.user === 'string' ? flujo.user : flujo.user?.name || 'Sistema'}
              </p>
            </div>

            <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
              <p className="text-sm text-segal-dark/60 font-semibold mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Creado el
              </p>
              <p className="text-lg font-bold text-segal-dark">
                {flujo.created_at ? new Date(flujo.created_at).toLocaleDateString('es-CL') : '-'}
              </p>
            </div>
          </div>

          {/* Descripción */}
          {flujo.descripcion && (
            <div>
              <p className="text-sm font-semibold text-segal-dark/60 mb-2">Descripción</p>
              <p className="bg-segal-blue/5 border border-segal-blue/10 rounded-lg p-4 text-segal-dark/80">
                {flujo.descripcion}
              </p>
            </div>
          )}

          {/* Etapas */}
          <div>
            <h3 className="text-lg font-bold text-segal-dark mb-4">Etapas ({flujo.etapas?.length || 0})</h3>

            {flujo.etapas && flujo.etapas.length > 0 ? (
              <div className="space-y-3">
                {flujo.etapas.map((etapa: EtapaFlujo, index: number) => (
                  <div
                    key={etapa.id || index}
                    className="bg-white border border-segal-blue/10 rounded-lg p-4 hover:border-segal-blue/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-segal-blue text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <h4 className="text-sm font-bold text-segal-dark">
                            Día {etapa.dia_envio} - {etapa.tipo_mensaje === 'email' ? 'Email' : 'SMS'}
                          </h4>
                        </div>

                        <div className="grid grid-cols-2 gap-3 ml-11">
                          {etapa.plantilla_mensaje && (
                            <div>
                              <p className="text-xs text-segal-dark/60">Plantilla</p>
                              <p className="text-sm font-medium text-segal-dark">{etapa.plantilla_mensaje}</p>
                            </div>
                          )}

                          {etapa.oferta && (
                            <div>
                              <p className="text-xs text-segal-dark/60">Oferta</p>
                              <p className="text-sm font-medium text-segal-dark">{etapa.oferta.titulo}</p>
                            </div>
                          )}

                          <div>
                            <p className="text-xs text-segal-dark/60">Tipo</p>
                            <div className="flex items-center gap-1">
                              {etapa.tipo_mensaje === 'email' ? (
                                <>
                                  <Mail className="h-4 w-4 text-segal-blue" />
                                  <span className="text-sm font-medium text-segal-dark">Email</span>
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="h-4 w-4 text-segal-blue" />
                                  <span className="text-sm font-medium text-segal-dark">SMS</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {index < (flujo.etapas?.length || 0) - 1 && (
                        <div className="flex flex-col items-center gap-2">
                          <ArrowRight className="h-5 w-5 text-segal-blue/40 rotate-90" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-segal-blue/5 border border-segal-blue/10 rounded-lg p-6 text-center">
                <AlertCircle className="h-8 w-8 mx-auto text-segal-blue/40 mb-2" />
                <p className="text-segal-dark/60">No hay etapas configuradas</p>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t border-segal-blue/10 sticky bottom-0 bg-white">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
            >
              Cerrar
            </Button>

            {onEdit && (
              <Button
                onClick={() => {
                  onEdit()
                  onOpenChange(false)
                }}
                className="bg-segal-blue hover:bg-segal-blue/90 text-white"
              >
                Editar
              </Button>
            )}

            {onExecute && (
              <Button
                onClick={() => {
                  onExecute()
                  onOpenChange(false)
                }}
                className="bg-segal-green hover:bg-segal-green/90 text-white"
              >
                Ejecutar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Componente de carga de Excel con soporte para lotes multi-archivo.
 *
 * Este componente fue refactorizado para separar:
 * - Logica de estado y efectos en useUploadExcel hook
 * - Validaciones en validation.ts
 * - Tipos en types.ts
 */

import { Controller } from 'react-hook-form'
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader,
  Plus,
  FolderOpen,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { useUploadExcel } from './useUploadExcel'
import type { UploadExcelProps, LoteActivo, ProgresoImportacion, ArchivoEnLote } from './types'
import type { ProspectoExcelRow } from '@/types/prospecto'

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

function LoteHeader({ lote }: { lote: LoteActivo }) {
  return (
    <div className="bg-gradient-to-r from-segal-blue/10 to-segal-turquoise/10 border border-segal-blue/20 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <FolderOpen className="h-6 w-6 text-segal-blue" />
        <div>
          <p className="font-bold text-segal-dark">Carga: "{lote.nombre}"</p>
          <p className="text-sm text-segal-dark/60">
            {lote.totalArchivos} archivo{lote.totalArchivos !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

function ArchivoList({ archivos }: { archivos: ArchivoEnLote[] }) {
  if (archivos.length === 0) return null

  return (
    <div className="bg-white border border-segal-blue/10 rounded-lg p-4">
      <p className="text-sm font-semibold text-segal-dark mb-3">Archivos en este lote:</p>
      <div className="space-y-2">
        {archivos.map((archivo, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between py-2 px-3 bg-segal-blue/5 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-segal-blue" />
              <span className="text-sm text-segal-dark">{archivo.nombre}</span>
            </div>
            <EstadoBadge estado={archivo.estado} />
          </div>
        ))}
      </div>
    </div>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const config = {
    completado: { bg: 'bg-segal-green/20', text: 'text-segal-green', label: '✓ Completado' },
    procesando: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏳ Procesando' },
    pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏳ Pendiente' },
    default: { bg: 'bg-gray-100', text: 'text-gray-600', label: estado },
  }

  const { bg, text, label } = config[estado as keyof typeof config] || config.default

  return <span className={`text-xs px-2 py-1 rounded-full ${bg} ${text}`}>{label}</span>
}

function ProgresoProcesando({
  progreso,
  nombreArchivo,
}: {
  progreso: ProgresoImportacion
  nombreArchivo?: string
}) {
  return (
    <div className="bg-segal-blue/5 border border-segal-blue/20 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Loader className="h-5 w-5 text-segal-blue animate-spin" />
        <div className="flex-1">
          <p className="font-semibold text-segal-dark">
            {progreso.estado === 'pendiente' ? 'En cola...' : 'Procesando...'}
          </p>
          {nombreArchivo && <p className="text-sm text-segal-dark/60">{nombreArchivo}</p>}
        </div>
      </div>

      <Progress value={progreso.porcentaje} className="h-2" />

      <div className="flex justify-between text-sm text-segal-dark/70">
        <span>{progreso.registrosExitosos.toLocaleString('es-CL')} registros procesados</span>
        <span className="font-medium text-segal-blue">{progreso.porcentaje}%</span>
      </div>

      <div className="flex items-center gap-2 text-sm bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
        <Clock className="h-4 w-4 text-yellow-600" />
        <span className="text-yellow-700">Espera a que termine antes de agregar otro archivo.</span>
      </div>
    </div>
  )
}

function ProgresoCompletado({
  progreso,
  nombreArchivo,
}: {
  progreso: ProgresoImportacion
  nombreArchivo?: string
}) {
  return (
    <div className="bg-segal-green/10 border border-segal-green/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-6 w-6 text-segal-green shrink-0" />
        <div>
          <p className="font-semibold text-segal-green">¡Archivo procesado exitosamente!</p>
          <p className="text-sm text-segal-green/80 mt-1">
            "{nombreArchivo}" - {progreso.registrosExitosos.toLocaleString('es-CL')} registros
            importados
          </p>
        </div>
      </div>
    </div>
  )
}

function ProgresoFallido({ nombreArchivo }: { nombreArchivo?: string }) {
  return (
    <div className="bg-segal-red/10 border border-segal-red/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-6 w-6 text-segal-red shrink-0" />
        <div>
          <p className="font-semibold text-segal-red">Error al procesar archivo</p>
          <p className="text-sm text-segal-red/80 mt-1">
            "{nombreArchivo}" - Hubo un error durante el procesamiento
          </p>
        </div>
      </div>
    </div>
  )
}

function ErroresValidacion({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null

  return (
    <div className="bg-segal-red/10 border border-segal-red/30 rounded-lg p-4 space-y-2">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-segal-red shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-segal-red mb-2">
            Se encontraron {errors.length} error{errors.length !== 1 ? 'es' : ''}:
          </p>
          <ul className="list-disc pl-6 space-y-1 max-h-40 overflow-y-auto text-sm text-segal-red/90">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function AdvertenciasValidacion({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null

  return (
    <div className="bg-yellow-50/80 border border-yellow-300/50 rounded-lg p-4 space-y-2">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-yellow-800 mb-2">
            ⚠️ {warnings.length} advertencia{warnings.length !== 1 ? 's' : ''}:
          </p>
          <ul className="list-disc pl-6 space-y-1 max-h-40 overflow-y-auto text-sm text-yellow-700">
            {warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
          <p className="text-xs text-yellow-600 mt-2 italic">
            Los datos se cargaran de todas maneras. Revisa estos campos en el backend.
          </p>
        </div>
      </div>
    </div>
  )
}

function InstruccionesExcel() {
  return (
    <div className="bg-segal-blue/10 border border-segal-blue/20 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <FileSpreadsheet className="h-5 w-5 text-segal-blue shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-segal-dark mb-2">Formato requerido del archivo Excel:</p>
          <ul className="list-disc list-inside text-sm space-y-1 text-segal-dark/80">
            <li>
              Columna A: <strong>Nombre</strong> - Nombre completo del prospecto
            </li>
            <li>
              Columna B: <strong>RUT</strong> - RUT chileno (ej: 12345678 o 12345678K)
            </li>
            <li>
              Columna C: <strong>Email</strong> - Correo electronico valido
            </li>
            <li>
              Columna D: <strong>Telefono</strong> - Numero de telefono
            </li>
            <li>
              Columna E: <strong>Monto Deuda</strong> - Monto en pesos (numero)
            </li>
            <li>
              Columna F: <strong>URL Informe</strong> - Enlace al informe (opcional)
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function PreviewTable({
  preview,
  selectedOriginName,
  errors,
  onReset,
  onUpload,
  loading,
}: {
  preview: ProspectoExcelRow[]
  selectedOriginName: string
  errors: string[]
  onReset: () => void
  onUpload: () => void
  loading: boolean
}) {
  return (
    <div className="space-y-4 bg-white rounded-lg border border-segal-blue/10 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-segal-dark">Vista Previa de Datos</h3>
          <p className="text-sm text-segal-dark/70 mt-1">
            <span className="font-medium text-segal-green">
              {preview.length} registro{preview.length !== 1 ? 's' : ''} valido
              {preview.length !== 1 ? 's' : ''}
            </span>
            {errors.length > 0 && (
              <span className="text-segal-red/80 ml-2">
                • {errors.length} error{errors.length !== 1 ? 'es' : ''}
              </span>
            )}
          </p>
          <p className="text-sm text-segal-dark/60 mt-2">
            Origen: <span className="font-semibold text-segal-blue">{selectedOriginName}</span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
        >
          Cambiar archivos
        </Button>
      </div>

      <div className="border border-segal-blue/10 rounded-lg overflow-hidden bg-white max-h-96">
        <Table>
          <TableHeader>
            <TableRow className="bg-segal-blue/5 border-b border-segal-blue/10">
              <TableHead className="w-[50px] text-segal-dark font-bold">#</TableHead>
              <TableHead className="text-segal-dark font-bold">Nombre</TableHead>
              <TableHead className="text-segal-dark font-bold">RUT</TableHead>
              <TableHead className="text-segal-dark font-bold">Email</TableHead>
              <TableHead className="text-segal-dark font-bold">Telefono</TableHead>
              <TableHead className="text-segal-dark font-bold">Monto Deuda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.slice(0, 10).map((row, i) => (
              <TableRow key={i} className="hover:bg-segal-blue/5 border-b border-segal-blue/5">
                <TableCell className="font-medium text-segal-dark">{i + 1}</TableCell>
                <TableCell className="text-segal-dark/80">{row.nombre}</TableCell>
                <TableCell className="text-segal-dark/80 text-sm font-medium text-segal-blue">
                  {row.rut}
                </TableCell>
                <TableCell className="text-segal-dark/80 text-sm">{row.email}</TableCell>
                <TableCell className="text-segal-dark/80">{row.telefono}</TableCell>
                <TableCell>
                  <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-segal-blue/10 text-segal-blue">
                    ${parseInt(row.monto_deuda as string).toLocaleString('es-CL')}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {preview.length > 10 && (
          <div className="p-3 text-sm text-center text-segal-dark/60 border-t border-segal-blue/10 bg-segal-blue/3 font-medium">
            Mostrando 10 de {preview.length} registros
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          onClick={onUpload}
          disabled={loading || preview.length === 0 || errors.length > 0}
          size="lg"
          className="bg-segal-blue hover:bg-segal-blue/90 text-white disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="animate-spin mr-2">⚙️</span>Importando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Importar {preview.length} prospecto{preview.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function UploadExcel({ onSuccess }: UploadExcelProps) {
  const {
    fileInputRef,
    preview,
    selectedFile,
    setSelectedFile,
    fileSelected,
    errors,
    warnings,
    loading,
    isUploading,
    uploadSuccess,
    loteActivo,
    modoAgregarArchivo,
    selectedOriginName,
    importacionTerminada,
    progresoActual,
    form,
    onSubmit,
    handleUpload,
    handleReset,
    handleAgregarOtroArchivo,
    handleFinalizarLote,
  } = useUploadExcel(onSuccess)

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors },
  } = form

  // =============================================================================
  // RENDER: Vista de exito con lote activo
  // =============================================================================
  if (uploadSuccess && loteActivo) {
    return (
      <div className="space-y-4">
        <LoteHeader lote={loteActivo} />
        <ArchivoList archivos={loteActivo.archivos} />

        {/* Estado del archivo actual */}
        {!importacionTerminada && progresoActual && (
          <ProgresoProcesando progreso={progresoActual} nombreArchivo={selectedFile?.name} />
        )}

        {importacionTerminada && progresoActual?.estado === 'completado' && (
          <ProgresoCompletado progreso={progresoActual} nombreArchivo={selectedFile?.name} />
        )}

        {importacionTerminada && progresoActual?.estado === 'fallido' && (
          <ProgresoFallido nombreArchivo={selectedFile?.name} />
        )}

        {/* Botones de accion - Solo si termino el procesamiento */}
        {importacionTerminada && (
          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-segal-dark/60">¿Tenes mas archivos para esta carga?</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleAgregarOtroArchivo}
                className="border-segal-blue text-segal-blue hover:bg-segal-blue/5"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar otro archivo
              </Button>
              <Button
                onClick={handleFinalizarLote}
                className="bg-segal-green hover:bg-segal-green/90 text-white"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Finalizar carga
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // =============================================================================
  // RENDER: Formulario de carga
  // =============================================================================
  return (
    <div className="space-y-6">
      <InstruccionesExcel />

      {/* Indicador de lote activo cuando se esta agregando otro archivo */}
      {modoAgregarArchivo && loteActivo && (
        <div className="bg-gradient-to-r from-segal-blue/10 to-segal-turquoise/10 border border-segal-blue/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-5 w-5 text-segal-blue" />
            <div>
              <p className="text-sm text-segal-dark/60">Agregando archivo a:</p>
              <p className="font-bold text-segal-dark">{loteActivo.nombre}</p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario - Solo si no hay archivo seleccionado */}
      {!fileSelected && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Campo: Nombre de Origen */}
          {!modoAgregarArchivo && (
            <div className="space-y-2">
              <Label htmlFor="originName" className="block text-sm font-semibold text-segal-dark">
                Nombre de la Carga
                <span className="text-segal-red ml-1">*</span>
              </Label>
              <Controller
                name="originName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="originName"
                    placeholder="Ej: Carga masiva Enero 2025"
                    className={`
                      bg-white border border-segal-blue/30 text-segal-dark
                      placeholder:text-segal-dark/40
                      focus:border-segal-blue focus:ring-2 focus:ring-segal-blue/20
                      ${formErrors.originName ? 'border-segal-red focus:border-segal-red focus:ring-segal-red/20' : ''}
                    `}
                  />
                )}
              />
              {formErrors.originName && (
                <p className="text-sm text-segal-red">{formErrors.originName.message}</p>
              )}
              <p className="text-xs text-segal-dark/50">
                Este nombre agrupara todos los archivos que subas para esta carga.
              </p>
            </div>
          )}

          {/* Campo: Archivo */}
          <div className="space-y-2">
            <Label htmlFor="archivo" className="block text-sm font-semibold text-segal-dark">
              Archivo Excel
              <span className="text-segal-red ml-1">*</span>
            </Label>
            <Controller
              name="archivo"
              control={control}
              render={({ field: { onChange } }) => (
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="archivo"
                    className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${
                      selectedFile
                        ? 'border-segal-green/40 bg-segal-green/5 hover:bg-segal-green/10'
                        : formErrors.archivo
                          ? 'border-segal-red/40 bg-segal-red/5 hover:bg-segal-red/10'
                          : 'border-segal-blue/40 bg-segal-blue/5 hover:bg-segal-blue/10'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {selectedFile ? (
                        <>
                          <CheckCircle2 className="w-12 h-12 mb-4 text-segal-green animate-pulse" />
                          <p className="mb-2 text-sm text-segal-dark">
                            <span className="font-bold text-segal-green">✓ Archivo adjuntado</span>
                          </p>
                          <p className="text-xs text-segal-dark/70 font-medium text-center px-4 break-words">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-segal-dark/50 mt-1">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                          <p className="text-xs text-segal-blue mt-2 underline">
                            Click para cambiar archivo
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload
                            className={`w-12 h-12 mb-4 ${formErrors.archivo ? 'text-segal-red' : 'text-segal-blue'}`}
                          />
                          <p className="mb-2 text-sm text-segal-dark">
                            <span className="font-bold text-segal-dark">Click para subir</span> o
                            arrastra el archivo aqui
                          </p>
                          <p className="text-xs text-segal-dark/60 font-medium">
                            Archivos Excel (.xlsx, .xls)
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      id="archivo"
                      type="file"
                      className="hidden"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        onChange(e.target.files)
                        if (e.target.files?.[0]) {
                          setSelectedFile(e.target.files[0])
                        }
                      }}
                      disabled={loading}
                    />
                  </label>
                </div>
              )}
            />
            {formErrors.archivo && (
              <p className="text-sm text-segal-red">{formErrors.archivo.message}</p>
            )}
          </div>

          {/* Botones de accion */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-segal-blue hover:bg-segal-blue/90 text-white"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⚙️</span>Procesando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Cargar y Validar
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      <ErroresValidacion errors={errors} />
      <AdvertenciasValidacion warnings={warnings} />

      {/* Estado de subida */}
      {isUploading && (
        <div className="space-y-4 bg-gradient-to-br from-segal-blue/5 to-segal-turquoise/5 rounded-xl border border-segal-blue/20 p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-segal-blue/10 flex items-center justify-center">
              <Loader className="h-6 w-6 text-segal-blue animate-spin" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-segal-dark">Subiendo archivo...</p>
              <p className="text-sm text-segal-dark/60">Esto puede tomar unos segundos</p>
            </div>
          </div>
        </div>
      )}

      {/* Vista previa de datos */}
      {preview.length > 0 && !uploadSuccess && !isUploading && (
        <PreviewTable
          preview={preview}
          selectedOriginName={selectedOriginName}
          errors={errors}
          onReset={handleReset}
          onUpload={handleUpload}
          loading={loading}
        />
      )}
    </div>
  )
}

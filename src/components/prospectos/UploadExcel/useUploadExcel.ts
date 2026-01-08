/**
 * Hook personalizado para manejar el estado y logica de UploadExcel
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import ExcelJS from 'exceljs'
import { toast } from 'sonner'
import { importacionesService } from '@/api/importaciones.service'
import { lotesService } from '@/api/lotes.service'
import { useLoteStore } from '@/stores/loteStore'
import { validateRow } from './validation'
import { uploadFormSchema, type UploadFormData, type LoteActivo, type ProgresoImportacion } from './types'
import type { ProspectoExcelRow } from '@/types/prospecto'

// =============================================================================
// CONFIGURACION
// =============================================================================

const POLLING_INTERVAL_MS = 3000

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

export function useUploadExcel(onSuccess?: () => void) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado de archivos
  const [preview, setPreview] = useState<ProspectoExcelRow[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileSelected, setFileSelected] = useState(false)

  // Estado de validacion
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])

  // Estado de proceso
  const [loading, setLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // Estado de lote
  const [loteActivo, setLoteActivo] = useState<LoteActivo | null>(null)
  const [modoAgregarArchivo, setModoAgregarArchivo] = useState(false)
  const [selectedOriginName, setSelectedOriginName] = useState('')

  // Estado de progreso
  const [importacionActualId, setImportacionActualId] = useState<number | null>(null)
  const [importacionTerminada, setImportacionTerminada] = useState(false)
  const [progresoActual, setProgresoActual] = useState<ProgresoImportacion | null>(null)

  // Store global
  const { iniciarTrackingLote, loteActivo: loteEnStore } = useLoteStore()

  // Form
  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadFormSchema),
  })

  // =============================================================================
  // POLLING DE PROGRESO
  // =============================================================================

  const checkImportacionProgress = useCallback(async (importacionId: number): Promise<boolean> => {
    try {
      const progreso = await importacionesService.getProgreso(importacionId)

      setProgresoActual({
        porcentaje: progreso.progreso_porcentaje,
        registrosExitosos: progreso.registros_exitosos ?? 0,
        estado: progreso.estado as ProgresoImportacion['estado'],
      })

      if (progreso.estado === 'completado' || progreso.estado === 'fallido') {
        setImportacionTerminada(true)
        setImportacionActualId(null)

        if (progreso.estado === 'completado') {
          toast.success('Archivo procesado', {
            description: `${(progreso.registros_exitosos ?? 0).toLocaleString('es-CL')} registros importados correctamente.`,
          })
        } else {
          toast.error('Error al procesar archivo', {
            description: progreso.metadata?.error || 'Hubo un error durante el procesamiento.',
          })
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Error checking progress:', error)
      return false
    }
  }, [])

  useEffect(() => {
    if (!importacionActualId) return

    const interval = setInterval(async () => {
      const terminado = await checkImportacionProgress(importacionActualId)
      if (terminado) {
        clearInterval(interval)
      }
    }, POLLING_INTERVAL_MS)

    checkImportacionProgress(importacionActualId)

    return () => clearInterval(interval)
  }, [importacionActualId, checkImportacionProgress])

  // =============================================================================
  // PROCESAMIENTO DE EXCEL
  // =============================================================================

  const processExcelFile = useCallback(async (file: File) => {
    setLoading(true)
    setErrors([])
    setUploadSuccess(false)

    try {
      const workbook = new ExcelJS.Workbook()
      const arrayBuffer = await file.arrayBuffer()
      await workbook.xlsx.load(arrayBuffer)

      const worksheet = workbook.getWorksheet(1)
      if (!worksheet) {
        throw new Error('No se encontro la hoja de trabajo')
      }

      const data: ProspectoExcelRow[] = []
      const validationErrors: string[] = []
      const validationWarnings: string[] = []

      worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        if (rowNumber === 1) return // Skip header

        const rowData = {
          nombre: row.getCell(1).value?.toString().trim() || '',
          rut: row.getCell(2).value?.toString().trim() || '',
          email: row.getCell(3).value?.toString().trim() || '',
          telefono: row.getCell(4).value?.toString().trim() || '',
          monto_deuda: row.getCell(5).value?.toString().trim() || '0',
          url_informe: row.getCell(6).value?.toString().trim() || undefined,
        }

        const validation = validateRow(rowData, rowNumber)

        if (validation.error) {
          validationErrors.push(validation.error)
        } else {
          data.push(rowData)
          validationWarnings.push(...validation.warnings)
        }
      })

      if (validationErrors.length > 0) setErrors(validationErrors)
      if (validationWarnings.length > 0) setWarnings(validationWarnings)

      setPreview(data)
      setFileSelected(true)
    } catch (error) {
      console.error('Error al leer el archivo:', error)
      setErrors(['Error al procesar el archivo Excel. Verifica que el formato sea correcto.'])
    } finally {
      setLoading(false)
    }
  }, [])

  // =============================================================================
  // SUBMIT DEL FORMULARIO
  // =============================================================================

  const onSubmit = useCallback(
    async (data: UploadFormData) => {
      if (!data.archivo || data.archivo.length === 0) {
        setErrors(['Debes seleccionar un archivo'])
        return
      }

      if (!modoAgregarArchivo && (!data.originName || data.originName.trim().length < 3)) {
        setErrors(['El nombre de la carga es requerido (minimo 3 caracteres)'])
        return
      }

      const file = data.archivo[0]
      await processExcelFile(file)

      if (!modoAgregarArchivo && data.originName) {
        setSelectedOriginName(data.originName)
      }
    },
    [modoAgregarArchivo, processExcelFile]
  )

  // =============================================================================
  // UPLOAD AL BACKEND
  // =============================================================================

  const handleUpload = useCallback(async () => {
    if (preview.length === 0 || !selectedFile) {
      console.error('No file selected or preview empty')
      return
    }

    setIsUploading(true)

    try {
      const response = await importacionesService.importar(
        selectedFile,
        loteActivo?.nombre || selectedOriginName,
        loteActivo?.id
      )

      if (response.lote) {
        const archivosDelLote =
          response.lote.importaciones?.map((imp) => ({
            nombre: imp.nombre_archivo,
            registros: 0,
            estado: imp.estado,
          })) || []

        setLoteActivo({
          id: response.lote.id,
          nombre: response.lote.nombre,
          totalArchivos: response.lote.total_archivos,
          totalRegistros: response.lote.total_registros,
          archivos: archivosDelLote,
        })
      }

      if (response.procesamiento === 'background') {
        if (response.lote && (!loteEnStore || loteEnStore.id !== response.lote.id)) {
          iniciarTrackingLote(response.lote.id, response.lote.nombre)
        }

        setImportacionActualId(response.data.id)
        setImportacionTerminada(false)
        setProgresoActual({
          porcentaje: 0,
          registrosExitosos: 0,
          estado: 'pendiente',
        })

        toast.info('Archivo en proceso', {
          description: `"${selectedFile.name}" se esta procesando. Espera a que termine para agregar otro.`,
          duration: 5000,
        })
      } else {
        setImportacionTerminada(true)
        setProgresoActual({
          porcentaje: 100,
          registrosExitosos: response.resumen?.registros_exitosos ?? 0,
          estado: 'completado',
        })

        toast.success('Archivo importado', {
          description: `Se importaron ${response.resumen?.registros_exitosos || 0} registros.`,
          duration: 5000,
        })
      }

      setIsUploading(false)
      setUploadSuccess(true)
    } catch (error) {
      console.error('Error al importar:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

      toast.error('Error al importar', {
        description: errorMessage,
        duration: 8000,
      })

      setErrors([`Error al importar los prospectos: ${errorMessage}`])
      setIsUploading(false)
    }
  }, [preview, selectedFile, loteActivo, selectedOriginName, loteEnStore, iniciarTrackingLote])

  // =============================================================================
  // RESET
  // =============================================================================

  const handleReset = useCallback(() => {
    form.reset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setPreview([])
    setErrors([])
    setWarnings([])
    setUploadSuccess(false)
    setFileSelected(false)
    setSelectedOriginName('')
    setSelectedFile(null)
    setLoteActivo(null)
    setModoAgregarArchivo(false)
    setImportacionActualId(null)
    setImportacionTerminada(false)
    setProgresoActual(null)
  }, [form])

  // =============================================================================
  // AGREGAR OTRO ARCHIVO
  // =============================================================================

  const handleAgregarOtroArchivo = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setPreview([])
    setErrors([])
    setWarnings([])
    setUploadSuccess(false)
    setFileSelected(false)
    setSelectedFile(null)
    setModoAgregarArchivo(true)
    setImportacionActualId(null)
    setImportacionTerminada(false)
    setProgresoActual(null)
  }, [])

  // =============================================================================
  // FINALIZAR LOTE
  // =============================================================================

  const handleFinalizarLote = useCallback(async () => {
    if (!loteActivo?.id) {
      handleReset()
      onSuccess?.()
      return
    }

    try {
      const response = await lotesService.cerrar(loteActivo.id)

      toast.success('Lote completado', {
        description:
          response.mensaje || `Carga "${loteActivo.nombre}" con ${loteActivo.totalArchivos} archivo(s) finalizada.`,
        duration: 5000,
      })

      handleReset()
      onSuccess?.()
    } catch (error) {
      console.error('Error al cerrar lote:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      toast.error('Error al finalizar lote', {
        description: errorMessage,
        duration: 8000,
      })
    }
  }, [loteActivo, handleReset, onSuccess])

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // Refs
    fileInputRef,

    // Estado
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

    // Form
    form,

    // Handlers
    onSubmit,
    handleUpload,
    handleReset,
    handleAgregarOtroArchivo,
    handleFinalizarLote,
  }
}

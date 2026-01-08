import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ExcelJS from 'exceljs';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader, Plus, FolderOpen, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { importacionesService } from '@/api/importaciones.service';
import { useLoteStore } from '@/stores/loteStore';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProspectoExcelRow } from '@/types/prospecto';

// Tipo para el lote actual
interface LoteActivo {
  id: number;
  nombre: string;
  totalArchivos: number;
  totalRegistros: number;
  archivos: Array<{ nombre: string; registros: number; estado: string }>;
}

// ============================================================
// VALIDACIÓN CON ZOD
// ============================================================
const uploadFormSchema = z.object({
  originName: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  archivo: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, 'Debes seleccionar un archivo')
    .refine(
      (files) => files[0]?.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                 files[0]?.type === 'application/vnd.ms-excel',
      'El archivo debe ser un Excel (.xlsx o .xls)'
    ),
});

type UploadFormData = z.infer<typeof uploadFormSchema>;

interface UploadExcelProps {
  onSuccess?: () => void;
}

export function UploadExcel({ onSuccess }: UploadExcelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ProspectoExcelRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const [selectedOriginName, setSelectedOriginName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Estado para manejo de lotes (multi-archivo)
  const [loteActivo, setLoteActivo] = useState<LoteActivo | null>(null);
  const [modoAgregarArchivo, setModoAgregarArchivo] = useState(false);

  // Estado para esperar que termine el procesamiento
  const [importacionActualId, setImportacionActualId] = useState<number | null>(null);
  const [importacionTerminada, setImportacionTerminada] = useState(false);
  const [progresoActual, setProgresoActual] = useState<{
    porcentaje: number;
    registrosExitosos: number;
    estado: string;
  } | null>(null);

  // Store global de lotes
  const { iniciarTrackingLote, loteActivo: loteEnStore } = useLoteStore();

  // ============================================================
  // POLLING DE PROGRESO - Esperar a que termine el archivo
  // ============================================================
  const checkImportacionProgress = useCallback(async (importacionId: number) => {
    try {
      const progreso = await importacionesService.getProgreso(importacionId);
      
      setProgresoActual({
        porcentaje: progreso.progreso_porcentaje,
        registrosExitosos: progreso.registros_exitosos ?? 0,
        estado: progreso.estado,
      });

      // Si terminó (completado o fallido), marcar como terminada
      if (progreso.estado === 'completado' || progreso.estado === 'fallido') {
        setImportacionTerminada(true);
        setImportacionActualId(null);
        
        if (progreso.estado === 'completado') {
          toast.success('Archivo procesado', {
            description: `${(progreso.registros_exitosos ?? 0).toLocaleString('es-CL')} registros importados correctamente.`,
          });
        } else {
          toast.error('Error al procesar archivo', {
            description: progreso.metadata?.error || 'Hubo un error durante el procesamiento.',
          });
        }
        return true; // Terminado
      }
      return false; // Sigue procesando
    } catch (error) {
      console.error('Error checking progress:', error);
      return false;
    }
  }, []);

  // Polling cada 3 segundos mientras hay una importación en proceso
  useEffect(() => {
    if (!importacionActualId) return;

    const interval = setInterval(async () => {
      const terminado = await checkImportacionProgress(importacionActualId);
      if (terminado) {
        clearInterval(interval);
      }
    }, 3000);

    // Check inicial inmediato
    checkImportacionProgress(importacionActualId);

    return () => clearInterval(interval);
  }, [importacionActualId, checkImportacionProgress]);

  // ============================================================
  // REACT HOOK FORM
  // ============================================================
  const {
    control,
    handleSubmit,
    formState: { errors: formErrors },
    reset,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadFormSchema),
  });

  // ============================================================
  // VALIDACIÓN DE FILAS DEL EXCEL
  // ============================================================
  // Validar RUT chileno: formato XXXXXXXX-K o XXXXXXXX (7-9 dígitos + K opcional)
  const validateRUT = (rut: string): boolean => {
    if (!rut) return false;
    // Remover puntos y guiones si existen
    const cleanRut = rut.toString().toUpperCase().replace(/[.-]/g, '');
    // Validar formato: 7-9 dígitos + K opcional
    return /^\d{7,9}[K]?$/.test(cleanRut);
  };

  // Validar email básico
  const validateEmail = (email: string): boolean => {
    if (!email) return false;
    return /\S+@\S+\.\S+/.test(email);
  };

  // Retorna errores críticos (que evitan cargar la fila) y advertencias (que permiten cargar)
  const validateRow = (row: any, rowNumber: number): { error: string | null; warnings: string[] } => {
    const rowWarnings: string[] = [];

    // ERROR CRÍTICO: Falta el nombre (es el único campo realmente obligatorio)
    if (!row.nombre || row.nombre.toString().trim() === '') {
      return {
        error: `Fila ${rowNumber}: Falta nombre`,
        warnings: [],
      };
    }

    // ADVERTENCIA: RUT inválido o incompleto
    if (!row.rut || !validateRUT(row.rut)) {
      rowWarnings.push(`Fila ${rowNumber}: RUT inválido o incompleto (${row.rut || 'vacío'})`);
    }

    // ADVERTENCIA: Email inválido o vacío
    if (!row.email || !validateEmail(row.email)) {
      rowWarnings.push(`Fila ${rowNumber}: Email inválido o vacío (${row.email || 'vacío'})`);
    }

    // ADVERTENCIA: Teléfono vacío
    if (!row.telefono || row.telefono.toString().trim() === '') {
      rowWarnings.push(`Fila ${rowNumber}: Teléfono vacío`);
    }

    // ERROR CRÍTICO: Monto de deuda inválido
    const montoDeuda = parseFloat(row.monto_deuda?.toString());
    if (isNaN(montoDeuda) || montoDeuda < 0) {
      return {
        error: `Fila ${rowNumber}: Monto de deuda inválido (${row.monto_deuda}). Debe ser un número válido`,
        warnings: rowWarnings,
      };
    }

    return {
      error: null,
      warnings: rowWarnings,
    };
  };

  // ============================================================
  // PROCESAR ARCHIVO EXCEL
  // ============================================================
  const processExcelFile = async (file: File) => {
    setLoading(true);
    setErrors([]);
    setUploadSuccess(false);

    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('No se encontró la hoja de trabajo');
      }

      const data: ProspectoExcelRow[] = [];
      const validationErrors: string[] = [];
      const validationWarnings: string[] = [];

      worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        // Skip header row
        if (rowNumber === 1) return;

        const rowData = {
          nombre: row.getCell(1).value?.toString().trim() || '',
          rut: row.getCell(2).value?.toString().trim() || '',
          email: row.getCell(3).value?.toString().trim() || '',
          telefono: row.getCell(4).value?.toString().trim() || '',
          monto_deuda: row.getCell(5).value?.toString().trim() || '0',
          url_informe: row.getCell(6).value?.toString().trim() || undefined,
        };

        const validation = validateRow(rowData, rowNumber);

        // Si hay error crítico, no se carga la fila
        if (validation.error) {
          validationErrors.push(validation.error);
        } else {
          // Se carga la fila incluso si hay advertencias
          data.push(rowData);
          // Agregar las advertencias a la lista
          validationWarnings.push(...validation.warnings);
        }
      });

      // Mostrar errores críticos si los hay
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
      }

      // Mostrar advertencias siempre (aunque haya datos cargados)
      if (validationWarnings.length > 0) {
        setWarnings(validationWarnings);
      }

      setPreview(data);
      setFileSelected(true);
    } catch (error) {
      console.error('Error al leer el archivo:', error);
      setErrors(['Error al procesar el archivo Excel. Verifica que el formato sea correcto.']);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // MANEJADOR DEL FORM - ONSUBMIT
  // ============================================================
  const onSubmit = async (data: UploadFormData) => {
    if (!data.archivo || data.archivo.length === 0) {
      setErrors(['Debes seleccionar un archivo']);
      return;
    }

    // Validar nombre de origen si es nueva carga (no modo agregar archivo)
    if (!modoAgregarArchivo && (!data.originName || data.originName.trim().length < 3)) {
      setErrors(['El nombre de la carga es requerido (mínimo 3 caracteres)']);
      return;
    }

    const file = data.archivo[0];

    // Procesar el archivo Excel
    await processExcelFile(file);

    // Guardar el nombre de origen para usar al hacer upload (solo si no estamos agregando a lote)
    if (!modoAgregarArchivo && data.originName) {
      setSelectedOriginName(data.originName);
    }
  };

  // ============================================================
  // MANEJAR UPLOAD A BACKEND
  // ============================================================
  const handleUpload = async () => {
    if (preview.length === 0 || !selectedFile) {
      console.error('No file selected or preview empty');
      return;
    }

    setIsUploading(true);

    try {
      const file = selectedFile;

      // Enviar el archivo al backend (con lote_id si estamos agregando a un lote existente)
      const response = await importacionesService.importar(
        file, 
        loteActivo?.nombre || selectedOriginName,
        loteActivo?.id
      );
      
      console.log('📥 Respuesta del servidor:', response);
      console.log('📥 response.lote:', response.lote);
      console.log('📥 response.procesamiento:', response.procesamiento);
      console.log('📥 response.data:', response.data);

      // Actualizar el lote activo con la respuesta
      if (response.lote) {
        console.log('✅ Lote encontrado, seteando loteActivo...');
        const archivosDelLote = response.lote.importaciones?.map(imp => ({
          nombre: imp.nombre_archivo,
          registros: 0, // Se actualizará cuando termine
          estado: imp.estado,
        })) || [];

        const nuevoLote = {
          id: response.lote.id,
          nombre: response.lote.nombre,
          totalArchivos: response.lote.total_archivos,
          totalRegistros: response.lote.total_registros,
          archivos: archivosDelLote,
        };
        console.log('✅ Nuevo loteActivo:', nuevoLote);
        setLoteActivo(nuevoLote);
      } else {
        console.log('❌ response.lote es null o undefined');
      }

      // Verificar si es procesamiento en background
      if (response.procesamiento === 'background') {
        // Iniciar tracking del lote (solo si no hay uno activo con el mismo ID)
        if (response.lote && (!loteEnStore || loteEnStore.id !== response.lote.id)) {
          iniciarTrackingLote(response.lote.id, response.lote.nombre);
        }

        // Iniciar tracking de esta importación específica
        setImportacionActualId(response.data.id);
        setImportacionTerminada(false);
        setProgresoActual({
          porcentaje: 0,
          registrosExitosos: 0,
          estado: 'pendiente',
        });

        // Mostrar toast informativo
        toast.info('Archivo en proceso', {
          description: `"${file.name}" se está procesando. Esperá a que termine para agregar otro.`,
          duration: 5000,
        });

        setIsUploading(false);
        setUploadSuccess(true);
        console.log('✅ Background: uploadSuccess=true, importacionActualId=', response.data.id);

      } else {
        // Procesamiento directo (archivos pequeños) - ya terminó
        console.log('✅ Importación directa exitosa:');
        console.log('   ID Importación:', response.data?.id);
        console.log('   Lote:', response.lote);
        console.log('   Resumen:', response.resumen);

        // Marcar como terminada inmediatamente
        setImportacionTerminada(true);
        setProgresoActual({
          porcentaje: 100,
          registrosExitosos: response.resumen?.registros_exitosos ?? 0,
          estado: 'completado',
        });

        toast.success('Archivo importado', {
          description: `Se importaron ${response.resumen?.registros_exitosos || 0} registros.`,
          duration: 5000,
        });

        setIsUploading(false);
        setUploadSuccess(true);
        console.log('✅ Directo: uploadSuccess=true, importacionTerminada=true');
      }

    } catch (error) {
      console.error('Error al importar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      toast.error('Error al importar', {
        description: errorMessage,
        duration: 8000,
      });
      
      setErrors([`Error al importar los prospectos: ${errorMessage}`]);
      setIsUploading(false);
    }
  };

  // ============================================================
  // RESET DEL FORMULARIO
  // ============================================================
  const handleReset = () => {
    reset();
    // Resetear el input de archivo manualmente para evitar warning de controlled/uncontrolled
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setPreview([]);
    setErrors([]);
    setWarnings([]);
    setUploadSuccess(false);
    setFileSelected(false);
    setSelectedOriginName('');
    setSelectedFile(null);
    setLoteActivo(null);
    setModoAgregarArchivo(false);
    // Limpiar estado de progreso
    setImportacionActualId(null);
    setImportacionTerminada(false);
    setProgresoActual(null);
  };

  // ============================================================
  // AGREGAR OTRO ARCHIVO AL LOTE
  // ============================================================
  const handleAgregarOtroArchivo = () => {
    // Mantener el lote activo pero resetear el resto
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setPreview([]);
    setErrors([]);
    setWarnings([]);
    setUploadSuccess(false);
    setFileSelected(false);
    setSelectedFile(null);
    setModoAgregarArchivo(true);
    // Limpiar estado de progreso
    setImportacionActualId(null);
    setImportacionTerminada(false);
    setProgresoActual(null);
  };

  // ============================================================
  // FINALIZAR LOTE Y CERRAR
  // ============================================================
  const handleFinalizarLote = () => {
    toast.success('Lote completado', {
      description: `Carga "${loteActivo?.nombre}" con ${loteActivo?.totalArchivos} archivo(s) finalizada.`,
      duration: 5000,
    });
    handleReset();
    onSuccess?.();
  };

  return (
    <div className="space-y-6">
      {/* Instrucciones */}
      <div className="bg-segal-blue/10 border border-segal-blue/20 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 text-segal-blue shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-segal-dark mb-2">Formato requerido del archivo Excel:</p>
            <ul className="list-disc list-inside text-sm space-y-1 text-segal-dark/80">
              <li>Columna A: <strong>Nombre</strong> - Nombre completo del prospecto</li>
              <li>Columna B: <strong>RUT</strong> - RUT chileno (ej: 12345678 o 12345678K)</li>
              <li>Columna C: <strong>Email</strong> - Correo electrónico válido</li>
              <li>Columna D: <strong>Teléfono</strong> - Número de teléfono</li>
              <li>Columna E: <strong>Monto Deuda</strong> - Monto en pesos (número)</li>
              <li>Columna F: <strong>URL Informe</strong> - Enlace al informe (opcional)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Indicador de lote activo cuando se está agregando otro archivo */}
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

      {/* Formulario de carga - Solo si no hay archivo seleccionado o no hay preview */}
      {!fileSelected && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Campo: Nombre de Origen - Solo si no estamos agregando a un lote existente */}
          {!modoAgregarArchivo && (
            <div className="space-y-2">
              <Label
                htmlFor="originName"
                className="block text-sm font-semibold text-segal-dark"
              >
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
                Este nombre agrupará todos los archivos que subas para esta carga.
              </p>
            </div>
          )}

          {/* Campo: Archivo */}
          <div className="space-y-2">
            <Label
              htmlFor="archivo"
              className="block text-sm font-semibold text-segal-dark"
            >
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
                          <p className="text-xs text-segal-blue mt-2 underline">Click para cambiar archivo</p>
                        </>
                      ) : (
                        <>
                          <Upload className={`w-12 h-12 mb-4 ${
                            formErrors.archivo ? 'text-segal-red' : 'text-segal-blue'
                          }`} />
                          <p className="mb-2 text-sm text-segal-dark">
                            <span className="font-bold text-segal-dark">Click para subir</span> o arrastra el archivo aquí
                          </p>
                          <p className="text-xs text-segal-dark/60 font-medium">Archivos Excel (.xlsx, .xls)</p>
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
                        onChange(e.target.files);
                        // Guardar el archivo en el estado para usarlo luego en upload
                        if (e.target.files?.[0]) {
                          setSelectedFile(e.target.files[0]);
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

          {/* Botones de acción */}
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
                <><span className="animate-spin mr-2">⚙️</span>Procesando...</>
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

      {/* Errores de validación del Excel */}
      {errors.length > 0 && (
        <div className="bg-segal-red/10 border border-segal-red/30 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-segal-red shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-segal-red mb-2">Se encontraron {errors.length} error{errors.length !== 1 ? 'es' : ''}:</p>
              <ul className="list-disc pl-6 space-y-1 max-h-40 overflow-y-auto text-sm text-segal-red/90">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Advertencias de validación del Excel */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50/80 border border-yellow-300/50 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-yellow-800 mb-2">⚠️ {warnings.length} advertencia{warnings.length !== 1 ? 's' : ''}:</p>
              <ul className="list-disc pl-6 space-y-1 max-h-40 overflow-y-auto text-sm text-yellow-700">
                {warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
              <p className="text-xs text-yellow-600 mt-2 italic">Los datos se cargarán de todas maneras. Revisa estos campos en el backend.</p>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de éxito con opción de agregar más archivos */}
      {uploadSuccess && loteActivo && (
        <div className="space-y-4">
          {/* Header del lote */}
          <div className="bg-gradient-to-r from-segal-blue/10 to-segal-turquoise/10 border border-segal-blue/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-6 w-6 text-segal-blue" />
              <div>
                <p className="font-bold text-segal-dark">Carga: "{loteActivo.nombre}"</p>
                <p className="text-sm text-segal-dark/60">
                  {loteActivo.totalArchivos} archivo{loteActivo.totalArchivos !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de archivos en el lote */}
          {loteActivo.archivos.length > 0 && (
            <div className="bg-white border border-segal-blue/10 rounded-lg p-4">
              <p className="text-sm font-semibold text-segal-dark mb-3">Archivos en este lote:</p>
              <div className="space-y-2">
                {loteActivo.archivos.map((archivo, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 px-3 bg-segal-blue/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-segal-blue" />
                      <span className="text-sm text-segal-dark">{archivo.nombre}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      archivo.estado === 'completado' 
                        ? 'bg-segal-green/20 text-segal-green' 
                        : archivo.estado === 'procesando' || archivo.estado === 'pendiente'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {archivo.estado === 'completado' ? '✓ Completado' : 
                       archivo.estado === 'procesando' ? '⏳ Procesando' : 
                       archivo.estado === 'pendiente' ? '⏳ Pendiente' : archivo.estado}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado del archivo actual - Procesando */}
          {!importacionTerminada && progresoActual && (
            <div className="bg-segal-blue/5 border border-segal-blue/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Loader className="h-5 w-5 text-segal-blue animate-spin" />
                <div className="flex-1">
                  <p className="font-semibold text-segal-dark">
                    {progresoActual.estado === 'pendiente' ? 'En cola...' : 'Procesando...'}
                  </p>
                  <p className="text-sm text-segal-dark/60">{selectedFile?.name}</p>
                </div>
              </div>
              
              <Progress value={progresoActual.porcentaje} className="h-2" />
              
              <div className="flex justify-between text-sm text-segal-dark/70">
                <span>{progresoActual.registrosExitosos.toLocaleString('es-CL')} registros procesados</span>
                <span className="font-medium text-segal-blue">{progresoActual.porcentaje}%</span>
              </div>

              <div className="flex items-center gap-2 text-sm bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-700">Esperá a que termine antes de agregar otro archivo.</span>
              </div>
            </div>
          )}

          {/* Estado del archivo actual - Completado */}
          {importacionTerminada && progresoActual?.estado === 'completado' && (
            <div className="bg-segal-green/10 border border-segal-green/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-segal-green shrink-0" />
                <div>
                  <p className="font-semibold text-segal-green">¡Archivo procesado exitosamente!</p>
                  <p className="text-sm text-segal-green/80 mt-1">
                    "{selectedFile?.name}" - {progresoActual.registrosExitosos.toLocaleString('es-CL')} registros importados
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Estado del archivo actual - Fallido */}
          {importacionTerminada && progresoActual?.estado === 'fallido' && (
            <div className="bg-segal-red/10 border border-segal-red/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-segal-red shrink-0" />
                <div>
                  <p className="font-semibold text-segal-red">Error al procesar archivo</p>
                  <p className="text-sm text-segal-red/80 mt-1">
                    "{selectedFile?.name}" - Hubo un error durante el procesamiento
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción - SOLO si terminó el procesamiento */}
          {importacionTerminada && (
            <div className="flex justify-between items-center pt-2">
              <p className="text-sm text-segal-dark/60">
                ¿Tenés más archivos para esta carga?
              </p>
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
      )}

      {/* Mensaje de éxito simple (sin lote - compatibilidad) */}
      {uploadSuccess && !loteActivo && (
        <div className="space-y-4">
          <div className="bg-segal-green/10 border border-segal-green/30 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <CheckCircle2 className="h-8 w-8 text-segal-green animate-bounce" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg text-segal-green">¡Importación Exitosa!</p>
                <p className="text-sm text-segal-green/90 mt-1">
                  Se han importado correctamente <span className="font-semibold">{preview.length}</span> prospecto{preview.length !== 1 ? 's' : ''}.
                </p>
                <p className="text-sm text-segal-green/90 mt-2">
                  Origen: <span className="font-semibold">{selectedOriginName}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado de subida */}
      {isUploading && (
        <div className="space-y-4 bg-gradient-to-br from-segal-blue/5 to-segal-turquoise/5 rounded-xl border border-segal-blue/20 p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-segal-blue/10 flex items-center justify-center">
              <Loader className="h-6 w-6 text-segal-blue animate-spin" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-segal-dark">
                Subiendo archivo...
              </p>
              <p className="text-sm text-segal-dark/60">
                Esto puede tomar unos segundos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vista previa de datos */}
      {preview.length > 0 && !uploadSuccess && !isUploading && (
        <div className="space-y-4 bg-white rounded-lg border border-segal-blue/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-segal-dark">Vista Previa de Datos</h3>
              <p className="text-sm text-segal-dark/70 mt-1">
                <span className="font-medium text-segal-green">{preview.length} registro{preview.length !== 1 ? 's' : ''} válido{preview.length !== 1 ? 's' : ''}</span>
                {errors.length > 0 && <span className="text-segal-red/80 ml-2">• {errors.length} error{errors.length !== 1 ? 'es' : ''}</span>}
              </p>
              <p className="text-sm text-segal-dark/60 mt-2">
                Origen: <span className="font-semibold text-segal-blue">{selectedOriginName}</span>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
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
                  <TableHead className="text-segal-dark font-bold">Teléfono</TableHead>
                  <TableHead className="text-segal-dark font-bold">Monto Deuda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.slice(0, 10).map((row, i) => (
                  <TableRow key={i} className="hover:bg-segal-blue/5 border-b border-segal-blue/5">
                    <TableCell className="font-medium text-segal-dark">{i + 1}</TableCell>
                    <TableCell className="text-segal-dark/80">{row.nombre}</TableCell>
                    <TableCell className="text-segal-dark/80 text-sm font-medium text-segal-blue">{row.rut}</TableCell>
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
              onClick={handleUpload}
              disabled={loading || preview.length === 0 || errors.length > 0}
              size="lg"
              className="bg-segal-blue hover:bg-segal-blue/90 text-white disabled:opacity-50"
            >
              {loading ? (
                <><span className="animate-spin mr-2">⚙️</span>Importando...</>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar {preview.length} prospecto{preview.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

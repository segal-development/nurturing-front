import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ExcelJS from 'exceljs';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { importacionesService } from '@/api/importaciones.service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProspectoExcelRow } from '@/types/prospecto';

// ============================================================
// VALIDACIÓN CON ZOD
// ============================================================
const uploadFormSchema = z.object({
  originName: z
    .string()
    .min(1, 'El nombre de origen es requerido')
    .min(3, 'El nombre de origen debe tener al menos 3 caracteres')
    .max(50, 'El nombre de origen no puede exceder 50 caracteres'),
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const [selectedOriginName, setSelectedOriginName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

    const file = data.archivo[0];

    // Procesar el archivo Excel
    await processExcelFile(file);

    // Guardar el nombre de origen para usar al hacer upload
    setSelectedOriginName(data.originName);
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
    setUploadProgress(0);

    try {
      const file = selectedFile;

      // Progreso inicial
      setUploadProgress(20);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Enviar el archivo al backend
      setUploadProgress(40);
      const response = await importacionesService.importar(file, selectedOriginName);
      setUploadProgress(80);

      console.log('✅ Importación exitosa:');
      console.log('   ID Importación:', response.data?.id);
      console.log('   Nombre de origen:', selectedOriginName);
      console.log('   Cantidad de prospectos:', preview.length);
      console.log('   Resumen:', response.resumen);

      // Completar la barra de progreso
      setUploadProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setIsUploading(false);
      setUploadSuccess(true);

      // Cerramos el diálogo después de 2 segundos
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error) {
      console.error('Error al importar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
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

      {/* Formulario de carga - Solo si no hay archivo seleccionado o no hay preview */}
      {!fileSelected && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Campo: Nombre de Origen */}
          <div className="space-y-2">
            <Label
              htmlFor="originName"
              className="block text-sm font-semibold text-segal-dark"
            >
              Nombre de Origen
              <span className="text-segal-red ml-1">*</span>
            </Label>
            <Controller
              name="originName"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="originName"
                  placeholder="Ej: Importación Enero 2025"
                  className={`border-none ${
                    formErrors.originName ? 'border-segal-red' : ''
                  }`}
                />
              )}
            />
            {formErrors.originName && (
              <p className="text-sm text-segal-red">{formErrors.originName.message}</p>
            )}
          </div>

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

      {/* Mensaje de éxito */}
      {uploadSuccess && (
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
                <p className="text-xs text-segal-green/70 mt-2">
                  El diálogo se cerrará automáticamente en unos segundos...
                </p>
              </div>
            </div>
          </div>

          {/* Success Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-segal-green/5 rounded-lg p-3 text-center border border-segal-green/10">
              <p className="text-2xl font-bold text-segal-green">{preview.length}</p>
              <p className="text-xs text-segal-dark/60 mt-1">Prospectos cargados</p>
            </div>
            <div className="bg-segal-blue/5 rounded-lg p-3 text-center border border-segal-blue/10">
              <p className="text-2xl font-bold text-segal-blue">0</p>
              <p className="text-xs text-segal-dark/60 mt-1">Errores</p>
            </div>
            <div className="bg-segal-turquoise/5 rounded-lg p-3 text-center border border-segal-turquoise/10">
              <p className="text-2xl font-bold text-segal-turquoise">100%</p>
              <p className="text-xs text-segal-dark/60 mt-1">Tasa éxito</p>
            </div>
          </div>
        </div>
      )}

      {/* Barra de progreso de upload */}
      {isUploading && (
        <div className="space-y-3 bg-segal-blue/5 rounded-lg border border-segal-blue/20 p-4">
          <div className="flex items-center gap-3">
            <Loader className="h-5 w-5 text-segal-blue animate-spin" />
            <div className="flex-1">
              <p className="font-semibold text-segal-dark">Cargando prospectos...</p>
              <p className="text-sm text-segal-dark/60">{uploadProgress}% completado</p>
            </div>
          </div>
          <div className="w-full h-2 bg-segal-blue/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-segal-blue to-segal-turquoise rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
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

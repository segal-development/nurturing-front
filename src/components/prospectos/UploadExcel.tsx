/**
 * Re-export del componente UploadExcel refactorizado.
 * 
 * El componente ahora vive en ./UploadExcel/ con:
 * - UploadExcel.tsx - Componente principal (UI)
 * - useUploadExcel.ts - Hook con logica de estado
 * - validation.ts - Funciones de validacion
 * - types.ts - Tipos e interfaces
 */

export { UploadExcel } from './UploadExcel/UploadExcel'

/**
 * Hook para validación de archivos Excel
 * Single Responsibility: Solo validación de datos Excel
 * 
 * Funciones pequeñas, early returns, tipos estrictos
 */

import { useState, useCallback } from 'react';
import ExcelJS from 'exceljs';
import type { ProspectoExcelRow } from '@/types/prospecto';
import type { ExcelValidationResult, RowValidationResult } from './types';

// ============================================================================
// Validadores puros (sin estado, fáciles de testear)
// ============================================================================

const RUT_REGEX = /^\d{7,9}[Kk]?$/;
const EMAIL_REGEX = /\S+@\S+\.\S+/;

function isValidRut(rut: string): boolean {
  if (!rut) return false;
  const cleanRut = rut.toString().toUpperCase().replace(/[.-]/g, '');
  return RUT_REGEX.test(cleanRut);
}

function isValidEmail(email: string): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email);
}

function isValidMontoDeuda(monto: string | number | undefined): boolean {
  if (monto === undefined || monto === null || monto === '') return false;
  const parsed = parseFloat(String(monto));
  return !isNaN(parsed) && parsed >= 0;
}

function getCellValue(row: ExcelJS.Row, index: number): string {
  return row.getCell(index).value?.toString().trim() || '';
}

// ============================================================================
// Validación de fila individual
// ============================================================================

function validateRow(row: ProspectoExcelRow, rowNumber: number): RowValidationResult {
  const warnings: string[] = [];

  // Early return: nombre es obligatorio
  if (!row.nombre?.trim()) {
    return {
      isValid: false,
      error: `Fila ${rowNumber}: Falta nombre (campo obligatorio)`,
      warnings: [],
    };
  }

  // Early return: monto de deuda inválido
  if (!isValidMontoDeuda(row.monto_deuda)) {
    return {
      isValid: false,
      error: `Fila ${rowNumber}: Monto de deuda inválido (${row.monto_deuda || 'vacío'})`,
      warnings: [],
    };
  }

  // Advertencias (no bloquean)
  if (!isValidRut(row.rut)) {
    warnings.push(`Fila ${rowNumber}: RUT inválido (${row.rut || 'vacío'})`);
  }

  if (!isValidEmail(row.email)) {
    warnings.push(`Fila ${rowNumber}: Email inválido (${row.email || 'vacío'})`);
  }

  if (!row.telefono?.trim()) {
    warnings.push(`Fila ${rowNumber}: Teléfono vacío`);
  }

  return { isValid: true, error: null, warnings };
}

// ============================================================================
// Extracción de datos del Excel
// ============================================================================

function extractRowData(row: ExcelJS.Row): ProspectoExcelRow {
  return {
    nombre: getCellValue(row, 1),
    rut: getCellValue(row, 2),
    email: getCellValue(row, 3),
    telefono: getCellValue(row, 4),
    monto_deuda: getCellValue(row, 5) || '0',
    url_informe: getCellValue(row, 6) || undefined,
  };
}

// ============================================================================
// Procesamiento del Excel completo
// ============================================================================

async function processExcelFile(file: File): Promise<ExcelValidationResult> {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw new Error('No se encontró la hoja de trabajo en el archivo');
  }

  const validRows: ProspectoExcelRow[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  let totalRows = 0;

  worksheet.eachRow((row, rowNumber) => {
    // Skip header
    if (rowNumber === 1) return;

    totalRows++;
    const rowData = extractRowData(row);
    const validation = validateRow(rowData, rowNumber);

    if (!validation.isValid && validation.error) {
      errors.push(validation.error);
      return;
    }

    validRows.push(rowData);
    warnings.push(...validation.warnings);
  });

  return {
    rows: validRows,
    errors,
    warnings,
    totalRows,
    validRows: validRows.length,
  };
}

// ============================================================================
// Hook
// ============================================================================

interface UseExcelValidationReturn {
  isValidating: boolean;
  validationResult: ExcelValidationResult | null;
  validateFile: (file: File) => Promise<ExcelValidationResult>;
  clearValidation: () => void;
  error: string | null;
}

export function useExcelValidation(): UseExcelValidationReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ExcelValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(async (file: File): Promise<ExcelValidationResult> => {
    setIsValidating(true);
    setError(null);

    try {
      const result = await processExcelFile(file);
      setValidationResult(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar el archivo';
      setError(message);
      throw err;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
    setError(null);
  }, []);

  return {
    isValidating,
    validationResult,
    validateFile,
    clearValidation,
    error,
  };
}

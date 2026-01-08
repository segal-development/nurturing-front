/**
 * Store minimo para trackear si hay una importacion procesando.
 * Usado para bloquear el cierre del modal de upload.
 */

import { create } from 'zustand'

interface UploadProgressStore {
  isProcessing: boolean
  setIsProcessing: (value: boolean) => void
}

export const useUploadProgressStore = create<UploadProgressStore>((set) => ({
  isProcessing: false,
  setIsProcessing: (value) => set({ isProcessing: value }),
}))

// Selector
export const selectIsProcessing = (state: UploadProgressStore) => state.isProcessing

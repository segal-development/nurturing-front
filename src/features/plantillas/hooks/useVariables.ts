/**
 * Hook para manejar variables en plantillas
 * Provee funcionalidad de inserción y autocompletado
 */

import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { plantillasService } from '@/api/plantillas.service'
import type { VariableDisponible } from '@/types/plantilla'

interface UseVariablesOptions {
  enabled?: boolean
}

interface UseVariablesReturn {
  // Data
  variables: {
    basicas: VariableDisponible[]
    sistema: VariableDisponible[]
    metadata: VariableDisponible[]
  } | null
  allVariables: VariableDisponible[]
  isLoading: boolean
  error: Error | null

  // Autocomplete state
  showAutocomplete: boolean
  autocompletePosition: { top: number; left: number }
  autocompleteFilter: string
  filteredVariables: VariableDisponible[]

  // Actions
  insertVariable: (variable: string, textarea: HTMLTextAreaElement | null) => string
  handleTextareaKeyDown: (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    value: string,
    onChange: (value: string) => void
  ) => void
  handleTextareaChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    onChange: (value: string) => void
  ) => void
  closeAutocomplete: () => void
  selectAutocompleteItem: (
    variable: VariableDisponible,
    textarea: HTMLTextAreaElement | null,
    value: string,
    onChange: (value: string) => void
  ) => void
}

export function useVariables(options: UseVariablesOptions = {}): UseVariablesReturn {
  const { enabled = true } = options

  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 })
  const [autocompleteFilter, setAutocompleteFilter] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Fetch variables
  const { data, isLoading, error } = useQuery({
    queryKey: ['plantillas', 'variables-disponibles'],
    queryFn: () => plantillasService.getVariablesDisponibles(),
    staleTime: 5 * 60 * 1000,
    enabled,
  })

  // Flatten all variables for autocomplete
  const allVariables: VariableDisponible[] = data
    ? [...data.basicas, ...data.sistema, ...data.metadata]
    : []

  // Filter variables based on current input
  const filteredVariables = autocompleteFilter
    ? allVariables.filter(
        (v) =>
          v.key.toLowerCase().includes(autocompleteFilter.toLowerCase()) ||
          v.label.toLowerCase().includes(autocompleteFilter.toLowerCase())
      )
    : allVariables

  /**
   * Insert a variable at cursor position in textarea
   */
  const insertVariable = useCallback(
    (variable: string, textarea: HTMLTextAreaElement | null): string => {
      if (!textarea) return variable

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value

      const newValue = value.substring(0, start) + variable + value.substring(end)

      // Set cursor after inserted variable
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length
        textarea.focus()
      }, 0)

      return newValue
    },
    []
  )

  /**
   * Handle keydown in textarea for autocomplete navigation
   */
  const handleTextareaKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLTextAreaElement>,
      value: string,
      onChange: (value: string) => void
    ) => {
      if (!showAutocomplete) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < filteredVariables.length - 1 ? prev + 1 : 0
          )
          break

        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredVariables.length - 1
          )
          break

        case 'Enter':
        case 'Tab':
          if (filteredVariables.length > 0) {
            e.preventDefault()
            const selected = filteredVariables[selectedIndex]
            if (selected) {
              selectAutocompleteItem(
                selected,
                e.currentTarget,
                value,
                onChange
              )
            }
          }
          break

        case 'Escape':
          e.preventDefault()
          setShowAutocomplete(false)
          break
      }
    },
    [showAutocomplete, filteredVariables, selectedIndex]
  )

  /**
   * Handle textarea change to detect {{ and show autocomplete
   */
  const handleTextareaChange = useCallback(
    (
      e: React.ChangeEvent<HTMLTextAreaElement>,
      onChange: (value: string) => void
    ) => {
      const textarea = e.target
      const value = textarea.value
      const cursorPos = textarea.selectionStart

      // Find if we're typing after {{
      const textBeforeCursor = value.substring(0, cursorPos)
      const lastOpenBraces = textBeforeCursor.lastIndexOf('{{')

      if (lastOpenBraces !== -1) {
        const textAfterBraces = textBeforeCursor.substring(lastOpenBraces + 2)
        const hasClosingBraces = textAfterBraces.includes('}}')

        // Only show autocomplete if we're between {{ and no }}
        if (!hasClosingBraces && /^[a-zA-Z0-9_.]*$/.test(textAfterBraces)) {
          setAutocompleteFilter(textAfterBraces)
          setShowAutocomplete(true)
          setSelectedIndex(0)

          // Calculate position (simplified - you might want to use a library for better positioning)
          const rect = textarea.getBoundingClientRect()
          setAutocompletePosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
          })
        } else {
          setShowAutocomplete(false)
        }
      } else {
        setShowAutocomplete(false)
      }

      onChange(value)
    },
    []
  )

  /**
   * Close autocomplete dropdown
   */
  const closeAutocomplete = useCallback(() => {
    setShowAutocomplete(false)
    setAutocompleteFilter('')
    setSelectedIndex(0)
  }, [])

  /**
   * Select an item from autocomplete
   */
  const selectAutocompleteItem = useCallback(
    (
      variable: VariableDisponible,
      textarea: HTMLTextAreaElement | null,
      value: string,
      onChange: (value: string) => void
    ) => {
      if (!textarea) return

      const cursorPos = textarea.selectionStart
      const textBeforeCursor = value.substring(0, cursorPos)
      const lastOpenBraces = textBeforeCursor.lastIndexOf('{{')

      if (lastOpenBraces !== -1) {
        // Replace from {{ to cursor with the full variable
        const before = value.substring(0, lastOpenBraces)
        const after = value.substring(cursorPos)
        const variableTag = `{{${variable.key}}}`
        const newValue = before + variableTag + after

        onChange(newValue)

        // Set cursor after the variable
        setTimeout(() => {
          const newCursorPos = lastOpenBraces + variableTag.length
          textarea.selectionStart = textarea.selectionEnd = newCursorPos
          textarea.focus()
        }, 0)
      }

      closeAutocomplete()
    },
    [closeAutocomplete]
  )

  return {
    variables: data ?? null,
    allVariables,
    isLoading,
    error: error as Error | null,

    showAutocomplete,
    autocompletePosition,
    autocompleteFilter,
    filteredVariables,

    insertVariable,
    handleTextareaKeyDown,
    handleTextareaChange,
    closeAutocomplete,
    selectAutocompleteItem,
  }
}

/**
 * Dropdown de autocompletado para variables
 * Aparece al escribir {{ en el editor
 */

import { useEffect, useRef } from 'react'
import type { VariableDisponible } from '@/types/plantilla'

interface VariableAutocompleteProps {
  variables: VariableDisponible[]
  selectedIndex: number
  onSelect: (variable: VariableDisponible) => void
  onClose: () => void
  filter: string
}

export function VariableAutocomplete({
  variables,
  selectedIndex,
  onSelect,
  onClose,
  filter,
}: VariableAutocompleteProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  // Scroll selected item into view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (variables.length === 0) {
    return (
      <div
        ref={listRef}
        className="absolute z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 px-3 text-sm text-gray-500"
      >
        No se encontraron variables para "{filter}"
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className="absolute z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto min-w-64"
    >
      <div className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
        Variables disponibles {filter && `(filtro: "${filter}")`}
      </div>
      {variables.slice(0, 15).map((variable, index) => (
        <button
          key={variable.key}
          ref={index === selectedIndex ? selectedRef : null}
          type="button"
          onClick={() => onSelect(variable)}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
            index === selectedIndex
              ? 'bg-segal-blue/10 dark:bg-segal-turquoise/10'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-segal-blue dark:text-segal-turquoise shrink-0">
            {variable.key}
          </code>
          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {variable.label}
          </span>
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 truncate max-w-24">
            {variable.ejemplo}
          </span>
        </button>
      ))}
      {variables.length > 15 && (
        <div className="px-3 py-1.5 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800">
          +{variables.length - 15} más...
        </div>
      )}
      <div className="px-3 py-1.5 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800 flex gap-3">
        <span>↑↓ navegar</span>
        <span>Enter seleccionar</span>
        <span>Esc cerrar</span>
      </div>
    </div>
  )
}

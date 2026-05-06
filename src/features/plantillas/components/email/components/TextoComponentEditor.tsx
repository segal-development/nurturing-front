/**
 * Editor del componente Texto
 * Usa TipTap para edición WYSIWYG con soporte para:
 * - Negrita, itálica, subrayado
 * - Alineación
 * - Colores
 * - Enlaces
 * - Listas
 * - Variables {{variable}}
 */

import { useRef, useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import type { TextoComponentFormData } from '@/features/plantillas/schemas/plantillaSchemas'

interface TextoComponentEditorProps {
  componente: TextoComponentFormData
  onUpdate: (componente: TextoComponentFormData) => void
}

export function TextoComponentEditor({
  componente,
  onUpdate,
}: TextoComponentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  // Valores por defecto
  const contenido = componente.contenido || {
    texto: '',
    html: '',
    alineacion: 'left' as const,
  }

  // Handler para cambios en el editor
  const handleContentChange = useCallback((html: string) => {
    onUpdate({
      ...componente,
      contenido: {
        ...contenido,
        texto: html, // Guardamos el HTML como texto
        html: html,  // También en campo html para compatibilidad
      },
    })
  }, [componente, contenido, onUpdate])

  // Método para insertar variable desde el panel externo
  const insertVariable = useCallback((variable: string) => {
    const editorElement = editorRef.current
    if (editorElement && (editorElement as any).insertVariable) {
      (editorElement as any).insertVariable(variable)
      toast.success(`Variable ${variable} insertada`, { duration: 1500 })
    }
  }, [])

  // Exponer el método de inserción para uso externo
  // Esto permite que el VariablesPanel inserte variables
  if (typeof window !== 'undefined') {
    (window as any).__insertVariableToTextEditor = insertVariable
  }

  return (
    <div className="space-y-4">
      {/* Editor WYSIWYG */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">
          Contenido <span className="text-segal-red">*</span>
        </Label>
        <div
          ref={editorRef}
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
          }}
          onDrop={(e) => {
            const variable = e.dataTransfer.getData('application/x-variable') || 
                            e.dataTransfer.getData('text/plain')
            if (variable && variable.startsWith('{{')) {
              // El editor TipTap maneja el drop internamente
              toast.success(`Variable insertada`, { duration: 1500 })
            }
          }}
        >
          <RichTextEditor
            content={contenido.html || contenido.texto || ''}
            onChange={handleContentChange}
            placeholder="Escribe el contenido del texto... Puedes arrastrar variables aquí"
            className="min-h-[200px]"
          />
        </div>
        <p className="text-xs text-segal-dark/60">
          💡 Usa la barra de herramientas para dar formato. Arrastra variables desde el panel derecho.
        </p>
      </div>

      {/* Preview del HTML generado (colapsable para debug) */}
      <details className="border border-segal-blue/10 rounded-lg">
        <summary className="px-3 py-2 text-xs text-segal-dark/60 cursor-pointer hover:bg-segal-blue/5">
          Ver HTML generado
        </summary>
        <pre className="p-3 text-xs bg-gray-50 overflow-x-auto max-h-40 overflow-y-auto">
          {contenido.html || contenido.texto || '(vacío)'}
        </pre>
      </details>
    </div>
  )
}

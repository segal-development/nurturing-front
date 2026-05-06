/**
 * RichTextEditor - Editor WYSIWYG basado en TipTap
 * 
 * Features:
 * - Negrita, itálica, subrayado
 * - Alineación (izq, centro, der)
 * - Colores de texto
 * - Enlaces
 * - Listas
 * - Soporte para variables {{variable}}
 * - Output HTML limpio para emails
 */

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Link as LinkIcon,
  List,
  ListOrdered,
  Undo,
  Redo,
  Palette,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  onInsertVariable?: (callback: (variable: string) => void) => void
}

// Colores predefinidos para el selector
const PRESET_COLORS = [
  '#000000', '#333333', '#666666', '#999999',
  '#1e3a5f', '#2563eb', '#0891b2', '#059669',
  '#dc2626', '#ea580c', '#ca8a04', '#7c3aed',
]

// Toolbar Button Component
function ToolbarButton({ 
  onClick, 
  isActive = false, 
  disabled = false,
  title,
  children 
}: { 
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-1.5 rounded transition-colors
        ${isActive 
          ? 'bg-segal-blue text-white' 
          : 'text-segal-dark hover:bg-segal-blue/10'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  )
}

// Toolbar Separator
function ToolbarSeparator() {
  return <div className="w-px h-6 bg-gray-300 mx-1" />
}

// Link Input Popover
function LinkPopover({ editor }: { editor: Editor }) {
  const [url, setUrl] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const setLink = useCallback(() => {
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
    setUrl('')
    setIsOpen(false)
  }, [editor, url])

  const openPopover = () => {
    const previousUrl = editor.getAttributes('link').href
    setUrl(previousUrl || '')
    setIsOpen(true)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={openPopover}
          title="Insertar enlace"
          className={`
            p-1.5 rounded transition-colors
            ${editor.isActive('link') 
              ? 'bg-segal-blue text-white' 
              : 'text-segal-dark hover:bg-segal-blue/10'
            }
          `}
        >
          <LinkIcon className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          <p className="text-sm font-medium text-segal-dark">Insertar enlace</p>
          <Input
            type="url"
            placeholder="https://ejemplo.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setLink()}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={setLink}
              className="bg-segal-blue hover:bg-segal-blue/90"
            >
              {url ? 'Aplicar' : 'Quitar enlace'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Color Picker Popover
function ColorPopover({ editor }: { editor: Editor }) {
  const [isOpen, setIsOpen] = useState(false)
  const currentColor = editor.getAttributes('textStyle').color || '#000000'

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run()
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Color de texto"
          className="p-1.5 rounded transition-colors text-segal-dark hover:bg-segal-blue/10 flex items-center gap-1"
        >
          <Palette className="h-4 w-4" />
          <div 
            className="w-3 h-3 rounded border border-gray-300" 
            style={{ backgroundColor: currentColor }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-3">
          <p className="text-sm font-medium text-segal-dark">Color de texto</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setColor(color)}
                className={`
                  w-8 h-8 rounded border-2 transition-transform hover:scale-110
                  ${currentColor === color ? 'border-segal-blue' : 'border-gray-200'}
                `}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <Input
              type="text"
              value={currentColor}
              onChange={(e) => setColor(e.target.value)}
              className="flex-1 text-sm font-mono"
              placeholder="#000000"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Main Toolbar Component
function EditorToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-200 bg-gray-50 rounded-t-md">
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Deshacer"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Rehacer"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Negrita"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Itálica"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Subrayado"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Color */}
      <ColorPopover editor={editor} />

      <ToolbarSeparator />

      {/* Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Alinear izquierda"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Centrar"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Alinear derecha"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Lista con viñetas"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Link */}
      <LinkPopover editor={editor} />
    </div>
  )
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Escribe aquí...',
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Desactivar heading ya que no lo necesitamos para emails
        heading: false,
        // Mantener párrafos, listas, etc.
      }),
      TextAlign.configure({
        types: ['paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-segal-blue underline',
        },
      }),
      TextStyle,
      Color,
      Underline,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] px-3 py-2',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false
        
        const variable = event.dataTransfer?.getData('application/x-variable') || 
                        event.dataTransfer?.getData('text/plain')
        
        if (variable && variable.startsWith('{{')) {
          event.preventDefault()
          const { state } = view
          const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
          
          if (coordinates) {
            const tr = state.tr.insertText(variable, coordinates.pos)
            view.dispatch(tr)
            return true
          }
        }
        return false
      },
    },
  })

  // Sincronizar contenido externo
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Exponer método para insertar variables
  useEffect(() => {
    if (editor && editorRef.current) {
      // Crear un método global para insertar variables
      (editorRef.current as any).insertVariable = (variable: string) => {
        editor.chain().focus().insertContent(variable).run()
      }
    }
  }, [editor])

  if (!editor) {
    return (
      <div className={`border border-gray-200 rounded-md ${className}`}>
        <div className="animate-pulse bg-gray-100 h-[200px] rounded-md" />
      </div>
    )
  }

  return (
    <div 
      ref={editorRef}
      className={`border border-gray-200 rounded-md overflow-hidden ${className}`}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      }}
    >
      <EditorToolbar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="bg-white"
      />
      <style>{`
        .ProseMirror {
          min-height: 150px;
          padding: 12px;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
        }
        .ProseMirror ul {
          list-style-type: disc;
        }
        .ProseMirror ol {
          list-style-type: decimal;
        }
        .ProseMirror a {
          color: #1e3a5f;
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}

// Export editor ref type for external use
export type RichTextEditorRef = {
  insertVariable: (variable: string) => void
}

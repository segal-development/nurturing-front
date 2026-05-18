/**
 * Editor de Plantillas Email tipo Mailchimp
 * Permite agregar componentes: logo, texto, botón, separador, footer
 * Con edición visual y preview en tiempo real
 * Soporte para variables dinámicas
 */

import { useState, useEffect, useRef } from 'react'
import {
  Plus,
  Eye,
  AlertCircle,
  CheckCircle2,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { type PlantillaEmailFormData, type EmailComponentFormData } from '../schemas/plantillaSchemas'
import { validarPlantillaEmail } from '../utils/plantillaValidator'
import { EmailComponentEditor } from './email/EmailComponentEditor'
import { EmailPreview } from './email/EmailPreview'
import { VariablesPanel } from './VariablesPanel'
import { toast } from 'sonner'

interface EmailTemplateEditorProps {
  initialData?: Partial<PlantillaEmailFormData>
  onDataChange?: (plantilla: PlantillaEmailFormData) => void
}

type VistaActiva = 'editor' | 'preview'

export function EmailTemplateEditor({
  initialData,
  onDataChange,
}: EmailTemplateEditorProps) {
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('editor')
  const [componenteSeleccionado, setComponenteSeleccionado] = useState<string | null>(null)
  const [showVariablesPanel, setShowVariablesPanel] = useState(true)
  const [activeField, setActiveField] = useState<'asunto' | 'componente' | null>(null)
  const asuntoInputRef = useRef<HTMLInputElement>(null)

  // Estado local para la plantilla
  const [plantilla, setPlantilla] = useState<PlantillaEmailFormData>({
    tipo: 'email',
    nombre: initialData?.nombre || '',
    descripcion: initialData?.descripcion || '',
    activo: initialData?.activo !== false,
    asunto: initialData?.asunto || '',
    modo: initialData?.modo || 'componentes',
    contenido: initialData?.contenido || '',
    componentes: initialData?.componentes || [],
  })
  const contenidoHtmlRef = useRef<HTMLTextAreaElement>(null)

  /**
   * Inserta una variable en el campo activo
   */
  const handleInsertVariable = (variable: string) => {
    // Modo HTML personalizado: insertar en el textarea de HTML
    if (plantilla.modo === 'html_personalizado' && contenidoHtmlRef.current) {
      const textarea = contenidoHtmlRef.current
      const start = textarea.selectionStart ?? plantilla.contenido.length
      const end = textarea.selectionEnd ?? plantilla.contenido.length
      const newValue = plantilla.contenido.substring(0, start) + variable + plantilla.contenido.substring(end)

      setPlantilla({ ...plantilla, contenido: newValue })

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length
        textarea.focus()
      }, 0)

      toast.success(`Variable insertada en el HTML`, { duration: 1500 })
      return
    }

    if (activeField === 'asunto' && asuntoInputRef.current) {
      // Insertar en el asunto
      const input = asuntoInputRef.current
      const start = input.selectionStart ?? plantilla.asunto.length
      const end = input.selectionEnd ?? plantilla.asunto.length
      const newValue = plantilla.asunto.substring(0, start) + variable + plantilla.asunto.substring(end)
      
      setPlantilla({ ...plantilla, asunto: newValue })
      
      // Restaurar cursor
      setTimeout(() => {
        input.selectionStart = input.selectionEnd = start + variable.length
        input.focus()
      }, 0)
      
      toast.success(`Variable insertada en el asunto`, { duration: 1500 })
    } else if (activeField === 'componente' && componenteSeleccionado) {
      // Insertar en el componente de texto seleccionado
      const componente = plantilla.componentes.find(c => c.id === componenteSeleccionado)
      if (componente && componente.tipo === 'texto') {
        const textoActual = componente.contenido?.texto || ''
        const nuevoTexto = textoActual + variable
        
        setPlantilla({
          ...plantilla,
          // Type assertion needed: TypeScript cannot infer discriminated union through map+spread
          componentes: plantilla.componentes.map(c =>
            c.id === componenteSeleccionado
              ? { ...c, contenido: { ...c.contenido, texto: nuevoTexto } }
              : c
          ) as typeof plantilla.componentes,
        })
        
        toast.success(`Variable insertada en el componente de texto`, { duration: 1500 })
      } else {
        toast.info('Selecciona un componente de texto para insertar la variable', { duration: 2000 })
      }
    } else {
      // Si no hay campo activo, intentar insertar en el asunto
      const newValue = plantilla.asunto + variable
      setPlantilla({ ...plantilla, asunto: newValue })
      toast.success(`Variable insertada en el asunto`, { duration: 1500 })
    }
  }

  // Notificar cambios al componente padre
  useEffect(() => {
    onDataChange?.(plantilla)
  }, [plantilla, onDataChange])

  // Validar plantilla
  const validacion = validarPlantillaEmail(plantilla)

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlantilla({ ...plantilla, nombre: e.target.value })
  }

  const handleDescripcionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPlantilla({ ...plantilla, descripcion: e.target.value })
  }

  const handleAsuntoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlantilla({ ...plantilla, asunto: e.target.value })
  }

  const handleActivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlantilla({ ...plantilla, activo: e.target.checked })
  }

  const handleModoChange = (nuevoModo: 'componentes' | 'html_personalizado') => {
    setPlantilla({ ...plantilla, modo: nuevoModo })
  }

  const handleContenidoHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPlantilla({ ...plantilla, contenido: e.target.value })
  }

  /**
   * Agrega un nuevo componente a la plantilla
   */
  const agregarComponente = (tipo: EmailComponentFormData['tipo']) => {
    const nuevoComponente: EmailComponentFormData = {
      id: `comp-${Date.now()}`,
      tipo: tipo as any,
      orden: plantilla.componentes.length,
      contenido: obtenerContenidoInicial(tipo),
    } as EmailComponentFormData

    setPlantilla({
      ...plantilla,
      componentes: [...plantilla.componentes, nuevoComponente],
    })

    setComponenteSeleccionado(nuevoComponente.id)
  }

  /**
   * Actualiza un componente existente
   */
  const actualizarComponente = (componente: EmailComponentFormData) => {
    setPlantilla({
      ...plantilla,
      componentes: plantilla.componentes.map((c) =>
        c.id === componente.id ? componente : c
      ),
    })
  }

  /**
   * Elimina un componente
   */
  const eliminarComponente = (componenteId: string) => {
    setPlantilla({
      ...plantilla,
      componentes: plantilla.componentes.filter((c) => c.id !== componenteId),
    })
    setComponenteSeleccionado(null)
  }

  /**
   * Mueve un componente arriba en la lista
   */
  const moverComponenteArriba = (index: number) => {
    if (index === 0) return

    const nuevosComponentes = [...plantilla.componentes]
    ;[nuevosComponentes[index - 1], nuevosComponentes[index]] = [
      nuevosComponentes[index],
      nuevosComponentes[index - 1],
    ]

    nuevosComponentes.forEach((c, i) => { c.orden = i })

    setPlantilla({ ...plantilla, componentes: nuevosComponentes })
  }

  /**
   * Mueve un componente abajo en la lista
   */
  const moverComponenteAbajo = (index: number) => {
    if (index === plantilla.componentes.length - 1) return

    const nuevosComponentes = [...plantilla.componentes]
    ;[nuevosComponentes[index], nuevosComponentes[index + 1]] = [
      nuevosComponentes[index + 1],
      nuevosComponentes[index],
    ]

    nuevosComponentes.forEach((c, i) => { c.orden = i })

    setPlantilla({ ...plantilla, componentes: nuevosComponentes })
  }

  return (
    <div className="flex gap-4">
      {/* Main Editor */}
      <div className="flex-1 space-y-6 bg-white dark:bg-gray-900 rounded-lg border border-segal-blue/10 dark:border-gray-700 p-6">
        {/* Header con toggle de variables */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-segal-dark dark:text-white">Información General</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowVariablesPanel(!showVariablesPanel)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showVariablesPanel ? (
              <>
                <PanelRightClose className="h-4 w-4 mr-1" />
                Ocultar Variables
              </>
            ) : (
              <>
                <PanelRightOpen className="h-4 w-4 mr-1" />
                Mostrar Variables
              </>
            )}
          </Button>
        </div>

        {/* Información general */}
        <div className="space-y-4">

        {/* Nombre */}
        <div className="space-y-2">
          <Label htmlFor="email-nombre" className="text-sm font-semibold text-segal-dark dark:text-white">
            Nombre de la Plantilla <span className="text-segal-red dark:text-red-400">*</span>
          </Label>
          <Input
            id="email-nombre"
            value={plantilla.nombre}
            onChange={handleNombreChange}
            placeholder="Ej: Email de Bienvenida"
            className="border-segal-blue/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            maxLength={100}
          />
          <p className="text-xs text-segal-dark/60 dark:text-gray-400">
            {plantilla.nombre.length}/100 caracteres
          </p>
        </div>

        {/* Asunto */}
        <div className="space-y-2">
          <Label htmlFor="email-asunto" className="text-sm font-semibold text-segal-dark dark:text-white">
            Asunto del Email <span className="text-segal-red dark:text-red-400">*</span>
          </Label>
          <Input
            ref={asuntoInputRef}
            id="email-asunto"
            value={plantilla.asunto}
            onChange={handleAsuntoChange}
            onFocus={() => setActiveField('asunto')}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
            }}
            onDrop={(e) => {
              e.preventDefault()
              const variable = e.dataTransfer.getData('application/x-variable') || e.dataTransfer.getData('text/plain')
              if (variable && variable.startsWith('{{')) {
                const input = e.currentTarget
                const cursorPos = input.selectionStart ?? plantilla.asunto.length
                const before = plantilla.asunto.substring(0, cursorPos)
                const after = plantilla.asunto.substring(cursorPos)
                const newValue = (before + variable + after).slice(0, 200)
                
                setPlantilla({ ...plantilla, asunto: newValue })
                
                setTimeout(() => {
                  input.focus()
                  const newCursorPos = Math.min(cursorPos + variable.length, newValue.length)
                  input.selectionStart = input.selectionEnd = newCursorPos
                }, 0)
                
                toast.success(`Variable insertada en el asunto`, { duration: 1500 })
              }
            }}
            placeholder="Ej: Bienvenido a nuestro servicio - Usa {{ para variables"
            className="border-segal-blue/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            maxLength={200}
          />
          <p className="text-xs text-segal-dark/60 dark:text-gray-400">
            {plantilla.asunto.length}/200 caracteres • Usa variables como {`{{nombre}}`} para personalizar
          </p>
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="email-desc" className="text-sm font-semibold text-segal-dark dark:text-white">
            Descripción (Opcional)
          </Label>
          <textarea
            id="email-desc"
            value={plantilla.descripcion || ''}
            onChange={handleDescripcionChange}
            placeholder="Describe el propósito de esta plantilla..."
            className="w-full min-h-20 px-3 py-2 rounded-md border border-segal-blue/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-segal-blue/20 dark:focus:ring-segal-turquoise/20 focus:border-segal-blue dark:focus:border-segal-turquoise"
            maxLength={500}
          />
          <p className="text-xs text-segal-dark/60 dark:text-gray-400">
            {(plantilla.descripcion || '').length}/500 caracteres
          </p>
        </div>

        {/* Activo */}
        <div className="flex items-center gap-2">
          <input
            id="email-activo"
            type="checkbox"
            checked={plantilla.activo}
            onChange={handleActivoChange}
            className="rounded border-segal-blue/30 dark:border-gray-600 text-segal-blue dark:text-segal-turquoise"
          />
          <Label htmlFor="email-activo" className="text-sm font-medium text-segal-dark dark:text-white cursor-pointer">
            Plantilla activa
          </Label>
        </div>
      </div>

      {/* Toggle modo: componentes vs HTML personalizado */}
      <div className="border-t border-segal-blue/10 dark:border-gray-700 pt-6">
        <div className="flex items-center justify-between bg-segal-blue/5 dark:bg-gray-800 rounded-lg p-3 border border-segal-blue/10 dark:border-gray-700">
          <div>
            <Label htmlFor="email-modo-html" className="text-sm font-semibold text-segal-dark dark:text-white cursor-pointer">
              Modo HTML personalizado
            </Label>
            <p className="text-xs text-segal-dark/60 dark:text-gray-400 mt-0.5">
              Pegá tu propio HTML completo. Se mantiene tal cual al enviar (con variables interpoladas).
            </p>
          </div>
          <input
            id="email-modo-html"
            type="checkbox"
            checked={plantilla.modo === 'html_personalizado'}
            onChange={(e) =>
              handleModoChange(e.target.checked ? 'html_personalizado' : 'componentes')
            }
            className="h-5 w-5 rounded border-segal-blue/30 dark:border-gray-600 text-segal-blue dark:text-segal-turquoise cursor-pointer"
          />
        </div>
      </div>

      {/* Editor: HTML personalizado */}
      {plantilla.modo === 'html_personalizado' && (
        <div className="border-t border-segal-blue/10 dark:border-gray-700 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-segal-dark dark:text-white">HTML del Email</h3>
            <div className="flex gap-2 border-b-0">
              <button
                type="button"
                onClick={() => setVistaActiva('editor')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  vistaActiva === 'editor'
                    ? 'bg-segal-blue/10 dark:bg-gray-700 text-segal-blue dark:text-segal-turquoise'
                    : 'text-segal-dark/60 dark:text-gray-400 hover:text-segal-dark dark:hover:text-white'
                }`}
              >
                Código
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva('preview')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
                  vistaActiva === 'preview'
                    ? 'bg-segal-blue/10 dark:bg-gray-700 text-segal-blue dark:text-segal-turquoise'
                    : 'text-segal-dark/60 dark:text-gray-400 hover:text-segal-dark dark:hover:text-white'
                }`}
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
            </div>
          </div>

          {vistaActiva === 'editor' && (
            <div className="space-y-2">
              <textarea
                ref={contenidoHtmlRef}
                value={plantilla.contenido}
                onChange={handleContenidoHtmlChange}
                placeholder={'Pegá tu HTML aquí. Podés usar variables como {{nombre}}, {{email}}, etc.\n\nSi pegás un documento HTML completo (<!DOCTYPE html>... <html>...), se envía tal cual.\nSi pegás solo un fragmento, el sistema lo envuelve mínimamente para que sea un email válido.'}
                className="w-full h-96 px-3 py-2 rounded-md border border-segal-blue/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-segal-blue/20 dark:focus:ring-segal-turquoise/20 focus:border-segal-blue dark:focus:border-segal-turquoise"
                spellCheck={false}
              />
              <p className="text-xs text-segal-dark/60 dark:text-gray-400">
                {plantilla.contenido.length.toLocaleString()} caracteres • Para insertar variables, hacé clic en el panel de la derecha
              </p>
            </div>
          )}

          {vistaActiva === 'preview' && (
            <div className="border border-segal-blue/10 dark:border-gray-700 rounded-lg overflow-hidden bg-white">
              <iframe
                title="Preview HTML"
                srcDoc={plantilla.contenido || '<p style="padding:20px; color:#999; font-family:sans-serif;">Vacío — pegá HTML para ver el preview.</p>'}
                className="w-full"
                style={{ minHeight: '600px', border: 0 }}
                sandbox=""
              />
            </div>
          )}
        </div>
      )}

      {/* Editor: Componentes (modo default) */}
      {plantilla.modo === 'componentes' && (
      <div className="border-t border-segal-blue/10 dark:border-gray-700 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-segal-dark dark:text-white">Componentes del Email</h3>

          {/* Botón para agregar componentes */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => agregarComponente('logo')}
              variant="outline"
              size="sm"
              className="border-segal-blue/30 dark:border-gray-600 text-segal-blue dark:text-segal-turquoise hover:bg-segal-blue/5 dark:hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-1" />
              Logo
            </Button>
            <Button
              onClick={() => agregarComponente('texto')}
              variant="outline"
              size="sm"
              className="border-segal-blue/30 dark:border-gray-600 text-segal-blue dark:text-segal-turquoise hover:bg-segal-blue/5 dark:hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-1" />
              Texto
            </Button>
            <Button
              onClick={() => agregarComponente('boton')}
              variant="outline"
              size="sm"
              className="border-segal-blue/30 dark:border-gray-600 text-segal-blue dark:text-segal-turquoise hover:bg-segal-blue/5 dark:hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-1" />
              Botón
            </Button>
            <Button
              onClick={() => agregarComponente('separador')}
              variant="outline"
              size="sm"
              className="border-segal-blue/30 dark:border-gray-600 text-segal-blue dark:text-segal-turquoise hover:bg-segal-blue/5 dark:hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-1" />
              Separador
            </Button>
            <Button
              onClick={() => agregarComponente('imagen')}
              variant="outline"
              size="sm"
              className="border-segal-blue/30 dark:border-gray-600 text-segal-blue dark:text-segal-turquoise hover:bg-segal-blue/5 dark:hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-1" />
              Imagen
            </Button>
            <Button
              onClick={() => agregarComponente('footer')}
              variant="outline"
              size="sm"
              className="border-segal-blue/30 dark:border-gray-600 text-segal-blue dark:text-segal-turquoise hover:bg-segal-blue/5 dark:hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-1" />
              Footer
            </Button>
          </div>
        </div>

        {/* Tabs: Editor/Preview */}
        <div className="flex gap-2 border-b border-segal-blue/10 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setVistaActiva('editor')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              vistaActiva === 'editor'
                ? 'border-segal-blue dark:border-segal-turquoise text-segal-blue dark:text-segal-turquoise'
                : 'border-transparent text-segal-dark/60 dark:text-gray-400 hover:text-segal-dark dark:hover:text-white'
            }`}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={() => setVistaActiva('preview')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
              vistaActiva === 'preview'
                ? 'border-segal-blue dark:border-segal-turquoise text-segal-blue dark:text-segal-turquoise'
                : 'border-transparent text-segal-dark/60 dark:text-gray-400 hover:text-segal-dark dark:hover:text-white'
            }`}
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
        </div>

        {/* Vista Editor */}
        {vistaActiva === 'editor' && (
          <div className="space-y-4">
            {plantilla.componentes.length === 0 ? (
              <div className="text-center py-8 bg-segal-blue/5 dark:bg-gray-800 rounded-lg border border-segal-blue/10 dark:border-gray-700">
                <p className="text-segal-dark/60 dark:text-gray-400 text-sm">
                  No hay componentes. Haz clic en los botones arriba para agregar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {plantilla.componentes.map((componente, index) => (
                  <EmailComponentEditor
                    key={componente.id}
                    componente={componente}
                    isSeleccionado={componenteSeleccionado === componente.id}
                    onSelect={() => {
                      setComponenteSeleccionado(componente.id)
                      if (componente.tipo === 'texto') {
                        setActiveField('componente')
                      }
                    }}
                    onUpdate={actualizarComponente}
                    onDelete={() => eliminarComponente(componente.id)}
                    onMoveUp={index > 0 ? () => moverComponenteArriba(index) : undefined}
                    onMoveDown={
                      index < plantilla.componentes.length - 1
                        ? () => moverComponenteAbajo(index)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vista Preview */}
        {vistaActiva === 'preview' && (
          <EmailPreview plantilla={plantilla} />
        )}
      </div>
      )}

      {/* Validación */}
      {!validacion.esValida || validacion.advertencias.length > 0 ? (
        <div className="space-y-3 border-t border-segal-blue/10 dark:border-gray-700 pt-6">
          {/* Errores */}
          {validacion.errores.length > 0 && (
            <div className="bg-segal-red/10 dark:bg-red-950/30 border border-segal-red/30 dark:border-red-800 rounded-lg p-4">
              <div className="flex gap-2 items-start mb-2">
                <AlertCircle className="h-5 w-5 text-segal-red dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-segal-red dark:text-red-400 text-sm mb-1">Errores</h4>
                  <ul className="space-y-1 text-xs text-segal-red/80 dark:text-red-400/80">
                    {validacion.errores.map((error, idx) => (
                      <li key={idx} className="flex gap-1">
                        <span>•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Advertencias */}
          {validacion.advertencias.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex gap-2 items-start">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-800 dark:text-orange-300 text-sm mb-1">Sugerencias</h4>
                  <ul className="space-y-1 text-xs text-orange-700 dark:text-orange-400">
                    {validacion.advertencias.map((adv, idx) => (
                      <li key={idx} className="flex gap-1">
                        <span>•</span>
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2 items-center bg-segal-green/10 dark:bg-green-950/30 border border-segal-green/30 dark:border-green-800 rounded-lg p-4">
          <CheckCircle2 className="h-5 w-5 text-segal-green dark:text-green-400 shrink-0" />
          <p className="text-sm text-segal-green dark:text-green-400 font-medium">Plantilla Email válida</p>
        </div>
      )}
      </div>

      {/* Variables Panel */}
      {showVariablesPanel && (
        <div className="w-72 shrink-0 bg-white dark:bg-gray-900 rounded-lg border border-segal-blue/10 dark:border-gray-700 overflow-hidden flex flex-col max-h-[calc(100vh-120px)] sticky top-4">
          <VariablesPanel onInsertVariable={handleInsertVariable} className="flex-1 min-h-0" />
        </div>
      )}
    </div>
  )
}

/**
 * Obtiene contenido inicial para cada tipo de componente
 */
function obtenerContenidoInicial(tipo: EmailComponentFormData['tipo']): any {
  const contenidos: Record<EmailComponentFormData['tipo'], any> = {
    logo: {
      url: '',
      alt: 'Logo',
      ancho: 200,
      altura: 100,
    },
    texto: {
      texto: '',
      alineacion: 'left',
      tamanio_fuente: 14,
      color: '#000000',
      negrita: false,
      italica: false,
      enlaces: [],
    },
    boton: {
      texto: 'Haz clic aquí',
      url: '',
      color_fondo: '#1e3a8a',
      color_texto: '#ffffff',
    },
    separador: {
      altura: 10,
      color: '#e0e0e0',
    },
    imagen: {
      url: '',
      alt: 'Imagen',
      alineacion: 'center',
      link_url: '',
      link_target: '_blank',
      border_radius: 0,
      padding: 10,
    },
    footer: {
      texto: 'Grupo Segal',
      enlaces: [],
      mostrar_fecha: false,
    },
  }

  return contenidos[tipo]
}

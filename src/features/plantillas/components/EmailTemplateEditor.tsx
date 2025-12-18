/**
 * Editor de Plantillas Email tipo Mailchimp
 * Permite agregar componentes: logo, texto, botón, separador, footer
 * Con edición visual y preview en tiempo real
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Plus,
  Eye,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { type PlantillaEmailFormData, type EmailComponentFormData } from '../schemas/plantillaSchemas'
import { validarPlantillaEmail } from '../utils/plantillaValidator'
import { EmailComponentEditor } from './email/EmailComponentEditor'
import { EmailPreview } from './email/EmailPreview'

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

  // Estado local para la plantilla
  const [plantilla, setPlantilla] = useState<PlantillaEmailFormData>({
    tipo: 'email',
    nombre: initialData?.nombre || '',
    descripcion: initialData?.descripcion || '',
    activo: initialData?.activo !== false,
    asunto: initialData?.asunto || '',
    componentes: initialData?.componentes || [],
  })

  // Notificar cambios al componente padre
  useEffect(() => {
    onDataChange?.(plantilla)
  }, [plantilla, onDataChange])

  // Validar plantilla
  const validacion = useMemo(() => validarPlantillaEmail(plantilla), [plantilla])

  const handleNombreChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPlantilla({
        ...plantilla,
        nombre: e.target.value,
      })
    },
    [plantilla]
  )

  const handleDescripcionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPlantilla({
        ...plantilla,
        descripcion: e.target.value,
      })
    },
    [plantilla]
  )

  const handleAsuntoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPlantilla({
        ...plantilla,
        asunto: e.target.value,
      })
    },
    [plantilla]
  )

  const handleActivoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPlantilla({
        ...plantilla,
        activo: e.target.checked,
      })
    },
    [plantilla]
  )

  /**
   * Agrega un nuevo componente a la plantilla
   */
  const agregarComponente = useCallback(
    (tipo: EmailComponentFormData['tipo']) => {
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
    },
    [plantilla]
  )

  /**
   * Actualiza un componente existente
   */
  const actualizarComponente = useCallback(
    (componente: EmailComponentFormData) => {
      setPlantilla({
        ...plantilla,
        componentes: plantilla.componentes.map((c) =>
          c.id === componente.id ? componente : c
        ),
      })
    },
    [plantilla]
  )

  /**
   * Elimina un componente
   */
  const eliminarComponente = useCallback(
    (componenteId: string) => {
      setPlantilla({
        ...plantilla,
        componentes: plantilla.componentes.filter((c) => c.id !== componenteId),
      })
      setComponenteSeleccionado(null)
    },
    [plantilla]
  )

  /**
   * Mueve un componente arriba en la lista
   */
  const moverComponenteArriba = useCallback(
    (index: number) => {
      if (index === 0) return

      const nuevosComponentes = [...plantilla.componentes]
      ;[nuevosComponentes[index - 1], nuevosComponentes[index]] = [
        nuevosComponentes[index],
        nuevosComponentes[index - 1],
      ]

      // Actualizar orden
      nuevosComponentes.forEach((c, i) => {
        c.orden = i
      })

      setPlantilla({
        ...plantilla,
        componentes: nuevosComponentes,
      })
    },
    [plantilla]
  )

  /**
   * Mueve un componente abajo en la lista
   */
  const moverComponenteAbajo = useCallback(
    (index: number) => {
      if (index === plantilla.componentes.length - 1) return

      const nuevosComponentes = [...plantilla.componentes]
      ;[nuevosComponentes[index], nuevosComponentes[index + 1]] = [
        nuevosComponentes[index + 1],
        nuevosComponentes[index],
      ]

      // Actualizar orden
      nuevosComponentes.forEach((c, i) => {
        c.orden = i
      })

      setPlantilla({
        ...plantilla,
        componentes: nuevosComponentes,
      })
    },
    [plantilla]
  )

  return (
    <div className="space-y-6 bg-white rounded-lg border border-segal-blue/10 p-6">
      {/* Información general */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-segal-dark">Información General</h3>

        {/* Nombre */}
        <div className="space-y-2">
          <Label htmlFor="email-nombre" className="text-sm font-semibold text-segal-dark">
            Nombre de la Plantilla <span className="text-segal-red">*</span>
          </Label>
          <Input
            id="email-nombre"
            value={plantilla.nombre}
            onChange={handleNombreChange}
            placeholder="Ej: Email de Bienvenida"
            className="border-segal-blue/30"
            maxLength={100}
          />
          <p className="text-xs text-segal-dark/60">
            {plantilla.nombre.length}/100 caracteres
          </p>
        </div>

        {/* Asunto */}
        <div className="space-y-2">
          <Label htmlFor="email-asunto" className="text-sm font-semibold text-segal-dark">
            Asunto del Email <span className="text-segal-red">*</span>
          </Label>
          <Input
            id="email-asunto"
            value={plantilla.asunto}
            onChange={handleAsuntoChange}
            placeholder="Ej: Bienvenido a nuestro servicio"
            className="border-segal-blue/30"
            maxLength={200}
          />
          <p className="text-xs text-segal-dark/60">
            {plantilla.asunto.length}/200 caracteres
          </p>
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="email-desc" className="text-sm font-semibold text-segal-dark">
            Descripción (Opcional)
          </Label>
          <textarea
            id="email-desc"
            value={plantilla.descripcion || ''}
            onChange={handleDescripcionChange}
            placeholder="Describe el propósito de esta plantilla..."
            className="w-full min-h-20 px-3 py-2 rounded-md border border-segal-blue/30 text-sm focus:outline-none focus:ring-2 focus:ring-segal-blue/20 focus:border-segal-blue"
            maxLength={500}
          />
          <p className="text-xs text-segal-dark/60">
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
            className="rounded border-segal-blue/30 text-segal-blue"
          />
          <Label htmlFor="email-activo" className="text-sm font-medium text-segal-dark cursor-pointer">
            Plantilla activa
          </Label>
        </div>
      </div>

      {/* Editor de componentes */}
      <div className="border-t border-segal-blue/10 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-segal-dark">Componentes del Email</h3>

          {/* Botón para agregar componentes */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => agregarComponente('logo')}
              variant="outline"
              size="sm"
              className="border-segal-blue/30 text-segal-blue hover:bg-segal-blue/5"
            >
              <Plus className="h-4 w-4 mr-1" />
              Logo
            </Button>
            <Button
              onClick={() => agregarComponente('texto')}
              variant="outline"
              size="sm"
              className="border-segal-blue/30 text-segal-blue hover:bg-segal-blue/5"
            >
              <Plus className="h-4 w-4 mr-1" />
              Texto
            </Button>
            <Button
              onClick={() => agregarComponente('boton')}
              variant="outline"
              size="sm"
              className="border-segal-blue/30 text-segal-blue hover:bg-segal-blue/5"
            >
              <Plus className="h-4 w-4 mr-1" />
              Botón
            </Button>
            <Button
              onClick={() => agregarComponente('separador')}
              variant="outline"
              size="sm"
              className="border-segal-blue/30 text-segal-blue hover:bg-segal-blue/5"
            >
              <Plus className="h-4 w-4 mr-1" />
              Separador
            </Button>
            <Button
              onClick={() => agregarComponente('imagen')}
              variant="outline"
              size="sm"
              className="border-segal-blue/30 text-segal-blue hover:bg-segal-blue/5"
            >
              <Plus className="h-4 w-4 mr-1" />
              Imagen
            </Button>
            <Button
              onClick={() => agregarComponente('footer')}
              variant="outline"
              size="sm"
              className="border-segal-blue/30 text-segal-blue hover:bg-segal-blue/5"
            >
              <Plus className="h-4 w-4 mr-1" />
              Footer
            </Button>
          </div>
        </div>

        {/* Tabs: Editor/Preview */}
        <div className="flex gap-2 border-b border-segal-blue/10">
          <button
            onClick={() => setVistaActiva('editor')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              vistaActiva === 'editor'
                ? 'border-segal-blue text-segal-blue'
                : 'border-transparent text-segal-dark/60 hover:text-segal-dark'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setVistaActiva('preview')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
              vistaActiva === 'preview'
                ? 'border-segal-blue text-segal-blue'
                : 'border-transparent text-segal-dark/60 hover:text-segal-dark'
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
              <div className="text-center py-8 bg-segal-blue/5 rounded-lg border border-segal-blue/10">
                <p className="text-segal-dark/60 text-sm">
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
                    onSelect={() => setComponenteSeleccionado(componente.id)}
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

      {/* Validación */}
      {!validacion.esValida || validacion.advertencias.length > 0 ? (
        <div className="space-y-3 border-t border-segal-blue/10 pt-6">
          {/* Errores */}
          {validacion.errores.length > 0 && (
            <div className="bg-segal-red/10 border border-segal-red/30 rounded-lg p-4">
              <div className="flex gap-2 items-start mb-2">
                <AlertCircle className="h-5 w-5 text-segal-red shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-segal-red text-sm mb-1">Errores</h4>
                  <ul className="space-y-1 text-xs text-segal-red/80">
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
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex gap-2 items-start">
                <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-800 text-sm mb-1">Sugerencias</h4>
                  <ul className="space-y-1 text-xs text-orange-700">
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
        <div className="flex gap-2 items-center bg-segal-green/10 border border-segal-green/30 rounded-lg p-4">
          <CheckCircle2 className="h-5 w-5 text-segal-green shrink-0" />
          <p className="text-sm text-segal-green font-medium">Plantilla Email válida</p>
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

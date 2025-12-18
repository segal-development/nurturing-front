/**
 * Tipos para gestión de plantillas de SMS y Email
 * Define la estructura de datos para plantillas de mensajes
 */

/**
 * Estructura base de una plantilla
 */
export interface PlantillaBase {
  id?: number
  nombre: string
  descripcion?: string
  tipo: 'sms' | 'email'
  activo: boolean
  fecha_creacion?: string
  fecha_actualizacion?: string
}

/**
 * Estructura de una plantilla SMS
 * Máximo 160 caracteres por GSM 7-bit
 */
export interface PlantillaSMS extends PlantillaBase {
  tipo: 'sms'
  contenido: string // Máximo 160 caracteres
  preview?: string // Preview para mostrar en UI
}

/**
 * Estructura de componentes de Email
 */
export interface EmailComponent {
  id: string
  tipo: 'logo' | 'texto' | 'boton' | 'separador' | 'imagen' | 'footer'
  contenido: any
  orden: number
}

/**
 * Estructura de un componente de Logo
 */
export interface LogoComponent extends EmailComponent {
  tipo: 'logo'
  contenido: {
    url: string
    alt: string
    ancho?: number
    altura?: number
    color_fondo?: string
    padding?: number
  }
}

/**
 * Estructura de un componente de Texto
 */
export interface TextoComponent extends EmailComponent {
  tipo: 'texto'
  contenido: {
    texto: string
    alineacion?: 'left' | 'center' | 'right'
    tamanio_fuente?: number
    color?: string
    negrita?: boolean
    italica?: boolean
    enlaces?: {
      url: string
      texto: string
      posicion: number // Índice en el texto
    }[]
  }
}

/**
 * Estructura de un componente de Botón
 */
export interface BotonComponent extends EmailComponent {
  tipo: 'boton'
  contenido: {
    texto: string
    url: string
    color_fondo?: string
    color_texto?: string
  }
}

/**
 * Estructura de un componente de Separador
 */
export interface SeparadorComponent extends EmailComponent {
  tipo: 'separador'
  contenido: {
    altura?: number
    color?: string
  }
}

/**
 * Estructura de un componente de Imagen
 * Permite agregar imágenes con link opcional
 */
export interface ImagenComponent extends EmailComponent {
  tipo: 'imagen'
  contenido: {
    url: string
    alt: string
    ancho?: number
    altura?: number
    alineacion?: 'left' | 'center' | 'right'
    link_url?: string
    link_target?: '_blank' | '_self'
    border_radius?: number
    padding?: number
  }
}

/**
 * Estructura de un componente de Footer
 */
export interface FooterComponent extends EmailComponent {
  tipo: 'footer'
  contenido: {
    texto: string
    enlaces?: {
      url: string
      etiqueta: string
    }[]
    mostrar_fecha?: boolean
    color_fondo?: string
    color_texto?: string
    padding?: number
  }
}

/**
 * Tipo unión para todos los componentes de email
 */
export type AnyEmailComponent =
  | LogoComponent
  | TextoComponent
  | BotonComponent
  | SeparadorComponent
  | ImagenComponent
  | FooterComponent

/**
 * Estructura de una plantilla Email
 */
export interface PlantillaEmail extends PlantillaBase {
  tipo: 'email'
  asunto: string
  componentes: AnyEmailComponent[]
  preview?: string // HTML preview
}

/**
 * Tipo unión para cualquier plantilla
 */
export type AnyPlantilla = PlantillaSMS | PlantillaEmail

/**
 * Respuesta del backend al guardar plantilla
 */
export interface GuardarPlantillaResponse {
  id: number
  mensaje: string
  plantilla: AnyPlantilla
}

/**
 * Respuesta paginada de plantillas
 */
export interface PlantillasResponse {
  data: AnyPlantilla[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

/**
 * Estructura para validación de plantillas
 */
export interface ValidacionPlantilla {
  esValida: boolean
  errores: string[]
  advertencias: string[]
}

/**
 * Utilidades de sanitización para prevenir XSS
 *
 * Usa DOMPurify para limpiar HTML potencialmente peligroso.
 * SIEMPRE sanitizar HTML antes de usar dangerouslySetInnerHTML.
 */

import DOMPurify from 'dompurify'

// Configuración para DOMPurify
interface SanitizeConfig {
  ALLOWED_TAGS?: string[]
  ALLOWED_ATTR?: string[]
  ALLOW_DATA_ATTR?: boolean
  ALLOW_UNKNOWN_PROTOCOLS?: boolean
  ADD_TAGS?: string[]
  ADD_ATTR?: string[]
}

/**
 * Configuración por defecto para DOMPurify
 * Permite tags HTML seguros para mostrar contenido de emails
 */
const DEFAULT_CONFIG: SanitizeConfig = {
  // Tags permitidos (HTML semántico + formato de emails)
  ALLOWED_TAGS: [
    // Estructura
    'html',
    'head',
    'body',
    'div',
    'span',
    'p',
    'br',
    'hr',
    // Encabezados
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    // Formato de texto
    'b',
    'strong',
    'i',
    'em',
    'u',
    's',
    'strike',
    'del',
    'ins',
    'sub',
    'sup',
    'small',
    'big',
    'font',
    'center',
    // Enlaces e imágenes
    'a',
    'img',
    // Listas
    'ul',
    'ol',
    'li',
    // Tablas
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
    'caption',
    'colgroup',
    'col',
    // Otros
    'blockquote',
    'pre',
    'code',
    'address',
    // Meta tags para emails
    'title',
    'style',
    'meta',
    'link',
  ],
  // Atributos permitidos
  ALLOWED_ATTR: [
    // Globales
    'id',
    'class',
    'style',
    'title',
    'dir',
    'lang',
    // Enlaces
    'href',
    'target',
    'rel',
    // Imágenes
    'src',
    'alt',
    'width',
    'height',
    // Tablas
    'colspan',
    'rowspan',
    'cellpadding',
    'cellspacing',
    'border',
    'align',
    'valign',
    'bgcolor',
    // Meta
    'name',
    'content',
    'charset',
    'http-equiv',
    // Font
    'color',
    'size',
    'face',
    // Otros
    'data-*',
    'role',
    'aria-*',
  ],
  // Permitir data attributes
  ALLOW_DATA_ATTR: true,
}

/**
 * Sanitiza HTML para prevenir XSS
 *
 * @param dirtyHtml - HTML potencialmente peligroso
 * @param config - Configuración adicional para DOMPurify
 * @returns HTML sanitizado
 *
 * @example
 * ```tsx
 * // En un componente React
 * const SafeHTML = ({ html }: { html: string }) => (
 *   <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
 * )
 * ```
 */
export function sanitizeHtml(
  dirtyHtml: string | null | undefined,
  config?: SanitizeConfig
): string {
  if (!dirtyHtml) {
    return ''
  }

  const result = DOMPurify.sanitize(dirtyHtml, {
    ...DEFAULT_CONFIG,
    ...config,
  })
  
  // DOMPurify puede retornar TrustedHTML en algunos entornos, aseguramos string
  return String(result)
}

/**
 * Sanitiza HTML con configuración estricta (solo texto y formato básico)
 * Útil para contenido donde no se necesitan tablas ni imágenes
 */
export function sanitizeHtmlStrict(dirtyHtml: string | null | undefined): string {
  return sanitizeHtml(dirtyHtml, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'span', 'div'],
    ALLOWED_ATTR: ['class', 'style'],
  })
}

/**
 * Verifica si un string contiene HTML potencialmente peligroso
 * Útil para logging o alertas
 */
export function containsDangerousHtml(html: string | null | undefined): boolean {
  if (!html) {
    return false
  }

  const sanitized = sanitizeHtml(html)
  return sanitized !== html
}

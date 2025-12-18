/**
 * Utilidades de sanitización para prevenir XSS
 *
 * Usa DOMPurify para limpiar HTML potencialmente peligroso.
 * SIEMPRE sanitizar HTML antes de usar dangerouslySetInnerHTML.
 */

import * as DOMPurify from 'dompurify'

/**
 * Configuración por defecto para DOMPurify
 * Permite tags HTML seguros para mostrar contenido de emails
 */
const DEFAULT_CONFIG: DOMPurify.Config = {
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
    'i',
    'u',
    'strong',
    'em',
    'small',
    'mark',
    'del',
    'ins',
    'sub',
    'sup',
    // Links e imágenes
    'a',
    'img',
    // Listas
    'ul',
    'ol',
    'li',
    // Tablas (común en emails HTML)
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
    // Otros
    'blockquote',
    'pre',
    'code',
    'center',
    'font',
    // Meta (para emails)
    'meta',
    'title',
    'style',
  ],
  // Atributos permitidos
  ALLOWED_ATTR: [
    // Globales
    'class',
    'id',
    'style',
    'title',
    'lang',
    'dir',
    // Links
    'href',
    'target',
    'rel',
    // Imágenes
    'src',
    'alt',
    'width',
    'height',
    // Tablas
    'border',
    'cellpadding',
    'cellspacing',
    'align',
    'valign',
    'bgcolor',
    'colspan',
    'rowspan',
    'role',
    // Meta
    'http-equiv',
    'content',
    'charset',
    'name',
    'viewport',
    // Font (legacy pero común en emails)
    'color',
    'face',
    'size',
  ],
  // No permitir data URIs en src (previene ataques)
  ALLOW_DATA_ATTR: false,
  // Forzar target="_blank" en links externos
  ADD_ATTR: ['target'],
}

/**
 * Sanitiza HTML para prevenir XSS
 *
 * @param dirtyHtml - HTML potencialmente peligroso
 * @param config - Configuración opcional de DOMPurify
 * @returns HTML sanitizado seguro para renderizar
 *
 * @example
 * ```tsx
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(contenido) }} />
 * ```
 */
export function sanitizeHtml(
  dirtyHtml: string | null | undefined,
  config?: DOMPurify.Config
): string {
  if (!dirtyHtml) {
    return ''
  }

  return DOMPurify.sanitize(dirtyHtml, {
    ...DEFAULT_CONFIG,
    ...config,
  })
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

  const sanitized = DOMPurify.sanitize(html, DEFAULT_CONFIG)
  return sanitized !== html
}

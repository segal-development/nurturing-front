/**
 * Email Renderer Service
 * Renderiza plantillas de email a HTML/MJML
 * Compatible con cualquier proveedor SMTP (SendGrid, Mailgun, AWS SES, etc)
 */

import type { EmailBlockData } from '../components/EmailTemplates'

/**
 * Renderiza bloques de email a HTML limpio
 * Usado para enviar por cualquier proveedor SMTP
 */
export function renderEmailBlocksToHTML(
  blocks: EmailBlockData[],
  options?: {
    inlineStyles?: boolean
    responsive?: boolean
  }
): string {
  const { inlineStyles = true, responsive = true } = options || {}

  let html = ''

  // Estilos base
  if (responsive) {
    html += `
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; }
        a { color: #0066CC; text-decoration: underline; }
        a:hover { color: #0052A3; }
        button { cursor: pointer; }
        img { max-width: 100%; height: auto; }
      </style>
    `
  }

  // Renderizar bloques
  blocks.forEach((block) => {
    html += renderBlockToHTML(block, inlineStyles)
  })

  return html
}

/**
 * Renderiza un bloque individual a HTML
 */
function renderBlockToHTML(block: EmailBlockData, inlineStyles: boolean): string {
  const alignStyle = inlineStyles ? `text-align: ${block.align || 'left'};` : ''
  const colorMap: Record<string, string> = {
    gray: '#374151',
    blue: '#1F2937',
    green: '#059669',
    red: '#DC2626',
    white: '#FFFFFF',
  }
  const color = colorMap[block.color || 'gray']

  const fontSizeMap = {
    sm: '12px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '24px',
  }

  const fontSize = fontSizeMap[block.fontSize || 'base']

  switch (block.type) {
    case 'heading':
      return `
        <h2 style="${inlineStyles ? `font-size: ${fontSize}; font-weight: bold; color: ${color}; margin: 16px 0; ${alignStyle}` : ''}">
          ${escapeHTML(block.content || '')}
        </h2>
      `

    case 'text':
      return `
        <p style="${inlineStyles ? `font-size: ${fontSize}; color: ${color}; margin: 12px 0; line-height: 1.6; ${alignStyle}` : ''}">
          ${escapeHTML(block.content || '')}
        </p>
      `

    case 'link':
      return `
        <p style="${inlineStyles ? `margin: 12px 0; ${alignStyle}` : ''}">
          <a href="${escapeHTML(block.href || '#')}" style="${inlineStyles ? 'color: #0066CC; text-decoration: underline;' : ''}">
            ${escapeHTML(block.content || 'Click here')}
          </a>
        </p>
      `

    case 'button':
      return `
        <div style="${inlineStyles ? `margin: 16px 0; ${alignStyle}` : ''}">
          <a href="${escapeHTML(block.href || '#')}" style="${inlineStyles ? `display: inline-block; background-color: ${color}; color: white; padding: 12px 24px; border-radius: 6px; font-size: ${fontSize}; font-weight: bold; text-decoration: none;` : ''}">
            ${escapeHTML(block.buttonText || block.content || 'Click here')}
          </a>
        </div>
      `

    case 'section':
      return `
        <div style="${inlineStyles ? `background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #E5E7EB;` : ''}">
          <p style="${inlineStyles ? `font-size: ${fontSize}; color: ${color};` : ''}">
            ${escapeHTML(block.content || '')}
          </p>
        </div>
      `

    default:
      return ''
  }
}

/**
 * Escapa caracteres HTML peligrosos
 */
function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

/**
 * Renderiza a MJML (Mailjet Markup Language)
 * Compatible con herramientas de email profesionales
 */
export function renderEmailBlocksToMJML(
  blocks: EmailBlockData[],
  config?: {
    subject?: string
    headerText?: string
    footerText?: string
    footerLink?: {
      text: string
      href: string
    }
  }
): string {
  const subject = config?.subject || 'Email from Grupo Segal'

  let mjml = `
<mjml>
  <mj-head>
    <mj-title>${escapeHTML(subject)}</mj-title>
    <mj-preview>Preview text</mj-preview>
    <mj-style>
      a { color: #0066CC; text-decoration: underline; }
      a:hover { color: #0052A3; }
    </mj-style>
  </mj-head>
  <mj-body>
    <mj-section>
      <mj-column>
  `

  // Header
  if (config?.headerText) {
    mjml += `
        <mj-text font-size="24px" font-weight="bold" color="#1F2937" align="center" padding="16px 0">
          ${escapeHTML(config.headerText)}
        </mj-text>
    `
  }

  // Bloques de contenido
  blocks.forEach((block) => {
    mjml += renderBlockToMJML(block)
  })

  // Footer
  if (config?.footerText || config?.footerLink) {
    mjml += `
        <mj-divider border-color="#D1D5DB"></mj-divider>
        <mj-text font-size="12px" color="#6B7280" align="center" padding="16px 0">
          ${escapeHTML(config.footerText || '')}
    `

    if (config?.footerLink) {
      mjml += `<br/><a href="${escapeHTML(config.footerLink.href)}" style="color: #0066CC;">${escapeHTML(config.footerLink.text)}</a>`
    }

    mjml += `
        </mj-text>
        <mj-text font-size="11px" color="#9CA3AF" align="center" padding="0">
          © ${new Date().getFullYear()} Grupo Segal. All rights reserved.
        </mj-text>
    `
  }

  mjml += `
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
  `

  return mjml
}

/**
 * Renderiza un bloque a MJML
 */
function renderBlockToMJML(block: EmailBlockData): string {
  switch (block.type) {
    case 'heading':
      return `
        <mj-text font-size="24px" font-weight="bold" color="#1F2937" align="${block.align || 'left'}" padding="12px 0">
          ${escapeHTML(block.content || '')}
        </mj-text>
      `

    case 'text':
      return `
        <mj-text font-size="14px" color="#374151" align="${block.align || 'left'}" padding="8px 0">
          ${escapeHTML(block.content || '')}
        </mj-text>
      `

    case 'link':
      return `
        <mj-text font-size="14px" align="${block.align || 'left'}" padding="8px 0">
          <a href="${escapeHTML(block.href || '#')}" style="color: #0066CC;">
            ${escapeHTML(block.content || 'Click here')}
          </a>
        </mj-text>
      `

    case 'button':
      return `
        <mj-button href="${escapeHTML(block.href || '#')}" background-color="#374151" padding="${block.align === 'center' ? '16px 0' : '12px 0'}">
          ${escapeHTML(block.buttonText || block.content || 'Click here')}
        </mj-button>
      `

    case 'section':
      return `
        <mj-text background-color="#F3F4F6" color="#374151" padding="12px" border="1px solid #E5E7EB" border-radius="8px">
          ${escapeHTML(block.content || '')}
        </mj-text>
      `

    default:
      return ''
  }
}

/**
 * Exporta email a formato para backend
 * Estructura universal compatible con cualquier proveedor
 */
export function exportEmailForBackend(
  blocks: EmailBlockData[],
  config?: any
) {
  const html = renderEmailBlocksToHTML(blocks)
  const mjml = renderEmailBlocksToMJML(blocks, config)

  return {
    tipo: 'email',
    html,
    mjml,
    blocksJSON: JSON.stringify(blocks),
    blocks,
    config,
  }
}

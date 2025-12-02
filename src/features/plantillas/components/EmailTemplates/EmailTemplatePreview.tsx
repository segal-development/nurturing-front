/**
 * Preview de Email Templates
 * Renderiza el HTML del email para visualización
 * Agnóstico al proveedor de email
 */

import { useEffect, useState } from 'react'
import { render } from '@react-email/components'
import type { EmailBlockData } from './EmailBlock'
import { EmailBlocks } from './EmailBlock'
import { BaseEmailTemplate } from './BaseEmailTemplate'

export interface EmailTemplatePreviewProps {
  /**
   * Bloques de contenido del email
   */
  blocks: EmailBlockData[]

  /**
   * Configuración del template
   */
  config?: {
    preview?: string
    subject?: string
    headerImage?: string
    headerText?: string
    footerText?: string
    footerLink?: {
      text: string
      href: string
    }
  }

  /**
   * Callback cuando el HTML se renderiza
   */
  onRender?: (html: string) => void
}

/**
 * Componente de preview del template
 * Renderiza el email como lo vería el usuario final
 */
export function EmailTemplatePreview({
  blocks,
  config,
  onRender,
}: EmailTemplatePreviewProps) {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const renderTemplate = async () => {
      try {
        setIsLoading(true)

        const emailComponent = (
          <BaseEmailTemplate
            preview={config?.preview}
            subject={config?.subject}
            headerImage={config?.headerImage}
            headerText={config?.headerText}
            footerText={config?.footerText}
            footerLink={config?.footerLink}
          >
            <EmailBlocks blocks={blocks} spacing="normal" />
          </BaseEmailTemplate>
        )

        // Renderizar a HTML
        const html = await render(emailComponent)
        setHtmlContent(html)
        onRender?.(html)
      } catch (error) {
        console.error('Error rendering email template:', error)
      } finally {
        setIsLoading(false)
      }
    }

    renderTemplate()
  }, [blocks, config, onRender])

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-segal-blue" />
        </div>
      )}

      {htmlContent && (
        <div className="flex-1 overflow-hidden border border-gray-300 rounded-lg bg-white">
          <iframe
            srcDoc={htmlContent}
            className="w-full h-full border-none"
            title="Email Preview"
          />
        </div>
      )}

      {!htmlContent && !isLoading && (
        <div className="flex items-center justify-center py-8 text-gray-500">
          No hay contenido para mostrar
        </div>
      )}
    </div>
  )
}

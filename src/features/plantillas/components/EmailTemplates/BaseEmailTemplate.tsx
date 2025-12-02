/**
 * Base Email Template con react-email
 * Proporciona estructura base para todos los emails
 * Compatible con cualquier proveedor SMTP
 */

import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type * as React from 'react'

interface BaseEmailTemplateProps {
  preview?: string
  subject?: string
  headerImage?: string
  headerText?: string
  children?: React.ReactNode
  footerText?: string
  footerLink?: {
    text: string
    href: string
  }
}

export function BaseEmailTemplate({
  preview,
  subject,
  headerImage,
  headerText,
  children,
  footerText,
  footerLink,
}: BaseEmailTemplateProps) {
  return (
    <Html>
      <Head>
        {subject && <title>{subject}</title>}
      </Head>
      {preview && <Preview>{preview}</Preview>}

      <Body className="bg-white font-sans">
        <Container className="mx-auto px-4 py-8 max-w-2xl">
          {/* Header */}
          {(headerImage || headerText) && (
            <Section className="mb-8">
              {headerImage && (
                <Img
                  src={headerImage}
                  alt="Logo"
                  className="h-12 w-auto"
                />
              )}
              {headerText && (
                <Text className="text-2xl font-bold text-gray-900 mt-4">
                  {headerText}
                </Text>
              )}
            </Section>
          )}

          {/* Divider */}
          {(headerImage || headerText) && (
            <Hr className="my-6 border-gray-300" />
          )}

          {/* Content */}
          <Section className="mb-8">
            {children}
          </Section>

          {/* Divider */}
          <Hr className="my-6 border-gray-300" />

          {/* Footer */}
          <Section className="text-center text-sm text-gray-600">
            {footerText && (
              <Text className="mb-4">
                {footerText}
              </Text>
            )}
            {footerLink && (
              <Link
                href={footerLink.href}
                className="text-blue-600 underline hover:text-blue-800"
              >
                {footerLink.text}
              </Link>
            )}
            <Text className="mt-6 text-xs text-gray-500">
              © {new Date().getFullYear()} Grupo Segal. Todos los derechos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

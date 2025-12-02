/**
 * Bloques de contenido para emails reutilizables
 * Cada bloque puede tener texto, links, botones, etc.
 */

import {
  Button,
  Container,
  Link,
  Section,
  Text,
} from '@react-email/components'

export type EmailBlockType = 'text' | 'heading' | 'button' | 'link' | 'section'

export interface EmailBlockData {
  type: EmailBlockType
  content?: string
  href?: string
  buttonText?: string
  align?: 'left' | 'center' | 'right'
  color?: string
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl'
  className?: string
}

/**
 * Componente de bloque de email individual
 */
export function EmailBlock({
  type,
  content,
  href,
  buttonText,
  align = 'left',
  color = 'gray',
  fontSize = 'base',
}: EmailBlockData) {
  const fontSizeMap = {
    sm: '12px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '24px',
  }

  const alignMap = {
    left: 'left',
    center: 'center',
    right: 'right',
  } as const

  const colorMap: Record<string, string> = {
    gray: '#374151',
    blue: '#1F2937',
    green: '#059669',
    red: '#DC2626',
    white: '#FFFFFF',
  }

  switch (type) {
    case 'heading':
      return (
        <Text
          style={{
            fontSize: fontSizeMap['2xl'],
            fontWeight: 'bold',
            color: colorMap[color],
            margin: '16px 0',
            textAlign: alignMap[align],
          }}
        >
          {content}
        </Text>
      )

    case 'text':
      return (
        <Text
          style={{
            fontSize: fontSizeMap[fontSize],
            color: colorMap[color],
            margin: '12px 0',
            textAlign: alignMap[align],
            lineHeight: '1.6',
          }}
        >
          {content}
        </Text>
      )

    case 'link':
      return (
        <Text style={{ margin: '12px 0', textAlign: alignMap[align] }}>
          <Link
            href={href}
            style={{
              color: '#0066CC',
              textDecoration: 'underline',
              fontSize: fontSizeMap[fontSize],
            }}
          >
            {content}
          </Link>
        </Text>
      )

    case 'button':
      return (
        <Section style={{ textAlign: alignMap[align], margin: '16px 0' }}>
          <Button
            href={href || '#'}
            style={{
              backgroundColor: colorMap[color],
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: fontSizeMap[fontSize],
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            {buttonText || content}
          </Button>
        </Section>
      )

    case 'section':
      return (
        <Section
          style={{
            backgroundColor: '#F3F4F6',
            padding: '16px',
            borderRadius: '8px',
            margin: '16px 0',
            border: '1px solid #E5E7EB',
          }}
        >
          <Text style={{ fontSize: fontSizeMap[fontSize], color: colorMap[color] }}>
            {content}
          </Text>
        </Section>
      )

    default:
      return null
  }
}

/**
 * Renderiza múltiples bloques en secuencia
 */
export interface EmailBlocksProps {
  blocks: EmailBlockData[]
  spacing?: 'compact' | 'normal' | 'spacious'
}

export function EmailBlocks({ blocks, spacing = 'normal' }: EmailBlocksProps) {
  const marginMap = {
    compact: '8px',
    normal: '12px',
    spacious: '20px',
  }

  return (
    <Container>
      {blocks.map((block, index) => (
        <div
          key={index}
          style={{
            marginBottom: marginMap[spacing],
          }}
        >
          <EmailBlock {...block} />
        </div>
      ))}
    </Container>
  )
}

/**
 * Schemas Zod para validación de plantillas SMS y Email
 * Define la estructura y validaciones de datos
 */

import { z } from 'zod'

/**
 * Schema base para todas las plantillas
 */
const plantillaBaseSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .default(''),
  activo: z.boolean().default(true),
})

/**
 * Schema para Plantilla SMS
 */
export const plantillaSMSSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .default(''),
  activo: z.boolean().default(true),
  tipo: z.literal('sms'),
  contenido: z
    .string()
    .min(1, 'El contenido del SMS es obligatorio')
    .max(160, 'El SMS no puede exceder 160 caracteres'),
})

export type PlantillaSMSFormData = z.infer<typeof plantillaSMSSchema>

/**
 * Schema para componente de Texto
 */
export const textoComponentSchema = z.object({
  id: z.string(),
  tipo: z.literal('texto'),
  orden: z.number(),
  contenido: z.object({
    texto: z
      .string()
      .min(1, 'El texto es obligatorio'),
    alineacion: z.enum(['left', 'center', 'right']).default('left'),
    tamanio_fuente: z
      .number()
      .min(8, 'Tamaño mínimo 8px')
      .max(72, 'Tamaño máximo 72px')
      .default(14),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'Color debe ser un hexadecimal válido')
      .default('#000000'),
    negrita: z.boolean().default(false),
    italica: z.boolean().default(false),
    enlaces: z
      .array(
        z.object({
          url: z.string().url('URL debe ser válida'),
          texto: z.string(),
          posicion: z.number(),
        })
      )
      .default([]),
  }),
})

export type TextoComponentFormData = z.infer<typeof textoComponentSchema>

/**
 * Schema para componente de Logo
 */
export const logoComponentSchema = z.object({
  id: z.string(),
  tipo: z.literal('logo'),
  orden: z.number(),
  contenido: z.object({
    url: z
      .string()
      .min(1, 'URL del logo es obligatoria')
      .url('URL debe ser válida'),
    alt: z
      .string()
      .min(1, 'Texto alternativo es obligatorio'),
    ancho: z
      .number()
      .min(50, 'Ancho mínimo 50px')
      .max(500, 'Ancho máximo 500px')
      .default(200),
    altura: z
      .number()
      .min(50, 'Alto mínimo 50px')
      .max(500, 'Alto máximo 500px')
      .default(100),
    color_fondo: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'Color debe ser un hexadecimal válido')
      .optional(),
    padding: z
      .number()
      .min(0, 'Padding mínimo 0px')
      .max(100, 'Padding máximo 100px')
      .default(20),
  }),
})

export type LogoComponentFormData = z.infer<typeof logoComponentSchema>

/**
 * Schema para componente de Botón
 */
export const botonComponentSchema = z.object({
  id: z.string(),
  tipo: z.literal('boton'),
  orden: z.number(),
  contenido: z.object({
    texto: z
      .string()
      .min(1, 'El texto del botón es obligatorio'),
    url: z
      .string()
      .min(1, 'URL del botón es obligatoria')
      .url('URL debe ser válida'),
    color_fondo: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'Color debe ser un hexadecimal válido')
      .default('#1e3a8a'),
    color_texto: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'Color debe ser un hexadecimal válido')
      .default('#ffffff'),
  }),
})

export type BotonComponentFormData = z.infer<typeof botonComponentSchema>

/**
 * Schema para componente de Separador
 */
export const separadorComponentSchema = z.object({
  id: z.string(),
  tipo: z.literal('separador'),
  orden: z.number(),
  contenido: z.object({
    altura: z
      .number()
      .min(1, 'Altura mínima 1px')
      .max(100, 'Altura máxima 100px')
      .default(10),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'Color debe ser un hexadecimal válido')
      .default('#e0e0e0'),
  }),
})

export type SeparadorComponentFormData = z.infer<typeof separadorComponentSchema>

/**
 * Schema para componente de Imagen
 * Permite agregar imágenes con link opcional
 */
export const imagenComponentSchema = z.object({
  id: z.string(),
  tipo: z.literal('imagen'),
  orden: z.number(),
  contenido: z.object({
    url: z
      .string()
      .min(1, 'URL de la imagen es obligatoria')
      .url('URL debe ser válida'),
    alt: z
      .string()
      .min(1, 'Texto alternativo es obligatorio')
      .max(200, 'Texto alternativo máximo 200 caracteres'),
    ancho: z
      .number()
      .min(50, 'Ancho mínimo 50px')
      .max(600, 'Ancho máximo 600px')
      .optional(),
    altura: z
      .number()
      .min(50, 'Alto mínimo 50px')
      .max(800, 'Alto máximo 800px')
      .optional(),
    alineacion: z.enum(['left', 'center', 'right']).default('center'),
    link_url: z
      .string()
      .url('URL del link debe ser válida')
      .optional()
      .or(z.literal('')),
    link_target: z.enum(['_blank', '_self']).default('_blank'),
    border_radius: z
      .number()
      .min(0, 'Border radius mínimo 0px')
      .max(50, 'Border radius máximo 50px')
      .default(0),
    padding: z
      .number()
      .min(0, 'Padding mínimo 0px')
      .max(50, 'Padding máximo 50px')
      .default(10),
  }),
})

export type ImagenComponentFormData = z.infer<typeof imagenComponentSchema>

/**
 * Schema para componente de Footer
 */
export const footerComponentSchema = z.object({
  id: z.string(),
  tipo: z.literal('footer'),
  orden: z.number(),
  contenido: z.object({
    texto: z
      .string()
      .min(1, 'El texto del footer es obligatorio'),
    enlaces: z
      .array(
        z.object({
          url: z.string().url('URL debe ser válida'),
          etiqueta: z.string().min(1, 'Etiqueta es obligatoria'),
        })
      )
      .default([]),
    mostrar_fecha: z.boolean().default(false),
    color_fondo: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'Color debe ser un hexadecimal válido')
      .optional(),
    color_texto: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'Color debe ser un hexadecimal válido')
      .default('#666666'),
    padding: z
      .number()
      .min(0, 'Padding mínimo 0px')
      .max(100, 'Padding máximo 100px')
      .default(20),
  }),
})

export type FooterComponentFormData = z.infer<typeof footerComponentSchema>

/**
 * Schema para cualquier componente de email
 */
export const emailComponentSchema = z.union([
  textoComponentSchema,
  logoComponentSchema,
  botonComponentSchema,
  separadorComponentSchema,
  imagenComponentSchema,
  footerComponentSchema,
])

export type EmailComponentFormData = z.infer<typeof emailComponentSchema>

/**
 * Schema para Plantilla Email
 */
export const plantillaEmailSchema = plantillaBaseSchema.extend({
  tipo: z.literal('email'),
  asunto: z
    .string()
    .min(1, 'El asunto es obligatorio')
    .max(200, 'El asunto no puede exceder 200 caracteres'),
  componentes: z
    .array(emailComponentSchema)
    .min(1, 'La plantilla debe tener al menos un componente'),
})

export type PlantillaEmailFormData = z.infer<typeof plantillaEmailSchema>

/**
 * Schema unificado para cualquier plantilla
 */
export const plantillaSchema = z.union([plantillaSMSSchema, plantillaEmailSchema])

export type PlantillaFormData = z.infer<typeof plantillaSchema>

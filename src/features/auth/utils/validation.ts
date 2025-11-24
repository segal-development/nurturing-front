import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .email('Correo electrónico inválido')
    .min(1, 'El correo es requerido')
    .transform(email => email.toLowerCase().trim()),
  password: z
    .string('La contraseña es requerida')
    .min(8, { message: 'Mínimo 8 caracteres' })
    .max(25, { message: 'Máximo 25 caracteres' }),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const validateLoginForm = (data: unknown) => {
  return loginSchema.safeParse(data)
}

export const getValidationErrors = (data: unknown) => {
  const result = loginSchema.safeParse(data)
  if (!result.success) {
    return result.error.flatten().fieldErrors
  }
  return null
}

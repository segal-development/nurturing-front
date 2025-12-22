/**
 * Form for changing user password
 * Validates current and new passwords with confirmation
 */

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { profileService } from '@/api/profile.service'

// Esquema de validación
const changePasswordSchema = z
  .object({
    current_password: z
      .string()
      .min(1, 'La contraseña actual es requerida')
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    new_password: z
      .string()
      .min(1, 'La nueva contraseña es requerida')
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    new_password_confirmation: z.string().min(1, 'Confirma tu nueva contraseña'),
  })
  .refine((data) => data.new_password === data.new_password_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['new_password_confirmation'],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['new_password'],
  })

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

interface ChangePasswordFormProps {
  onSuccess?: () => void
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    },
  })

  const onSubmit = async (data: ChangePasswordFormData) => {
    setServerError(null)
    try {
      const response = await profileService.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
        new_password_confirmation: data.new_password_confirmation,
      })

      if (response.success) {
        setShowSuccess(true)
        reset()
        setTimeout(() => {
          setShowSuccess(false)
          onSuccess?.()
        }, 3000)
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al cambiar la contraseña'
      setServerError(errorMessage)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md">
      {/* Título */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-segal-blue/10 dark:bg-segal-turquoise/10 rounded-lg">
          <Lock className="h-5 w-5 text-segal-blue dark:text-segal-turquoise" />
        </div>
        <h2 className="text-lg font-bold text-segal-dark dark:text-white">Cambiar Contraseña</h2>
      </div>

      {/* Mensaje de éxito */}
      {showSuccess && (
        <div className="rounded-lg bg-segal-green/10 dark:bg-green-950/30 border border-segal-green/30 dark:border-green-800 p-4 flex gap-3">
          <CheckCircle2 className="h-5 w-5 text-segal-green dark:text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-segal-green dark:text-green-400">Contraseña actualizada</p>
            <p className="text-sm text-segal-green/80 dark:text-green-400/80">Tu contraseña ha sido cambiada exitosamente</p>
          </div>
        </div>
      )}

      {/* Error del servidor */}
      {serverError && (
        <div className="rounded-lg bg-segal-red/10 dark:bg-red-950/30 border border-segal-red/30 dark:border-red-800 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-segal-red dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-segal-red dark:text-red-400">Error</p>
            <p className="text-sm text-segal-red/80 dark:text-red-400/80">{serverError}</p>
          </div>
        </div>
      )}

      {/* Contraseña actual */}
      <div className="space-y-2">
        <Label htmlFor="current_password" className="text-sm font-semibold text-segal-dark dark:text-white">
          Contraseña Actual <span className="text-segal-red dark:text-red-400">*</span>
        </Label>
        <Controller
          name="current_password"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="current_password"
              type="password"
              placeholder="Ingresa tu contraseña actual"
              className="border-segal-blue/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              disabled={isSubmitting || showSuccess}
            />
          )}
        />
        {errors.current_password && (
          <p className="text-sm text-segal-red dark:text-red-400">{errors.current_password.message}</p>
        )}
      </div>

      {/* Nueva contraseña */}
      <div className="space-y-2">
        <Label htmlFor="new_password" className="text-sm font-semibold text-segal-dark dark:text-white">
          Nueva Contraseña <span className="text-segal-red dark:text-red-400">*</span>
        </Label>
        <Controller
          name="new_password"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="new_password"
              type="password"
              placeholder="Ingresa tu nueva contraseña"
              className="border-segal-blue/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              disabled={isSubmitting || showSuccess}
            />
          )}
        />
        {errors.new_password && (
          <p className="text-sm text-segal-red dark:text-red-400">{errors.new_password.message}</p>
        )}
        <p className="text-xs text-segal-dark/60 dark:text-gray-400">
          Mínimo 8 caracteres, con al menos una mayúscula y un número
        </p>
      </div>

      {/* Confirmar nueva contraseña */}
      <div className="space-y-2">
        <Label htmlFor="new_password_confirmation" className="text-sm font-semibold text-segal-dark dark:text-white">
          Confirmar Nueva Contraseña <span className="text-segal-red dark:text-red-400">*</span>
        </Label>
        <Controller
          name="new_password_confirmation"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="new_password_confirmation"
              type="password"
              placeholder="Confirma tu nueva contraseña"
              className="border-segal-blue/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              disabled={isSubmitting || showSuccess}
            />
          )}
        />
        {errors.new_password_confirmation && (
          <p className="text-sm text-segal-red dark:text-red-400">{errors.new_password_confirmation.message}</p>
        )}
      </div>

      {/* Botón submit */}
      <Button
        type="submit"
        disabled={isSubmitting || showSuccess}
        className="w-full bg-segal-blue hover:bg-segal-blue/90 dark:bg-segal-turquoise dark:hover:bg-segal-turquoise/90 text-white dark:text-gray-900 font-semibold"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Actualizando...
          </>
        ) : (
          'Cambiar Contraseña'
        )}
      </Button>
    </form>
  )
}

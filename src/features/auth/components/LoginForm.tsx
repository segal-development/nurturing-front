import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { loginSchema, type LoginFormData } from '../utils/validation'

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export const LoginForm = ({ onSubmit, isLoading = false, error }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  })

  const handleSubmit = async (data: LoginFormData) => {
    try {
      await onSubmit(data)
    } catch (err) {
      // Error is handled by parent component
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-segal-dark dark:text-segal-light">
                Correo Electrónico
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="tu@correo.com"
                  disabled={isLoading}
                  className={`bg-transparent dark:bg-white/5 ${
                    fieldState.error
                      ? 'border-segal-red/50 focus:border-segal-red focus:ring-segal-red/20'
                      : 'border-segal-blue/20 dark:border-segal-blue/40 focus:border-segal-blue focus:ring-segal-blue/20'
                  } transition-colors`}
                />
              </FormControl>
              <FormMessage className="text-segal-red font-medium" />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-segal-dark dark:text-segal-light">
                Contraseña
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className={`pr-10 transition-colors bg-transparent dark:bg-white/5 ${
                      fieldState.error
                        ? 'border-segal-red/50 focus:border-segal-red focus:ring-segal-red/20'
                        : 'border-segal-blue/20 dark:border-segal-blue/40 focus:border-segal-blue focus:ring-segal-blue/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 rounded px-1 ${
                      fieldState.error
                        ? 'text-segal-red/60 hover:text-segal-red focus:ring-segal-red/50'
                        : 'text-segal-dark/60 dark:text-segal-light/60 hover:text-segal-blue focus:ring-segal-blue/50'
                    }`}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-segal-red font-medium" />
            </FormItem>
          )}
        />

        {/* Form Error Alert */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            aria-atomic="true"
            className="p-4 bg-segal-red/10 border border-segal-red/30 rounded-lg"
          >
            <p className="text-sm text-segal-red font-medium">
              {error}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-segal-blue hover:bg-segal-blue/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          disabled={isLoading || form.formState.isSubmitting}
          aria-busy={isLoading || form.formState.isSubmitting}
        >
          {isLoading || form.formState.isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>
      </form>
    </Form>
  )
}

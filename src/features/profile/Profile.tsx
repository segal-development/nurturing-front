/**
 * User Profile Page
 * Displays user information (read-only) and allows changing password
 */

import { useAuth } from '@/hooks/useAuth'
import { ChangePasswordForm } from './components/ChangePasswordForm'
import { User, Mail, Shield, Loader2, AlertCircle } from 'lucide-react'

export function Profile() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-segal-blue dark:text-segal-turquoise" />
          <p className="text-segal-dark/60 dark:text-gray-400">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-segal-red/30 dark:border-red-800 bg-segal-red/10 dark:bg-red-950/30 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-segal-red dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-segal-red dark:text-red-400 font-medium">Error al cargar perfil</p>
            <p className="text-sm text-segal-red/80 dark:text-red-400/80 mt-1">
              No pudimos cargar la información de tu perfil. Intenta recargar la página.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-segal-dark dark:text-white flex items-center gap-2">
          <User className="h-8 w-8 text-segal-blue dark:text-segal-turquoise" />
          Mi Perfil
        </h1>
        <p className="text-segal-dark/60 dark:text-gray-400 mt-2">
          Visualiza tu información de cuenta y administra tu contraseña
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel izquierdo: Información del usuario */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta de información */}
          <div className="rounded-lg border border-segal-blue/20 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-segal-dark dark:text-white mb-6">Información de Cuenta</h2>

            <div className="space-y-6">
              {/* ID de Usuario */}
              <div className="flex items-start justify-between pb-6 border-b border-segal-blue/10 dark:border-gray-700">
                <div>
                  <p className="text-sm text-segal-dark/60 dark:text-gray-400 font-medium">ID de Usuario</p>
                  <p className="text-lg font-semibold text-segal-dark dark:text-white mt-1">{user.id}</p>
                </div>
                <Shield className="h-5 w-5 text-segal-blue/40 dark:text-segal-turquoise/40" />
              </div>

              {/* Nombre completo */}
              <div className="flex items-start justify-between pb-6 border-b border-segal-blue/10 dark:border-gray-700">
                <div>
                  <p className="text-sm text-segal-dark/60 dark:text-gray-400 font-medium">Nombre Completo</p>
                  <p className="text-lg font-semibold text-segal-dark dark:text-white mt-1">{user.name}</p>
                </div>
                <User className="h-5 w-5 text-segal-blue/40 dark:text-segal-turquoise/40" />
              </div>

              {/* Email */}
              <div className="flex items-start justify-between pb-6 border-b border-segal-blue/10 dark:border-gray-700">
                <div>
                  <p className="text-sm text-segal-dark/60 dark:text-gray-400 font-medium">Correo Electrónico</p>
                  <p className="text-lg font-semibold text-segal-dark dark:text-white mt-1 break-all">{user.email}</p>
                </div>
                <Mail className="h-5 w-5 text-segal-blue/40 dark:text-segal-turquoise/40" />
              </div>

              {/* Rol */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-segal-dark/60 dark:text-gray-400 font-medium">Rol</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-segal-blue/10 dark:bg-segal-turquoise/10 px-3 py-1 text-sm font-semibold text-segal-blue dark:text-segal-turquoise border border-segal-blue/20 dark:border-segal-turquoise/20">
                      {user.role || 'Usuario'}
                    </span>
                  </div>
                </div>
                <Shield className="h-5 w-5 text-segal-blue/40 dark:text-segal-turquoise/40" />
              </div>

              {/* Nota de campos no editables */}
              <div className="mt-8 p-4 rounded-lg bg-segal-blue/5 dark:bg-gray-800 border border-segal-blue/10 dark:border-gray-700">
                <p className="text-sm text-segal-dark/70 dark:text-gray-300">
                  <span className="font-semibold">ℹ️ Nota:</span> La información de tu perfil no puede
                  ser editada. Si necesitas hacer cambios en tu nombre o email, contacta al
                  administrador del sistema.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho: Cambio de contraseña */}
        <div className="rounded-lg border border-segal-blue/20 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm h-fit sticky top-6">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}

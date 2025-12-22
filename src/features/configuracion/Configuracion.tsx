/**
 * Página de Configuraciones del Sistema
 * Permite configurar precios, límites y notificaciones
 */

import { useState, useEffect } from 'react'
import { Loader2, Settings, AlertCircle, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { configuracionService } from '@/api/configuracion.service'
import type { Configuracion } from '@/types/configuracion'

type NotificationType = 'success' | 'error' | null

export function ConfiguracionPage() {
  const [, setConfiguracion] = useState<Configuracion | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{
    type: NotificationType
    message: string
  } | null>(null)

  // Estados del formulario
  const [emailCosto, setEmailCosto] = useState('0')
  const [smsCosto, setSmsCosto] = useState('0')
  const [maxProspectos, setMaxProspectos] = useState('')
  const [maxEmailsPorDia, setMaxEmailsPorDia] = useState('')
  const [maxSmsPorDia, setMaxSmsPorDia] = useState('')
  const [reintentos, setReintentos] = useState('')

  // Cargar configuración al montar el componente
  useEffect(() => {
    cargarConfiguracion()
  }, [])

  // Auto-cerrar notificación después de 4 segundos si es exitosa
  useEffect(() => {
    if (notification?.type === 'success') {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const cargarConfiguracion = async () => {
    try {
      setLoading(true)
      const data = await configuracionService.obtener()
      setConfiguracion(data)

      // Cargar valores en el formulario
      setEmailCosto(String(data.email_costo || 0))
      setSmsCosto(String(data.sms_costo || 0))
      setMaxProspectos(String(data.max_prospectos_por_flujo || ''))
      setMaxEmailsPorDia(String(data.max_emails_por_dia || ''))
      setMaxSmsPorDia(String(data.max_sms_por_dia || ''))
      setReintentos(String(data.reintentos_envio || ''))
    } catch (error) {
      console.error('Error al cargar configuración:', error)
      setNotification({
        type: 'error',
        message: 'Error al cargar la configuración',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    try {
      setSaving(true)
      setNotification(null)

      await configuracionService.actualizar({
        email_costo: parseFloat(emailCosto) || 0,
        sms_costo: parseFloat(smsCosto) || 0,
        max_prospectos_por_flujo: maxProspectos ? parseInt(maxProspectos) : undefined,
        max_emails_por_dia: maxEmailsPorDia ? parseInt(maxEmailsPorDia) : undefined,
        max_sms_por_dia: maxSmsPorDia ? parseInt(maxSmsPorDia) : undefined,
        reintentos_envio: reintentos ? parseInt(reintentos) : undefined,
      })

      setNotification({
        type: 'success',
        message: 'Configuración guardada correctamente',
      })

      // Recargar configuración
      await cargarConfiguracion()
    } catch (error: any) {
      console.error('Error al guardar configuración:', error)
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Error al guardar la configuración',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-segal-blue dark:text-segal-turquoise" />
          <p className="text-segal-dark/60 dark:text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-segal-dark dark:text-white flex items-center gap-2">
          <Settings className="h-8 w-8 text-segal-blue dark:text-segal-turquoise" />
          Configuraciones
        </h1>
        <p className="text-segal-dark/60 dark:text-gray-400 mt-2">
          Gestiona los precios, límites y notificaciones del sistema
        </p>
      </div>

      {/* Notificación */}
      {notification && (
        <div
          className={`flex items-center justify-between gap-3 rounded-lg border p-4 ${
            notification.type === 'success'
              ? 'border-segal-green/30 dark:border-green-800 bg-segal-green/10 dark:bg-green-950/30'
              : 'border-segal-red/30 dark:border-red-800 bg-segal-red/10 dark:bg-red-950/30'
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-segal-green dark:text-green-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-segal-red dark:text-red-400 shrink-0" />
            )}
            <p
              className={
                notification.type === 'success'
                  ? 'text-segal-green dark:text-green-400 font-medium'
                  : 'text-segal-red dark:text-red-400 font-medium'
              }
            >
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className={`shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
              notification.type === 'success'
                ? 'text-segal-green dark:text-green-400 hover:bg-segal-green/20 dark:hover:bg-green-900/50'
                : 'text-segal-red dark:text-red-400 hover:bg-segal-red/20 dark:hover:bg-red-900/50'
            }`}
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Sección de Precios */}
      <div className="rounded-lg border border-segal-blue/10 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-segal-dark dark:text-white">Precios de Envío</h2>
          <p className="text-sm text-segal-dark/60 dark:text-gray-400 mt-1">
            Define el costo unitario para cada tipo de mensaje
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Costo Email */}
          <div className="space-y-2">
            <Label htmlFor="email-costo" className="text-sm font-semibold text-segal-dark dark:text-white">
              Costo por Email <span className="text-segal-red dark:text-red-400">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-segal-dark dark:text-white">$</span>
              <Input
                id="email-costo"
                type="number"
                min="0"
                step="0.01"
                value={emailCosto}
                onChange={(e) => setEmailCosto(e.target.value)}
                className="border-segal-blue/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-segal-blue dark:focus:border-segal-turquoise"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-segal-dark/60 dark:text-gray-400">Precio unitario por email enviado</p>
          </div>

          {/* Costo SMS */}
          <div className="space-y-2">
            <Label htmlFor="sms-costo" className="text-sm font-semibold text-segal-dark dark:text-white">
              Costo por SMS <span className="text-segal-red dark:text-red-400">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-segal-dark dark:text-white">$</span>
              <Input
                id="sms-costo"
                type="number"
                min="0"
                step="0.01"
                value={smsCosto}
                onChange={(e) => setSmsCosto(e.target.value)}
                className="border-segal-blue/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-segal-blue dark:focus:border-segal-turquoise"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-segal-dark/60 dark:text-gray-400">Precio unitario por SMS enviado</p>
          </div>
        </div>

        {/* Resumen de Precios */}
        <div className="mt-6 rounded-lg bg-segal-blue/5 dark:bg-gray-800 border border-segal-blue/10 dark:border-gray-700 p-4">
          <p className="text-sm text-segal-dark/70 dark:text-gray-300">
            <span className="font-semibold">Resumen:</span> Email: ${emailCosto} | SMS: ${smsCosto}
          </p>
        </div>
      </div>

      {/* Sección de Límites */}
      <div className="rounded-lg border border-segal-blue/10 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-segal-dark dark:text-white">Límites y Restricciones</h2>
          <p className="text-sm text-segal-dark/60 dark:text-gray-400 mt-1">
            Configura límites para proteger los recursos del sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Max Prospectos */}
          <div className="space-y-2">
            <Label htmlFor="max-prospectos" className="text-sm font-semibold text-segal-dark dark:text-white">
              Máx. Prospectos por Flujo
            </Label>
            <Input
              id="max-prospectos"
              type="number"
              min="1"
              value={maxProspectos}
              onChange={(e) => setMaxProspectos(e.target.value)}
              className="border-segal-blue/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-segal-blue dark:focus:border-segal-turquoise"
              placeholder="Sin límite"
            />
            <p className="text-xs text-segal-dark/60 dark:text-gray-400">Dejar vacío para sin límite</p>
          </div>

          {/* Max Emails por día */}
          <div className="space-y-2">
            <Label htmlFor="max-emails-dia" className="text-sm font-semibold text-segal-dark dark:text-white">
              Máx. Emails por Día
            </Label>
            <Input
              id="max-emails-dia"
              type="number"
              min="1"
              value={maxEmailsPorDia}
              onChange={(e) => setMaxEmailsPorDia(e.target.value)}
              className="border-segal-blue/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-segal-blue dark:focus:border-segal-turquoise"
              placeholder="Sin límite"
            />
            <p className="text-xs text-segal-dark/60 dark:text-gray-400">Dejar vacío para sin límite</p>
          </div>

          {/* Max SMS por día */}
          <div className="space-y-2">
            <Label htmlFor="max-sms-dia" className="text-sm font-semibold text-segal-dark dark:text-white">
              Máx. SMS por Día
            </Label>
            <Input
              id="max-sms-dia"
              type="number"
              min="1"
              value={maxSmsPorDia}
              onChange={(e) => setMaxSmsPorDia(e.target.value)}
              className="border-segal-blue/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-segal-blue dark:focus:border-segal-turquoise"
              placeholder="Sin límite"
            />
            <p className="text-xs text-segal-dark/60 dark:text-gray-400">Dejar vacío para sin límite</p>
          </div>

          {/* Reintentos */}
          <div className="space-y-2">
            <Label htmlFor="reintentos" className="text-sm font-semibold text-segal-dark dark:text-white">
              Reintentos de Envío
            </Label>
            <Input
              id="reintentos"
              type="number"
              min="0"
              value={reintentos}
              onChange={(e) => setReintentos(e.target.value)}
              className="border-segal-blue/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-segal-blue dark:focus:border-segal-turquoise"
              placeholder="0"
            />
            <p className="text-xs text-segal-dark/60 dark:text-gray-400">Intentos adicionales en caso de fallo</p>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={cargarConfiguracion}
          disabled={saving}
          className="border-segal-blue/20 dark:border-gray-600 text-segal-blue dark:text-segal-turquoise hover:bg-segal-blue/5 dark:hover:bg-gray-800"
        >
          Descartar cambios
        </Button>
        <Button
          onClick={handleGuardar}
          disabled={saving}
          className="bg-segal-blue hover:bg-segal-blue/90 dark:bg-segal-turquoise dark:hover:bg-segal-turquoise/90 text-white dark:text-gray-900"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar Configuración'
          )}
        </Button>
      </div>
    </div>
  )
}

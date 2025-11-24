export const TIPO_DEUDA_OPTIONS = [
  { value: 'cero', label: 'Deuda 0' },
  { value: 'baja', label: 'Deuda Baja' },
  { value: 'media', label: 'Deuda Media' },
  { value: 'alta', label: 'Deuda Alta' },
  { value: 'antiguos', label: 'Antiguos' },
  { value: 'no-contactados', label: 'No Contactados' },
] as const;

export const ESTADO_PROSPECTO_OPTIONS = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'convertido', label: 'Convertido' },
] as const;

export const TIPO_MENSAJE_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'ambos', label: 'Ambos' },
] as const;

export const ESTADO_ENVIO_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'fallido', label: 'Fallido' },
  { value: 'programado', label: 'Programado' },
] as const;

export const DIAS_FLUJO = [15, 30, 45, 60, 90, 150, 365] as const;

export const ESTADO_ENVIO_COLORS = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  enviado: 'bg-green-100 text-green-800',
  fallido: 'bg-red-100 text-red-800',
  programado: 'bg-blue-100 text-blue-800',
} as const;

export const TIPO_DEUDA_COLORS = {
  cero: 'bg-green-100 text-green-800',
  baja: 'bg-blue-100 text-blue-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-red-100 text-red-800',
  antiguos: 'bg-purple-100 text-purple-800',
  'no-contactados': 'bg-gray-100 text-gray-800',
} as const;

export const ESTADO_PROSPECTO_COLORS = {
  activo: 'bg-segal-green/10 text-segal-green border-segal-green/20',
  inactivo: 'bg-segal-orange/10 text-segal-orange border-segal-orange/20',
  convertido: 'bg-segal-dark/10 text-segal-dark border-segal-dark/20',
} as const;
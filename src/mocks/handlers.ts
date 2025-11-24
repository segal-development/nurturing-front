import { http, HttpResponse } from 'msw'
import { MOCK_FLUJOS } from './data/flujos'
import { MOCK_OFERTAS } from './data/ofertas'
import { MOCK_ENVIOS } from './data/envios'

// Mock usuarios para testing
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'Admin123456', // Solo para desarrollo
    nombre: 'Admin User',
    rol: 'admin' as const
  },
  {
    id: '2',
    email: 'user@example.com',
    password: 'User123456', // Solo para desarrollo
    nombre: 'Regular User',
    rol: 'user' as const
  },
  {
    id: '3',
    email: 'test@ejemplo.com',
    password: 'Test123456', // Solo para desarrollo
    nombre: 'Test User',
    rol: 'user' as const
  }
]

export const handlers = [
  // POST /auth/login - Intercepta tanto URLs relativas como absolutas
  http.post('*/auth/login', async ({ request }) => {
    try {
      const { email, password } = await request.json() as {
        email: string
        password: string
      }

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 800))

      // Validar credenciales
      const user = MOCK_USERS.find(u => u.email === email && u.password === password)

      if (!user) {
        return HttpResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        )
      }

      // Generar JWT mock (en producción, sería generado por backend)
      const mockToken = btoa(
        JSON.stringify({
          sub: user.id,
          email: user.email,
          rol: user.rol,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600 // 1 hora
        })
      )

      return HttpResponse.json({
        token: mockToken,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          rol: user.rol
        }
      })
    } catch (error) {
      console.error('[MSW] Error en login handler:', error)
      return HttpResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }),

  // POST /auth/refresh-token
  http.post('*/auth/refresh-token', () => {
    const newToken = btoa(
      JSON.stringify({
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      })
    )

    return HttpResponse.json({
      token: newToken,
      expiresIn: 3600
    })
  }),

  // POST /auth/logout
  http.post('*/auth/logout', () => {
    return HttpResponse.json({ success: true })
  }),

  // FLUJOS ENDPOINTS
  // GET /flujos - Lista de flujos
  http.get('*/flujos', ({ request }) => {
    const url = new URL(request.url)
    const tipoProspecto = url.searchParams.get('tipoProspecto')
    const activo = url.searchParams.get('activo')

    let flujos = [...MOCK_FLUJOS]

    if (tipoProspecto) {
      flujos = flujos.filter((f) => f.tipo_prospecto === tipoProspecto)
    }
    if (activo !== null) {
      flujos = flujos.filter((f) => f.activo === (activo === 'true'))
    }

    return HttpResponse.json({
      data: flujos,
      total: flujos.length,
    })
  }),

  // GET /flujos/:id - Detalle de flujo
  http.get('*/flujos/:id', ({ params }) => {
    const flujo = MOCK_FLUJOS.find((f) => f.id === Number(params.id))
    if (!flujo) {
      return HttpResponse.json({ error: 'Flujo no encontrado' }, { status: 404 })
    }
    return HttpResponse.json(flujo)
  }),

  // POST /flujos - Crear flujo
  http.post('*/flujos', async ({ request }) => {
    const data = (await request.json()) as Record<string, unknown>
    const newFlujo = {
      id: Math.max(...MOCK_FLUJOS.map((f) => f.id)) + 1,
      nombre: (data.nombre as string) || 'Nuevo Flujo',
      tipo_prospecto: (data.tipo_prospecto as string) || 'deuda-baja',
      activo: (data.activo as boolean) ?? true,
      ...data,
      etapas: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    MOCK_FLUJOS.push(newFlujo as typeof MOCK_FLUJOS[0])
    return HttpResponse.json(newFlujo, { status: 201 })
  }),

  // PUT /flujos/:id - Actualizar flujo
  http.put('*/flujos/:id', async ({ params, request }) => {
    const flujo = MOCK_FLUJOS.find((f) => f.id === Number(params.id))
    if (!flujo) {
      return HttpResponse.json({ error: 'Flujo no encontrado' }, { status: 404 })
    }
    const data = (await request.json()) as Record<string, unknown>
    const updated = { ...flujo, ...data, updated_at: new Date().toISOString() }
    const index = MOCK_FLUJOS.findIndex((f) => f.id === Number(params.id))
    MOCK_FLUJOS[index] = updated as typeof MOCK_FLUJOS[0]
    return HttpResponse.json(updated)
  }),

  // DELETE /flujos/:id - Eliminar flujo
  http.delete('*/flujos/:id', ({ params }) => {
    const index = MOCK_FLUJOS.findIndex((f) => f.id === Number(params.id))
    if (index === -1) {
      return HttpResponse.json({ error: 'Flujo no encontrado' }, { status: 404 })
    }
    MOCK_FLUJOS.splice(index, 1)
    return HttpResponse.json({ success: true })
  }),

  // OFERTAS ENDPOINTS
  // GET /ofertas - Lista de ofertas
  http.get('*/ofertas', ({ request }) => {
    const url = new URL(request.url)
    const activa = url.searchParams.get('activa')

    let ofertas = [...MOCK_OFERTAS]

    if (activa !== null) {
      ofertas = ofertas.filter((o) => o.activo === (activa === 'true'))
    }

    return HttpResponse.json({
      data: ofertas,
      total: ofertas.length,
    })
  }),

  // GET /ofertas/:id - Detalle de oferta
  http.get('*/ofertas/:id', ({ params }) => {
    const oferta = MOCK_OFERTAS.find((o) => o.id === Number(params.id))
    if (!oferta) {
      return HttpResponse.json({ error: 'Oferta no encontrada' }, { status: 404 })
    }
    return HttpResponse.json(oferta)
  }),

  // POST /ofertas - Crear oferta
  http.post('*/ofertas', async ({ request }) => {
    const data = (await request.json()) as Record<string, unknown>
    const newOferta = {
      id: Math.max(...MOCK_OFERTAS.map((o) => o.id)) + 1,
      ...data,
      impresiones: 0,
      clicks: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    MOCK_OFERTAS.push(newOferta as typeof MOCK_OFERTAS[0])
    return HttpResponse.json(newOferta, { status: 201 })
  }),

  // PUT /ofertas/:id - Actualizar oferta
  http.put('*/ofertas/:id', async ({ params, request }) => {
    const oferta = MOCK_OFERTAS.find((o) => o.id === Number(params.id))
    if (!oferta) {
      return HttpResponse.json({ error: 'Oferta no encontrada' }, { status: 404 })
    }
    const data = (await request.json()) as Record<string, unknown>
    const updated = { ...oferta, ...data, updated_at: new Date().toISOString() }
    const index = MOCK_OFERTAS.findIndex((o) => o.id === Number(params.id))
    MOCK_OFERTAS[index] = updated as typeof MOCK_OFERTAS[0]
    return HttpResponse.json(updated)
  }),

  // DELETE /ofertas/:id - Eliminar oferta
  http.delete('*/ofertas/:id', ({ params }) => {
    const index = MOCK_OFERTAS.findIndex((o) => o.id === Number(params.id))
    if (index === -1) {
      return HttpResponse.json({ error: 'Oferta no encontrada' }, { status: 404 })
    }
    MOCK_OFERTAS.splice(index, 1)
    return HttpResponse.json({ success: true })
  }),

  // ENVIOS ENDPOINTS
  // GET /envios - Lista de envíos
  http.get('*/envios', ({ request }) => {
    const url = new URL(request.url)
    const flujoId = url.searchParams.get('flujoId')
    const estado = url.searchParams.get('estado')

    let envios = [...MOCK_ENVIOS]

    if (flujoId) {
      envios = envios.filter((e) => e.flujoId === Number(flujoId))
    }
    if (estado) {
      envios = envios.filter((e) => e.estado === estado)
    }

    return HttpResponse.json({
      data: envios,
      total: envios.length,
    })
  }),

  // GET /envios/stats - Estadísticas de envíos
  http.get('*/envios/stats', () => {
    const total = MOCK_ENVIOS.length
    const exitosos = MOCK_ENVIOS.filter((e) => e.estado === 'enviado' || e.estado === 'abierto').length
    const fallidos = MOCK_ENVIOS.filter((e) => e.estado === 'fallido').length
    const aceptados = MOCK_ENVIOS.filter((e) => e.estado === 'aceptado').length

    return HttpResponse.json({
      totalEnvios: total,
      enviosExitosos: exitosos,
      enviosFallidos: fallidos,
      enviosAceptados: aceptados,
      tasaEntrega: ((exitosos / total) * 100).toFixed(2),
      tasaAceptacion: ((aceptados / total) * 100).toFixed(2),
    })
  }),

  // GET /monitor/stats - Estadísticas completas del monitor
  http.get('*/monitor/stats', () => {
    const getTipoProspectoKey = (tipoProspecto: any): string => {
      return typeof tipoProspecto === 'string' ? tipoProspecto : tipoProspecto?.nombre || 'unknown'
    }

    const flujosPorTipo = MOCK_FLUJOS.reduce(
      (acc, f) => {
        const key = getTipoProspectoKey(f.tipo_prospecto)
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const enviosHoy = MOCK_ENVIOS.filter((e) => {
      const hoy = new Date()
      const fecha = new Date(e.fechaEnvio)
      return fecha.toDateString() === hoy.toDateString()
    }).length

    return HttpResponse.json({
      totalProspectos: 1250,
      flujosActivos: MOCK_FLUJOS.filter((f) => f.activo).length,
      ofertasActivas: MOCK_OFERTAS.filter((o) => o.activo).length,
      enviosProgramados: MOCK_ENVIOS.filter((e) => e.estado === 'pendiente').length,
      enviosEnviadosHoy: enviosHoy,
      enviosEnviadosTotales: MOCK_ENVIOS.filter((e) => e.estado !== 'fallido').length,
      tasaEntrega: '94.5',
      flujosPorTipo,
    })
  }),
]

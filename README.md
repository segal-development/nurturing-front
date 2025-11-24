# 🚀 Nurturing Dashboard - Segal

Sistema de gestión de flujos de nurturing para contacto y seguimiento de prospectos con envío de emails y SMS.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.x-green?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-blue?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

## 📋 Descripción

Nurturing Dashboard es una aplicación web moderna construida con **React 19** y **TypeScript** que permite:

- 📊 **Gestionar Prospectos** - Importar, filtrar y organizar contactos desde Excel
- 🔄 **Crear Flujos de Nurturing** - Diseñar campañas de múltiples etapas
- 💰 **Configurar Precios** - Establecer costos de email y SMS
- 📈 **Monitorear Envíos** - Seguimiento en tiempo real de campañas
- 🏢 **Gestionar Ofertas** - Vincular ofertas Infocom a los flujos

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** - Framework UI moderno
- **TypeScript** - Tipado estático
- **Vite** - Build tool rápido (HMR)
- **Tailwind CSS** - Estilos utility-first
- **React Router v6** - Enrutamiento
- **React Hook Form** - Gestión de formularios
- **Zod** - Validación de esquemas
- **TanStack React Query** - Gestión de servidor state
- **Zustand** - Gestión de estado global
- **shadcn/ui** - Componentes accesibles
- **ExcelJS** - Lectura de archivos Excel
- **Axios** - Cliente HTTP con interceptores

### Backend (Laravel 12)
- **Sanctum** - Autenticación session-based
- **MySQL** - Base de datos
- **Queue Jobs** - Procesamiento asincrónico

## ⚡ Quick Start

### Requisitos
- Node.js 20.19+ o 22.12+
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/nurturing-dashboard.git
cd nurturing-dashboard

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env y configurar VITE_API_BASE_URL

# Iniciar servidor de desarrollo
npm run dev

# Abre http://localhost:5173
```

## 📦 Estructura del Proyecto

```
src/
├── api/                # Servicios API
├── components/         # Componentes reutilizables
│   ├── ui/            # shadcn/ui components
│   └── layout/        # Layout components
├── context/           # React Context
├── features/          # Módulos principales
│   ├── auth/          # Autenticación
│   ├── prospectos/    # Gestión de prospectos
│   ├── flujos/        # Gestión de flujos
│   ├── ofertas/       # Gestión de ofertas
│   ├── monitor/       # Monitor de envíos
│   └── configuracion/ # Configuraciones
├── hooks/             # Custom hooks
├── lib/               # Utilidades
├── pages/             # Páginas wrapper
├── router/            # Configuración de rutas
├── types/             # Tipos TypeScript
└── main.tsx           # Entry point
```

## 🚀 Scripts

```bash
npm run dev           # Desarrollo con HMR
npm run build         # Build producción
npm run preview       # Preview del build
npm run lint          # ESLint check
npm run test          # Vitest
npm run test:ui       # UI de tests
npm run test:coverage # Coverage report
```

## 🔑 Características Principales

### ✅ Autenticación
- Login seguro con Laravel Sanctum
- Manejo automático de CSRF tokens
- Protección de rutas

### ✅ Gestión de Prospectos
- Importar desde Excel con validación inteligente
- Filtrado por origen de datos
- Búsqueda (nombre, email, teléfono)
- Paginación profesional

### ✅ Flujos de Nurturing (3-Step Wizard)
1. **Seleccionar Origen** - Elegir fuente de datos
2. **Seleccionar Prospectos** - Checkboxes con counter
3. **Configurar Flujo** - Nombre, tipo, mensaje y costos

Cálculo automático de costos:
- Email: $1
- SMS: $11
- Ambos: Distribución personalizada

### ✅ Configuraciones
- 💰 Precios de Email y SMS
- ⚙️ Límites de envío
- 🔄 Reintentos
- 💾 Guardado automático

### ✅ Diseño UI/UX
- Colores corporativos de Segal
- Interfaz responsiva (mobile, tablet, desktop)
- Componentes accesibles
- Feedback visual (success, error, loading)

## 🔗 API Endpoints

```
POST   /auth/login
GET    /auth/me
POST   /auth/logout

GET    /prospectos?origen=...&page=...
POST   /importaciones
GET    /importaciones/opciones-filtrado

GET    /flujos?origen_id=...&tipo_deudor=...
GET    /flujos/opciones-filtrado
POST   /flujos/crear-con-prospectos
POST   /flujos/{id}/ejecutar
GET    /flujos/ejecuciones/{id}
GET    /flujos/{id}/ejecuciones

GET    /configuracion
PUT    /configuracion

GET    /ofertas
```

## 🎨 Colores

```
Segal Blue:     #0066CC
Segal Green:    #2ECC71
Segal Red:      #E74C3C
Segal Turquoise: #00ACC1
Segal Dark:     #1A1A1A
```

## 📱 Responsividad

- Mobile: < 640px (vertical)
- Tablet: 640px - 1024px (adaptable)
- Desktop: > 1024px (horizontal completo)

## 🔐 Seguridad

- ✅ CSRF Token protection
- ✅ Validación Zod
- ✅ Rutas protegidas
- ✅ Manejo de cookies seguro
- ✅ Error handling robusto

## ♿ Accesibilidad

- ✅ Navegación por teclado
- ✅ ARIA labels
- ✅ Contraste WCAG AA
- ✅ Estructura semántica

## 📋 Próximas Características

- [ ] Modal de progreso de ejecución
- [ ] Estadísticas con cards
- [ ] Progress bar visual
- [ ] Jobs de envío real
- [ ] Webhooks para tracking
- [ ] Reportes y analytics
- [ ] Sistema de permisos y roles
- [ ] Edición de flujos

## 📊 Estadísticas

- **Componentes**: 50+
- **Tipos**: 40+
- **Servicios API**: 5
- **Páginas**: 6

## 👥 Contribuciones

Las contribuciones son bienvenidas:

```bash
git checkout -b feature/nueva-funcionalidad
git commit -m "feat: descripción"
git push origin feature/nueva-funcionalidad
```

## 📄 Licencia

MIT © 2025 Segal

## 👨‍💻 Autor

**Marcelo Toro**
- Email: mtoro@segal.cl
- GitHub: [@marceloyvale](https://github.com/marceloyvale)

## 📞 Soporte

Para issues o sugerencias, abre un GitHub Issue.

---

**Estado**: En desarrollo activo 🚀 | **Última actualización**: Noviembre 2025

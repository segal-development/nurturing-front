# Arquitectura Final de Plantillas de Email

## Resumen Ejecutivo

Se implementó un sistema híbrido de plantillas de email que combina:

1. **Editor de componentes modular** (existente) - Estilo Mailchimp/Brevo
2. **Bloques reutilizables con react-email** (nuevo) - Para templates complejas
3. **Exportación agnóstica a proveedores** - Compatible con SendGrid, Mailgun, AWS SES, SMTP

---

## Estructura de Archivos

```
src/features/plantillas/
├── components/
│   ├── email/                           # Editor de componentes (EXISTENTE)
│   │   ├── EmailPreview.tsx             # Vista previa del email renderizado
│   │   ├── EmailComponentEditor.tsx     # Editor de componentes
│   │   └── components/
│   │       ├── TextoComponentEditor.tsx
│   │       ├── LogoComponentEditor.tsx
│   │       ├── BotonComponentEditor.tsx
│   │       ├── SeparadorComponentEditor.tsx
│   │       └── FooterComponentEditor.tsx
│   │
│   ├── EmailTemplates/                  # Bloques de react-email (NUEVO)
│   │   ├── BaseEmailTemplate.tsx        # Template HTML base
│   │   ├── EmailBlock.tsx               # Bloques individuales
│   │   ├── EmailTemplatePreview.tsx     # Preview con iframe
│   │   ├── EmailTemplateBuilder.tsx     # Builder visual completo
│   │   ├── index.ts                     # Exports
│   │   └── README.md                    # Documentación
│   │
│   ├── EmailTemplateEditor.tsx          # Editor principal (usa EmailComponentEditor)
│   ├── SMSTemplateEditor.tsx            # Editor SMS (160 caracteres)
│   ├── PlantillaCrearDialog.tsx         # Dialog para crear (elige SMS o Email)
│   ├── PlantillaEditarDialog.tsx        # Dialog para editar
│   ├── PlantillaDetailDialog.tsx        # Dialog para ver detalles
│   ├── PlantillaEliminarDialog.tsx      # Dialog para eliminar
│   └── PlantillasTable.tsx              # Tabla con acciones
│
├── utils/
│   ├── plantillaValidator.ts            # Validaciones Zod
│   ├── emailRenderer.ts                 # Renderiza a HTML/MJML (NUEVO)
│   └── emailBodyParser.ts               # Parse de contenido
│
├── hooks/
│   └── usePlantillas.ts                 # Hook con React Query para obtener plantillas
│
├── schemas/
│   └── plantillaSchemas.ts              # Esquemas Zod para validación
│
└── pages/
    └── PlantillasPage.tsx               # Página principal de gestión
```

---

## Flujos de Trabajo

### 1. **Crear Plantilla SMS**

```
User → PlantillaCrearDialog
        ↓
    Selecciona "SMS"
        ↓
    SMSTemplateEditor
        ├─ Input: nombre, descripción, contenido (max 160 chars)
        ├─ Validación: Zod schema
        └─ Output: PlantillaSMSFormData
        ↓
    plantillasService.crearPlantillaSMS()
        ↓
    Backend: POST /api/plantillas/sms
        ↓
    Base de datos
```

### 2. **Crear Plantilla Email con Editor Modular**

```
User → PlantillaCrearDialog
        ↓
    Selecciona "Email"
        ↓
    EmailTemplateEditor
        ├─ Input: nombre, asunto, descripción
        ├─ Agregar componentes (Logo, Texto, Botón, Separador, Footer)
        ├─ EmailComponentEditor (edita cada componente)
        └─ EmailPreview (muestra preview en vivo)
        ↓
    Validación: plantillaEmailSchema (Zod)
        ↓
    plantillasService.crearPlantillaEmail()
        ↓
    Backend: POST /api/plantillas/email
        ├─ Guarda: nombre, asunto, descripción, activo
        ├─ Guarda: componentes (array JSON)
        └─ Estructura: componentes[].{tipo, contenido{...}}
        ↓
    Base de datos
```

### 3. **Renderizar Email para Envío**

```
Backend necesita enviar email
        ↓
    Carga plantilla (id, componentes[])
        ↓
    emailRenderer.exportEmailForBackend()
        ├─ Renderiza HTML limpio
        ├─ Genera MJML (optional)
        └─ Returns: { html, mjml, bloques }
        ↓
    Backend envía por proveedor:
        ├─ SendGrid (soporta HTML directo)
        ├─ Mailgun (HTML limpio)
        ├─ AWS SES (HTML + plain text)
        ├─ SMTP (HTML limpio)
        └─ Mailchimp (MJML compatible)
```

---

## Tipos de Datos

### PlantillaSMS

```typescript
interface PlantillaSMS {
  id: number
  tipo: 'sms'
  nombre: string
  descripcion: string
  contenido: string        // Max 160 caracteres
  activo: boolean
  creado_en: string
  actualizado_en: string
}
```

### PlantillaEmail

```typescript
interface PlantillaEmail {
  id: number
  tipo: 'email'
  nombre: string
  descripcion: string
  asunto: string
  activo: boolean
  componentes: EmailComponent[]  // Array de componentes
  creado_en: string
  actualizado_en: string
}

interface EmailComponent {
  id: string
  tipo: 'logo' | 'texto' | 'boton' | 'separador' | 'footer'
  orden: number
  contenido: {
    // Varía según tipo
    [key: string]: any
  }
}
```

### EmailBlockData (react-email - Para futuros templates avanzados)

```typescript
interface EmailBlockData {
  type: 'text' | 'heading' | 'button' | 'link' | 'section'
  content?: string
  href?: string
  buttonText?: string
  align?: 'left' | 'center' | 'right'
  color?: 'gray' | 'blue' | 'green' | 'red'
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl'
}
```

---

## Componentes Detallados

### EmailComponentEditor (Existente)

**Responsabilidad:** Permitir edición visual de componentes individuales

**Componentes soportados:**
- **Logo**: URL, alt text, ancho, altura
- **Texto**: Contenido, tamaño fuente, color, negrita, itálica, alineación, enlaces
- **Botón**: Texto, URL, color fondo, color texto
- **Separador**: Altura, color
- **Footer**: Texto, enlaces, mostrar fecha

**Características:**
```tsx
<EmailComponentEditor
  componente={componente}
  onChange={(updated) => updateComponente(updated)}
  onDelete={() => deleteComponente()}
/>
```

---

### EmailPreview (Existente)

**Responsabilidad:** Renderizar vista previa del email

**Features:**
- Renderiza cada tipo de componente HTML-compatible
- Muestra asunto y remitente
- Información visual clara
- Responsive design

---

### EmailTemplateBuilder (Nuevo - react-email)

**Responsabilidad:** Builder visual para templates complejas con bloques

**Features:**
- Agregar/editar/eliminar bloques
- Reordenar bloques (drag or buttons)
- Preview en vivo
- Exportar a HTML/MJML

**Cuándo usar:**
- Para emails complejos con muchos bloques
- Cuando necesitas estilos Tailwind CSS avanzados
- Para automatización compleja con variables

---

## Integración con Flow Builder

### Flujo: Seleccionar Plantilla en Stage

```
StageNode (Edit Mode)
    ↓
PlantillaSelector
    ├─ Modo: "Plantillas Guardadas" vs "Escribir Contenido"
    │
    ├─ Si es SMS:
    │   └─ usePlantillasSMS() → Dropdown de plantillas SMS
    │
    ├─ Si es Email:
    │   └─ usePlantillasEmail() → Dropdown de plantillas Email
    │
    └─ Si es Ambos:
        ├─ Dropdown SMS
        └─ Dropdown Email
    ↓
updateNode({
  plantilla_id: 123,           // ID de plantilla SMS
  plantilla_id_email: 456,     // ID de plantilla Email
  plantilla_type: 'reference', // 'reference' | 'inline'
  plantilla_mensaje: undefined // Solo si inline
})
    ↓
flowBuilderStore → Zustand
    ↓
flowMapper.mapStagesToBackend() → StageData[]
    ↓
Backend: POST /api/flujos/crear
```

---

## Validación

### SMS Template
```typescript
plantillaSMSSchema = z.object({
  nombre: z.string().min(1, "Requerido"),
  descripcion: z.string(),
  contenido: z.string()
    .min(1, "Requerido")
    .max(160, "Máximo 160 caracteres"),
  tipo: z.literal('sms'),
  activo: z.boolean()
})
```

### Email Template
```typescript
plantillaEmailSchema = z.object({
  nombre: z.string().min(1, "Requerido"),
  descripcion: z.string(),
  asunto: z.string().min(1, "Asunto requerido"),
  componentes: z.array(emailComponentSchema),
  tipo: z.literal('email'),
  activo: z.boolean()
})
```

### Flow Validation
```typescript
validateStagePlantillas(storeNodes):
  ├─ Verifica cada stage
  ├─ Si plantilla_type='inline' → require contenido
  └─ Si plantilla_type='reference' → require plantilla_id
```

---

## Ejemplos de Uso

### Crear Email con Editor Modular

```tsx
<PlantillaCrearDialog
  open={true}
  onOpenChange={setOpen}
  tipoInicial="email"
/>

// Dentro:
<EmailTemplateEditor
  initialData={{
    nombre: "Bienvenida",
    asunto: "Bienvenido a Grupo Segal",
    componentes: []
  }}
  onDataChange={(plantilla) => {
    // Guarda con validación
  }}
/>
```

### Usar Plantilla en Flow

```tsx
<StageNode
  id="stage-1"
  data={{
    label: "Etapa 1",
    tipo_mensaje: "email",
    plantilla_id: 123,  // ID de plantilla guardada
    plantilla_type: "reference",
  }}
/>
```

### Renderizar Email para Backend

```typescript
// En backend cuando envía email:
const plantilla = await obtenerPlantilla(123)

const exported = exportEmailForBackend(
  plantilla.componentes,
  { subject: plantilla.asunto }
)

await sendGrid.send({
  to: usuario.email,
  subject: plantilla.asunto,
  html: exported.html,  // HTML limpio, compatible con cualquier proveedor
})
```

---

## Compatibilidad con Proveedores

### SendGrid
- ✅ Acepta HTML directo
- ✅ Soporta tracking de aperturas/clicks
- ✅ Plantillas avanzadas con variables

### Mailgun
- ✅ HTML limpio
- ✅ Variables de template
- ✅ Webhooks para tracking

### AWS SES
- ✅ HTML + Plain text
- ✅ Validación de remitente
- ✅ Límites de envío

### SMTP Genérico
- ✅ HTML limpio
- ✅ MIME multipart
- ✅ Sin tracking

### Mailchimp
- ✅ MJML si es necesario
- ✅ Variables de merge
- ✅ Comportamiento personalizado

---

## Ventajas de la Arquitectura

| Aspecto | Ventaja |
|--------|---------|
| **Modularidad** | SMS y Email separados, cada uno optimizado |
| **Flexibilidad** | Editor visual para no-coders + react-email para devs |
| **Agnóstico** | HTML limpio funciona con cualquier proveedor |
| **Escalabilidad** | Fácil agregar nuevos tipos de componentes |
| **UX** | Preview en vivo, validación en tiempo real |
| **Exportación** | HTML, MJML, JSON - múltiples formatos |

---

## Roadmap Futuro

### Fase 2: Variables Dinámicas
```typescript
// Reemplazar variables en email
const html = exportWithVariables(exported.html, {
  {{nombre}}: "Juan",
  {{email}}: "juan@example.com",
  {{enlace_confirmacion}}: "https://..."
})
```

### Fase 3: A/B Testing
```typescript
interface PlantillaEmail {
  variantes: {
    asunto_a: string,
    asunto_b: string,
    componentes_a: [],
    componentes_b: []
  }
}
```

### Fase 4: Analytics
```typescript
// Trackear opens, clicks por plantilla
GET /api/plantillas/{id}/analytics
```

---

## Conclusión

La arquitectura implementada ofrece:

1. **Para usuarios no-técnicos**: Editor visual intuitivo (EmailTemplateEditor)
2. **Para desarrolladores**: Componentes react-email reutilizables
3. **Para operaciones**: Exportación agnóstica a cualquier proveedor SMTP
4. **Para el negocio**: SMS con límite de 160 caracteres + Emails profesionales

Todos integrados en un único sistema de gestión de plantillas.

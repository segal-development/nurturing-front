# Email Templates con React Email

Componentes profesionales para construir y renderizar plantillas de email.

## Características

- ✅ **Agnóstico a proveedores**: Compatible con SendGrid, Mailgun, AWS SES, SMTP, etc
- ✅ **Tailwind CSS**: Diseños modernos con utilidades de CSS
- ✅ **Bloques reutilizables**: Componentes predefinidos (texto, botón, link, etc)
- ✅ **Builder visual**: Interfaz para construir emails dinámicamente
- ✅ **Preview en vivo**: Visualización inmediata de cambios
- ✅ **Export a múltiples formatos**: HTML, MJML, JSON

## Componentes

### 1. BaseEmailTemplate
Template base con estructura profesional de email.

```tsx
<BaseEmailTemplate
  preview="Asunto del email"
  subject="Título del email"
  headerText="Bienvenido a Grupo Segal"
  footerText="© 2024 Grupo Segal"
  footerLink={{ text: "Visita nuestro sitio", href: "https://example.com" }}
>
  {/* Contenido */}
</BaseEmailTemplate>
```

### 2. EmailBlock
Bloques individuales de contenido.

```tsx
<EmailBlock
  type="heading"
  content="Hola, usuario"
  fontSize="2xl"
  color="blue"
  align="center"
/>

<EmailBlock
  type="text"
  content="Este es el contenido del email"
  fontSize="base"
/>

<EmailBlock
  type="button"
  buttonText="Haz clic aquí"
  href="https://example.com"
  color="green"
/>

<EmailBlock
  type="link"
  content="Más información"
  href="https://example.com"
/>

<EmailBlock
  type="section"
  content="Contenido destacado"
  color="gray"
/>
```

### 3. EmailBlocks
Renderiza múltiples bloques en secuencia.

```tsx
<EmailBlocks
  blocks={[
    { type: 'heading', content: 'Título' },
    { type: 'text', content: 'Párrafo' },
    { type: 'button', buttonText: 'Botón', href: '#' }
  ]}
  spacing="normal" // compact | normal | spacious
/>
```

### 4. EmailTemplatePreview
Preview del email renderizado en HTML.

```tsx
<EmailTemplatePreview
  blocks={blocks}
  config={{
    subject: "Email subject",
    headerText: "Welcome"
  }}
  onRender={(html) => console.log(html)}
/>
```

### 5. EmailTemplateBuilder
Interfaz completa para construir emails visualmente.

```tsx
<EmailTemplateBuilder
  initialBlocks={[]}
  onChange={(blocks, html) => {
    console.log('Bloques:', blocks)
    console.log('HTML:', html)
  }}
  showPreview={true}
  config={{
    subject: "Email subject",
    headerText: "Welcome"
  }}
/>
```

## Tipos de Datos

### EmailBlockData

```typescript
interface EmailBlockData {
  type: 'text' | 'heading' | 'button' | 'link' | 'section'
  content?: string
  href?: string
  buttonText?: string
  align?: 'left' | 'center' | 'right'
  color?: 'gray' | 'blue' | 'green' | 'red' | 'white'
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl'
  className?: string
}
```

## Usar con Plantillas Guardadas

### 1. En la base de datos, guardar bloques:

```json
{
  "nombre": "Bienvenida",
  "tipo": "email",
  "componentes": [
    { "tipo": "heading", "contenido": "Bienvenido", "tamaño": "2xl" },
    { "tipo": "texto", "contenido": "Nos alegra tenerte aquí", "tamaño": "base" },
    { "tipo": "boton", "texto": "Confirmar", "href": "https://example.com" }
  ]
}
```

### 2. En el frontend, usar plantilla guardada:

```tsx
import { EmailTemplateBuilder, EmailTemplatePreview } from '@/features/plantillas/components/EmailTemplates'
import type { EmailBlockData } from '@/features/plantillas/components/EmailTemplates'

// Cargar desde backend
const plantilla = await plantillasService.obtener(plantillaId)

// Convertir componentes a bloques
const blocks: EmailBlockData[] = plantilla.componentes.map(comp => ({
  type: comp.tipo,
  content: comp.contenido,
  // ... mapear otros campos
}))

// Usar en builder o preview
<EmailTemplateBuilder initialBlocks={blocks} />
```

## Renderizar para Backend

### Exportar a HTML (para cualquier proveedor):

```tsx
import { renderEmailBlocksToHTML, exportEmailForBackend } from '@/features/plantillas/utils/emailRenderer'

const html = renderEmailBlocksToHTML(blocks, {
  inlineStyles: true,
  responsive: true
})

// Enviar al backend
await plantillasService.crearEmail({
  nombre: 'Mi plantilla',
  html,
  bloques: JSON.stringify(blocks)
})
```

### Exportar a MJML (para herramientas profesionales):

```tsx
import { renderEmailBlocksToMJML } from '@/features/plantillas/utils/emailRenderer'

const mjml = renderEmailBlocksToMJML(blocks, {
  subject: 'Email subject',
  headerText: 'Welcome',
  footerText: '© 2024 Grupo Segal'
})

// Usar con MJML engine en backend
```

## Integración con Backend

Estructura recomendada en API:

```json
POST /api/plantillas/email

{
  "nombre": "Bienvenida",
  "descripcion": "Email de bienvenida para nuevos usuarios",
  "html": "<html>...</html>",
  "mjml": "<mjml>...</mjml>",
  "bloques": "[...]",  // JSON serializado de EmailBlockData[]
  "activo": true
}
```

## Flujos de Trabajo

### Crear nueva plantilla:
1. User abre EmailTemplateBuilder
2. Agrega bloques (texto, botón, etc)
3. Preview se actualiza en vivo
4. Click "Guardar" exporta HTML y envía al backend

### Editar plantilla:
1. Cargar bloques desde backend
2. Mostrar en EmailTemplateBuilder
3. Permitir cambios
4. Re-exportar y actualizar en backend

### Usar en flujo:
1. En StageNode, seleccionar plantilla guardada
2. Mostrar preview
3. Al guardar flujo, guardar plantilla_id
4. Backend renderiza email cuando sea necesario

## Soporte de Proveedores

Los componentes generan HTML limpio y MJML que es compatible con:

- **SendGrid** - Via MJML o HTML directo
- **Mailgun** - HTML limpio
- **AWS SES** - HTML + Plain text
- **Gmail API** - HTML con embeddings
- **SMTP** - HTML limpio
- **Mailchimp** - MJML compatible
- **Brevo** (ex-Sendinblue) - HTML compatible

## Ejemplo Completo

```tsx
import { EmailTemplateBuilder } from '@/features/plantillas/components/EmailTemplates'
import { exportEmailForBackend } from '@/features/plantillas/utils/emailRenderer'
import { plantillasService } from '@/api/plantillas.service'

function CreateEmailTemplate() {
  const [blocks, setBlocks] = useState([])

  const handleCreate = async () => {
    const exported = exportEmailForBackend(blocks, {
      subject: 'Welcome to Grupo Segal',
      headerText: 'Welcome!'
    })

    await plantillasService.crearEmail({
      nombre: 'Bienvenida',
      html: exported.html,
      mjml: exported.mjml,
      bloques: exported.blocksJSON
    })
  }

  return (
    <div>
      <EmailTemplateBuilder
        onChange={(newBlocks) => setBlocks(newBlocks)}
      />
      <button onClick={handleCreate}>Guardar Plantilla</button>
    </div>
  )
}
```

## Notas Importantes

- Los componentes usan `@react-email/components` que es agnóstico a proveedores
- El HTML generado es limpio y compatible con cualquier SMTP
- MJML es un estándar para templates profesionales
- Todos los bloques incluyen estilos inline para máxima compatibilidad
- Los emails son responsivos por defecto

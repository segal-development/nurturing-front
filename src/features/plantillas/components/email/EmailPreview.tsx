/**
 * Vista previa de plantilla Email
 * Renderiza el email como se vería en un cliente de email
 */

import type { PlantillaEmail } from '@/types/plantilla'

interface EmailPreviewProps {
  plantilla: Omit<PlantillaEmail, 'id'>
}

export function EmailPreview({ plantilla }: EmailPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Información del email */}
      <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10 space-y-2">
        <div>
          <p className="text-xs text-segal-dark/60">Asunto:</p>
          <p className="font-medium text-segal-dark">{plantilla.asunto}</p>
        </div>
        <div>
          <p className="text-xs text-segal-dark/60">De:</p>
          <p className="text-sm text-segal-dark">Grupo Segal &lt;contacto@gruposegal.com&gt;</p>
        </div>
      </div>

      {/* Vista previa del contenido */}
      <div className="bg-white rounded-lg border border-segal-blue/10 overflow-hidden shadow-sm">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 text-xs text-gray-600">
          Vista previa del email
        </div>

        {/* Contenido del email */}
        <div
          className="p-6 email-preview"
          style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#333333',
          }}
        >
          {plantilla.componentes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No hay componentes para mostrar</p>
            </div>
          ) : (
            plantilla.componentes.map((componente) => (
              <div key={componente.id} className="mb-4">
                {componente.tipo === 'logo' && (
                  <div 
                    style={{
                      textAlign: 'center',
                      marginBottom: '16px',
                      backgroundColor: componente.contenido.color_fondo || 'transparent',
                      padding: `${componente.contenido.padding ?? 20}px`,
                    }}
                  >
                    <img
                      src={componente.contenido.url}
                      alt={componente.contenido.alt || 'Logo'}
                      style={{
                        maxWidth: `${componente.contenido.ancho || 200}px`,
                        maxHeight: `${componente.contenido.altura || 100}px`,
                      }}
                    />
                  </div>
                )}

                {componente.tipo === 'texto' && (
                  <div
                    style={{
                      textAlign: componente.contenido.alineacion as any,
                      fontSize: `${componente.contenido.tamanio_fuente || 14}px`,
                      color: componente.contenido.color || '#000000',
                      fontWeight: componente.contenido.negrita ? 'bold' : 'normal',
                      fontStyle: componente.contenido.italica ? 'italic' : 'normal',
                      marginBottom: '16px',
                    }}
                  >
                    {renderTextoConEnlaces(componente.contenido.texto, componente.contenido.enlaces)}
                  </div>
                )}

                {componente.tipo === 'boton' && (
                  <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    <a
                      href={componente.contenido.url}
                      style={{
                        display: 'inline-block',
                        backgroundColor: componente.contenido.color_fondo || '#1e3a8a',
                        color: componente.contenido.color_texto || '#ffffff',
                        padding: '12px 24px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                      }}
                      onClick={(e) => e.preventDefault()}
                    >
                      {componente.contenido.texto}
                    </a>
                  </div>
                )}

                {componente.tipo === 'separador' && (
                  <div
                    style={{
                      height: `${componente.contenido.altura || 10}px`,
                      backgroundColor: componente.contenido.color || '#e0e0e0',
                      margin: '16px 0',
                    }}
                  />
                )}

                {componente.tipo === 'imagen' && (
                  <div
                    style={{
                      textAlign: componente.contenido.alineacion || 'center',
                      margin: '16px 0',
                      padding: `${componente.contenido.padding ?? 10}px`,
                    }}
                  >
                    {componente.contenido.link_url ? (
                      <a
                        href={componente.contenido.link_url}
                        target={componente.contenido.link_target || '_blank'}
                        onClick={(e) => e.preventDefault()}
                        style={{ display: 'inline-block' }}
                      >
                        <img
                          src={componente.contenido.url}
                          alt={componente.contenido.alt || 'Imagen'}
                          style={{
                            maxWidth: componente.contenido.ancho ? `${componente.contenido.ancho}px` : '100%',
                            maxHeight: componente.contenido.altura ? `${componente.contenido.altura}px` : 'auto',
                            borderRadius: `${componente.contenido.border_radius ?? 0}px`,
                            display: 'block',
                          }}
                        />
                      </a>
                    ) : (
                      <img
                        src={componente.contenido.url}
                        alt={componente.contenido.alt || 'Imagen'}
                        style={{
                          maxWidth: componente.contenido.ancho ? `${componente.contenido.ancho}px` : '100%',
                          maxHeight: componente.contenido.altura ? `${componente.contenido.altura}px` : 'auto',
                          borderRadius: `${componente.contenido.border_radius ?? 0}px`,
                          display: 'inline-block',
                        }}
                      />
                    )}
                  </div>
                )}

                {componente.tipo === 'footer' && (
                  <div
                    style={{
                      marginTop: '24px',
                      padding: `${componente.contenido.padding ?? 20}px`,
                      fontSize: '12px',
                      color: componente.contenido.color_texto || '#666666',
                      backgroundColor: componente.contenido.color_fondo || 'transparent',
                      textAlign: 'center',
                    }}
                  >
                    <p>{componente.contenido.texto}</p>
                    {componente.contenido.enlaces && componente.contenido.enlaces.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        {componente.contenido.enlaces.map((enlace, idx) => (
                          <span key={`footer-preview-${idx}`}>
                            <a
                              href={enlace.url}
                              style={{
                                color: componente.contenido.color_texto || '#666666',
                                textDecoration: 'underline',
                                marginRight: '16px',
                              }}
                              onClick={(e) => e.preventDefault()}
                            >
                              {enlace.etiqueta}
                            </a>
                            {idx < componente.contenido.enlaces!.length - 1 && ' | '}
                          </span>
                        ))}
                      </div>
                    )}
                    {componente.contenido.mostrar_fecha && (
                      <p style={{ marginTop: '8px', opacity: 0.7 }}>
                        Enviado: {new Date().toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="text-xs text-segal-dark/60 bg-segal-blue/5 rounded-lg p-3 border border-segal-blue/10">
        <p>💡 Esta es una vista previa aproximada. El email puede aparecer diferente en algunos clientes.</p>
      </div>
    </div>
  )
}

/**
 * Renderiza texto con enlaces insertados
 */
function renderTextoConEnlaces(
  texto: string,
  enlaces?: Array<{ url: string; texto: string; posicion: number }>
): React.ReactNode {
  if (!enlaces || enlaces.length === 0) {
    return texto
  }

  // Para simplificar, mostramos solo el texto
  // En una implementación real, se reemplazaría el texto dentro del contenido con enlaces
  return texto
}

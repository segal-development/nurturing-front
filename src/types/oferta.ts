export interface OfertaInfocom {
  id: number;
  titulo: string;
  descripcion: string;
  contenido_html?: string;
  descuento?: string;
  condiciones?: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfertaFormData {
  titulo: string;
  descripcion: string;
  contenido_html?: string;
  descuento?: string;
  condiciones?: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
}
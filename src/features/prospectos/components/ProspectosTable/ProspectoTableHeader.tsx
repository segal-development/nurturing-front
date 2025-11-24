/**
 * Encabezado de la tabla de prospectos
 * Define las columnas y su apariencia
 */

import { TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function ProspectoTableHeader() {
  return (
    <TableHeader className="bg-segal-blue/5 border-b border-segal-blue/10">
      <TableRow>
        <TableHead className="text-segal-dark font-semibold">Nombre</TableHead>
        <TableHead className="text-segal-dark font-semibold">Email</TableHead>
        <TableHead className="text-segal-dark font-semibold">Teléfono</TableHead>
        <TableHead className="text-segal-dark font-semibold">Monto Deuda</TableHead>
        <TableHead className="text-segal-dark font-semibold">Estado</TableHead>
        <TableHead className="text-segal-dark font-semibold">Tipo</TableHead>
        <TableHead className="text-segal-dark font-semibold">Ult. Contacto</TableHead>
        <TableHead className="text-right text-segal-dark font-semibold">Acciones</TableHead>
      </TableRow>
    </TableHeader>
  )
}

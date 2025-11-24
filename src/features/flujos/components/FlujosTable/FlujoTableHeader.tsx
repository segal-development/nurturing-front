/**
 * Encabezado de la tabla de flujos
 * Define las columnas y su apariencia
 */

import { TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function FlujoTableHeader() {
  return (
    <TableHeader className="bg-segal-blue/5 border-b border-segal-blue/10">
      <TableRow>
        <TableHead className="text-segal-dark font-semibold">Nombre</TableHead>
        <TableHead className="text-segal-dark font-semibold">Tipo de Deudor</TableHead>
        <TableHead className="text-segal-dark font-semibold">Etapas</TableHead>
        <TableHead className="text-segal-dark font-semibold">Estado</TableHead>
        <TableHead className="text-segal-dark font-semibold">Usuario</TableHead>
        <TableHead className="text-segal-dark font-semibold">Creado</TableHead>
        <TableHead className="text-right text-segal-dark font-semibold">Acciones</TableHead>
      </TableRow>
    </TableHeader>
  )
}

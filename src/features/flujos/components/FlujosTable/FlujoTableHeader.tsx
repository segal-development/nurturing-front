/**
 * Encabezado de la tabla de flujos
 * Define las columnas y su apariencia
 */

import { TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function FlujoTableHeader() {
  return (
    <TableHeader className="bg-segal-blue/5 border-b border-segal-blue/10 ">
      <TableRow>
        <TableHead className="text-segal-dark font-semibold dark:text-segal-blue">Nombre</TableHead>
        <TableHead className="text-segal-dark font-semibold dark:text-segal-blue">Tipo de Deudor</TableHead>
        <TableHead className="text-segal-dark font-semibold dark:text-segal-blue">Etapas</TableHead>
        <TableHead className="text-segal-dark font-semibold dark:text-segal-blue">Progreso</TableHead>
        <TableHead className="text-segal-dark font-semibold dark:text-segal-blue">Costo</TableHead>
        <TableHead className="text-segal-dark font-semibold dark:text-segal-blue">Estado</TableHead>
        <TableHead className="text-segal-dark font-semibold dark:text-segal-blue">Usuario</TableHead>
        <TableHead className="text-segal-dark font-semibold dark:text-segal-blue">Creado</TableHead>
        <TableHead className="text-right text-segal-dark font-semibold dark:text-segal-blue">Acciones</TableHead>
      </TableRow>
    </TableHeader>
  )
}

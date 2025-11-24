import { Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useOfertas } from '@/features/ofertas/hooks'
import { OfertaTable } from '@/features/ofertas/components/OfertaTable'
import { useState } from 'react'

export default function Ofertas() {
  const [filterActive, setFilterActive] = useState<boolean | undefined>(true)
  const { data: ofertas, isLoading, error } = useOfertas(
    filterActive !== undefined ? { activa: filterActive } : undefined
  )

  const handleEdit = (oferta: any) => {
    // TODO: Implement edit functionality
    console.log('Edit oferta:', oferta)
  }

  const handleDelete = (oferta: any) => {
    // TODO: Implement delete functionality
    console.log('Delete oferta:', oferta)
  }

  return (
    <div className="space-y-6">
      {/* Header - Segal Corporate */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-segal-dark flex items-center gap-2">
            <Tag className="h-8 w-8 text-segal-orange" />
            Ofertas Infocom
          </h1>
          <p className="text-segal-dark/60 mt-2">
            Gestiona y crea ofertas para tus prospectos
          </p>
        </div>
        <Button className="bg-segal-orange hover:bg-segal-orange/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200">
          Crear Nueva Oferta
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filterActive === true ? 'default' : 'outline'}
          onClick={() => setFilterActive(true)}
          className={filterActive === true ? 'bg-segal-orange text-white' : 'border-segal-orange/30 text-segal-dark'}
        >
          Activas
        </Button>
        <Button
          variant={filterActive === false ? 'default' : 'outline'}
          onClick={() => setFilterActive(false)}
          className={filterActive === false ? 'bg-segal-orange text-white' : 'border-segal-orange/30 text-segal-dark'}
        >
          Inactivas
        </Button>
        <Button
          variant={filterActive === undefined ? 'default' : 'outline'}
          onClick={() => setFilterActive(undefined)}
          className={filterActive === undefined ? 'bg-segal-orange text-white' : 'border-segal-orange/30 text-segal-dark'}
        >
          Todas
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-segal-red/20 bg-segal-red/5">
          <CardContent className="pt-6">
            <p className="text-segal-red">Error al cargar las ofertas</p>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <OfertaTable ofertas={ofertas} loading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  )
}

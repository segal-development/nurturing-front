import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MonitorFlujosPorTipoProps {
  flujosPorTipo: Record<string, number>
}

export function MonitorFlujosPorTipo({ flujosPorTipo }: MonitorFlujosPorTipoProps) {
  return (
    <Card className="border-segal-dark/10">
      <CardHeader>
        <CardTitle>Prospectos por Tipo de Flujo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(flujosPorTipo).map(([tipo, cantidad]) => (
            <div key={tipo} className="flex items-center justify-between">
              <span className="text-segal-dark/70 capitalize">{tipo.replace(/-/g, ' ')}</span>
              <span className="px-3 py-1 rounded-full bg-segal-blue/10 text-segal-blue font-medium">
                {cantidad}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

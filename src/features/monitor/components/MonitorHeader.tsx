import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MonitorHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-segal-dark flex items-center gap-2">
          <Send className="h-8 w-8 text-segal-green" />
          Monitor de Envíos
        </h1>
        <p className="text-segal-dark/60 mt-2">
          Monitorea el estado y progreso de los envíos
        </p>
      </div>
      <Button className="bg-segal-green hover:bg-segal-green/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200">
        Enviar Campaña
      </Button>
    </div>
  )
}

/**
 * Envios Page
 * Main page for managing and monitoring shipments (emails and SMS)
 */

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  EnviosContainer,
  EnviosStatisticsPanel,
} from '@/features/envios/components'
import { Mail } from 'lucide-react'

export default function EnviosPage() {
  const [activeTab, setActiveTab] = useState('lista')

  return (
    <div className="space-y-6 p-6 dark:bg-slate-950">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8 text-segal-blue dark:text-segal-turquoise" />
          <h1 className="text-4xl font-bold text-segal-dark dark:text-white">Envíos</h1>
        </div>
        <p className="text-segal-dark/60 dark:text-white/60">
          Monitorea y gestiona todos los envíos realizados a través de tus flujos
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 dark:bg-slate-900 dark:border-slate-700">
          <TabsTrigger
            value="lista"
            className="dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:text-slate-300"
          >
            Listado
          </TabsTrigger>
          <TabsTrigger
            value="estadisticas"
            className="dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:text-slate-300"
          >
            Estadísticas
          </TabsTrigger>
        </TabsList>

        {/* Listado Tab - Full list with filters and detail modal */}
        <TabsContent value="lista" className="space-y-4">
          <EnviosContainer />
        </TabsContent>

        {/* Estadísticas Tab - Overview statistics */}
        <TabsContent value="estadisticas" className="space-y-4">
          <EnviosStatisticsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

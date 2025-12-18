/**
 * EnviosContainer Component
 * Main container that integrates EnviosList with EnvioDetailDialog
 *
 * This component manages the state for showing/hiding the detail modal
 */

import { useState } from 'react'
import { EnviosList } from './EnviosList/EnviosList'
import { EnvioDetailDialog } from './EnvioDetail/EnvioDetailDialog'

export function EnviosContainer() {
  const [selectedEnvioId, setSelectedEnvioId] = useState<number | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleViewDetail = (envioId: number) => {
    setSelectedEnvioId(envioId)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
    // Keep the selected ID for animation, but will close the dialog
    setTimeout(() => {
      setSelectedEnvioId(null)
    }, 300)
  }

  return (
    <>
      <EnviosList onViewDetail={handleViewDetail} />
      <EnvioDetailDialog
        envioId={selectedEnvioId}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </>
  )
}

export default EnviosContainer

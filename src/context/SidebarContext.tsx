import { createContext, useCallback, useState } from 'react'

interface SidebarContextType {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

const SIDEBAR_STORAGE_KEY = 'nurturing-dashboard-sidebar'

const getSavedSidebarState = (): boolean => {
  if (typeof localStorage === 'undefined') return true
  const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY)
  return saved !== 'false'
}

const persistSidebarState = (isOpen: boolean): void => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(SIDEBAR_STORAGE_KEY, isOpen ? 'true' : 'false')
}

interface SidebarProviderProps {
  children: React.ReactNode
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(getSavedSidebarState())

  const open = useCallback(() => {
    setIsOpen(true)
    persistSidebarState(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    persistSidebarState(false)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const newState = !prev
      persistSidebarState(newState)
      return newState
    })
  }, [])

  const value: SidebarContextType = {
    isOpen,
    open,
    close,
    toggle,
  }

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

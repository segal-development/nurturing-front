import { Menu, X } from 'lucide-react'
import { useSidebar } from '@/hooks/useSidebar'
import { Button } from '@/components/ui/button'

interface SidebarToggleProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  onToggle?: (isOpen: boolean) => void
}

export function SidebarToggle({
  variant = 'outline',
  size = 'default',
  onToggle,
}: SidebarToggleProps) {
  const { isOpen, toggle } = useSidebar()

  const handleToggle = () => {
    toggle()
    onToggle?.(!isOpen)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      aria-label={isOpen ? 'Ocultar sidebar' : 'Mostrar sidebar'}
      title={isOpen ? 'Ocultar sidebar' : 'Mostrar sidebar'}
      className="transition-colors duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  )
}

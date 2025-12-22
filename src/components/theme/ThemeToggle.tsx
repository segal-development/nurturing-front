import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'

interface ThemeToggleProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  onThemeChange?: (theme: 'light' | 'dark') => void
}

export function ThemeToggle({
  variant = 'outline',
  size = 'default',
  onThemeChange,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const handleToggle = () => {
    const newTheme = isDark ? 'light' : 'dark'
    toggleTheme()
    onThemeChange?.(newTheme)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="transition-colors duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-yellow-400 dark:hover:bg-gray-700 dark:hover:text-yellow-300"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}

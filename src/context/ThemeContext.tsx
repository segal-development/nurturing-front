import { createContext, useCallback, useEffect, useState } from 'react'

export type ThemeType = 'light' | 'dark'

interface ThemeContextType {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
  toggleTheme: () => void
  isLoading: boolean
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'nurturing-dashboard-theme'

const getSystemTheme = (): ThemeType => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const getInitialTheme = (): ThemeType => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }
  return getSystemTheme()
}

const applyThemeToDocument = (theme: ThemeType): void => {
  if (typeof document === 'undefined') return

  const htmlElement = document.documentElement
  if (!htmlElement) return

  htmlElement.classList.remove('light', 'dark')
  if (theme === 'dark') {
    htmlElement.classList.add('dark')
  }
}

interface ThemeProviderProps {
  children: React.ReactNode
  initialTheme?: ThemeType
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const themeToUse = initialTheme || getInitialTheme()
    applyThemeToDocument(themeToUse)
    return themeToUse
  })

  const isLoading = false

  useEffect(() => {
    applyThemeToDocument(theme)
  }, [theme])

  const setTheme = useCallback((newTheme: ThemeType) => {
    if (!newTheme) return
    if (newTheme !== 'light' && newTheme !== 'dark') return

    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }, [theme, setTheme])

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isLoading,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

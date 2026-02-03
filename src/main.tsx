import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { logger } from '@/lib/logger'

/**
 * Inicializar tema antes de que React monte
 * Esto evita el "flash" de contenido sin estilo
 */
const initializeTheme = (): void => {
  const savedTheme = localStorage.getItem('nurturing-dashboard-theme')
  let theme: 'light' | 'dark' = 'light'

  if (savedTheme === 'dark') {
    theme = 'dark'
  } else if (savedTheme === 'light') {
    theme = 'light'
  } else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme = 'dark'
  }

  const htmlElement = document.documentElement
  htmlElement.classList.remove('dark', 'light')
  if (theme === 'dark') {
    htmlElement.classList.add('dark')
  }
}

initializeTheme()

// Log backend URL in dev
logger.log('Usando backend real en:', import.meta.env.VITE_API_URL || 'http://localhost:8000/api')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

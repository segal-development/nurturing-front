import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialize MSW for mocking API in development
// ⚠️ MSW deshabilitado para usar backend real
async function initializeApp() {
  const USE_MOCK_API = false // 👈 Cambiar a true para usar MSW

  if (import.meta.env.DEV && USE_MOCK_API) {
    try {
      const { worker } = await import('./mocks/browser')
      await worker.start({
        onUnhandledRequest: 'bypass', // Permite que requests reales pasen si no están mockeadas
      })
      console.log('[MSW] Mock Service Worker started successfully')
    } catch (error) {
      console.error('[MSW] Failed to start worker:', error)
    }
  }

  if (!USE_MOCK_API && import.meta.env.DEV) {
    console.log('🔌 Usando backend real en:', import.meta.env.VITE_API_URL || 'http://localhost:8000/api')
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

initializeApp()

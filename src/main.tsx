import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Usar backend real
if (import.meta.env.DEV) {
  console.log('🔌 Usando backend real en:', import.meta.env.VITE_API_URL || 'http://localhost:8000/api')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

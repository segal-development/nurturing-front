import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// MSW worker para interceptar requests en development
export const worker = setupWorker(...handlers)

// Enable API mocking in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('[MSW] Mock Service Worker initialized')
}

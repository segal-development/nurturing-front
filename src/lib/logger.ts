/**
 * Development-only logger.
 *
 * All methods are no-ops in production builds (import.meta.env.PROD === true).
 * This prevents leaking tokens, cookies, PII, and API payloads to the browser console.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info('Something happened', { data })
 *   logger.error('Request failed', error)
 */

const isDev = import.meta.env.DEV

/* eslint-disable no-console */
const noop = () => {}

export const logger = {
  log: isDev ? console.log.bind(console) : noop,
  info: isDev ? console.info.bind(console) : noop,
  warn: isDev ? console.warn.bind(console) : noop,
  error: isDev ? console.error.bind(console) : noop,
  debug: isDev ? console.debug.bind(console) : noop,
} as const

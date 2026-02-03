import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Catches render errors and displays a recovery UI instead of a white screen.
 *
 * Wrap around routes or layout sections:
 *   <ErrorBoundary>
 *     <Outlet />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo)
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    if (this.props.fallback) {
      return this.props.fallback
    }

    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Algo salió mal
        </h2>
        <p className="max-w-md text-center text-sm text-gray-600 dark:text-gray-400">
          Ocurrió un error inesperado. Intentá recargar la página o volver a la sección anterior.
        </p>
        {import.meta.env.DEV && this.state.error && (
          <pre className="mt-2 max-w-lg overflow-auto rounded-lg bg-gray-100 p-4 text-xs text-red-700 dark:bg-gray-800 dark:text-red-400">
            {this.state.error.message}
          </pre>
        )}
        <div className="flex gap-3">
          <Button variant="outline" onClick={this.handleReset}>
            Reintentar
          </Button>
          <Button onClick={this.handleReload}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Recargar página
          </Button>
        </div>
      </div>
    )
  }
}

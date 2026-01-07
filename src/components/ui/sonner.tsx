import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-green-600" />,
        info: <InfoIcon className="size-4 text-blue-600" />,
        warning: <TriangleAlertIcon className="size-4 text-yellow-600" />,
        error: <OctagonXIcon className="size-4 text-red-600" />,
        loading: <Loader2Icon className="size-4 animate-spin text-blue-600" />,
      }}
      toastOptions={{
        classNames: {
          toast: 'group toast bg-white dark:bg-gray-800 border shadow-lg',
          success: 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800',
          error: 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800',
          info: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800',
          warning: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800',
          title: 'text-gray-900 dark:text-gray-100 font-medium',
          description: 'text-gray-600 dark:text-gray-400',
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }

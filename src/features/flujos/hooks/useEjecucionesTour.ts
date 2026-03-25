/**
 * useEjecucionesTour
 *
 * Hook for managing the onboarding tour of the Ejecuciones tab.
 * Uses driver.js for step-by-step guided tour with Spanish localization.
 *
 * @module useEjecucionesTour
 */

import { driver, type Config } from 'driver.js'
import 'driver.js/dist/driver.css'

// ============================================================================
// Tour Configuration
// ============================================================================

const TOUR_STEPS: Config['steps'] = [
  {
    element: '[data-tour="cohort-summary"]',
    popover: {
      title: 'Resumen de Cohortes',
      description:
        'Métricas globales: total de cohortes, prospectos totales, en progreso y completados.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="stat-total-prospectos"]',
    popover: {
      title: 'Total de Prospectos',
      description:
        'Suma de todas las personas que han ingresado al flujo en todas las cohortes.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="cohort-card"]',
    popover: {
      title: 'Tarjeta de Cohorte',
      description:
        'Cada tarjeta representa un grupo de prospectos que ingresaron en la misma fecha. Expande para ver más detalles.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="cohort-prospectos-count"]',
    popover: {
      title: 'Cantidad de Prospectos',
      description: 'Número de prospectos en esta cohorte.',
      side: 'right',
      align: 'center',
    },
  },
  {
    element: '[data-tour="cohort-progress"]',
    popover: {
      title: 'Barra de Progreso',
      description:
        'Muestra el avance de la cohorte: etapas completadas vs totales.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="cohort-ver-btn"]',
    popover: {
      title: 'Ver Detalles',
      description:
        'Haz clic para abrir el panel lateral con la lista completa de prospectos. Puedes filtrar por etapa y estado de envío.',
      side: 'left',
      align: 'center',
    },
  },
  {
    element: '[data-tour="cohort-estado"]',
    popover: {
      title: 'Estado de la Cohorte',
      description:
        'Indica si la cohorte está en progreso, pausada o completada.',
      side: 'left',
      align: 'center',
    },
  },
  {
    element: '[data-tour="etapas-timeline"]',
    popover: {
      title: 'Historial de Etapas',
      description:
        'Detalle de cada etapa: prospectos alcanzados, % de apertura y % de clicks. ✓ completado, ● en progreso, ○ pendiente.',
      side: 'top',
      align: 'center',
    },
  },
]

// ============================================================================
// Custom Styles
// ============================================================================

/**
 * Injects custom CSS for the tour popover styling.
 * Uses project colors (segal-blue, segal-turquoise).
 */
function injectTourStyles() {
  const styleId = 'ejecuciones-tour-styles'

  // Avoid duplicate injection
  if (document.getElementById(styleId)) return

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    .ejecuciones-tour-popover {
      --driver-accent: #0072b1 !important;
      background: white !important;
      border-radius: 12px !important;
      box-shadow: 0 20px 25px -5px rgba(0, 114, 177, 0.15), 0 10px 10px -5px rgba(0, 114, 177, 0.1) !important;
      border: 1px solid rgba(0, 114, 177, 0.2) !important;
    }

    .ejecuciones-tour-popover .driver-popover-title {
      font-size: 1rem !important;
      font-weight: 700 !important;
      color: #1e293b !important;
      margin-bottom: 0.5rem !important;
    }

    .ejecuciones-tour-popover .driver-popover-description {
      font-size: 0.875rem !important;
      color: #475569 !important;
      line-height: 1.5 !important;
    }

    .ejecuciones-tour-popover .driver-popover-progress-text {
      font-size: 0.75rem !important;
      color: #64748b !important;
    }

    .ejecuciones-tour-popover .driver-popover-navigation-btns {
      gap: 0.5rem !important;
    }

    .ejecuciones-tour-popover .driver-popover-prev-btn,
    .ejecuciones-tour-popover .driver-popover-next-btn {
      padding: 0.5rem 1rem !important;
      border-radius: 8px !important;
      font-size: 0.875rem !important;
      font-weight: 500 !important;
      transition: all 0.15s ease !important;
    }

    .ejecuciones-tour-popover .driver-popover-prev-btn {
      background: white !important;
      color: #0072b1 !important;
      border: 1px solid rgba(0, 114, 177, 0.3) !important;
    }

    .ejecuciones-tour-popover .driver-popover-prev-btn:hover {
      background: rgba(0, 114, 177, 0.05) !important;
      border-color: rgba(0, 114, 177, 0.5) !important;
    }

    .ejecuciones-tour-popover .driver-popover-next-btn {
      background: linear-gradient(135deg, #0072b1 0%, #00a5a5 100%) !important;
      color: white !important;
      border: none !important;
    }

    .ejecuciones-tour-popover .driver-popover-next-btn:hover {
      background: linear-gradient(135deg, #005a8c 0%, #008585 100%) !important;
    }

    .ejecuciones-tour-popover .driver-popover-close-btn {
      color: #64748b !important;
    }

    .ejecuciones-tour-popover .driver-popover-close-btn:hover {
      color: #1e293b !important;
    }

    .ejecuciones-tour-popover .driver-popover-arrow-side-left,
    .ejecuciones-tour-popover .driver-popover-arrow-side-right,
    .ejecuciones-tour-popover .driver-popover-arrow-side-top,
    .ejecuciones-tour-popover .driver-popover-arrow-side-bottom {
      border-color: white !important;
    }

    /* Highlight overlay */
    .driver-active .driver-overlay {
      background: rgba(0, 114, 177, 0.1) !important;
    }

    /* Active element highlight */
    .driver-active-element {
      box-shadow: 0 0 0 4px rgba(0, 114, 177, 0.3) !important;
      border-radius: 8px !important;
    }
  `
  document.head.appendChild(style)
}

// ============================================================================
// Hook
// ============================================================================

export function useEjecucionesTour() {
  const startTour = () => {
    // Inject custom styles before starting
    injectTourStyles()

    const driverObj = driver({
      showProgress: true,
      progressText: 'Paso {{current}} de {{total}}',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      popoverClass: 'ejecuciones-tour-popover',
      animate: true,
      allowClose: true,
      overlayClickBehavior: 'close',
      stagePadding: 8,
      stageRadius: 8,
      steps: TOUR_STEPS,
      onDestroyStarted: () => {
        // Allow the user to close the tour at any point
        driverObj.destroy()
      },
    })

    driverObj.drive()
  }

  return { startTour }
}

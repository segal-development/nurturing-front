/**
 * CompactNodeWrapper — shared compact node shell (~80x60px)
 * All 4 node types use this to render consistent compact nodes.
 * Handles: execution state border, icon, truncated label, selection ring,
 * active/inactive opacity, and optional badge slot.
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useFlowBuilderStore } from '../../../stores/flowBuilderStore'

const EXECUTION_STATE = {
  PENDING: 'pending',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
} as const

type ExecutionState = (typeof EXECUTION_STATE)[keyof typeof EXECUTION_STATE]

const MAX_LABEL_LENGTH = 12

interface CompactNodeWrapperProps {
  nodeId: string
  icon: ReactNode
  label: string
  iconBgColor: string
  iconTextColor?: string
  executionState?: ExecutionState
  isActive?: boolean
  badge?: ReactNode
  children?: ReactNode
}

function truncateLabel(label: string): string {
  if (label.length <= MAX_LABEL_LENGTH) return label
  return `${label.slice(0, MAX_LABEL_LENGTH)}...`
}

function getExecutionBorderClass(state?: ExecutionState): string {
  switch (state) {
    case EXECUTION_STATE.COMPLETED:
      return 'border-l-green-500'
    case EXECUTION_STATE.EXECUTING:
      return 'border-l-blue-500 animate-pulse'
    case EXECUTION_STATE.PAUSED:
      return 'border-l-amber-500'
    case EXECUTION_STATE.FAILED:
      return 'border-l-red-500'
    case EXECUTION_STATE.PENDING:
    default:
      return 'border-l-gray-400'
  }
}

export function CompactNodeWrapper({
  nodeId,
  icon,
  label,
  iconBgColor,
  iconTextColor = 'text-white',
  executionState,
  isActive = true,
  badge,
  children,
}: CompactNodeWrapperProps) {
  const selectedNodeId = useFlowBuilderStore((state) => state.selectedNodeId)
  const isSelected = selectedNodeId === nodeId

  return (
    <div className="relative">
      {/* Badge slot — top-left */}
      {badge && (
        <div className="absolute -top-2 -left-2 z-10">
          {badge}
        </div>
      )}

      {/* Compact node body */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm transition-all duration-150',
          'w-[80px] min-h-[60px] flex-col justify-center',
          'border-l-4',
          getExecutionBorderClass(executionState),
          isSelected && 'ring-2 ring-blue-500 ring-offset-1 shadow-md',
          !isActive && 'opacity-50'
        )}
      >
        {/* Icon circle */}
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
            iconBgColor,
            iconTextColor
          )}
        >
          {icon}
        </div>

        {/* Truncated label */}
        <span
          className="text-[10px] font-medium leading-tight text-center text-gray-700 select-none"
          title={label}
        >
          {truncateLabel(label)}
        </span>
      </div>

      {/* ReactFlow handles are passed as children */}
      {children}
    </div>
  )
}

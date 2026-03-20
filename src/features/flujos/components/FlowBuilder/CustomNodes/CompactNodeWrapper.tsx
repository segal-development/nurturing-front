/**
 * CompactNodeWrapper — shared compact node shell (n8n style)
 * All 4 node types use this to render consistent compact nodes.
 * Layout: 64x64 icon box with label centered below (outside the box).
 * Handles: execution state border, icon, label, selection ring,
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

const MAX_LABEL_LENGTH = 24

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

/** Execution status dot — top-right corner of node box */
function ExecutionStatusDot({ state }: { state?: ExecutionState }) {
  if (!state || state === EXECUTION_STATE.PENDING) return null

  const dotClasses: Record<string, string> = {
    [EXECUTION_STATE.COMPLETED]: 'bg-green-500',
    [EXECUTION_STATE.EXECUTING]: 'bg-blue-500 animate-pulse',
    [EXECUTION_STATE.PAUSED]: 'bg-amber-500',
    [EXECUTION_STATE.FAILED]: 'bg-red-500',
  }

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 z-10 h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm',
        dotClasses[state],
      )}
    />
  )
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
    <div
      className={cn(
        'group relative flex flex-col items-center transition-transform duration-200',
        'hover:scale-105',
        !isActive && 'opacity-50',
      )}
    >
      {/* Badge slot — top-left of the icon box */}
      {badge && (
        <div className="absolute -top-2 -left-2 z-10">
          {badge}
        </div>
      )}

      {/* Icon box — n8n style card with floating shadow */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-md transition-all duration-200',
          'w-[64px] h-[64px]',
          'border-l-4',
          getExecutionBorderClass(executionState),
          'group-hover:shadow-lg',
          isSelected && 'ring-2 ring-blue-400 ring-offset-1 shadow-lg',
        )}
      >
        {/* Execution status dot */}
        <ExecutionStatusDot state={executionState} />

        {/* Icon circle */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200',
            'group-hover:brightness-110',
            iconBgColor,
            iconTextColor,
          )}
        >
          {icon}
        </div>
      </div>

      {/* Label — outside, below the icon box (n8n style) */}
      <span
        className="mt-1.5 max-w-[90px] text-xs font-medium leading-tight text-center text-gray-300 select-none truncate drop-shadow-sm"
        title={label}
      >
        {truncateLabel(label)}
      </span>

      {/* ReactFlow handles are passed as children */}
      {children}
    </div>
  )
}

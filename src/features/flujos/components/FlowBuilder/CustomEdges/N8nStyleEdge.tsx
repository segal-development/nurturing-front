/**
 * N8N-Style Edge for Flow Builder
 * Renders smooth, curved connections with modern styling similar to n8n
 * Features:
 * - Smooth bezier curves instead of straight lines
 * - Solid lines with subtle glow effects
 * - Color-coded by branch type (yes/no/default)
 * - Animated flow direction indicator
 * - Hover effects for better interactivity
 */

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
  useReactFlow,
  type EdgeProps,
} from 'reactflow'
import { Trash2 } from 'lucide-react'

/** Unique marker ID per edge color to avoid conflicts */
function getMarkerId(color: string): string {
  return `arrowhead-${color.replace('#', '')}`
}

export function N8nStyleEdge(props: EdgeProps & { sourceHandle?: string }) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
    sourceHandle,
    selected = false,
  } = props

  const { deleteElements } = useReactFlow()

  // Use bezier path with horizontal source/target for n8n style curves
  // This creates smooth S-curves that exit horizontally and enter horizontally
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: Position.Right, // Exit horizontally to the right
    targetX,
    targetY,
    targetPosition: Position.Left,  // Enter horizontally from the left
  })

  // Determine edge styling based on handle type
  const handleToUse = sourceHandle || (data as any)?.sourceHandle

  let edgeColor = '#1e3a8a' // Default blue (segal-blue-900)
  let edgeLabel = data?.label
  let labelBgClass = 'bg-white/90 backdrop-blur border border-segal-blue/30 text-segal-blue'
  let glowColor = '#1e3a8a'
  let branchLabel: string | null = null

  if (handleToUse?.includes('-yes')) {
    edgeColor = '#059669' // Green for YES
    edgeLabel = edgeLabel || '✓ Sí'
    branchLabel = 'Sí'
    labelBgClass = 'bg-green-500/90 backdrop-blur text-white font-semibold'
    glowColor = '#059669'
  } else if (handleToUse?.includes('-no')) {
    edgeColor = '#dc2626' // Red for NO
    edgeLabel = edgeLabel || '✗ No'
    branchLabel = 'No'
    labelBgClass = 'bg-red-500/90 backdrop-blur text-white font-semibold'
    glowColor = '#dc2626'
  }

  const markerId = getMarkerId(edgeColor)
  const markerUrl = `url(#${markerId})`

  const handleDeleteEdge = () => {
    deleteElements({ edges: [{ id: id || '' }] })
  }

  return (
    <>
      {/* SVG arrow marker definition */}
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 8 4 L 0 8 Z" fill={edgeColor} opacity={0.8} />
        </marker>
      </defs>

      {/* Invisible thicker line for better selection hit area */}
      <BaseEdge
        path={edgePath}
        style={{
          strokeWidth: 20,
          stroke: 'transparent',
          cursor: 'pointer',
        }}
      />

      {/* Glow/shadow effect - subtle for unselected, prominent for selected */}
      <BaseEdge
        path={edgePath}
        style={{
          strokeWidth: selected ? 4 : 2.5,
          stroke: glowColor,
          opacity: selected ? 0.3 : 0.15,
          filter: `blur(${selected ? 4 : 2}px)`,
          transition: 'all 0.3s ease',
        }}
      />

      {/* Main solid line with n8n styling + arrowhead */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerUrl}
        style={{
          strokeWidth: selected ? 3 : 2.5,
          stroke: edgeColor,
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
      />

      {/* Animated flowing particles for visual feedback */}
      {selected && (
        <BaseEdge
          path={edgePath}
          style={{
            strokeWidth: 2.5,
            stroke: edgeColor,
            strokeDasharray: '10, 10',
            opacity: 0.6,
            animation: 'flow 1.5s linear infinite',
            transition: 'stroke 0.2s ease',
          }}
        />
      )}

      {/* Branch label pill for conditional edges (Sí / No) */}
      {branchLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-md ${labelBgClass}`}
          >
            {branchLabel}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Generic edge label (non-branch) */}
      {!branchLabel && (edgeLabel || data?.label) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              fontWeight: 600,
              pointerEvents: 'all',
            }}
            className={`nodrag nopan rounded-md px-3 py-1.5 shadow-lg transition-all duration-200 ${labelBgClass}`}
          >
            {edgeLabel}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Interactive delete button on selection */}
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 35}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <span className="text-white/70 font-medium text-xs bg-slate-800/80 backdrop-blur px-2 py-1 rounded-md shadow-md">
              Presiona Delete o
            </span>
            <button
              onClick={handleDeleteEdge}
              title="Eliminar conexión"
              className="flex items-center justify-center p-1.5 rounded-md bg-segal-red hover:bg-segal-red/90 text-white shadow-md transition-all duration-200 hover:scale-110"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}

      <style>
        {`
          @keyframes flow {
            to {
              stroke-dashoffset: -20;
            }
          }
        `}
      </style>
    </>
  )
}

/**
 * Custom Animated Edge for Flow Builder
 * Renders visible connections between nodes with smooth animation
 * Supports selection and deletion via Delete/Backspace keys
 */

import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  useReactFlow,
  type EdgeProps,
} from 'reactflow'
import { Trash2 } from 'lucide-react'

export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  markerEnd,
  markerStart,
  selected = false,
}: EdgeProps) {
  const { deleteElements } = useReactFlow()

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  const handleDeleteEdge = () => {
    deleteElements({ edges: [{ id: id || '' }] })
  }

  return (
    <>
      {/* Invisible thicker line for better selection hit area */}
      <BaseEdge
        path={edgePath}
        style={{
          strokeWidth: 20,
          stroke: 'transparent',
          cursor: 'pointer',
        }}
      />

      {/* Visible animated line */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          strokeWidth: selected ? 3.5 : 2.5,
          stroke: selected ? '#059669' : '#1e3a8a',
          strokeDasharray: '5, 5',
          animation: `dashdraw 0.5s linear infinite`,
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
        }}
      />

      {/* Label renderer */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              fontWeight: 600,
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-white border border-segal-blue/30 rounded px-2 py-1 text-segal-blue shadow-sm"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Helper text and delete button when selected */}
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 30}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <span className="text-segal-green font-medium text-xs">
              Presiona Delete o
            </span>
            <button
              onClick={handleDeleteEdge}
              title="Eliminar conexión"
              className="flex items-center justify-center gap-1 p-1.5 rounded bg-segal-red hover:bg-segal-red/90 text-white shadow-md transition-colors hover:scale-110"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}

      <style>
        {`
          @keyframes dashdraw {
            to {
              stroke-dashoffset: -10;
            }
          }
        `}
      </style>
    </>
  )
}

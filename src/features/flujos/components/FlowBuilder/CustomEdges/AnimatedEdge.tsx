/**
 * Custom Animated Edge for Flow Builder
 * Renders visible connections between nodes with smooth animation
 * Supports selection and deletion via Delete/Backspace keys
 */

import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  type EdgeProps,
} from 'reactflow'

export function AnimatedEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  markerEnd,
  markerStart,
  selected = false,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

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

      {/* Helper text when selected */}
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 30}px)`,
              fontSize: 10,
              pointerEvents: 'none',
            }}
            className="text-segal-green font-medium"
          >
            Presiona Delete para eliminar
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

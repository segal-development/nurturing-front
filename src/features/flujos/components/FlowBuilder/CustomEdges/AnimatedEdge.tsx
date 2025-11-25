/**
 * Custom Animated Edge for Flow Builder
 * Renders visible connections between nodes with smooth animation
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
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          strokeWidth: 2.5,
          stroke: '#1e3a8a',
          strokeDasharray: '5, 5',
          animation: `dashdraw 0.5s linear infinite`,
        }}
      />
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
            className="nodrag nopan bg-white border border-segal-blue/30 rounded px-2 py-1 text-segal-blue"
          >
            {data.label}
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

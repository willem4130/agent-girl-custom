
import { memo, useMemo, useState, useCallback } from "react";
import {
  getBezierPath,
  useStore,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { HANDLE_COLORS } from "../WorkflowContext";

// Check if node is generating based on its data
function isNodeGenerating(
  nodeData: Record<string, unknown> | undefined
): boolean {
  if (!nodeData) return false;
  return nodeData.isGenerating === true;
}

const GradientEdge = memo(function GradientEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  target,
}: EdgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { setEdges } = useReactFlow();

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Get the color based on the source handle
  const edgeColor = useMemo(
    () => HANDLE_COLORS[sourceHandleId || ""] || "#6EDDB3",
    [sourceHandleId]
  );

  // Check if target node is generating
  const targetNodeGenerating = useStore((state) => {
    const targetNode = state.nodeLookup.get(target);
    return isNodeGenerating(targetNode?.data as Record<string, unknown>);
  });

  // Calculate path length for animation (approximate)
  const pathLength = useMemo(() => {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    return Math.sqrt(dx * dx + dy * dy) * 1.5; // Bezier is roughly 1.5x straight line
  }, [sourceX, sourceY, targetX, targetY]);

  // Calculate midpoint for delete button position
  const midPoint = useMemo(() => {
    // For a bezier curve, we approximate the midpoint
    const t = 0.5;
    const cx1 = sourceX;
    const cy1 = sourceY + (targetY - sourceY) * 0.5;
    const cx2 = targetX;
    const cy2 = sourceY + (targetY - sourceY) * 0.5;

    const x =
      Math.pow(1 - t, 3) * sourceX +
      3 * Math.pow(1 - t, 2) * t * cx1 +
      3 * (1 - t) * Math.pow(t, 2) * cx2 +
      Math.pow(t, 3) * targetX;
    const y =
      Math.pow(1 - t, 3) * sourceY +
      3 * Math.pow(1 - t, 2) * t * cy1 +
      3 * (1 - t) * Math.pow(t, 2) * cy2 +
      Math.pow(t, 3) * targetY;

    return { x, y };
  }, [sourceX, sourceY, targetX, targetY]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEdges((edges) => edges.filter((edge) => edge.id !== id));
    },
    [id, setEdges]
  );

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible wider path for easier hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: "pointer" }}
      />

      {/* Base path - always visible */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={edgeColor}
        strokeWidth={isHovered ? 4 : 3}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          opacity: targetNodeGenerating ? 0.3 : 1,
          transition: "stroke-width 0.15s ease",
        }}
      />

      {/* Animated flow path - only when generating */}
      {targetNodeGenerating && (
        <>
          {/* Glow effect */}
          <path
            d={edgePath}
            fill="none"
            stroke={edgeColor}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              opacity: 0.3,
              filter: "blur(4px)",
              animation: "edgePulseAnimation 1.5s ease-in-out infinite",
            }}
          />

          {/* Animated dashes flowing toward target */}
          <path
            d={edgePath}
            fill="none"
            stroke={edgeColor}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="12 8"
            style={{
              animation: "edgeFlowAnimation 1s linear infinite",
            }}
          />

          {/* Bright pulse particles */}
          <path
            d={edgePath}
            fill="none"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`4 ${pathLength}`}
            style={{
              animation: "edgeFlowAnimation 1.5s linear infinite",
              opacity: 0.8,
            }}
          />
        </>
      )}

      {/* Delete button - shown on hover */}
      {isHovered && !targetNodeGenerating && (
        <foreignObject
          x={midPoint.x - 10}
          y={midPoint.y - 10}
          width={20}
          height={20}
          style={{ overflow: "visible" }}
        >
          <button
            onClick={handleDelete}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-white shadow-lg transition-all hover:scale-110 hover:bg-zinc-600"
            style={{ cursor: "pointer" }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </foreignObject>
      )}
    </g>
  );
});

export default GradientEdge;

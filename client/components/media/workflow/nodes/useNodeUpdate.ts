
import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";

/**
 * Hook for updating node data within the workflow.
 * Returns a function to update specific data fields on the current node.
 */
export function useNodeUpdate(nodeId: string) {
  const { setNodes } = useReactFlow();

  const updateData = useCallback(
    (key: string, value: unknown) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, [key]: value } }
            : node
        )
      );
    },
    [nodeId, setNodes]
  );

  return updateData;
}

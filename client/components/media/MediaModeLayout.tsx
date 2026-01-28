/**
 * Media Mode Layout
 *
 * Wraps the WorkflowCanvas with all necessary providers for the media generation workflow system.
 */

import { useState, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { WorkflowProvider } from "./workflow/WorkflowContext";
import WorkflowCanvas from "./workflow/WorkflowCanvas";
import type { WorkflowNode } from "./workflow/types";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useWorkflowExecution } from "@/hooks/useWorkflowExecution";
import type { SavedWorkflow } from "./workflow/WorkflowBottomToolbar";
import { apiFetch } from "@/lib/csrf";

interface MediaModeLayoutProps {
  className?: string;
}

function MediaModeLayoutInner({ className }: MediaModeLayoutProps) {
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);

  const workflow = useWorkflow();
  const execution = useWorkflowExecution();

  const handleNodeClick = useCallback((nodeId: string) => {
    workflow.onNodeClick(nodeId);
  }, [workflow]);

  const handleLoadWorkflow = useCallback(async (savedWorkflow: SavedWorkflow) => {
    try {
      // Fetch the full workflow data
      const response = await apiFetch(`/api/workflows/${savedWorkflow.id}`);
      if (response.ok) {
        const data = await response.json();
        workflow.setNodes(data.nodes || []);
        workflow.setEdges(data.edges || []);
        setCurrentWorkflowId(savedWorkflow.id);
      }
    } catch (error) {
      console.error("Failed to load workflow:", error);
    }
  }, [workflow]);

  const handleNewWorkflow = useCallback(() => {
    workflow.resetWorkflow();
    setCurrentWorkflowId(null);
  }, [workflow]);

  return (
    <WorkflowProvider
      undo={workflow.undo}
      redo={workflow.redo}
      canUndo={workflow.canUndo}
      canRedo={workflow.canRedo}
    >
      <div className={`flex flex-col h-full w-full bg-[#0a0a0a] ${className || ""}`}>
        <WorkflowCanvas
          nodes={workflow.nodes}
          edges={workflow.edges}
          onNodesChange={workflow.onNodesChange}
          onEdgesChange={workflow.onEdgesChange}
          onConnect={workflow.onConnect}
          onNodeClick={(_: React.MouseEvent, node: WorkflowNode) => handleNodeClick(node.id)}
          onPaneClick={workflow.clearSelection}
          onDeleteNode={workflow.deleteNode}
          onRunNode={execution.executeNode}
          onRunAll={execution.executeAll}
          onStopAll={execution.stopExecution}
          isExecutingAll={execution.isExecuting}
          executingCount={execution.executingNodeIds.length}
          currentWorkflowId={currentWorkflowId}
          onLoadWorkflow={handleLoadWorkflow}
          onNewWorkflow={handleNewWorkflow}
        />
      </div>
    </WorkflowProvider>
  );
}

export function MediaModeLayout(props: MediaModeLayoutProps) {
  return (
    <ReactFlowProvider>
      <MediaModeLayoutInner {...props} />
    </ReactFlowProvider>
  );
}

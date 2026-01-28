"use client";

import { create } from "zustand";

/**
 * Global store for tracking generation states across page navigation.
 * This ensures skeleton loaders persist when navigating away and returning.
 */

export interface PendingGeneration {
  id: string;
  type: "image" | "video";
  startedAt: number;
  prompt?: string;
}

export interface PendingWorkflowNode {
  nodeId: string;
  workflowId?: string;
  startedAt: number;
}

interface GenerationStore {
  // Image generations
  pendingImageGenerations: PendingGeneration[];
  addImageGeneration: (id: string, prompt?: string) => void;
  removeImageGeneration: (id: string) => void;
  clearImageGenerations: () => void;
  getImagePendingCount: () => number;

  // Video generations
  pendingVideoGenerations: PendingGeneration[];
  addVideoGeneration: (id: string, prompt?: string) => void;
  removeVideoGeneration: (id: string) => void;
  clearVideoGenerations: () => void;
  getVideoPendingCount: () => number;

  // Workflow node executions
  pendingWorkflowNodes: PendingWorkflowNode[];
  addWorkflowNode: (nodeId: string, workflowId?: string) => void;
  removeWorkflowNode: (nodeId: string) => void;
  clearWorkflowNodes: () => void;
  isWorkflowExecuting: () => boolean;
  getExecutingNodeIds: () => string[];
}

export const useGenerationStore = create<GenerationStore>((set, get) => ({
  // Image generations
  pendingImageGenerations: [],

  addImageGeneration: (id, prompt) =>
    set((state) => ({
      pendingImageGenerations: [
        ...state.pendingImageGenerations,
        { id, type: "image", startedAt: Date.now(), prompt },
      ],
    })),

  removeImageGeneration: (id) =>
    set((state) => ({
      pendingImageGenerations: state.pendingImageGenerations.filter(
        (gen) => gen.id !== id
      ),
    })),

  clearImageGenerations: () => set({ pendingImageGenerations: [] }),

  getImagePendingCount: () => get().pendingImageGenerations.length,

  // Video generations
  pendingVideoGenerations: [],

  addVideoGeneration: (id, prompt) =>
    set((state) => ({
      pendingVideoGenerations: [
        ...state.pendingVideoGenerations,
        { id, type: "video", startedAt: Date.now(), prompt },
      ],
    })),

  removeVideoGeneration: (id) =>
    set((state) => ({
      pendingVideoGenerations: state.pendingVideoGenerations.filter(
        (gen) => gen.id !== id
      ),
    })),

  clearVideoGenerations: () => set({ pendingVideoGenerations: [] }),

  getVideoPendingCount: () => get().pendingVideoGenerations.length,

  // Workflow node executions
  pendingWorkflowNodes: [],

  addWorkflowNode: (nodeId, workflowId) =>
    set((state) => ({
      pendingWorkflowNodes: [
        ...state.pendingWorkflowNodes,
        { nodeId, workflowId, startedAt: Date.now() },
      ],
    })),

  removeWorkflowNode: (nodeId) =>
    set((state) => ({
      pendingWorkflowNodes: state.pendingWorkflowNodes.filter(
        (node) => node.nodeId !== nodeId
      ),
    })),

  clearWorkflowNodes: () => set({ pendingWorkflowNodes: [] }),

  isWorkflowExecuting: () => get().pendingWorkflowNodes.length > 0,

  getExecutingNodeIds: () =>
    get().pendingWorkflowNodes.map((node) => node.nodeId),
}));

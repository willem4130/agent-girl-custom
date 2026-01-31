/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Hook for session-specific reference materials API
 */

import { useState, useCallback } from 'react';

// Use dynamic URL based on current window location
const API_BASE = `${window.location.protocol}//${window.location.host}/api`;

export interface SessionReferenceMaterial {
  id: string;
  session_id: string;
  material_type: 'url' | 'file' | 'text' | 'project';
  title: string;
  content: string;
  source_url?: string;
  tags: string[];
  // File reference fields
  file_path?: string;
  is_folder?: number;
  folder_depth?: number;
  file_patterns?: string;
  created_at: string;
}

export interface AddReferenceInput {
  materialType: 'url' | 'file' | 'text' | 'project';
  title: string;
  content: string;
  sourceUrl?: string;
  tags?: string[];
  // File reference fields
  filePath?: string;
  isFolder?: boolean;
  folderDepth?: number;
  filePatterns?: string[];
}

export function useSessionReferencesAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all reference materials for a session
   */
  const fetchSessionReferences = useCallback(
    async (sessionId: string): Promise<SessionReferenceMaterial[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/sessions/${sessionId}/references`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as { references: SessionReferenceMaterial[] };
        return data.references;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch references';
        setError(errorMsg);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Add a reference material to a session
   */
  const addSessionReference = useCallback(
    async (sessionId: string, input: AddReferenceInput): Promise<SessionReferenceMaterial | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/sessions/${sessionId}/references`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return (await response.json()) as SessionReferenceMaterial;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to add reference';
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delete a reference material from a session
   */
  const deleteSessionReference = useCallback(
    async (sessionId: string, referenceId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/sessions/${sessionId}/references/${referenceId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as { success: boolean };
        return data.success;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete reference';
        setError(errorMsg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delete all reference materials from a session
   */
  const deleteAllSessionReferences = useCallback(async (sessionId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/references`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as { success: boolean };
      return data.success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete references';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Copy reference materials from a brand to a session
   */
  const copyBrandRefsToSession = useCallback(
    async (sessionId: string, brandId: string): Promise<number> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/sessions/${sessionId}/references/copy-from-brand/${brandId}`, {
          method: 'POST',
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as { success: boolean; copiedCount: number };
        return data.copiedCount;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to copy references from brand';
        setError(errorMsg);
        return 0;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    fetchSessionReferences,
    addSessionReference,
    deleteSessionReference,
    deleteAllSessionReferences,
    copyBrandRefsToSession,
  };
}

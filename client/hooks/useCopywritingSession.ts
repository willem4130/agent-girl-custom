/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Hook for managing copywriting content generation sessions
 */

import { useState, useCallback } from 'react';

const API_BASE = `${window.location.protocol}//${window.location.host}/api/copywriting`;

export type ContentType =
  | 'linkedin_post'
  | 'facebook_post'
  | 'instagram_post'
  | 'article'
  | 'newsletter'
  | 'custom';

export type WorkflowStep =
  | 'brand_select'
  | 'content_type'
  | 'briefing'
  | 'clarification'
  | 'generation'
  | 'refinement'
  | 'completed';

export interface BriefingData {
  topic?: string;
  goals?: string[];
  audience?: string;
  keyMessages?: string[];
  references?: string[];
  additionalContext?: string;
}

export interface FeedbackEntry {
  draft_index: number;
  feedback: string;
  refined_draft?: string;
  timestamp: string;
}

export interface ContentSession {
  id: string;
  brand_id: string;
  content_type: ContentType;
  workflow_step: WorkflowStep;
  briefing_data: BriefingData;
  generated_drafts: string[];
  feedback_history: FeedbackEntry[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateSessionInput {
  brandId: string;
  contentType: ContentType;
}

export function useCopywritingSession() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<ContentSession | null>(null);

  /**
   * Create a new content generation session
   */
  const createSession = useCallback(async (input: CreateSessionInput): Promise<ContentSession | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      const session = (await response.json()) as ContentSession;
      setCurrentSession(session);
      return session;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch an existing session
   */
  const fetchSession = useCallback(async (sessionId: string): Promise<ContentSession | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}`);

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const session = (await response.json()) as ContentSession;
      setCurrentSession(session);
      return session;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch session';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update session workflow step
   */
  const updateWorkflowStep = useCallback(
    async (sessionId: string, step: WorkflowStep): Promise<ContentSession | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflowStep: step }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        const session = (await response.json()) as ContentSession;
        setCurrentSession(session);
        return session;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update workflow step';
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Update session briefing data
   */
  const updateBriefing = useCallback(
    async (sessionId: string, briefingData: BriefingData): Promise<ContentSession | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ briefingData }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        const session = (await response.json()) as ContentSession;
        setCurrentSession(session);
        return session;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update briefing';
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Add generated drafts to session
   */
  const addDrafts = useCallback(
    async (sessionId: string, drafts: string[]): Promise<ContentSession | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generatedDrafts: drafts }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        const session = (await response.json()) as ContentSession;
        setCurrentSession(session);
        return session;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to add drafts';
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Add feedback for a draft
   */
  const addFeedback = useCallback(
    async (
      sessionId: string,
      draftIndex: number,
      feedback: string,
      refinedDraft?: string
    ): Promise<ContentSession | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/sessions/${sessionId}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draftIndex, feedback, refinedDraft }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        const session = (await response.json()) as ContentSession;
        setCurrentSession(session);
        return session;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to add feedback';
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Complete a session
   */
  const completeSession = useCallback(async (sessionId: string): Promise<ContentSession | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/complete`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      const session = (await response.json()) as ContentSession;
      setCurrentSession(session);
      return session;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to complete session';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch active sessions for a brand
   */
  const fetchActiveSessions = useCallback(async (brandId: string): Promise<ContentSession[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/brands/${brandId}/sessions`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as { sessions: ContentSession[] };
      return data.sessions;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch sessions';
      setError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear current session from state
   */
  const clearSession = useCallback(() => {
    setCurrentSession(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    currentSession,
    createSession,
    fetchSession,
    updateWorkflowStep,
    updateBriefing,
    addDrafts,
    addFeedback,
    completeSession,
    fetchActiveSessions,
    clearSession,
  };
}

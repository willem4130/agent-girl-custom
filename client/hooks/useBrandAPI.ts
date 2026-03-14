/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useState, useCallback } from 'react';

// Use dynamic URL based on current window location
const API_BASE = `${window.location.protocol}//${window.location.host}/api/copywriting`;

export interface Brand {
  id: string;
  session_id: string;
  name: string;
  website_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
  language: 'nl' | 'en' | 'both';
  content_types: string[];
  created_at: string;
  updated_at: string;
  // Analysis status (populated from listBrandConfigsWithStatus)
  has_voice_analysis?: boolean;
  analysis_confidence?: number;
}

export interface VoiceProfile {
  id: string;
  brand_id: string;
  version: number;
  formality_score: number;
  humor_score: number;
  energy_score: number;
  authority_score: number;
  vocabulary_complexity: number;
  avg_sentence_length: number;
  emoji_density: number;
  hashtag_density: number;
  cta_style: string;
  top_frameworks: string[];
  top_triggers: string[];
  winning_hooks: string[];
  avoid_patterns: string[];
  samples_analyzed: number;
  confidence_score: number;
  created_at: string;
  superseded_at?: string;
}

export interface ScrapedContent {
  id: string;
  brand_id: string;
  platform: 'website' | 'instagram' | 'facebook' | 'linkedin';
  content_type?: string;
  raw_content: string;
  scraped_at: string;
  engagement_metrics?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CreateBrandInput {
  sessionId: string;
  name: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  language?: 'nl' | 'en' | 'both';
  contentTypes?: string[];
}

export interface UpdateBrandInput {
  name?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  language?: 'nl' | 'en' | 'both';
  contentTypes?: string[];
}

export interface AnalyzeResult {
  success: boolean;
  results: Array<{
    platform: string;
    success: boolean;
    error?: string;
  }>;
}

export interface VoiceAnalysis {
  id: string;
  brand_id: string;
  voice_description: string;
  writing_style_patterns: {
    sentenceStructures?: string[];
    commonTransitions?: string[];
    openingPatterns?: string[];
    closingPatterns?: string[];
    paragraphLength?: string;
  };
  vocabulary_preferences: {
    preferredWords?: string[];
    avoidedWords?: string[];
    brandTerms?: string[];
    industryJargon?: string[];
  };
  example_hooks: string[];
  generated_guidelines: string;
  tone_dimensions: {
    formality?: number;
    humor?: number;
    energy?: number;
    authority?: number;
    warmth?: number;
    directness?: number;
  };
  samples_analyzed: number;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface DeepAnalyzeResult {
  success: boolean;
  crawl: {
    pagesScraped: number;
    totalWords: number;
    pageTypes: Record<string, number>;
    detectedTopics: string[];
  } | null;
  social: Array<{
    platform: string;
    success: boolean;
    error?: string;
  }>;
  voiceAnalysis: {
    voiceDescription: string;
    toneDimensions: Record<string, number>;
    confidenceScore: number;
    samplesAnalyzed: number;
  } | null;
}

export interface ReferenceMaterial {
  id: string;
  brand_id: string;
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

export function useBrandAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all brands
   */
  const fetchBrands = useCallback(async (): Promise<Brand[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/brands`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as { brands: Brand[] };
      return data.brands;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch brands';
      setError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get a single brand by ID
   */
  const fetchBrand = useCallback(async (brandId: string): Promise<Brand | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/brands/${brandId}`);

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as Brand;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch brand';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new brand
   */
  const createBrand = useCallback(async (input: CreateBrandInput): Promise<Brand | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as Brand;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create brand';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update an existing brand
   */
  const updateBrand = useCallback(
    async (brandId: string, input: UpdateBrandInput): Promise<Brand | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/brands/${brandId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return (await response.json()) as Brand;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update brand';
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delete a brand
   */
  const deleteBrand = useCallback(async (brandId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/brands/${brandId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as { success: boolean };
      return data.success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete brand';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Trigger brand analysis (scraping all configured URLs)
   */
  const analyzeBrand = useCallback(async (brandId: string): Promise<AnalyzeResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/brands/${brandId}/analyze`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as AnalyzeResult;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to analyze brand';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch current voice profile for a brand
   */
  const fetchVoiceProfile = useCallback(async (brandId: string): Promise<VoiceProfile | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/voice/${brandId}`);

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as VoiceProfile;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch voice profile';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh/regenerate voice profile from scraped content
   */
  const refreshVoiceProfile = useCallback(
    async (brandId: string): Promise<VoiceProfile | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/voice/${brandId}/refresh`, {
          method: 'POST',
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return (await response.json()) as VoiceProfile;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to refresh voice profile';
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Fetch scraped content for a brand
   */
  const fetchScrapedContent = useCallback(
    async (brandId: string, platform?: string): Promise<ScrapedContent[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const url = platform
          ? `${API_BASE}/scraping/content/${brandId}?platform=${platform}`
          : `${API_BASE}/scraping/content/${brandId}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as { content: ScrapedContent[] };
        return data.content;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch scraped content';
        setError(errorMsg);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Deep analyze brand (deep crawl + LLM analysis)
   */
  const deepAnalyzeBrand = useCallback(
    async (brandId: string, maxPages = 25): Promise<DeepAnalyzeResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/brands/${brandId}/deep-analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maxPages, runLlmAnalysis: true }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return (await response.json()) as DeepAnalyzeResult;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to deep analyze brand';
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Fetch LLM-generated voice analysis for a brand
   */
  const fetchVoiceAnalysis = useCallback(async (brandId: string): Promise<VoiceAnalysis | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/brands/${brandId}/voice-analysis`);

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as VoiceAnalysis;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch voice analysis';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch reference materials for a brand
   */
  const fetchReferences = useCallback(
    async (brandId: string, materialType?: string): Promise<ReferenceMaterial[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const url = materialType
          ? `${API_BASE}/brands/${brandId}/references?type=${materialType}`
          : `${API_BASE}/brands/${brandId}/references`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as { references: ReferenceMaterial[] };
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
   * Add a reference material
   */
  const addReference = useCallback(
    async (
      brandId: string,
      input: {
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
    ): Promise<ReferenceMaterial | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/brands/${brandId}/references`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return (await response.json()) as ReferenceMaterial;
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
   * Delete a reference material
   */
  const deleteReference = useCallback(async (referenceId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/references/${referenceId}`, {
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
  }, []);

  return {
    isLoading,
    error,
    fetchBrands,
    fetchBrand,
    createBrand,
    updateBrand,
    deleteBrand,
    analyzeBrand,
    deepAnalyzeBrand,
    fetchVoiceProfile,
    fetchVoiceAnalysis,
    refreshVoiceProfile,
    fetchScrapedContent,
    fetchReferences,
    addReference,
    deleteReference,
  };
}

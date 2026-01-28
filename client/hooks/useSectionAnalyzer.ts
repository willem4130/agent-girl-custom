/**
 * Section Analyzer Hook
 *
 * Analyzes copy text to extract sections with visual concepts.
 * Used for copy-centric image generation workflow.
 */

import { useState, useCallback } from 'react';
import type { CopySection, SectionType } from './useCopyLibrary';

const COPYWRITING_API = `${window.location.protocol}//${window.location.host}/api/copywriting`;

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyzeSectionsResult {
  copyId: string;
  sections: CopySection[];
  totalSections: number;
  contentType: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSectionAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzedCopyId, setLastAnalyzedCopyId] = useState<string | null>(null);
  const [sections, setSections] = useState<CopySection[]>([]);

  /**
   * Analyze a copy to extract sections with visual concepts
   */
  const analyzeCopy = useCallback(async (copyId: string): Promise<CopySection[]> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`${COPYWRITING_API}/copy/${copyId}/analyze-sections`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()) as AnalyzeSectionsResult;

      setLastAnalyzedCopyId(copyId);
      setSections(result.sections);

      return result.sections;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to analyze copy';
      setError(errorMsg);
      setSections([]);
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Fetch existing sections for a copy (without re-analyzing)
   */
  const fetchSections = useCallback(async (copyId: string): Promise<CopySection[]> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`${COPYWRITING_API}/copy/${copyId}/sections`);

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()) as { copyId: string; sections: CopySection[]; totalSections: number };

      setLastAnalyzedCopyId(copyId);
      setSections(result.sections);

      return result.sections;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch sections';
      setError(errorMsg);
      setSections([]);
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Update visual concept for a section
   */
  const updateVisualConcept = useCallback(
    async (sectionId: string, concept: string): Promise<CopySection | null> => {
      setError(null);

      try {
        const response = await fetch(`${COPYWRITING_API}/sections/${sectionId}/visual-concept`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ concept }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        const updatedSection = (await response.json()) as CopySection;

        // Update local state
        setSections(prev =>
          prev.map(s => (s.id === sectionId ? updatedSection : s))
        );

        return updatedSection;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update visual concept';
        setError(errorMsg);
        return null;
      }
    },
    []
  );

  /**
   * Link an image to a section
   */
  const linkImageToSection = useCallback(
    async (sectionId: string, imageId: string | null): Promise<CopySection | null> => {
      setError(null);

      try {
        const response = await fetch(`${COPYWRITING_API}/sections/${sectionId}/image`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        const updatedSection = (await response.json()) as CopySection;

        // Update local state
        setSections(prev =>
          prev.map(s => (s.id === sectionId ? updatedSection : s))
        );

        return updatedSection;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to link image to section';
        setError(errorMsg);
        return null;
      }
    },
    []
  );

  /**
   * Clear current sections
   */
  const clearSections = useCallback(() => {
    setSections([]);
    setLastAnalyzedCopyId(null);
    setError(null);
  }, []);

  /**
   * Get section type label for display
   */
  const getSectionTypeLabel = useCallback((type: SectionType): string => {
    const labels: Record<SectionType, string> = {
      headline: 'Headline',
      intro: 'Introduction',
      'body-section': 'Body',
      conclusion: 'Conclusion',
      cta: 'Call to Action',
      quote: 'Quote',
      'list-item': 'List Item',
    };
    return labels[type] || type;
  }, []);

  /**
   * Get section type color for badges
   */
  const getSectionTypeColor = useCallback((type: SectionType): string => {
    const colors: Record<SectionType, string> = {
      headline: 'bg-purple-100 text-purple-800',
      intro: 'bg-blue-100 text-blue-800',
      'body-section': 'bg-gray-100 text-gray-800',
      conclusion: 'bg-green-100 text-green-800',
      cta: 'bg-orange-100 text-orange-800',
      quote: 'bg-yellow-100 text-yellow-800',
      'list-item': 'bg-indigo-100 text-indigo-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }, []);

  return {
    // State
    isAnalyzing,
    error,
    sections,
    lastAnalyzedCopyId,

    // Actions
    analyzeCopy,
    fetchSections,
    updateVisualConcept,
    linkImageToSection,
    clearSections,

    // Helpers
    getSectionTypeLabel,
    getSectionTypeColor,
  };
}

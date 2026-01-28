/**
 * Copy Library Hook
 *
 * Manages copy content with sections and linked images for a brand.
 * Used for copy-centric image generation workflow.
 */

import { useState, useCallback } from 'react';

const COPYWRITING_API = `${window.location.protocol}//${window.location.host}/api/copywriting`;

// ============================================================================
// TYPES
// ============================================================================

export type SectionType = 'headline' | 'intro' | 'body-section' | 'conclusion' | 'cta' | 'quote' | 'list-item';

export interface CopySection {
  id: string;
  copy_id: string;
  section_type: SectionType;
  section_index: number;
  content: string;
  suggested_visual_concept: string | null;
  image_id: string | null;
  created_at: string;
}

export interface GeneratedImage {
  id: string;
  brand_id: string;
  copy_id?: string;
  provider: string;
  prompt: string;
  negative_prompt?: string;
  aspect_ratio: string;
  image_url?: string;
  thumbnail_url?: string;
  local_path?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface GeneratedCopy {
  id: string;
  brand_id: string;
  content_type: string;
  platform: string;
  copy_text: string;
  variation_number: number;
  status: 'draft' | 'approved' | 'published' | 'archived';
  created_at: string;
}

export interface CopyWithMedia extends GeneratedCopy {
  sections: CopySection[];
  images: GeneratedImage[];
}

// ============================================================================
// HOOK
// ============================================================================

export function useCopyLibrary(brandId: string | null) {
  const [copies, setCopies] = useState<CopyWithMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCopyId, setSelectedCopyId] = useState<string | null>(null);
  const [selectedSectionIds, setSelectedSectionIds] = useState<Set<string>>(new Set());

  /**
   * Fetch all copies with their sections and linked images
   */
  const fetchCopiesWithMedia = useCallback(async () => {
    if (!brandId) {
      setCopies([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${COPYWRITING_API}/brands/${brandId}/copies-with-media`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as { copies: CopyWithMedia[] };
      setCopies(data.copies || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch copies';
      setError(errorMsg);
      setCopies([]);
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  /**
   * Get the currently selected copy
   */
  const selectedCopy = copies.find(c => c.id === selectedCopyId) || null;

  /**
   * Toggle section selection for batch operations
   */
  const toggleSection = useCallback((sectionId: string) => {
    setSelectedSectionIds(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  /**
   * Select all sections from a copy
   */
  const selectAllSections = useCallback((copyId: string) => {
    const copy = copies.find(c => c.id === copyId);
    if (copy) {
      setSelectedSectionIds(new Set(copy.sections.map(s => s.id)));
    }
  }, [copies]);

  /**
   * Clear section selection
   */
  const clearSelection = useCallback(() => {
    setSelectedSectionIds(new Set());
  }, []);

  /**
   * Check if a section is selected
   */
  const isSectionSelected = useCallback((sectionId: string) => {
    return selectedSectionIds.has(sectionId);
  }, [selectedSectionIds]);

  /**
   * Get all selected sections with their data
   */
  const getSelectedSections = useCallback(() => {
    const sections: CopySection[] = [];
    for (const copy of copies) {
      for (const section of copy.sections) {
        if (selectedSectionIds.has(section.id)) {
          sections.push(section);
        }
      }
    }
    return sections;
  }, [copies, selectedSectionIds]);

  /**
   * Refresh a single copy's data after modification
   */
  const refreshCopy = useCallback(async (copyId: string) => {
    if (!brandId) return;

    try {
      // Fetch sections for this copy
      const sectionsResponse = await fetch(`${COPYWRITING_API}/copy/${copyId}/sections`);
      if (!sectionsResponse.ok) return;

      const sectionsData = (await sectionsResponse.json()) as { sections: CopySection[] };

      // Update the copy in the list
      setCopies(prev =>
        prev.map(copy =>
          copy.id === copyId
            ? { ...copy, sections: sectionsData.sections }
            : copy
        )
      );
    } catch {
      // Silently fail - the data will refresh on next full fetch
    }
  }, [brandId]);

  return {
    // State
    copies,
    isLoading,
    error,
    selectedCopyId,
    selectedCopy,
    selectedSectionIds,

    // Actions
    fetchCopiesWithMedia,
    setSelectedCopyId,
    toggleSection,
    selectAllSections,
    clearSelection,
    isSectionSelected,
    getSelectedSections,
    refreshCopy,
  };
}

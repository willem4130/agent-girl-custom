/**
 * Copywriting Context
 *
 * React Context for sharing copywriting state (brandId, sessionId, mode)
 * across components without prop drilling.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface CopywritingContextValue {
  brandId: string | null;
  sessionId: string | null;
  mode: string | null;
  setBrandId: (id: string | null) => void;
  setSessionId: (id: string | null) => void;
  setMode: (mode: string | null) => void;
  isCopywritingMode: boolean;
  refreshCopyLibrary: () => void;
  onCopyLibraryRefresh: (() => void) | null;
  setOnCopyLibraryRefresh: (callback: (() => void) | null) => void;
  // New fields for enhanced copywriting mode
  templateId: string | null;
  setTemplateId: (id: string | null) => void;
  tonePresetId: string | null;
  setTonePresetId: (id: string | null) => void;
  selectedReferenceTags: string[];
  setSelectedReferenceTags: (tags: string[]) => void;
  // Content format IDs (multi-select for content series)
  contentFormatIds: string[];
  setContentFormatIds: (ids: string[]) => void;
}

const CopywritingContext = createContext<CopywritingContextValue | null>(null);

export function CopywritingProvider({ children }: { children: ReactNode }) {
  const [brandId, setBrandId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [onCopyLibraryRefresh, setOnCopyLibraryRefresh] = useState<(() => void) | null>(null);
  // New state for enhanced copywriting mode
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [tonePresetId, setTonePresetId] = useState<string | null>(null);
  const [selectedReferenceTags, setSelectedReferenceTags] = useState<string[]>([]);
  // Content format IDs (multi-select for content series)
  const [contentFormatIds, setContentFormatIds] = useState<string[]>([]);

  const isCopywritingMode = mode === 'copywriting';

  const refreshCopyLibrary = useCallback(() => {
    if (onCopyLibraryRefresh) {
      onCopyLibraryRefresh();
    }
  }, [onCopyLibraryRefresh]);

  return (
    <CopywritingContext.Provider
      value={{
        brandId,
        sessionId,
        mode,
        setBrandId,
        setSessionId,
        setMode,
        isCopywritingMode,
        refreshCopyLibrary,
        onCopyLibraryRefresh,
        setOnCopyLibraryRefresh,
        templateId,
        setTemplateId,
        tonePresetId,
        setTonePresetId,
        selectedReferenceTags,
        setSelectedReferenceTags,
        contentFormatIds,
        setContentFormatIds,
      }}
    >
      {children}
    </CopywritingContext.Provider>
  );
}

export function useCopywritingContext() {
  const context = useContext(CopywritingContext);
  if (!context) {
    // Return a default context if not within provider (for non-copywriting pages)
    return {
      brandId: null,
      sessionId: null,
      mode: null,
      setBrandId: () => {},
      setSessionId: () => {},
      setMode: () => {},
      isCopywritingMode: false,
      refreshCopyLibrary: () => {},
      onCopyLibraryRefresh: null,
      setOnCopyLibraryRefresh: () => {},
      templateId: null,
      setTemplateId: () => {},
      tonePresetId: null,
      setTonePresetId: () => {},
      selectedReferenceTags: [],
      setSelectedReferenceTags: () => {},
      contentFormatIds: [],
      setContentFormatIds: () => {},
    };
  }
  return context;
}

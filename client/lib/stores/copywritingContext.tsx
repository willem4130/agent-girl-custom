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
}

const CopywritingContext = createContext<CopywritingContextValue | null>(null);

export function CopywritingProvider({ children }: { children: ReactNode }) {
  const [brandId, setBrandId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [onCopyLibraryRefresh, setOnCopyLibraryRefresh] = useState<(() => void) | null>(null);

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
    };
  }
  return context;
}

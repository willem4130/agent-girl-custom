/**
 * Save to Copy Library Overlay
 *
 * Hover overlay component that allows saving text content to the Copy Library.
 * Detects <!-- copy-section --> markers to enable saving individual variations.
 */

import React, { useState, useMemo } from 'react';
import { BookmarkPlus, Check, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Patterns that indicate section boundaries (in order of priority)
const SECTION_PATTERNS = [
  /<!-- copy-section -->/g,                           // Explicit marker
  /^---+$/gm,                                          // Markdown horizontal rule
  /^#{1,3}\s*(POST|Variation|Variatie|VARIANT|Option)\s*\d+/gim,  // ## POST 1:, ## Variation 2:, etc.
];

// Split content into sections using detected patterns
function splitIntoSections(content: string): string[] | null {
  // Try each pattern
  for (const pattern of SECTION_PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;

    // Check if pattern exists in content
    if (pattern.test(content)) {
      pattern.lastIndex = 0;

      // For heading patterns, we want to keep the heading with its content
      if (pattern.source.includes('POST|Variation')) {
        // Find all heading positions
        const matches: { index: number; match: string }[] = [];
        let match;
        while ((match = pattern.exec(content)) !== null) {
          matches.push({ index: match.index, match: match[0] });
        }

        if (matches.length >= 2) {
          // Split at each heading position
          const sections: string[] = [];
          for (let i = 0; i < matches.length; i++) {
            const start = matches[i].index;
            const end = i < matches.length - 1 ? matches[i + 1].index : content.length;
            const section = content.slice(start, end).trim();
            if (section.length > 0) {
              sections.push(section);
            }
          }

          // Add any intro text before first heading
          if (matches[0].index > 0) {
            const intro = content.slice(0, matches[0].index).trim();
            if (intro.length > 50) {
              sections.unshift(intro);
            }
          }

          if (sections.length >= 2) {
            return sections;
          }
        }
      } else {
        // For separator patterns (---, <!-- -->), split directly
        const sections = content
          .split(pattern)
          .map(s => s.trim())
          .filter(s => s.length > 50); // Filter out tiny sections

        if (sections.length >= 2) {
          return sections;
        }
      }
    }
  }

  return null; // No sections detected
}

interface SaveToCopyLibraryProps {
  children: React.ReactNode;
  content: string;
  brandId: string | null;
  sessionId: string | null;
  platform?: string;
  contentType?: string;
  onSaved?: () => void;
}

interface SectionSaveButtonProps {
  content: string;
  brandId: string;
  sessionId: string | null;
  platform: string;
  contentType: string;
  onSaved?: () => void;
  sectionIndex: number;
}

function SectionSaveButton({
  content,
  brandId,
  sessionId,
  platform,
  contentType,
  onSaved,
  sectionIndex,
}: SectionSaveButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!content.trim() || isSaving || isSaved) return;

    setIsSaving(true);

    try {
      const response = await fetch('/api/copywriting/copy/save-from-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          sessionId,
          copyText: content,
          platform,
          contentType,
        }),
      });

      if (response.ok) {
        setIsSaved(true);
        onSaved?.();
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        console.error('Failed to save section to copy library');
      }
    } catch (error) {
      console.error('Error saving section:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={isSaving || isSaved}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shadow-md transition-all duration-200 ${
        isSaved
          ? 'bg-green-500 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white opacity-0 group-hover/section:opacity-100'
      }`}
      title={`Save Variation ${sectionIndex + 1} to Library`}
    >
      {isSaving ? (
        <Loader2 size={12} className="animate-spin" />
      ) : isSaved ? (
        <Check size={12} />
      ) : (
        <BookmarkPlus size={12} />
      )}
      {isSaved ? 'Saved!' : 'Save'}
    </button>
  );
}

function SectionBlock({
  content,
  brandId,
  sessionId,
  platform,
  contentType,
  onSaved,
  sectionIndex,
}: SectionSaveButtonProps) {
  // Clean content for display (remove the marker itself if present at start)
  const displayContent = content.trim();

  return (
    <div className="group/section relative">
      {/* Section content with left border accent */}
      <div className="relative pl-4 border-l-2 border-transparent hover:border-blue-500/50 transition-colors duration-200">
        {/* Floating save button - top right of section */}
        <div className="absolute -top-1 right-0 z-10">
          <SectionSaveButton
            content={displayContent}
            brandId={brandId}
            sessionId={sessionId}
            platform={platform}
            contentType={contentType}
            onSaved={onSaved}
            sectionIndex={sectionIndex}
          />
        </div>

        {/* Render the markdown content */}
        <div className="prose prose-invert max-w-none pr-20">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {displayContent}
          </ReactMarkdown>
        </div>
      </div>

      {/* Subtle divider between sections */}
      <div className="my-4 border-t border-white/10" />
    </div>
  );
}

export function SaveToCopyLibrary({
  children,
  content,
  brandId,
  sessionId,
  platform = 'linkedin',
  contentType = 'linkedin_post',
  onSaved,
}: SaveToCopyLibraryProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Check if content has detectable sections
  const sections = useMemo(() => {
    return splitIntoSections(content);
  }, [content]);

  const handleSaveAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!brandId || !content.trim() || isSaving || isSaved) return;

    setIsSaving(true);

    try {
      const response = await fetch('/api/copywriting/copy/save-from-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          sessionId,
          copyText: content.replace(/<!-- copy-section -->/g, '---'),
          platform,
          contentType,
        }),
      });

      if (response.ok) {
        setIsSaved(true);
        onSaved?.();
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        console.error('Failed to save to copy library');
      }
    } catch (error) {
      console.error('Error saving to copy library:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Don't show overlay if no brand is selected
  if (!brandId) {
    return <>{children}</>;
  }

  // If sections detected, render with per-section save buttons
  if (sections && sections.length > 1) {
    return (
      <div className="relative">
        {/* "Save All" button at top */}
        <div className="flex justify-end mb-3">
          <button
            onClick={handleSaveAll}
            disabled={isSaving || isSaved}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg transition-all duration-200 ${
              isSaved
                ? 'bg-green-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white/80 border border-white/20'
            }`}
            title="Save all variations to Library"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isSaved ? (
              <Check size={14} />
            ) : (
              <BookmarkPlus size={14} />
            )}
            {isSaved ? 'All Saved!' : `Save All (${sections.length})`}
          </button>
        </div>

        {/* Render each section with its own save button */}
        {sections.map((sectionContent, index) => (
          <SectionBlock
            key={index}
            content={sectionContent}
            brandId={brandId}
            sessionId={sessionId}
            platform={platform}
            contentType={contentType}
            onSaved={onSaved}
            sectionIndex={index}
          />
        ))}
      </div>
    );
  }

  // Single block mode (no sections detected)
  return (
    <div
      className="relative group/savetolibrary"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Content */}
      {children}

      {/* Hover highlight border */}
      <div
        className={`absolute inset-0 pointer-events-none rounded-lg transition-all duration-200 ${
          isHovered
            ? 'ring-2 ring-blue-500/30 bg-blue-500/5'
            : 'ring-0 bg-transparent'
        }`}
      />

      {/* Floating action button */}
      <div
        className={`absolute -top-2 -right-2 transition-all duration-200 ${
          isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <button
          onClick={handleSaveAll}
          disabled={isSaving || isSaved}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg transition-all duration-200 ${
            isSaved
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          title="Save to Copy Library"
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isSaved ? (
            <Check size={14} />
          ) : (
            <BookmarkPlus size={14} />
          )}
          {isSaved ? 'Saved!' : 'Save to Library'}
        </button>
      </div>
    </div>
  );
}

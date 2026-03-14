/**
 * Copy Library Panel
 *
 * Displays all copy content with sections and linked images for a brand.
 * Supports section selection for batch image generation.
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  CheckSquare,
  Square,
  RefreshCw,
  Wand2,
  Copy,
  Check,
  Search,
  Filter,
  X,
  Download,
} from 'lucide-react';
import { useCopyLibrary, type CopyWithMedia, type CopySection, type CopyFormat } from '../../hooks/useCopyLibrary';
import { useSectionAnalyzer } from '../../hooks/useSectionAnalyzer';
import { useCopywritingContext } from '../../lib/stores/copywritingContext';
import type { AdvancedStylePreset } from '../../hooks/useBatchImageGeneration';
import { ImageGenerationSlideOver } from './ImageGenerationSlideOver';
import { CopyExportModal } from './CopyExportModal';

// ============================================================================
// COPY FORMAT BUTTONS COMPONENT
// ============================================================================

interface CopyFormatButtonsProps {
  copyId: string;
  onCopy: (copyId: string, format: CopyFormat) => Promise<boolean>;
}

function CopyFormatButtons({ copyId, onCopy }: CopyFormatButtonsProps) {
  const [copiedFormat, setCopiedFormat] = useState<CopyFormat | null>(null);

  const handleCopy = async (format: CopyFormat) => {
    const success = await onCopy(copyId, format);
    if (success) {
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    }
  };

  const formats: { format: CopyFormat; label: string }[] = [
    { format: 'wordpress', label: 'WordPress' },
    { format: 'linkedin', label: 'LinkedIn' },
    { format: 'markdown', label: 'Markdown' },
    { format: 'raw', label: 'Plain' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '12px',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.4)',
          marginRight: '4px',
        }}
      >
        Copy as:
      </span>
      {formats.map(({ format, label }) => (
        <button
          key={format}
          onClick={() => handleCopy(format)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 500,
            color: copiedFormat === format ? '#10B981' : 'rgba(255, 255, 255, 0.6)',
            backgroundColor: copiedFormat === format
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(255, 255, 255, 0.04)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            if (copiedFormat !== format) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            }
          }}
          onMouseLeave={(e) => {
            if (copiedFormat !== format) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
            }
          }}
        >
          {copiedFormat === format ? <Check size={12} /> : <Copy size={12} />}
          {label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// SECTION ITEM COMPONENT
// ============================================================================

interface SectionItemProps {
  section: CopySection;
  isSelected: boolean;
  onToggle: () => void;
  onGenerateImage: () => void;
  getSectionTypeLabel: (type: CopySection['section_type']) => string;
  linkedImageUrl?: string;
}

function SectionItem({
  section,
  isSelected,
  onToggle,
  onGenerateImage,
  getSectionTypeLabel,
  linkedImageUrl,
}: SectionItemProps) {
  const [showConcept, setShowConcept] = useState(false);

  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
        borderRadius: '8px',
        transition: 'background-color 150ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Checkbox */}
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.3)',
            marginTop: '2px',
          }}
        >
          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Type label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              {getSectionTypeLabel(section.section_type)}
            </span>
            {section.image_id && (
              <span
                style={{
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <ImageIcon size={10} />
                linked
              </span>
            )}
          </div>

          {/* Section content */}
          <p
            style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: 0,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {section.content}
          </p>

          {/* Visual concept */}
          {section.suggested_visual_concept && (
            <div style={{ marginTop: '8px' }}>
              <button
                onClick={() => setShowConcept(!showConcept)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                <Sparkles size={11} />
                Visual concept
                {showConcept ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
              {showConcept && (
                <p
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    margin: '6px 0 0',
                    paddingLeft: '12px',
                    borderLeft: '2px solid rgba(255, 255, 255, 0.1)',
                    lineHeight: 1.5,
                  }}
                >
                  {section.suggested_visual_concept}
                </p>
              )}
            </div>
          )}

          {/* Generate button */}
          <div style={{ marginTop: '8px' }}>
            <button
              type="button"
              data-generate-btn="true"
              onClick={(e) => {
                e.stopPropagation();
                onGenerateImage();
              }}
              style={{
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              }}
            >
              <Wand2 size={11} />
              Generate
            </button>
          </div>
        </div>

        {/* Thumbnail */}
        {linkedImageUrl && (
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '6px',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img
              src={linkedImageUrl}
              alt="Section image"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COPY CARD COMPONENT
// ============================================================================

interface CopyCardProps {
  copy: CopyWithMedia;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAnalyzeSections: () => void;
  isAnalyzing: boolean;
  selectedSectionIds: Set<string>;
  onToggleSection: (sectionId: string) => void;
  onSelectAllSections: () => void;
  onGenerateForSection: (section: CopySection) => void;
  onCopyFormat: (copyId: string, format: CopyFormat) => Promise<boolean>;
  onExport: (copyId: string, title: string) => void;
  getSectionTypeLabel: (type: CopySection['section_type']) => string;
  mediaMode?: boolean;
  onSelectForMedia?: (copy: { id: string; title: string; content: string; platform: string }) => void;
  isSelectedForMedia?: boolean;
}

/**
 * Generate a descriptive title from the copy content.
 */
function generateCopyTitle(copy: CopyWithMedia): string {
  // First, try to find a headline section
  const headlineSection = copy.sections.find(s => s.section_type === 'headline');
  if (headlineSection?.content) {
    const headline = headlineSection.content.trim();
    return headline.length > 80 ? headline.slice(0, 77) + '...' : headline;
  }

  // Second, extract first meaningful line from copy_text
  if (copy.copy_text) {
    const lines = copy.copy_text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length > 0) {
      const firstLine = lines.find(l => !l.includes(':') || l.length > 50) || lines[0];
      const cleaned = firstLine
        .replace(/^#+\s*/, '')
        .replace(/\*+/g, '')
        .replace(/^\[.*?\]\s*/, '');

      return cleaned.length > 80 ? cleaned.slice(0, 77) + '...' : cleaned;
    }
  }

  return `${copy.content_type} - ${copy.platform}`;
}

function CopyCard({
  copy,
  isExpanded,
  onToggleExpand,
  onAnalyzeSections,
  isAnalyzing,
  selectedSectionIds,
  onToggleSection,
  onSelectAllSections,
  onGenerateForSection,
  onCopyFormat,
  onExport,
  getSectionTypeLabel,
  mediaMode = false,
  onSelectForMedia,
  isSelectedForMedia = false,
}: CopyCardProps) {
  const sectionCount = copy.sections.length;
  const imageCount = copy.images.length;
  const selectedCount = copy.sections.filter(s => selectedSectionIds.has(s.id)).length;
  const title = generateCopyTitle(copy);

  // Get image URL for a section
  const getLinkedImageUrl = (section: CopySection) => {
    if (!section.image_id) return undefined;
    const image = copy.images.find(img => img.id === section.image_id);
    if (!image) return undefined;
    if (image.local_path) {
      const filename = image.local_path.split('/').pop();
      return `/api/media/files/images/${filename}`;
    }
    return image.image_url || image.thumbnail_url;
  };

  return (
    <div
      style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Header - Clickable row */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '14px 0',
          cursor: 'pointer',
          transition: 'background-color 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {/* Icon */}
        <FileText size={16} style={{ color: 'rgba(255, 255, 255, 0.4)', flexShrink: 0, marginTop: '2px' }} />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title - full width, wraps if needed */}
          <div
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.4,
              marginBottom: '4px',
            }}
          >
            {title}
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.4)',
              textTransform: 'capitalize',
            }}>
              {copy.platform}
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.25)' }}>·</span>
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
              {new Date(copy.created_at).toLocaleDateString()}
            </span>
            {(sectionCount > 0 || imageCount > 0) && (
              <>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.25)' }}>·</span>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                  {sectionCount > 0 && `${sectionCount} sections`}
                  {sectionCount > 0 && imageCount > 0 && ', '}
                  {imageCount > 0 && `${imageCount} images`}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Media Mode: Select for Media Button */}
        {mediaMode && onSelectForMedia && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectForMedia({
                id: copy.id,
                title,
                content: copy.copy_text,
                platform: copy.platform,
              });
            }}
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              color: isSelectedForMedia ? '#1a1a1a' : 'rgba(59, 130, 246, 0.9)',
              backgroundColor: isSelectedForMedia ? 'rgba(59, 130, 246, 0.9)' : 'rgba(59, 130, 246, 0.1)',
              border: `1px solid ${isSelectedForMedia ? 'transparent' : 'rgba(59, 130, 246, 0.3)'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 150ms',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onMouseEnter={(e) => {
              if (!isSelectedForMedia) {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelectedForMedia) {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              }
            }}
          >
            {isSelectedForMedia ? (
              <>
                <Check size={12} />
                Selected
              </>
            ) : (
              <>
                <ImageIcon size={12} />
                Use for Images
              </>
            )}
          </button>
        )}

        {/* Chevron */}
        <div style={{ flexShrink: 0 }}>
          {isExpanded ? (
            <ChevronUp size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
          ) : (
            <ChevronDown size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ paddingBottom: '16px', paddingLeft: '28px' }}>
          {/* Preview text */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
              marginBottom: '12px',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                margin: 0,
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {copy.copy_text}
            </p>
          </div>

          {/* Copy Format Buttons */}
          <CopyFormatButtons copyId={copy.id} onCopy={onCopyFormat} />

          {/* Actions bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onAnalyzeSections}
                disabled={isAnalyzing}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isAnalyzing ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isAnalyzing) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                }}
              >
                {isAnalyzing ? (
                  <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                ) : sectionCount > 0 ? (
                  <RefreshCw size={12} />
                ) : (
                  <Sparkles size={12} />
                )}
                {isAnalyzing ? 'Analyzing...' : sectionCount > 0 ? 'Re-analyze' : 'Analyze'}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExport(copy.id, title);
                }}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                }}
              >
                <Download size={12} />
                Export
              </button>
            </div>

            {sectionCount > 0 && (
              <button
                onClick={onSelectAllSections}
                style={{
                  padding: '5px 10px',
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckSquare size={11} />
                Select all ({selectedCount}/{sectionCount})
              </button>
            )}
          </div>

          {/* Sections list */}
          {sectionCount > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {copy.sections.map((section) => (
                <SectionItem
                  key={section.id}
                  section={section}
                  isSelected={selectedSectionIds.has(section.id)}
                  onToggle={() => onToggleSection(section.id)}
                  onGenerateImage={() => onGenerateForSection(section)}
                  getSectionTypeLabel={getSectionTypeLabel}
                  linkedImageUrl={getLinkedImageUrl(section)}
                />
              ))}
            </div>
          )}

          {sectionCount === 0 && (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '12px',
              }}
            >
              No sections yet. Click Analyze to extract sections.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BATCH ACTIONS BAR COMPONENT
// ============================================================================

interface BatchActionsBarProps {
  selectedCount: number;
  onGenerateBatch: (style: AdvancedStylePreset) => void;
  onClearSelection: () => void;
  isGenerating: boolean;
}

function BatchActionsBar({
  selectedCount,
  onGenerateBatch,
  onClearSelection,
  isGenerating,
}: BatchActionsBarProps) {
  const [selectedStyle, setSelectedStyle] = useState<AdvancedStylePreset>('photoshoot-professional');

  const styleOptions: { value: AdvancedStylePreset; label: string }[] = [
    { value: 'photoshoot-professional', label: 'Professional Photo' },
    { value: 'cinematic-film', label: 'Cinematic' },
    { value: 'illustration-editorial', label: 'Editorial Illustration' },
    { value: 'anime-modern', label: 'Modern Anime' },
    { value: 'cartoon-pixar', label: 'Pixar Style' },
    { value: '3d-octane', label: '3D Render' },
    { value: 'cyberpunk-neon', label: 'Cyberpunk' },
    { value: 'watercolor-loose', label: 'Watercolor' },
  ];

  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgb(30, 32, 34)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        zIndex: 100,
      }}
    >
      <span style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>
        {selectedCount} selected
      </span>

      <select
        value={selectedStyle}
        onChange={(e) => setSelectedStyle(e.target.value as AdvancedStylePreset)}
        style={{
          padding: '8px 12px',
          fontSize: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        {styleOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        onClick={() => onGenerateBatch(selectedStyle)}
        disabled={isGenerating}
        style={{
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#1a1a1a',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: 'none',
          borderRadius: '6px',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: isGenerating ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isGenerating) e.currentTarget.style.backgroundColor = 'white';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        }}
      >
        {isGenerating ? (
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <Wand2 size={14} />
        )}
        Generate
      </button>

      <button
        onClick={onClearSelection}
        style={{
          padding: '6px',
          color: 'rgba(255, 255, 255, 0.5)',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CopyLibraryPanelProps {
  brandId: string | null;
  mediaMode?: boolean;
  onSelectForMedia?: (copy: { id: string; title: string; content: string; platform: string }) => void;
  selectedCopyId?: string;
}

export function CopyLibraryPanel({ brandId, mediaMode = false, onSelectForMedia, selectedCopyId }: CopyLibraryPanelProps) {
  const {
    copies,
    isLoading,
    error,
    selectedSectionIds,
    fetchCopiesWithMedia,
    toggleSection,
    selectAllSections,
    clearSelection,
    refreshCopy,
    copyToClipboard,
    getFormattedCopy,
  } = useCopyLibrary(brandId);

  const {
    isAnalyzing,
    analyzeCopy,
    getSectionTypeLabel,
  } = useSectionAnalyzer();

  const [expandedCopyIds, setExpandedCopyIds] = useState<Set<string>>(new Set());
  const [isGenerating, _setIsGenerating] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterContentType, setFilterContentType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Slide-over state for image generation
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<CopySection | null>(null);

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportCopyId, setExportCopyId] = useState<string | null>(null);
  const [exportCopyTitle, setExportCopyTitle] = useState<string>('');

  // Get unique platforms and content types for filters
  const platforms = Array.from(new Set(copies.map(c => c.platform))).filter(Boolean);
  const contentTypes = Array.from(new Set(copies.map(c => c.content_type))).filter(Boolean);

  // Filter copies based on search and filters
  const filteredCopies = copies.filter(copy => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesText = copy.copy_text.toLowerCase().includes(query);
      const matchesPlatform = copy.platform.toLowerCase().includes(query);
      const matchesType = copy.content_type.toLowerCase().includes(query);
      if (!matchesText && !matchesPlatform && !matchesType) return false;
    }
    if (filterPlatform !== 'all' && copy.platform !== filterPlatform) return false;
    if (filterContentType !== 'all' && copy.content_type !== filterContentType) return false;
    return true;
  });

  // Fetch copies when brand changes
  useEffect(() => {
    if (brandId) {
      fetchCopiesWithMedia();
    }
  }, [brandId, fetchCopiesWithMedia]);

  // Register refresh callback with CopywritingContext
  const { setOnCopyLibraryRefresh } = useCopywritingContext();
  useEffect(() => {
    setOnCopyLibraryRefresh(() => fetchCopiesWithMedia);
    return () => setOnCopyLibraryRefresh(null);
  }, [fetchCopiesWithMedia, setOnCopyLibraryRefresh]);

  const toggleCopyExpanded = (copyId: string) => {
    setExpandedCopyIds(prev => {
      const next = new Set(prev);
      if (next.has(copyId)) {
        next.delete(copyId);
      } else {
        next.add(copyId);
      }
      return next;
    });
  };

  const handleAnalyzeSections = async (copyId: string) => {
    await analyzeCopy(copyId);
    await refreshCopy(copyId);
    await fetchCopiesWithMedia();
  };

  const handleGenerateBatch = (_style: AdvancedStylePreset) => {
    for (const copy of copies) {
      for (const section of copy.sections) {
        if (selectedSectionIds.has(section.id)) {
          handleGenerateForSection(section);
          return;
        }
      }
    }
  };

  const handleGenerateForSection = (section: CopySection) => {
    setSelectedSection(section);
    setIsSlideOverOpen(true);
  };

  const handleExport = (copyId: string, title: string) => {
    setExportCopyId(copyId);
    setExportCopyTitle(title);
    setIsExportModalOpen(true);
  };

  if (!brandId) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
        Select a brand to view copy library
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        color: 'rgba(255, 255, 255, 0.4)',
      }}>
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '8px',
        color: '#EF4444',
        fontSize: '13px',
      }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'white', margin: 0 }}>
            Copy Library
          </h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '6px',
                color: showFilters ? 'white' : 'rgba(255, 255, 255, 0.4)',
                backgroundColor: showFilters ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              title="Toggle filters"
            >
              <Filter size={14} />
            </button>
            <button
              onClick={() => fetchCopiesWithMedia()}
              style={{
                padding: '6px',
                color: 'rgba(255, 255, 255, 0.4)',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: showFilters ? '10px' : '0' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.3)',
            }}
          />
          <input
            type="text"
            placeholder="Search copy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 32px',
              fontSize: '12px',
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              style={{
                flex: 1,
                minWidth: '100px',
                padding: '6px 8px',
                fontSize: '11px',
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                outline: 'none',
              }}
            >
              <option value="all">All Platforms</option>
              {platforms.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              value={filterContentType}
              onChange={(e) => setFilterContentType(e.target.value)}
              style={{
                flex: 1,
                minWidth: '100px',
                padding: '6px 8px',
                fontSize: '11px',
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                outline: 'none',
              }}
            >
              <option value="all">All Types</option>
              {contentTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}

        {/* Results count when filtered */}
        {(searchQuery || filterPlatform !== 'all' || filterContentType !== 'all') && (
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '8px' }}>
            {filteredCopies.length} of {copies.length} items
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {copies.length === 0 ? (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.4)',
          }}>
            <FileText size={28} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '13px' }}>No copy content yet.</p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.7 }}>
              Generate copy to see it here
            </p>
          </div>
        ) : (
          filteredCopies.map((copy) => (
            <CopyCard
              key={copy.id}
              copy={copy}
              isExpanded={expandedCopyIds.has(copy.id)}
              onToggleExpand={() => toggleCopyExpanded(copy.id)}
              onAnalyzeSections={() => handleAnalyzeSections(copy.id)}
              isAnalyzing={isAnalyzing}
              selectedSectionIds={selectedSectionIds}
              onToggleSection={toggleSection}
              onSelectAllSections={() => selectAllSections(copy.id)}
              onGenerateForSection={handleGenerateForSection}
              onCopyFormat={copyToClipboard}
              onExport={handleExport}
              getSectionTypeLabel={getSectionTypeLabel}
              mediaMode={mediaMode}
              onSelectForMedia={onSelectForMedia}
              isSelectedForMedia={selectedCopyId === copy.id}
            />
          ))
        )}
      </div>

      {/* Batch actions */}
      <BatchActionsBar
        selectedCount={selectedSectionIds.size}
        onGenerateBatch={handleGenerateBatch}
        onClearSelection={clearSelection}
        isGenerating={isGenerating}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Image Generation Slide-Over */}
      {brandId && (
        <ImageGenerationSlideOver
          isOpen={isSlideOverOpen}
          onClose={() => {
            setIsSlideOverOpen(false);
            setSelectedSection(null);
          }}
          section={selectedSection}
          brandId={brandId}
          onGenerationComplete={() => {
            fetchCopiesWithMedia();
          }}
        />
      )}

      {/* Copy Export Modal */}
      {exportCopyId && (
        <CopyExportModal
          isOpen={isExportModalOpen}
          onClose={() => {
            setIsExportModalOpen(false);
            setExportCopyId(null);
            setExportCopyTitle('');
          }}
          copyId={exportCopyId}
          copyTitle={exportCopyTitle}
          getFormattedCopy={getFormattedCopy}
        />
      )}
    </div>
  );
}

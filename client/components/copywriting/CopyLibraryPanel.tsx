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

  const formats: { format: CopyFormat; label: string; color: string }[] = [
    { format: 'wordpress', label: 'WordPress', color: '#21759B' },
    { format: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
    { format: 'markdown', label: 'Markdown', color: '#83CD29' },
    { format: 'raw', label: 'Plain', color: 'rgba(255, 255, 255, 0.6)' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        marginBottom: '12px',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.5)',
          marginRight: '4px',
        }}
      >
        Copy as:
      </span>
      {formats.map(({ format, label, color }) => (
        <button
          key={format}
          onClick={() => handleCopy(format)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 500,
            color: copiedFormat === format ? '#10B981' : color,
            backgroundColor:
              copiedFormat === format
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${
              copiedFormat === format
                ? 'rgba(16, 185, 129, 0.3)'
                : 'rgba(255, 255, 255, 0.1)'
            }`,
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            if (copiedFormat !== format) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (copiedFormat !== format) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
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
  getSectionTypeColor: (type: CopySection['section_type']) => string;
  linkedImageUrl?: string;
}

function SectionItem({
  section,
  isSelected,
  onToggle,
  onGenerateImage,
  getSectionTypeLabel,
  getSectionTypeColor,
  linkedImageUrl,
}: SectionItemProps) {
  const [showConcept, setShowConcept] = useState(false);

  return (
    <div
      style={{
        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
        border: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        padding: '12px',
        transition: 'all 150ms',
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
            color: isSelected ? '#3B82F6' : 'rgba(255, 255, 255, 0.5)',
            marginTop: '2px',
          }}
        >
          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Type badge and actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              className={getSectionTypeColor(section.section_type)}
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
              }}
            >
              {getSectionTypeLabel(section.section_type)}
            </span>
            {section.image_id && (
              <span
                style={{
                  fontSize: '10px',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ImageIcon size={10} />
                Linked
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
                  color: '#FFE66D',
                }}
              >
                <Sparkles size={12} />
                Visual concept
                {showConcept ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {showConcept && (
                <p
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    margin: '6px 0 0',
                    padding: '8px',
                    backgroundColor: 'rgba(255, 230, 109, 0.05)',
                    borderRadius: '6px',
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
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 500,
                color: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Wand2 size={12} />
              Generate Image
            </button>
          </div>
        </div>

        {/* Thumbnail */}
        {linkedImageUrl && (
          <div
            style={{
              width: '60px',
              height: '60px',
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
  getSectionTypeColor: (type: CopySection['section_type']) => string;
}

/**
 * Generate a descriptive title from the copy content.
 * Prefers headline section > first line of copy > content type fallback.
 */
function generateCopyTitle(copy: CopyWithMedia): string {
  // First, try to find a headline section
  const headlineSection = copy.sections.find(s => s.section_type === 'headline');
  if (headlineSection?.content) {
    const headline = headlineSection.content.trim();
    // Truncate if too long
    return headline.length > 60 ? headline.slice(0, 57) + '...' : headline;
  }

  // Second, extract first meaningful line from copy_text
  if (copy.copy_text) {
    const lines = copy.copy_text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length > 0) {
      // Skip lines that look like meta info (e.g., "Subject:", "Caption:")
      const firstLine = lines.find(l => !l.includes(':') || l.length > 50) || lines[0];
      // Clean up markdown
      const cleaned = firstLine
        .replace(/^#+\s*/, '') // Remove markdown headers
        .replace(/\*+/g, '') // Remove bold/italic markers
        .replace(/^\[.*?\]\s*/, ''); // Remove image references

      return cleaned.length > 60 ? cleaned.slice(0, 57) + '...' : cleaned;
    }
  }

  // Fallback to content type + platform
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
  getSectionTypeColor,
}: CopyCardProps) {
  const sectionCount = copy.sections.length;
  const imageCount = copy.images.length;
  const selectedCount = copy.sections.filter(s => selectedSectionIds.has(s.id)).length;

  // Get image URL for a section - prefer local path over temp URL
  const getLinkedImageUrl = (section: CopySection) => {
    if (!section.image_id) return undefined;
    const image = copy.images.find(img => img.id === section.image_id);
    if (!image) return undefined;

    // Prefer local file serving endpoint if local_path exists
    if (image.local_path) {
      const filename = image.local_path.split('/').pop();
      return `/api/media/files/images/${filename}`;
    }
    return image.image_url || image.thumbnail_url;
  };

  return (
    <div
      style={{
        backgroundColor: 'rgb(38, 40, 42)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
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
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          transition: 'background-color 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <FileText size={18} style={{ color: 'rgba(255, 255, 255, 0.6)', flexShrink: 0 }} />
          <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'white',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={generateCopyTitle(copy)}
            >
              {generateCopyTitle(copy)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: '#60A5FA',
                  textTransform: 'capitalize',
                }}
              >
                {copy.content_type}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  textTransform: 'capitalize',
                }}
              >
                {copy.platform}
              </span>
              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>
                {new Date(copy.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Stats badges */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                color: '#8B5CF6',
              }}
            >
              {sectionCount} sections
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
              }}
            >
              {imageCount} images
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Export Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExport(copy.id, generateCopyTitle(copy));
              }}
              style={{
                padding: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Export copy"
            >
              <Download size={14} style={{ color: '#3B82F6' }} />
            </button>
            {isExpanded ? (
              <ChevronUp size={18} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
            ) : (
              <ChevronDown size={18} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ padding: '0 16px 16px' }}>
          {/* Preview */}
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
            <button
              onClick={onAnalyzeSections}
              disabled={isAnalyzing}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#FFE66D',
                backgroundColor: 'rgba(255, 230, 109, 0.1)',
                border: '1px solid rgba(255, 230, 109, 0.2)',
                borderRadius: '6px',
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isAnalyzing ? 0.6 : 1,
              }}
            >
              {isAnalyzing ? (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              ) : sectionCount > 0 ? (
                <RefreshCw size={14} />
              ) : (
                <Sparkles size={14} />
              )}
              {isAnalyzing ? 'Analyzing...' : sectionCount > 0 ? 'Re-analyze' : 'Analyze Sections'}
            </button>

            {sectionCount > 0 && (
              <button
                onClick={onSelectAllSections}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckSquare size={12} />
                Select all ({selectedCount}/{sectionCount})
              </button>
            )}
          </div>

          {/* Sections list */}
          {sectionCount > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {copy.sections.map((section) => (
                <SectionItem
                  key={section.id}
                  section={section}
                  isSelected={selectedSectionIds.has(section.id)}
                  onToggle={() => onToggleSection(section.id)}
                  onGenerateImage={() => onGenerateForSection(section)}
                  getSectionTypeLabel={getSectionTypeLabel}
                  getSectionTypeColor={getSectionTypeColor}
                  linkedImageUrl={getLinkedImageUrl(section)}
                />
              ))}
            </div>
          )}

          {sectionCount === 0 && (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '13px',
              }}
            >
              No sections yet. Click Analyze Sections to extract sections with visual concepts.
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
        border: '1px solid rgba(255, 255, 255, 0.15)',
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
        {selectedCount} section{selectedCount > 1 ? 's' : ''} selected
      </span>

      <select
        value={selectedStyle}
        onChange={(e) => setSelectedStyle(e.target.value as AdvancedStylePreset)}
        style={{
          padding: '8px 12px',
          fontSize: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
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
          padding: '10px 20px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#1a1a1a',
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          border: 'none',
          borderRadius: '8px',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: isGenerating ? 0.7 : 1,
        }}
      >
        {isGenerating ? (
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <Wand2 size={14} />
        )}
        Generate Images
      </button>

      <button
        onClick={onClearSelection}
        style={{
          padding: '8px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Clear
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CopyLibraryPanelProps {
  brandId: string | null;
}

export function CopyLibraryPanel({ brandId }: CopyLibraryPanelProps) {
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
    getSectionTypeColor,
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
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesText = copy.copy_text.toLowerCase().includes(query);
      const matchesPlatform = copy.platform.toLowerCase().includes(query);
      const matchesType = copy.content_type.toLowerCase().includes(query);
      if (!matchesText && !matchesPlatform && !matchesType) return false;
    }
    // Platform filter
    if (filterPlatform !== 'all' && copy.platform !== filterPlatform) return false;
    // Content type filter
    if (filterContentType !== 'all' && copy.content_type !== filterContentType) return false;
    return true;
  });

  // Fetch copies when brand changes
  useEffect(() => {
    if (brandId) {
      fetchCopiesWithMedia();
    }
  }, [brandId, fetchCopiesWithMedia]);

  // Register refresh callback with CopywritingContext for SaveToCopyLibrary
  const { setOnCopyLibraryRefresh } = useCopywritingContext();
  useEffect(() => {
    setOnCopyLibraryRefresh(() => fetchCopiesWithMedia);
    return () => setOnCopyLibraryRefresh(null);
  }, [fetchCopiesWithMedia, setOnCopyLibraryRefresh]);

  // Toggle copy expansion
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

  // Handle section analysis
  const handleAnalyzeSections = async (copyId: string) => {
    await analyzeCopy(copyId);
    // Refresh the copy data after analysis
    await refreshCopy(copyId);
    await fetchCopiesWithMedia();
  };

  // Handle batch generation - opens slide-over for first selected section
  const handleGenerateBatch = (_style: AdvancedStylePreset) => {
    // Find the first selected section and open the slide-over
    for (const copy of copies) {
      for (const section of copy.sections) {
        if (selectedSectionIds.has(section.id)) {
          handleGenerateForSection(section);
          return;
        }
      }
    }
  };

  // Handle single section generation - opens the slide-over
  const handleGenerateForSection = (section: CopySection) => {
    setSelectedSection(section);
    setIsSlideOverOpen(true);
  };

  // Handle export - opens the export modal
  const handleExport = (copyId: string, title: string) => {
    setExportCopyId(copyId);
    setExportCopyTitle(title);
    setIsExportModalOpen(true);
  };

  if (!brandId) {
    return (
      <div
        style={{
          padding: '32px',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        Select a brand to view copy library
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          color: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
        Loading copy library...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          color: '#EF4444',
          fontSize: '13px',
        }}
      >
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'white', margin: 0 }}>
            Copy Library
          </h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '6px',
                color: showFilters ? '#3B82F6' : 'rgba(255, 255, 255, 0.5)',
                backgroundColor: showFilters ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: showFilters ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
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
                color: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          />
          <input
            type="text"
            placeholder="Search copy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 32px 8px 32px',
              fontSize: '12px',
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
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
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '10px',
              flexWrap: 'wrap',
            }}
          >
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              style={{
                flex: 1,
                minWidth: '100px',
                padding: '6px 8px',
                fontSize: '11px',
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
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
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
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

        {/* Results count */}
        {(searchQuery || filterPlatform !== 'all' || filterContentType !== 'all') && (
          <div
            style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '8px',
            }}
          >
            {filteredCopies.length} of {copies.length} items
          </div>
        )}
      </div>

      {/* Copies list */}
      {copies.length === 0 ? (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
          }}
        >
          <FileText size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p style={{ margin: 0 }}>No copy content yet.</p>
          <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
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
            getSectionTypeColor={getSectionTypeColor}
          />
        ))
      )}

      {/* Batch actions bar */}
      <BatchActionsBar
        selectedCount={selectedSectionIds.size}
        onGenerateBatch={handleGenerateBatch}
        onClearSelection={clearSelection}
        isGenerating={isGenerating}
      />

      {/* Keyframes */}
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

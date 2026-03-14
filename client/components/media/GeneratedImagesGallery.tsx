/**
 * Generated Images Gallery
 *
 * Displays generated images inline in chat with selection for logo application.
 * Shows loading states, completed images, and allows selection/download.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Check,
  Download,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
  X,
  Stamp,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface GeneratedImage {
  id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  localPath?: string;
  errorMessage?: string;
  aspectRatio?: string;
}

interface GeneratedImagesGalleryProps {
  images: GeneratedImage[];
  brandId?: string;
  onRegenerate?: (imageId: string) => void;
  onApplyLogo?: (imageIds: string[]) => void;
  isRegenerating?: boolean;
  isApplyingLogo?: boolean;
}

// ============================================================================
// IMAGE CARD COMPONENT
// ============================================================================

interface ImageCardProps {
  image: GeneratedImage;
  isSelected: boolean;
  onSelect: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

function ImageCard({
  image,
  isSelected,
  onSelect,
  onRegenerate,
  isRegenerating,
}: ImageCardProps) {
  const [isHovering, setIsHovering] = useState(false);

  // Get display URL (prefer local path for faster loading)
  const getImageUrl = () => {
    if (image.localPath) {
      const filename = image.localPath.split('/').pop();
      return `/api/media/files/images/${filename}`;
    }
    return image.imageUrl;
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getImageUrl();
    if (!url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `generated-image-${image.id.slice(0, 8)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div
      onClick={image.status === 'completed' ? onSelect : undefined}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        border: isSelected
          ? '2px solid rgba(59, 130, 246, 0.8)'
          : '2px solid transparent',
        cursor: image.status === 'completed' ? 'pointer' : 'default',
        transition: 'all 150ms',
        aspectRatio: image.aspectRatio === '16:9' ? '16/9' : image.aspectRatio === '9:16' ? '9/16' : '1',
      }}
    >
      {/* Loading State */}
      {(image.status === 'pending' || image.status === 'processing') && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '150px',
            gap: '8px',
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '12px' }}>
            {image.status === 'pending' ? 'Queued...' : 'Generating...'}
          </span>
        </div>
      )}

      {/* Error State */}
      {image.status === 'failed' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '150px',
            gap: '8px',
            padding: '16px',
          }}
        >
          <AlertCircle size={24} style={{ color: 'rgba(239, 68, 68, 0.8)' }} />
          <span style={{ fontSize: '12px', color: 'rgba(239, 68, 68, 0.8)', textAlign: 'center' }}>
            {image.errorMessage || 'Generation failed'}
          </span>
          {onRegenerate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRegenerate();
              }}
              disabled={isRegenerating}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '4px',
                cursor: isRegenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={12} />
              Retry
            </button>
          )}
        </div>
      )}

      {/* Completed Image */}
      {image.status === 'completed' && getImageUrl() && (
        <>
          <img
            src={getImageUrl()}
            alt={image.prompt.slice(0, 50) + '...'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Selection checkbox */}
          {isSelected && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={14} style={{ color: 'white' }} />
            </div>
          )}

          {/* Hover overlay with actions */}
          {isHovering && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <button
                onClick={handleDownload}
                style={{
                  padding: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'white',
                }}
                title="Download"
              >
                <Download size={18} />
              </button>
              {onRegenerate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegenerate();
                  }}
                  disabled={isRegenerating}
                  style={{
                    padding: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isRegenerating ? 'not-allowed' : 'pointer',
                    color: 'white',
                  }}
                  title="Regenerate"
                >
                  <RefreshCw size={18} />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GeneratedImagesGallery({
  images,
  brandId,
  onRegenerate,
  onApplyLogo,
  isRegenerating,
  isApplyingLogo,
}: GeneratedImagesGalleryProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset selection when images change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [images.length]);

  const toggleSelection = useCallback((imageId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const completedIds = images
      .filter((img) => img.status === 'completed')
      .map((img) => img.id);
    setSelectedIds(new Set(completedIds));
  }, [images]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleApplyLogo = () => {
    if (onApplyLogo && selectedIds.size > 0) {
      onApplyLogo(Array.from(selectedIds));
    }
  };

  const completedCount = images.filter((img) => img.status === 'completed').length;
  const selectedCount = selectedIds.size;

  if (images.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImageIcon size={16} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.8)' }}>
            Generated Images ({completedCount}/{images.length})
          </span>
        </div>

        {completedCount > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={selectedCount === completedCount ? clearSelection : selectAll}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.6)',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {selectedCount === completedCount ? 'Deselect all' : 'Select all'}
            </button>
          </div>
        )}
      </div>

      {/* Image Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            isSelected={selectedIds.has(image.id)}
            onSelect={() => toggleSelection(image.id)}
            onRegenerate={onRegenerate ? () => onRegenerate(image.id) : undefined}
            isRegenerating={isRegenerating}
          />
        ))}
      </div>

      {/* Selection Actions Bar */}
      {selectedCount > 0 && onApplyLogo && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
            {selectedCount} image{selectedCount > 1 ? 's' : ''} selected
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={clearSelection}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <X size={14} />
              Cancel
            </button>

            <button
              onClick={handleApplyLogo}
              disabled={isApplyingLogo}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#1a1a1a',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '6px',
                cursor: isApplyingLogo ? 'not-allowed' : 'pointer',
                opacity: isApplyingLogo ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isApplyingLogo ? (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Stamp size={14} />
              )}
              Apply Logo
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

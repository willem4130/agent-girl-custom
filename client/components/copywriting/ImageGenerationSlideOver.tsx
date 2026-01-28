/**
 * Image Generation Slide-Over
 *
 * Slide-over panel for generating images from copy sections.
 * Shows source context, visual concept, style selector, and generation options.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Wand2,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useBatchImageGeneration, type AdvancedStylePreset, type ImageProvider } from '../../hooks/useBatchImageGeneration';
import type { CopySection } from '../../hooks/useCopyLibrary';

// ============================================================================
// TYPES
// ============================================================================

interface ImageGenerationSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  section: CopySection | null;
  copyText?: string;
  brandId: string;
  onGenerationComplete?: (imageId: string) => void;
}

// ============================================================================
// STYLE SELECTOR COMPONENT
// ============================================================================

interface StyleSelectorProps {
  selectedStyle: AdvancedStylePreset;
  onSelectStyle: (style: AdvancedStylePreset) => void;
}

interface StyleOption {
  value: AdvancedStylePreset;
  label: string;
  description: string;
}

interface StyleGroup {
  category: string;
  styles: StyleOption[];
}

function StyleSelector({ selectedStyle, onSelectStyle }: StyleSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const styleGroups: StyleGroup[] = [
    {
      category: 'Photography',
      styles: [
        { value: 'photoshoot-professional', label: 'Professional Photoshoot', description: 'High-end commercial photography' },
        { value: 'cinematic-film', label: 'Film Photography', description: 'Film stock with natural grain' },
        { value: 'cinematic-noir', label: 'Film Noir', description: 'Dark, moody cinematography' },
      ],
    },
    {
      category: 'Illustration',
      styles: [
        { value: 'illustration-editorial', label: 'Editorial', description: 'Magazine-quality illustrations' },
        { value: 'illustration-concept', label: 'Concept Art', description: 'Detailed concept art' },
        { value: 'watercolor-loose', label: 'Watercolor', description: 'Expressive watercolor style' },
      ],
    },
    {
      category: 'Animation',
      styles: [
        { value: 'anime-modern', label: 'Modern Anime', description: 'Clean modern anime style' },
        { value: 'anime-ghibli', label: 'Studio Ghibli', description: 'Ghibli-inspired aesthetic' },
        { value: 'cartoon-pixar', label: 'Pixar 3D', description: 'Pixar-style 3D animation' },
        { value: 'cartoon-disney', label: 'Disney', description: 'Classic Disney animation' },
      ],
    },
    {
      category: '3D & Digital',
      styles: [
        { value: '3d-octane', label: 'Octane Render', description: 'Photorealistic 3D' },
        { value: '3d-unreal', label: 'Unreal Engine', description: 'Real-time ray tracing' },
        { value: 'cyberpunk-neon', label: 'Neon Cyberpunk', description: 'Vibrant neon aesthetic' },
        { value: 'cyberpunk-gritty', label: 'Gritty Cyberpunk', description: 'Dark dystopian style' },
      ],
    },
    {
      category: 'Pixel Art',
      styles: [
        { value: 'pixel-art-retro', label: 'Retro', description: '16-bit retro gaming' },
        { value: 'pixel-art-modern', label: 'Modern', description: 'Contemporary pixel art' },
      ],
    },
  ];

  const selectedLabel = styleGroups
    .flatMap(g => g.styles)
    .find(s => s.value === selectedStyle)?.label || selectedStyle;

  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px',
        }}
      >
        Visual Style
      </label>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: 'white',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 500 }}>{selectedLabel}</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded && (
        <div
          style={{
            marginTop: '8px',
            maxHeight: '300px',
            overflowY: 'auto',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
          }}
        >
          {styleGroups.map((group) => (
            <div key={group.category}>
              <div
                style={{
                  padding: '8px 12px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {group.category}
              </div>
              {group.styles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => {
                    onSelectStyle(style.value);
                    setIsExpanded(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: selectedStyle === style.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', color: 'white', fontWeight: 500 }}>
                      {style.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      {style.description}
                    </div>
                  </div>
                  {selectedStyle === style.value && (
                    <Check size={16} style={{ color: '#3B82F6' }} />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ImageGenerationSlideOver({
  isOpen,
  onClose,
  section,
  copyText: _copyText,
  brandId: _brandId,
  onGenerationComplete,
}: ImageGenerationSlideOverProps) {
  const { generateFromSection, pollImageStatus, isGenerating, error } = useBatchImageGeneration();

  const [selectedStyle, setSelectedStyle] = useState<AdvancedStylePreset>('photoshoot-professional');
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [provider, setProvider] = useState<ImageProvider>('seedream');
  const [useAntiAi, setUseAntiAi] = useState(true);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'completed' | 'failed'>('idle');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);

  // Reset state when section changes
  useEffect(() => {
    if (section) {
      setCustomPrompt(section.suggested_visual_concept || '');
      setUseCustomPrompt(false);
      setGenerationStatus('idle');
      setGeneratedImageUrl(null);
      setCurrentImageId(null);
    }
  }, [section?.id]);

  // Poll for image status
  useEffect(() => {
    if (currentImageId && generationStatus === 'generating') {
      const interval = setInterval(async () => {
        const status = await pollImageStatus(currentImageId);
        if (status) {
          if (status.status === 'completed' && status.imageUrl) {
            setGenerationStatus('completed');
            setGeneratedImageUrl(status.imageUrl);
            if (onGenerationComplete) {
              onGenerationComplete(currentImageId);
            }
          } else if (status.status === 'failed') {
            setGenerationStatus('failed');
          }
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [currentImageId, generationStatus, pollImageStatus, onGenerationComplete]);

  const handleGenerate = async () => {
    if (!section) return;

    setGenerationStatus('generating');
    setGeneratedImageUrl(null);

    const result = await generateFromSection(section.id, {
      advancedStylePreset: selectedStyle,
      prompt: useCustomPrompt ? customPrompt : undefined,
      provider,
      aspectRatio,
      useAntiAi,
    });

    if (result) {
      setCurrentImageId(result.imageId);
    } else {
      setGenerationStatus('failed');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 200,
        }}
      />

      {/* Slide-over panel */}
      <div
        data-slide-over="true"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '480px',
          maxWidth: '100vw',
          backgroundColor: 'rgb(30, 32, 34)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.3)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ImageIcon size={20} style={{ color: '#3B82F6' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'white', margin: 0 }}>
              Generate Image
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {!section ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255, 255, 255, 0.5)' }}>
              No section selected
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Source context */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '8px',
                  }}
                >
                  Section Content
                </label>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    lineHeight: 1.6,
                    maxHeight: '120px',
                    overflow: 'auto',
                  }}
                >
                  {section.content}
                </div>
              </div>

              {/* Visual concept preview */}
              {section.suggested_visual_concept && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Sparkles size={12} style={{ color: '#FFE66D' }} />
                    <label
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.7)',
                      }}
                    >
                      AI-Suggested Visual Concept
                    </label>
                  </div>
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'rgba(255, 230, 109, 0.05)',
                      border: '1px solid rgba(255, 230, 109, 0.15)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      lineHeight: 1.6,
                    }}
                  >
                    {section.suggested_visual_concept}
                  </div>
                </div>
              )}

              {/* Style selector */}
              <StyleSelector
                selectedStyle={selectedStyle}
                onSelectStyle={setSelectedStyle}
              />

              {/* Custom prompt toggle and editor */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    id="useCustomPrompt"
                    checked={useCustomPrompt}
                    onChange={(e) => setUseCustomPrompt(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label
                    htmlFor="useCustomPrompt"
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                    }}
                  >
                    Use custom prompt
                  </label>
                </div>
                {useCustomPrompt && (
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Describe the image you want..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '13px',
                      minHeight: '100px',
                      resize: 'vertical',
                    }}
                  />
                )}
              </div>

              {/* Settings row */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Aspect ratio */}
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '6px',
                    }}
                  >
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="1:1">1:1 (Square)</option>
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                    <option value="4:3">4:3 (Standard)</option>
                  </select>
                </div>

                {/* Provider */}
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '6px',
                    }}
                  >
                    Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as ImageProvider)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="seedream">Seedream 4.5</option>
                    <option value="nano-banana">Nano Banana</option>
                    <option value="nano-banana-pro">Nano Banana Pro</option>
                  </select>
                </div>
              </div>

              {/* Anti-AI toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="useAntiAi"
                  checked={useAntiAi}
                  onChange={(e) => setUseAntiAi(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label
                  htmlFor="useAntiAi"
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                  }}
                >
                  Apply anti-AI detection techniques (recommended)
                </label>
              </div>

              {/* Result preview */}
              {generationStatus !== 'idle' && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '8px',
                    }}
                  >
                    Result
                  </label>
                  <div
                    style={{
                      aspectRatio: aspectRatio.replace(':', '/'),
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {generationStatus === 'generating' && (
                      <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                        <div style={{ fontSize: '13px' }}>Generating image...</div>
                      </div>
                    )}
                    {generationStatus === 'completed' && generatedImageUrl && (
                      <img
                        src={generatedImageUrl}
                        alt="Generated"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                    {generationStatus === 'failed' && (
                      <div style={{ textAlign: 'center', color: '#EF4444' }}>
                        <AlertCircle size={32} style={{ marginBottom: '8px' }} />
                        <div style={{ fontSize: '13px' }}>Generation failed</div>
                        {error && <div style={{ fontSize: '11px', marginTop: '4px' }}>{error}</div>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.8)',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
          <button
            onClick={handleGenerate}
            disabled={!section || isGenerating || generationStatus === 'generating'}
            style={{
              padding: '10px 24px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1a1a1a',
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              border: 'none',
              borderRadius: '8px',
              cursor: !section || isGenerating || generationStatus === 'generating' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: !section || isGenerating || generationStatus === 'generating' ? 0.6 : 1,
            }}
          >
            {isGenerating || generationStatus === 'generating' ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Wand2 size={14} />
            )}
            {generationStatus === 'completed' ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

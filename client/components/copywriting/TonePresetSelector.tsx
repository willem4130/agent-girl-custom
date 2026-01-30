/**
 * Tone Preset Selector
 *
 * Horizontal pill selector for choosing tone presets within a brand.
 * Displays available presets and allows quick tone switching.
 */

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Briefcase,
  Coffee,
  Lightbulb,
  Heart,
  Shield,
  Loader2,
  AlertCircle,
  Wand2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useCopywritingContext } from '../../lib/stores/copywritingContext';

interface ToneAdjustments {
  formality?: number | string;
  authority?: number | string;
  warmth?: number | string;
  humor?: number | string;
  energy?: number | string;
  avoidPhrases?: string[];
  preferPhrases?: string[];
}

interface BrandTonePreset {
  id: string;
  brand_id: string;
  name: string;
  description?: string;
  tone_adjustments: ToneAdjustments;
  use_cases: string[];
  example_phrases: string[];
  is_default: number;
  created_at: string;
}

// Map preset names to icons
const PRESET_ICONS: Record<string, React.ElementType> = {
  'Formal Announcement': Briefcase,
  'Casual Update': Coffee,
  'Thought Leadership': Lightbulb,
  'Community Engagement': Heart,
  'Crisis Communication': Shield,
};

// Get appropriate icon for preset
function getPresetIcon(name: string): React.ElementType {
  return PRESET_ICONS[name] || Volume2;
}

// Get color based on tone adjustments
function getPresetColor(adjustments: ToneAdjustments): string {
  const formality = parseAdjustment(adjustments.formality);
  const warmth = parseAdjustment(adjustments.warmth);

  if (formality > 15) return '#8B5CF6'; // Purple for formal
  if (warmth > 15) return '#10B981'; // Green for warm
  if (parseAdjustment(adjustments.energy) > 15) return '#F59E0B'; // Yellow for energetic
  if (parseAdjustment(adjustments.authority) > 15) return '#3B82F6'; // Blue for authoritative
  return '#6B7280'; // Gray default
}

function parseAdjustment(value: number | string | undefined): number {
  if (value === undefined) return 0;
  if (typeof value === 'number') return value;
  return parseInt(value.replace(/[^-\d]/g, ''), 10) || 0;
}

interface TonePresetSelectorProps {
  onSelect?: (presetId: string | null) => void;
  compact?: boolean;
  showAutoGenerate?: boolean;
}

export function TonePresetSelector({
  onSelect,
  compact = false,
  showAutoGenerate = true,
}: TonePresetSelectorProps) {
  const { brandId, tonePresetId, setTonePresetId } = useCopywritingContext();
  const [presets, setPresets] = useState<BrandTonePreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch presets when brand changes
  useEffect(() => {
    if (!brandId) {
      setPresets([]);
      return;
    }

    const fetchPresets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/copywriting/brands/${brandId}/tone-presets`);
        if (!response.ok) {
          throw new Error('Failed to fetch tone presets');
        }
        const data = await response.json();
        setPresets(data.presets || []);

        // Auto-select default preset if none selected
        if (!tonePresetId && data.presets?.length > 0) {
          const defaultPreset = data.presets.find((p: BrandTonePreset) => p.is_default === 1);
          if (defaultPreset) {
            setTonePresetId(defaultPreset.id);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresets();
  }, [brandId, tonePresetId, setTonePresetId]);

  const handleSelect = (id: string | null) => {
    setTonePresetId(id);
    onSelect?.(id);
  };

  const handleAutoGenerate = async () => {
    if (!brandId) return;

    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/copywriting/brands/${brandId}/tone-presets/auto-generate`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate presets');
      }

      const data = await response.json();
      setPresets(data.presets || []);

      // Select the default preset
      const defaultPreset = data.presets?.find((p: BrandTonePreset) => p.is_default === 1);
      if (defaultPreset) {
        setTonePresetId(defaultPreset.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedPreset = presets.find((p) => p.id === tonePresetId);

  // Don't render if no brand selected
  if (!brandId) {
    return null;
  }

  if (compact) {
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
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 style={{ width: 16, height: 16, color: 'rgba(255, 255, 255, 0.7)' }} />
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>Tone</span>
            {selectedPreset && (
              <span
                style={{
                  fontSize: '12px',
                  color: getPresetColor(selectedPreset.tone_adjustments),
                  backgroundColor: `${getPresetColor(selectedPreset.tone_adjustments)}20`,
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {selectedPreset.name}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp style={{ width: 16, height: 16, color: 'rgba(255, 255, 255, 0.5)' }} />
          ) : (
            <ChevronDown style={{ width: 16, height: 16, color: 'rgba(255, 255, 255, 0.5)' }} />
          )}
        </button>

        {isExpanded && (
          <div style={{ padding: '0 12px 12px' }}>
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                Loading...
              </div>
            ) : presets.length === 0 ? (
              showAutoGenerate ? (
                <button
                  onClick={handleAutoGenerate}
                  disabled={isGenerating}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'transparent',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '12px',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {isGenerating ? (
                    <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Wand2 style={{ width: 14, height: 14 }} />
                  )}
                  Generate Tone Presets
                </button>
              ) : (
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                  No tone presets
                </div>
              )
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  onClick={() => handleSelect(null)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${!tonePresetId ? '#FF6B6B' : 'rgba(255, 255, 255, 0.15)'}`,
                    backgroundColor: !tonePresetId ? 'rgba(255, 107, 107, 0.15)' : 'transparent',
                    color: !tonePresetId ? '#FF6B6B' : 'rgba(255, 255, 255, 0.7)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Default
                </button>
                {presets.map((preset) => {
                  const color = getPresetColor(preset.tone_adjustments);
                  const isSelected = tonePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelect(preset.id)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${isSelected ? color : 'rgba(255, 255, 255, 0.15)'}`,
                        backgroundColor: isSelected ? `${color}20` : 'transparent',
                        color: isSelected ? color : 'rgba(255, 255, 255, 0.7)',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            )}
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

  // Full view
  return (
    <div
      style={{
        backgroundColor: 'rgb(38, 40, 42)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Volume2 style={{ width: 18, height: 18, color: '#FFE66D' }} />
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>Tone Presets</span>
        </div>
        {showAutoGenerate && presets.length === 0 && (
          <button
            onClick={handleAutoGenerate}
            disabled={isGenerating}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
              color: '#1a1a1a',
              fontSize: '12px',
              fontWeight: 600,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isGenerating ? (
              <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
            ) : (
              <Wand2 style={{ width: 14, height: 14 }} />
            )}
            Auto-Generate
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '6px',
            color: '#EF4444',
            fontSize: '12px',
            marginBottom: '12px',
          }}
        >
          <AlertCircle style={{ width: 14, height: 14 }} />
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
          <span style={{ marginLeft: '8px', fontSize: '13px' }}>Loading presets...</span>
        </div>
      ) : presets.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '20px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '13px',
          }}
        >
          No tone presets yet.
          {showAutoGenerate && ' Click "Auto-Generate" to create defaults.'}
        </div>
      ) : (
        <>
          {/* Preset Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {/* Default option */}
            <button
              onClick={() => handleSelect(null)}
              style={{
                padding: '8px 14px',
                borderRadius: '20px',
                border: `2px solid ${!tonePresetId ? '#FF6B6B' : 'rgba(255, 255, 255, 0.15)'}`,
                backgroundColor: !tonePresetId ? 'rgba(255, 107, 107, 0.15)' : 'transparent',
                color: !tonePresetId ? '#FF6B6B' : 'rgba(255, 255, 255, 0.7)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              Brand Default
            </button>

            {presets.map((preset) => {
              const Icon = getPresetIcon(preset.name);
              const color = getPresetColor(preset.tone_adjustments);
              const isSelected = tonePresetId === preset.id;

              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelect(preset.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    border: `2px solid ${isSelected ? color : 'rgba(255, 255, 255, 0.15)'}`,
                    backgroundColor: isSelected ? `${color}20` : 'transparent',
                    color: isSelected ? color : 'rgba(255, 255, 255, 0.7)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 150ms',
                  }}
                  title={preset.description}
                >
                  <Icon style={{ width: 14, height: 14 }} />
                  {preset.name}
                  {preset.is_default === 1 && (
                    <span
                      style={{
                        fontSize: '10px',
                        opacity: 0.7,
                        marginLeft: '2px',
                      }}
                    >
                      ★
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Preset Details */}
          {selectedPreset && (
            <div
              style={{
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>
                {selectedPreset.description}
              </div>

              {/* Tone Adjustments */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                {Object.entries(selectedPreset.tone_adjustments)
                  .filter(([key]) => !['avoidPhrases', 'preferPhrases'].includes(key))
                  .map(([key, value]) => {
                    const numValue = parseAdjustment(value);
                    const isPositive = numValue > 0;
                    const color = isPositive ? '#10B981' : numValue < 0 ? '#EF4444' : '#6B7280';
                    return (
                      <span
                        key={key}
                        style={{
                          fontSize: '11px',
                          color: color,
                          backgroundColor: `${color}15`,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          textTransform: 'capitalize',
                        }}
                      >
                        {key}: {isPositive ? '+' : ''}{numValue}
                      </span>
                    );
                  })}
              </div>

              {/* Use Cases */}
              {selectedPreset.use_cases.length > 0 && (
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                  Use for: {selectedPreset.use_cases.join(', ')}
                </div>
              )}
            </div>
          )}
        </>
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

/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React, { useState, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Loader2, Globe, Instagram, Facebook, Linkedin, Sparkles, Upload, Image as ImageIcon, X, Check } from 'lucide-react';
import type { VoiceProfile, ScrapedContent, VoiceAnalysis } from '../../hooks/useBrandAPI';

interface BrandVoicePanelProps {
  voiceProfile: VoiceProfile | null;
  voiceAnalysis?: VoiceAnalysis | null;
  scrapedContent: ScrapedContent[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  onDeepAnalyze?: () => Promise<void>;
  brandId?: string;
  logoUrl?: string;
  onLogoUploaded?: (logoUrl: string) => void;
}

// Interprets a 0-100 score and returns a human-readable description
function getToneLabel(dimension: string, value: number): string {
  const labels: Record<string, [string, string, string]> = {
    formality: ['Very casual', 'Balanced', 'Highly formal'],
    humor: ['Serious tone', 'Occasional wit', 'Playful & fun'],
    energy: ['Calm & measured', 'Moderate pace', 'High energy'],
    authority: ['Peer-level', 'Confident', 'Expert authority'],
  };
  const [low, mid, high] = labels[dimension] || ['Low', 'Medium', 'High'];
  if (value < 35) return low;
  if (value < 65) return mid;
  return high;
}

function ToneSlider({ dimension, value, lowLabel, highLabel }: {
  dimension: string;
  value: number;
  lowLabel: string;
  highLabel: string;
}) {
  const label = getToneLabel(dimension, value);

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '6px'
      }}>
        <span style={{
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: 500,
        }}>
          {dimension.charAt(0).toUpperCase() + dimension.slice(1)}
        </span>
        <span style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
        }}>
          {label}
        </span>
      </div>
      <div style={{ position: 'relative' }}>
        {/* Track */}
        <div style={{
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
        }} />
        {/* Fill */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '4px',
          width: `${value}%`,
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
          borderRadius: '2px',
          transition: 'width 300ms ease-out',
        }} />
        {/* Thumb marker */}
        <div style={{
          position: 'absolute',
          top: '-3px',
          left: `${value}%`,
          transform: 'translateX(-50%)',
          width: '10px',
          height: '10px',
          backgroundColor: 'white',
          borderRadius: '50%',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '4px',
        fontSize: '10px',
        color: 'rgba(255, 255, 255, 0.35)',
      }}>
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '4px 0',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {title}
        </span>
        {isOpen ? (
          <ChevronUp style={{ width: 14, height: 14, color: 'rgba(255, 255, 255, 0.4)' }} />
        ) : (
          <ChevronDown style={{ width: 14, height: 14, color: 'rgba(255, 255, 255, 0.4)' }} />
        )}
      </button>
      {isOpen && <div style={{ paddingTop: '12px' }}>{children}</div>}
    </div>
  );
}

function LogoUploadSection({
  brandId,
  currentLogoUrl,
  onLogoUploaded,
}: {
  brandId: string;
  currentLogoUrl?: string;
  onLogoUploaded?: (logoUrl: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a PNG, JPG, WebP, or SVG file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Logo file must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`/api/media/brands/${brandId}/upload-logo`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadSuccess(true);
      if (onLogoUploaded && result.logoUrl) {
        onLogoUploaded(result.logoUrl);
      }

      // Reset success state after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }, [brandId, onLogoUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '12px',
      }}>
        Brand Logo
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          border: '2px dashed rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
          transition: 'all 150ms',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {currentLogoUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img
                src={currentLogoUrl}
                alt="Brand logo"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
              Click or drag to replace
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {isUploading ? (
              <Loader2 size={24} style={{ color: 'rgba(255, 255, 255, 0.4)', animation: 'spin 1s linear infinite' }} />
            ) : uploadSuccess ? (
              <Check size={24} style={{ color: '#10B981' }} />
            ) : (
              <Upload size={24} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
            )}
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
              {isUploading ? 'Uploading...' : uploadSuccess ? 'Uploaded!' : 'Drop logo here or click to upload'}
            </span>
            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.3)' }}>
              PNG, JPG, WebP, or SVG (max 5MB)
            </span>
          </div>
        )}
      </div>

      {uploadError && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#EF4444',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <X size={12} />
          {uploadError}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
          }
          // Reset input to allow re-uploading same file
          e.target.value = '';
        }}
      />

      <p style={{
        marginTop: '8px',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.4)',
        lineHeight: 1.5,
      }}>
        Logo will be applied to generated images. PNG with transparency works best.
      </p>
    </div>
  );
}

function PlatformBadges({ content }: { content: ScrapedContent[] }) {
  const platforms = ['website', 'instagram', 'facebook', 'linkedin'] as const;
  const platformIcons = {
    website: Globe,
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin,
  };

  const counts = platforms.reduce(
    (acc, platform) => {
      acc[platform] = content.filter((c) => c.platform === platform).length;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  if (totalCount === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {platforms.map((platform) => {
        const Icon = platformIcons[platform];
        const count = counts[platform];
        if (count === 0) return null;

        return (
          <div
            key={platform}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            <Icon style={{ width: 12, height: 12, opacity: 0.7 }} />
            <span>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export function BrandVoicePanel({
  voiceProfile,
  voiceAnalysis,
  scrapedContent,
  isLoading,
  onRefresh,
  onDeepAnalyze,
  brandId,
  logoUrl,
  onLogoUploaded,
}: BrandVoicePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [currentLogoUrl, setCurrentLogoUrl] = useState(logoUrl);

  // Update logo URL when prop changes
  React.useEffect(() => {
    setCurrentLogoUrl(logoUrl);
  }, [logoUrl]);

  const handleLogoUploaded = (newLogoUrl: string) => {
    setCurrentLogoUrl(newLogoUrl);
    onLogoUploaded?.(newLogoUrl);
  };

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeepAnalyze = async () => {
    if (!onDeepAnalyze || isDeepAnalyzing) return;
    setIsDeepAnalyzing(true);
    try {
      await onDeepAnalyze();
    } finally {
      setIsDeepAnalyzing(false);
    }
  };

  const hasProfile = !!voiceProfile;
  const hasAnalysis = !!voiceAnalysis;
  const hasContent = scrapedContent.length > 0;

  return (
    <div
      style={{
        marginTop: '16px',
        backgroundColor: 'rgb(38, 40, 42)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
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
          padding: '14px 16px',
          backgroundColor: 'transparent',
          border: 'none',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>Voice Profile</span>
          {hasProfile && voiceProfile.confidence_score >= 0.7 && (
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#10B981',
            }} />
          )}
          {!hasProfile && !isLoading && (
            <span style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}>
              Not analyzed
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp style={{ width: 16, height: 16, color: 'rgba(255, 255, 255, 0.4)' }} />
        ) : (
          <ChevronDown style={{ width: 16, height: 16, color: 'rgba(255, 255, 255, 0.4)' }} />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div style={{ padding: '0 16px 16px' }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              color: 'rgba(255, 255, 255, 0.5)',
            }}>
              <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
              <span style={{ marginLeft: '8px', fontSize: '13px' }}>Loading...</span>
            </div>
          ) : (
            <>
              {/* Hero: AI Voice Analysis */}
              {hasAnalysis && voiceAnalysis.voice_description && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{
                    fontSize: '14px',
                    lineHeight: '1.65',
                    color: 'rgba(255, 255, 255, 0.85)',
                    margin: 0,
                  }}>
                    {voiceAnalysis.voice_description}
                  </p>
                </div>
              )}

              {/* Tone Dimensions - Clean sliders */}
              {hasProfile && (
                <div style={{ marginBottom: '8px' }}>
                  <ToneSlider
                    dimension="formality"
                    value={voiceProfile.formality_score}
                    lowLabel="Casual"
                    highLabel="Formal"
                  />
                  <ToneSlider
                    dimension="humor"
                    value={voiceProfile.humor_score}
                    lowLabel="Serious"
                    highLabel="Playful"
                  />
                  <ToneSlider
                    dimension="energy"
                    value={voiceProfile.energy_score}
                    lowLabel="Calm"
                    highLabel="Energetic"
                  />
                  <ToneSlider
                    dimension="authority"
                    value={voiceProfile.authority_score}
                    lowLabel="Peer"
                    highLabel="Expert"
                  />
                </div>
              )}

              {/* Collapsible: Example Hooks */}
              {hasAnalysis && voiceAnalysis.example_hooks && voiceAnalysis.example_hooks.length > 0 && (
                <CollapsibleSection title="Example Hooks">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {voiceAnalysis.example_hooks.slice(0, 3).map((hook, i) => (
                      <p key={i} style={{
                        fontSize: '12px',
                        lineHeight: '1.5',
                        color: 'rgba(255, 255, 255, 0.7)',
                        margin: 0,
                        paddingLeft: '12px',
                        borderLeft: '2px solid rgba(255, 255, 255, 0.1)',
                      }}>
                        "{hook}"
                      </p>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Collapsible: Vocabulary */}
              {hasAnalysis && voiceAnalysis.vocabulary_preferences && (
                (voiceAnalysis.vocabulary_preferences.preferredWords?.length || 0) > 0 ||
                (voiceAnalysis.vocabulary_preferences.avoidedWords?.length || 0) > 0
              ) && (
                <CollapsibleSection title="Vocabulary">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {voiceAnalysis.vocabulary_preferences?.preferredWords &&
                     voiceAnalysis.vocabulary_preferences.preferredWords.length > 0 && (
                      <div>
                        <div style={{
                          fontSize: '10px',
                          color: 'rgba(255, 255, 255, 0.4)',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          Use
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {voiceAnalysis.vocabulary_preferences.preferredWords.slice(0, 8).map((word, i) => (
                            <span key={i} style={{
                              fontSize: '11px',
                              color: 'rgba(255, 255, 255, 0.7)',
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                            }}>
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {voiceAnalysis.vocabulary_preferences?.avoidedWords &&
                     voiceAnalysis.vocabulary_preferences.avoidedWords.length > 0 && (
                      <div>
                        <div style={{
                          fontSize: '10px',
                          color: 'rgba(255, 255, 255, 0.4)',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          Avoid
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {voiceAnalysis.vocabulary_preferences.avoidedWords.slice(0, 5).map((word, i) => (
                            <span key={i} style={{
                              fontSize: '11px',
                              color: 'rgba(255, 255, 255, 0.5)',
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              textDecoration: 'line-through',
                              textDecorationColor: 'rgba(255, 255, 255, 0.3)',
                            }}>
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {/* Collapsible: Writing Guidelines */}
              {hasAnalysis && voiceAnalysis.generated_guidelines && (
                <CollapsibleSection title="Writing Guidelines">
                  <div style={{
                    fontSize: '12px',
                    lineHeight: '1.7',
                    color: 'rgba(255, 255, 255, 0.7)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {voiceAnalysis.generated_guidelines}
                  </div>
                </CollapsibleSection>
              )}

              {/* Footer: Source count + Actions */}
              <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <PlatformBadges content={scrapedContent} />

                <div style={{ display: 'flex', gap: '8px' }}>
                  {onRefresh && (
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'transparent',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: isRefreshing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: isRefreshing ? 0.5 : 1,
                        transition: 'all 150ms',
                      }}
                      onMouseEnter={(e) => {
                        if (!isRefreshing) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {isRefreshing ? (
                        <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <RefreshCw style={{ width: 12, height: 12 }} />
                      )}
                      {hasContent ? 'Re-scrape' : 'Scrape'}
                    </button>
                  )}

                  {onDeepAnalyze && (
                    <button
                      onClick={handleDeepAnalyze}
                      disabled={isDeepAnalyzing}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: '#1a1a1a',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: isDeepAnalyzing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        opacity: isDeepAnalyzing ? 0.7 : 1,
                        transition: 'all 150ms',
                      }}
                      onMouseEnter={(e) => {
                        if (!isDeepAnalyzing) {
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                      }}
                    >
                      {isDeepAnalyzing ? (
                        <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Sparkles style={{ width: 12, height: 12 }} />
                      )}
                      {hasAnalysis ? 'Re-analyze' : 'Analyze'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Logo Upload Section - shown below the profile */}
      {isExpanded && brandId && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', marginTop: hasProfile ? '0' : '16px', paddingTop: '16px' }}>
          <LogoUploadSection
            brandId={brandId}
            currentLogoUrl={currentLogoUrl}
            onLogoUploaded={handleLogoUploaded}
          />
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

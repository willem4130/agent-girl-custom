/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Loader2, Globe, Instagram, Facebook, Linkedin, Sparkles, BookOpen, MessageSquareQuote, FileText } from 'lucide-react';
import type { VoiceProfile, ScrapedContent, VoiceAnalysis } from '../../hooks/useBrandAPI';

interface BrandVoicePanelProps {
  voiceProfile: VoiceProfile | null;
  voiceAnalysis?: VoiceAnalysis | null;
  scrapedContent: ScrapedContent[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  onDeepAnalyze?: () => Promise<void>;
}

interface ToneDimensionBarProps {
  label: string;
  value: number;
  lowLabel: string;
  highLabel: string;
  color: string;
}

function ToneDimensionBar({ label, value, lowLabel, highLabel, color }: ToneDimensionBarProps) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
          fontSize: '12px',
        }}
      >
        <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>{label}</span>
        <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{value}%</span>
      </div>
      <div
        style={{
          height: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${value}%`,
            backgroundColor: color,
            borderRadius: '4px',
            transition: 'width 300ms ease-out',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '2px',
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.4)',
        }}
      >
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function PlatformBreakdown({ content }: { content: ScrapedContent[] }) {
  const platforms = ['website', 'instagram', 'facebook', 'linkedin'] as const;
  const platformIcons = {
    website: Globe,
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin,
  };
  const platformColors = {
    website: '#3B82F6',
    instagram: '#E4405F',
    facebook: '#1877F2',
    linkedin: '#0A66C2',
  };

  const counts = platforms.reduce(
    (acc, platform) => {
      acc[platform] = content.filter((c) => c.platform === platform).length;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  if (totalCount === 0) {
    return (
      <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', padding: '16px' }}>
        No scraped content yet. Click &quot;Re-analyze&quot; to fetch content.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
              gap: '6px',
              padding: '6px 10px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '6px',
            }}
          >
            <Icon style={{ width: 14, height: 14, color: platformColors[platform] }} />
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>{count}</span>
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
}: BrandVoicePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

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
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Header - always visible */}
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
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>Voice Profile</span>
          {hasProfile && (
            <span
              style={{
                fontSize: '11px',
                color: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {voiceProfile.confidence_score >= 0.7 ? 'High confidence' : 'Building...'}
            </span>
          )}
          {!hasProfile && !isLoading && (
            <span
              style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              Not analyzed
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp style={{ width: 18, height: 18, color: 'rgba(255, 255, 255, 0.5)' }} />
        ) : (
          <ChevronDown style={{ width: 18, height: 18, color: 'rgba(255, 255, 255, 0.5)' }} />
        )}
      </button>

      {/* Collapsible content */}
      {isExpanded && (
        <div style={{ padding: '0 16px 16px' }}>
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
              <span style={{ marginLeft: '8px', fontSize: '13px' }}>Loading voice profile...</span>
            </div>
          ) : (
            <>
              {/* LLM Voice Analysis - Voice Description */}
              {hasAnalysis && voiceAnalysis.voice_description && (
                <div style={{ marginBottom: '20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    <Sparkles style={{ width: 12, height: 12, color: '#FFE66D' }} />
                    AI Voice Analysis
                  </div>
                  <p
                    style={{
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: 'rgba(255, 255, 255, 0.85)',
                      margin: 0,
                      padding: '12px',
                      backgroundColor: 'rgba(255, 230, 109, 0.05)',
                      border: '1px solid rgba(255, 230, 109, 0.15)',
                      borderRadius: '8px',
                    }}
                  >
                    {voiceAnalysis.voice_description}
                  </p>
                </div>
              )}

              {/* LLM Example Hooks from Analysis */}
              {hasAnalysis && voiceAnalysis.example_hooks && voiceAnalysis.example_hooks.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    <MessageSquareQuote style={{ width: 12, height: 12, color: '#FF6B6B' }} />
                    Extracted Hooks
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {voiceAnalysis.example_hooks.slice(0, 5).map((hook, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: '12px',
                          lineHeight: '1.5',
                          color: 'rgba(255, 255, 255, 0.8)',
                          padding: '8px 12px',
                          backgroundColor: 'rgba(255, 107, 107, 0.08)',
                          border: '1px solid rgba(255, 107, 107, 0.15)',
                          borderRadius: '6px',
                          fontStyle: 'italic',
                        }}
                      >
                        &ldquo;{hook}&rdquo;
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LLM Writing Guidelines - Collapsible */}
              {hasAnalysis && voiceAnalysis.generated_guidelines && (
                <div style={{ marginBottom: '20px' }}>
                  <button
                    onClick={() => setShowGuidelines(!showGuidelines)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                    }}
                  >
                    <BookOpen style={{ width: 14, height: 14, color: '#3B82F6' }} />
                    <span style={{ flex: 1, textAlign: 'left', fontSize: '13px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
                      Writing Guidelines
                    </span>
                    {showGuidelines ? (
                      <ChevronUp style={{ width: 14, height: 14, color: 'rgba(255, 255, 255, 0.5)' }} />
                    ) : (
                      <ChevronDown style={{ width: 14, height: 14, color: 'rgba(255, 255, 255, 0.5)' }} />
                    )}
                  </button>
                  {showGuidelines && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '12px',
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        border: '1px solid rgba(59, 130, 246, 0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        lineHeight: '1.7',
                        color: 'rgba(255, 255, 255, 0.8)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {voiceAnalysis.generated_guidelines}
                    </div>
                  )}
                </div>
              )}

              {/* Vocabulary Preferences */}
              {hasAnalysis && voiceAnalysis.vocabulary_preferences && (
                <div style={{ marginBottom: '20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    <FileText style={{ width: 12, height: 12, color: '#10B981' }} />
                    Vocabulary
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {voiceAnalysis.vocabulary_preferences.preferredWords &&
                      voiceAnalysis.vocabulary_preferences.preferredWords.length > 0 && (
                        <div>
                          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginRight: '8px' }}>
                            Use:
                          </span>
                          <span style={{ fontSize: '12px', color: '#10B981' }}>
                            {voiceAnalysis.vocabulary_preferences.preferredWords.slice(0, 8).join(', ')}
                          </span>
                        </div>
                      )}
                    {voiceAnalysis.vocabulary_preferences.avoidedWords &&
                      voiceAnalysis.vocabulary_preferences.avoidedWords.length > 0 && (
                        <div>
                          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginRight: '8px' }}>
                            Avoid:
                          </span>
                          <span style={{ fontSize: '12px', color: '#EF4444' }}>
                            {voiceAnalysis.vocabulary_preferences.avoidedWords.slice(0, 5).join(', ')}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Tone Dimensions */}
              {hasProfile && (
                <div style={{ marginBottom: '20px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    Tone Dimensions
                  </div>
                  <ToneDimensionBar
                    label="Formality"
                    value={voiceProfile.formality_score}
                    lowLabel="Casual"
                    highLabel="Formal"
                    color="#3B82F6"
                  />
                  <ToneDimensionBar
                    label="Humor"
                    value={voiceProfile.humor_score}
                    lowLabel="Serious"
                    highLabel="Playful"
                    color="#F59E0B"
                  />
                  <ToneDimensionBar
                    label="Energy"
                    value={voiceProfile.energy_score}
                    lowLabel="Calm"
                    highLabel="Energetic"
                    color="#10B981"
                  />
                  <ToneDimensionBar
                    label="Authority"
                    value={voiceProfile.authority_score}
                    lowLabel="Friendly"
                    highLabel="Authoritative"
                    color="#8B5CF6"
                  />
                </div>
              )}

              {/* Platform Breakdown */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  Scraped Content
                </div>
                <PlatformBreakdown content={scrapedContent} />
              </div>

              {/* Winning Patterns */}
              {hasProfile && voiceProfile.winning_hooks && voiceProfile.winning_hooks.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    Winning Hooks
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {voiceProfile.winning_hooks.slice(0, 5).map((hook, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.7)',
                          backgroundColor: 'rgba(255, 107, 107, 0.1)',
                          border: '1px solid rgba(255, 107, 107, 0.2)',
                          padding: '4px 10px',
                          borderRadius: '12px',
                        }}
                      >
                        {hook}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Frameworks */}
              {hasProfile && voiceProfile.top_frameworks && voiceProfile.top_frameworks.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    Top Frameworks
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {voiceProfile.top_frameworks.slice(0, 4).map((framework, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.7)',
                          backgroundColor: 'rgba(255, 230, 109, 0.1)',
                          border: '1px solid rgba(255, 230, 109, 0.2)',
                          padding: '4px 10px',
                          borderRadius: '12px',
                        }}
                      >
                        {framework}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                {/* Deep Analyze Button - Primary action */}
                {onDeepAnalyze && (
                  <button
                    onClick={handleDeepAnalyze}
                    disabled={isDeepAnalyzing}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
                      color: '#1a1a1a',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: isDeepAnalyzing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: isDeepAnalyzing ? 0.7 : 1,
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={(e) => {
                      if (!isDeepAnalyzing) {
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {isDeepAnalyzing ? (
                      <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Sparkles style={{ width: 14, height: 14 }} />
                    )}
                    {isDeepAnalyzing
                      ? 'Deep analyzing...'
                      : hasAnalysis
                        ? 'Re-run Deep Analysis'
                        : 'Deep Analyze (AI)'}
                  </button>
                )}

                {/* Quick Re-analyze Button - Secondary */}
                {onRefresh && (
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backgroundColor: 'transparent',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: isRefreshing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
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
                      <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <RefreshCw style={{ width: 14, height: 14 }} />
                    )}
                    {hasContent ? 'Quick Re-scrape' : 'Scrape Content'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

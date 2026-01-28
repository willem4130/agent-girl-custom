/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Copywriting Wizard - 3-step wizard for content creation setup
 *
 * Steps:
 * 1. Brand Select - Confirm or select brand
 * 2. Content Type - Choose content type (LinkedIn, Instagram, etc.)
 * 3. Briefing - Topic, goals, audience, key messages, references
 *
 * On complete: sends structured brief to chat for generation/refinement
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Building2,
  FileText,
  ClipboardList,
  X,
} from 'lucide-react';
import type { Brand } from '../../hooks/useBrandAPI';
import { ContentTypeSelector, type ContentType } from './ContentTypeSelector';

// ============================================================================
// TYPES
// ============================================================================

export interface BriefingData {
  topic: string;
  goals: string[];
  audience: string;
  keyMessages: string[];
  references: string[];
  additionalContext: string;
}

export interface WizardResult {
  brand: Brand;
  contentType: ContentType;
  briefing: BriefingData;
}

interface CopywritingWizardProps {
  brands: Brand[];
  initialBrandId?: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: WizardResult) => void;
  isLoading?: boolean;
}

type WizardStep = 'brand' | 'content_type' | 'briefing';

const STEPS: { id: WizardStep; label: string; icon: React.ElementType }[] = [
  { id: 'brand', label: 'Brand', icon: Building2 },
  { id: 'content_type', label: 'Content Type', icon: FileText },
  { id: 'briefing', label: 'Briefing', icon: ClipboardList },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function CopywritingWizard({
  brands,
  initialBrandId,
  isOpen,
  onClose,
  onComplete,
  isLoading = false,
}: CopywritingWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('brand');
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(initialBrandId || null);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  const [briefing, setBriefing] = useState<BriefingData>({
    topic: '',
    goals: [],
    audience: '',
    keyMessages: [],
    references: [],
    additionalContext: '',
  });

  // Form helpers
  const [goalsInput, setGoalsInput] = useState('');
  const [keyMessagesInput, setKeyMessagesInput] = useState('');
  const [referencesInput, setReferencesInput] = useState('');

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('brand');
      setSelectedBrandId(initialBrandId || null);
      setSelectedContentType(null);
      setBriefing({
        topic: '',
        goals: [],
        audience: '',
        keyMessages: [],
        references: [],
        additionalContext: '',
      });
      setGoalsInput('');
      setKeyMessagesInput('');
      setReferencesInput('');
    }
  }, [isOpen, initialBrandId]);

  const selectedBrand = brands.find((b) => b.id === selectedBrandId) || null;

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case 'brand':
        return !!selectedBrandId;
      case 'content_type':
        return !!selectedContentType;
      case 'briefing':
        return briefing.topic.trim().length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 'brand') {
      setCurrentStep('content_type');
    } else if (currentStep === 'content_type') {
      setCurrentStep('briefing');
    } else if (currentStep === 'briefing') {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep === 'content_type') {
      setCurrentStep('brand');
    } else if (currentStep === 'briefing') {
      setCurrentStep('content_type');
    }
  };

  const handleComplete = () => {
    if (!selectedBrand || !selectedContentType) return;

    // Parse comma-separated inputs
    const finalBriefing: BriefingData = {
      ...briefing,
      goals: goalsInput
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
      keyMessages: keyMessagesInput
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
      references: referencesInput
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean),
    };

    onComplete({
      brand: selectedBrand,
      contentType: selectedContentType,
      briefing: finalBriefing,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          backgroundColor: 'rgb(30, 32, 34)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: 0 }}>
              Create Content
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', margin: '4px 0 0' }}>
              Set up your content brief
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '8px',
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
            }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Progress Steps */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 24px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            gap: '8px',
          }}
        >
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = index < stepIndex;

            return (
              <React.Fragment key={step.id}>
                {index > 0 && (
                  <div
                    style={{
                      flex: 1,
                      height: '2px',
                      backgroundColor: isCompleted ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
                      transition: 'background-color 300ms',
                    }}
                  />
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: isCompleted
                        ? '#10B981'
                        : isActive
                          ? 'rgba(255, 107, 107, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isCompleted ? (
                      <Check style={{ width: 14, height: 14, color: 'white' }} />
                    ) : (
                      <Icon
                        style={{
                          width: 14,
                          height: 14,
                          color: isActive ? '#FF6B6B' : 'rgba(255, 255, 255, 0.4)',
                        }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'white' : 'rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Step 1: Brand Selection */}
          {currentStep === 'brand' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>
                Select Brand
              </h3>

              {brands.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '32px',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  <Building2 style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.3 }} />
                  <p>No brands configured yet.</p>
                  <p style={{ fontSize: '13px' }}>Create a brand first to start generating content.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {brands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => setSelectedBrandId(brand.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: `2px solid ${selectedBrandId === brand.id ? '#FF6B6B' : 'rgba(255, 255, 255, 0.1)'}`,
                        backgroundColor:
                          selectedBrandId === brand.id ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 200ms',
                        textAlign: 'left',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1a1a1a',
                          fontWeight: 700,
                          fontSize: '16px',
                        }}
                      >
                        {brand.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{brand.name}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                          {brand.language === 'nl' ? 'Dutch' : brand.language === 'en' ? 'English' : 'Bilingual'}
                        </div>
                      </div>
                      {selectedBrandId === brand.id && (
                        <Check style={{ marginLeft: 'auto', width: 20, height: 20, color: '#FF6B6B' }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Content Type Selection */}
          {currentStep === 'content_type' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>
                What would you like to create?
              </h3>

              <ContentTypeSelector
                selectedType={selectedContentType}
                onSelect={setSelectedContentType}
              />
            </div>
          )}

          {/* Step 3: Briefing */}
          {currentStep === 'briefing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '0' }}>
                Brief your content
              </h3>

              {/* Topic (required) */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '6px',
                  }}
                >
                  Topic / Main idea <span style={{ color: '#FF6B6B' }}>*</span>
                </label>
                <input
                  type="text"
                  value={briefing.topic}
                  onChange={(e) => setBriefing({ ...briefing, topic: e.target.value })}
                  placeholder="What is this content about?"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Goals */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '6px',
                  }}
                >
                  Goals (comma-separated)
                </label>
                <input
                  type="text"
                  value={goalsInput}
                  onChange={(e) => setGoalsInput(e.target.value)}
                  placeholder="e.g., drive traffic, build authority, generate leads"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Audience */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '6px',
                  }}
                >
                  Target Audience
                </label>
                <input
                  type="text"
                  value={briefing.audience}
                  onChange={(e) => setBriefing({ ...briefing, audience: e.target.value })}
                  placeholder="Who is this content for?"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Key Messages */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '6px',
                  }}
                >
                  Key Messages (comma-separated)
                </label>
                <input
                  type="text"
                  value={keyMessagesInput}
                  onChange={(e) => setKeyMessagesInput(e.target.value)}
                  placeholder="Main points to communicate"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Additional Context */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '6px',
                  }}
                >
                  Additional Context
                </label>
                <textarea
                  value={briefing.additionalContext}
                  onChange={(e) => setBriefing({ ...briefing, additionalContext: e.target.value })}
                  placeholder="Any other relevant information, context, or inspiration..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <button
            onClick={handleBack}
            disabled={currentStep === 'brand'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'transparent',
              color: currentStep === 'brand' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: currentStep === 'brand' ? 'not-allowed' : 'pointer',
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: canProceed() ? 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)' : 'rgba(255, 255, 255, 0.1)',
              color: canProceed() ? '#1a1a1a' : 'rgba(255, 255, 255, 0.4)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: canProceed() && !isLoading ? 'pointer' : 'not-allowed',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <>
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                Creating...
              </>
            ) : currentStep === 'briefing' ? (
              <>
                Start Writing
                <ArrowRight style={{ width: 16, height: 16 }} />
              </>
            ) : (
              <>
                Next
                <ArrowRight style={{ width: 16, height: 16 }} />
              </>
            )}
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
    </div>
  );
}

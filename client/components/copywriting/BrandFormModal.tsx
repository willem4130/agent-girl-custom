/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Loader2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import type { Brand, CreateBrandInput, UpdateBrandInput } from '../../hooks/useBrandAPI';

interface BrandFormModalProps {
  brand?: Brand | null;
  sessionId: string;
  onSave: (input: CreateBrandInput | UpdateBrandInput) => Promise<Brand | null>;
  onDelete?: (brandId: string) => Promise<boolean>;
  onAnalyze?: (brandId: string) => Promise<void>;
  onClose: () => void;
}

const CONTENT_TYPE_OPTIONS = [
  { id: 'social', label: 'Social Posts', description: 'Instagram, Facebook, LinkedIn posts' },
  { id: 'newsletter', label: 'Newsletters', description: 'Email newsletters and updates' },
  { id: 'ads', label: 'Ad Copy', description: 'Paid advertising copy' },
  { id: 'landing', label: 'Landing Pages', description: 'Website landing page copy' },
];

const LANGUAGE_OPTIONS = [
  { id: 'nl', label: 'Dutch' },
  { id: 'en', label: 'English' },
  { id: 'both', label: 'Both' },
] as const;

function validateUrl(url: string): boolean {
  if (!url.trim()) return true; // Empty is valid (optional)
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function BrandFormModal({
  brand,
  sessionId,
  onSave,
  onDelete,
  onAnalyze,
  onClose,
}: BrandFormModalProps) {
  const isEditing = !!brand;

  // Form state
  const [name, setName] = useState(brand?.name || '');
  const [websiteUrl, setWebsiteUrl] = useState(brand?.website_url || '');
  const [instagramUrl, setInstagramUrl] = useState(brand?.instagram_url || '');
  const [facebookUrl, setFacebookUrl] = useState(brand?.facebook_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(brand?.linkedin_url || '');
  const [language, setLanguage] = useState<'nl' | 'en' | 'both'>(brand?.language || 'nl');
  const [contentTypes, setContentTypes] = useState<string[]>(brand?.content_types || ['social']);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when brand changes
  useEffect(() => {
    if (brand) {
      setName(brand.name);
      setWebsiteUrl(brand.website_url || '');
      setInstagramUrl(brand.instagram_url || '');
      setFacebookUrl(brand.facebook_url || '');
      setLinkedinUrl(brand.linkedin_url || '');
      setLanguage(brand.language);
      setContentTypes(brand.content_types || ['social']);
    }
  }, [brand]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Brand name is required';
    }

    if (websiteUrl && !validateUrl(websiteUrl)) {
      newErrors.websiteUrl = 'Invalid URL format';
    }
    if (instagramUrl && !validateUrl(instagramUrl)) {
      newErrors.instagramUrl = 'Invalid URL format';
    }
    if (facebookUrl && !validateUrl(facebookUrl)) {
      newErrors.facebookUrl = 'Invalid URL format';
    }
    if (linkedinUrl && !validateUrl(linkedinUrl)) {
      newErrors.linkedinUrl = 'Invalid URL format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (triggerAnalyze = false) => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const input = isEditing
        ? ({
            name: name.trim(),
            websiteUrl: websiteUrl.trim() || undefined,
            instagramUrl: instagramUrl.trim() || undefined,
            facebookUrl: facebookUrl.trim() || undefined,
            linkedinUrl: linkedinUrl.trim() || undefined,
            language,
            contentTypes,
          } as UpdateBrandInput)
        : ({
            sessionId,
            name: name.trim(),
            websiteUrl: websiteUrl.trim() || undefined,
            instagramUrl: instagramUrl.trim() || undefined,
            facebookUrl: facebookUrl.trim() || undefined,
            linkedinUrl: linkedinUrl.trim() || undefined,
            language,
            contentTypes,
          } as CreateBrandInput);

      const savedBrand = await onSave(input);

      if (savedBrand && triggerAnalyze && onAnalyze) {
        await onAnalyze(savedBrand.id);
      }

      if (savedBrand) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!brand || !onDelete) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${brand.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const success = await onDelete(brand.id);
      if (success) {
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleContentType = (typeId: string) => {
    setContentTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const hasAnyUrl = !!(websiteUrl || instagramUrl || facebookUrl || linkedinUrl);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgb(20, 22, 24)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: 0 }}>
            {isEditing ? 'Edit Brand' : 'Add Brand'}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.6)',
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Close modal"
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          {/* Brand Identity Section */}
          <div style={{ marginBottom: '28px' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Brand Identity
            </div>

            {/* Name field */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '6px',
                }}
              >
                Brand Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Acme Corp"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: errors.name
                    ? '1px solid #EF4444'
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgb(38, 40, 42)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 150ms',
                }}
                onFocus={(e) => {
                  if (!errors.name) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.name) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }
                }}
              />
              {errors.name && (
                <div style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
                  {errors.name}
                </div>
              )}
            </div>

            {/* Language selection */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '8px',
                }}
              >
                Language
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setLanguage(option.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border:
                        language === option.id
                          ? '1px solid #FF6B6B'
                          : '1px solid rgba(255, 255, 255, 0.15)',
                      backgroundColor:
                        language === option.id ? 'rgba(255, 107, 107, 0.15)' : 'rgb(38, 40, 42)',
                      color: language === option.id ? '#FF6B6B' : 'rgba(255, 255, 255, 0.8)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* URLs Section */}
          <div style={{ marginBottom: '28px' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Brand URLs
            </div>

            {/* URL inputs */}
            {[
              {
                key: 'websiteUrl',
                label: 'Website',
                icon: Globe,
                value: websiteUrl,
                setValue: setWebsiteUrl,
                placeholder: 'https://example.com',
              },
              {
                key: 'instagramUrl',
                label: 'Instagram',
                icon: Instagram,
                value: instagramUrl,
                setValue: setInstagramUrl,
                placeholder: 'https://instagram.com/username',
              },
              {
                key: 'facebookUrl',
                label: 'Facebook',
                icon: Facebook,
                value: facebookUrl,
                setValue: setFacebookUrl,
                placeholder: 'https://facebook.com/page',
              },
              {
                key: 'linkedinUrl',
                label: 'LinkedIn',
                icon: Linkedin,
                value: linkedinUrl,
                setValue: setLinkedinUrl,
                placeholder: 'https://linkedin.com/company/name',
              },
            ].map(({ key, label: _label, icon: Icon, value, setValue, placeholder }) => (
              <div key={key} style={{ marginBottom: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(255, 255, 255, 0.4)',
                    }}
                  >
                    <Icon style={{ width: 16, height: 16 }} />
                  </div>
                  <input
                    type="url"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      borderRadius: '8px',
                      border: errors[key]
                        ? '1px solid #EF4444'
                        : '1px solid rgba(255, 255, 255, 0.15)',
                      backgroundColor: 'rgb(38, 40, 42)',
                      color: 'white',
                      fontSize: '13px',
                      outline: 'none',
                      transition: 'border-color 150ms',
                    }}
                    onFocus={(e) => {
                      if (!errors[key]) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors[key]) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      }
                    }}
                  />
                </div>
                {errors[key] && (
                  <div style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
                    {errors[key]}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Content Types Section */}
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Content Types
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {CONTENT_TYPE_OPTIONS.map((option) => {
                const isSelected = contentTypes.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleContentType(option.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: isSelected
                        ? '1px solid #FF6B6B'
                        : '1px solid rgba(255, 255, 255, 0.15)',
                      backgroundColor: isSelected ? 'rgba(255, 107, 107, 0.1)' : 'rgb(38, 40, 42)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 150ms',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: isSelected ? '#FF6B6B' : 'white',
                        marginBottom: '2px',
                      }}
                    >
                      {option.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left side - Delete button (edit mode only) */}
          <div>
            {isEditing && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #EF4444',
                  backgroundColor: 'transparent',
                  color: '#EF4444',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: isDeleting || isSaving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isDeleting || isSaving ? 0.5 : 1,
                  transition: 'all 150ms',
                }}
              >
                {isDeleting ? (
                  <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Trash2 style={{ width: 14, height: 14 }} />
                )}
                Delete
              </button>
            )}
          </div>

          {/* Right side - Cancel and Save buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              disabled={isSaving || isDeleting}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'transparent',
                color: 'white',
                fontSize: '13px',
                fontWeight: 500,
                cursor: isSaving || isDeleting ? 'not-allowed' : 'pointer',
                opacity: isSaving || isDeleting ? 0.5 : 1,
                transition: 'all 150ms',
              }}
            >
              Cancel
            </button>

            <button
              onClick={() => handleSave(hasAnyUrl)}
              disabled={isSaving || isDeleting || !name.trim()}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(90deg, #FF6B6B, #FFE66D)',
                color: '#000',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isSaving || isDeleting || !name.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isSaving || isDeleting || !name.trim() ? 0.5 : 1,
                transition: 'all 150ms',
              }}
            >
              {isSaving ? (
                <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
              ) : hasAnyUrl ? (
                <Sparkles style={{ width: 14, height: 14 }} />
              ) : null}
              {hasAnyUrl ? 'Save & Analyze' : 'Save'}
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
    </div>,
    document.body
  );
}

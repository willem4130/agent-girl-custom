/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React, { useState } from 'react';
import { Linkedin, Instagram, Facebook, FileText, Mail, Sparkles } from 'lucide-react';

export type ContentType =
  | 'linkedin_post'
  | 'facebook_post'
  | 'instagram_post'
  | 'article'
  | 'newsletter'
  | 'custom';

interface ContentTypeConfig {
  type: ContentType;
  label: string;
  description: string;
  lengthHint: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const CONTENT_TYPES: ContentTypeConfig[] = [
  {
    type: 'linkedin_post',
    label: 'LinkedIn Post',
    description: 'Professional thought leadership',
    lengthHint: '500-1500 chars',
    icon: Linkedin,
    color: '#0A66C2',
    bgColor: 'rgba(10, 102, 194, 0.1)',
    borderColor: 'rgba(10, 102, 194, 0.3)',
  },
  {
    type: 'facebook_post',
    label: 'Facebook Post',
    description: 'Community engagement, stories',
    lengthHint: '80-500 chars',
    icon: Facebook,
    color: '#1877F2',
    bgColor: 'rgba(24, 119, 242, 0.1)',
    borderColor: 'rgba(24, 119, 242, 0.3)',
  },
  {
    type: 'instagram_post',
    label: 'Instagram Post',
    description: 'Visual captions, lifestyle',
    lengthHint: '150-300 chars',
    icon: Instagram,
    color: '#E4405F',
    bgColor: 'rgba(228, 64, 95, 0.1)',
    borderColor: 'rgba(228, 64, 95, 0.3)',
  },
  {
    type: 'article',
    label: 'Article / Blog',
    description: 'Long-form, SEO-optimized',
    lengthHint: '800-2000 words',
    icon: FileText,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  {
    type: 'newsletter',
    label: 'Newsletter',
    description: 'Email, personal tone',
    lengthHint: '300-800 words',
    icon: Mail,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  {
    type: 'custom',
    label: 'Custom',
    description: 'Any format, flexible',
    lengthHint: 'Flexible',
    icon: Sparkles,
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
];

interface ContentTypeSelectorProps {
  selectedType: ContentType | null;
  onSelect: (type: ContentType) => void;
  disabled?: boolean;
}

export function ContentTypeSelector({
  selectedType,
  onSelect,
  disabled = false,
}: ContentTypeSelectorProps) {
  const [hoveredType, setHoveredType] = useState<ContentType | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.6)',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        Content Type
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
        }}
      >
        {CONTENT_TYPES.map((config) => {
          const Icon = config.icon;
          const isSelected = selectedType === config.type;
          const isHovered = hoveredType === config.type;

          return (
            <button
              key={config.type}
              onClick={() => !disabled && onSelect(config.type)}
              onMouseEnter={() => !disabled && setHoveredType(config.type)}
              onMouseLeave={() => setHoveredType(null)}
              disabled={disabled}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px 12px',
                borderRadius: '12px',
                border: `2px solid ${isSelected ? config.color : isHovered ? config.borderColor : 'rgba(255, 255, 255, 0.1)'}`,
                backgroundColor: isSelected ? config.bgColor : isHovered ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 200ms ease',
                outline: 'none',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? config.bgColor : 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  transition: 'all 200ms ease',
                }}
              >
                <Icon
                  style={{
                    width: 20,
                    height: 20,
                    color: isSelected || isHovered ? config.color : 'rgba(255, 255, 255, 0.6)',
                    transition: 'color 200ms ease',
                  }}
                />
              </div>

              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '4px',
                  textAlign: 'center',
                }}
              >
                {config.label}
              </span>

              <span
                style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textAlign: 'center',
                  lineHeight: '1.3',
                }}
              >
                {config.description}
              </span>

              <span
                style={{
                  fontSize: '10px',
                  color: isSelected ? config.color : 'rgba(255, 255, 255, 0.4)',
                  marginTop: '6px',
                  padding: '2px 6px',
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  borderRadius: '4px',
                }}
              >
                {config.lengthHint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact version for inline use (e.g., in chat input area)
 */
interface ContentTypeBadgeProps {
  type: ContentType;
  onClear?: () => void;
}

export function ContentTypeBadge({ type, onClear }: ContentTypeBadgeProps) {
  const config = CONTENT_TYPES.find((c) => c.type === type);
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: '16px',
        fontSize: '12px',
        color: config.color,
        fontWeight: 500,
      }}
    >
      <Icon style={{ width: 12, height: 12 }} />
      <span>{config.label}</span>
      {onClear && (
        <button
          onClick={onClear}
          style={{
            marginLeft: '2px',
            padding: '0 2px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '14px',
            lineHeight: 1,
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
}

/**
 * Get content type configuration by type
 */
export function getContentTypeConfig(type: ContentType): ContentTypeConfig | undefined {
  return CONTENT_TYPES.find((c) => c.type === type);
}

/**
 * Get all content type options (for forms/dropdowns)
 */
export function getContentTypeOptions(): Array<{ value: ContentType; label: string }> {
  return CONTENT_TYPES.map((c) => ({ value: c.type, label: c.label }));
}

/**
 * Quick-select content type bar for inline use in chat welcome
 * Shows all content types as horizontal pills for easy access
 * Supports multi-select for creating content series (e.g., article + LinkedIn post)
 */
interface ContentTypeQuickSelectProps {
  selectedTypes: ContentType[];
  onToggle: (type: ContentType) => void;
  disabled?: boolean;
}

export function ContentTypeQuickSelect({
  selectedTypes,
  onToggle,
  disabled = false,
}: ContentTypeQuickSelectProps) {
  return (
    <div
      style={{
        marginTop: '16px',
        padding: '16px',
        backgroundColor: 'rgb(38, 40, 42)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          What do you want to create?
        </div>
        {selectedTypes.length > 1 && (
          <div
            style={{
              fontSize: '11px',
              color: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              padding: '4px 8px',
              borderRadius: '12px',
              fontWeight: 500,
            }}
          >
            Series: {selectedTypes.length} formats
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {CONTENT_TYPES.map((config) => {
          const Icon = config.icon;
          const isSelected = selectedTypes.includes(config.type);
          const selectionOrder = selectedTypes.indexOf(config.type) + 1;

          return (
            <button
              key={config.type}
              onClick={() => !disabled && onToggle(config.type)}
              disabled={disabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '20px',
                border: `2px solid ${isSelected ? config.color : 'rgba(255, 255, 255, 0.1)'}`,
                backgroundColor: isSelected ? config.bgColor : 'transparent',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 200ms ease',
                outline: 'none',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!disabled && !isSelected) {
                  e.currentTarget.style.borderColor = config.borderColor;
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled && !isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {/* Selection order badge for multi-select */}
              {isSelected && selectedTypes.length > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: config.color,
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {selectionOrder}
                </div>
              )}
              <Icon
                style={{
                  width: 16,
                  height: 16,
                  color: isSelected ? config.color : 'rgba(255, 255, 255, 0.6)',
                  transition: 'color 200ms ease',
                }}
              />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.8)',
                }}
              >
                {config.label}
              </span>
              {/* Show +LinkedIn indicator for Article type */}
              {config.type === 'article' && !isSelected && (
                <span
                  style={{
                    fontSize: '10px',
                    color: '#0A66C2',
                    backgroundColor: 'rgba(10, 102, 194, 0.15)',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontWeight: 500,
                    marginLeft: '-4px',
                  }}
                >
                  +LinkedIn
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedTypes.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          {selectedTypes.length === 1
            ? 'Just type your topic above and press Enter to start creating!'
            : `Creating a content series: ${selectedTypes.map(t => CONTENT_TYPES.find(c => c.type === t)?.label).join(' → ')}`
          }
        </div>
      )}
    </div>
  );
}

/**
 * Post Type Selector
 *
 * Grid of template cards for selecting content structure templates.
 * Shows global templates + brand-specific templates when a brand is selected.
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  MessageSquare,
  Users,
  GraduationCap,
  BookOpen,
  AlertCircle,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { useCopywritingContext } from '../../lib/stores/copywritingContext';

type TemplateCategory = 'thought_leadership' | 'social_proof' | 'engagement' | 'educational';

interface TemplateSection {
  name: string;
  prompt: string;
  maxChars?: number;
  variables?: string[];
}

interface TemplateStructure {
  sections: TemplateSection[];
  framework?: string;
  tone_adjustments?: Record<string, number | string>;
}

interface PostTypeTemplate {
  id: string;
  brand_id: string | null;
  name: string;
  description?: string;
  category: TemplateCategory;
  platforms: string[];
  structure: TemplateStructure;
  example_output?: string;
  variables: string[];
  is_system: number;
  created_at: string;
}

const CATEGORY_CONFIG: Record<
  TemplateCategory,
  { icon: React.ElementType; label: string; color: string; description: string }
> = {
  thought_leadership: {
    icon: BookOpen,
    label: 'Thought Leadership',
    color: '#8B5CF6',
    description: 'Expert insights and industry commentary',
  },
  social_proof: {
    icon: Users,
    label: 'Social Proof',
    color: '#10B981',
    description: 'Case studies and testimonials',
  },
  engagement: {
    icon: MessageSquare,
    label: 'Engagement',
    color: '#F59E0B',
    description: 'Community building content',
  },
  educational: {
    icon: GraduationCap,
    label: 'Educational',
    color: '#3B82F6',
    description: 'Teaching and informative content',
  },
};

const PLATFORM_ICONS: Record<string, string> = {
  linkedin: '💼',
  twitter: '🐦',
  instagram: '📸',
  facebook: '👥',
  newsletter: '📧',
  article: '📝',
};

interface PostTypeSelectorProps {
  onSelect?: (templateId: string | null) => void;
  compact?: boolean;
}

export function PostTypeSelector({ onSelect, compact = false }: PostTypeSelectorProps) {
  const { brandId, templateId, setTemplateId } = useCopywritingContext();
  const [templates, setTemplates] = useState<PostTypeTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (brandId) {
          params.set('brandId', brandId);
        }

        const response = await fetch(`/api/copywriting/templates?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }

        const data = await response.json();
        setTemplates(data.templates || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [brandId]);

  const handleSelect = (id: string | null) => {
    setTemplateId(id);
    onSelect?.(id);
  };

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const selectedTemplate = templates.find((t) => t.id === templateId);

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
            <FileText style={{ width: 16, height: 16, color: 'rgba(255, 255, 255, 0.7)' }} />
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>
              Content Template
            </span>
            {selectedTemplate && (
              <span
                style={{
                  fontSize: '12px',
                  color: CATEGORY_CONFIG[selectedTemplate.category].color,
                  backgroundColor: `${CATEGORY_CONFIG[selectedTemplate.category].color}20`,
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {selectedTemplate.name}
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
            {/* Quick Select */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                onClick={() => handleSelect(null)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${!templateId ? '#FF6B6B' : 'rgba(255, 255, 255, 0.15)'}`,
                  backgroundColor: !templateId ? 'rgba(255, 107, 107, 0.15)' : 'transparent',
                  color: !templateId ? '#FF6B6B' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                No Template
              </button>
              {templates.slice(0, 5).map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template.id)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${
                      templateId === template.id
                        ? CATEGORY_CONFIG[template.category].color
                        : 'rgba(255, 255, 255, 0.15)'
                    }`,
                    backgroundColor:
                      templateId === template.id
                        ? `${CATEGORY_CONFIG[template.category].color}20`
                        : 'transparent',
                    color:
                      templateId === template.id
                        ? CATEGORY_CONFIG[template.category].color
                        : 'rgba(255, 255, 255, 0.7)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

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
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles style={{ width: 18, height: 18, color: '#FFE66D' }} />
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>
            Content Templates
          </span>
          <span
            style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 8px',
              borderRadius: '10px',
            }}
          >
            {templates.length}
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          overflowX: 'auto',
        }}
      >
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: selectedCategory === 'all' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            color: selectedCategory === 'all' ? 'white' : 'rgba(255, 255, 255, 0.6)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          All
        </button>
        {(Object.entries(CATEGORY_CONFIG) as [TemplateCategory, typeof CATEGORY_CONFIG.engagement][]).map(
          ([category, config]) => {
            const Icon = config.icon;
            const count = templates.filter((t) => t.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor:
                    selectedCategory === category ? `${config.color}20` : 'transparent',
                  color: selectedCategory === category ? config.color : 'rgba(255, 255, 255, 0.6)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon style={{ width: 14, height: 14 }} />
                {config.label}
                <span style={{ opacity: 0.7 }}>({count})</span>
              </button>
            );
          }
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            <Loader2
              style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }}
            />
            <span style={{ marginLeft: '8px' }}>Loading templates...</span>
          </div>
        ) : error ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '8px',
              color: '#EF4444',
              fontSize: '13px',
            }}
          >
            <AlertCircle style={{ width: 16, height: 16 }} />
            {error}
          </div>
        ) : (
          <>
            {/* No Template Option */}
            <button
              onClick={() => handleSelect(null)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '12px',
                borderRadius: '8px',
                border: `1px solid ${!templateId ? '#FF6B6B' : 'rgba(255, 255, 255, 0.1)'}`,
                backgroundColor: !templateId ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: !templateId ? '#FF6B6B' : 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '2px',
                  }}
                >
                  No Template
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Free-form content without structure
                </div>
              </div>
              {!templateId && <Check style={{ width: 18, height: 18, color: '#FF6B6B' }} />}
            </button>

            {/* Template Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              {filteredTemplates.map((template) => {
                const config = CATEGORY_CONFIG[template.category];
                const isSelected = templateId === template.id;

                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template.id)}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: `1px solid ${isSelected ? config.color : 'rgba(255, 255, 255, 0.1)'}`,
                      backgroundColor: isSelected ? `${config.color}15` : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 150ms',
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: `${config.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {React.createElement(config.icon, {
                          style: { width: 16, height: 16, color: config.color },
                        })}
                      </div>
                      {isSelected && <Check style={{ width: 18, height: 18, color: config.color }} />}
                    </div>

                    {/* Name */}
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.9)',
                        marginBottom: '4px',
                      }}
                    >
                      {template.name}
                      {template.is_system === 0 && (
                        <span
                          style={{
                            marginLeft: '6px',
                            fontSize: '10px',
                            color: 'rgba(255, 255, 255, 0.5)',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            padding: '1px 4px',
                            borderRadius: '3px',
                          }}
                        >
                          Custom
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {template.description && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.5)',
                          marginBottom: '8px',
                          lineHeight: 1.4,
                        }}
                      >
                        {template.description}
                      </div>
                    )}

                    {/* Platforms */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {template.platforms.map((platform) => (
                        <span
                          key={platform}
                          style={{
                            fontSize: '10px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {PLATFORM_ICONS[platform] || ''} {platform}
                        </span>
                      ))}
                    </div>

                    {/* Structure preview */}
                    {template.structure.sections && (
                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        {template.structure.sections.length} sections
                        {template.structure.framework && ` • ${template.structure.framework}`}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {filteredTemplates.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '13px',
                }}
              >
                No templates in this category
              </div>
            )}
          </>
        )}
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

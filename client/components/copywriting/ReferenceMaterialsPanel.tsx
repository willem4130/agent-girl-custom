/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Reference Materials Panel - Manage brand reference materials
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Link,
  FileText,
  MessageSquare,
  FolderOpen,
  Trash2,
  Loader2,
  X,
  Tag,
} from 'lucide-react';

export type MaterialType = 'url' | 'file' | 'text' | 'project';

export interface ReferenceMaterial {
  id: string;
  brand_id: string;
  material_type: MaterialType;
  title: string;
  content: string;
  source_url?: string;
  tags: string[];
  created_at: string;
}

interface ReferenceMaterialsPanelProps {
  brandId: string; // Used for future features like URL scraping
  materials: ReferenceMaterial[];
  isLoading?: boolean;
  onAdd: (material: Omit<ReferenceMaterial, 'id' | 'brand_id' | 'created_at'>) => Promise<void>;
  onDelete: (materialId: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

const MATERIAL_TYPE_CONFIG: Record<
  MaterialType,
  { icon: React.ElementType; label: string; color: string }
> = {
  url: { icon: Link, label: 'URL', color: '#3B82F6' },
  file: { icon: FileText, label: 'File', color: '#10B981' },
  text: { icon: MessageSquare, label: 'Text', color: '#F59E0B' },
  project: { icon: FolderOpen, label: 'Project', color: '#8B5CF6' },
};

export function ReferenceMaterialsPanel({
  brandId: _brandId, // Reserved for future URL auto-scraping feature
  materials,
  isLoading,
  onAdd,
  onDelete,
}: ReferenceMaterialsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<MaterialType>('url');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formTags, setFormTags] = useState('');

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormUrl('');
    setFormTags('');
    setAddType('url');
  };

  const handleAdd = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;

    setIsAdding(true);
    try {
      await onAdd({
        material_type: addType,
        title: formTitle.trim(),
        content: formContent.trim(),
        source_url: addType === 'url' ? formUrl.trim() : undefined,
        tags: formTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      resetForm();
      setShowAddModal(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    setDeletingId(materialId);
    try {
      await onDelete(materialId);
    } finally {
      setDeletingId(null);
    }
  };

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
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>Reference Materials</span>
          <span
            style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 8px',
              borderRadius: '10px',
            }}
          >
            {materials.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp style={{ width: 18, height: 18, color: 'rgba(255, 255, 255, 0.5)' }} />
        ) : (
          <ChevronDown style={{ width: 18, height: 18, color: 'rgba(255, 255, 255, 0.5)' }} />
        )}
      </button>

      {/* Content */}
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
              <span style={{ marginLeft: '8px', fontSize: '13px' }}>Loading materials...</span>
            </div>
          ) : (
            <>
              {/* Materials List */}
              {materials.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {materials.map((material) => {
                    const config = MATERIAL_TYPE_CONFIG[material.material_type];
                    const Icon = config.icon;

                    return (
                      <div
                        key={material.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            backgroundColor: `${config.color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon style={{ width: 14, height: 14, color: config.color }} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: 'rgba(255, 255, 255, 0.9)',
                              marginBottom: '2px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {material.title}
                          </div>

                          {material.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                              {material.tags.slice(0, 3).map((tag, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: '10px',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleDelete(material.id)}
                          disabled={deletingId === material.id}
                          style={{
                            padding: '4px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: deletingId === material.id ? 'not-allowed' : 'pointer',
                            color: 'rgba(255, 255, 255, 0.4)',
                            borderRadius: '4px',
                            transition: 'all 150ms',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#EF4444';
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {deletingId === material.id ? (
                            <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Trash2 style={{ width: 14, height: 14 }} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textAlign: 'center',
                    padding: '16px',
                    marginBottom: '12px',
                  }}
                >
                  No reference materials yet. Add URLs, text snippets, or documents.
                </div>
              )}

              {/* Add Button */}
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'transparent',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 150ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                <Plus style={{ width: 14, height: 14 }} />
                Add Reference
              </button>
            </>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: '500px',
              backgroundColor: 'rgb(38, 40, 42)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>Add Reference Material</span>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px' }}>
              {/* Type Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '8px' }}>
                  Type
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(Object.entries(MATERIAL_TYPE_CONFIG) as [MaterialType, typeof MATERIAL_TYPE_CONFIG.url][]).map(
                    ([type, config]) => {
                      const Icon = config.icon;
                      const isSelected = addType === type;

                      return (
                        <button
                          key={type}
                          onClick={() => setAddType(type)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            border: `1px solid ${isSelected ? config.color : 'rgba(255, 255, 255, 0.1)'}`,
                            backgroundColor: isSelected ? `${config.color}15` : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 150ms',
                          }}
                        >
                          <Icon style={{ width: 16, height: 16, color: isSelected ? config.color : 'rgba(255, 255, 255, 0.5)' }} />
                          <span style={{ fontSize: '11px', color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.7)' }}>
                            {config.label}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '6px' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="E.g., Competitor landing page"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* URL (if type is URL) */}
              {addType === 'url' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '6px' }}>
                    URL
                  </label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://example.com/page"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              {/* Content */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '6px' }}>
                  {addType === 'url' ? 'Notes (or paste content)' : 'Content'}
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={
                    addType === 'url'
                      ? 'Add notes or paste the page content here...'
                      : 'Paste or type the content here...'
                  }
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Tags */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '6px' }}>
                  <Tag style={{ width: 12, height: 12, display: 'inline', marginRight: '4px' }} />
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="E.g., inspiration, competitor, tone"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'transparent',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={isAdding || !formTitle.trim() || !formContent.trim()}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
                    color: '#1a1a1a',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: isAdding ? 'not-allowed' : 'pointer',
                    opacity: isAdding || !formTitle.trim() || !formContent.trim() ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {isAdding ? (
                    <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Plus style={{ width: 14, height: 14 }} />
                  )}
                  Add Reference
                </button>
              </div>
            </div>
          </div>
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

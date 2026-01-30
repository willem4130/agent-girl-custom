/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * BrandFormatsPanel - Manage brand-specific content formats
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Star,
  Loader2,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import {
  getFormatIcon,
  type BrandContentFormat,
} from './ContentTypeSelector';

// ============================================================================
// TYPES
// ============================================================================

interface BrandFormatsPanelProps {
  brandId: string;
  onFormatsChange?: () => void;
}

interface FormatFormData {
  formatType: string;
  customLabel: string;
  description: string;
  icon: string;
  colorScheme: {
    color: string;
    bgColor: string;
    borderColor: string;
  };
  lengthConstraints: {
    min?: number;
    max?: number;
    optimal?: number;
    unit?: 'chars' | 'words';
  };
}

// ============================================================================
// DEFAULT FORMAT OPTIONS
// ============================================================================

const DEFAULT_FORMAT_OPTIONS = [
  { type: 'linkedin_post', label: 'LinkedIn Post', icon: 'linkedin', color: '#0A66C2' },
  { type: 'facebook_post', label: 'Facebook Post', icon: 'facebook', color: '#1877F2' },
  { type: 'instagram_post', label: 'Instagram Post', icon: 'instagram', color: '#E4405F' },
  { type: 'twitter_post', label: 'Twitter/X Post', icon: 'twitter', color: '#1DA1F2' },
  { type: 'article', label: 'Article / Blog', icon: 'file-text', color: '#10B981' },
  { type: 'newsletter', label: 'Newsletter', icon: 'mail', color: '#F59E0B' },
  { type: 'custom', label: 'Custom Format', icon: 'sparkles', color: '#8B5CF6' },
];

// ============================================================================
// HELPERS
// ============================================================================

function getDefaultColorScheme(color: string) {
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return {
    color,
    bgColor: `rgba(${r},${g},${b},0.1)`,
    borderColor: `rgba(${r},${g},${b},0.3)`,
  };
}

// ============================================================================
// COLLAPSIBLE SECTION
// ============================================================================

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  badge,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {title}
          </span>
          {badge}
        </div>
        {isOpen ? (
          <ChevronUp style={{ width: 14, height: 14, color: 'rgba(255, 255, 255, 0.4)' }} />
        ) : (
          <ChevronDown style={{ width: 14, height: 14, color: 'rgba(255, 255, 255, 0.4)' }} />
        )}
      </button>
      {isOpen && (
        <div style={{ paddingTop: '12px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FORMAT ROW COMPONENT
// ============================================================================

interface FormatRowProps {
  format: BrandContentFormat;
  onToggle: (formatId: string, enabled: boolean) => void;
  onSetDefault: (formatId: string) => void;
  onDelete: (formatId: string) => void;
  onUpdate: (formatId: string, updates: Partial<FormatFormData>) => void;
}

function FormatRow({ format, onToggle, onSetDefault, onDelete, onUpdate }: FormatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(format.custom_label || format.format_type);

  const Icon = getFormatIcon(format.icon);
  const colors = format.color_scheme || {
    color: '#8B5CF6',
    bgColor: 'rgba(139,92,246,0.1)',
    borderColor: 'rgba(139,92,246,0.3)',
  };
  const isEnabled = format.is_enabled === 1;
  const isDefault = format.is_default === 1;

  const handleSaveLabel = () => {
    if (editLabel.trim() && editLabel !== format.custom_label) {
      onUpdate(format.id, { customLabel: editLabel.trim() });
    }
    setIsEditing(false);
  };

  return (
    <div
      style={{
        borderRadius: '8px',
        border: `1px solid ${isEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
        backgroundColor: isEnabled ? 'rgba(255,255,255,0.02)' : 'transparent',
        marginBottom: '8px',
        opacity: isEnabled ? 1 : 0.6,
      }}
    >
      {/* Main row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
          gap: '10px',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: colors.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon style={{ width: 16, height: 16, color: colors.color }} />
        </div>

        {/* Label (editable) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveLabel();
                  if (e.key === 'Escape') {
                    setEditLabel(format.custom_label || format.format_type);
                    setIsEditing(false);
                  }
                }}
                autoFocus
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSaveLabel}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#10B981',
                }}
              >
                <Check style={{ width: 14, height: 14 }} />
              </button>
              <button
                onClick={() => {
                  setEditLabel(format.custom_label || format.format_type);
                  setIsEditing(false);
                }}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'white',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {format.custom_label || format.format_type}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '2px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)',
                  opacity: 0.6,
                }}
                title="Edit label"
              >
                <Pencil style={{ width: 12, height: 12 }} />
              </button>
              {isDefault && (
                <span
                  style={{
                    fontSize: '10px',
                    color: '#F59E0B',
                    backgroundColor: 'rgba(245,158,11,0.15)',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontWeight: 500,
                  }}
                >
                  Default
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Set default */}
          <button
            onClick={() => !isDefault && onSetDefault(format.id)}
            disabled={isDefault}
            title={isDefault ? 'This is the default format' : 'Set as default'}
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: isDefault ? 'default' : 'pointer',
              color: isDefault ? '#F59E0B' : 'rgba(255,255,255,0.3)',
            }}
          >
            <Star style={{ width: 14, height: 14, fill: isDefault ? '#F59E0B' : 'none' }} />
          </button>

          {/* Toggle enabled */}
          <button
            onClick={() => onToggle(format.id, !isEnabled)}
            title={isEnabled ? 'Disable format' : 'Enable format'}
            style={{
              width: '36px',
              height: '20px',
              borderRadius: '10px',
              backgroundColor: isEnabled ? '#10B981' : 'rgba(255,255,255,0.1)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 200ms ease',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: isEnabled ? '18px' : '2px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: 'white',
                transition: 'left 200ms ease',
              }}
            />
          </button>

          {/* Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title="Edit details"
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            {isExpanded ? (
              <ChevronUp style={{ width: 14, height: 14 }} />
            ) : (
              <ChevronDown style={{ width: 14, height: 14 }} />
            )}
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(format.id)}
            title="Delete format"
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,100,100,0.6)',
            }}
          >
            <Trash2 style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div
          style={{
            padding: '12px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            fontSize: '12px',
          }}
        >
          {/* Description */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', color: 'rgba(255,255,255,0.5)' }}>
              Description
            </label>
            <textarea
              value={format.description || ''}
              onChange={(e) => onUpdate(format.id, { description: e.target.value })}
              placeholder="Brief description of this format..."
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '12px',
                resize: 'vertical',
                minHeight: '60px',
                outline: 'none',
              }}
            />
          </div>

          {/* Length constraints */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.5)' }}>
              Length Constraints
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '80px' }}>
                <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                  Min
                </label>
                <input
                  type="number"
                  value={format.length_constraints?.min || ''}
                  onChange={(e) => {
                    const lc = format.length_constraints || { unit: 'chars' };
                    onUpdate(format.id, {
                      lengthConstraints: { ...lc, min: e.target.value ? parseInt(e.target.value) : undefined },
                    });
                  }}
                  placeholder="Min"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ flex: '1', minWidth: '80px' }}>
                <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                  Optimal
                </label>
                <input
                  type="number"
                  value={format.length_constraints?.optimal || ''}
                  onChange={(e) => {
                    const lc = format.length_constraints || { unit: 'chars' };
                    onUpdate(format.id, {
                      lengthConstraints: { ...lc, optimal: e.target.value ? parseInt(e.target.value) : undefined },
                    });
                  }}
                  placeholder="Target"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ flex: '1', minWidth: '80px' }}>
                <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                  Max
                </label>
                <input
                  type="number"
                  value={format.length_constraints?.max || ''}
                  onChange={(e) => {
                    const lc = format.length_constraints || { unit: 'chars' };
                    onUpdate(format.id, {
                      lengthConstraints: { ...lc, max: e.target.value ? parseInt(e.target.value) : undefined },
                    });
                  }}
                  placeholder="Max"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ width: '90px' }}>
                <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                  Unit
                </label>
                <select
                  value={format.length_constraints?.unit || 'chars'}
                  onChange={(e) => {
                    const lc = format.length_constraints || {};
                    onUpdate(format.id, {
                      lengthConstraints: { ...lc, unit: e.target.value as 'chars' | 'words' },
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="chars">chars</option>
                  <option value="words">words</option>
                </select>
              </div>
            </div>
          </div>

          {/* Format type info */}
          <div
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.3)',
              marginTop: '8px',
            }}
          >
            Type: {format.format_type} | Icon: {format.icon || 'default'}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ADD FORMAT MODAL
// ============================================================================

interface AddFormatModalProps {
  onAdd: (formatType: string, customLabel: string) => void;
  onClose: () => void;
  existingTypes: string[];
}

function AddFormatModal({ onAdd, onClose, existingTypes }: AddFormatModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [customLabel, setCustomLabel] = useState('');

  const availableTypes = DEFAULT_FORMAT_OPTIONS.filter(
    (opt) => !existingTypes.includes(opt.type) || opt.type === 'custom'
  );

  const handleAdd = () => {
    if (selectedType) {
      const option = DEFAULT_FORMAT_OPTIONS.find((o) => o.type === selectedType);
      onAdd(selectedType, customLabel || option?.label || selectedType);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'rgb(35, 37, 39)',
          borderRadius: '12px',
          padding: '20px',
          width: '360px',
          maxWidth: '90vw',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'white', fontWeight: 600 }}>
          Add Content Format
        </h3>

        {/* Format type selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            Format Type
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {availableTypes.map((opt) => {
              const Icon = getFormatIcon(opt.icon);
              const isSelected = selectedType === opt.type;
              return (
                <button
                  key={opt.type}
                  onClick={() => {
                    setSelectedType(opt.type);
                    if (!customLabel) setCustomLabel(opt.label);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${isSelected ? opt.color : 'rgba(255,255,255,0.1)'}`,
                    backgroundColor: isSelected ? getDefaultColorScheme(opt.color).bgColor : 'transparent',
                    cursor: 'pointer',
                    color: isSelected ? 'white' : 'rgba(255,255,255,0.7)',
                    fontSize: '12px',
                  }}
                >
                  <Icon style={{ width: 14, height: 14, color: opt.color }} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom label */}
        {selectedType && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              Display Label
            </label>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="e.g., Nieuwsbrief"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedType}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedType ? '#10B981' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: selectedType ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            Add Format
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BrandFormatsPanel({ brandId, onFormatsChange }: BrandFormatsPanelProps) {
  const [formats, setFormats] = useState<BrandContentFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initializing, setInitializing] = useState(false);

  // Fetch formats
  const fetchFormats = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/copywriting/brands/${brandId}/formats`);
      if (!response.ok) throw new Error('Failed to fetch formats');
      const data = await response.json();
      setFormats(data.formats || []);
    } catch (err) {
      console.error('Error fetching formats:', err);
      setError('Failed to load formats');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchFormats();
  }, [fetchFormats]);

  // Initialize default formats
  const handleInitialize = async () => {
    setInitializing(true);
    try {
      const response = await fetch(`/api/copywriting/brands/${brandId}/formats/init`, {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initialize formats');
      }
      await fetchFormats();
      onFormatsChange?.();
    } catch (err) {
      console.error('Error initializing formats:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize');
    } finally {
      setInitializing(false);
    }
  };

  // Toggle format enabled/disabled
  const handleToggle = async (formatId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/copywriting/formats/${formatId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error('Failed to toggle format');
      await fetchFormats();
      onFormatsChange?.();
    } catch (err) {
      console.error('Error toggling format:', err);
    }
  };

  // Set format as default
  const handleSetDefault = async (formatId: string) => {
    try {
      const response = await fetch(`/api/copywriting/formats/${formatId}/default`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to set default');
      await fetchFormats();
      onFormatsChange?.();
    } catch (err) {
      console.error('Error setting default:', err);
    }
  };

  // Delete format
  const handleDelete = async (formatId: string) => {
    if (!confirm('Delete this content format?')) return;
    try {
      const response = await fetch(`/api/copywriting/formats/${formatId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete format');
      await fetchFormats();
      onFormatsChange?.();
    } catch (err) {
      console.error('Error deleting format:', err);
    }
  };

  // Update format
  const handleUpdate = async (formatId: string, updates: Partial<FormatFormData>) => {
    try {
      const response = await fetch(`/api/copywriting/formats/${formatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update format');
      await fetchFormats();
      onFormatsChange?.();
    } catch (err) {
      console.error('Error updating format:', err);
    }
  };

  // Add new format
  const handleAddFormat = async (formatType: string, customLabel: string) => {
    const option = DEFAULT_FORMAT_OPTIONS.find((o) => o.type === formatType);
    try {
      const response = await fetch(`/api/copywriting/brands/${brandId}/formats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formatType,
          customLabel,
          icon: option?.icon,
          colorScheme: option ? getDefaultColorScheme(option.color) : undefined,
        }),
      });
      if (!response.ok) throw new Error('Failed to add format');
      setShowAddModal(false);
      await fetchFormats();
      onFormatsChange?.();
    } catch (err) {
      console.error('Error adding format:', err);
    }
  };

  const enabledCount = formats.filter((f) => f.is_enabled === 1).length;

  return (
    <CollapsibleSection
      title="Content Formats"
      defaultOpen={true}
      badge={
        formats.length > 0 ? (
          <span
            style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.4)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              padding: '2px 6px',
              borderRadius: '8px',
            }}
          >
            {enabledCount}/{formats.length} active
          </span>
        ) : null
      }
    >
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
          <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
          Loading formats...
        </div>
      ) : error ? (
        <div style={{ color: 'rgba(255,100,100,0.8)', fontSize: '12px' }}>{error}</div>
      ) : formats.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '12px' }}>
            No content formats configured.
          </p>
          <button
            onClick={handleInitialize}
            disabled={initializing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              backgroundColor: '#10B981',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: initializing ? 'wait' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {initializing ? (
              <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
            ) : (
              <Plus style={{ width: 14, height: 14 }} />
            )}
            Initialize Default Formats
          </button>
        </div>
      ) : (
        <>
          {/* Format list */}
          {formats.map((format) => (
            <FormatRow
              key={format.id}
              format={format}
              onToggle={handleToggle}
              onSetDefault={handleSetDefault}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}

          {/* Add format button */}
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
              padding: '10px',
              backgroundColor: 'transparent',
              border: '1px dashed rgba(255,255,255,0.15)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: '12px',
              marginTop: '4px',
            }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            Add Format
          </button>
        </>
      )}

      {/* Add format modal */}
      {showAddModal && (
        <AddFormatModal
          onAdd={handleAddFormat}
          onClose={() => setShowAddModal(false)}
          existingTypes={formats.map((f) => f.format_type)}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </CollapsibleSection>
  );
}

export default BrandFormatsPanel;

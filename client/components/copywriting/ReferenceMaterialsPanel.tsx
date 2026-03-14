/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Reference Materials Panel - Manage brand reference materials
 * Supports URL, text, file, and project folder references
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
  File,
  Search,
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
  // File reference fields
  file_path?: string;
  is_folder?: number;
  folder_depth?: number;
  file_patterns?: string;
  created_at: string;
}

// Extended interface for creating new references
export interface NewReferenceMaterial {
  material_type: MaterialType;
  title: string;
  content: string;
  source_url?: string;
  tags: string[];
  // File reference fields
  filePath?: string;
  filePaths?: string[]; // For multiple file selection
  isFolder?: boolean;
  folderDepth?: number;
  filePatterns?: string[];
}

// File System Access API types (for TypeScript)
interface FileSystemFileHandle {
  name: string;
  kind: 'file';
  getFile(): Promise<File>;
}

interface FileSystemDirectoryHandle {
  name: string;
  kind: 'directory';
}

declare global {
  interface Window {
    showOpenFilePicker?: (options?: {
      multiple?: boolean;
      types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle[]>;
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

interface ReferenceMaterialsPanelProps {
  brandId: string;
  materials: ReferenceMaterial[];
  isLoading?: boolean;
  onAdd: (material: NewReferenceMaterial) => Promise<void>;
  onDelete: (materialId: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

const MATERIAL_TYPE_CONFIG: Record<
  MaterialType,
  { icon: React.ElementType; label: string; color: string; description: string }
> = {
  url: { icon: Link, label: 'URL', color: '#3B82F6', description: 'Webpage or article link' },
  file: { icon: FileText, label: 'File', color: '#10B981', description: 'Local file path' },
  text: { icon: MessageSquare, label: 'Text', color: '#F59E0B', description: 'Pasted content' },
  project: { icon: FolderOpen, label: 'Folder', color: '#8B5CF6', description: 'Project folder' },
};

// Common file patterns for quick selection
const COMMON_FILE_PATTERNS = [
  { label: 'Markdown', patterns: ['*.md'] },
  { label: 'Text', patterns: ['*.txt'] },
  { label: 'Code', patterns: ['*.ts', '*.tsx', '*.js', '*.jsx'] },
  { label: 'Config', patterns: ['*.json', '*.yaml', '*.yml'] },
  { label: 'Styles', patterns: ['*.css'] },
];

export function ReferenceMaterialsPanel({
  brandId: _brandId,
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
  // File reference form state
  const [formFilePath, setFormFilePath] = useState('');
  const [formFilePaths, setFormFilePaths] = useState<string[]>([]); // Multiple files
  const [formIsFolder, setFormIsFolder] = useState(false);
  const [formFolderDepth, setFormFolderDepth] = useState(3);
  const [formFilePatterns, setFormFilePatterns] = useState<string[]>([]);

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormUrl('');
    setFormTags('');
    setFormFilePath('');
    setFormFilePaths([]);
    setFormIsFolder(false);
    setFormFolderDepth(3);
    setFormFilePatterns([]);
    setAddType('url');
  };

  // File System Access API handlers
  const handleBrowseFiles = async () => {
    if (!window.showOpenFilePicker) {
      alert('File picker not supported in this browser. Please enter the path manually.');
      return;
    }

    try {
      const handles = await window.showOpenFilePicker({
        multiple: true,
        types: [
          {
            description: 'Documents',
            accept: {
              'text/*': ['.txt', '.md', '.html', '.css', '.json', '.xml', '.csv'],
              'application/pdf': ['.pdf'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
              'application/msword': ['.doc'],
              'application/vnd.ms-excel': ['.xls'],
              'application/vnd.ms-powerpoint': ['.ppt'],
            },
          },
        ],
      });

      // Get file names (full paths not available in browser for security)
      const names = handles.map((h) => h.name);

      if (names.length === 1) {
        // Single file - user needs to provide full path
        setFormFilePath(names[0]);
        if (!formTitle) {
          setFormTitle(names[0].replace(/\.[^/.]+$/, ''));
        }
      } else {
        // Multiple files - store names, user provides base path
        setFormFilePaths(names);
        if (!formTitle) {
          setFormTitle(`${names.length} files selected`);
        }
      }
    } catch (err) {
      // User cancelled or error
      if ((err as Error).name !== 'AbortError') {
        console.error('File picker error:', err);
      }
    }
  };

  const handleBrowseFolder = async () => {
    if (!window.showDirectoryPicker) {
      alert('Folder picker not supported in this browser. Please enter the path manually.');
      return;
    }

    try {
      const handle = await window.showDirectoryPicker();
      // We get the folder name but not the full path (browser security)
      setFormFilePath(handle.name);
      if (!formTitle) {
        setFormTitle(handle.name);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Folder picker error:', err);
      }
    }
  };

  const isFileType = addType === 'file' || addType === 'project';
  const hasFilePath = formFilePath.trim().length > 0;

  // For file types with a path, content is optional
  const canSubmit =
    formTitle.trim() &&
    (isFileType ? hasFilePath : formContent.trim());

  const handleAdd = async () => {
    if (!canSubmit) return;

    setIsAdding(true);
    try {
      const material: NewReferenceMaterial = {
        material_type: addType,
        title: formTitle.trim(),
        content: formContent.trim(),
        source_url: addType === 'url' ? formUrl.trim() : undefined,
        tags: formTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      // Add file reference fields for file/project types
      if (isFileType && hasFilePath) {
        material.filePath = formFilePath.trim();
        material.isFolder = addType === 'project' || formIsFolder;
        if (material.isFolder) {
          material.folderDepth = formFolderDepth;
          material.filePatterns = formFilePatterns.length > 0 ? formFilePatterns : undefined;
        }
      }

      await onAdd(material);
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

  const toggleFilePattern = (patterns: string[]) => {
    const hasAll = patterns.every((p) => formFilePatterns.includes(p));
    if (hasAll) {
      setFormFilePatterns(formFilePatterns.filter((p) => !patterns.includes(p)));
    } else {
      setFormFilePatterns([...new Set([...formFilePatterns, ...patterns])]);
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
                    const hasFileRef = !!material.file_path;
                    const tags = typeof material.tags === 'string'
                      ? JSON.parse(material.tags) as string[]
                      : material.tags;

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

                          {/* File path indicator */}
                          {hasFileRef && (
                            <div
                              style={{
                                fontSize: '11px',
                                color: 'rgba(255, 255, 255, 0.4)',
                                marginTop: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <File style={{ width: 10, height: 10 }} />
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {material.file_path}
                              </span>
                              {material.is_folder === 1 && (
                                <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                                  (depth: {material.folder_depth ?? 3})
                                </span>
                              )}
                            </div>
                          )}

                          {tags.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                              {tags.slice(0, 3).map((tag, i) => (
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
                  No reference materials yet. Add URLs, files, or text snippets.
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
              maxHeight: '85vh',
              backgroundColor: 'rgb(38, 40, 42)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
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
                flexShrink: 0,
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
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
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
                          onClick={() => {
                            setAddType(type);
                            // Reset file-specific fields when changing type
                            if (type !== 'file' && type !== 'project') {
                              setFormFilePath('');
                              setFormIsFolder(false);
                              setFormFilePatterns([]);
                            }
                            if (type === 'project') {
                              setFormIsFolder(true);
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '10px 6px',
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
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '6px' }}>
                  {MATERIAL_TYPE_CONFIG[addType].description}
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
                  placeholder={isFileType ? 'E.g., Project docs' : 'E.g., Competitor landing page'}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
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
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* File Path (if type is file or project) */}
              {isFileType && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '6px' }}>
                    {addType === 'project' ? 'Folder Path' : 'File Path(s)'}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={formFilePath}
                      onChange={(e) => setFormFilePath(e.target.value)}
                      placeholder={addType === 'project' ? '/path/to/project' : '/path/to/file.md'}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={addType === 'project' ? handleBrowseFolder : handleBrowseFiles}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 150ms',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                    >
                      <Search style={{ width: 14, height: 14 }} />
                      Browse
                    </button>
                  </div>

                  {/* Show selected files for multi-select */}
                  {formFilePaths.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                        Selected files (enter base path above):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {formFilePaths.map((name, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '11px',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: 'rgba(16, 185, 129, 0.9)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {name}
                            <button
                              type="button"
                              onClick={() => setFormFilePaths(formFilePaths.filter((_, idx) => idx !== i))}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                color: 'rgba(16, 185, 129, 0.7)',
                                display: 'flex',
                              }}
                            >
                              <X style={{ width: 10, height: 10 }} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '6px' }}>
                    {addType === 'file'
                      ? 'Supports: .txt, .md, .html, .pdf, .docx, .xlsx, .pptx, .json, .csv'
                      : 'Content will be read fresh each time (not cached)'}
                  </div>
                </div>
              )}

              {/* Is Folder toggle (only for file type, project is always folder) */}
              {addType === 'file' && (
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formIsFolder}
                      onChange={(e) => setFormIsFolder(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)' }}>
                      This is a folder (read all matching files)
                    </span>
                  </label>
                </div>
              )}

              {/* Folder options (when isFolder or project type) */}
              {isFileType && (addType === 'project' || formIsFolder) && (
                <>
                  {/* Folder Depth */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '6px' }}>
                      Max Folder Depth: {formFolderDepth}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={formFolderDepth}
                      onChange={(e) => setFormFolderDepth(parseInt(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>
                      <span>1 (shallow)</span>
                      <span>5 (deep)</span>
                    </div>
                  </div>

                  {/* File Patterns */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '8px' }}>
                      File Types to Include
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {COMMON_FILE_PATTERNS.map(({ label, patterns }) => {
                        const isSelected = patterns.every((p) => formFilePatterns.includes(p));
                        return (
                          <button
                            key={label}
                            onClick={() => toggleFilePattern(patterns)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: `1px solid ${isSelected ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                              backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                              color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.6)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 150ms',
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {formFilePatterns.length === 0 && (
                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '6px' }}>
                        No filter = all supported files (.md, .txt, .ts, .js, .json, etc.)
                      </div>
                    )}
                    {formFilePatterns.length > 0 && (
                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '6px' }}>
                        Patterns: {formFilePatterns.join(', ')}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Content */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '6px' }}>
                  {isFileType && hasFilePath
                    ? 'Notes (optional)'
                    : addType === 'url'
                    ? 'Notes (or paste content)'
                    : 'Content'}
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={
                    isFileType && hasFilePath
                      ? 'Optional notes about this reference...'
                      : addType === 'url'
                      ? 'Add notes or paste the page content here...'
                      : 'Paste or type the content here...'
                  }
                  rows={isFileType && hasFilePath ? 2 : 5}
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
                    boxSizing: 'border-box',
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
                    boxSizing: 'border-box',
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
                  disabled={isAdding || !canSubmit}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
                    color: '#1a1a1a',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: isAdding || !canSubmit ? 'not-allowed' : 'pointer',
                    opacity: isAdding || !canSubmit ? 0.5 : 1,
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

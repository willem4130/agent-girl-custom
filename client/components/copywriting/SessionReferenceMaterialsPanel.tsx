/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Session Reference Materials Panel - Manage chat session reference materials
 * Supports URL, text, file, and project folder references
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  Copy,
} from 'lucide-react';
import { useSessionReferencesAPI, type SessionReferenceMaterial, type AddReferenceInput } from '../../hooks/useSessionReferencesAPI';
import { useBrandAPI, type Brand } from '../../hooks/useBrandAPI';

export type MaterialType = 'url' | 'file' | 'text' | 'project';

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

interface SessionReferenceMaterialsPanelProps {
  sessionId?: string; // Optional - will create session lazily if not provided
  brandId?: string; // Optional: for copying brand refs
  defaultExpanded?: boolean;
  onCreateSession?: () => Promise<string | null>; // Callback to create session and return sessionId
  onSessionCreated?: (sessionId: string) => void; // Notify parent of new session
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

export function SessionReferenceMaterialsPanel({
  sessionId: initialSessionId,
  brandId,
  defaultExpanded = false,
  onCreateSession,
  onSessionCreated,
}: SessionReferenceMaterialsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [addType, setAddType] = useState<MaterialType>('url');
  const [isAdding, setIsAdding] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<SessionReferenceMaterial[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);

  // Update sessionId when prop changes
  useEffect(() => {
    setSessionId(initialSessionId);
  }, [initialSessionId]);

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
  const [formFileName, setFormFileName] = useState(''); // Track uploaded file name
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    isLoading,
    fetchSessionReferences,
    addSessionReference,
    deleteSessionReference,
    copyBrandRefsToSession,
  } = useSessionReferencesAPI();

  const { fetchBrands } = useBrandAPI();

  // Load materials on mount and when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setMaterials([]);
      return;
    }
    const loadMaterials = async () => {
      const refs = await fetchSessionReferences(sessionId);
      setMaterials(refs);
    };
    loadMaterials();
  }, [sessionId, fetchSessionReferences]);

  // Load brands when copy modal is opened
  useEffect(() => {
    if (showCopyModal) {
      fetchBrands().then(setBrands);
    }
  }, [showCopyModal, fetchBrands]);

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
    setFormFileName('');
    setAddType('url');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file selection via standard input (works in all browsers)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    setFormFileName(fileName);

    // Set title from filename if not already set
    if (!formTitle) {
      setFormTitle(fileName.replace(/\.[^/.]+$/, ''));
    }

    // Read file content
    const textExtensions = ['.txt', '.md', '.html', '.css', '.json', '.xml', '.csv', '.tsx', '.ts', '.js', '.jsx'];
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));

    if (textExtensions.includes(ext)) {
      // Read text content directly
      const content = await file.text();
      setFormContent(content.slice(0, 100000)); // Limit to 100KB
      setFormFilePath(''); // Clear file path since we have content
    } else {
      // For binary files, read as base64 data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        // For binary files, we store a note - server-side reading requires path
        setFormContent(`[Binary file: ${fileName}, ${(file.size / 1024).toFixed(1)}KB]\nNote: For binary files (PDF, DOCX, etc.), enter the full server path above for server-side reading, or paste the text content manually.`);
      };
      reader.readAsDataURL(file);
      setFormFilePath(fileName);
    }
  };

  // Trigger file input click
  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
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
  const hasContent = formContent.trim().length > 0;

  // For file types: need either file path (server reads) OR content (already read)
  // For other types: need content
  const canSubmit =
    formTitle.trim() &&
    (isFileType ? (hasFilePath || hasContent) : hasContent);

  // Ensure we have a session, creating one if needed
  const ensureSession = async (): Promise<string | null> => {
    if (sessionId) return sessionId;

    if (!onCreateSession) {
      console.error('No sessionId and no onCreateSession callback provided');
      return null;
    }

    setIsCreatingSession(true);
    try {
      const newSessionId = await onCreateSession();
      if (newSessionId) {
        setSessionId(newSessionId);
        onSessionCreated?.(newSessionId);
        return newSessionId;
      }
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleAdd = async () => {
    if (!canSubmit) return;

    setIsAdding(true);
    try {
      // Ensure we have a session first
      const activeSessionId = await ensureSession();
      if (!activeSessionId) {
        setIsAdding(false);
        return;
      }

      const input: AddReferenceInput = {
        materialType: addType,
        title: formTitle.trim(),
        content: formContent.trim(),
        sourceUrl: addType === 'url' ? formUrl.trim() : undefined,
        tags: formTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      // Add file reference fields for file/project types
      if (isFileType && hasFilePath) {
        input.filePath = formFilePath.trim();
        input.isFolder = addType === 'project' || formIsFolder;
        if (input.isFolder) {
          input.folderDepth = formFolderDepth;
          input.filePatterns = formFilePatterns.length > 0 ? formFilePatterns : undefined;
        }
      }

      const result = await addSessionReference(activeSessionId, input);
      if (result) {
        setMaterials((prev) => [...prev, result]);
        resetForm();
        setShowAddModal(false);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!sessionId) return;
    setDeletingId(materialId);
    try {
      const success = await deleteSessionReference(sessionId, materialId);
      if (success) {
        setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyFromBrand = useCallback(async (sourceBrandId: string) => {
    setIsCopying(true);
    try {
      // Ensure we have a session first
      const activeSessionId = await ensureSession();
      if (!activeSessionId) {
        setIsCopying(false);
        return;
      }

      const copiedCount = await copyBrandRefsToSession(activeSessionId, sourceBrandId);
      if (copiedCount > 0) {
        // Refresh materials list
        const refs = await fetchSessionReferences(activeSessionId);
        setMaterials(refs);
        setShowCopyModal(false);
      }
    } finally {
      setIsCopying(false);
    }
  }, [sessionId, onCreateSession, onSessionCreated, copyBrandRefsToSession, fetchSessionReferences]);

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

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{
                    flex: 1,
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
                  Add
                </button>

                <button
                  onClick={() => setShowCopyModal(true)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  <Copy style={{ width: 14, height: 14 }} />
                  From Brand
                </button>
              </div>
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
                    {/* Hidden file input for browse */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      accept=".txt,.md,.html,.css,.json,.xml,.csv,.tsx,.ts,.js,.jsx,.pdf,.docx,.xlsx,.pptx"
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* Show selected file name */}
                  {formFileName && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(16, 185, 129, 0.9)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <File style={{ width: 12, height: 12 }} />
                      <span>Uploaded: {formFileName}</span>
                      {formContent && !formContent.startsWith('[Binary') && (
                        <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          ({(formContent.length / 1024).toFixed(1)}KB content loaded)
                        </span>
                      )}
                    </div>
                  )}

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

      {/* Copy from Brand Modal */}
      {showCopyModal && (
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
          onClick={() => setShowCopyModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: '400px',
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
              <span style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>Copy from Brand</span>
              <button
                onClick={() => setShowCopyModal(false)}
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

            {/* Brand List */}
            <div style={{ padding: '16px 20px', maxHeight: '300px', overflowY: 'auto' }}>
              {brands.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', padding: '20px' }}>
                  No brands found
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {brands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => handleCopyFromBrand(brand.id)}
                      disabled={isCopying}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: brand.id === brandId ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: isCopying ? 'wait' : 'pointer',
                        textAlign: 'left',
                        transition: 'all 150ms',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onMouseEnter={(e) => {
                        if (!isCopying) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = brand.id === brandId ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)';
                      }}
                    >
                      <span>{brand.name}</span>
                      {brand.id === brandId && (
                        <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Current</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
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

/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Send, Plus, X, Square } from 'lucide-react';
import type { FileAttachment } from '../message/types';
import { ModeSelector } from './ModeSelector';
import { ModeIndicator } from './ModeIndicator';
import type { SlashCommand } from '../../hooks/useWebSocket';
import { CommandTextRenderer } from '../message/CommandTextRenderer';
import { BrandVoicePanel, ReferenceMaterialsPanel } from '../copywriting';
import type { NewReferenceMaterial } from '../copywriting/ReferenceMaterialsPanel';
import { ContentTypeQuickSelect, ContentFormatQuickSelect, type ContentType } from '../copywriting/ContentTypeSelector';
import { BrandFormatsPanel } from '../copywriting/BrandFormatsPanel';
import { useCopywritingContext } from '../../lib/stores/copywritingContext';
import {
  useBrandAPI,
  type VoiceProfile,
  type ScrapedContent,
  type VoiceAnalysis,
  type ReferenceMaterial,
} from '../../hooks/useBrandAPI';

interface CopywritingContextPayload {
  brandId?: string;
  contentTypes?: ContentType[];
  contentFormatIds?: string[];
  templateId?: string;
  tonePresetId?: string;
}

interface NewChatWelcomeProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (files?: FileAttachment[], mode?: 'general' | 'coder' | 'intense-research' | 'spark' | 'copywriting' | 'media', messageOverride?: string, fromQueue?: boolean, copywritingContext?: CopywritingContextPayload) => void;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  isPlanMode?: boolean;
  onTogglePlanMode?: () => void;
  availableCommands?: SlashCommand[];
  onOpenBuildWizard?: () => void;
  mode?: 'general' | 'coder' | 'intense-research' | 'spark' | 'copywriting' | 'media';
  onModeChange?: (mode: 'general' | 'coder' | 'intense-research' | 'spark' | 'copywriting' | 'media') => void;
  sessionId?: string;
  pendingMessagesCount?: number;
  selectedBrandId?: string | null;
  thinkingTokens?: number;
  onThinkingTokensChange?: (tokens: number) => void;
}

const CAPABILITIES = [
  "I can build websites for you",
  "I can research anything you want",
  "I can debug and fix your code",
  "I can automate repetitive tasks",
  "I can analyze data and files"
];

export function NewChatWelcome({ inputValue, onInputChange, onSubmit, onStop, disabled, isGenerating, isPlanMode, onTogglePlanMode, availableCommands = [], onOpenBuildWizard, mode, onModeChange, sessionId: _sessionId, pendingMessagesCount = 0, selectedBrandId: brandIdProp }: NewChatWelcomeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [_isDraggingOver, setIsDraggingOver] = useState(false);

  // Mode selection state (synchronized with parent via props)
  const [selectedMode, setSelectedModeInternal] = useState<'general' | 'coder' | 'intense-research' | 'spark' | 'copywriting' | 'media'>(mode || 'general');
  const setSelectedMode = (newMode: typeof selectedMode) => {
    setSelectedModeInternal(newMode);
    onModeChange?.(newMode);
  };

  // Sync local mode state with prop when it changes
  useEffect(() => {
    if (mode) {
      setSelectedModeInternal(mode);
    }
  }, [mode]);
  const [modeIndicatorWidth, setModeIndicatorWidth] = useState(80);

  // Brand management state (for copywriting mode)
  // Brand is now controlled by header selector in ChatContainer - use prop if provided
  const brandAPI = useBrandAPI();
  const copywritingContext = useCopywritingContext();
  const { templateId, tonePresetId } = copywritingContext;
  // Use prop from parent (header selector) if provided, otherwise fall back to context
  const selectedBrandId = brandIdProp ?? copywritingContext.brandId;
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysis | null>(null);
  const [scrapedContent, setScrapedContent] = useState<Map<string, ScrapedContent[]>>(new Map());
  const [referenceMaterials, setReferenceMaterials] = useState<ReferenceMaterial[]>([]);
  const [isBrandDataLoading, setIsBrandDataLoading] = useState(false);
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([]);
  // Initialize from context to persist across component remounts (e.g., when session is created)
  const [selectedFormatIds, setSelectedFormatIdsLocal] = useState<string[]>(copywritingContext.contentFormatIds);
  // Sync format selection to context
  const setSelectedFormatIds = (ids: string[]) => {
    setSelectedFormatIdsLocal(ids);
    copywritingContext.setContentFormatIds(ids);
  };

  // Sync format IDs from context when context changes (e.g., from ChatContainer)
  useEffect(() => {
    if (copywritingContext.contentFormatIds.length > 0 &&
        JSON.stringify(copywritingContext.contentFormatIds) !== JSON.stringify(selectedFormatIds)) {
      setSelectedFormatIdsLocal(copywritingContext.contentFormatIds);
    }
  }, [copywritingContext.contentFormatIds]);

  // Load voice profile and scraped content when brand is selected
  useEffect(() => {
    if (selectedBrandId) {
      loadBrandData(selectedBrandId);
    } else {
      setVoiceProfile(null);
    }
  }, [selectedBrandId]);

  const loadBrandData = useCallback(async (brandId: string) => {
    setIsBrandDataLoading(true);
    try {
      const [profile, analysis, content, references] = await Promise.all([
        brandAPI.fetchVoiceProfile(brandId),
        brandAPI.fetchVoiceAnalysis(brandId),
        brandAPI.fetchScrapedContent(brandId),
        brandAPI.fetchReferences(brandId),
      ]);
      setVoiceProfile(profile);
      setVoiceAnalysis(analysis);
      setScrapedContent((prev) => new Map(prev).set(brandId, content));
      setReferenceMaterials(references);
    } finally {
      setIsBrandDataLoading(false);
    }
  }, [brandAPI]);

  // Brand selection is now handled by header selector in ChatContainer

  const handleRefreshVoiceProfile = async (): Promise<void> => {
    if (!selectedBrandId) return;
    // For quick re-scrape, use analyzeBrand which now handles priority brands (SCEX) with deep crawl
    await brandAPI.analyzeBrand(selectedBrandId);
    await brandAPI.refreshVoiceProfile(selectedBrandId);
    await loadBrandData(selectedBrandId);
  };

  const handleDeepAnalyze = async (): Promise<void> => {
    if (!selectedBrandId) return;
    const result = await brandAPI.deepAnalyzeBrand(selectedBrandId, 30);
    if (result?.success) {
      await loadBrandData(selectedBrandId);
    }
  };

  // Reference materials handlers
  const handleAddReference = async (material: NewReferenceMaterial): Promise<void> => {
    if (!selectedBrandId) return;
    const result = await brandAPI.addReference(selectedBrandId, {
      materialType: material.material_type,
      title: material.title,
      content: material.content,
      sourceUrl: material.source_url,
      tags: material.tags,
      filePath: material.filePath,
      isFolder: material.isFolder,
      folderDepth: material.folderDepth,
      filePatterns: material.filePatterns,
    });
    if (result) {
      setReferenceMaterials((prev) => [result, ...prev]);
    }
  };

  const handleDeleteReference = async (materialId: string): Promise<void> => {
    const success = await brandAPI.deleteReference(materialId);
    if (success) {
      setReferenceMaterials((prev) => prev.filter((m) => m.id !== materialId));
    }
  };

  // Slash command autocomplete state
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  // Detect "/" at start of input for command autocomplete
  useEffect(() => {
    if (inputValue.startsWith('/') && availableCommands.length > 0) {
      const searchTerm = inputValue.slice(1).toLowerCase();
      const filtered = availableCommands.filter(cmd =>
        cmd.name.toLowerCase().includes(searchTerm)
      );
      setFilteredCommands(filtered);
      setShowCommandMenu(filtered.length > 0);
      setSelectedCommandIndex(0);
    } else {
      setShowCommandMenu(false);
    }
  }, [inputValue, availableCommands]);

  // Typewriter effect state
  const [currentCapabilityIndex, setCurrentCapabilityIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // User config state
  const [userName, setUserName] = useState<string | null>(null);

  // Load user config on mount
  useEffect(() => {
    fetch('/api/user-config')
      .then(res => res.json())
      .then(data => {
        if (data.displayName) {
          setUserName(data.displayName);
        }
      })
      .catch(err => {
        console.error('Failed to load user config:', err);
      });
  }, []);

  // Auto-focus on mount with slight delay to ensure DOM is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to recalculate
    textarea.style.height = '72px';

    // Set height based on scrollHeight, capped at max
    const newHeight = Math.min(textarea.scrollHeight, 144);
    textarea.style.height = `${newHeight}px`;
  }, [inputValue]);

  // Typewriter effect
  useEffect(() => {
    const currentText = CAPABILITIES[currentCapabilityIndex];

    if (isTyping) {
      if (displayedText.length < currentText.length) {
        const timer = setTimeout(() => {
          setDisplayedText(currentText.slice(0, displayedText.length + 1));
        }, 50);
        return () => clearTimeout(timer);
      } else {
        // Finished typing, wait before erasing
        const timer = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
        return () => clearTimeout(timer);
      }
    } else {
      // Erasing
      if (displayedText.length > 0) {
        const timer = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, 30);
        return () => clearTimeout(timer);
      } else {
        // Finished erasing, move to next capability
        setCurrentCapabilityIndex((prev) => (prev + 1) % CAPABILITIES.length);
        setIsTyping(true);
      }
    }
  }, [displayedText, isTyping, currentCapabilityIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle command menu navigation
    if (showCommandMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(prev => (prev > 0 ? prev - 1 : prev));
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        const selectedCommand = filteredCommands[selectedCommandIndex];
        if (selectedCommand) {
          const commandWithSlash = `/${selectedCommand.name} `;
          onInputChange(commandWithSlash);
          setShowCommandMenu(false);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandMenu(false);
        return;
      }
    }

    // Normal submit handling
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const copywritingContextPayload: CopywritingContextPayload | undefined = (selectedMode === 'copywriting' || selectedMode === 'media') && (selectedBrandId || selectedContentTypes.length > 0 || selectedFormatIds.length > 0)
        ? {
            brandId: selectedBrandId || undefined,
            contentTypes: selectedContentTypes.length > 0 ? selectedContentTypes : undefined,
            contentFormatIds: selectedFormatIds.length > 0 ? selectedFormatIds : undefined,
            templateId: templateId || undefined,
            tonePresetId: tonePresetId || undefined,
          }
        : undefined;
      onSubmit(attachedFiles.length > 0 ? attachedFiles : undefined, selectedMode, undefined, false, copywritingContextPayload);
      setAttachedFiles([]);
    }
  };

  const handleSubmit = () => {
    const copywritingContextPayload: CopywritingContextPayload | undefined = (selectedMode === 'copywriting' || selectedMode === 'media') && (selectedBrandId || selectedContentTypes.length > 0 || selectedFormatIds.length > 0)
      ? {
          brandId: selectedBrandId || undefined,
          contentTypes: selectedContentTypes.length > 0 ? selectedContentTypes : undefined,
          contentFormatIds: selectedFormatIds.length > 0 ? selectedFormatIds : undefined,
          templateId: templateId || undefined,
          tonePresetId: tonePresetId || undefined,
        }
      : undefined;
    onSubmit(attachedFiles.length > 0 ? attachedFiles : undefined, selectedMode, undefined, false, copywritingContextPayload);
    setAttachedFiles([]);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Only take the first file (max 1 at a time)
    if (files.length === 0) return;
    const file = files[0];

    const fileData: FileAttachment = {
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
    };

    // Read all files as base64 (for images and documents)
    const reader = new FileReader();
    const preview = await new Promise<string>((resolve) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    fileData.preview = preview;

    // Replace existing files (max 1 at a time)
    setAttachedFiles([fileData]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Only take the first file (max 1 at a time)
    const file = files[0];

    const fileData: FileAttachment = {
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
    };

    // Read all files as base64
    const reader = new FileReader();
    const preview = await new Promise<string>((resolve) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    fileData.preview = preview;

    // Replace existing files (max 1 at a time)
    setAttachedFiles([fileData]);
  };

  // Handle paste events for images (screenshots)
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length === 0) return;

    e.preventDefault();

    // Only take the first pasted image (max 1 at a time)
    const item = imageItems[0];
    const file = item.getAsFile();
    if (!file) return;

    const fileData: FileAttachment = {
      id: `${Date.now()}-${Math.random()}`,
      name: `pasted-image-${Date.now()}.${file.type.split('/')[1]}`,
      size: file.size,
      type: file.type,
    };

    // Read as base64
    const reader = new FileReader();
    const preview = await new Promise<string>((resolve) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    fileData.preview = preview;

    // Replace existing files (max 1 at a time)
    setAttachedFiles([fileData]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Media mode is now handled by ChatContainer directly
  // When user selects media mode here, submit triggers ChatContainer's currentSessionMode update

  return (
    <div
      className="flex-1 flex flex-col w-full overflow-y-auto"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="w-full max-w-4xl px-4 mx-auto my-auto py-8">
        {/* Greeting */}
        <div className="flex flex-col gap-1 justify-center items-center mb-8">
          <div className="flex flex-row justify-center gap-3 w-fit px-5">
            <div className="text-[40px] font-semibold line-clamp-1 text-gradient">
              {userName ? `Hi, ${userName}. I'm Agent girl` : "Hi. I'm Agent girl"}
            </div>
          </div>

          {/* Typewriter capabilities */}
          <div className="flex justify-center items-center mt-2 h-8">
            <div className="text-lg text-gray-400 font-medium flex items-center">
              <span>{displayedText}</span>
              <span className="inline-block w-[3px] h-[18px] bg-gray-400 ml-0.5 animate-blink"></span>
            </div>
          </div>
        </div>

        {/* Input Container */}
        <div className="w-full max-w-[960px] mx-auto">
          {/* Slash Command Autocomplete Menu - Above input */}
          {showCommandMenu && filteredCommands.length > 0 && (
            <div className="mb-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
              <div className="max-h-[240px] overflow-y-auto scrollbar-hidden py-2">
                {filteredCommands.map((cmd, index) => (
                  <button
                    key={cmd.name}
                    type="button"
                    onClick={() => {
                      onInputChange(`/${cmd.name} `);
                      setShowCommandMenu(false);
                      textareaRef.current?.focus();
                    }}
                    onMouseEnter={() => setSelectedCommandIndex(index)}
                    className={`w-full text-left px-4 py-5 transition-colors cursor-pointer ${
                      index < filteredCommands.length - 1 ? 'border-b border-gray-700' : ''
                    } ${index === selectedCommandIndex ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
                  >
                    <div className="font-mono text-sm text-blue-400">/{cmd.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{cmd.description}</div>
                    {cmd.argumentHint && (
                      <div className="text-xs text-gray-500 mt-1 font-mono">{cmd.argumentHint}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex gap-1.5 w-full">
            <div className="flex-1 flex flex-col relative w-full rounded-xl border-b-2 border-white/10 transition hover:bg-[#374151]" style={{ backgroundColor: 'rgb(38, 40, 42)' }}>
              {/* File attachments preview */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center mx-2 mt-2.5 -mb-1">
                  {attachedFiles.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      className="flex relative gap-1 items-center p-1.5 w-60 text-left bg-gray-800 rounded-2xl border border-gray-700 group"
                    >
                      {/* Preview thumbnail */}
                      <div className="flex justify-center items-center">
                        <div className="overflow-hidden relative flex-shrink-0 w-12 h-12 rounded-lg border border-gray-700">
                          {file.preview && file.type.startsWith('image/') ? (
                            <img
                              src={file.preview}
                              alt={file.name}
                              className="rounded-lg w-full h-full object-cover object-center"
                              draggable="false"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gray-800 text-gray-400 text-xs font-medium">
                              {file.name.split('.').pop()?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* File info */}
                      <div className="flex flex-col justify-center px-2.5 -space-y-0.5 flex-1 min-w-0 overflow-hidden">
                        <div className="mb-1 text-sm font-medium text-gray-100 truncate w-full">
                          {file.name}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 line-clamp-1">
                          <span>File</span>
                          <span className="capitalize">{formatFileSize(file.size)}</span>
                        </div>
                      </div>

                      {/* Remove button */}
                      <div className="absolute -top-1 -right-1">
                        <button
                          onClick={() => handleRemoveFile(file.id)}
                          className="invisible text-black bg-white rounded-full border border-white transition group-hover:visible"
                          type="button"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Textarea */}
              <div className="overflow-hidden relative px-2.5">
                {/* Mode Indicator */}
                <ModeIndicator mode={selectedMode} onWidthChange={setModeIndicatorWidth} />

                {/* Command Pill Overlay */}
                {inputValue.match(/(^|\s)(\/([a-z-]+))(?=\s|$)/m) && (
                  <div
                    className="absolute px-1 pt-3 w-full text-sm pointer-events-none z-10 text-gray-100"
                    style={{
                      minHeight: '72px',
                      maxHeight: '144px',
                      overflowY: 'auto',
                      textIndent: `${modeIndicatorWidth}px`,
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                    }}
                  >
                    <CommandTextRenderer content={inputValue} />
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  id="chat-input"
                  dir="auto"
                  value={inputValue}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="How can I help you today?"
                  className="px-1 pt-3 w-full text-sm bg-transparent resize-none scrollbar-hidden outline-hidden placeholder:text-white/40"
                  style={{
                    minHeight: '72px',
                    maxHeight: '144px',
                    overflowY: 'auto',
                    textIndent: `${modeIndicatorWidth}px`,
                    color: inputValue.match(/(^|\s)(\/([a-z-]+))(?=\s|$)/m) ? 'transparent' : 'rgb(243, 244, 246)',
                    caretColor: 'rgb(243, 244, 246)',
                  }}
                  disabled={disabled}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mx-3.5 mt-1.5 mb-3.5 max-w-full">
                <div className="self-end flex items-center gap-1.5">
                  {/* File Upload */}
                  <div className="flex gap-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.html,.md,.txt,.json,.xml,.csv"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <button
                      onClick={handleFileClick}
                      type="button"
                      className="border rounded-lg border-white/10 bg-transparent transition p-1.5 outline-none focus:outline-none text-white hover:bg-gray-800"
                      aria-label="Upload files"
                    >
                      <Plus className="size-5" />
                    </button>

                    {/* Plan Mode toggle button */}
                    {onTogglePlanMode && (
                      <button
                        onClick={onTogglePlanMode}
                        type="button"
                        className={`${isPlanMode ? 'send-button-active' : 'border border-white/10 bg-transparent text-white hover:bg-gray-800'} rounded-lg transition outline-none focus:outline-none`}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          padding: '0.375rem 0.75rem',
                        }}
                        title={isPlanMode ? "Plan Mode Active - Click to deactivate" : "Activate Plan Mode"}
                        aria-label={isPlanMode ? "Deactivate Plan Mode" : "Activate Plan Mode"}
                      >
                        Plan Mode
                      </button>
                    )}
                  </div>
                </div>

                {/* Send/Stop Button */}
                <div className="flex self-end space-x-1 shrink-0 items-center gap-2">
                  {/* Pending messages indicator */}
                  {pendingMessagesCount > 0 && (
                    <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">
                      {pendingMessagesCount} queued
                    </span>
                  )}
                  {isGenerating && (
                    <button
                      type="button"
                      onClick={onStop}
                      className="stop-button-active transition rounded-lg p-2 self-center"
                      aria-label="Stop Generating"
                    >
                      <Square className="size-4" fill="currentColor" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={disabled || !inputValue.trim()}
                    className={`transition rounded-lg p-2 self-center ${
                      !disabled && inputValue.trim()
                        ? 'send-button-active'
                        : 'bg-gray-500 text-white/40 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600'
                    }`}
                    aria-label={isGenerating ? "Queue Message" : "Send Message"}
                  >
                    <Send className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Mode Selector below input */}
          <div className="mt-6">
            <ModeSelector selectedMode={selectedMode} onSelectMode={setSelectedMode} onOpenBuildWizard={onOpenBuildWizard} />
          </div>

          {/* Copywriting Mode Options (brand is selected via header dropdown in ChatContainer) */}
          {selectedMode === 'copywriting' && (
            <>
              {/* Content Format Quick Select - use brand formats when brand selected, fallback to legacy */}
              {selectedBrandId ? (
                <ContentFormatQuickSelect
                  brandId={selectedBrandId}
                  selectedFormatIds={selectedFormatIds}
                  onToggle={(formatId) => {
                    const newIds = selectedFormatIds.includes(formatId)
                      ? selectedFormatIds.filter((id) => id !== formatId)
                      : [...selectedFormatIds, formatId];
                    setSelectedFormatIds(newIds);
                  }}
                  disabled={brandAPI.isLoading}
                />
              ) : (
                <ContentTypeQuickSelect
                  selectedTypes={selectedContentTypes}
                  onToggle={(type) => {
                    setSelectedContentTypes((prev) => {
                      // If already selected, remove it (and any auto-added types)
                      if (prev.includes(type)) {
                        // If removing article, also remove auto-added linkedin_post
                        if (type === 'article' && prev.includes('linkedin_post')) {
                          return prev.filter((t) => t !== type && t !== 'linkedin_post');
                        }
                        return prev.filter((t) => t !== type);
                      }

                      // Auto-add LinkedIn post when selecting Article
                      if (type === 'article' && !prev.includes('linkedin_post')) {
                        return [...prev, type, 'linkedin_post'];
                      }

                      return [...prev, type];
                    });
                  }}
                  disabled={brandAPI.isLoading}
                />
              )}

              {/* NOTE: PostTypeSelector and TonePresetSelector hidden for simplicity.
                  The LLM now asks for context via chat instead of requiring pre-selection.
                  Consistency is derived from top-performing LinkedIn posts (engagement metrics).
              */}

              {/* Reference Materials Panel - high priority, right after content formats */}
              {selectedBrandId && (
                <ReferenceMaterialsPanel
                  brandId={selectedBrandId}
                  materials={referenceMaterials.map((m) => ({
                    ...m,
                    tags: typeof m.tags === 'string' ? JSON.parse(m.tags) : m.tags,
                  }))}
                  isLoading={isBrandDataLoading}
                  onAdd={handleAddReference}
                  onDelete={handleDeleteReference}
                />
              )}

              {/* Brand Content Formats Panel when brand is selected */}
              {selectedBrandId && (
                <div className="mt-4">
                  <BrandFormatsPanel
                    brandId={selectedBrandId}
                    onFormatsChange={() => {
                      // Clear selected format IDs when formats change
                      setSelectedFormatIds([]);
                    }}
                  />
                </div>
              )}

              {/* Voice Profile Panel when brand is selected */}
              {selectedBrandId && (
                <BrandVoicePanel
                  voiceProfile={voiceProfile}
                  voiceAnalysis={voiceAnalysis}
                  scrapedContent={scrapedContent.get(selectedBrandId) || []}
                  isLoading={isBrandDataLoading}
                  onRefresh={handleRefreshVoiceProfile}
                  onDeepAnalyze={handleDeepAnalyze}
                />
              )}

              {/* Copy Library Panel moved to right sidebar in ChatContainer */}
            </>
          )}

          {/* Media Mode now shows full canvas via early return above */}
        </div>
      </div>

      {/* Brand Form Modal */}
    </div>
  );
}

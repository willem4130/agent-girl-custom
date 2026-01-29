/**
 * Copy Export Modal
 *
 * Modal for exporting copy in different formats with:
 * - Format preview
 * - Copy to clipboard
 * - Save to file (triggers native file save dialog)
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  FileText,
  Globe,
  Linkedin,
  Code,
} from 'lucide-react';
import type { CopyFormat, FormattedCopy } from '../../hooks/useCopyLibrary';

interface CopyExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  copyId: string;
  copyTitle: string;
  getFormattedCopy: (copyId: string) => Promise<FormattedCopy | null>;
}

const FORMAT_CONFIG: Record<CopyFormat, { label: string; icon: React.ReactNode; extension: string; color: string }> = {
  wordpress: { label: 'WordPress HTML', icon: <Globe size={16} />, extension: 'html', color: '#21759B' },
  linkedin: { label: 'LinkedIn', icon: <Linkedin size={16} />, extension: 'txt', color: '#0A66C2' },
  markdown: { label: 'Markdown', icon: <Code size={16} />, extension: 'md', color: '#83CD29' },
  raw: { label: 'Plain Text', icon: <FileText size={16} />, extension: 'txt', color: 'rgba(255,255,255,0.6)' },
};

export function CopyExportModal({
  isOpen,
  onClose,
  copyId,
  copyTitle,
  getFormattedCopy,
}: CopyExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<CopyFormat>('linkedin');
  const [formattedCopy, setFormattedCopy] = useState<FormattedCopy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch formatted copy when modal opens
  useEffect(() => {
    if (isOpen && copyId) {
      setIsLoading(true);
      getFormattedCopy(copyId).then((data) => {
        setFormattedCopy(data);
        setIsLoading(false);
      });
    }
  }, [isOpen, copyId, getFormattedCopy]);

  // Reset copied state when format changes
  useEffect(() => {
    setCopied(false);
  }, [selectedFormat]);

  if (!isOpen) return null;

  const currentText = formattedCopy?.[selectedFormat] || '';
  const config = FORMAT_CONFIG[selectedFormat];

  const handleCopyToClipboard = async () => {
    await navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToFile = () => {
    const blob = new Blob([currentText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${copyTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${config.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="bg-[rgb(30,32,34)] rounded-xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Export Copy</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Format Tabs */}
        <div className="flex gap-2 p-4 border-b border-white/10">
          {(Object.keys(FORMAT_CONFIG) as CopyFormat[]).map((format) => {
            const cfg = FORMAT_CONFIG[format];
            const isActive = selectedFormat === format;
            return (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 border border-white/20'
                    : 'bg-transparent border border-transparent hover:bg-white/5'
                }`}
                style={{ color: isActive ? cfg.color : 'rgba(255,255,255,0.6)' }}
              >
                {cfg.icon}
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="text-xs text-white/40 mb-2">Preview ({config.extension})</div>
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-white/50">
              Loading...
            </div>
          ) : (
            <pre
              className="bg-black/30 rounded-lg p-4 text-sm text-white/80 overflow-auto max-h-[300px] whitespace-pre-wrap font-mono"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.2) transparent',
              }}
            >
              {currentText || 'No content available'}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 p-4 border-t border-white/10">
          <div className="text-xs text-white/40">
            {currentText.length} characters
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveToFile}
              disabled={!currentText}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              Save As...
            </button>
            <button
              onClick={handleCopyToClipboard}
              disabled={!currentText}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                copied
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                  : 'bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

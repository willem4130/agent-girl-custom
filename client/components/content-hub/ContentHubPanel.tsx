/**
 * ContentHubPanel Component
 *
 * Slide-in panel wrapper for the Content Hub.
 * Can be toggled from both Copywriting and Media modes.
 */

import { useState, useEffect } from 'react';
import { X, Layers } from 'lucide-react';
import { ContentHub } from './ContentHub';
import type { UnifiedContentItem } from '../../hooks/useContentHub';

interface ContentHubPanelProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string | null;
  currentMode: 'copywriting' | 'media';
  onGenerateFromCopy?: (copyId: string, copyText: string) => void;
  onUseAsReference?: (item: UnifiedContentItem) => void;
}

export function ContentHubPanel({
  isOpen,
  onClose,
  brandId,
  currentMode,
  onGenerateFromCopy,
  onUseAsReference,
}: ContentHubPanelProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 200); // Wait for animation
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${
          isAnimating && isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-lg bg-gray-900 shadow-2xl z-50 transform transition-transform duration-200 ${
          isAnimating && isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition z-10"
        >
          <X className="size-5" />
        </button>

        {/* Content */}
        {brandId ? (
          <ContentHub
            brandId={brandId}
            currentMode={currentMode}
            onGenerateFromCopy={onGenerateFromCopy}
            onUseAsReference={onUseAsReference}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Layers className="size-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Brand Selected</h3>
            <p className="text-sm text-gray-400">
              Select a brand to view all its content in the Content Hub.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * ContentHubToggle Component
 *
 * Button to toggle the Content Hub panel.
 */
interface ContentHubToggleProps {
  onClick: () => void;
  isActive?: boolean;
}

export function ContentHubToggle({ onClick, isActive }: ContentHubToggleProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition ${
        isActive
          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
          : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <Layers className="size-4" />
      Content Hub
    </button>
  );
}

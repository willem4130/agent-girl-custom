/**
 * ImageGenerationTab
 *
 * Tab for generating images from prompts or copy content.
 */

import { useState, useEffect } from 'react';
import { AspectRatioSelector } from './AspectRatioSelector';
import { StylePresetSelector } from './StylePresetSelector';
import { ProviderSelector } from './ProviderSelector';
import { MediaPreview } from './MediaPreview';
import { LanguageSelector, type Language } from './LanguageSelector';
import {
  useMediaGeneration,
  type GeneratedImage,
  type ImageProvider,
  type StylePreset,
} from '../../../hooks/useMediaGeneration';

interface ImageGenerationTabProps {
  brandId: string;
  copyId?: string;
  copyText?: string;
  defaultLanguage?: Language;
  onImageGenerated: (image: GeneratedImage) => void;
}

export function ImageGenerationTab({ brandId, copyId, copyText, defaultLanguage = 'nl', onImageGenerated }: ImageGenerationTabProps) {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [provider, setProvider] = useState<ImageProvider>('seedream');
  const [stylePreset, setStylePreset] = useState<StylePreset | undefined>();
  const [useAntiAi, setUseAntiAi] = useState(true);
  const [generatingImage, setGeneratingImage] = useState<GeneratedImage | null>(null);

  const { generateImage, pollImageStatus, isGenerating, error } = useMediaGeneration();

  // Use copy text as initial prompt if provided
  useEffect(() => {
    if (copyText && !prompt) {
      // Don't set the full copy as prompt, just indicate we'll use it
      setPrompt('');
    }
  }, [copyText, prompt]);

  const handleGenerate = async () => {
    const result = await generateImage({
      brandId,
      copyId,
      prompt: prompt || undefined,
      aspectRatio,
      provider,
      stylePreset,
      useAntiAi,
    });

    if (result) {
      // Start polling for completion
      const image = await pollImageStatus(result.imageId, (img) => {
        setGeneratingImage(img);
      });

      if (image) {
        onImageGenerated(image);
        setGeneratingImage(null);
      }
    }
  };

  const isDisabled = isGenerating || (!prompt && !copyId);

  return (
    <div className="space-y-6">
      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Image Prompt
          {copyId && <span className="text-muted-foreground ml-2">(or leave empty to generate from copy)</span>}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={copyId ? 'Leave empty to auto-generate from copy...' : 'Describe the image you want to generate...'}
          className="w-full h-24 px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        {copyText && (
          <p className="mt-1 text-xs text-muted-foreground truncate">
            Copy: {copyText.substring(0, 100)}...
          </p>
        )}
      </div>

      {/* Language & Options Row */}
      <div className="space-y-4">
        <LanguageSelector value={language} onChange={setLanguage} />
        <div className="grid grid-cols-2 gap-4">
          <AspectRatioSelector
            value={aspectRatio}
            onChange={setAspectRatio}
          />
          <ProviderSelector
            type="image"
            value={provider}
            onChange={(p) => setProvider(p as ImageProvider)}
          />
        </div>
      </div>

      {/* Style Presets */}
      <StylePresetSelector
        value={stylePreset}
        onChange={setStylePreset}
      />

      {/* Anti-AI Toggle */}
      <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
        <div>
          <p className="text-sm font-medium text-foreground">Anti-AI Detection</p>
          <p className="text-xs text-muted-foreground">Add techniques to make image look more natural</p>
        </div>
        <button
          onClick={() => setUseAntiAi(!useAntiAi)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            useAntiAi ? 'bg-primary' : 'bg-background-tertiary'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              useAntiAi ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Generation Preview */}
      {generatingImage && (
        <MediaPreview
          type="image"
          status={generatingImage.status}
          url={generatingImage.image_url}
          error={generatingImage.error_message}
        />
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isDisabled}
        className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
          isDisabled
            ? 'bg-background-tertiary text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
      >
        {isGenerating ? (
          <>
            <LoadingSpinner />
            Generating...
          </>
        ) : (
          <>
            <ImageIcon />
            Generate Image
          </>
        )}
      </button>

      {/* Cost Estimate */}
      <p className="text-xs text-center text-muted-foreground">
        Estimated cost: ~${(provider === 'seedream' ? 0.02 : provider === 'nano-banana' ? 0.05 : 0.10).toFixed(2)}
      </p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

/**
 * VideoGenerationTab
 *
 * Tab for generating videos from prompts, copy, or images.
 */

import { useState } from 'react';
import { AspectRatioSelector } from './AspectRatioSelector';
import { ProviderSelector } from './ProviderSelector';
import { MediaPreview } from './MediaPreview';
import { LanguageSelector, type Language } from './LanguageSelector';
import {
  useMediaGeneration,
  type GeneratedImage,
  type GeneratedVideo,
  type VideoProvider,
} from '../../../hooks/useMediaGeneration';

interface VideoGenerationTabProps {
  brandId: string;
  copyId?: string;
  copyText?: string;
  images: GeneratedImage[];
  defaultLanguage?: Language;
  onVideoGenerated: (video: GeneratedVideo) => void;
}

export function VideoGenerationTab({
  brandId,
  copyId,
  copyText,
  images,
  defaultLanguage = 'nl',
  onVideoGenerated,
}: VideoGenerationTabProps) {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(5);
  const [provider, setProvider] = useState<VideoProvider>('kling-2.5');
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>();
  const [generatingVideo, setGeneratingVideo] = useState<GeneratedVideo | null>(null);

  const { generateVideo, generateVideoFromImage, pollVideoStatus, isGenerating, error } = useMediaGeneration();

  const handleGenerate = async () => {
    let result;

    if (selectedImageId) {
      // Generate from image
      result = await generateVideoFromImage(selectedImageId, {
        duration,
        provider,
      });
    } else {
      // Generate from prompt
      result = await generateVideo({
        brandId,
        copyId,
        prompt: prompt || undefined,
        aspectRatio,
        duration,
        provider,
      });
    }

    if (result) {
      const video = await pollVideoStatus(result.videoId, (vid) => {
        setGeneratingVideo(vid);
      });

      if (video) {
        onVideoGenerated(video);
        setGeneratingVideo(null);
      }
    }
  };

  const completedImages = images.filter((img) => img.status === 'completed' && img.image_url);
  const isDisabled = isGenerating || (!prompt && !copyId && !selectedImageId);

  return (
    <div className="space-y-6">
      {/* Source Selection */}
      <div className="space-y-4">
        {/* From Image */}
        {completedImages.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Generate from Image
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setSelectedImageId(undefined)}
                className={`aspect-square rounded-lg border-2 flex items-center justify-center ${
                  !selectedImageId
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <span className="text-xs text-muted-foreground">None</span>
              </button>
              {completedImages.slice(0, 7).map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageId(img.id)}
                  className={`aspect-square rounded-lg border-2 overflow-hidden ${
                    selectedImageId === img.id
                      ? 'border-primary'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt="Generated"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt Input (if not using image) */}
        {!selectedImageId && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Video Prompt
              {copyId && <span className="text-muted-foreground ml-2">(or leave empty to generate from copy)</span>}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={copyId ? 'Leave empty to auto-generate from copy...' : 'Describe the video you want to generate...'}
              className="w-full h-24 px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            {copyText && (
              <p className="mt-1 text-xs text-muted-foreground truncate">
                Copy: {copyText.substring(0, 100)}...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Language & Options Row */}
      <div className="space-y-4">
        <LanguageSelector value={language} onChange={setLanguage} />
        <div className="grid grid-cols-2 gap-4">
          <AspectRatioSelector
            value={aspectRatio}
            onChange={setAspectRatio}
            forVideo
          />
          <ProviderSelector
            type="video"
            value={provider}
            onChange={(p) => setProvider(p as VideoProvider)}
          />
        </div>
      </div>

      {/* Duration Selector */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Duration
        </label>
        <div className="flex gap-2">
          {[5, 8, 10].map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                duration === d
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border border-border text-foreground hover:bg-background-tertiary'
              }`}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Generation Preview */}
      {generatingVideo && (
        <MediaPreview
          type="video"
          status={generatingVideo.status}
          url={generatingVideo.video_url}
          error={generatingVideo.error_message}
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
            Generating Video...
          </>
        ) : (
          <>
            <VideoIcon />
            Generate Video
          </>
        )}
      </button>

      {/* Cost Estimate */}
      <p className="text-xs text-center text-muted-foreground">
        Estimated cost: ~${getCostEstimate(provider, duration).toFixed(2)}
      </p>
    </div>
  );
}

function getCostEstimate(provider: VideoProvider, duration: number): number {
  const costs: Record<VideoProvider, number> = {
    'kling-2.5': 0.25,
    'kling-2.6': 0.50,
    'wan-2.6': 0.40,
    'veo-3.1': 1.00,
  };
  return costs[provider] * Math.ceil(duration / 5);
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

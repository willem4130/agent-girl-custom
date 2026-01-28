/**
 * MediaPreview
 *
 * Preview component for media being generated or completed.
 */

import type { MediaStatus } from '../../../hooks/useMediaGeneration';

interface MediaPreviewProps {
  type: 'image' | 'video';
  status: MediaStatus;
  url?: string;
  error?: string;
  progress?: number;
}

export function MediaPreview({ type, status, url, error, progress }: MediaPreviewProps) {
  if (status === 'completed' && url) {
    return (
      <div className="rounded-lg overflow-hidden border border-border">
        {type === 'image' ? (
          <img
            src={url}
            alt="Generated"
            className="w-full h-auto"
          />
        ) : (
          <video
            src={url}
            controls
            className="w-full h-auto"
          />
        )}
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
        <div className="flex items-center gap-2 text-red-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Generation Failed</span>
        </div>
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  // Pending or Processing
  return (
    <div className="p-6 rounded-lg bg-background-tertiary border border-border">
      <div className="flex flex-col items-center gap-4">
        {/* Animated Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            {type === 'image' ? (
              <svg className="w-8 h-8 text-primary animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-primary animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center">
          <p className="font-medium text-foreground">
            {status === 'pending' ? 'Starting...' : `Generating ${type}...`}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {type === 'image' ? 'This usually takes 10-30 seconds' : 'This may take a few minutes'}
          </p>
        </div>

        {/* Progress Bar (if available) */}
        {progress !== undefined && progress > 0 && (
          <div className="w-full max-w-xs">
            <div className="h-1.5 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1">{Math.round(progress)}%</p>
          </div>
        )}

        {/* Animated Dots */}
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

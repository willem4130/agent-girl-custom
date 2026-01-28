/**
 * ProviderSelector
 *
 * Selector for image and video generation providers.
 */

import type { ImageProvider, VideoProvider } from '../../../hooks/useMediaGeneration';

interface ProviderSelectorProps {
  type: 'image' | 'video';
  value: string;
  onChange: (provider: string) => void;
}

const IMAGE_PROVIDERS: Array<{
  id: ImageProvider;
  name: string;
  cost: string;
  speed: string;
  quality: 'Good' | 'Better' | 'Best';
}> = [
  { id: 'seedream', name: 'Seedream 4.5', cost: '$0.02', speed: 'Fast', quality: 'Good' },
  { id: 'nano-banana', name: 'Nano Banana', cost: '$0.05', speed: 'Medium', quality: 'Better' },
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', cost: '$0.10', speed: 'Slow', quality: 'Best' },
];

const VIDEO_PROVIDERS: Array<{
  id: VideoProvider;
  name: string;
  cost: string;
  speed: string;
  quality: 'Good' | 'Better' | 'Best';
}> = [
  { id: 'kling-2.5', name: 'Kling 2.5 Turbo', cost: '$0.25/5s', speed: 'Fast', quality: 'Good' },
  { id: 'kling-2.6', name: 'Kling 2.6', cost: '$0.50/5s', speed: 'Medium', quality: 'Better' },
  { id: 'wan-2.6', name: 'Wan 2.6', cost: '$0.40', speed: 'Medium', quality: 'Good' },
  { id: 'veo-3.1', name: 'Veo 3.1', cost: '$1.00', speed: 'Slow', quality: 'Best' },
];

export function ProviderSelector({ type, value, onChange }: ProviderSelectorProps) {
  const providers = type === 'image' ? IMAGE_PROVIDERS : VIDEO_PROVIDERS;

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        Provider
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
        >
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name} - {provider.cost} ({provider.quality})
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {/* Provider details */}
      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
        {(() => {
          const provider = providers.find(p => p.id === value);
          if (!provider) return null;
          return (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {provider.speed}
              </span>
              <span>•</span>
              <span>{provider.quality} quality</span>
              <span>•</span>
              <span>{provider.cost}</span>
            </>
          );
        })()}
      </div>
    </div>
  );
}

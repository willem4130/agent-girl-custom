/**
 * StylePresetSelector
 *
 * Grid of visual style presets for image generation.
 */

import type { StylePreset } from '../../../hooks/useMediaGeneration';

interface StylePresetSelectorProps {
  value?: StylePreset;
  onChange: (preset: StylePreset | undefined) => void;
}

const PRESETS: Array<{
  id: StylePreset;
  name: string;
  description: string;
  emoji: string;
}> = [
  { id: 'photoshoot', name: 'Photoshoot', description: 'Professional studio photography', emoji: '📸' },
  { id: 'minimal', name: 'Minimal', description: 'Clean, simple compositions', emoji: '⬜' },
  { id: 'corporate', name: 'Corporate', description: 'Professional business style', emoji: '💼' },
  { id: 'lifestyle', name: 'Lifestyle', description: 'Natural, authentic moments', emoji: '🌿' },
  { id: 'product', name: 'Product', description: 'E-commerce product shots', emoji: '🛍️' },
  { id: 'social-media', name: 'Social Media', description: 'Optimized for engagement', emoji: '📱' },
  { id: 'editorial', name: 'Editorial', description: 'Magazine-quality style', emoji: '📰' },
  { id: 'cinematic', name: 'Cinematic', description: 'Movie-like dramatic look', emoji: '🎬' },
  { id: 'documentary', name: 'Documentary', description: 'Authentic documentary style', emoji: '🎥' },
];

export function StylePresetSelector({ value, onChange }: StylePresetSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        Style Preset
        <span className="text-muted-foreground font-normal ml-2">(optional)</span>
      </label>
      <div className="grid grid-cols-3 gap-2">
        {/* None option */}
        <button
          onClick={() => onChange(undefined)}
          className={`p-2 rounded-lg border text-left transition-colors ${
            !value
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-muted-foreground bg-background'
          }`}
        >
          <div className="text-lg mb-0.5">✨</div>
          <div className="text-xs font-medium text-foreground">Auto</div>
          <div className="text-xs text-muted-foreground truncate">AI decides</div>
        </button>

        {/* Presets */}
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onChange(preset.id)}
            className={`p-2 rounded-lg border text-left transition-colors ${
              value === preset.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-muted-foreground bg-background'
            }`}
          >
            <div className="text-lg mb-0.5">{preset.emoji}</div>
            <div className="text-xs font-medium text-foreground">{preset.name}</div>
            <div className="text-xs text-muted-foreground truncate">{preset.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

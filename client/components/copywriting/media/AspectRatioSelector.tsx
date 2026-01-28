/**
 * AspectRatioSelector
 *
 * Visual aspect ratio picker for images and videos.
 */

interface AspectRatioSelectorProps {
  value: string;
  onChange: (ratio: string) => void;
  forVideo?: boolean;
}

const IMAGE_RATIOS = [
  { ratio: '1:1', label: 'Square', icon: '◻️', platforms: ['Instagram', 'Facebook'] },
  { ratio: '16:9', label: 'Landscape', icon: '▭', platforms: ['YouTube', 'Twitter'] },
  { ratio: '9:16', label: 'Portrait', icon: '▯', platforms: ['Stories', 'Reels', 'TikTok'] },
  { ratio: '4:3', label: 'Standard', icon: '🖥️', platforms: ['Presentations'] },
  { ratio: '3:4', label: 'Portrait', icon: '📱', platforms: ['Pinterest'] },
];

const VIDEO_RATIOS = [
  { ratio: '16:9', label: 'Landscape', icon: '▭', platforms: ['YouTube'] },
  { ratio: '9:16', label: 'Portrait', icon: '▯', platforms: ['TikTok', 'Reels'] },
  { ratio: '1:1', label: 'Square', icon: '◻️', platforms: ['Instagram', 'Facebook'] },
];

export function AspectRatioSelector({ value, onChange, forVideo = false }: AspectRatioSelectorProps) {
  const ratios = forVideo ? VIDEO_RATIOS : IMAGE_RATIOS;

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        Aspect Ratio
      </label>
      <div className="flex gap-2 flex-wrap">
        {ratios.map(({ ratio, label, platforms: _platforms }) => (
          <button
            key={ratio}
            onClick={() => onChange(ratio)}
            className={`flex flex-col items-center p-2 rounded-lg border transition-colors min-w-[70px] ${
              value === ratio
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-muted-foreground bg-background'
            }`}
          >
            <RatioVisual ratio={ratio} isSelected={value === ratio} />
            <span className="text-xs font-medium text-foreground mt-1">{ratio}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </button>
        ))}
      </div>
      {/* Platform hints */}
      <p className="text-xs text-muted-foreground mt-2">
        Best for: {ratios.find(r => r.ratio === value)?.platforms.join(', ')}
      </p>
    </div>
  );
}

// Visual ratio representation
function RatioVisual({ ratio, isSelected }: { ratio: string; isSelected: boolean }) {
  const [w, h] = ratio.split(':').map(Number);
  const maxSize = 32;
  const scale = maxSize / Math.max(w, h);
  const width = w * scale;
  const height = h * scale;

  return (
    <div
      className={`border-2 rounded-sm ${
        isSelected ? 'border-primary bg-primary/20' : 'border-muted-foreground/50 bg-background-tertiary'
      }`}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}

/**
 * LanguageSelector
 *
 * Toggle between Dutch and English for content generation.
 */

export type Language = 'nl' | 'en';

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
  showLabel?: boolean;
}

const LANGUAGES: Array<{ id: Language; label: string; flag: string; nativeName: string }> = [
  { id: 'nl', label: 'Dutch', flag: '🇳🇱', nativeName: 'Nederlands' },
  { id: 'en', label: 'English', flag: '🇬🇧', nativeName: 'English' },
];

export function LanguageSelector({ value, onChange, showLabel = true }: LanguageSelectorProps) {
  return (
    <div>
      {showLabel && (
        <label className="block text-sm font-medium text-foreground mb-2">
          Language
        </label>
      )}
      <div className="flex gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => onChange(lang.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              value === lang.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-foreground hover:bg-background-tertiary'
            }`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="text-sm font-medium">{lang.nativeName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact version for inline use
 */
export function LanguageSelectorCompact({ value, onChange }: Omit<LanguageSelectorProps, 'showLabel'>) {
  return (
    <div className="flex gap-1">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.id}
          onClick={() => onChange(lang.id)}
          title={lang.label}
          className={`flex items-center justify-center w-8 h-8 rounded-md border transition-colors ${
            value === lang.id
              ? 'border-primary bg-primary/10'
              : 'border-border bg-background hover:bg-background-tertiary'
          }`}
        >
          <span className="text-sm">{lang.flag}</span>
        </button>
      ))}
    </div>
  );
}

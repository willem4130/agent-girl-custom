
import { useState, useEffect } from "react";

interface PresetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: string) => void;
}

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.81344 3.81246C4.0087 3.6172 4.32528 3.6172 4.52055 3.81246L10.0003 9.29224L15.4801 3.81246C15.6754 3.6172 15.992 3.6172 16.1872 3.81246C16.3825 4.00772 16.3825 4.32431 16.1872 4.51957L10.7074 9.99935L16.1872 15.4791C16.3825 15.6744 16.3825 15.991 16.1872 16.1862C15.992 16.3815 15.6754 16.3815 15.4801 16.1862L10.0003 10.7065L4.52055 16.1862C4.32528 16.3815 4.0087 16.3815 3.81344 16.1862C3.61818 15.991 3.61818 15.6744 3.81344 15.4791L9.29322 9.99935L3.81344 4.51957C3.61818 4.32431 3.61818 4.00772 3.81344 3.81246Z"
    />
  </svg>
);

const categories = [
  { id: "all", name: "All" },
  { id: "new", name: "New", hasIndicator: true },
  { id: "viral", name: "Viral" },
  { id: "effects", name: "Effects" },
  { id: "ugc", name: "UGC" },
];

const presets = [
  { id: 1, name: "General", thumbnail: "/presets/general.webp" },
  { id: 2, name: "Animalization", thumbnail: "/presets/animalization.webp" },
  { id: 3, name: "Giant Grab", thumbnail: "/presets/giant-grab.webp" },
  { id: 4, name: "Starship Troopers", thumbnail: "/presets/starship.webp" },
  { id: 5, name: "Cyborg", thumbnail: "/presets/cyborg.webp" },
  {
    id: 6,
    name: "Northern Lights",
    thumbnail: "/presets/northern-lights.webp",
  },
  { id: 7, name: "Fairies Around", thumbnail: "/presets/fairies.webp" },
  { id: 8, name: "Sakura Petals", thumbnail: "/presets/sakura.webp" },
  { id: 9, name: "Saint Glow", thumbnail: "/presets/saint-glow.webp" },
  { id: 10, name: "Objects Around", thumbnail: "/presets/objects.webp" },
  { id: 11, name: "Monstrosity", thumbnail: "/presets/monstrosity.webp" },
  { id: 12, name: "Ice Rose", thumbnail: "/presets/ice-rose.webp" },
  { id: 13, name: "Firework", thumbnail: "/presets/firework.webp" },
  { id: 14, name: "Air Element", thumbnail: "/presets/air-element.webp" },
  { id: 15, name: "I Can Fly", thumbnail: "/presets/i-can-fly.webp" },
  { id: 16, name: "Visor X", thumbnail: "/presets/visor-x.webp" },
  { id: 17, name: "Aquarium", thumbnail: "/presets/aquarium.webp" },
  { id: 18, name: "Ballet", thumbnail: "/presets/ballet.webp" },
  { id: 19, name: "Multiverse", thumbnail: "/presets/multiverse.webp" },
  { id: 20, name: "Plasma Explosion", thumbnail: "/presets/plasma.webp" },
];

export default function PresetSelector({
  isOpen,
  onClose,
  onSelectPreset,
}: PresetSelectorProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Trigger animation state changes asynchronously to avoid cascading renders
    const rafId = requestAnimationFrame(() => {
      setIsAnimating(isOpen);
    });
    return () => cancelAnimationFrame(rafId);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`rounded-2xl bg-zinc-900 p-6 pt-2 transition-all duration-500 ease-out ${
        isAnimating ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      {/* Category Filters with Search */}
      <div
        className={`mb-4 grid grid-cols-[1fr_auto] gap-4 transition-all delay-75 duration-500 ease-out ${
          isAnimating ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <div className="flex flex-wrap items-center justify-start gap-2 overflow-hidden">
          {categories.map((category) => (
            <div key={category.id} className="relative p-[1px]">
              {category.hasIndicator && (
                <div className="absolute top-0 left-0 h-1.5 w-1.5 rounded-full bg-pink-400" />
              )}
              <button
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium text-white transition-colors ${
                  activeCategory === category.id
                    ? "border-pink-400/20 bg-pink-400/10"
                    : "border-zinc-700 hover:border-zinc-600"
                }`}
              >
                {category.name}
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative grid items-center">
            <input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-transparent bg-zinc-800 px-4 text-sm font-medium text-gray-400 transition placeholder:text-gray-500 hover:border-zinc-700 focus:border-pink-400/50 focus:bg-zinc-800 focus:outline-none"
            />
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-white transition-colors hover:bg-zinc-700"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Preset Grid - Masonry Layout */}
      <div
        className={`-mx-1 grid grid-cols-2 overflow-x-hidden pb-14 transition-all delay-100 duration-500 ease-out md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${
          isAnimating ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {[0, 1, 2, 3, 4].map((columnIndex) => (
          <div key={columnIndex} className="p-1">
            {presets
              .filter((_, index) => index % 5 === columnIndex)
              .map((preset, itemIndex) => (
                <figure
                  key={preset.id}
                  className={`group relative z-[1] mb-2 h-auto w-full cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 ease-out ${
                    isAnimating
                      ? "translate-y-0 scale-100 opacity-100"
                      : "translate-y-4 scale-95 opacity-0"
                  }`}
                  style={{
                    aspectRatio: "0.75 / 1",
                    transitionDelay: `${150 + columnIndex * 40 + itemIndex * 25}ms`,
                  }}
                  onClick={() => {
                    onSelectPreset(preset.name);
                    onClose();
                  }}
                >
                  <button
                    type="button"
                    className="absolute inset-0 z-10 flex h-full w-full items-end justify-start rounded-2xl bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.7)_80%)] px-2 pb-2 text-start font-bold uppercase ring-0 ring-pink-400 transition-all ring-inset hover:ring-2"
                  >
                    <div className="font-heading leading-[100%] text-white opacity-100 transition">
                      <h4 className="text-[8px] lg:text-[10px]">
                        {preset.name}
                      </h4>
                    </div>
                  </button>
                  {/* Placeholder gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900" />
                </figure>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

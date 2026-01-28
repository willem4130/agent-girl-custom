
import { useState, useRef } from "react";
import { SimpleDropdown, GridDropdown } from "@/components/media/dropdowns";
import { TRANSITION_DEFINITIONS } from "@/lib/video-editor/transitions";
import {
  TITLE_PRESETS,
  HOOK_PRESETS,
  SUBTITLE_PRESETS as TEXT_SUBTITLE_PRESETS,
} from "@/lib/video-editor/text/presets";
import { ChevronDownIcon, UploadIcon, MusicIcon } from "../icons";
import { TEXT_POSITIONS, type EditVideoState } from "../constants";

interface EditVideoFormProps {
  editState: EditVideoState;
  onUpdateEditState: (updates: Partial<EditVideoState>) => void;
}

export default function EditVideoForm({
  editState,
  onUpdateEditState,
}: EditVideoFormProps) {
  // Dropdown visibility states
  const [showTransitionDropdown, setShowTransitionDropdown] = useState(false);
  const [showTextPresetDropdown, setShowTextPresetDropdown] = useState(false);
  const [showTextPositionDropdown, setShowTextPositionDropdown] =
    useState(false);
  const [showSubtitleStyleDropdown, setShowSubtitleStyleDropdown] =
    useState(false);

  // Dropdown trigger refs
  const transitionTriggerRef = useRef<HTMLButtonElement>(null);
  const textPresetTriggerRef = useRef<HTMLButtonElement>(null);
  const textPositionTriggerRef = useRef<HTMLButtonElement>(null);
  const subtitleStyleTriggerRef = useRef<HTMLButtonElement>(null);

  // Get all text presets for dropdown
  const getAllTextPresets = () => {
    return [
      ...Object.entries(TITLE_PRESETS).map(([id, preset]) => ({
        id,
        label: preset.name,
        category: "Titles",
      })),
      ...Object.entries(HOOK_PRESETS).map(([id, preset]) => ({
        id,
        label: preset.name,
        category: "Hooks",
      })),
      ...Object.entries(TEXT_SUBTITLE_PRESETS).map(([id, preset]) => ({
        id,
        label: preset.name,
        category: "Subtitles",
      })),
    ];
  };

  // Get transition options
  const getTransitionOptions = () => {
    return Object.entries(TRANSITION_DEFINITIONS).map(([name, def]) => ({
      id: name,
      label: def.name,
      description: def.description,
    }));
  };

  return (
    <>
      {/* Section: Transitions */}
      <div className="rounded-xl bg-zinc-800/50 p-3">
        <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
          Transitions
        </h3>

        {/* Transition Type */}
        <div className="relative mb-2">
          <button
            ref={transitionTriggerRef}
            onClick={() => setShowTransitionDropdown(!showTransitionDropdown)}
            className="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-lg bg-zinc-700/50 px-3 py-2 text-left transition hover:bg-zinc-600/50"
          >
            <div className="grid">
              <span className="text-xs text-gray-500">Type</span>
              <div className="text-sm font-medium text-white capitalize">
                {editState.transitionType}
              </div>
            </div>
            <ChevronDownIcon />
          </button>
          <GridDropdown
            isOpen={showTransitionDropdown}
            onClose={() => setShowTransitionDropdown(false)}
            value={editState.transitionType}
            onChange={(id) => {
              onUpdateEditState({ transitionType: id });
              setShowTransitionDropdown(false);
            }}
            triggerRef={transitionTriggerRef}
            options={getTransitionOptions()}
          />
        </div>

        {/* Transition Duration */}
        <div className="flex items-center justify-between rounded-lg bg-zinc-700/50 px-3 py-2">
          <span className="text-xs text-gray-500">Duration</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={editState.transitionDuration}
              onChange={(e) =>
                onUpdateEditState({
                  transitionDuration: parseFloat(e.target.value),
                })
              }
              className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-zinc-600 accent-pink-400"
            />
            <span className="w-10 text-right text-sm text-white">
              {editState.transitionDuration}s
            </span>
          </div>
        </div>
      </div>

      {/* Section: Text Overlay */}
      <div className="rounded-xl bg-zinc-800/50 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Text Overlay
          </h3>
          <button
            onClick={() =>
              onUpdateEditState({ textEnabled: !editState.textEnabled })
            }
            className={`relative inline-flex h-5 w-8 shrink-0 cursor-pointer items-center rounded-full transition ${
              editState.textEnabled ? "bg-pink-400" : "bg-zinc-700"
            }`}
          >
            <span
              className={`pointer-events-none absolute top-1/2 left-0.5 h-3.5 w-3.5 -translate-y-1/2 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                editState.textEnabled ? "translate-x-3.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {editState.textEnabled && (
          <div className="space-y-2">
            {/* Text Content */}
            <textarea
              value={editState.textContent}
              onChange={(e) =>
                onUpdateEditState({ textContent: e.target.value })
              }
              className="hide-scrollbar w-full resize-none rounded-lg bg-zinc-700/50 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:ring-1 focus:ring-pink-400 focus:outline-none"
              placeholder="Enter your text..."
              rows={2}
            />

            {/* Text Preset */}
            <div className="relative">
              <button
                ref={textPresetTriggerRef}
                onClick={() =>
                  setShowTextPresetDropdown(!showTextPresetDropdown)
                }
                className="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-lg bg-zinc-700/50 px-3 py-2 text-left transition hover:bg-zinc-600/50"
              >
                <div className="grid">
                  <span className="text-xs text-gray-500">Style</span>
                  <div className="text-sm font-medium text-white">
                    {getAllTextPresets().find(
                      (p) => p.id === editState.textPreset
                    )?.label || editState.textPreset}
                  </div>
                </div>
                <ChevronDownIcon />
              </button>
              <SimpleDropdown
                isOpen={showTextPresetDropdown}
                onClose={() => setShowTextPresetDropdown(false)}
                value={editState.textPreset}
                onChange={(id) => {
                  onUpdateEditState({ textPreset: id });
                  setShowTextPresetDropdown(false);
                }}
                triggerRef={textPresetTriggerRef}
                options={getAllTextPresets()}
              />
            </div>

            {/* Text Position */}
            <div className="relative">
              <button
                ref={textPositionTriggerRef}
                onClick={() =>
                  setShowTextPositionDropdown(!showTextPositionDropdown)
                }
                className="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-lg bg-zinc-700/50 px-3 py-2 text-left transition hover:bg-zinc-600/50"
              >
                <div className="grid">
                  <span className="text-xs text-gray-500">Position</span>
                  <div className="text-sm font-medium text-white">
                    {TEXT_POSITIONS.find((p) => p.id === editState.textPosition)
                      ?.label || editState.textPosition}
                  </div>
                </div>
                <ChevronDownIcon />
              </button>
              <SimpleDropdown
                isOpen={showTextPositionDropdown}
                onClose={() => setShowTextPositionDropdown(false)}
                value={editState.textPosition}
                onChange={(id) => {
                  onUpdateEditState({ textPosition: id });
                  setShowTextPositionDropdown(false);
                }}
                triggerRef={textPositionTriggerRef}
                options={TEXT_POSITIONS}
              />
            </div>
          </div>
        )}
      </div>

      {/* Section: Subtitles */}
      <div className="rounded-xl bg-zinc-800/50 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Subtitles
          </h3>
          <button
            onClick={() =>
              onUpdateEditState({
                subtitlesEnabled: !editState.subtitlesEnabled,
              })
            }
            className={`relative inline-flex h-5 w-8 shrink-0 cursor-pointer items-center rounded-full transition ${
              editState.subtitlesEnabled ? "bg-pink-400" : "bg-zinc-700"
            }`}
          >
            <span
              className={`pointer-events-none absolute top-1/2 left-0.5 h-3.5 w-3.5 -translate-y-1/2 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                editState.subtitlesEnabled ? "translate-x-3.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {editState.subtitlesEnabled && (
          <div className="space-y-2">
            {/* Upload SRT */}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-600 bg-zinc-700/30 px-3 py-3 text-sm text-gray-400 transition hover:border-pink-400 hover:text-white">
              <input type="file" accept=".srt,.vtt" className="sr-only" />
              <UploadIcon />
              Upload SRT/VTT
            </label>

            {/* Subtitle Style */}
            <div className="relative">
              <button
                ref={subtitleStyleTriggerRef}
                onClick={() =>
                  setShowSubtitleStyleDropdown(!showSubtitleStyleDropdown)
                }
                className="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-lg bg-zinc-700/50 px-3 py-2 text-left transition hover:bg-zinc-600/50"
              >
                <div className="grid">
                  <span className="text-xs text-gray-500">Style</span>
                  <div className="text-sm font-medium text-white">
                    {TEXT_SUBTITLE_PRESETS[editState.subtitleStyle]?.name ||
                      editState.subtitleStyle}
                  </div>
                </div>
                <ChevronDownIcon />
              </button>
              <SimpleDropdown
                isOpen={showSubtitleStyleDropdown}
                onClose={() => setShowSubtitleStyleDropdown(false)}
                value={editState.subtitleStyle}
                onChange={(id) => {
                  onUpdateEditState({ subtitleStyle: id });
                  setShowSubtitleStyleDropdown(false);
                }}
                triggerRef={subtitleStyleTriggerRef}
                options={Object.entries(TEXT_SUBTITLE_PRESETS).map(
                  ([id, preset]) => ({
                    id,
                    label: preset.name,
                  })
                )}
              />
            </div>
          </div>
        )}
      </div>

      {/* Section: Audio/Music */}
      <div className="rounded-xl bg-zinc-800/50 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Background Music
          </h3>
          <button
            onClick={() =>
              onUpdateEditState({
                audioEnabled: !editState.audioEnabled,
              })
            }
            className={`relative inline-flex h-5 w-8 shrink-0 cursor-pointer items-center rounded-full transition ${
              editState.audioEnabled ? "bg-pink-400" : "bg-zinc-700"
            }`}
          >
            <span
              className={`pointer-events-none absolute top-1/2 left-0.5 h-3.5 w-3.5 -translate-y-1/2 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                editState.audioEnabled ? "translate-x-3.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {editState.audioEnabled && (
          <div className="space-y-2">
            {/* Upload Audio */}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-600 bg-zinc-700/30 px-3 py-3 text-sm text-gray-400 transition hover:border-pink-400 hover:text-white">
              <input type="file" accept="audio/*" className="sr-only" />
              <MusicIcon />
              Upload Audio
            </label>

            {/* Volume */}
            <div className="flex items-center justify-between rounded-lg bg-zinc-700/50 px-3 py-2">
              <span className="text-xs text-gray-500">Volume</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={editState.audioVolume}
                  onChange={(e) =>
                    onUpdateEditState({
                      audioVolume: parseFloat(e.target.value),
                    })
                  }
                  className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-zinc-600 accent-pink-400"
                />
                <span className="w-10 text-right text-sm text-white">
                  {Math.round(editState.audioVolume * 100)}%
                </span>
              </div>
            </div>

            {/* Ducking */}
            <div className="flex items-center justify-between rounded-lg bg-zinc-700/50 px-3 py-2">
              <div>
                <span className="text-xs text-gray-500">Auto Ducking</span>
                <p className="text-[10px] text-gray-600">
                  Lower music during speech
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateEditState({
                    audioDucking: !editState.audioDucking,
                  })
                }
                className={`relative inline-flex h-5 w-8 shrink-0 cursor-pointer items-center rounded-full transition ${
                  editState.audioDucking ? "bg-pink-400" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none absolute top-1/2 left-0.5 h-3.5 w-3.5 -translate-y-1/2 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                    editState.audioDucking ? "translate-x-3.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

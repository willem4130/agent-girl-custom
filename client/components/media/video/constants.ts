import type { NestedDropdownGroup } from "@/components/media/dropdowns";
import {
  KlingIcon,
  WanIcon,
  ClockBadgeIcon,
  AudioBadgeIcon,
  EffectsBadgeIcon,
  ResolutionBadgeIcon,
} from "./icons";

// Edit Video State Types
export interface EditVideoState {
  // Transitions
  transitionType: string;
  transitionDuration: number;
  // Text Overlay
  textEnabled: boolean;
  textPreset: string;
  textContent: string;
  textPosition: string;
  // Subtitles
  subtitlesEnabled: boolean;
  subtitleStyle: string;
  // Audio
  audioEnabled: boolean;
  audioVolume: number;
  audioDucking: boolean;
}

// Default edit video state
export const getDefaultEditState = (): EditVideoState => ({
  transitionType: "fade",
  transitionDuration: 0.5,
  textEnabled: false,
  textPreset: "title-impact",
  textContent: "",
  textPosition: "middle-center",
  subtitlesEnabled: false,
  subtitleStyle: "subtitle-tiktok",
  audioEnabled: false,
  audioVolume: 0.3,
  audioDucking: true,
});

// Position options for text
export const TEXT_POSITIONS = [
  { id: "top-left", label: "Top Left" },
  { id: "top-center", label: "Top Center" },
  { id: "top-right", label: "Top Right" },
  { id: "middle-left", label: "Middle Left" },
  { id: "middle-center", label: "Middle Center" },
  { id: "middle-right", label: "Middle Right" },
  { id: "bottom-left", label: "Bottom Left" },
  { id: "bottom-center", label: "Bottom Center" },
  { id: "bottom-right", label: "Bottom Right" },
];

// Model groups for nested dropdown - uses JSX so needs to be a function
export const getModelGroups = (): NestedDropdownGroup[] => [
  {
    id: "kling",
    label: "Kling",
    icon: KlingIcon(),
    options: [
      {
        id: "kling-2.6",
        label: "Kling 2.6",
        description: "Premium video with native audio",
        badges: [
          { label: "5-10s", icon: ClockBadgeIcon() },
          { label: "Audio", icon: AudioBadgeIcon() },
        ],
      },
      {
        id: "kling-2.5-turbo",
        label: "Kling 2.5 Turbo",
        description: "Fast generation with effects",
        badges: [
          { label: "5-10s", icon: ClockBadgeIcon() },
          { label: "Effects", icon: EffectsBadgeIcon() },
        ],
      },
    ],
  },
  {
    id: "wan",
    label: "Wan",
    icon: WanIcon(),
    options: [
      {
        id: "wan-2.6",
        label: "Wan 2.6",
        description: "Multi-modal with reference support",
        badges: [
          { label: "5-15s", icon: ClockBadgeIcon() },
          { label: "720p/1080p", icon: ResolutionBadgeIcon() },
        ],
      },
    ],
  },
];

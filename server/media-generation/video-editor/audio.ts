/**
 * Audio Handling
 *
 * FFmpeg audio mixing and manipulation.
 */

import type { AudioConfig } from '../types';

export interface AudioMixOptions {
  /** Original video audio volume (0-1) */
  originalVolume?: number;
  /** Background music volume (0-1) */
  backgroundVolume?: number;
  /** Fade in duration for background (seconds) */
  fadeIn?: number;
  /** Fade out duration for background (seconds) */
  fadeOut?: number;
  /** Total video duration (needed for fade out calculation) */
  videoDuration?: number;
  /** Duck original audio when background is playing */
  ducking?: boolean;
}

/**
 * Generate filter for adding background audio
 */
export function addAudio(
  audioConfig: AudioConfig,
  videoDuration?: number
): { filter: string; hasAudio: boolean } {
  if (!audioConfig.url) {
    return { filter: '', hasAudio: false };
  }

  const filters: string[] = [];
  const volume = audioConfig.volume ?? 0.5;

  // Start with volume adjustment
  let audioFilter = `[1:a]volume=${volume}`;

  // Add fade in
  if (audioConfig.fadeIn && audioConfig.fadeIn > 0) {
    audioFilter += `,afade=t=in:st=0:d=${audioConfig.fadeIn}`;
  }

  // Add fade out (requires knowing duration)
  if (audioConfig.fadeOut && audioConfig.fadeOut > 0 && videoDuration) {
    const fadeOutStart = Math.max(0, videoDuration - audioConfig.fadeOut);
    audioFilter += `,afade=t=out:st=${fadeOutStart}:d=${audioConfig.fadeOut}`;
  }

  audioFilter += '[bg]';
  filters.push(audioFilter);

  return {
    filter: filters.join(';'),
    hasAudio: true,
  };
}

/**
 * Mix multiple audio sources
 */
export function mixAudio(options: AudioMixOptions): string {
  const {
    originalVolume = 1.0,
    backgroundVolume = 0.3,
    fadeIn = 0,
    fadeOut = 0,
    videoDuration,
    ducking = false,
  } = options;

  const filters: string[] = [];

  // Process original audio
  filters.push(`[0:a]volume=${originalVolume}[orig]`);

  // Process background audio
  let bgFilter = `[1:a]volume=${backgroundVolume}`;

  if (fadeIn > 0) {
    bgFilter += `,afade=t=in:st=0:d=${fadeIn}`;
  }

  if (fadeOut > 0 && videoDuration) {
    const fadeOutStart = Math.max(0, videoDuration - fadeOut);
    bgFilter += `,afade=t=out:st=${fadeOutStart}:d=${fadeOut}`;
  }

  // Loop background audio if needed
  if (videoDuration) {
    bgFilter += `,aloop=loop=-1:size=${Math.ceil(videoDuration * 48000)}`;
    bgFilter += `,atrim=0:${videoDuration}`;
  }

  bgFilter += '[bg]';
  filters.push(bgFilter);

  // Mix the audio streams
  if (ducking) {
    // Sidechain compression: duck background when original audio is present
    filters.push('[orig][bg]sidechaincompress=threshold=0.02:ratio=10:attack=50:release=500[mixed]');
  } else {
    // Simple mix
    filters.push('[orig][bg]amix=inputs=2:duration=first:dropout_transition=2[mixed]');
  }

  return filters.join(';');
}

/**
 * Normalize audio levels
 */
export function normalizeAudio(targetLoudness = -16): string {
  return `loudnorm=I=${targetLoudness}:TP=-1.5:LRA=11`;
}

/**
 * Add audio from a file to a video
 */
export function replaceAudio(): string {
  // Map video from input 0, audio from input 1
  return '-map 0:v -map 1:a -c:v copy -c:a aac -shortest';
}

/**
 * Generate silent audio of specific duration
 */
export function generateSilence(durationSeconds: number): string {
  return `anullsrc=r=48000:cl=stereo,atrim=0:${durationSeconds}`;
}

/**
 * Common audio presets
 */
export const AUDIO_PRESETS = {
  /** Subtle background music */
  'subtle-background': {
    volume: 0.2,
    fadeIn: 2,
    fadeOut: 3,
  } as AudioConfig,

  /** Medium background with ducking */
  'medium-background': {
    volume: 0.35,
    fadeIn: 1,
    fadeOut: 2,
  } as AudioConfig,

  /** Prominent music */
  'prominent-music': {
    volume: 0.6,
    fadeIn: 0.5,
    fadeOut: 2,
  } as AudioConfig,

  /** Voice-over friendly (ducks under speech) */
  'voiceover-friendly': {
    volume: 0.15,
    fadeIn: 1,
    fadeOut: 1,
  } as AudioConfig,
};

/**
 * Get recommended audio settings for platform
 */
export function getAudioSettingsForPlatform(
  platform: 'tiktok' | 'reels' | 'youtube' | 'linkedin'
): AudioConfig {
  const platformSettings: Record<string, AudioConfig> = {
    tiktok: AUDIO_PRESETS['prominent-music'],
    reels: AUDIO_PRESETS['prominent-music'],
    youtube: AUDIO_PRESETS['medium-background'],
    linkedin: AUDIO_PRESETS['subtle-background'],
  };

  return platformSettings[platform] || AUDIO_PRESETS['medium-background'];
}

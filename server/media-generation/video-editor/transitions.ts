/**
 * Video Transitions
 *
 * FFmpeg xfade transitions between video clips.
 */

import type { TransitionType, TransitionConfig } from '../types';

/**
 * Available FFmpeg xfade transition types
 */
export const XFADE_TRANSITIONS = [
  'fade',
  'fadeblack',
  'fadewhite',
  'distance',
  'wipeleft',
  'wiperight',
  'wipeup',
  'wipedown',
  'slideleft',
  'slideright',
  'slideup',
  'slidedown',
  'smoothleft',
  'smoothright',
  'smoothup',
  'smoothdown',
  'circlecrop',
  'rectcrop',
  'circleclose',
  'circleopen',
  'horzclose',
  'horzopen',
  'vertclose',
  'vertopen',
  'diagbl',
  'diagbr',
  'diagtl',
  'diagtr',
  'dissolve',
  'pixelize',
  'radial',
  'hblur',
  'wipetl',
  'wipetr',
  'wipebl',
  'wipebr',
  'zoomin',
] as const;

export type XfadeTransition = typeof XFADE_TRANSITIONS[number];

/**
 * Map our transition types to FFmpeg xfade names
 */
const TRANSITION_MAP: Record<TransitionType, XfadeTransition> = {
  fade: 'fade',
  dissolve: 'dissolve',
  wipe: 'wipeleft',
  slide: 'slideleft',
  zoom: 'zoomin',
  none: 'fade', // Will use 0 duration
};

/**
 * Transition presets for common use cases
 */
export const TRANSITION_PRESETS: Record<string, TransitionConfig> = {
  'quick-fade': { type: 'fade', duration: 0.3 },
  'smooth-fade': { type: 'fade', duration: 0.8 },
  'long-dissolve': { type: 'dissolve', duration: 1.5 },
  'slide-left': { type: 'slide', duration: 0.5 },
  'wipe-left': { type: 'wipe', duration: 0.5 },
  'zoom-in': { type: 'zoom', duration: 0.7 },
  'cut': { type: 'none', duration: 0 },
};

/**
 * Get FFmpeg xfade filter string
 */
export function getTransitionFilter(
  inputLabel1: string,
  inputLabel2: string,
  outputLabel: string,
  config: TransitionConfig,
  offsetSeconds: number
): string {
  const { type, duration } = config;

  if (type === 'none' || duration === 0) {
    // Simple concatenation without transition
    return `[${inputLabel1}][${inputLabel2}]concat=n=2:v=1:a=0[${outputLabel}]`;
  }

  const xfadeType = TRANSITION_MAP[type] || 'fade';

  return `[${inputLabel1}][${inputLabel2}]xfade=transition=${xfadeType}:duration=${duration}:offset=${offsetSeconds}[${outputLabel}]`;
}

/**
 * Apply a transition between two videos
 * Returns filter complex string
 */
export function applyTransition(
  video1Duration: number,
  config: TransitionConfig
): { filter: string; outputDuration: number } {
  const { type, duration } = config;

  if (type === 'none' || duration === 0) {
    return {
      filter: '[0:v][1:v]concat=n=2:v=1:a=0[outv]',
      outputDuration: video1Duration, // Would need video2 duration too
    };
  }

  const offset = video1Duration - duration;
  const xfadeType = TRANSITION_MAP[type] || 'fade';

  return {
    filter: `[0:v][1:v]xfade=transition=${xfadeType}:duration=${duration}:offset=${offset}[outv]`,
    outputDuration: offset, // Approximate, would need video2 duration
  };
}

/**
 * Build filter complex for multiple videos with transitions
 */
export function buildMultiVideoTransition(
  videoDurations: number[],
  transitions: TransitionConfig[]
): string {
  if (videoDurations.length < 2) {
    return '[0:v]copy[outv]';
  }

  const filters: string[] = [];
  let cumulativeOffset = 0;

  // Scale all inputs to same size first
  for (let i = 0; i < videoDurations.length; i++) {
    filters.push(
      `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,` +
      `pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v${i}]`
    );
  }

  // Apply transitions
  let currentLabel = 'v0';
  cumulativeOffset = videoDurations[0];

  for (let i = 1; i < videoDurations.length; i++) {
    const transition = transitions[i - 1] || TRANSITION_PRESETS['smooth-fade'];
    const outputLabel = i === videoDurations.length - 1 ? 'outv' : `t${i}`;

    const offset = cumulativeOffset - transition.duration;
    const xfadeType = TRANSITION_MAP[transition.type] || 'fade';

    if (transition.type === 'none' || transition.duration === 0) {
      filters.push(`[${currentLabel}][v${i}]concat=n=2:v=1:a=0[${outputLabel}]`);
      cumulativeOffset += videoDurations[i];
    } else {
      filters.push(
        `[${currentLabel}][v${i}]xfade=transition=${xfadeType}:duration=${transition.duration}:offset=${offset}[${outputLabel}]`
      );
      cumulativeOffset = offset + videoDurations[i];
    }

    currentLabel = outputLabel;
  }

  return filters.join(';');
}

/**
 * Get recommended transition for content type
 */
export function getRecommendedTransition(
  contentType: 'social' | 'corporate' | 'creative' | 'documentary'
): TransitionConfig {
  const recommendations: Record<string, TransitionConfig> = {
    social: TRANSITION_PRESETS['quick-fade'],
    corporate: TRANSITION_PRESETS['smooth-fade'],
    creative: TRANSITION_PRESETS['long-dissolve'],
    documentary: TRANSITION_PRESETS['cut'],
  };

  return recommendations[contentType] || TRANSITION_PRESETS['smooth-fade'];
}

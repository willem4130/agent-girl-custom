/**
 * Video Editor Module
 *
 * FFmpeg-based video editing pipeline.
 */

export { createEditPipeline, VideoEditPipeline } from './pipeline';
export { addLogoOverlay, generateLogoOverlayFilter, type LogoOverlayOptions } from './logo-overlay';
export { addSubtitles, parseSrt, generateSubtitleFilter } from './subtitles';
export { applyTransition, getTransitionFilter, TRANSITION_PRESETS } from './transitions';
export { addAudio, mixAudio, type AudioMixOptions } from './audio';

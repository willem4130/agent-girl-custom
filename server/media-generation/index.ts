/**
 * Media Generation Module
 *
 * Exports all media generation functionality.
 */

// Types
export * from './types';

// Providers
export { generateImage, getImageProvider } from './providers';
export { generateVideo, getVideoProvider } from './video-providers';

// Prompt Engine
export { buildImagePrompt, applyStylePreset, applyAntiAiTechniques } from './prompt-engine';

// Video Editor
export { createEditPipeline, addLogoOverlay, addSubtitles } from './video-editor';

// Utils
export { getAspectRatioDimensions, saveMediaFile, getMediaStoragePath } from './utils/storage';

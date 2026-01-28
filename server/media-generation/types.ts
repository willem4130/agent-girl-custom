/**
 * Media Generation Types
 *
 * TypeScript interfaces for image/video generation, providers, and editing.
 */

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export type ImageProvider = 'seedream' | 'nano-banana' | 'nano-banana-pro';
export type VideoProvider = 'kling-2.5' | 'kling-2.6' | 'wan-2.6' | 'veo-3.1';

export interface ProviderConfig {
  name: string;
  displayName: string;
  costPerGeneration: number; // cents
  maxResolution: { width: number; height: number };
  supportedAspectRatios: string[];
  averageGenerationTimeMs: number;
}

export const IMAGE_PROVIDERS: Record<ImageProvider, ProviderConfig> = {
  seedream: {
    name: 'seedream',
    displayName: 'Seedream 4.5',
    costPerGeneration: 2, // ~$0.02
    maxResolution: { width: 1024, height: 1024 },
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    averageGenerationTimeMs: 8000,
  },
  'nano-banana': {
    name: 'nano-banana',
    displayName: 'Nano Banana',
    costPerGeneration: 5, // ~$0.05
    maxResolution: { width: 1024, height: 1024 },
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    averageGenerationTimeMs: 6000,
  },
  'nano-banana-pro': {
    name: 'nano-banana-pro',
    displayName: 'Nano Banana Pro',
    costPerGeneration: 10, // ~$0.10
    maxResolution: { width: 2048, height: 2048 },
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'],
    averageGenerationTimeMs: 12000,
  },
};

export const VIDEO_PROVIDERS: Record<VideoProvider, ProviderConfig & { maxDuration: number }> = {
  'kling-2.5': {
    name: 'kling-2.5',
    displayName: 'Kling 2.5 Turbo',
    costPerGeneration: 25, // ~$0.25 per 5s
    maxResolution: { width: 1920, height: 1080 },
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    averageGenerationTimeMs: 120000,
    maxDuration: 10,
  },
  'kling-2.6': {
    name: 'kling-2.6',
    displayName: 'Kling 2.6',
    costPerGeneration: 50, // ~$0.50 per 5s
    maxResolution: { width: 1920, height: 1080 },
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    averageGenerationTimeMs: 180000,
    maxDuration: 10,
  },
  'wan-2.6': {
    name: 'wan-2.6',
    displayName: 'Wan 2.6',
    costPerGeneration: 40, // ~$0.40 per 5s
    maxResolution: { width: 1280, height: 720 },
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    averageGenerationTimeMs: 150000,
    maxDuration: 5,
  },
  'veo-3.1': {
    name: 'veo-3.1',
    displayName: 'Veo 3.1',
    costPerGeneration: 100, // ~$1.00 per generation
    maxResolution: { width: 1920, height: 1080 },
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    averageGenerationTimeMs: 300000,
    maxDuration: 8,
  },
};

// ============================================================================
// IMAGE GENERATION TYPES
// ============================================================================

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  provider?: ImageProvider;
  aspectRatio?: string;
  width?: number;
  height?: number;
  seed?: number;
  stylePreset?: string;
  brandId?: string;
  copyId?: string;
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  localPath?: string;
  width?: number;
  height?: number;
  seed?: number;
  generationTimeMs?: number;
  costCents?: number;
  error?: string;
}

// ============================================================================
// VIDEO GENERATION TYPES
// ============================================================================

export interface VideoGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  provider?: VideoProvider;
  aspectRatio?: string;
  duration?: number;
  resolution?: string;
  startImageUrl?: string;
  endImageUrl?: string;
  audioEnabled?: boolean;
  brandId?: string;
  copyId?: string;
  imageId?: string;
}

export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  localPath?: string;
  duration?: number;
  generationTimeMs?: number;
  costCents?: number;
  error?: string;
}

// ============================================================================
// STYLE PRESETS
// ============================================================================

export type StylePreset =
  | 'photoshoot'
  | 'minimal'
  | 'corporate'
  | 'lifestyle'
  | 'product'
  | 'social-media'
  | 'editorial'
  | 'cinematic'
  | 'documentary';

// Advanced style presets (from style-templates.ts)
export type AdvancedStylePreset =
  | 'photoshoot-professional'
  | 'anime-modern'
  | 'anime-ghibli'
  | 'cartoon-pixar'
  | 'cartoon-disney'
  | '3d-octane'
  | '3d-unreal'
  | 'illustration-editorial'
  | 'illustration-concept'
  | 'cyberpunk-neon'
  | 'cyberpunk-gritty'
  | 'pixel-art-retro'
  | 'pixel-art-modern'
  | 'cinematic-film'
  | 'cinematic-noir'
  | 'watercolor-loose'
  | 'watercolor-detailed';

export interface StylePresetConfig {
  name: StylePreset;
  displayName: string;
  description: string;
  basePromptAdditions: string[];
  negativePromptAdditions: string[];
  recommendedProviders: ImageProvider[];
}

export const STYLE_PRESETS: Record<StylePreset, StylePresetConfig> = {
  photoshoot: {
    name: 'photoshoot',
    displayName: 'Professional Photoshoot',
    description: 'High-end commercial photography style',
    basePromptAdditions: [
      'professional photography',
      'studio lighting',
      'high resolution',
      '8K',
      'sharp focus',
    ],
    negativePromptAdditions: [
      'blurry',
      'low quality',
      'amateur',
      'grainy',
    ],
    recommendedProviders: ['seedream', 'nano-banana-pro'],
  },
  minimal: {
    name: 'minimal',
    displayName: 'Minimalist',
    description: 'Clean, simple compositions with negative space',
    basePromptAdditions: [
      'minimalist',
      'clean composition',
      'negative space',
      'simple background',
    ],
    negativePromptAdditions: [
      'cluttered',
      'busy background',
      'complex',
    ],
    recommendedProviders: ['seedream', 'nano-banana'],
  },
  corporate: {
    name: 'corporate',
    displayName: 'Corporate/Business',
    description: 'Professional business imagery',
    basePromptAdditions: [
      'corporate',
      'professional',
      'business environment',
      'clean',
      'modern office',
    ],
    negativePromptAdditions: [
      'casual',
      'unprofessional',
      'messy',
    ],
    recommendedProviders: ['seedream', 'nano-banana-pro'],
  },
  lifestyle: {
    name: 'lifestyle',
    displayName: 'Lifestyle',
    description: 'Natural, authentic lifestyle imagery',
    basePromptAdditions: [
      'lifestyle photography',
      'natural lighting',
      'authentic',
      'candid moment',
    ],
    negativePromptAdditions: [
      'posed',
      'artificial',
      'staged',
    ],
    recommendedProviders: ['nano-banana', 'nano-banana-pro'],
  },
  product: {
    name: 'product',
    displayName: 'Product Photography',
    description: 'Clean product shots for e-commerce',
    basePromptAdditions: [
      'product photography',
      'studio lighting',
      'white background',
      'commercial photography',
      'sharp focus',
    ],
    negativePromptAdditions: [
      'shadows',
      'reflections',
      'distorted',
    ],
    recommendedProviders: ['seedream', 'nano-banana-pro'],
  },
  'social-media': {
    name: 'social-media',
    displayName: 'Social Media',
    description: 'Optimized for social media platforms',
    basePromptAdditions: [
      'social media style',
      'vibrant colors',
      'eye-catching',
      'high engagement',
    ],
    negativePromptAdditions: [
      'dull',
      'boring',
      'low contrast',
    ],
    recommendedProviders: ['seedream', 'nano-banana'],
  },
  editorial: {
    name: 'editorial',
    displayName: 'Editorial',
    description: 'Magazine-quality editorial style',
    basePromptAdditions: [
      'editorial photography',
      'magazine quality',
      'artistic',
      'fashion photography',
    ],
    negativePromptAdditions: [
      'amateur',
      'snapshot',
      'casual',
    ],
    recommendedProviders: ['nano-banana-pro'],
  },
  cinematic: {
    name: 'cinematic',
    displayName: 'Cinematic',
    description: 'Movie-like cinematic look',
    basePromptAdditions: [
      'cinematic',
      'film grain',
      'dramatic lighting',
      'movie still',
      'anamorphic',
    ],
    negativePromptAdditions: [
      'flat',
      'overexposed',
      'digital look',
    ],
    recommendedProviders: ['nano-banana-pro', 'seedream'],
  },
  documentary: {
    name: 'documentary',
    displayName: 'Documentary',
    description: 'Authentic documentary style',
    basePromptAdditions: [
      'documentary photography',
      'photojournalistic',
      'authentic',
      'real moment',
    ],
    negativePromptAdditions: [
      'staged',
      'artificial',
      'posed',
    ],
    recommendedProviders: ['nano-banana', 'seedream'],
  },
};

// ============================================================================
// ASPECT RATIO TYPES
// ============================================================================

export interface AspectRatioConfig {
  ratio: string;
  width: number;
  height: number;
  displayName: string;
  platforms: string[];
}

export const ASPECT_RATIOS: Record<string, AspectRatioConfig> = {
  '1:1': {
    ratio: '1:1',
    width: 1024,
    height: 1024,
    displayName: 'Square',
    platforms: ['Instagram Feed', 'Facebook', 'LinkedIn'],
  },
  '16:9': {
    ratio: '16:9',
    width: 1920,
    height: 1080,
    displayName: 'Landscape',
    platforms: ['YouTube', 'Twitter', 'LinkedIn'],
  },
  '9:16': {
    ratio: '9:16',
    width: 1080,
    height: 1920,
    displayName: 'Portrait/Stories',
    platforms: ['Instagram Stories', 'TikTok', 'Reels'],
  },
  '4:3': {
    ratio: '4:3',
    width: 1024,
    height: 768,
    displayName: 'Standard',
    platforms: ['Presentations', 'Blog'],
  },
  '3:4': {
    ratio: '3:4',
    width: 768,
    height: 1024,
    displayName: 'Portrait',
    platforms: ['Pinterest', 'Instagram'],
  },
  '21:9': {
    ratio: '21:9',
    width: 2560,
    height: 1080,
    displayName: 'Ultra-wide',
    platforms: ['Website Hero', 'Banners'],
  },
};

// ============================================================================
// VIDEO EDITING TYPES
// ============================================================================

export type TransitionType = 'fade' | 'dissolve' | 'wipe' | 'slide' | 'zoom' | 'none';

export interface TransitionConfig {
  type: TransitionType;
  duration: number; // seconds
}

export interface AudioConfig {
  url?: string;
  volume: number; // 0-1
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
}

export interface SubtitleConfig {
  srtContent?: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  position?: 'top' | 'center' | 'bottom';
}

export interface LogoOverlayConfig {
  logoUrl: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  size: number; // percentage of video width (e.g., 10 = 10%)
  opacity: number; // 0-1
  margin: number; // pixels from edge
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
}

export interface VideoEditPipelineConfig {
  videoIds: string[];
  transitions: TransitionConfig[];
  audio?: AudioConfig;
  subtitles?: SubtitleConfig;
  logoOverlay?: LogoOverlayConfig;
  outputAspectRatio?: string;
  platform?: 'tiktok' | 'reels' | 'youtube' | 'linkedin';
}

export interface VideoEditResult {
  success: boolean;
  outputUrl?: string;
  localPath?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
}

// ============================================================================
// ANTI-AI DETECTION TECHNIQUES
// ============================================================================

export interface AntiAiTechnique {
  name: string;
  description: string;
  promptAddition: string;
}

export const ANTI_AI_TECHNIQUES: AntiAiTechnique[] = [
  {
    name: 'film-grain',
    description: 'Adds subtle film grain texture',
    promptAddition: 'subtle film grain, analog photography texture',
  },
  {
    name: 'subsurface-scattering',
    description: 'Realistic skin rendering',
    promptAddition: 'subsurface scattering, realistic skin texture, natural pores',
  },
  {
    name: 'lens-imperfections',
    description: 'Camera lens characteristics',
    promptAddition: 'subtle lens flare, chromatic aberration, natural bokeh',
  },
  {
    name: 'motion-blur',
    description: 'Natural motion blur',
    promptAddition: 'slight motion blur, natural movement',
  },
  {
    name: 'depth-of-field',
    description: 'Realistic focus falloff',
    promptAddition: 'shallow depth of field, natural focus gradient, bokeh background',
  },
  {
    name: 'natural-lighting',
    description: 'Realistic lighting conditions',
    promptAddition: 'natural lighting, golden hour, soft shadows, diffused light',
  },
  {
    name: 'environmental-details',
    description: 'Realistic environmental textures',
    promptAddition: 'environmental details, dust particles, atmospheric haze',
  },
];

// ============================================================================
// WEBSOCKET MESSAGE TYPES
// ============================================================================

export type MediaWebSocketMessage =
  | { type: 'image_generation_started'; imageId: string }
  | { type: 'image_generation_progress'; imageId: string; progress: number }
  | { type: 'image_generation_completed'; imageId: string; imageUrl: string }
  | { type: 'image_generation_failed'; imageId: string; error: string }
  | { type: 'video_generation_started'; videoId: string }
  | { type: 'video_generation_progress'; videoId: string; progress: number; stage: string }
  | { type: 'video_generation_completed'; videoId: string; videoUrl: string }
  | { type: 'video_generation_failed'; videoId: string; error: string }
  | { type: 'video_editing_progress'; editId: string; progress: number }
  | { type: 'video_editing_completed'; editId: string; outputUrl: string }
  | { type: 'video_editing_failed'; editId: string; error: string };

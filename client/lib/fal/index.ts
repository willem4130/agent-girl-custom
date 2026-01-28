/**
 * Fal.ai API Module
 * Provides access to various AI image and video generation models
 */

// Client utilities
export {
  configureFalClient,
  parseFalError,
  fal,
  type QueueStatus,
  type QueueUpdate,
  type FalImage,
  type FalVideo,
  type ErrorCode,
  type ErrorResponse,
} from "./client";

// Nano Banana Pro - Image generation
export {
  // Client
  NanoBananaProClient,
  createNanoBananaProClient,
  // Model IDs
  NANO_BANANA_PRO_MODEL,
  NANO_BANANA_PRO_EDIT_MODEL,
  // Types
  type AspectRatio as NanoBananaProAspectRatio,
  type Resolution as NanoBananaProResolution,
  type OutputFormat as NanoBananaProOutputFormat,
  type NanoBananaProInput,
  type NanoBananaProEditInput,
  type NanoBananaProOutput,
  // Constants
  ASPECT_RATIOS as NANO_BANANA_PRO_ASPECT_RATIOS,
  RESOLUTIONS as NANO_BANANA_PRO_RESOLUTIONS,
  OUTPUT_FORMATS as NANO_BANANA_PRO_OUTPUT_FORMATS,
  DEFAULT_ASPECT_RATIO as NANO_BANANA_PRO_DEFAULT_ASPECT_RATIO,
  DEFAULT_RESOLUTION as NANO_BANANA_PRO_DEFAULT_RESOLUTION,
  DEFAULT_OUTPUT_FORMAT as NANO_BANANA_PRO_DEFAULT_OUTPUT_FORMAT,
  MAX_PROMPT_LENGTH as NANO_BANANA_PRO_MAX_PROMPT_LENGTH,
  MAX_REFERENCE_IMAGES as NANO_BANANA_PRO_MAX_REFERENCE_IMAGES,
  MAX_IMAGE_SIZE_MB as NANO_BANANA_PRO_MAX_IMAGE_SIZE_MB,
} from "./nano-banana-pro";

// Kling 2.6 - Video generation
export {
  // Client
  Kling26Client,
  createKling26Client,
  // Model IDs
  KLING_26_TEXT_TO_VIDEO_MODEL,
  KLING_26_IMAGE_TO_VIDEO_MODEL,
  // Types
  type AspectRatio as Kling26AspectRatio,
  type Duration as Kling26Duration,
  type Kling26TextToVideoInput,
  type Kling26ImageToVideoInput,
  type Kling26Output,
  // Constants
  ASPECT_RATIOS as KLING_26_ASPECT_RATIOS,
  DURATIONS as KLING_26_DURATIONS,
  DEFAULT_ASPECT_RATIO as KLING_26_DEFAULT_ASPECT_RATIO,
  DEFAULT_DURATION as KLING_26_DEFAULT_DURATION,
  DEFAULT_CFG_SCALE as KLING_26_DEFAULT_CFG_SCALE,
  DEFAULT_GENERATE_AUDIO as KLING_26_DEFAULT_GENERATE_AUDIO,
  MAX_PROMPT_LENGTH as KLING_26_MAX_PROMPT_LENGTH,
  MAX_NEGATIVE_PROMPT_LENGTH as KLING_26_MAX_NEGATIVE_PROMPT_LENGTH,
  MAX_IMAGE_SIZE_MB as KLING_26_MAX_IMAGE_SIZE_MB,
} from "./kling-2.6";

// Kling 2.5 Turbo - Video generation
export {
  // Client
  Kling25TurboClient,
  createKling25TurboClient,
  // Model IDs
  KLING_25_TURBO_TEXT_TO_VIDEO_MODEL,
  KLING_25_TURBO_IMAGE_TO_VIDEO_MODEL,
  // Types
  type AspectRatio as Kling25TurboAspectRatio,
  type Duration as Kling25TurboDuration,
  type SpecialFx as Kling25TurboSpecialFx,
  type Kling25TurboTextToVideoInput,
  type Kling25TurboImageToVideoInput,
  type Kling25TurboOutput,
  // Constants
  ASPECT_RATIOS as KLING_25_TURBO_ASPECT_RATIOS,
  DURATIONS as KLING_25_TURBO_DURATIONS,
  SPECIAL_FX_OPTIONS as KLING_25_TURBO_SPECIAL_FX_OPTIONS,
  DEFAULT_ASPECT_RATIO as KLING_25_TURBO_DEFAULT_ASPECT_RATIO,
  DEFAULT_DURATION as KLING_25_TURBO_DEFAULT_DURATION,
  DEFAULT_CFG_SCALE as KLING_25_TURBO_DEFAULT_CFG_SCALE,
  MAX_PROMPT_LENGTH as KLING_25_TURBO_MAX_PROMPT_LENGTH,
  MAX_NEGATIVE_PROMPT_LENGTH as KLING_25_TURBO_MAX_NEGATIVE_PROMPT_LENGTH,
  MAX_IMAGE_SIZE_MB as KLING_25_TURBO_MAX_IMAGE_SIZE_MB,
} from "./kling-2.5-turbo";

// Wan 2.6 - Video generation
export {
  // Client
  Wan26Client,
  createWan26Client,
  // Model IDs
  WAN_26_TEXT_TO_VIDEO_MODEL,
  WAN_26_IMAGE_TO_VIDEO_MODEL,
  WAN_26_REFERENCE_TO_VIDEO_MODEL,
  // Types
  type AspectRatio as Wan26AspectRatio,
  type Resolution as Wan26Resolution,
  type Duration as Wan26Duration,
  type ShotType as Wan26ShotType,
  type Wan26TextToVideoInput,
  type Wan26ImageToVideoInput,
  type Wan26ReferenceToVideoInput,
  type Wan26Output,
  // Constants
  ASPECT_RATIOS as WAN_26_ASPECT_RATIOS,
  RESOLUTIONS as WAN_26_RESOLUTIONS,
  DURATIONS as WAN_26_DURATIONS,
  DEFAULT_ASPECT_RATIO as WAN_26_DEFAULT_ASPECT_RATIO,
  DEFAULT_RESOLUTION as WAN_26_DEFAULT_RESOLUTION,
  DEFAULT_DURATION as WAN_26_DEFAULT_DURATION,
  DEFAULT_ENABLE_PROMPT_EXPANSION as WAN_26_DEFAULT_ENABLE_PROMPT_EXPANSION,
  DEFAULT_MULTI_SHOTS as WAN_26_DEFAULT_MULTI_SHOTS,
  MAX_PROMPT_LENGTH as WAN_26_MAX_PROMPT_LENGTH,
  MAX_NEGATIVE_PROMPT_LENGTH as WAN_26_MAX_NEGATIVE_PROMPT_LENGTH,
  MAX_IMAGE_SIZE_MB as WAN_26_MAX_IMAGE_SIZE_MB,
  MAX_REFERENCE_VIDEOS as WAN_26_MAX_REFERENCE_VIDEOS,
  MAX_SEED as WAN_26_MAX_SEED,
} from "./wan-2.6";

// Seedream 4.5 - Image generation
export {
  // Client
  Seedream45Client,
  createSeedream45Client,
  // Model IDs
  SEEDREAM_45_MODEL,
  SEEDREAM_45_EDIT_MODEL,
  // Types
  type Seedream45AspectRatio,
  type Seedream45OutputFormat,
  type Seedream45ImageSize,
  type Seedream45Input,
  type Seedream45EditInput,
  type Seedream45Output,
  // Constants
  SEEDREAM_45_ASPECT_RATIOS,
  SEEDREAM_45_OUTPUT_FORMATS,
  SEEDREAM_45_DEFAULT_ASPECT_RATIO,
  SEEDREAM_45_DEFAULT_OUTPUT_FORMAT,
  SEEDREAM_45_MAX_PROMPT_LENGTH,
  SEEDREAM_45_MAX_REFERENCE_IMAGES,
  SEEDREAM_45_MAX_IMAGE_SIZE_MB,
  SEEDREAM_45_MAX_DIMENSION,
} from "./seedream-4.5";

// Veo 3.1 - Video generation
export {
  // Client
  Veo31Client,
  createVeo31Client,
  // Model IDs
  VEO_31_MODEL,
  VEO_31_FAST_MODEL,
  VEO_31_I2V_MODEL,
  VEO_31_I2V_FAST_MODEL,
  // Types
  type Veo31Duration,
  type Veo31AspectRatio,
  type Veo31Resolution,
  type Veo31Speed,
  type Veo31Mode,
  type Veo31Input,
  type Veo31FirstLastFrameInput,
  type Veo31ImageToVideoInput,
  type Veo31Output,
  // Constants
  VEO_31_DURATIONS,
  VEO_31_ASPECT_RATIOS,
  VEO_31_RESOLUTIONS,
  VEO_31_SPEEDS,
  VEO_31_MODES,
  VEO_31_DEFAULT_DURATION,
  VEO_31_DEFAULT_ASPECT_RATIO,
  VEO_31_DEFAULT_RESOLUTION,
  VEO_31_DEFAULT_SPEED,
  VEO_31_DEFAULT_MODE,
  VEO_31_MAX_PROMPT_LENGTH as VEO_31_MAX_PROMPT_LENGTH,
} from "./veo-3.1";

// Video Configuration - UI to API mapping
export {
  // Types
  type VideoModelId,
  type VideoMode,
  type AspectRatio as VideoAspectRatio,
  type Duration as VideoDuration,
  type Resolution as VideoResolution,
  type VideoModelConfig,
  type VideoGenerationState,
  // Constants
  VIDEO_MODELS,
  // Functions
  getAvailableModels,
  getModelConfig,
  getDefaultState,
  calculatePrice,
  validateState,
  toKling26Params,
  toKling25TurboParams,
  toWan26Params,
  toApiParams,
} from "./video-config";

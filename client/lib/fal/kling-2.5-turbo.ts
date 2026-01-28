/**
 * Fal.ai Kling 2.5 Turbo Video Generation API Module
 * Fast, high-quality video generation with advanced motion control
 *
 * Endpoints:
 * - fal-ai/kling-video/v2.5-turbo/pro/text-to-video
 * - fal-ai/kling-video/v2.5-turbo/pro/image-to-video
 */

import {
  fal,
  configureFalClient,
  type QueueUpdate,
  type FalVideo,
} from "./client";

// Model IDs
export const KLING_25_TURBO_TEXT_TO_VIDEO_MODEL =
  "fal-ai/kling-video/v2.5-turbo/pro/text-to-video";
export const KLING_25_TURBO_IMAGE_TO_VIDEO_MODEL =
  "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";

// Types
export type AspectRatio = "16:9" | "9:16" | "1:1";

export type Duration = "5" | "10";

// Special effects available
export type SpecialFx =
  | "hug"
  | "kiss"
  | "heart_gesture"
  | "squish"
  | "expansion"
  | "fuzzyfuzzy"
  | "bloombloom"
  | "dizzydizzy"
  | "jelly_press"
  | "jelly_slice"
  | "jelly_squish"
  | "jelly_jiggle"
  | "pixelpixel"
  | "yearbook"
  | "instant_film"
  | "anime_figure"
  | "rocketrocket";

// Input schemas
export interface Kling25TurboTextToVideoInput {
  /** Text description of the video to generate (required, max 2500 chars) */
  prompt: string;
  /** Video duration in seconds. Default: "5" */
  duration?: Duration;
  /** Aspect ratio of the video. Default: "16:9" */
  aspect_ratio?: AspectRatio;
  /** Things to avoid in generation */
  negative_prompt?: string;
  /** CFG scale (0-1). Controls prompt adherence. Default: 0.5 */
  cfg_scale?: number;
  /** Random seed for reproducibility */
  seed?: number;
}

export interface Kling25TurboImageToVideoInput {
  /** Text description guiding the video generation (required, max 2500 chars) */
  prompt: string;
  /** URL of the starting image (required). Accepts jpg, jpeg, png, webp, gif, avif */
  image_url: string;
  /** Video duration in seconds. Default: "5" */
  duration?: Duration;
  /** Aspect ratio of the output video. Default: inferred from image or "16:9" */
  aspect_ratio?: AspectRatio;
  /** Things to avoid in generation */
  negative_prompt?: string;
  /** CFG scale (0-1). Controls prompt adherence. Default: 0.5 */
  cfg_scale?: number;
  /** Optional end/tail frame image URL for interpolation */
  tail_image_url?: string;
  /** Special effects to apply */
  special_fx?: SpecialFx;
  /** URL of mask for dynamic brush application area */
  dynamic_mask_url?: string;
  /** URL of mask for static brush application area */
  static_mask_url?: string;
  /** Random seed for reproducibility */
  seed?: number;
}

// Output schema
export interface Kling25TurboOutput {
  /** Generated video */
  video: FalVideo;
  /** Seed used for generation */
  seed?: number;
}

// Constants
export const ASPECT_RATIOS: AspectRatio[] = ["16:9", "9:16", "1:1"];
export const DURATIONS: Duration[] = ["5", "10"];

export const SPECIAL_FX_OPTIONS: SpecialFx[] = [
  "hug",
  "kiss",
  "heart_gesture",
  "squish",
  "expansion",
  "fuzzyfuzzy",
  "bloombloom",
  "dizzydizzy",
  "jelly_press",
  "jelly_slice",
  "jelly_squish",
  "jelly_jiggle",
  "pixelpixel",
  "yearbook",
  "instant_film",
  "anime_figure",
  "rocketrocket",
];

export const DEFAULT_ASPECT_RATIO: AspectRatio = "16:9";
export const DEFAULT_DURATION: Duration = "5";
export const DEFAULT_CFG_SCALE = 0.5;

export const MAX_PROMPT_LENGTH = 2500;
export const MAX_NEGATIVE_PROMPT_LENGTH = 500;
export const MAX_IMAGE_SIZE_MB = 10;

/**
 * Kling 2.5 Turbo Video Generation API Client
 */
export class Kling25TurboClient {
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("API key is required");
    }
    configureFalClient(apiKey);
  }

  /**
   * Generate video from text prompt
   */
  async generateTextToVideo(
    input: Kling25TurboTextToVideoInput,
    options?: {
      onQueueUpdate?: (update: QueueUpdate) => void;
    }
  ): Promise<Kling25TurboOutput> {
    if (!input.prompt) {
      throw new Error("Prompt is required");
    }

    if (input.prompt.length > MAX_PROMPT_LENGTH) {
      throw new Error(
        `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`
      );
    }

    if (
      input.negative_prompt &&
      input.negative_prompt.length > MAX_NEGATIVE_PROMPT_LENGTH
    ) {
      throw new Error(
        `Negative prompt exceeds maximum length of ${MAX_NEGATIVE_PROMPT_LENGTH} characters`
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal.subscribe as any)(
      KLING_25_TURBO_TEXT_TO_VIDEO_MODEL,
      {
        input: {
          prompt: input.prompt,
          duration: input.duration || DEFAULT_DURATION,
          aspect_ratio: input.aspect_ratio || DEFAULT_ASPECT_RATIO,
          negative_prompt: input.negative_prompt,
          cfg_scale: input.cfg_scale ?? DEFAULT_CFG_SCALE,
          ...(input.seed !== undefined && { seed: input.seed }),
        },
        logs: true,
        onQueueUpdate: options?.onQueueUpdate,
      }
    );

    return result.data as Kling25TurboOutput;
  }

  /**
   * Generate video from image
   */
  async generateImageToVideo(
    input: Kling25TurboImageToVideoInput,
    options?: {
      onQueueUpdate?: (update: QueueUpdate) => void;
    }
  ): Promise<Kling25TurboOutput> {
    if (!input.prompt) {
      throw new Error("Prompt is required");
    }

    if (!input.image_url) {
      throw new Error("Image URL is required");
    }

    if (input.prompt.length > MAX_PROMPT_LENGTH) {
      throw new Error(
        `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`
      );
    }

    if (
      input.negative_prompt &&
      input.negative_prompt.length > MAX_NEGATIVE_PROMPT_LENGTH
    ) {
      throw new Error(
        `Negative prompt exceeds maximum length of ${MAX_NEGATIVE_PROMPT_LENGTH} characters`
      );
    }

    const finalAspectRatio = input.aspect_ratio || DEFAULT_ASPECT_RATIO;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal.subscribe as any)(
      KLING_25_TURBO_IMAGE_TO_VIDEO_MODEL,
      {
        input: {
          prompt: input.prompt,
          image_url: input.image_url,
          duration: input.duration || DEFAULT_DURATION,
          aspect_ratio: finalAspectRatio,
          negative_prompt: input.negative_prompt,
          cfg_scale: input.cfg_scale ?? DEFAULT_CFG_SCALE,
          ...(input.tail_image_url && { tail_image_url: input.tail_image_url }),
          ...(input.special_fx && { special_fx: input.special_fx }),
          ...(input.dynamic_mask_url && {
            dynamic_mask_url: input.dynamic_mask_url,
          }),
          ...(input.static_mask_url && {
            static_mask_url: input.static_mask_url,
          }),
          ...(input.seed !== undefined && { seed: input.seed }),
        },
        logs: true,
        onQueueUpdate: options?.onQueueUpdate,
      }
    );

    return result.data as Kling25TurboOutput;
  }
}

/**
 * Create a new Kling 2.5 Turbo client
 */
export function createKling25TurboClient(apiKey: string): Kling25TurboClient {
  return new Kling25TurboClient(apiKey);
}

/**
 * Fal.ai Kling 2.6 Video Generation API Module
 * Premium video generation with native audio support
 *
 * Endpoints:
 * - fal-ai/kling-video/v2.6/pro/text-to-video
 * - fal-ai/kling-video/v2.6/pro/image-to-video
 */

import {
  fal,
  configureFalClient,
  type QueueUpdate,
  type FalVideo,
} from "./client";

// Model IDs
export const KLING_26_TEXT_TO_VIDEO_MODEL =
  "fal-ai/kling-video/v2.6/pro/text-to-video";
export const KLING_26_IMAGE_TO_VIDEO_MODEL =
  "fal-ai/kling-video/v2.6/pro/image-to-video";

// Types
export type AspectRatio = "16:9" | "9:16" | "1:1";

export type Duration = "5" | "10";

// Input schemas
export interface Kling26TextToVideoInput {
  /** Text description of the video to generate (required) */
  prompt: string;
  /** Video duration in seconds. Default: "5" */
  duration?: Duration;
  /** Aspect ratio of the video. Default: "16:9" */
  aspect_ratio?: AspectRatio;
  /** Things to avoid in generation */
  negative_prompt?: string;
  /** CFG scale (0-1). Controls prompt adherence. Default: 0.5 */
  cfg_scale?: number;
  /** Enable audio generation. Default: true */
  generate_audio?: boolean;
  /** Random seed for reproducibility */
  seed?: number;
}

export interface Kling26ImageToVideoInput {
  /** Text description guiding the video generation (required) */
  prompt: string;
  /** URL of the starting image (required) */
  image_url: string;
  /** Video duration in seconds. Default: "5" */
  duration?: Duration;
  /** Aspect ratio of the output video. Default: inferred from image or "16:9" */
  aspect_ratio?: AspectRatio;
  /** Things to avoid in generation */
  negative_prompt?: string;
  /** CFG scale (0-1). Controls prompt adherence. Default: 0.5 */
  cfg_scale?: number;
  /** Enable audio generation. Default: true */
  generate_audio?: boolean;
  /** Optional end frame image URL for interpolation */
  last_image_url?: string;
  /** Random seed for reproducibility */
  seed?: number;
}

// Output schema
export interface Kling26Output {
  /** Generated video */
  video: FalVideo;
  /** Seed used for generation */
  seed?: number;
}

// Constants
export const ASPECT_RATIOS: AspectRatio[] = ["16:9", "9:16", "1:1"];
export const DURATIONS: Duration[] = ["5", "10"];

export const DEFAULT_ASPECT_RATIO: AspectRatio = "16:9";
export const DEFAULT_DURATION: Duration = "5";
export const DEFAULT_CFG_SCALE = 0.5;
export const DEFAULT_GENERATE_AUDIO = true;

export const MAX_PROMPT_LENGTH = 2500;
export const MAX_NEGATIVE_PROMPT_LENGTH = 500;
export const MAX_IMAGE_SIZE_MB = 10;

/**
 * Kling 2.6 Video Generation API Client
 */
export class Kling26Client {
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
    input: Kling26TextToVideoInput,
    options?: {
      onQueueUpdate?: (update: QueueUpdate) => void;
    }
  ): Promise<Kling26Output> {
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
    const result = await (fal.subscribe as any)(KLING_26_TEXT_TO_VIDEO_MODEL, {
      input: {
        prompt: input.prompt,
        duration: input.duration || DEFAULT_DURATION,
        aspect_ratio: input.aspect_ratio || DEFAULT_ASPECT_RATIO,
        negative_prompt: input.negative_prompt,
        cfg_scale: input.cfg_scale ?? DEFAULT_CFG_SCALE,
        generate_audio: input.generate_audio ?? DEFAULT_GENERATE_AUDIO,
        ...(input.seed !== undefined && { seed: input.seed }),
      },
      logs: true,
      onQueueUpdate: options?.onQueueUpdate,
    });

    return result.data as Kling26Output;
  }

  /**
   * Generate video from image
   */
  async generateImageToVideo(
    input: Kling26ImageToVideoInput,
    options?: {
      onQueueUpdate?: (update: QueueUpdate) => void;
    }
  ): Promise<Kling26Output> {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal.subscribe as any)(KLING_26_IMAGE_TO_VIDEO_MODEL, {
      input: {
        prompt: input.prompt,
        image_url: input.image_url,
        duration: input.duration || DEFAULT_DURATION,
        aspect_ratio: input.aspect_ratio || DEFAULT_ASPECT_RATIO,
        negative_prompt: input.negative_prompt,
        cfg_scale: input.cfg_scale ?? DEFAULT_CFG_SCALE,
        generate_audio: input.generate_audio ?? DEFAULT_GENERATE_AUDIO,
        ...(input.last_image_url && { last_image_url: input.last_image_url }),
        ...(input.seed !== undefined && { seed: input.seed }),
      },
      logs: true,
      onQueueUpdate: options?.onQueueUpdate,
    });

    return result.data as Kling26Output;
  }
}

/**
 * Create a new Kling 2.6 client
 */
export function createKling26Client(apiKey: string): Kling26Client {
  return new Kling26Client(apiKey);
}

/**
 * Fal.ai Wan 2.6 Video Generation API Module
 * Multi-modal video generation with text, image, and reference support
 *
 * Endpoints:
 * - wan/v2.6/text-to-video
 * - wan/v2.6/image-to-video
 * - wan/v2.6/reference-to-video
 */

import {
  fal,
  configureFalClient,
  type QueueUpdate,
  type FalVideo,
} from "./client";

// Model IDs
export const WAN_26_TEXT_TO_VIDEO_MODEL = "wan/v2.6/text-to-video";
export const WAN_26_IMAGE_TO_VIDEO_MODEL = "wan/v2.6/image-to-video";
export const WAN_26_REFERENCE_TO_VIDEO_MODEL = "wan/v2.6/reference-to-video";

// Types
export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "3:4";

export type Resolution = "720p" | "1080p";

export type Duration = "5" | "10" | "15";

export type ShotType = "single" | "multi";

// Input schemas
export interface Wan26TextToVideoInput {
  /** Text description of the video to generate (required, max 800 chars) */
  prompt: string;
  /** Video duration in seconds. Default: "5" */
  duration?: Duration;
  /** Output resolution. Default: "720p" */
  resolution?: Resolution;
  /** Aspect ratio of the video. Default: "16:9" */
  aspect_ratio?: AspectRatio;
  /** Things to avoid in generation */
  negative_prompt?: string;
  /** Use LLM to enhance the prompt. Default: false */
  enable_prompt_expansion?: boolean;
  /** Enable multi-shot generation with timing. Default: true */
  multi_shots?: boolean;
  /** Random seed for reproducibility */
  seed?: number;
}

export interface Wan26ImageToVideoInput {
  /** Text description guiding the video generation (required, max 800 chars) */
  prompt: string;
  /** URL of the starting image (required) */
  image_url: string;
  /** Video duration in seconds. Default: "5" */
  duration?: Duration;
  /** Output resolution. Default: "720p" */
  resolution?: Resolution;
  /** Aspect ratio of the output video. Default: inferred from image or "16:9" */
  aspect_ratio?: AspectRatio;
  /** Things to avoid in generation */
  negative_prompt?: string;
  /** Use LLM to enhance the prompt. Default: false */
  enable_prompt_expansion?: boolean;
  /** Random seed for reproducibility */
  seed?: number;
}

export interface Wan26ReferenceToVideoInput {
  /** Text description with @Video1, @Video2, @Video3 references (required, max 800 chars) */
  prompt: string;
  /** Array of reference video URLs (required, 1-3 videos) */
  reference_videos: string[];
  /** Video duration in seconds. Default: "5" */
  duration?: Duration;
  /** Output resolution. Default: "720p" */
  resolution?: Resolution;
  /** Aspect ratio of the video. Default: "16:9" */
  aspect_ratio?: AspectRatio;
  /** Things to avoid in generation */
  negative_prompt?: string;
  /** Use LLM to enhance the prompt. Default: false */
  enable_prompt_expansion?: boolean;
  /** Random seed for reproducibility */
  seed?: number;
}

// Output schema
export interface Wan26Output {
  /** Generated video */
  video: FalVideo;
  /** Seed used for generation */
  seed?: number;
}

// Constants
export const ASPECT_RATIOS: AspectRatio[] = [
  "16:9",
  "9:16",
  "1:1",
  "4:3",
  "3:4",
];
export const RESOLUTIONS: Resolution[] = ["720p", "1080p"];
export const DURATIONS: Duration[] = ["5", "10", "15"];

export const DEFAULT_ASPECT_RATIO: AspectRatio = "16:9";
export const DEFAULT_RESOLUTION: Resolution = "720p";
export const DEFAULT_DURATION: Duration = "5";
export const DEFAULT_ENABLE_PROMPT_EXPANSION = false;
export const DEFAULT_MULTI_SHOTS = true;

export const MAX_PROMPT_LENGTH = 800;
export const MAX_NEGATIVE_PROMPT_LENGTH = 500;
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_REFERENCE_VIDEOS = 3;
export const MAX_SEED = 2147483647;

/**
 * Wan 2.6 Video Generation API Client
 */
export class Wan26Client {
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
    input: Wan26TextToVideoInput,
    options?: {
      onQueueUpdate?: (update: QueueUpdate) => void;
    }
  ): Promise<Wan26Output> {
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
    const result = await (fal.subscribe as any)(WAN_26_TEXT_TO_VIDEO_MODEL, {
      input: {
        prompt: input.prompt,
        duration: input.duration || DEFAULT_DURATION,
        resolution: input.resolution || DEFAULT_RESOLUTION,
        aspect_ratio: input.aspect_ratio || DEFAULT_ASPECT_RATIO,
        negative_prompt: input.negative_prompt,
        enable_prompt_expansion:
          input.enable_prompt_expansion ?? DEFAULT_ENABLE_PROMPT_EXPANSION,
        multi_shots: input.multi_shots ?? DEFAULT_MULTI_SHOTS,
        ...(input.seed !== undefined && { seed: input.seed }),
      },
      logs: true,
      onQueueUpdate: options?.onQueueUpdate,
    });

    return result.data as Wan26Output;
  }

  /**
   * Generate video from image
   */
  async generateImageToVideo(
    input: Wan26ImageToVideoInput,
    options?: {
      onQueueUpdate?: (update: QueueUpdate) => void;
    }
  ): Promise<Wan26Output> {
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
    const result = await (fal.subscribe as any)(WAN_26_IMAGE_TO_VIDEO_MODEL, {
      input: {
        prompt: input.prompt,
        image_url: input.image_url,
        duration: input.duration || DEFAULT_DURATION,
        resolution: input.resolution || DEFAULT_RESOLUTION,
        aspect_ratio: input.aspect_ratio || DEFAULT_ASPECT_RATIO,
        negative_prompt: input.negative_prompt,
        enable_prompt_expansion:
          input.enable_prompt_expansion ?? DEFAULT_ENABLE_PROMPT_EXPANSION,
        ...(input.seed !== undefined && { seed: input.seed }),
      },
      logs: true,
      onQueueUpdate: options?.onQueueUpdate,
    });

    return result.data as Wan26Output;
  }

  /**
   * Generate video with reference videos for character/subject consistency
   * Use @Video1, @Video2, @Video3 in prompt to reference subjects from videos
   */
  async generateReferenceToVideo(
    input: Wan26ReferenceToVideoInput,
    options?: {
      onQueueUpdate?: (update: QueueUpdate) => void;
    }
  ): Promise<Wan26Output> {
    if (!input.prompt) {
      throw new Error("Prompt is required");
    }

    if (!input.reference_videos || input.reference_videos.length === 0) {
      throw new Error("At least one reference video is required");
    }

    if (input.reference_videos.length > MAX_REFERENCE_VIDEOS) {
      throw new Error(
        `Maximum ${MAX_REFERENCE_VIDEOS} reference videos allowed`
      );
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
      WAN_26_REFERENCE_TO_VIDEO_MODEL,
      {
        input: {
          prompt: input.prompt,
          reference_videos: input.reference_videos,
          duration: input.duration || DEFAULT_DURATION,
          resolution: input.resolution || DEFAULT_RESOLUTION,
          aspect_ratio: input.aspect_ratio || DEFAULT_ASPECT_RATIO,
          negative_prompt: input.negative_prompt,
          enable_prompt_expansion:
            input.enable_prompt_expansion ?? DEFAULT_ENABLE_PROMPT_EXPANSION,
          ...(input.seed !== undefined && { seed: input.seed }),
        },
        logs: true,
        onQueueUpdate: options?.onQueueUpdate,
      }
    );

    return result.data as Wan26Output;
  }
}

/**
 * Create a new Wan 2.6 client
 */
export function createWan26Client(apiKey: string): Wan26Client {
  return new Wan26Client(apiKey);
}

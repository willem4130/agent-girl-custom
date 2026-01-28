/**
 * Fal.ai Veo 3.1 API Module
 * Google's video generation model with multiple modes
 *
 * Endpoints:
 * First/Last Frame:
 * - Standard: fal-ai/veo3.1/first-last-frame-to-video
 * - Fast: fal-ai/veo3.1/fast/first-last-frame-to-video
 *
 * Image-to-Video:
 * - Standard: fal-ai/veo3.1/image-to-video
 * - Fast: fal-ai/veo3.1/fast/image-to-video
 */

import {
  fal,
  configureFalClient,
  type QueueUpdate,
  type FalVideo,
} from "./client";

// Model IDs - First/Last Frame
export const VEO_31_MODEL = "fal-ai/veo3.1/first-last-frame-to-video";
export const VEO_31_FAST_MODEL = "fal-ai/veo3.1/fast/first-last-frame-to-video";

// Model IDs - Image-to-Video
export const VEO_31_I2V_MODEL = "fal-ai/veo3.1/image-to-video";
export const VEO_31_I2V_FAST_MODEL = "fal-ai/veo3.1/fast/image-to-video";

// Types
export type Veo31Duration = "4s" | "6s" | "8s";
export type Veo31AspectRatio = "auto" | "9:16" | "16:9" | "1:1";
export type Veo31Resolution = "720p" | "1080p";
export type Veo31Speed = "standard" | "fast";
export type Veo31Mode = "first-last-frame" | "image-to-video";

// Input schema for First/Last Frame mode
export interface Veo31FirstLastFrameInput {
  /** URL of the first frame of the video (required) */
  first_frame_url: string;
  /** URL of the last frame of the video (required) */
  last_frame_url: string;
  /** The text prompt describing the video (required) */
  prompt: string;
  /** Duration of the generated video. Default: "8s" */
  duration?: Veo31Duration;
  /** Aspect ratio of the generated video. Default: "auto" */
  aspect_ratio?: Veo31AspectRatio;
  /** Resolution of the generated video. Default: "720p" */
  resolution?: Veo31Resolution;
  /** Whether to generate audio for the video. Default: true */
  generate_audio?: boolean;
  /** Speed/quality tradeoff. "fast" for quicker generation. Default: "standard" */
  speed?: Veo31Speed;
}

// Input schema for Image-to-Video mode
export interface Veo31ImageToVideoInput {
  /** URL of the reference image (required) */
  image_url: string;
  /** The text prompt describing the video (required) */
  prompt: string;
  /** Duration of the generated video. Default: "8s" */
  duration?: Veo31Duration;
  /** Aspect ratio of the generated video. Default: "auto" */
  aspect_ratio?: Veo31AspectRatio;
  /** Resolution of the generated video. Default: "720p" */
  resolution?: Veo31Resolution;
  /** Whether to generate audio for the video. Default: true */
  generate_audio?: boolean;
  /** Speed/quality tradeoff. "fast" for quicker generation. Default: "standard" */
  speed?: Veo31Speed;
}

// Legacy alias for backwards compatibility
export type Veo31Input = Veo31FirstLastFrameInput;

// Output schema
export interface Veo31Output {
  /** The generated video */
  video: FalVideo;
}

// Constants
export const VEO_31_DURATIONS: Veo31Duration[] = ["4s", "6s", "8s"];
export const VEO_31_ASPECT_RATIOS: Veo31AspectRatio[] = [
  "auto",
  "9:16",
  "16:9",
  "1:1",
];
export const VEO_31_RESOLUTIONS: Veo31Resolution[] = ["720p", "1080p"];
export const VEO_31_SPEEDS: Veo31Speed[] = ["standard", "fast"];
export const VEO_31_MODES: Veo31Mode[] = ["image-to-video", "first-last-frame"];

export const VEO_31_DEFAULT_DURATION: Veo31Duration = "8s";
export const VEO_31_DEFAULT_ASPECT_RATIO: Veo31AspectRatio = "auto";
export const VEO_31_DEFAULT_RESOLUTION: Veo31Resolution = "720p";
export const VEO_31_DEFAULT_SPEED: Veo31Speed = "standard";
export const VEO_31_DEFAULT_MODE: Veo31Mode = "image-to-video";

export const VEO_31_MAX_PROMPT_LENGTH = 5000;

/**
 * Veo 3.1 API Client
 */
export class Veo31Client {
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("API key is required");
    }
    configureFalClient(apiKey);
  }

  /**
   * Generate video from first and last frame images
   */
  async generateVideo(
    input: Veo31Input,
    options?: {
      onQueueUpdate?: (update: QueueUpdate) => void;
    }
  ): Promise<Veo31Output> {
    if (!input.first_frame_url) {
      throw new Error("First frame URL is required");
    }

    if (!input.last_frame_url) {
      throw new Error("Last frame URL is required");
    }

    if (!input.prompt) {
      throw new Error("Prompt is required");
    }

    if (input.prompt.length > VEO_31_MAX_PROMPT_LENGTH) {
      throw new Error(
        `Prompt exceeds maximum length of ${VEO_31_MAX_PROMPT_LENGTH} characters`
      );
    }

    // Select model based on speed setting
    const modelId =
      input.speed === "fast" ? VEO_31_FAST_MODEL : VEO_31_MODEL;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal.subscribe as any)(modelId, {
      input: {
        first_frame_url: input.first_frame_url,
        last_frame_url: input.last_frame_url,
        prompt: input.prompt,
        duration: input.duration || VEO_31_DEFAULT_DURATION,
        aspect_ratio: input.aspect_ratio || VEO_31_DEFAULT_ASPECT_RATIO,
        resolution: input.resolution || VEO_31_DEFAULT_RESOLUTION,
        generate_audio: input.generate_audio ?? true,
      },
      logs: true,
      onQueueUpdate: options?.onQueueUpdate,
    });

    return result.data as Veo31Output;
  }

  /**
   * Generate video from a reference image
   */
  async generateImageToVideo(
    input: Veo31ImageToVideoInput,
    options?: {
      onQueueUpdate?: (update: QueueUpdate) => void;
    }
  ): Promise<Veo31Output> {
    if (!input.image_url) {
      throw new Error("Image URL is required");
    }

    if (!input.prompt) {
      throw new Error("Prompt is required");
    }

    if (input.prompt.length > VEO_31_MAX_PROMPT_LENGTH) {
      throw new Error(
        `Prompt exceeds maximum length of ${VEO_31_MAX_PROMPT_LENGTH} characters`
      );
    }

    // Select model based on speed setting
    const modelId =
      input.speed === "fast" ? VEO_31_I2V_FAST_MODEL : VEO_31_I2V_MODEL;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal.subscribe as any)(modelId, {
      input: {
        image_url: input.image_url,
        prompt: input.prompt,
        duration: input.duration || VEO_31_DEFAULT_DURATION,
        aspect_ratio: input.aspect_ratio || VEO_31_DEFAULT_ASPECT_RATIO,
        resolution: input.resolution || VEO_31_DEFAULT_RESOLUTION,
        generate_audio: input.generate_audio ?? true,
      },
      logs: true,
      onQueueUpdate: options?.onQueueUpdate,
    });

    return result.data as Veo31Output;
  }
}

/**
 * Create a new Veo 3.1 client
 */
export function createVeo31Client(apiKey: string): Veo31Client {
  return new Veo31Client(apiKey);
}

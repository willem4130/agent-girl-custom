/**
 * Fal.ai Seedream 4.5 API Module
 * ByteDance's state-of-the-art image generation and editing model
 *
 * Endpoints:
 * - fal-ai/bytedance/seedream/v4.5/text-to-image
 * - fal-ai/bytedance/seedream/v4.5/edit
 */

import {
  fal,
  configureFalClient,
  type QueueUpdate,
  type FalImage,
} from "./client";

// Model IDs
export const SEEDREAM_45_MODEL = "fal-ai/bytedance/seedream/v4.5/text-to-image";
export const SEEDREAM_45_EDIT_MODEL = "fal-ai/bytedance/seedream/v4.5/edit";

// Types
export type Seedream45AspectRatio =
  | "1:1"
  | "16:9"
  | "9:16"
  | "4:3"
  | "3:4"
  | "3:2"
  | "2:3"
  | "21:9"
  | "9:21";

export type Seedream45OutputFormat = "png" | "jpeg" | "webp";

// Image size interface for custom dimensions
export interface Seedream45ImageSize {
  width: number;
  height: number;
}

// Input schemas
export interface Seedream45Input {
  /** The text prompt to generate an image from (required) */
  prompt: string;
  /** Aspect ratio of the output image. Default: "1:1" */
  aspect_ratio?: Seedream45AspectRatio;
  /** Custom image size (alternative to aspect_ratio). Max 4096x4096 */
  image_size?: Seedream45ImageSize;
  /** Number of images to generate (1-6). Default: 1 */
  num_images?: number;
  /** Seed for reproducibility */
  seed?: number;
  /** Enable safety checker on output. Default: true */
  enable_safety_checker?: boolean;
  /** Output format. Default: "png" */
  output_format?: Seedream45OutputFormat;
}

export interface Seedream45EditInput {
  /** The editing instruction prompt (required) */
  prompt: string;
  /** Single input image URL for editing */
  image?: string;
  /** Array of input image URLs for multi-image editing (max 10) */
  image_urls?: string[];
  /** Aspect ratio of the output. Default: preserves original */
  aspect_ratio?: Seedream45AspectRatio;
  /** Custom image size (alternative to aspect_ratio) */
  image_size?: Seedream45ImageSize;
  /** Controls how much of the original image is preserved (0-1). Default: 0.7 */
  strength?: number;
  /** Guidance scale for prompt adherence. Default: 7.5 */
  guidance_scale?: number;
  /** Number of output images (1-6). Default: 1 */
  num_images?: number;
  /** Seed for reproducibility */
  seed?: number;
  /** Enable safety checker. Default: true */
  enable_safety_checker?: boolean;
  /** Output format. Default: "png" */
  output_format?: Seedream45OutputFormat;
}

// Output schemas
export interface Seedream45Output {
  /** Array of generated images */
  images: FalImage[];
  /** Seed used for generation */
  seed?: number;
  /** Whether safety checker was triggered */
  has_nsfw_concepts?: boolean[];
}

// Constants
export const SEEDREAM_45_ASPECT_RATIOS: Seedream45AspectRatio[] = [
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "3:2",
  "2:3",
  "21:9",
  "9:21",
];

export const SEEDREAM_45_OUTPUT_FORMATS: Seedream45OutputFormat[] = [
  "png",
  "jpeg",
  "webp",
];

export const SEEDREAM_45_DEFAULT_ASPECT_RATIO: Seedream45AspectRatio = "1:1";
export const SEEDREAM_45_DEFAULT_OUTPUT_FORMAT: Seedream45OutputFormat = "png";

export const SEEDREAM_45_MAX_PROMPT_LENGTH = 10000;
export const SEEDREAM_45_MAX_REFERENCE_IMAGES = 10;
export const SEEDREAM_45_MAX_IMAGE_SIZE_MB = 30;
export const SEEDREAM_45_MAX_DIMENSION = 4096;

/**
 * Seedream 4.5 API Client
 */
export class Seedream45Client {
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("API key is required");
    }
    configureFalClient(apiKey);
  }

  /**
   * Generate image from text prompt
   */
  async generateImage(
    input: Seedream45Input,
    options?: {
      onQueueUpdate?: (update: QueueUpdate) => void;
    }
  ): Promise<Seedream45Output> {
    if (!input.prompt) {
      throw new Error("Prompt is required");
    }

    if (input.prompt.length > SEEDREAM_45_MAX_PROMPT_LENGTH) {
      throw new Error(
        `Prompt exceeds maximum length of ${SEEDREAM_45_MAX_PROMPT_LENGTH} characters`
      );
    }

    // Validate image size if provided
    if (input.image_size) {
      if (
        input.image_size.width > SEEDREAM_45_MAX_DIMENSION ||
        input.image_size.height > SEEDREAM_45_MAX_DIMENSION
      ) {
        throw new Error(
          `Image dimensions cannot exceed ${SEEDREAM_45_MAX_DIMENSION}px`
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal.subscribe as any)(SEEDREAM_45_MODEL, {
      input: {
        prompt: input.prompt,
        aspect_ratio: input.aspect_ratio || SEEDREAM_45_DEFAULT_ASPECT_RATIO,
        image_size: input.image_size,
        num_images: input.num_images || 1,
        seed: input.seed,
        enable_safety_checker: input.enable_safety_checker ?? true,
        output_format: input.output_format || SEEDREAM_45_DEFAULT_OUTPUT_FORMAT,
      },
      logs: true,
      onQueueUpdate: options?.onQueueUpdate,
    });

    return result.data as Seedream45Output;
  }

  /**
   * Edit image with text prompt
   */
  async editImage(
    input: Seedream45EditInput,
    options?: {
      onQueueUpdate?: (update: QueueUpdate) => void;
    }
  ): Promise<Seedream45Output> {
    if (!input.prompt) {
      throw new Error("Prompt is required");
    }

    const hasImage = input.image || (input.image_urls && input.image_urls.length > 0);
    if (!hasImage) {
      throw new Error("At least one image is required for editing");
    }

    if (input.image_urls && input.image_urls.length > SEEDREAM_45_MAX_REFERENCE_IMAGES) {
      throw new Error(`Maximum ${SEEDREAM_45_MAX_REFERENCE_IMAGES} images allowed`);
    }

    // Build input payload
    const payload: Record<string, unknown> = {
      prompt: input.prompt,
      num_images: input.num_images || 1,
      enable_safety_checker: input.enable_safety_checker ?? true,
      output_format: input.output_format || SEEDREAM_45_DEFAULT_OUTPUT_FORMAT,
    };

    // Add image(s)
    if (input.image) {
      payload.image = input.image;
    }
    if (input.image_urls && input.image_urls.length > 0) {
      payload.image_urls = input.image_urls;
    }

    // Add optional parameters
    if (input.aspect_ratio) {
      payload.aspect_ratio = input.aspect_ratio;
    }
    if (input.image_size) {
      payload.image_size = input.image_size;
    }
    if (input.strength !== undefined) {
      payload.strength = input.strength;
    }
    if (input.guidance_scale !== undefined) {
      payload.guidance_scale = input.guidance_scale;
    }
    if (input.seed !== undefined) {
      payload.seed = input.seed;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal.subscribe as any)(SEEDREAM_45_EDIT_MODEL, {
      input: payload,
      logs: true,
      onQueueUpdate: options?.onQueueUpdate,
    });

    return result.data as Seedream45Output;
  }
}

/**
 * Create a new Seedream 4.5 client
 */
export function createSeedream45Client(apiKey: string): Seedream45Client {
  return new Seedream45Client(apiKey);
}

/**
 * Logo Overlay for Images
 *
 * Sharp-based image compositing for adding brand logos to generated images.
 * Supports various positions, sizes, and opacity settings.
 */

import * as fs from 'fs';
import * as path from 'path';
import { getMediaStoragePath, generateMediaFilename } from '../utils/storage';

// Sharp is optional - will fall back gracefully if not installed
let sharp: typeof import('sharp') | null = null;
try {
  sharp = require('sharp');
} catch {
  console.warn('[LogoOverlay] Sharp not installed. Logo overlay features will be disabled.');
}

// ============================================================================
// TYPES
// ============================================================================

export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export interface LogoConfig {
  position: LogoPosition;
  sizePercent: number;  // 5-25% of image width
  opacity: number;      // 0.0-1.0
  margin: number;       // pixels from edge
}

export interface LogoOverlayResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_LOGO_CONFIG: LogoConfig = {
  position: 'bottom-right',
  sizePercent: 12,
  opacity: 0.9,
  margin: 20,
};

export const LOGO_POSITION_PRESETS: Record<string, LogoConfig> = {
  'professional': {
    position: 'bottom-right',
    sizePercent: 10,
    opacity: 0.85,
    margin: 20,
  },
  'subtle': {
    position: 'bottom-right',
    sizePercent: 8,
    opacity: 0.6,
    margin: 15,
  },
  'prominent': {
    position: 'bottom-right',
    sizePercent: 15,
    opacity: 0.95,
    margin: 25,
  },
  'watermark': {
    position: 'center',
    sizePercent: 20,
    opacity: 0.25,
    margin: 0,
  },
  'linkedin': {
    position: 'bottom-left',
    sizePercent: 12,
    opacity: 0.9,
    margin: 20,
  },
  'instagram': {
    position: 'bottom-right',
    sizePercent: 8,
    opacity: 0.8,
    margin: 30,
  },
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Check if Sharp is available for image processing
 */
export function isSharpAvailable(): boolean {
  return sharp !== null;
}

/**
 * Apply logo overlay to an image
 *
 * @param imagePath - Path to the source image
 * @param logoPath - Path to the logo file (PNG with transparency recommended)
 * @param config - Logo positioning and styling configuration
 * @returns Result with output path or error
 */
export async function applyLogoToImage(
  imagePath: string,
  logoPath: string,
  config: Partial<LogoConfig> = {}
): Promise<LogoOverlayResult> {
  if (!sharp) {
    return {
      success: false,
      error: 'Sharp is not installed. Run: bun add sharp',
    };
  }

  // Merge with defaults
  const finalConfig: LogoConfig = { ...DEFAULT_LOGO_CONFIG, ...config };

  try {
    // Validate input files exist
    if (!fs.existsSync(imagePath)) {
      return { success: false, error: `Image not found: ${imagePath}` };
    }
    if (!fs.existsSync(logoPath)) {
      return { success: false, error: `Logo not found: ${logoPath}` };
    }

    // Load the main image and get its metadata
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return { success: false, error: 'Could not read image dimensions' };
    }

    const imageWidth = metadata.width;
    const imageHeight = metadata.height;

    // Calculate logo size based on percentage of image width
    const logoWidth = Math.round(imageWidth * (finalConfig.sizePercent / 100));

    // Resize logo to target width, maintaining aspect ratio
    const logoBuffer = await sharp(logoPath)
      .resize(logoWidth, null, { fit: 'inside' })
      .toBuffer();

    // Get resized logo dimensions
    const logoMetadata = await sharp(logoBuffer).metadata();
    const resizedLogoWidth = logoMetadata.width || logoWidth;
    const resizedLogoHeight = logoMetadata.height || logoWidth;

    // Calculate position
    const { left, top } = calculatePosition(
      imageWidth,
      imageHeight,
      resizedLogoWidth,
      resizedLogoHeight,
      finalConfig.position,
      finalConfig.margin
    );

    // Apply opacity if less than 1
    let finalLogoBuffer = logoBuffer;
    if (finalConfig.opacity < 1) {
      // Create a semi-transparent overlay using Sharp's composite
      // Sharp doesn't have direct opacity control, so we use alpha channel manipulation
      finalLogoBuffer = await sharp(logoBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
        .then(({ data, info }) => {
          // Modify alpha channel
          for (let i = 3; i < data.length; i += 4) {
            data[i] = Math.round(data[i] * finalConfig.opacity);
          }
          return sharp(data, {
            raw: {
              width: info.width,
              height: info.height,
              channels: 4,
            },
          })
            .png()
            .toBuffer();
        });
    }

    // Generate output filename
    const outputFilename = generateMediaFilename('image', undefined, 'png');
    const outputPath = path.join(getMediaStoragePath('images'), outputFilename);

    // Composite logo onto image
    await image
      .composite([
        {
          input: finalLogoBuffer,
          left,
          top,
          blend: 'over',
        },
      ])
      .toFile(outputPath);

    return {
      success: true,
      outputPath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[LogoOverlay] Error:', message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Apply logo to multiple images in batch
 */
export async function applyLogoToImages(
  imagePaths: string[],
  logoPath: string,
  config: Partial<LogoConfig> = {}
): Promise<Array<{ originalPath: string; result: LogoOverlayResult }>> {
  const results: Array<{ originalPath: string; result: LogoOverlayResult }> = [];

  // Process images sequentially to avoid memory issues
  for (const imagePath of imagePaths) {
    const result = await applyLogoToImage(imagePath, logoPath, config);
    results.push({ originalPath: imagePath, result });
  }

  return results;
}

/**
 * Apply logo to image from URL (downloads first, then processes)
 */
export async function applyLogoToImageUrl(
  imageUrl: string,
  logoPath: string,
  config: Partial<LogoConfig> = {}
): Promise<LogoOverlayResult> {
  if (!sharp) {
    return {
      success: false,
      error: 'Sharp is not installed. Run: bun add sharp',
    };
  }

  try {
    // Download image to temp location
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return { success: false, error: `Failed to download image: ${response.status}` };
    }

    const buffer = await response.arrayBuffer();
    const tempPath = path.join(getMediaStoragePath('temp'), `temp_${Date.now()}.jpg`);

    fs.writeFileSync(tempPath, Buffer.from(buffer));

    // Apply logo
    const result = await applyLogoToImage(tempPath, logoPath, config);

    // Clean up temp file
    try {
      fs.unlinkSync(tempPath);
    } catch {
      // Ignore cleanup errors
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate logo position coordinates
 */
function calculatePosition(
  imageWidth: number,
  imageHeight: number,
  logoWidth: number,
  logoHeight: number,
  position: LogoPosition,
  margin: number
): { left: number; top: number } {
  switch (position) {
    case 'top-left':
      return { left: margin, top: margin };

    case 'top-right':
      return { left: imageWidth - logoWidth - margin, top: margin };

    case 'bottom-left':
      return { left: margin, top: imageHeight - logoHeight - margin };

    case 'bottom-right':
      return { left: imageWidth - logoWidth - margin, top: imageHeight - logoHeight - margin };

    case 'center':
      return {
        left: Math.round((imageWidth - logoWidth) / 2),
        top: Math.round((imageHeight - logoHeight) / 2),
      };

    default:
      return { left: imageWidth - logoWidth - margin, top: imageHeight - logoHeight - margin };
  }
}

/**
 * Get recommended logo config for a platform
 */
export function getLogoConfigForPlatform(
  platform: 'linkedin' | 'instagram' | 'facebook' | 'twitter' | 'general'
): LogoConfig {
  const configs: Record<string, LogoConfig> = {
    linkedin: LOGO_POSITION_PRESETS['linkedin'],
    instagram: LOGO_POSITION_PRESETS['instagram'],
    facebook: LOGO_POSITION_PRESETS['professional'],
    twitter: LOGO_POSITION_PRESETS['subtle'],
    general: LOGO_POSITION_PRESETS['professional'],
  };

  return configs[platform] || configs.general;
}

/**
 * Validate logo file (check if it's a valid image with transparency)
 */
export async function validateLogoFile(logoPath: string): Promise<{
  valid: boolean;
  error?: string;
  hasAlpha?: boolean;
  width?: number;
  height?: number;
}> {
  if (!sharp) {
    return { valid: false, error: 'Sharp is not installed' };
  }

  if (!fs.existsSync(logoPath)) {
    return { valid: false, error: 'Logo file not found' };
  }

  try {
    const metadata = await sharp(logoPath).metadata();

    return {
      valid: true,
      hasAlpha: metadata.channels === 4 || metadata.hasAlpha,
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { valid: false, error: `Invalid image file: ${message}` };
  }
}

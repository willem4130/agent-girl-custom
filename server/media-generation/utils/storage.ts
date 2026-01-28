/**
 * Media Storage Utilities
 *
 * File storage and path management for generated media.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ASPECT_RATIOS } from '../types';
import { getAppDataDirectory } from '../../directoryUtils';

/**
 * Get the base media storage path
 */
export function getMediaStoragePath(subdir?: 'images' | 'videos' | 'temp' | 'thumbnails'): string {
  const basePath = process.env.MEDIA_STORAGE_PATH || path.join(getAppDataDirectory(), 'media');

  if (subdir) {
    const fullPath = path.join(basePath, subdir);
    ensureDirectoryExists(fullPath);
    return fullPath;
  }

  ensureDirectoryExists(basePath);
  return basePath;
}

/**
 * Ensure a directory exists
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Get dimensions for an aspect ratio
 */
export function getAspectRatioDimensions(
  ratio: string,
  maxSize = 1024
): { width: number; height: number } {
  const config = ASPECT_RATIOS[ratio];

  if (config) {
    // Scale to maxSize while maintaining aspect ratio
    const scale = maxSize / Math.max(config.width, config.height);
    return {
      width: Math.round(config.width * scale),
      height: Math.round(config.height * scale),
    };
  }

  // Parse ratio string (e.g., "16:9")
  const parts = ratio.split(':').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    const [w, h] = parts;
    const scale = maxSize / Math.max(w, h);
    return {
      width: Math.round(w * scale * (maxSize / Math.max(w, h))),
      height: Math.round(h * scale * (maxSize / Math.max(w, h))),
    };
  }

  // Default to square
  return { width: maxSize, height: maxSize };
}

/**
 * Generate a unique filename for media
 */
export function generateMediaFilename(
  type: 'image' | 'video' | 'thumbnail',
  brandId?: string,
  extension = 'jpg'
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const prefix = brandId ? `${brandId.substring(0, 8)}_` : '';

  return `${prefix}${type}_${timestamp}_${random}.${extension}`;
}

/**
 * Save a media file from URL to local storage
 */
export async function saveMediaFile(
  url: string,
  type: 'images' | 'videos' | 'thumbnails',
  filename?: string
): Promise<{ localPath: string; fileSize: number } | { error: string }> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return { error: `Failed to fetch: ${response.status}` };
    }

    const buffer = await response.arrayBuffer();
    const extension = getExtensionFromUrl(url) || (type === 'videos' ? 'mp4' : 'jpg');
    const finalFilename = filename || generateMediaFilename(
      type === 'videos' ? 'video' : 'image',
      undefined,
      extension
    );

    const storagePath = getMediaStoragePath(type);
    const localPath = path.join(storagePath, finalFilename);

    fs.writeFileSync(localPath, Buffer.from(buffer));

    return {
      localPath,
      fileSize: buffer.byteLength,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { error: message };
  }
}

/**
 * Delete a media file
 */
export function deleteMediaFile(localPath: string): boolean {
  try {
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Get file extension from URL
 */
function getExtensionFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase().replace('.', '');
    return ext || null;
  } catch {
    return null;
  }
}

/**
 * Get the public URL for a local media file
 * (For serving via the API)
 */
export function getPublicMediaUrl(localPath: string): string {
  const cdnUrl = process.env.MEDIA_CDN_URL;

  if (cdnUrl) {
    // Use CDN if configured
    const filename = path.basename(localPath);
    const type = localPath.includes('/images/') ? 'images' :
                 localPath.includes('/videos/') ? 'videos' :
                 localPath.includes('/thumbnails/') ? 'thumbnails' : 'media';
    return `${cdnUrl}/${type}/${filename}`;
  }

  // Default to local API serving
  const filename = path.basename(localPath);
  const type = localPath.includes('/images/') ? 'images' :
               localPath.includes('/videos/') ? 'videos' :
               localPath.includes('/thumbnails/') ? 'thumbnails' : 'media';

  return `/api/media/files/${type}/${filename}`;
}

/**
 * Clean up old temporary files
 */
export function cleanupTempFiles(maxAgeMs = 24 * 60 * 60 * 1000): number {
  const tempDir = getMediaStoragePath('temp');
  let deletedCount = 0;

  try {
    const files = fs.readdirSync(tempDir);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
  } catch {
    // Ignore errors
  }

  return deletedCount;
}

/**
 * Get storage statistics
 */
export function getStorageStats(): {
  images: { count: number; sizeBytes: number };
  videos: { count: number; sizeBytes: number };
  thumbnails: { count: number; sizeBytes: number };
  total: { count: number; sizeBytes: number };
} {
  const stats = {
    images: { count: 0, sizeBytes: 0 },
    videos: { count: 0, sizeBytes: 0 },
    thumbnails: { count: 0, sizeBytes: 0 },
    total: { count: 0, sizeBytes: 0 },
  };

  for (const type of ['images', 'videos', 'thumbnails'] as const) {
    const dirPath = getMediaStoragePath(type);

    try {
      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const fileStats = fs.statSync(filePath);

        if (fileStats.isFile()) {
          stats[type].count++;
          stats[type].sizeBytes += fileStats.size;
        }
      }
    } catch {
      // Directory may not exist
    }
  }

  stats.total.count = stats.images.count + stats.videos.count + stats.thumbnails.count;
  stats.total.sizeBytes = stats.images.sizeBytes + stats.videos.sizeBytes + stats.thumbnails.sizeBytes;

  return stats;
}

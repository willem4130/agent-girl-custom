/**
 * Subtitle Handling
 *
 * SRT parsing and FFmpeg subtitle filters.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { SubtitleConfig } from '../types';
import { getMediaStoragePath } from '../utils/storage';

export interface SrtEntry {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

/**
 * Parse SRT content into structured entries
 */
export function parseSrt(srtContent: string): SrtEntry[] {
  const entries: SrtEntry[] = [];
  const blocks = srtContent.trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;

    const index = parseInt(lines[0], 10);
    const timeParts = lines[1].split(' --> ');

    if (timeParts.length !== 2 || isNaN(index)) continue;

    entries.push({
      index,
      startTime: timeParts[0].trim(),
      endTime: timeParts[1].trim(),
      text: lines.slice(2).join('\n'),
    });
  }

  return entries;
}

/**
 * Generate SRT content from entries
 */
export function generateSrt(entries: SrtEntry[]): string {
  return entries
    .map((entry, i) => {
      return `${i + 1}\n${entry.startTime} --> ${entry.endTime}\n${entry.text}`;
    })
    .join('\n\n');
}

/**
 * Convert time string to seconds
 */
export function srtTimeToSeconds(time: string): number {
  const parts = time.replace(',', '.').split(':');
  if (parts.length !== 3) return 0;

  const hours = parseFloat(parts[0]);
  const minutes = parseFloat(parts[1]);
  const seconds = parseFloat(parts[2]);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Convert seconds to SRT time format
 */
export function secondsToSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  const ss = s.toFixed(3).padStart(6, '0').replace('.', ',');

  return `${hh}:${mm}:${ss}`;
}

/**
 * Generate FFmpeg subtitle filter
 */
export function generateSubtitleFilter(
  srtPath: string,
  config: SubtitleConfig = {}
): string {
  const {
    fontFamily = 'Arial',
    fontSize = 24,
    fontColor = 'white',
    backgroundColor,
    position = 'bottom',
  } = config;

  // Escape path for FFmpeg
  const escapedPath = srtPath.replace(/'/g, "'\\''").replace(/:/g, '\\:');

  // Build style string
  const styleParams: string[] = [
    `FontName=${fontFamily}`,
    `FontSize=${fontSize}`,
    `PrimaryColour=&H${colorToAssHex(fontColor)}`,
    'Alignment=2', // Center alignment
  ];

  // Position based on config
  let marginV = 50;
  if (position === 'top') {
    marginV = 20;
    styleParams.push('Alignment=8'); // Top-center
  } else if (position === 'center') {
    marginV = 0;
    styleParams.push('Alignment=5'); // Middle-center
  }
  styleParams.push(`MarginV=${marginV}`);

  // Background box if specified
  if (backgroundColor) {
    styleParams.push(
      `BackColour=&H${colorToAssHex(backgroundColor)}`,
      'BorderStyle=4',
      'Outline=0',
      'Shadow=0'
    );
  }

  const styleString = styleParams.join(',');

  return `subtitles='${escapedPath}':force_style='${styleString}'`;
}

/**
 * Add subtitles to a video
 * Writes SRT to temp file and returns filter
 */
export async function addSubtitles(
  srtContent: string,
  config: SubtitleConfig = {}
): Promise<{ filterComplex: string; tempSrtPath: string }> {
  // Write SRT to temporary file
  const tempDir = getMediaStoragePath('temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempSrtPath = path.join(tempDir, `subtitles_${Date.now()}.srt`);
  fs.writeFileSync(tempSrtPath, srtContent, 'utf-8');

  const filterComplex = generateSubtitleFilter(tempSrtPath, config);

  return {
    filterComplex,
    tempSrtPath,
  };
}

/**
 * Auto-generate subtitles from text with timing
 * Simple word-by-word approach
 */
export function autoGenerateSubtitles(
  text: string,
  durationSeconds: number,
  wordsPerSubtitle = 5
): string {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const entries: SrtEntry[] = [];

  const wordsPerSecond = words.length / durationSeconds;
  const subtitleDuration = wordsPerSubtitle / wordsPerSecond;

  let currentTime = 0;
  let index = 1;

  for (let i = 0; i < words.length; i += wordsPerSubtitle) {
    const subtitleWords = words.slice(i, i + wordsPerSubtitle);
    const endTime = Math.min(currentTime + subtitleDuration, durationSeconds);

    entries.push({
      index,
      startTime: secondsToSrtTime(currentTime),
      endTime: secondsToSrtTime(endTime),
      text: subtitleWords.join(' '),
    });

    currentTime = endTime;
    index++;
  }

  return generateSrt(entries);
}

/**
 * Convert color to ASS hex format (AABBGGRR)
 */
function colorToAssHex(color: string): string {
  const namedColors: Record<string, string> = {
    white: 'FFFFFF',
    black: '000000',
    red: '0000FF', // BGR
    green: '00FF00',
    blue: 'FF0000', // BGR
    yellow: '00FFFF', // BGR
    transparent: '00000000',
  };

  if (namedColors[color.toLowerCase()]) {
    return '00' + namedColors[color.toLowerCase()];
  }

  // Handle hex colors
  const hex = color.replace('#', '');
  if (hex.length === 6) {
    // Convert RGB to BGR
    const r = hex.slice(0, 2);
    const g = hex.slice(2, 4);
    const b = hex.slice(4, 6);
    return `00${b}${g}${r}`;
  }

  return '00FFFFFF'; // Default white
}

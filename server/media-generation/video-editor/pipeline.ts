/**
 * Video Edit Pipeline
 *
 * FFmpeg pipeline builder for video editing operations.
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import type {
  VideoEditPipelineConfig,
  VideoEditResult,
  TransitionConfig,
  LogoOverlayConfig,
  SubtitleConfig,
  AudioConfig,
} from '../types';
import { getMediaStoragePath } from '../utils/storage';

export interface PipelineStep {
  type: 'input' | 'filter' | 'output';
  command: string[];
}

export class VideoEditPipeline {
  private inputs: string[] = [];
  private filters: string[] = [];
  private outputOptions: string[] = [];
  private outputPath: string;

  constructor(outputFilename?: string) {
    const storageDir = getMediaStoragePath('videos');
    this.outputPath = path.join(storageDir, outputFilename || `edited_${Date.now()}.mp4`);
  }

  /**
   * Add an input video
   */
  addInput(videoPath: string): this {
    this.inputs.push(videoPath);
    return this;
  }

  /**
   * Add multiple inputs
   */
  addInputs(videoPaths: string[]): this {
    this.inputs.push(...videoPaths);
    return this;
  }

  /**
   * Add a filter
   */
  addFilter(filter: string): this {
    this.filters.push(filter);
    return this;
  }

  /**
   * Set output options
   */
  setOutputOptions(options: string[]): this {
    this.outputOptions = options;
    return this;
  }

  /**
   * Add logo overlay
   */
  addLogoOverlay(config: LogoOverlayConfig): this {
    const { position, size, opacity, margin } = config;

    // Calculate position based on config
    let x: string, y: string;
    const sizeExpr = `iw*${size / 100}`;

    switch (position) {
      case 'top-left':
        x = String(margin);
        y = String(margin);
        break;
      case 'top-right':
        x = `W-w-${margin}`;
        y = String(margin);
        break;
      case 'bottom-left':
        x = String(margin);
        y = `H-h-${margin}`;
        break;
      case 'bottom-right':
        x = `W-w-${margin}`;
        y = `H-h-${margin}`;
        break;
      case 'center':
        x = '(W-w)/2';
        y = '(H-h)/2';
        break;
      default:
        x = `W-w-${margin}`;
        y = `H-h-${margin}`;
    }

    // Add logo as input
    this.inputs.push(config.logoUrl);

    // Scale logo and overlay
    const logoIndex = this.inputs.length - 1;
    const scaleFilter = `[${logoIndex}:v]scale=${sizeExpr}:-1,format=rgba,colorchannelmixer=aa=${opacity}[logo]`;
    const overlayFilter = `[0:v][logo]overlay=${x}:${y}`;

    this.filters.push(scaleFilter, overlayFilter);

    return this;
  }

  /**
   * Add subtitles from SRT content
   */
  addSubtitles(config: SubtitleConfig, srtPath: string): this {
    const {
      fontFamily = 'Arial',
      fontSize = 24,
      fontColor = 'white',
      backgroundColor,
      position = 'bottom',
    } = config;

    let _yPosition = 'h-100';
    if (position === 'top') _yPosition = '50';
    else if (position === 'center') _yPosition = '(h-text_h)/2';

    let subtitleFilter = `subtitles=${srtPath}:force_style='`;
    subtitleFilter += `FontName=${fontFamily},`;
    subtitleFilter += `FontSize=${fontSize},`;
    subtitleFilter += `PrimaryColour=&H${colorToAss(fontColor)},`;

    if (backgroundColor) {
      subtitleFilter += `BackColour=&H${colorToAss(backgroundColor)},`;
      subtitleFilter += `BorderStyle=4,`;
    }

    subtitleFilter += `Alignment=2,`;
    subtitleFilter += `MarginV=${position === 'bottom' ? 50 : 20}'`;

    this.filters.push(subtitleFilter);

    return this;
  }

  /**
   * Add background audio
   */
  addBackgroundAudio(config: AudioConfig): this {
    if (!config.url) return this;

    this.inputs.push(config.url);
    const audioIndex = this.inputs.length - 1;

    let audioFilter = `[${audioIndex}:a]volume=${config.volume}`;

    if (config.fadeIn) {
      audioFilter += `,afade=t=in:st=0:d=${config.fadeIn}`;
    }
    if (config.fadeOut) {
      // fadeOut needs to know the duration, use a placeholder
      audioFilter += `,afade=t=out:st=DURATION_MINUS_FADE:d=${config.fadeOut}`;
    }

    audioFilter += '[bg_audio]';
    this.filters.push(audioFilter);

    // Mix with original audio if present
    this.filters.push('[0:a][bg_audio]amix=inputs=2:duration=first:dropout_transition=2');

    return this;
  }

  /**
   * Concatenate multiple videos with transitions
   */
  concatenate(transitions: TransitionConfig[]): this {
    if (this.inputs.length < 2) return this;

    const filterParts: string[] = [];

    // Scale all inputs to same size and add padding for transitions
    for (let i = 0; i < this.inputs.length; i++) {
      filterParts.push(`[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`);
    }

    // Apply transitions between clips
    let currentOutput = 'v0';
    for (let i = 1; i < this.inputs.length; i++) {
      const transition = transitions[i - 1] || { type: 'fade', duration: 0.5 };
      const nextOutput = i === this.inputs.length - 1 ? 'vout' : `vtrans${i}`;

      const transitionFilter = this.getTransitionFilter(
        currentOutput,
        `v${i}`,
        nextOutput,
        transition
      );

      filterParts.push(transitionFilter);
      currentOutput = nextOutput;
    }

    this.filters.push(...filterParts);

    return this;
  }

  /**
   * Get FFmpeg filter for a transition type
   */
  private getTransitionFilter(
    input1: string,
    input2: string,
    output: string,
    transition: TransitionConfig
  ): string {
    const { type, duration } = transition;

    switch (type) {
      case 'fade':
        return `[${input1}][${input2}]xfade=transition=fade:duration=${duration}:offset=OFFSET[${output}]`;
      case 'dissolve':
        return `[${input1}][${input2}]xfade=transition=dissolve:duration=${duration}:offset=OFFSET[${output}]`;
      case 'wipe':
        return `[${input1}][${input2}]xfade=transition=wipeleft:duration=${duration}:offset=OFFSET[${output}]`;
      case 'slide':
        return `[${input1}][${input2}]xfade=transition=slideleft:duration=${duration}:offset=OFFSET[${output}]`;
      case 'zoom':
        return `[${input1}][${input2}]xfade=transition=zoomin:duration=${duration}:offset=OFFSET[${output}]`;
      default:
        // No transition, just concatenate
        return `[${input1}][${input2}]concat=n=2:v=1:a=0[${output}]`;
    }
  }

  /**
   * Build and execute the FFmpeg command
   */
  async execute(): Promise<VideoEditResult> {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(this.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Build FFmpeg command
      const args: string[] = [];

      // Add inputs
      for (const input of this.inputs) {
        args.push('-i', input);
      }

      // Add filter complex if we have filters
      if (this.filters.length > 0) {
        args.push('-filter_complex', this.filters.join(';'));
      }

      // Add output options
      args.push(...this.outputOptions);

      // Default output options if not set
      if (this.outputOptions.length === 0) {
        args.push(
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-c:a', 'aac',
          '-b:a', '128k'
        );
      }

      // Add output path
      args.push('-y', this.outputPath);

      console.log('[VideoEditor] Running FFmpeg:', 'ffmpeg', args.join(' '));

      // Execute FFmpeg
      const result = await this.runFFmpeg(args);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Get video duration
      const duration = await this.getVideoDuration(this.outputPath);

      // Generate thumbnail
      const thumbnailPath = this.outputPath.replace('.mp4', '_thumb.jpg');
      await this.generateThumbnail(this.outputPath, thumbnailPath);

      return {
        success: true,
        localPath: this.outputPath,
        thumbnailUrl: thumbnailPath,
        duration,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Run FFmpeg command
   */
  private runFFmpeg(args: string[]): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const ffmpeg = spawn('ffmpeg', args);

      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: `FFmpeg exited with code ${code}: ${stderr}` });
        }
      });

      ffmpeg.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
    });
  }

  /**
   * Get video duration using ffprobe
   */
  private getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        videoPath,
      ]);

      let stdout = '';

      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.on('close', () => {
        const duration = parseFloat(stdout.trim());
        resolve(isNaN(duration) ? 0 : Math.round(duration));
      });

      ffprobe.on('error', () => {
        resolve(0);
      });
    });
  }

  /**
   * Generate thumbnail from video
   */
  private generateThumbnail(videoPath: string, thumbnailPath: string): Promise<void> {
    return new Promise((resolve) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-ss', '00:00:01',
        '-vframes', '1',
        '-vf', 'scale=320:-1',
        '-y', thumbnailPath,
      ]);

      ffmpeg.on('close', () => resolve());
      ffmpeg.on('error', () => resolve());
    });
  }
}

/**
 * Create a new edit pipeline
 */
export function createEditPipeline(_config: VideoEditPipelineConfig): VideoEditPipeline {
  const pipeline = new VideoEditPipeline();

  // This would need video URLs to be downloaded first
  // For now, return an empty pipeline that can be customized

  return pipeline;
}

/**
 * Convert hex color to ASS format (AABBGGRR)
 */
function colorToAss(color: string): string {
  if (color.startsWith('#')) {
    color = color.slice(1);
  }

  // Handle named colors
  const namedColors: Record<string, string> = {
    white: 'FFFFFF',
    black: '000000',
    red: 'FF0000',
    green: '00FF00',
    blue: '0000FF',
    yellow: 'FFFF00',
  };

  color = namedColors[color.toLowerCase()] || color;

  // Convert RGB to BGR
  if (color.length === 6) {
    const r = color.slice(0, 2);
    const g = color.slice(2, 4);
    const b = color.slice(4, 6);
    return `00${b}${g}${r}`;
  }

  return '00FFFFFF'; // Default to white
}

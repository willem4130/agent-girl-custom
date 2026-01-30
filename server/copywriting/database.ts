/**
 * Copywriting Mode Database
 *
 * Schema for brand configurations, scraped content, voice profiles,
 * generated copy, engagement metrics, and learned insights.
 *
 * Supports the self-improving feedback loop.
 */

import { Database } from 'bun:sqlite';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import { getAppDataDirectory } from '../directoryUtils';

// ============================================================================
// INTERFACES
// ============================================================================

export interface BrandConfig {
  id: string;
  session_id: string;
  name: string;
  website_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
  language: 'nl' | 'en' | 'both';
  content_types: string; // JSON array of types
  created_at: string;
  updated_at: string;
}

export interface ScrapedContent {
  id: string;
  brand_id: string;
  platform: 'website' | 'instagram' | 'facebook' | 'linkedin';
  content_type: string; // post, caption, bio, about, article
  raw_content: string;
  scraped_at: string;
  engagement_metrics?: string; // JSON
  metadata?: string; // JSON
}

export interface BrandVoiceProfile {
  id: string;
  brand_id: string;
  version: number;

  // Tone dimensions (0-100)
  formality_score?: number;
  humor_score?: number;
  energy_score?: number;
  authority_score?: number;

  // Language patterns
  vocabulary_complexity?: string; // simple, moderate, technical
  avg_sentence_length?: number;
  emoji_density?: number;
  hashtag_density?: number;
  cta_style?: string;

  // Winning patterns (learned over time)
  top_frameworks?: string; // JSON
  top_triggers?: string; // JSON
  winning_hooks?: string; // JSON
  avoid_patterns?: string; // JSON

  // Metadata
  samples_analyzed: number;
  confidence_score?: number;
  created_at: string;
  superseded_at?: string;
}

export interface GeneratedCopy {
  id: string;
  brand_id: string;
  session_id?: string; // Links to chat session where copy was generated
  voice_profile_version: number;

  // Content
  content_type: string; // social, newsletter, ad, landing
  platform: string; // instagram, facebook, linkedin, email
  copy_text: string;
  variation_number: number;

  // Copywriting metadata
  framework_used?: string;
  triggers_applied?: string; // JSON array
  tone_scores?: string; // JSON
  quality_score?: number;

  // Status tracking
  status: 'draft' | 'approved' | 'published' | 'archived';
  published_url?: string;
  published_at?: string;

  created_at: string;
}

export interface EngagementMetrics {
  id: string;
  copy_id: string;

  // Timing
  measured_at: string;
  hours_since_publish: number;

  // Platform-agnostic metrics
  impressions?: number;
  engagements?: number;
  engagement_rate?: number;

  // Platform-specific
  platform_metrics?: string; // JSON

  // Comparison to baseline
  vs_brand_avg?: number;
  vs_platform_avg?: number;
}

export interface CopyInsight {
  id: string;
  brand_id: string;

  insight_type: string; // framework_performance, trigger_correlation, etc.
  insight_data: string; // JSON
  confidence: number;
  sample_size: number;

  created_at: string;
  applied_to_profile: boolean;
}

// ============================================================================
// NEW INTERFACES FOR ENHANCED COPYWRITING MODE
// ============================================================================

export interface ScrapedPage {
  id: string;
  brand_id: string;
  url: string;
  page_type: 'homepage' | 'about' | 'blog' | 'case_study' | 'testimonial' | 'product' | 'services' | 'other';
  title: string;
  extracted_content: string; // JSON with headings, paragraphs, meta, etc.
  word_count: number;
  detected_topics: string; // JSON array
  crawl_depth: number;
  scraped_at: string;
}

export interface BrandVoiceAnalysis {
  id: string;
  brand_id: string;

  // LLM-generated analysis
  voice_description: string; // Narrative description of brand voice
  writing_style_patterns: string; // JSON - sentence structures, transitions, openings, closings
  vocabulary_preferences: string; // JSON - preferred words, avoided words, brand terms
  example_hooks: string; // JSON array - effective hooks extracted from content
  generated_guidelines: string; // LLM-generated self-instruction writing guide

  // Tone dimensions (0-100, more detailed than basic profile)
  tone_dimensions: string; // JSON - formality, humor, energy, authority, warmth, etc.

  // Analysis metadata
  samples_analyzed: number;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface BrandReferenceMaterial {
  id: string;
  brand_id: string;
  material_type: 'url' | 'file' | 'text' | 'project';
  title: string;
  content: string; // Extracted/stored content
  source_url?: string;
  tags: string; // JSON array
  created_at: string;
}

export type ContentType = 'linkedin_post' | 'facebook_post' | 'instagram_post' | 'article' | 'newsletter' | 'custom';
export type WorkflowStep = 'brand_select' | 'content_type' | 'briefing' | 'clarification' | 'generation' | 'refinement' | 'completed';

// ============================================================================
// POST TYPE TEMPLATES AND TONE PRESETS INTERFACES
// ============================================================================

export type TemplateCategory = 'thought_leadership' | 'social_proof' | 'engagement' | 'educational';

export interface PostTypeTemplate {
  id: string;
  brand_id: string | null; // NULL = global template available to all brands
  name: string;
  description?: string;
  category: TemplateCategory;
  platforms: string; // JSON array of platform names
  structure: string; // JSON: sections with prompts
  example_output?: string;
  variables: string; // JSON array of required input variables
  is_system: number; // 1 = system/global template, 0 = user-created
  created_at: string;
}

export interface TemplateSection {
  name: string;
  prompt: string;
  maxChars?: number;
  variables?: string[];
}

export interface TemplateStructure {
  sections: TemplateSection[];
  framework?: string;
  tone_adjustments?: Record<string, number | string>;
}

export interface BrandTonePreset {
  id: string;
  brand_id: string;
  name: string;
  description?: string;
  tone_adjustments: string; // JSON
  use_cases: string; // JSON array
  example_phrases: string; // JSON array
  is_default: number; // 0 or 1
  created_at: string;
}

export interface ToneAdjustments {
  formality?: number | string;
  authority?: number | string;
  warmth?: number | string;
  humor?: number | string;
  energy?: number | string;
  avoidPhrases?: string[];
  preferPhrases?: string[];
}

// ============================================================================
// BRAND CONTENT FORMATS INTERFACES
// ============================================================================

export interface BrandContentFormatColorScheme {
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface BrandContentFormatLengthConstraints {
  min?: number;
  max?: number;
  optimal?: number;
  unit?: 'chars' | 'words';
}

export interface BrandContentFormatStructureHints {
  sections?: Array<{ name: string; prompt: string }>;
  framework?: string;
}

export interface BrandContentFormatRules {
  preferEmojis?: boolean;
  avoidHashtags?: boolean;
  customInstructions?: string[];
}

export interface BrandContentFormatToneAdjustments {
  formality?: number;
  authority?: number;
  warmth?: number;
}

export interface BrandContentFormat {
  id: string;
  brand_id: string;
  format_type: string;
  custom_label?: string;
  description?: string;
  icon?: string;
  color_scheme?: string; // JSON: BrandContentFormatColorScheme
  is_enabled: number; // 0 or 1
  is_default: number; // 0 or 1
  display_order: number;
  length_constraints?: string; // JSON: BrandContentFormatLengthConstraints
  structure_hints?: string; // JSON: BrandContentFormatStructureHints
  format_rules?: string; // JSON: BrandContentFormatRules
  tone_adjustments?: string; // JSON: BrandContentFormatToneAdjustments
  created_at: string;
  updated_at: string;
}

export interface ContentGenerationSession {
  id: string;
  brand_id: string;
  content_type: ContentType;
  workflow_step: WorkflowStep;

  // Briefing data
  briefing_data: string; // JSON - topic, goals, audience, key messages, references

  // Generation state
  generated_drafts: string; // JSON array of draft variations
  feedback_history: string; // JSON array of feedback/iteration pairs

  // Session metadata
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// ============================================================================
// MEDIA GENERATION INTERFACES
// ============================================================================

export type ImageProvider = 'seedream' | 'nano-banana' | 'nano-banana-pro';
export type VideoProvider = 'kling-2.5' | 'kling-2.6' | 'wan-2.6' | 'veo-3.1';
export type MediaStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AssetType = 'character' | 'product' | 'logo' | 'reference';
export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export interface BrandVisualStyle {
  id: string;
  brand_id: string;
  primary_colors: string; // JSON array of hex colors
  secondary_colors: string; // JSON array of hex colors
  logo_url?: string;
  logo_position: LogoPosition;
  preferred_styles: string; // JSON array of style names
  default_aspect_ratio: string;
  default_provider: ImageProvider;
  use_anti_ai_techniques: number; // 0 or 1
  negative_prompts: string; // JSON array
  created_at: string;
  updated_at: string;
}

export interface GeneratedImage {
  id: string;
  brand_id: string;
  copy_id?: string;
  session_id?: string;
  provider: ImageProvider;
  prompt: string;
  negative_prompt?: string;
  aspect_ratio: string;
  width?: number;
  height?: number;
  seed?: number;
  style_preset?: string;
  image_url?: string;
  thumbnail_url?: string;
  local_path?: string;
  file_size_bytes?: number;
  generation_time_ms?: number;
  cost_cents?: number;
  status: MediaStatus;
  error_message?: string;
  rating?: number;
  is_favorite: number; // 0 or 1
  created_at: string;
}

export interface GeneratedVideo {
  id: string;
  brand_id: string;
  copy_id?: string;
  image_id?: string;
  session_id?: string;
  provider: VideoProvider;
  prompt: string;
  negative_prompt?: string;
  aspect_ratio: string;
  duration?: number;
  resolution?: string;
  start_image_url?: string;
  end_image_url?: string;
  audio_enabled: number; // 0 or 1
  video_url?: string;
  thumbnail_url?: string;
  local_path?: string;
  file_size_bytes?: number;
  generation_time_ms?: number;
  cost_cents?: number;
  status: MediaStatus;
  error_message?: string;
  created_at: string;
}

export interface BrandAsset {
  id: string;
  brand_id: string;
  asset_type: AssetType;
  name: string;
  reference_images: string; // JSON array of URLs
  thumbnail_url?: string;
  metadata: string; // JSON object
  created_at: string;
  updated_at: string;
}

export interface EditedVideo {
  id: string;
  brand_id: string;
  source_video_ids: string; // JSON array of video IDs
  pipeline_config: string; // JSON object with transitions, audio, subtitles
  output_url?: string;
  local_path?: string;
  thumbnail_url?: string;
  duration?: number;
  has_logo_overlay: number; // 0 or 1
  has_subtitles: number; // 0 or 1
  has_background_music: number; // 0 or 1
  status: MediaStatus;
  error_message?: string;
  created_at: string;
}

// ============================================================================
// CONTENT HUB INTERFACES (Cross-Mode Linking)
// ============================================================================

export type ContentHubItemType = 'copy' | 'image' | 'video';
export type ContentLinkType = 'generated_from' | 'inspired_by' | 'related';

// ============================================================================
// COPY SECTIONS INTERFACES (for copy-centric image generation)
// ============================================================================

export type SectionType = 'headline' | 'intro' | 'body-section' | 'conclusion' | 'cta' | 'quote' | 'list-item';

export interface CopySection {
  id: string;
  copy_id: string;
  section_type: SectionType;
  section_index: number;
  content: string;
  suggested_visual_concept: string | null;
  image_id: string | null;
  created_at: string;
}

export interface ContentLink {
  id: string;
  source_type: ContentHubItemType;
  source_id: string;
  target_type: ContentHubItemType;
  target_id: string;
  link_type: ContentLinkType;
  created_at: string;
}

export interface UnifiedContentItem {
  id: string;
  type: ContentHubItemType;
  brand_id: string;
  content_preview: string;
  thumbnail_url?: string;
  platform?: string;
  status?: string;
  created_at: string;
  linked_items?: ContentLink[];
}

// ============================================================================
// DATABASE CLASS
// ============================================================================

class CopywritingDatabase {
  private db: Database;

  constructor(dbPath?: string) {
    if (!dbPath) {
      const appDataDir = getAppDataDirectory();
      if (!fs.existsSync(appDataDir)) {
        fs.mkdirSync(appDataDir, { recursive: true });
      }
      dbPath = path.join(appDataDir, 'copywriting.db');
    }

    this.db = new Database(dbPath, { create: true });
    this.initialize();
  }

  private initialize() {
    // Brand configurations
    this.db.run(`
      CREATE TABLE IF NOT EXISTS brand_configs (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        name TEXT NOT NULL,
        website_url TEXT,
        instagram_url TEXT,
        facebook_url TEXT,
        linkedin_url TEXT,
        language TEXT DEFAULT 'nl',
        content_types TEXT DEFAULT '["social"]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_brand_configs_session
      ON brand_configs(session_id)
    `);

    // Scraped content
    this.db.run(`
      CREATE TABLE IF NOT EXISTS scraped_content (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        content_type TEXT,
        raw_content TEXT NOT NULL,
        scraped_at TEXT NOT NULL,
        engagement_metrics TEXT,
        metadata TEXT,
        FOREIGN KEY (brand_id) REFERENCES brand_configs(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_scraped_content_brand
      ON scraped_content(brand_id)
    `);

    // Brand voice profiles
    this.db.run(`
      CREATE TABLE IF NOT EXISTS brand_voice_profiles (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        formality_score REAL,
        humor_score REAL,
        energy_score REAL,
        authority_score REAL,
        vocabulary_complexity TEXT,
        avg_sentence_length REAL,
        emoji_density REAL,
        hashtag_density REAL,
        cta_style TEXT,
        top_frameworks TEXT,
        top_triggers TEXT,
        winning_hooks TEXT,
        avoid_patterns TEXT,
        samples_analyzed INTEGER DEFAULT 0,
        confidence_score REAL,
        created_at TEXT NOT NULL,
        superseded_at TEXT,
        FOREIGN KEY (brand_id) REFERENCES brand_configs(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_voice_profiles_brand
      ON brand_voice_profiles(brand_id)
    `);

    // Generated copy
    this.db.run(`
      CREATE TABLE IF NOT EXISTS generated_copy (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        session_id TEXT,
        voice_profile_version INTEGER DEFAULT 1,
        content_type TEXT NOT NULL,
        platform TEXT NOT NULL,
        copy_text TEXT NOT NULL,
        variation_number INTEGER DEFAULT 1,
        framework_used TEXT,
        triggers_applied TEXT,
        tone_scores TEXT,
        quality_score REAL,
        status TEXT DEFAULT 'draft',
        published_url TEXT,
        published_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (brand_id) REFERENCES brand_configs(id) ON DELETE CASCADE
      )
    `);

    // Migration: add session_id column if it doesn't exist
    try {
      this.db.run(`ALTER TABLE generated_copy ADD COLUMN session_id TEXT`);
      console.log('✅ Added session_id column to generated_copy');
    } catch {
      // Column already exists
    }

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_generated_copy_brand
      ON generated_copy(brand_id)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_generated_copy_status
      ON generated_copy(status)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_generated_copy_session
      ON generated_copy(session_id)
    `);

    // Engagement metrics
    this.db.run(`
      CREATE TABLE IF NOT EXISTS engagement_metrics (
        id TEXT PRIMARY KEY,
        copy_id TEXT NOT NULL,
        measured_at TEXT NOT NULL,
        hours_since_publish INTEGER,
        impressions INTEGER,
        engagements INTEGER,
        engagement_rate REAL,
        platform_metrics TEXT,
        vs_brand_avg REAL,
        vs_platform_avg REAL,
        FOREIGN KEY (copy_id) REFERENCES generated_copy(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_engagement_copy
      ON engagement_metrics(copy_id)
    `);

    // Copy insights (learned patterns)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS copy_insights (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        insight_type TEXT NOT NULL,
        insight_data TEXT NOT NULL,
        confidence REAL DEFAULT 0,
        sample_size INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        applied_to_profile INTEGER DEFAULT 0,
        FOREIGN KEY (brand_id) REFERENCES brand_configs(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_insights_brand
      ON copy_insights(brand_id)
    `);

    // ========================================================================
    // NEW TABLES FOR ENHANCED COPYWRITING MODE
    // ========================================================================

    // Scraped pages (deep crawling results)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS scraped_pages (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        url TEXT NOT NULL,
        page_type TEXT DEFAULT 'other',
        title TEXT,
        extracted_content TEXT NOT NULL,
        word_count INTEGER DEFAULT 0,
        detected_topics TEXT DEFAULT '[]',
        crawl_depth INTEGER DEFAULT 0,
        scraped_at TEXT NOT NULL,
        FOREIGN KEY (brand_id) REFERENCES brand_configs(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_scraped_pages_brand
      ON scraped_pages(brand_id)
    `);

    this.db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_scraped_pages_url
      ON scraped_pages(brand_id, url)
    `);

    // Brand voice analysis (LLM-generated insights)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS brand_voice_analysis (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        voice_description TEXT,
        writing_style_patterns TEXT DEFAULT '{}',
        vocabulary_preferences TEXT DEFAULT '{}',
        example_hooks TEXT DEFAULT '[]',
        generated_guidelines TEXT,
        tone_dimensions TEXT DEFAULT '{}',
        samples_analyzed INTEGER DEFAULT 0,
        confidence_score REAL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (brand_id) REFERENCES brand_configs(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_voice_analysis_brand
      ON brand_voice_analysis(brand_id)
    `);

    // Brand reference materials
    this.db.run(`
      CREATE TABLE IF NOT EXISTS brand_reference_materials (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        material_type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        source_url TEXT,
        tags TEXT DEFAULT '[]',
        created_at TEXT NOT NULL,
        FOREIGN KEY (brand_id) REFERENCES brand_configs(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_reference_materials_brand
      ON brand_reference_materials(brand_id)
    `);

    // Content generation sessions
    this.db.run(`
      CREATE TABLE IF NOT EXISTS content_generation_sessions (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        content_type TEXT NOT NULL,
        workflow_step TEXT DEFAULT 'brand_select',
        briefing_data TEXT DEFAULT '{}',
        generated_drafts TEXT DEFAULT '[]',
        feedback_history TEXT DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (brand_id) REFERENCES brand_configs(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_sessions_brand
      ON content_generation_sessions(brand_id)
    `);

    // ========================================================================
    // MEDIA GENERATION TABLES
    // ========================================================================

    // Brand visual identity settings
    this.db.run(`
      CREATE TABLE IF NOT EXISTS brand_visual_style (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL UNIQUE,
        primary_colors TEXT DEFAULT '[]',
        secondary_colors TEXT DEFAULT '[]',
        logo_url TEXT,
        logo_position TEXT DEFAULT 'bottom-right',
        preferred_styles TEXT DEFAULT '[]',
        default_aspect_ratio TEXT DEFAULT '1:1',
        default_provider TEXT DEFAULT 'seedream',
        use_anti_ai_techniques INTEGER DEFAULT 1,
        negative_prompts TEXT DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (brand_id) REFERENCES brand_configs(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_visual_style_brand
      ON brand_visual_style(brand_id)
    `);

    // Generated images
    this.db.run(`
      CREATE TABLE IF NOT EXISTS generated_images (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        copy_id TEXT,
        session_id TEXT,
        provider TEXT NOT NULL,
        prompt TEXT NOT NULL,
        negative_prompt TEXT,
        aspect_ratio TEXT DEFAULT '1:1',
        width INTEGER,
        height INTEGER,
        seed INTEGER,
        style_preset TEXT,
        image_url TEXT,
        thumbnail_url TEXT,
        local_path TEXT,
        file_size_bytes INTEGER,
        generation_time_ms INTEGER,
        cost_cents INTEGER,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        rating INTEGER,
        is_favorite INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (brand_id) REFERENCES brand_configs(id) ON DELETE CASCADE,
        FOREIGN KEY (copy_id) REFERENCES generated_copy(id) ON DELETE SET NULL
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_images_brand
      ON generated_images(brand_id)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_images_copy
      ON generated_images(copy_id)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_images_status
      ON generated_images(status)
    `);

    // Generated videos
    this.db.run(`
      CREATE TABLE IF NOT EXISTS generated_videos (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        copy_id TEXT,
        image_id TEXT,
        session_id TEXT,
        provider TEXT NOT NULL,
        prompt TEXT NOT NULL,
        negative_prompt TEXT,
        aspect_ratio TEXT DEFAULT '16:9',
        duration INTEGER,
        resolution TEXT,
        start_image_url TEXT,
        end_image_url TEXT,
        audio_enabled INTEGER DEFAULT 0,
        video_url TEXT,
        thumbnail_url TEXT,
        local_path TEXT,
        file_size_bytes INTEGER,
        generation_time_ms INTEGER,
        cost_cents INTEGER,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (brand_id) REFERENCES brand_configs(id) ON DELETE CASCADE,
        FOREIGN KEY (copy_id) REFERENCES generated_copy(id) ON DELETE SET NULL,
        FOREIGN KEY (image_id) REFERENCES generated_images(id) ON DELETE SET NULL
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_videos_brand
      ON generated_videos(brand_id)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_videos_status
      ON generated_videos(status)
    `);

    // Brand assets (characters, products, logos, references)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS brand_assets (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        name TEXT NOT NULL,
        reference_images TEXT DEFAULT '[]',
        thumbnail_url TEXT,
        metadata TEXT DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (brand_id) REFERENCES brand_configs(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_assets_brand
      ON brand_assets(brand_id)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_assets_type
      ON brand_assets(asset_type)
    `);

    // Edited videos (post-processing results)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS edited_videos (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        source_video_ids TEXT DEFAULT '[]',
        pipeline_config TEXT DEFAULT '{}',
        output_url TEXT,
        local_path TEXT,
        thumbnail_url TEXT,
        duration INTEGER,
        has_logo_overlay INTEGER DEFAULT 0,
        has_subtitles INTEGER DEFAULT 0,
        has_background_music INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (brand_id) REFERENCES brand_configs(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_edited_videos_brand
      ON edited_videos(brand_id)
    `);

    // ========================================================================
    // CONTENT HUB TABLE (Cross-Mode Linking)
    // ========================================================================

    // Content links for cross-mode relationships
    this.db.run(`
      CREATE TABLE IF NOT EXISTS content_links (
        id TEXT PRIMARY KEY,
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        link_type TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_content_links_source
      ON content_links(source_type, source_id)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_content_links_target
      ON content_links(target_type, target_id)
    `);

    // ========================================================================
    // COPY SECTIONS TABLE (for copy-centric image generation)
    // ========================================================================

    this.db.run(`
      CREATE TABLE IF NOT EXISTS copy_sections (
        id TEXT PRIMARY KEY,
        copy_id TEXT NOT NULL,
        section_type TEXT NOT NULL,
        section_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        suggested_visual_concept TEXT,
        image_id TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (copy_id) REFERENCES generated_copy(id) ON DELETE CASCADE,
        FOREIGN KEY (image_id) REFERENCES generated_images(id) ON DELETE SET NULL
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_sections_copy
      ON copy_sections(copy_id)
    `);

    // ========================================================================
    // POST TYPE TEMPLATES TABLE
    // ========================================================================

    this.db.run(`
      CREATE TABLE IF NOT EXISTS post_type_templates (
        id TEXT PRIMARY KEY,
        brand_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        platforms TEXT DEFAULT '[]',
        structure TEXT NOT NULL,
        example_output TEXT,
        variables TEXT DEFAULT '[]',
        is_system INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (brand_id) REFERENCES brand_configs(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_templates_brand
      ON post_type_templates(brand_id)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_templates_category
      ON post_type_templates(category)
    `);

    // Seed default templates if none exist
    this.seedDefaultTemplates();

    // ========================================================================
    // BRAND TONE PRESETS TABLE
    // ========================================================================

    this.db.run(`
      CREATE TABLE IF NOT EXISTS brand_tone_presets (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        tone_adjustments TEXT NOT NULL,
        use_cases TEXT DEFAULT '[]',
        example_phrases TEXT DEFAULT '[]',
        is_default INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (brand_id) REFERENCES brand_configs(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_tone_presets_brand
      ON brand_tone_presets(brand_id)
    `);

    // ========================================================================
    // BRAND CONTENT FORMATS TABLE
    // ========================================================================

    this.db.run(`
      CREATE TABLE IF NOT EXISTS brand_content_formats (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        format_type TEXT NOT NULL,
        custom_label TEXT,
        description TEXT,
        icon TEXT,
        color_scheme TEXT,
        is_enabled INTEGER DEFAULT 1,
        is_default INTEGER DEFAULT 0,
        display_order INTEGER DEFAULT 0,
        length_constraints TEXT,
        structure_hints TEXT,
        format_rules TEXT,
        tone_adjustments TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (brand_id) REFERENCES brand_configs(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_content_formats_brand
      ON brand_content_formats(brand_id)
    `);

    console.log('✅ Copywriting database initialized');
  }

  /**
   * Seed default global templates
   */
  private seedDefaultTemplates() {
    const existingCount = this.db
      .query<{ count: number }, []>('SELECT COUNT(*) as count FROM post_type_templates WHERE is_system = 1')
      .get()?.count || 0;

    if (existingCount > 0) return; // Already seeded

    const defaultTemplates: Array<{
      name: string;
      description: string;
      category: TemplateCategory;
      platforms: string[];
      structure: TemplateStructure;
      variables: string[];
    }> = [
      {
        name: 'Case Study',
        description: 'Client success story showcasing transformation and results',
        category: 'social_proof',
        platforms: ['linkedin', 'article'],
        structure: {
          sections: [
            { name: 'hook', prompt: 'Start with the transformation or surprising result', maxChars: 150 },
            { name: 'challenge', prompt: 'Describe the initial problem or situation', variables: ['client_name'] },
            { name: 'solution', prompt: 'Explain the approach or solution implemented' },
            { name: 'results', prompt: 'Share specific metrics and outcomes', variables: ['metric_1', 'metric_2'] },
            { name: 'cta', prompt: 'End with a question or call-to-action' },
          ],
          framework: 'BAB',
          tone_adjustments: { authority: '+15' },
        },
        variables: ['client_name', 'metric_1', 'metric_2'],
      },
      {
        name: 'Client Testimonial',
        description: 'Quote-based social proof with context and outcome',
        category: 'social_proof',
        platforms: ['linkedin', 'instagram', 'facebook'],
        structure: {
          sections: [
            { name: 'setup', prompt: 'Brief context about the client/situation', maxChars: 100 },
            { name: 'quote', prompt: 'The testimonial quote in their voice', variables: ['client_quote'] },
            { name: 'context', prompt: 'Background on what was achieved' },
            { name: 'takeaway', prompt: 'What others can learn from this' },
          ],
          framework: 'Quote-Context-CTA',
          tone_adjustments: { warmth: '+10', authority: '+5' },
        },
        variables: ['client_quote', 'client_name'],
      },
      {
        name: 'Product Announcement',
        description: 'New feature or product launch announcement',
        category: 'thought_leadership',
        platforms: ['linkedin', 'twitter', 'newsletter'],
        structure: {
          sections: [
            { name: 'headline', prompt: 'Attention-grabbing announcement', maxChars: 80 },
            { name: 'problem', prompt: 'The problem this solves' },
            { name: 'solution', prompt: 'What we built/launched', variables: ['product_name'] },
            { name: 'benefits', prompt: 'Key benefits (2-3 bullet points)' },
            { name: 'availability', prompt: 'How/when to get it', variables: ['launch_date'] },
          ],
          framework: 'PAS',
          tone_adjustments: { energy: '+15', authority: '+10' },
        },
        variables: ['product_name', 'launch_date'],
      },
      {
        name: 'Behind-the-Scenes',
        description: 'Team or process content that humanizes the brand',
        category: 'engagement',
        platforms: ['instagram', 'linkedin', 'facebook'],
        structure: {
          sections: [
            { name: 'hook', prompt: 'Curiosity-inducing opener', maxChars: 100 },
            { name: 'reveal', prompt: 'What you are showing/sharing' },
            { name: 'story', prompt: 'The human story behind it' },
            { name: 'engagement', prompt: 'Question to invite interaction' },
          ],
          framework: 'Story-Engagement',
          tone_adjustments: { warmth: '+20', formality: '-15' },
        },
        variables: [],
      },
      {
        name: 'Educational Thread',
        description: 'Multi-post teaching content (thread format)',
        category: 'educational',
        platforms: ['twitter', 'linkedin'],
        structure: {
          sections: [
            { name: 'hook', prompt: 'Promise of value to hook readers', maxChars: 150 },
            { name: 'point_1', prompt: 'First key insight or lesson' },
            { name: 'point_2', prompt: 'Second key insight' },
            { name: 'point_3', prompt: 'Third key insight' },
            { name: 'summary', prompt: 'TL;DR recap' },
            { name: 'cta', prompt: 'Follow/share CTA' },
          ],
          framework: 'Thread',
          tone_adjustments: { authority: '+10' },
        },
        variables: ['topic'],
      },
      {
        name: 'Industry Commentary',
        description: 'News or trend analysis with expert opinion',
        category: 'thought_leadership',
        platforms: ['linkedin', 'twitter'],
        structure: {
          sections: [
            { name: 'news', prompt: 'Reference the news/trend', variables: ['news_item'] },
            { name: 'take', prompt: 'Your unique perspective on it' },
            { name: 'implications', prompt: 'What it means for the industry/audience' },
            { name: 'prediction', prompt: 'What happens next' },
            { name: 'question', prompt: 'Invite discussion' },
          ],
          framework: 'Commentary',
          tone_adjustments: { authority: '+20', formality: '+10' },
        },
        variables: ['news_item'],
      },
      {
        name: 'Myth Busting',
        description: 'Debunk common misconceptions in your field',
        category: 'educational',
        platforms: ['linkedin', 'instagram', 'article'],
        structure: {
          sections: [
            { name: 'myth', prompt: 'State the common myth/misconception', variables: ['myth'] },
            { name: 'why_believed', prompt: 'Why people believe it' },
            { name: 'truth', prompt: 'The actual reality with evidence' },
            { name: 'action', prompt: 'What to do instead' },
          ],
          framework: 'Myth-Truth',
          tone_adjustments: { authority: '+15', energy: '+10' },
        },
        variables: ['myth'],
      },
      {
        name: 'Team Spotlight',
        description: 'Feature a team member to humanize the brand',
        category: 'engagement',
        platforms: ['linkedin', 'instagram', 'facebook'],
        structure: {
          sections: [
            { name: 'intro', prompt: 'Introduce the team member', variables: ['name', 'role'] },
            { name: 'journey', prompt: 'Their background or journey' },
            { name: 'contribution', prompt: 'What they bring to the team' },
            { name: 'fun_fact', prompt: 'Something personal/fun about them' },
            { name: 'welcome', prompt: 'Welcome message or engagement prompt' },
          ],
          framework: 'Spotlight',
          tone_adjustments: { warmth: '+25', formality: '-10' },
        },
        variables: ['name', 'role'],
      },
    ];

    const now = new Date().toISOString();
    for (const template of defaultTemplates) {
      const id = randomUUID();
      this.db.run(
        `INSERT INTO post_type_templates
          (id, brand_id, name, description, category, platforms, structure, variables, is_system, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          null, // Global template
          template.name,
          template.description,
          template.category,
          JSON.stringify(template.platforms),
          JSON.stringify(template.structure),
          JSON.stringify(template.variables),
          1, // is_system = true
          now,
        ]
      );
    }

    console.log(`✅ Seeded ${defaultTemplates.length} default templates`);
  }

  // ============================================================================
  // BRAND CONFIG OPERATIONS
  // ============================================================================

  createBrandConfig(
    sessionId: string,
    name: string,
    options: {
      websiteUrl?: string;
      instagramUrl?: string;
      facebookUrl?: string;
      linkedinUrl?: string;
      language?: 'nl' | 'en' | 'both';
      contentTypes?: string[];
    } = {}
  ): BrandConfig {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO brand_configs
        (id, session_id, name, website_url, instagram_url, facebook_url, linkedin_url, language, content_types, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        sessionId,
        name,
        options.websiteUrl || null,
        options.instagramUrl || null,
        options.facebookUrl || null,
        options.linkedinUrl || null,
        options.language || 'nl',
        JSON.stringify(options.contentTypes || ['social']),
        now,
        now,
      ]
    );

    return {
      id,
      session_id: sessionId,
      name,
      website_url: options.websiteUrl,
      instagram_url: options.instagramUrl,
      facebook_url: options.facebookUrl,
      linkedin_url: options.linkedinUrl,
      language: options.language || 'nl',
      content_types: JSON.stringify(options.contentTypes || ['social']),
      created_at: now,
      updated_at: now,
    };
  }

  getBrandConfig(brandId: string): BrandConfig | null {
    return this.db
      .query<BrandConfig, [string]>('SELECT * FROM brand_configs WHERE id = ?')
      .get(brandId) || null;
  }

  getBrandConfigBySession(sessionId: string): BrandConfig | null {
    return this.db
      .query<BrandConfig, [string]>(
        'SELECT * FROM brand_configs WHERE session_id = ? ORDER BY updated_at DESC LIMIT 1'
      )
      .get(sessionId) || null;
  }

  listBrandConfigs(): BrandConfig[] {
    return this.db
      .query<BrandConfig, []>('SELECT * FROM brand_configs ORDER BY updated_at DESC')
      .all();
  }

  /**
   * List brands with analysis status (indicates if deep voice analysis exists)
   */
  listBrandConfigsWithStatus(): (BrandConfig & { has_voice_analysis: boolean; analysis_confidence?: number })[] {
    return this.db
      .query<BrandConfig & { has_voice_analysis: number; analysis_confidence: number | null }, []>(`
        SELECT
          bc.*,
          CASE WHEN bva.id IS NOT NULL THEN 1 ELSE 0 END as has_voice_analysis,
          bva.confidence_score as analysis_confidence
        FROM brand_configs bc
        LEFT JOIN brand_voice_analysis bva ON bc.id = bva.brand_id
        ORDER BY bc.updated_at DESC
      `)
      .all()
      .map(row => ({
        ...row,
        has_voice_analysis: row.has_voice_analysis === 1,
        analysis_confidence: row.analysis_confidence ?? undefined,
      }));
  }

  updateBrandConfig(
    brandId: string,
    updates: Partial<Omit<BrandConfig, 'id' | 'session_id' | 'created_at' | 'updated_at'>>
  ): boolean {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.website_url !== undefined) {
      fields.push('website_url = ?');
      values.push(updates.website_url);
    }
    if (updates.instagram_url !== undefined) {
      fields.push('instagram_url = ?');
      values.push(updates.instagram_url);
    }
    if (updates.facebook_url !== undefined) {
      fields.push('facebook_url = ?');
      values.push(updates.facebook_url);
    }
    if (updates.linkedin_url !== undefined) {
      fields.push('linkedin_url = ?');
      values.push(updates.linkedin_url);
    }
    if (updates.language !== undefined) {
      fields.push('language = ?');
      values.push(updates.language);
    }
    if (updates.content_types !== undefined) {
      fields.push('content_types = ?');
      values.push(updates.content_types);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(brandId);

    const result = this.db.run(
      `UPDATE brand_configs SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.changes > 0;
  }

  deleteBrandConfig(brandId: string): boolean {
    const result = this.db.run('DELETE FROM brand_configs WHERE id = ?', [brandId]);
    return result.changes > 0;
  }

  // ============================================================================
  // SCRAPED CONTENT OPERATIONS
  // ============================================================================

  addScrapedContent(
    brandId: string,
    platform: ScrapedContent['platform'],
    rawContent: string,
    options: {
      contentType?: string;
      engagementMetrics?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    } = {}
  ): ScrapedContent {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO scraped_content
        (id, brand_id, platform, content_type, raw_content, scraped_at, engagement_metrics, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        brandId,
        platform,
        options.contentType || null,
        rawContent,
        now,
        options.engagementMetrics ? JSON.stringify(options.engagementMetrics) : null,
        options.metadata ? JSON.stringify(options.metadata) : null,
      ]
    );

    return {
      id,
      brand_id: brandId,
      platform,
      content_type: options.contentType || '',
      raw_content: rawContent,
      scraped_at: now,
      engagement_metrics: options.engagementMetrics
        ? JSON.stringify(options.engagementMetrics)
        : undefined,
      metadata: options.metadata ? JSON.stringify(options.metadata) : undefined,
    };
  }

  getScrapedContent(brandId: string, platform?: string): ScrapedContent[] {
    if (platform) {
      return this.db
        .query<ScrapedContent, [string, string]>(
          'SELECT * FROM scraped_content WHERE brand_id = ? AND platform = ? ORDER BY scraped_at DESC'
        )
        .all(brandId, platform);
    }
    return this.db
      .query<ScrapedContent, [string]>(
        'SELECT * FROM scraped_content WHERE brand_id = ? ORDER BY scraped_at DESC'
      )
      .all(brandId);
  }

  // ============================================================================
  // VOICE PROFILE OPERATIONS
  // ============================================================================

  createVoiceProfile(
    brandId: string,
    profile: Partial<Omit<BrandVoiceProfile, 'id' | 'brand_id' | 'created_at'>>
  ): BrandVoiceProfile {
    const id = randomUUID();
    const now = new Date().toISOString();

    // Get current version number
    const current = this.getCurrentVoiceProfile(brandId);
    const version = current ? current.version + 1 : 1;

    // Supersede previous version
    if (current) {
      this.db.run(
        'UPDATE brand_voice_profiles SET superseded_at = ? WHERE id = ?',
        [now, current.id]
      );
    }

    this.db.run(
      `INSERT INTO brand_voice_profiles
        (id, brand_id, version, formality_score, humor_score, energy_score, authority_score,
         vocabulary_complexity, avg_sentence_length, emoji_density, hashtag_density, cta_style,
         top_frameworks, top_triggers, winning_hooks, avoid_patterns,
         samples_analyzed, confidence_score, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        brandId,
        version,
        profile.formality_score ?? null,
        profile.humor_score ?? null,
        profile.energy_score ?? null,
        profile.authority_score ?? null,
        profile.vocabulary_complexity ?? null,
        profile.avg_sentence_length ?? null,
        profile.emoji_density ?? null,
        profile.hashtag_density ?? null,
        profile.cta_style ?? null,
        profile.top_frameworks ?? null,
        profile.top_triggers ?? null,
        profile.winning_hooks ?? null,
        profile.avoid_patterns ?? null,
        profile.samples_analyzed ?? 0,
        profile.confidence_score ?? null,
        now,
      ]
    );

    return {
      id,
      brand_id: brandId,
      version,
      ...profile,
      samples_analyzed: profile.samples_analyzed ?? 0,
      created_at: now,
    };
  }

  getCurrentVoiceProfile(brandId: string): BrandVoiceProfile | null {
    return this.db
      .query<BrandVoiceProfile, [string]>(
        'SELECT * FROM brand_voice_profiles WHERE brand_id = ? AND superseded_at IS NULL ORDER BY version DESC LIMIT 1'
      )
      .get(brandId) || null;
  }

  getVoiceProfileHistory(brandId: string): BrandVoiceProfile[] {
    return this.db
      .query<BrandVoiceProfile, [string]>(
        'SELECT * FROM brand_voice_profiles WHERE brand_id = ? ORDER BY version DESC'
      )
      .all(brandId);
  }

  // ============================================================================
  // GENERATED COPY OPERATIONS
  // ============================================================================

  createGeneratedCopy(
    brandId: string,
    copyText: string,
    options: {
      contentType: string;
      platform: string;
      sessionId?: string;
      variationNumber?: number;
      frameworkUsed?: string;
      triggersApplied?: string[];
      toneScores?: Record<string, number>;
      qualityScore?: number;
      voiceProfileVersion?: number;
    }
  ): GeneratedCopy {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO generated_copy
        (id, brand_id, session_id, voice_profile_version, content_type, platform, copy_text, variation_number,
         framework_used, triggers_applied, tone_scores, quality_score, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        brandId,
        options.sessionId ?? null,
        options.voiceProfileVersion ?? 1,
        options.contentType,
        options.platform,
        copyText,
        options.variationNumber ?? 1,
        options.frameworkUsed ?? null,
        options.triggersApplied ? JSON.stringify(options.triggersApplied) : null,
        options.toneScores ? JSON.stringify(options.toneScores) : null,
        options.qualityScore ?? null,
        'draft',
        now,
      ]
    );

    return {
      id,
      brand_id: brandId,
      session_id: options.sessionId,
      voice_profile_version: options.voiceProfileVersion ?? 1,
      content_type: options.contentType,
      platform: options.platform,
      copy_text: copyText,
      variation_number: options.variationNumber ?? 1,
      framework_used: options.frameworkUsed,
      triggers_applied: options.triggersApplied
        ? JSON.stringify(options.triggersApplied)
        : undefined,
      tone_scores: options.toneScores ? JSON.stringify(options.toneScores) : undefined,
      quality_score: options.qualityScore,
      status: 'draft',
      created_at: now,
    };
  }

  getGeneratedCopy(copyId: string): GeneratedCopy | null {
    return this.db
      .query<GeneratedCopy, [string]>('SELECT * FROM generated_copy WHERE id = ?')
      .get(copyId) || null;
  }

  listGeneratedCopy(brandId: string, status?: string): GeneratedCopy[] {
    if (status) {
      return this.db
        .query<GeneratedCopy, [string, string]>(
          'SELECT * FROM generated_copy WHERE brand_id = ? AND status = ? ORDER BY created_at DESC'
        )
        .all(brandId, status);
    }
    return this.db
      .query<GeneratedCopy, [string]>(
        'SELECT * FROM generated_copy WHERE brand_id = ? ORDER BY created_at DESC'
      )
      .all(brandId);
  }

  updateCopyStatus(
    copyId: string,
    status: GeneratedCopy['status'],
    publishedUrl?: string
  ): boolean {
    const now = new Date().toISOString();

    if (status === 'published' && publishedUrl) {
      const result = this.db.run(
        'UPDATE generated_copy SET status = ?, published_url = ?, published_at = ? WHERE id = ?',
        [status, publishedUrl, now, copyId]
      );
      return result.changes > 0;
    }

    const result = this.db.run(
      'UPDATE generated_copy SET status = ? WHERE id = ?',
      [status, copyId]
    );
    return result.changes > 0;
  }

  // ============================================================================
  // ENGAGEMENT METRICS OPERATIONS
  // ============================================================================

  addEngagementMetrics(
    copyId: string,
    hoursSincePublish: number,
    metrics: {
      impressions?: number;
      engagements?: number;
      engagementRate?: number;
      platformMetrics?: Record<string, unknown>;
      vsBrandAvg?: number;
      vsPlatformAvg?: number;
    }
  ): EngagementMetrics {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO engagement_metrics
        (id, copy_id, measured_at, hours_since_publish, impressions, engagements,
         engagement_rate, platform_metrics, vs_brand_avg, vs_platform_avg)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        copyId,
        now,
        hoursSincePublish,
        metrics.impressions ?? null,
        metrics.engagements ?? null,
        metrics.engagementRate ?? null,
        metrics.platformMetrics ? JSON.stringify(metrics.platformMetrics) : null,
        metrics.vsBrandAvg ?? null,
        metrics.vsPlatformAvg ?? null,
      ]
    );

    return {
      id,
      copy_id: copyId,
      measured_at: now,
      hours_since_publish: hoursSincePublish,
      impressions: metrics.impressions,
      engagements: metrics.engagements,
      engagement_rate: metrics.engagementRate,
      platform_metrics: metrics.platformMetrics
        ? JSON.stringify(metrics.platformMetrics)
        : undefined,
      vs_brand_avg: metrics.vsBrandAvg,
      vs_platform_avg: metrics.vsPlatformAvg,
    };
  }

  getEngagementMetrics(copyId: string): EngagementMetrics[] {
    return this.db
      .query<EngagementMetrics, [string]>(
        'SELECT * FROM engagement_metrics WHERE copy_id = ? ORDER BY measured_at DESC'
      )
      .all(copyId);
  }

  // ============================================================================
  // INSIGHTS OPERATIONS
  // ============================================================================

  addInsight(
    brandId: string,
    insightType: string,
    insightData: Record<string, unknown>,
    confidence: number,
    sampleSize: number
  ): CopyInsight {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO copy_insights
        (id, brand_id, insight_type, insight_data, confidence, sample_size, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, brandId, insightType, JSON.stringify(insightData), confidence, sampleSize, now]
    );

    return {
      id,
      brand_id: brandId,
      insight_type: insightType,
      insight_data: JSON.stringify(insightData),
      confidence,
      sample_size: sampleSize,
      created_at: now,
      applied_to_profile: false,
    };
  }

  getInsights(brandId: string): CopyInsight[] {
    return this.db
      .query<CopyInsight, [string]>(
        'SELECT * FROM copy_insights WHERE brand_id = ? ORDER BY created_at DESC'
      )
      .all(brandId);
  }

  markInsightApplied(insightId: string): boolean {
    const result = this.db.run(
      'UPDATE copy_insights SET applied_to_profile = 1 WHERE id = ?',
      [insightId]
    );
    return result.changes > 0;
  }

  // ============================================================================
  // SCRAPED PAGES OPERATIONS (Deep Crawling)
  // ============================================================================

  addScrapedPage(
    brandId: string,
    url: string,
    options: {
      pageType?: ScrapedPage['page_type'];
      title?: string;
      extractedContent: Record<string, unknown>;
      wordCount?: number;
      detectedTopics?: string[];
      crawlDepth?: number;
    }
  ): ScrapedPage {
    const id = randomUUID();
    const now = new Date().toISOString();

    // Use INSERT OR REPLACE to handle duplicate URLs
    this.db.run(
      `INSERT OR REPLACE INTO scraped_pages
        (id, brand_id, url, page_type, title, extracted_content, word_count, detected_topics, crawl_depth, scraped_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        brandId,
        url,
        options.pageType || 'other',
        options.title || '',
        JSON.stringify(options.extractedContent),
        options.wordCount || 0,
        JSON.stringify(options.detectedTopics || []),
        options.crawlDepth || 0,
        now,
      ]
    );

    return {
      id,
      brand_id: brandId,
      url,
      page_type: options.pageType || 'other',
      title: options.title || '',
      extracted_content: JSON.stringify(options.extractedContent),
      word_count: options.wordCount || 0,
      detected_topics: JSON.stringify(options.detectedTopics || []),
      crawl_depth: options.crawlDepth || 0,
      scraped_at: now,
    };
  }

  getScrapedPages(brandId: string, pageType?: string): ScrapedPage[] {
    if (pageType) {
      return this.db
        .query<ScrapedPage, [string, string]>(
          'SELECT * FROM scraped_pages WHERE brand_id = ? AND page_type = ? ORDER BY crawl_depth ASC, scraped_at DESC'
        )
        .all(brandId, pageType);
    }
    return this.db
      .query<ScrapedPage, [string]>(
        'SELECT * FROM scraped_pages WHERE brand_id = ? ORDER BY crawl_depth ASC, scraped_at DESC'
      )
      .all(brandId);
  }

  getScrapedPageByUrl(brandId: string, url: string): ScrapedPage | null {
    return this.db
      .query<ScrapedPage, [string, string]>(
        'SELECT * FROM scraped_pages WHERE brand_id = ? AND url = ?'
      )
      .get(brandId, url) || null;
  }

  getScrapedPagesCount(brandId: string): number {
    const result = this.db
      .query<{ count: number }, [string]>(
        'SELECT COUNT(*) as count FROM scraped_pages WHERE brand_id = ?'
      )
      .get(brandId);
    return result?.count || 0;
  }

  deleteScrapedPages(brandId: string): boolean {
    const result = this.db.run('DELETE FROM scraped_pages WHERE brand_id = ?', [brandId]);
    return result.changes > 0;
  }

  // ============================================================================
  // BRAND VOICE ANALYSIS OPERATIONS (LLM-Generated)
  // ============================================================================

  createOrUpdateVoiceAnalysis(
    brandId: string,
    analysis: {
      voiceDescription?: string;
      writingStylePatterns?: Record<string, unknown>;
      vocabularyPreferences?: Record<string, unknown>;
      exampleHooks?: string[];
      generatedGuidelines?: string;
      toneDimensions?: Record<string, number>;
      samplesAnalyzed?: number;
      confidenceScore?: number;
    }
  ): BrandVoiceAnalysis {
    const now = new Date().toISOString();
    const existing = this.getVoiceAnalysis(brandId);

    if (existing) {
      // Update existing
      this.db.run(
        `UPDATE brand_voice_analysis SET
          voice_description = ?,
          writing_style_patterns = ?,
          vocabulary_preferences = ?,
          example_hooks = ?,
          generated_guidelines = ?,
          tone_dimensions = ?,
          samples_analyzed = ?,
          confidence_score = ?,
          updated_at = ?
         WHERE brand_id = ?`,
        [
          analysis.voiceDescription ?? existing.voice_description,
          analysis.writingStylePatterns
            ? JSON.stringify(analysis.writingStylePatterns)
            : existing.writing_style_patterns,
          analysis.vocabularyPreferences
            ? JSON.stringify(analysis.vocabularyPreferences)
            : existing.vocabulary_preferences,
          analysis.exampleHooks
            ? JSON.stringify(analysis.exampleHooks)
            : existing.example_hooks,
          analysis.generatedGuidelines ?? existing.generated_guidelines,
          analysis.toneDimensions
            ? JSON.stringify(analysis.toneDimensions)
            : existing.tone_dimensions,
          analysis.samplesAnalyzed ?? existing.samples_analyzed,
          analysis.confidenceScore ?? existing.confidence_score,
          now,
          brandId,
        ]
      );

      return {
        ...existing,
        voice_description: analysis.voiceDescription ?? existing.voice_description,
        writing_style_patterns: analysis.writingStylePatterns
          ? JSON.stringify(analysis.writingStylePatterns)
          : existing.writing_style_patterns,
        vocabulary_preferences: analysis.vocabularyPreferences
          ? JSON.stringify(analysis.vocabularyPreferences)
          : existing.vocabulary_preferences,
        example_hooks: analysis.exampleHooks
          ? JSON.stringify(analysis.exampleHooks)
          : existing.example_hooks,
        generated_guidelines: analysis.generatedGuidelines ?? existing.generated_guidelines,
        tone_dimensions: analysis.toneDimensions
          ? JSON.stringify(analysis.toneDimensions)
          : existing.tone_dimensions,
        samples_analyzed: analysis.samplesAnalyzed ?? existing.samples_analyzed,
        confidence_score: analysis.confidenceScore ?? existing.confidence_score,
        updated_at: now,
      };
    }

    // Create new
    const id = randomUUID();
    this.db.run(
      `INSERT INTO brand_voice_analysis
        (id, brand_id, voice_description, writing_style_patterns, vocabulary_preferences,
         example_hooks, generated_guidelines, tone_dimensions, samples_analyzed, confidence_score,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        brandId,
        analysis.voiceDescription || '',
        JSON.stringify(analysis.writingStylePatterns || {}),
        JSON.stringify(analysis.vocabularyPreferences || {}),
        JSON.stringify(analysis.exampleHooks || []),
        analysis.generatedGuidelines || '',
        JSON.stringify(analysis.toneDimensions || {}),
        analysis.samplesAnalyzed || 0,
        analysis.confidenceScore || 0,
        now,
        now,
      ]
    );

    return {
      id,
      brand_id: brandId,
      voice_description: analysis.voiceDescription || '',
      writing_style_patterns: JSON.stringify(analysis.writingStylePatterns || {}),
      vocabulary_preferences: JSON.stringify(analysis.vocabularyPreferences || {}),
      example_hooks: JSON.stringify(analysis.exampleHooks || []),
      generated_guidelines: analysis.generatedGuidelines || '',
      tone_dimensions: JSON.stringify(analysis.toneDimensions || {}),
      samples_analyzed: analysis.samplesAnalyzed || 0,
      confidence_score: analysis.confidenceScore || 0,
      created_at: now,
      updated_at: now,
    };
  }

  getVoiceAnalysis(brandId: string): BrandVoiceAnalysis | null {
    return this.db
      .query<BrandVoiceAnalysis, [string]>(
        'SELECT * FROM brand_voice_analysis WHERE brand_id = ? ORDER BY updated_at DESC LIMIT 1'
      )
      .get(brandId) || null;
  }

  // ============================================================================
  // REFERENCE MATERIALS OPERATIONS
  // ============================================================================

  addReferenceMaterial(
    brandId: string,
    options: {
      materialType: BrandReferenceMaterial['material_type'];
      title: string;
      content: string;
      sourceUrl?: string;
      tags?: string[];
    }
  ): BrandReferenceMaterial {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO brand_reference_materials
        (id, brand_id, material_type, title, content, source_url, tags, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        brandId,
        options.materialType,
        options.title,
        options.content,
        options.sourceUrl || null,
        JSON.stringify(options.tags || []),
        now,
      ]
    );

    return {
      id,
      brand_id: brandId,
      material_type: options.materialType,
      title: options.title,
      content: options.content,
      source_url: options.sourceUrl,
      tags: JSON.stringify(options.tags || []),
      created_at: now,
    };
  }

  getReferenceMaterials(brandId: string, materialType?: string): BrandReferenceMaterial[] {
    if (materialType) {
      return this.db
        .query<BrandReferenceMaterial, [string, string]>(
          'SELECT * FROM brand_reference_materials WHERE brand_id = ? AND material_type = ? ORDER BY created_at DESC'
        )
        .all(brandId, materialType);
    }
    return this.db
      .query<BrandReferenceMaterial, [string]>(
        'SELECT * FROM brand_reference_materials WHERE brand_id = ? ORDER BY created_at DESC'
      )
      .all(brandId);
  }

  getReferenceMaterial(referenceId: string): BrandReferenceMaterial | null {
    return this.db
      .query<BrandReferenceMaterial, [string]>(
        'SELECT * FROM brand_reference_materials WHERE id = ?'
      )
      .get(referenceId) || null;
  }

  updateReferenceMaterial(
    referenceId: string,
    updates: Partial<Pick<BrandReferenceMaterial, 'title' | 'content' | 'tags'>>
  ): boolean {
    const fields: string[] = [];
    const values: (string | null)[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(updates.tags);
    }

    if (fields.length === 0) return false;

    values.push(referenceId);
    const result = this.db.run(
      `UPDATE brand_reference_materials SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.changes > 0;
  }

  deleteReferenceMaterial(referenceId: string): boolean {
    const result = this.db.run('DELETE FROM brand_reference_materials WHERE id = ?', [referenceId]);
    return result.changes > 0;
  }

  // ============================================================================
  // CONTENT GENERATION SESSION OPERATIONS
  // ============================================================================

  createSession(
    brandId: string,
    contentType: ContentType
  ): ContentGenerationSession {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO content_generation_sessions
        (id, brand_id, content_type, workflow_step, briefing_data, generated_drafts, feedback_history, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        brandId,
        contentType,
        'brand_select',
        '{}',
        '[]',
        '[]',
        now,
        now,
      ]
    );

    return {
      id,
      brand_id: brandId,
      content_type: contentType,
      workflow_step: 'brand_select',
      briefing_data: '{}',
      generated_drafts: '[]',
      feedback_history: '[]',
      created_at: now,
      updated_at: now,
    };
  }

  getSession(sessionId: string): ContentGenerationSession | null {
    return this.db
      .query<ContentGenerationSession, [string]>(
        'SELECT * FROM content_generation_sessions WHERE id = ?'
      )
      .get(sessionId) || null;
  }

  getActiveSessions(brandId: string): ContentGenerationSession[] {
    return this.db
      .query<ContentGenerationSession, [string]>(
        'SELECT * FROM content_generation_sessions WHERE brand_id = ? AND completed_at IS NULL ORDER BY updated_at DESC'
      )
      .all(brandId);
  }

  updateSession(
    sessionId: string,
    updates: {
      workflowStep?: WorkflowStep;
      briefingData?: Record<string, unknown>;
      generatedDrafts?: unknown[];
      feedbackHistory?: unknown[];
    }
  ): boolean {
    const now = new Date().toISOString();
    const fields: string[] = ['updated_at = ?'];
    const values: (string | null)[] = [now];

    if (updates.workflowStep !== undefined) {
      fields.push('workflow_step = ?');
      values.push(updates.workflowStep);
    }
    if (updates.briefingData !== undefined) {
      fields.push('briefing_data = ?');
      values.push(JSON.stringify(updates.briefingData));
    }
    if (updates.generatedDrafts !== undefined) {
      fields.push('generated_drafts = ?');
      values.push(JSON.stringify(updates.generatedDrafts));
    }
    if (updates.feedbackHistory !== undefined) {
      fields.push('feedback_history = ?');
      values.push(JSON.stringify(updates.feedbackHistory));
    }

    values.push(sessionId);
    const result = this.db.run(
      `UPDATE content_generation_sessions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.changes > 0;
  }

  completeSession(sessionId: string): boolean {
    const now = new Date().toISOString();
    const result = this.db.run(
      'UPDATE content_generation_sessions SET workflow_step = ?, completed_at = ?, updated_at = ? WHERE id = ?',
      ['completed', now, now, sessionId]
    );
    return result.changes > 0;
  }

  addSessionFeedback(
    sessionId: string,
    feedback: { draft_index: number; feedback: string; refined_draft?: string }
  ): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    const history = JSON.parse(session.feedback_history || '[]') as unknown[];
    history.push({ ...feedback, timestamp: new Date().toISOString() });

    return this.updateSession(sessionId, { feedbackHistory: history });
  }

  // ============================================================================
  // BRAND VISUAL STYLE OPERATIONS
  // ============================================================================

  createOrUpdateVisualStyle(
    brandId: string,
    style: {
      primaryColors?: string[];
      secondaryColors?: string[];
      logoUrl?: string;
      logoPosition?: LogoPosition;
      preferredStyles?: string[];
      defaultAspectRatio?: string;
      defaultProvider?: ImageProvider;
      useAntiAiTechniques?: boolean;
      negativePrompts?: string[];
    }
  ): BrandVisualStyle {
    const now = new Date().toISOString();
    const existing = this.getVisualStyle(brandId);

    if (existing) {
      this.db.run(
        `UPDATE brand_visual_style SET
          primary_colors = ?,
          secondary_colors = ?,
          logo_url = ?,
          logo_position = ?,
          preferred_styles = ?,
          default_aspect_ratio = ?,
          default_provider = ?,
          use_anti_ai_techniques = ?,
          negative_prompts = ?,
          updated_at = ?
         WHERE brand_id = ?`,
        [
          style.primaryColors ? JSON.stringify(style.primaryColors) : existing.primary_colors,
          style.secondaryColors ? JSON.stringify(style.secondaryColors) : existing.secondary_colors,
          style.logoUrl ?? existing.logo_url ?? null,
          style.logoPosition ?? existing.logo_position,
          style.preferredStyles ? JSON.stringify(style.preferredStyles) : existing.preferred_styles,
          style.defaultAspectRatio ?? existing.default_aspect_ratio,
          style.defaultProvider ?? existing.default_provider,
          style.useAntiAiTechniques !== undefined ? (style.useAntiAiTechniques ? 1 : 0) : existing.use_anti_ai_techniques,
          style.negativePrompts ? JSON.stringify(style.negativePrompts) : existing.negative_prompts,
          now,
          brandId,
        ]
      );

      return this.getVisualStyle(brandId)!;
    }

    const id = randomUUID();
    this.db.run(
      `INSERT INTO brand_visual_style
        (id, brand_id, primary_colors, secondary_colors, logo_url, logo_position,
         preferred_styles, default_aspect_ratio, default_provider, use_anti_ai_techniques,
         negative_prompts, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        brandId,
        JSON.stringify(style.primaryColors || []),
        JSON.stringify(style.secondaryColors || []),
        style.logoUrl || null,
        style.logoPosition || 'bottom-right',
        JSON.stringify(style.preferredStyles || []),
        style.defaultAspectRatio || '1:1',
        style.defaultProvider || 'seedream',
        style.useAntiAiTechniques !== undefined ? (style.useAntiAiTechniques ? 1 : 0) : 1,
        JSON.stringify(style.negativePrompts || []),
        now,
        now,
      ]
    );

    return {
      id,
      brand_id: brandId,
      primary_colors: JSON.stringify(style.primaryColors || []),
      secondary_colors: JSON.stringify(style.secondaryColors || []),
      logo_url: style.logoUrl,
      logo_position: style.logoPosition || 'bottom-right',
      preferred_styles: JSON.stringify(style.preferredStyles || []),
      default_aspect_ratio: style.defaultAspectRatio || '1:1',
      default_provider: style.defaultProvider || 'seedream',
      use_anti_ai_techniques: style.useAntiAiTechniques !== undefined ? (style.useAntiAiTechniques ? 1 : 0) : 1,
      negative_prompts: JSON.stringify(style.negativePrompts || []),
      created_at: now,
      updated_at: now,
    };
  }

  getVisualStyle(brandId: string): BrandVisualStyle | null {
    return this.db
      .query<BrandVisualStyle, [string]>(
        'SELECT * FROM brand_visual_style WHERE brand_id = ?'
      )
      .get(brandId) || null;
  }

  deleteVisualStyle(brandId: string): boolean {
    const result = this.db.run('DELETE FROM brand_visual_style WHERE brand_id = ?', [brandId]);
    return result.changes > 0;
  }

  // ============================================================================
  // GENERATED IMAGES OPERATIONS
  // ============================================================================

  createGeneratedImage(
    brandId: string,
    prompt: string,
    provider: ImageProvider,
    options: {
      copyId?: string;
      sessionId?: string;
      negativePrompt?: string;
      aspectRatio?: string;
      width?: number;
      height?: number;
      seed?: number;
      stylePreset?: string;
    } = {}
  ): GeneratedImage {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO generated_images
        (id, brand_id, copy_id, session_id, provider, prompt, negative_prompt,
         aspect_ratio, width, height, seed, style_preset, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        brandId,
        options.copyId || null,
        options.sessionId || null,
        provider,
        prompt,
        options.negativePrompt || null,
        options.aspectRatio || '1:1',
        options.width || null,
        options.height || null,
        options.seed || null,
        options.stylePreset || null,
        'pending',
        now,
      ]
    );

    return {
      id,
      brand_id: brandId,
      copy_id: options.copyId,
      session_id: options.sessionId,
      provider,
      prompt,
      negative_prompt: options.negativePrompt,
      aspect_ratio: options.aspectRatio || '1:1',
      width: options.width,
      height: options.height,
      seed: options.seed,
      style_preset: options.stylePreset,
      status: 'pending',
      is_favorite: 0,
      created_at: now,
    };
  }

  updateGeneratedImage(
    imageId: string,
    updates: {
      status?: MediaStatus;
      imageUrl?: string;
      thumbnailUrl?: string;
      localPath?: string;
      fileSizeBytes?: number;
      generationTimeMs?: number;
      costCents?: number;
      errorMessage?: string;
      rating?: number;
      isFavorite?: boolean;
      width?: number;
      height?: number;
      seed?: number;
    }
  ): boolean {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.imageUrl !== undefined) {
      fields.push('image_url = ?');
      values.push(updates.imageUrl);
    }
    if (updates.thumbnailUrl !== undefined) {
      fields.push('thumbnail_url = ?');
      values.push(updates.thumbnailUrl);
    }
    if (updates.localPath !== undefined) {
      fields.push('local_path = ?');
      values.push(updates.localPath);
    }
    if (updates.fileSizeBytes !== undefined) {
      fields.push('file_size_bytes = ?');
      values.push(updates.fileSizeBytes);
    }
    if (updates.generationTimeMs !== undefined) {
      fields.push('generation_time_ms = ?');
      values.push(updates.generationTimeMs);
    }
    if (updates.costCents !== undefined) {
      fields.push('cost_cents = ?');
      values.push(updates.costCents);
    }
    if (updates.errorMessage !== undefined) {
      fields.push('error_message = ?');
      values.push(updates.errorMessage);
    }
    if (updates.rating !== undefined) {
      fields.push('rating = ?');
      values.push(updates.rating);
    }
    if (updates.isFavorite !== undefined) {
      fields.push('is_favorite = ?');
      values.push(updates.isFavorite ? 1 : 0);
    }
    if (updates.width !== undefined) {
      fields.push('width = ?');
      values.push(updates.width);
    }
    if (updates.height !== undefined) {
      fields.push('height = ?');
      values.push(updates.height);
    }
    if (updates.seed !== undefined) {
      fields.push('seed = ?');
      values.push(updates.seed);
    }

    if (fields.length === 0) return false;

    values.push(imageId);
    const result = this.db.run(
      `UPDATE generated_images SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.changes > 0;
  }

  getGeneratedImage(imageId: string): GeneratedImage | null {
    return this.db
      .query<GeneratedImage, [string]>(
        'SELECT * FROM generated_images WHERE id = ?'
      )
      .get(imageId) || null;
  }

  getImagesByBrand(brandId: string, status?: MediaStatus): GeneratedImage[] {
    if (status) {
      return this.db
        .query<GeneratedImage, [string, string]>(
          'SELECT * FROM generated_images WHERE brand_id = ? AND status = ? ORDER BY created_at DESC'
        )
        .all(brandId, status);
    }
    return this.db
      .query<GeneratedImage, [string]>(
        'SELECT * FROM generated_images WHERE brand_id = ? ORDER BY created_at DESC'
      )
      .all(brandId);
  }

  getImagesByCopy(copyId: string): GeneratedImage[] {
    return this.db
      .query<GeneratedImage, [string]>(
        'SELECT * FROM generated_images WHERE copy_id = ? ORDER BY created_at DESC'
      )
      .all(copyId);
  }

  getFavoriteImages(brandId: string): GeneratedImage[] {
    return this.db
      .query<GeneratedImage, [string]>(
        'SELECT * FROM generated_images WHERE brand_id = ? AND is_favorite = 1 ORDER BY created_at DESC'
      )
      .all(brandId);
  }

  deleteGeneratedImage(imageId: string): boolean {
    const result = this.db.run('DELETE FROM generated_images WHERE id = ?', [imageId]);
    return result.changes > 0;
  }

  // ============================================================================
  // GENERATED VIDEOS OPERATIONS
  // ============================================================================

  createGeneratedVideo(
    brandId: string,
    prompt: string,
    provider: VideoProvider,
    options: {
      copyId?: string;
      imageId?: string;
      sessionId?: string;
      negativePrompt?: string;
      aspectRatio?: string;
      duration?: number;
      resolution?: string;
      startImageUrl?: string;
      endImageUrl?: string;
      audioEnabled?: boolean;
    } = {}
  ): GeneratedVideo {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO generated_videos
        (id, brand_id, copy_id, image_id, session_id, provider, prompt, negative_prompt,
         aspect_ratio, duration, resolution, start_image_url, end_image_url, audio_enabled,
         status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        brandId,
        options.copyId || null,
        options.imageId || null,
        options.sessionId || null,
        provider,
        prompt,
        options.negativePrompt || null,
        options.aspectRatio || '16:9',
        options.duration || null,
        options.resolution || null,
        options.startImageUrl || null,
        options.endImageUrl || null,
        options.audioEnabled ? 1 : 0,
        'pending',
        now,
      ]
    );

    return {
      id,
      brand_id: brandId,
      copy_id: options.copyId,
      image_id: options.imageId,
      session_id: options.sessionId,
      provider,
      prompt,
      negative_prompt: options.negativePrompt,
      aspect_ratio: options.aspectRatio || '16:9',
      duration: options.duration,
      resolution: options.resolution,
      start_image_url: options.startImageUrl,
      end_image_url: options.endImageUrl,
      audio_enabled: options.audioEnabled ? 1 : 0,
      status: 'pending',
      created_at: now,
    };
  }

  updateGeneratedVideo(
    videoId: string,
    updates: {
      status?: MediaStatus;
      videoUrl?: string;
      thumbnailUrl?: string;
      localPath?: string;
      fileSizeBytes?: number;
      generationTimeMs?: number;
      costCents?: number;
      errorMessage?: string;
      duration?: number;
    }
  ): boolean {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.videoUrl !== undefined) {
      fields.push('video_url = ?');
      values.push(updates.videoUrl);
    }
    if (updates.thumbnailUrl !== undefined) {
      fields.push('thumbnail_url = ?');
      values.push(updates.thumbnailUrl);
    }
    if (updates.localPath !== undefined) {
      fields.push('local_path = ?');
      values.push(updates.localPath);
    }
    if (updates.fileSizeBytes !== undefined) {
      fields.push('file_size_bytes = ?');
      values.push(updates.fileSizeBytes);
    }
    if (updates.generationTimeMs !== undefined) {
      fields.push('generation_time_ms = ?');
      values.push(updates.generationTimeMs);
    }
    if (updates.costCents !== undefined) {
      fields.push('cost_cents = ?');
      values.push(updates.costCents);
    }
    if (updates.errorMessage !== undefined) {
      fields.push('error_message = ?');
      values.push(updates.errorMessage);
    }
    if (updates.duration !== undefined) {
      fields.push('duration = ?');
      values.push(updates.duration);
    }

    if (fields.length === 0) return false;

    values.push(videoId);
    const result = this.db.run(
      `UPDATE generated_videos SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.changes > 0;
  }

  getGeneratedVideo(videoId: string): GeneratedVideo | null {
    return this.db
      .query<GeneratedVideo, [string]>(
        'SELECT * FROM generated_videos WHERE id = ?'
      )
      .get(videoId) || null;
  }

  getVideosByBrand(brandId: string, status?: MediaStatus): GeneratedVideo[] {
    if (status) {
      return this.db
        .query<GeneratedVideo, [string, string]>(
          'SELECT * FROM generated_videos WHERE brand_id = ? AND status = ? ORDER BY created_at DESC'
        )
        .all(brandId, status);
    }
    return this.db
      .query<GeneratedVideo, [string]>(
        'SELECT * FROM generated_videos WHERE brand_id = ? ORDER BY created_at DESC'
      )
      .all(brandId);
  }

  deleteGeneratedVideo(videoId: string): boolean {
    const result = this.db.run('DELETE FROM generated_videos WHERE id = ?', [videoId]);
    return result.changes > 0;
  }

  // ============================================================================
  // BRAND ASSETS OPERATIONS
  // ============================================================================

  createBrandAsset(
    brandId: string,
    assetType: AssetType,
    name: string,
    options: {
      referenceImages?: string[];
      thumbnailUrl?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): BrandAsset {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO brand_assets
        (id, brand_id, asset_type, name, reference_images, thumbnail_url, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        brandId,
        assetType,
        name,
        JSON.stringify(options.referenceImages || []),
        options.thumbnailUrl || null,
        JSON.stringify(options.metadata || {}),
        now,
        now,
      ]
    );

    return {
      id,
      brand_id: brandId,
      asset_type: assetType,
      name,
      reference_images: JSON.stringify(options.referenceImages || []),
      thumbnail_url: options.thumbnailUrl,
      metadata: JSON.stringify(options.metadata || {}),
      created_at: now,
      updated_at: now,
    };
  }

  updateBrandAsset(
    assetId: string,
    updates: {
      name?: string;
      referenceImages?: string[];
      thumbnailUrl?: string;
      metadata?: Record<string, unknown>;
    }
  ): boolean {
    const now = new Date().toISOString();
    const fields: string[] = ['updated_at = ?'];
    const values: (string | null)[] = [now];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.referenceImages !== undefined) {
      fields.push('reference_images = ?');
      values.push(JSON.stringify(updates.referenceImages));
    }
    if (updates.thumbnailUrl !== undefined) {
      fields.push('thumbnail_url = ?');
      values.push(updates.thumbnailUrl);
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }

    values.push(assetId);
    const result = this.db.run(
      `UPDATE brand_assets SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.changes > 0;
  }

  getBrandAsset(assetId: string): BrandAsset | null {
    return this.db
      .query<BrandAsset, [string]>(
        'SELECT * FROM brand_assets WHERE id = ?'
      )
      .get(assetId) || null;
  }

  getAssetsByBrand(brandId: string, assetType?: AssetType): BrandAsset[] {
    if (assetType) {
      return this.db
        .query<BrandAsset, [string, string]>(
          'SELECT * FROM brand_assets WHERE brand_id = ? AND asset_type = ? ORDER BY created_at DESC'
        )
        .all(brandId, assetType);
    }
    return this.db
      .query<BrandAsset, [string]>(
        'SELECT * FROM brand_assets WHERE brand_id = ? ORDER BY created_at DESC'
      )
      .all(brandId);
  }

  deleteBrandAsset(assetId: string): boolean {
    const result = this.db.run('DELETE FROM brand_assets WHERE id = ?', [assetId]);
    return result.changes > 0;
  }

  // ============================================================================
  // EDITED VIDEOS OPERATIONS
  // ============================================================================

  createEditedVideo(
    brandId: string,
    sourceVideoIds: string[],
    pipelineConfig: Record<string, unknown>
  ): EditedVideo {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO edited_videos
        (id, brand_id, source_video_ids, pipeline_config, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        brandId,
        JSON.stringify(sourceVideoIds),
        JSON.stringify(pipelineConfig),
        'pending',
        now,
      ]
    );

    return {
      id,
      brand_id: brandId,
      source_video_ids: JSON.stringify(sourceVideoIds),
      pipeline_config: JSON.stringify(pipelineConfig),
      status: 'pending',
      has_logo_overlay: 0,
      has_subtitles: 0,
      has_background_music: 0,
      created_at: now,
    };
  }

  updateEditedVideo(
    editedVideoId: string,
    updates: {
      status?: MediaStatus;
      outputUrl?: string;
      localPath?: string;
      thumbnailUrl?: string;
      duration?: number;
      hasLogoOverlay?: boolean;
      hasSubtitles?: boolean;
      hasBackgroundMusic?: boolean;
      errorMessage?: string;
    }
  ): boolean {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.outputUrl !== undefined) {
      fields.push('output_url = ?');
      values.push(updates.outputUrl);
    }
    if (updates.localPath !== undefined) {
      fields.push('local_path = ?');
      values.push(updates.localPath);
    }
    if (updates.thumbnailUrl !== undefined) {
      fields.push('thumbnail_url = ?');
      values.push(updates.thumbnailUrl);
    }
    if (updates.duration !== undefined) {
      fields.push('duration = ?');
      values.push(updates.duration);
    }
    if (updates.hasLogoOverlay !== undefined) {
      fields.push('has_logo_overlay = ?');
      values.push(updates.hasLogoOverlay ? 1 : 0);
    }
    if (updates.hasSubtitles !== undefined) {
      fields.push('has_subtitles = ?');
      values.push(updates.hasSubtitles ? 1 : 0);
    }
    if (updates.hasBackgroundMusic !== undefined) {
      fields.push('has_background_music = ?');
      values.push(updates.hasBackgroundMusic ? 1 : 0);
    }
    if (updates.errorMessage !== undefined) {
      fields.push('error_message = ?');
      values.push(updates.errorMessage);
    }

    if (fields.length === 0) return false;

    values.push(editedVideoId);
    const result = this.db.run(
      `UPDATE edited_videos SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.changes > 0;
  }

  getEditedVideo(editedVideoId: string): EditedVideo | null {
    return this.db
      .query<EditedVideo, [string]>(
        'SELECT * FROM edited_videos WHERE id = ?'
      )
      .get(editedVideoId) || null;
  }

  getEditedVideosByBrand(brandId: string): EditedVideo[] {
    return this.db
      .query<EditedVideo, [string]>(
        'SELECT * FROM edited_videos WHERE brand_id = ? ORDER BY created_at DESC'
      )
      .all(brandId);
  }

  deleteEditedVideo(editedVideoId: string): boolean {
    const result = this.db.run('DELETE FROM edited_videos WHERE id = ?', [editedVideoId]);
    return result.changes > 0;
  }

  // ============================================================================
  // CONTENT HUB OPERATIONS (Cross-Mode Linking)
  // ============================================================================

  createContentLink(
    sourceType: ContentHubItemType,
    sourceId: string,
    targetType: ContentHubItemType,
    targetId: string,
    linkType: ContentLinkType
  ): ContentLink {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO content_links
        (id, source_type, source_id, target_type, target_id, link_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, sourceType, sourceId, targetType, targetId, linkType, now]
    );

    return {
      id,
      source_type: sourceType,
      source_id: sourceId,
      target_type: targetType,
      target_id: targetId,
      link_type: linkType,
      created_at: now,
    };
  }

  getLinkedContent(type: ContentHubItemType, id: string): ContentLink[] {
    // Get links where this item is either source or target
    const asSource = this.db
      .query<ContentLink, [string, string]>(
        'SELECT * FROM content_links WHERE source_type = ? AND source_id = ? ORDER BY created_at DESC'
      )
      .all(type, id);

    const asTarget = this.db
      .query<ContentLink, [string, string]>(
        'SELECT * FROM content_links WHERE target_type = ? AND target_id = ? ORDER BY created_at DESC'
      )
      .all(type, id);

    return [...asSource, ...asTarget];
  }

  deleteContentLink(linkId: string): boolean {
    const result = this.db.run('DELETE FROM content_links WHERE id = ?', [linkId]);
    return result.changes > 0;
  }

  // ============================================================================
  // COPY SECTIONS OPERATIONS (for copy-centric image generation)
  // ============================================================================

  createCopySection(
    section: Omit<CopySection, 'id' | 'created_at'>
  ): CopySection {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO copy_sections
        (id, copy_id, section_type, section_index, content, suggested_visual_concept, image_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        section.copy_id,
        section.section_type,
        section.section_index,
        section.content,
        section.suggested_visual_concept || null,
        section.image_id || null,
        now,
      ]
    );

    return {
      id,
      copy_id: section.copy_id,
      section_type: section.section_type,
      section_index: section.section_index,
      content: section.content,
      suggested_visual_concept: section.suggested_visual_concept || null,
      image_id: section.image_id || null,
      created_at: now,
    };
  }

  getCopySections(copyId: string): CopySection[] {
    return this.db
      .query<CopySection, [string]>(
        'SELECT * FROM copy_sections WHERE copy_id = ? ORDER BY section_index ASC'
      )
      .all(copyId);
  }

  getCopySection(sectionId: string): CopySection | null {
    return this.db
      .query<CopySection, [string]>(
        'SELECT * FROM copy_sections WHERE id = ?'
      )
      .get(sectionId) || null;
  }

  updateCopySectionImage(sectionId: string, imageId: string | null): boolean {
    const result = this.db.run(
      'UPDATE copy_sections SET image_id = ? WHERE id = ?',
      [imageId, sectionId]
    );
    return result.changes > 0;
  }

  updateCopySectionVisualConcept(sectionId: string, concept: string): boolean {
    const result = this.db.run(
      'UPDATE copy_sections SET suggested_visual_concept = ? WHERE id = ?',
      [concept, sectionId]
    );
    return result.changes > 0;
  }

  deleteCopySections(copyId: string): boolean {
    const result = this.db.run('DELETE FROM copy_sections WHERE copy_id = ?', [copyId]);
    return result.changes > 0;
  }

  deleteCopySection(sectionId: string): boolean {
    const result = this.db.run('DELETE FROM copy_sections WHERE id = ?', [sectionId]);
    return result.changes > 0;
  }

  /**
   * Get copies with their sections and linked images for a brand
   */
  getCopiesWithMedia(brandId: string): Array<GeneratedCopy & { sections: CopySection[]; images: GeneratedImage[] }> {
    const copies = this.listGeneratedCopy(brandId);

    return copies.map(copy => {
      const sections = this.getCopySections(copy.id);
      const images = this.getImagesByCopy(copy.id);

      // Also get images linked through sections
      const sectionImageIds = sections
        .filter(s => s.image_id)
        .map(s => s.image_id as string);

      const sectionImages = sectionImageIds
        .map(id => this.getGeneratedImage(id))
        .filter((img): img is GeneratedImage => img !== null);

      // Merge and deduplicate images
      const allImages = [...images];
      for (const img of sectionImages) {
        if (!allImages.find(i => i.id === img.id)) {
          allImages.push(img);
        }
      }

      return {
        ...copy,
        sections,
        images: allImages,
      };
    });
  }

  /**
   * Get all content for a brand with links (unified content hub view)
   */
  getContentByBrandWithLinks(brandId: string): UnifiedContentItem[] {
    const items: UnifiedContentItem[] = [];

    // Get all copy
    const copies = this.listGeneratedCopy(brandId);
    for (const copy of copies) {
      const links = this.getLinkedContent('copy', copy.id);
      items.push({
        id: copy.id,
        type: 'copy',
        brand_id: copy.brand_id,
        content_preview: copy.copy_text.slice(0, 200),
        platform: copy.platform,
        status: copy.status,
        created_at: copy.created_at,
        linked_items: links,
      });
    }

    // Get all images
    const images = this.getImagesByBrand(brandId);
    for (const image of images) {
      const links = this.getLinkedContent('image', image.id);
      items.push({
        id: image.id,
        type: 'image',
        brand_id: image.brand_id,
        content_preview: image.prompt.slice(0, 200),
        thumbnail_url: image.thumbnail_url || image.image_url,
        status: image.status,
        created_at: image.created_at,
        linked_items: links,
      });
    }

    // Get all videos
    const videos = this.getVideosByBrand(brandId);
    for (const video of videos) {
      const links = this.getLinkedContent('video', video.id);
      items.push({
        id: video.id,
        type: 'video',
        brand_id: video.brand_id,
        content_preview: video.prompt.slice(0, 200),
        thumbnail_url: video.thumbnail_url,
        status: video.status,
        created_at: video.created_at,
        linked_items: links,
      });
    }

    // Sort by created_at descending
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return items;
  }

  /**
   * Get timeline of all content for a brand (chronological feed)
   */
  getContentTimeline(brandId: string, limit = 50, offset = 0): UnifiedContentItem[] {
    const allContent = this.getContentByBrandWithLinks(brandId);
    return allContent.slice(offset, offset + limit);
  }

  // ============================================================================
  // POST TYPE TEMPLATES OPERATIONS
  // ============================================================================

  /**
   * Get all templates (global + brand-specific)
   */
  getTemplates(brandId?: string): PostTypeTemplate[] {
    if (brandId) {
      // Get global templates (brand_id IS NULL) + brand-specific templates
      return this.db
        .query<PostTypeTemplate, [string]>(
          `SELECT * FROM post_type_templates
           WHERE brand_id IS NULL OR brand_id = ?
           ORDER BY is_system DESC, name ASC`
        )
        .all(brandId);
    }
    // Get only global templates
    return this.db
      .query<PostTypeTemplate, []>(
        'SELECT * FROM post_type_templates WHERE brand_id IS NULL ORDER BY name ASC'
      )
      .all();
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: TemplateCategory, brandId?: string): PostTypeTemplate[] {
    if (brandId) {
      return this.db
        .query<PostTypeTemplate, [string, string]>(
          `SELECT * FROM post_type_templates
           WHERE category = ? AND (brand_id IS NULL OR brand_id = ?)
           ORDER BY is_system DESC, name ASC`
        )
        .all(category, brandId);
    }
    return this.db
      .query<PostTypeTemplate, [string]>(
        'SELECT * FROM post_type_templates WHERE category = ? AND brand_id IS NULL ORDER BY name ASC'
      )
      .all(category);
  }

  /**
   * Get a single template by ID
   */
  getTemplate(templateId: string): PostTypeTemplate | null {
    return this.db
      .query<PostTypeTemplate, [string]>('SELECT * FROM post_type_templates WHERE id = ?')
      .get(templateId) || null;
  }

  /**
   * Create a brand-specific template
   */
  createTemplate(
    brandId: string,
    name: string,
    category: TemplateCategory,
    structure: TemplateStructure,
    options: {
      description?: string;
      platforms?: string[];
      exampleOutput?: string;
      variables?: string[];
    } = {}
  ): PostTypeTemplate {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO post_type_templates
        (id, brand_id, name, description, category, platforms, structure, example_output, variables, is_system, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        brandId,
        name,
        options.description || null,
        category,
        JSON.stringify(options.platforms || []),
        JSON.stringify(structure),
        options.exampleOutput || null,
        JSON.stringify(options.variables || []),
        0, // Not a system template
        now,
      ]
    );

    return {
      id,
      brand_id: brandId,
      name,
      description: options.description,
      category,
      platforms: JSON.stringify(options.platforms || []),
      structure: JSON.stringify(structure),
      example_output: options.exampleOutput,
      variables: JSON.stringify(options.variables || []),
      is_system: 0,
      created_at: now,
    };
  }

  /**
   * Update a template (only non-system templates can be updated)
   */
  updateTemplate(
    templateId: string,
    updates: {
      name?: string;
      description?: string;
      category?: TemplateCategory;
      platforms?: string[];
      structure?: TemplateStructure;
      exampleOutput?: string;
      variables?: string[];
    }
  ): boolean {
    const template = this.getTemplate(templateId);
    if (!template || template.is_system === 1) {
      return false; // Can't update system templates
    }

    const fields: string[] = [];
    const values: (string | null)[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.platforms !== undefined) {
      fields.push('platforms = ?');
      values.push(JSON.stringify(updates.platforms));
    }
    if (updates.structure !== undefined) {
      fields.push('structure = ?');
      values.push(JSON.stringify(updates.structure));
    }
    if (updates.exampleOutput !== undefined) {
      fields.push('example_output = ?');
      values.push(updates.exampleOutput);
    }
    if (updates.variables !== undefined) {
      fields.push('variables = ?');
      values.push(JSON.stringify(updates.variables));
    }

    if (fields.length === 0) return false;

    values.push(templateId);
    const result = this.db.run(
      `UPDATE post_type_templates SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.changes > 0;
  }

  /**
   * Delete a template (only non-system templates can be deleted)
   */
  deleteTemplate(templateId: string): boolean {
    const template = this.getTemplate(templateId);
    if (!template || template.is_system === 1) {
      return false; // Can't delete system templates
    }

    const result = this.db.run('DELETE FROM post_type_templates WHERE id = ?', [templateId]);
    return result.changes > 0;
  }

  // ============================================================================
  // BRAND TONE PRESETS OPERATIONS
  // ============================================================================

  /**
   * Get all tone presets for a brand
   */
  getTonePresets(brandId: string): BrandTonePreset[] {
    return this.db
      .query<BrandTonePreset, [string]>(
        'SELECT * FROM brand_tone_presets WHERE brand_id = ? ORDER BY is_default DESC, name ASC'
      )
      .all(brandId);
  }

  /**
   * Get a single tone preset by ID
   */
  getTonePreset(presetId: string): BrandTonePreset | null {
    return this.db
      .query<BrandTonePreset, [string]>('SELECT * FROM brand_tone_presets WHERE id = ?')
      .get(presetId) || null;
  }

  /**
   * Get the default tone preset for a brand
   */
  getDefaultTonePreset(brandId: string): BrandTonePreset | null {
    return this.db
      .query<BrandTonePreset, [string]>(
        'SELECT * FROM brand_tone_presets WHERE brand_id = ? AND is_default = 1 LIMIT 1'
      )
      .get(brandId) || null;
  }

  /**
   * Create a tone preset for a brand
   */
  createTonePreset(
    brandId: string,
    name: string,
    toneAdjustments: ToneAdjustments,
    options: {
      description?: string;
      useCases?: string[];
      examplePhrases?: string[];
      isDefault?: boolean;
    } = {}
  ): BrandTonePreset {
    const id = randomUUID();
    const now = new Date().toISOString();

    // If this preset is default, unset any existing default
    if (options.isDefault) {
      this.db.run(
        'UPDATE brand_tone_presets SET is_default = 0 WHERE brand_id = ?',
        [brandId]
      );
    }

    this.db.run(
      `INSERT INTO brand_tone_presets
        (id, brand_id, name, description, tone_adjustments, use_cases, example_phrases, is_default, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        brandId,
        name,
        options.description || null,
        JSON.stringify(toneAdjustments),
        JSON.stringify(options.useCases || []),
        JSON.stringify(options.examplePhrases || []),
        options.isDefault ? 1 : 0,
        now,
      ]
    );

    return {
      id,
      brand_id: brandId,
      name,
      description: options.description,
      tone_adjustments: JSON.stringify(toneAdjustments),
      use_cases: JSON.stringify(options.useCases || []),
      example_phrases: JSON.stringify(options.examplePhrases || []),
      is_default: options.isDefault ? 1 : 0,
      created_at: now,
    };
  }

  /**
   * Update a tone preset
   */
  updateTonePreset(
    presetId: string,
    updates: {
      name?: string;
      description?: string;
      toneAdjustments?: ToneAdjustments;
      useCases?: string[];
      examplePhrases?: string[];
      isDefault?: boolean;
    }
  ): boolean {
    const preset = this.getTonePreset(presetId);
    if (!preset) return false;

    // If setting as default, unset existing defaults for this brand
    if (updates.isDefault) {
      this.db.run(
        'UPDATE brand_tone_presets SET is_default = 0 WHERE brand_id = ?',
        [preset.brand_id]
      );
    }

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.toneAdjustments !== undefined) {
      fields.push('tone_adjustments = ?');
      values.push(JSON.stringify(updates.toneAdjustments));
    }
    if (updates.useCases !== undefined) {
      fields.push('use_cases = ?');
      values.push(JSON.stringify(updates.useCases));
    }
    if (updates.examplePhrases !== undefined) {
      fields.push('example_phrases = ?');
      values.push(JSON.stringify(updates.examplePhrases));
    }
    if (updates.isDefault !== undefined) {
      fields.push('is_default = ?');
      values.push(updates.isDefault ? 1 : 0);
    }

    if (fields.length === 0) return false;

    values.push(presetId);
    const result = this.db.run(
      `UPDATE brand_tone_presets SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.changes > 0;
  }

  /**
   * Delete a tone preset
   */
  deleteTonePreset(presetId: string): boolean {
    const result = this.db.run('DELETE FROM brand_tone_presets WHERE id = ?', [presetId]);
    return result.changes > 0;
  }

  /**
   * Auto-generate default tone presets for a brand
   * Called after brand voice analysis completes
   */
  createDefaultTonePresets(brandId: string): BrandTonePreset[] {
    const presets: Array<{
      name: string;
      description: string;
      adjustments: ToneAdjustments;
      useCases: string[];
    }> = [
      {
        name: 'Formal Announcement',
        description: 'Professional, authoritative tone for official communications',
        adjustments: { formality: '+20', authority: '+15', humor: '-20', warmth: '-10' },
        useCases: ['press releases', 'investor updates', 'policy announcements'],
      },
      {
        name: 'Casual Update',
        description: 'Relaxed, friendly tone for everyday content',
        adjustments: { formality: '-15', warmth: '+15', humor: '+10', energy: '+10' },
        useCases: ['social updates', 'team news', 'behind-the-scenes'],
      },
      {
        name: 'Thought Leadership',
        description: 'Authoritative, insightful tone for expert content',
        adjustments: { authority: '+20', formality: '+10', energy: '+10' },
        useCases: ['industry commentary', 'opinion pieces', 'trend analysis'],
      },
      {
        name: 'Community Engagement',
        description: 'Warm, inviting tone for building relationships',
        adjustments: { warmth: '+20', formality: '-20', humor: '+5' },
        useCases: ['community posts', 'user spotlights', 'thank you messages'],
      },
      {
        name: 'Crisis Communication',
        description: 'Measured, responsible tone for sensitive situations',
        adjustments: { formality: '+25', authority: '+20', energy: '-15', humor: '-30' },
        useCases: ['incident responses', 'apologies', 'sensitive updates'],
      },
    ];

    const created: BrandTonePreset[] = [];
    for (const preset of presets) {
      const result = this.createTonePreset(brandId, preset.name, preset.adjustments, {
        description: preset.description,
        useCases: preset.useCases,
        isDefault: preset.name === 'Casual Update', // Default to casual
      });
      created.push(result);
    }

    return created;
  }

  // ============================================================================
  // BRAND CONTENT FORMATS OPERATIONS
  // ============================================================================

  /**
   * Get all content formats for a brand (enabled and disabled)
   */
  getBrandFormats(brandId: string): BrandContentFormat[] {
    return this.db
      .query<BrandContentFormat, [string]>(
        'SELECT * FROM brand_content_formats WHERE brand_id = ? ORDER BY display_order ASC, created_at ASC'
      )
      .all(brandId);
  }

  /**
   * Get only enabled content formats for a brand
   */
  getEnabledBrandFormats(brandId: string): BrandContentFormat[] {
    return this.db
      .query<BrandContentFormat, [string]>(
        'SELECT * FROM brand_content_formats WHERE brand_id = ? AND is_enabled = 1 ORDER BY display_order ASC, created_at ASC'
      )
      .all(brandId);
  }

  /**
   * Get a single content format by ID
   */
  getBrandFormat(formatId: string): BrandContentFormat | null {
    return this.db
      .query<BrandContentFormat, [string]>('SELECT * FROM brand_content_formats WHERE id = ?')
      .get(formatId) || null;
  }

  /**
   * Get the default content format for a brand
   */
  getDefaultBrandFormat(brandId: string): BrandContentFormat | null {
    return this.db
      .query<BrandContentFormat, [string]>(
        'SELECT * FROM brand_content_formats WHERE brand_id = ? AND is_default = 1 LIMIT 1'
      )
      .get(brandId) || null;
  }

  /**
   * Create a content format for a brand
   */
  createBrandFormat(
    brandId: string,
    formatType: string,
    options: {
      customLabel?: string;
      description?: string;
      icon?: string;
      colorScheme?: BrandContentFormatColorScheme;
      isEnabled?: boolean;
      isDefault?: boolean;
      displayOrder?: number;
      lengthConstraints?: BrandContentFormatLengthConstraints;
      structureHints?: BrandContentFormatStructureHints;
      formatRules?: BrandContentFormatRules;
      toneAdjustments?: BrandContentFormatToneAdjustments;
    } = {}
  ): BrandContentFormat {
    const id = randomUUID();
    const now = new Date().toISOString();

    // If this format is default, unset any existing default
    if (options.isDefault) {
      this.db.run(
        'UPDATE brand_content_formats SET is_default = 0 WHERE brand_id = ?',
        [brandId]
      );
    }

    // Get max display order if not provided
    let displayOrder = options.displayOrder;
    if (displayOrder === undefined) {
      const maxOrder = this.db
        .query<{ max_order: number | null }, [string]>(
          'SELECT MAX(display_order) as max_order FROM brand_content_formats WHERE brand_id = ?'
        )
        .get(brandId);
      displayOrder = (maxOrder?.max_order ?? -1) + 1;
    }

    this.db.run(
      `INSERT INTO brand_content_formats
        (id, brand_id, format_type, custom_label, description, icon, color_scheme,
         is_enabled, is_default, display_order, length_constraints, structure_hints,
         format_rules, tone_adjustments, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        brandId,
        formatType,
        options.customLabel || null,
        options.description || null,
        options.icon || null,
        options.colorScheme ? JSON.stringify(options.colorScheme) : null,
        options.isEnabled !== false ? 1 : 0,
        options.isDefault ? 1 : 0,
        displayOrder,
        options.lengthConstraints ? JSON.stringify(options.lengthConstraints) : null,
        options.structureHints ? JSON.stringify(options.structureHints) : null,
        options.formatRules ? JSON.stringify(options.formatRules) : null,
        options.toneAdjustments ? JSON.stringify(options.toneAdjustments) : null,
        now,
        now,
      ]
    );

    return {
      id,
      brand_id: brandId,
      format_type: formatType,
      custom_label: options.customLabel,
      description: options.description,
      icon: options.icon,
      color_scheme: options.colorScheme ? JSON.stringify(options.colorScheme) : undefined,
      is_enabled: options.isEnabled !== false ? 1 : 0,
      is_default: options.isDefault ? 1 : 0,
      display_order: displayOrder,
      length_constraints: options.lengthConstraints ? JSON.stringify(options.lengthConstraints) : undefined,
      structure_hints: options.structureHints ? JSON.stringify(options.structureHints) : undefined,
      format_rules: options.formatRules ? JSON.stringify(options.formatRules) : undefined,
      tone_adjustments: options.toneAdjustments ? JSON.stringify(options.toneAdjustments) : undefined,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Update a content format
   */
  updateBrandFormat(
    formatId: string,
    updates: {
      customLabel?: string;
      description?: string;
      icon?: string;
      colorScheme?: BrandContentFormatColorScheme;
      isEnabled?: boolean;
      isDefault?: boolean;
      displayOrder?: number;
      lengthConstraints?: BrandContentFormatLengthConstraints;
      structureHints?: BrandContentFormatStructureHints;
      formatRules?: BrandContentFormatRules;
      toneAdjustments?: BrandContentFormatToneAdjustments;
    }
  ): boolean {
    const format = this.getBrandFormat(formatId);
    if (!format) return false;

    // If setting as default, unset existing defaults for this brand
    if (updates.isDefault) {
      this.db.run(
        'UPDATE brand_content_formats SET is_default = 0 WHERE brand_id = ?',
        [format.brand_id]
      );
    }

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.customLabel !== undefined) {
      fields.push('custom_label = ?');
      values.push(updates.customLabel);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.icon !== undefined) {
      fields.push('icon = ?');
      values.push(updates.icon);
    }
    if (updates.colorScheme !== undefined) {
      fields.push('color_scheme = ?');
      values.push(JSON.stringify(updates.colorScheme));
    }
    if (updates.isEnabled !== undefined) {
      fields.push('is_enabled = ?');
      values.push(updates.isEnabled ? 1 : 0);
    }
    if (updates.isDefault !== undefined) {
      fields.push('is_default = ?');
      values.push(updates.isDefault ? 1 : 0);
    }
    if (updates.displayOrder !== undefined) {
      fields.push('display_order = ?');
      values.push(updates.displayOrder);
    }
    if (updates.lengthConstraints !== undefined) {
      fields.push('length_constraints = ?');
      values.push(JSON.stringify(updates.lengthConstraints));
    }
    if (updates.structureHints !== undefined) {
      fields.push('structure_hints = ?');
      values.push(JSON.stringify(updates.structureHints));
    }
    if (updates.formatRules !== undefined) {
      fields.push('format_rules = ?');
      values.push(JSON.stringify(updates.formatRules));
    }
    if (updates.toneAdjustments !== undefined) {
      fields.push('tone_adjustments = ?');
      values.push(JSON.stringify(updates.toneAdjustments));
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(formatId);

    const result = this.db.run(
      `UPDATE brand_content_formats SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.changes > 0;
  }

  /**
   * Delete a content format
   */
  deleteBrandFormat(formatId: string): boolean {
    const result = this.db.run('DELETE FROM brand_content_formats WHERE id = ?', [formatId]);
    return result.changes > 0;
  }

  /**
   * Toggle format enabled/disabled
   */
  toggleFormatEnabled(formatId: string, enabled: boolean): boolean {
    const result = this.db.run(
      'UPDATE brand_content_formats SET is_enabled = ?, updated_at = ? WHERE id = ?',
      [enabled ? 1 : 0, new Date().toISOString(), formatId]
    );
    return result.changes > 0;
  }

  /**
   * Set a format as the default for its brand (clears other defaults)
   */
  setDefaultFormat(formatId: string): boolean {
    const format = this.getBrandFormat(formatId);
    if (!format) return false;

    // Clear all defaults for this brand
    this.db.run(
      'UPDATE brand_content_formats SET is_default = 0 WHERE brand_id = ?',
      [format.brand_id]
    );

    // Set this one as default
    const result = this.db.run(
      'UPDATE brand_content_formats SET is_default = 1, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), formatId]
    );

    return result.changes > 0;
  }

  /**
   * Initialize default content formats for a brand
   * Creates LinkedIn Post, Newsletter, and Website Article formats
   */
  initializeDefaultFormats(brandId: string): BrandContentFormat[] {
    const defaultFormats: Array<{
      formatType: string;
      customLabel: string;
      description: string;
      icon: string;
      colorScheme: BrandContentFormatColorScheme;
      lengthConstraints: BrandContentFormatLengthConstraints;
      isDefault?: boolean;
      formatRules?: BrandContentFormatRules;
      toneAdjustments?: BrandContentFormatToneAdjustments;
      structureHints?: BrandContentFormatStructureHints;
    }> = [
      {
        formatType: 'linkedin_post',
        customLabel: 'LinkedIn Post',
        description: 'Thought leadership content voor B2B professionals. Focus op expertise tonen, waardevolle inzichten delen, en gesprekken starten. Hook in eerste regel is cruciaal - LinkedIn kapt af na 3 regels.',
        icon: 'linkedin',
        colorScheme: { color: '#0A66C2', bgColor: 'rgba(10,102,194,0.1)', borderColor: 'rgba(10,102,194,0.3)' },
        lengthConstraints: { min: 500, max: 1500, optimal: 1000, unit: 'chars' },
        formatRules: {
          preferEmojis: true,
          avoidHashtags: false,
          customInstructions: [
            'Start met pakkende eerste zin (hook) - dit is wat mensen zien vóór "meer weergeven"',
            'Gebruik witregels tussen alineas voor scanbare layout',
            'Sluit af met call-to-action of vraag om engagement',
            'Max 3-5 relevante hashtags aan het einde',
            'Persoonlijke verhalen en concrete voorbeelden werken goed',
          ],
        },
        toneAdjustments: { formality: 0.6, authority: 0.8, warmth: 0.5 },
        isDefault: true,
      },
      {
        formatType: 'newsletter',
        customLabel: 'Nieuwsbrief',
        description: 'Persoonlijke email die voelt als bericht van een vertrouwde collega. Directe aanspreking, scanbare structuur met duidelijke koppen, en één duidelijke call-to-action per mail.',
        icon: 'mail',
        colorScheme: { color: '#F59E0B', bgColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' },
        lengthConstraints: { min: 300, max: 800, optimal: 500, unit: 'words' },
        formatRules: {
          preferEmojis: false,
          avoidHashtags: true,
          customInstructions: [
            'Persoonlijke aanspreking in onderwerpregel en intro',
            'Duidelijke koppen om te scannen',
            'Eén primaire CTA, optioneel secundaire links',
            'P.S. sectie voor extra boodschap of persoonlijke noot',
            'Vermijd te formeel taalgebruik - schrijf zoals je praat',
          ],
        },
        toneAdjustments: { formality: 0.4, authority: 0.6, warmth: 0.8 },
        structureHints: {
          sections: [
            { name: 'intro', prompt: 'Persoonlijke opening die context geeft' },
            { name: 'main', prompt: 'Kernboodschap met concrete waarde' },
            { name: 'cta', prompt: 'Duidelijke volgende stap' },
            { name: 'ps', prompt: 'Optioneel: persoonlijke noot of bonus tip' },
          ],
        },
      },
      {
        formatType: 'article',
        customLabel: 'Website Artikel',
        description: 'Diepgaande content voor SEO en thought leadership. Gestructureerd met H2/H3 koppen, praktische voorbeelden, en actionable takeaways. Geschikt voor blog, kennisbank of resource center.',
        icon: 'file-text',
        colorScheme: { color: '#10B981', bgColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' },
        lengthConstraints: { min: 800, max: 2000, optimal: 1200, unit: 'words' },
        formatRules: {
          preferEmojis: false,
          avoidHashtags: true,
          customInstructions: [
            'Start met sterke intro die het probleem/vraag adresseert',
            'Gebruik H2 voor hoofdsecties, H3 voor subsecties',
            'Voeg bullet points toe voor opsommingen en stappenplannen',
            'Include concrete voorbeelden en case studies waar mogelijk',
            'Sluit af met samenvatting of actionable takeaways',
            'Optimaliseer voor featured snippets met directe antwoorden',
          ],
        },
        toneAdjustments: { formality: 0.7, authority: 0.9, warmth: 0.4 },
        structureHints: {
          framework: 'problem-agitate-solve',
          sections: [
            { name: 'intro', prompt: 'Hook + probleemstelling + wat lezer gaat leren' },
            { name: 'context', prompt: 'Waarom dit belangrijk is, achtergrond' },
            { name: 'main', prompt: 'Kerninhoud met praktische uitleg' },
            { name: 'examples', prompt: 'Concrete voorbeelden of case studies' },
            { name: 'conclusion', prompt: 'Samenvatting en volgende stappen' },
          ],
        },
      },
    ];

    const created: BrandContentFormat[] = [];
    for (let i = 0; i < defaultFormats.length; i++) {
      const format = defaultFormats[i];
      const result = this.createBrandFormat(brandId, format.formatType, {
        customLabel: format.customLabel,
        description: format.description,
        icon: format.icon,
        colorScheme: format.colorScheme,
        lengthConstraints: format.lengthConstraints,
        formatRules: format.formatRules,
        toneAdjustments: format.toneAdjustments,
        structureHints: format.structureHints,
        isDefault: format.isDefault,
        displayOrder: i,
      });
      created.push(result);
    }

    return created;
  }

  close() {
    this.db.close();
  }
}

// Singleton instance
export const copywritingDb = new CopywritingDatabase();

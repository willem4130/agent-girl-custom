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

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_generated_copy_brand
      ON generated_copy(brand_id)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_generated_copy_status
      ON generated_copy(status)
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

    console.log('✅ Copywriting database initialized');
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

  updateBrandConfig(
    brandId: string,
    updates: Partial<Omit<BrandConfig, 'id' | 'session_id' | 'created_at' | 'updated_at'>>
  ): boolean {
    const fields: string[] = [];
    const values: unknown[] = [];

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
        (id, brand_id, voice_profile_version, content_type, platform, copy_text, variation_number,
         framework_used, triggers_applied, tone_scores, quality_score, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        brandId,
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

  close() {
    this.db.close();
  }
}

// Singleton instance
export const copywritingDb = new CopywritingDatabase();

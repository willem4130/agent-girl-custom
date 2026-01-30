/**
 * Copywriting API Routes
 *
 * White-label REST API for brand configuration, scraping, voice profiles,
 * copy generation, and engagement tracking.
 *
 * Base path: /api/copywriting
 */

import { copywritingDb } from '../copywriting/database';
import {
  scrapeInstagramProfile,
  scrapeInstagramPosts,
  extractInstagramUsername,
} from '../scraping/instagram-scraper';
import {
  scrapeFacebookPage,
  scrapeFacebookPosts,
  extractFacebookPageId,
} from '../scraping/facebook-scraper';
import {
  scrapeLinkedInCompany,
  scrapeLinkedInPosts,
  extractLinkedInCompanyId,
} from '../scraping/linkedin-scraper';
import {
  scrapeWebsiteDeep,
  extractTextForAnalysis,
} from '../scraping/website-scraper';
import {
  deepCrawl,
  getCrawlSummary,
  type CrawledPage,
} from '../scraping/deep-crawler';
import {
  analyzeContent,
  generateConciseInstructions,
  type VoiceAnalysisResult,
} from '../scraping/content-analyzer';
import { analyzeCopySections } from '../copywriting/section-analyzer';
import {
  formatCopy,
  getCopyInFormat,
  type CopyFormat,
  type FormattedCopy,
} from '../copywriting/copy-formatter';

/**
 * Handle copywriting-related API routes
 * Returns Response if route was handled, undefined otherwise
 */
export async function handleCopywritingRoutes(
  req: Request,
  url: URL
): Promise<Response | undefined> {
  const pathname = url.pathname;

  // ============================================================================
  // BRAND CONFIG ENDPOINTS
  // ============================================================================

  // POST /api/copywriting/brands - Create brand config
  if (pathname === '/api/copywriting/brands' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        sessionId: string;
        name: string;
        websiteUrl?: string;
        instagramUrl?: string;
        facebookUrl?: string;
        linkedinUrl?: string;
        language?: 'nl' | 'en' | 'both';
        contentTypes?: string[];
      };

      if (!body.sessionId || !body.name) {
        return jsonResponse({ error: 'sessionId and name are required' }, 400);
      }

      const brand = copywritingDb.createBrandConfig(body.sessionId, body.name, {
        websiteUrl: body.websiteUrl,
        instagramUrl: body.instagramUrl,
        facebookUrl: body.facebookUrl,
        linkedinUrl: body.linkedinUrl,
        language: body.language,
        contentTypes: body.contentTypes,
      });

      return jsonResponse(brand, 201);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/brands - List all brands (includes analysis status)
  if (pathname === '/api/copywriting/brands' && req.method === 'GET') {
    try {
      const brands = copywritingDb.listBrandConfigsWithStatus();
      return jsonResponse({ brands });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/brands/:id - Get brand by ID
  const brandIdMatch = pathname.match(/^\/api\/copywriting\/brands\/([^/]+)$/);
  if (brandIdMatch && req.method === 'GET') {
    try {
      const brand = copywritingDb.getBrandConfig(brandIdMatch[1]);
      if (!brand) {
        return jsonResponse({ error: 'Brand not found' }, 404);
      }
      return jsonResponse(brand);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // PUT /api/copywriting/brands/:id - Update brand
  if (brandIdMatch && req.method === 'PUT') {
    try {
      const body = (await req.json()) as {
        name?: string;
        websiteUrl?: string;
        instagramUrl?: string;
        facebookUrl?: string;
        linkedinUrl?: string;
        language?: 'nl' | 'en' | 'both';
        contentTypes?: string[];
      };

      const success = copywritingDb.updateBrandConfig(brandIdMatch[1], {
        name: body.name,
        website_url: body.websiteUrl,
        instagram_url: body.instagramUrl,
        facebook_url: body.facebookUrl,
        linkedin_url: body.linkedinUrl,
        language: body.language,
        content_types: body.contentTypes
          ? JSON.stringify(body.contentTypes)
          : undefined,
      });

      if (!success) {
        return jsonResponse({ error: 'Brand not found or no changes made' }, 404);
      }

      const brand = copywritingDb.getBrandConfig(brandIdMatch[1]);
      return jsonResponse(brand);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // DELETE /api/copywriting/brands/:id - Delete brand
  if (brandIdMatch && req.method === 'DELETE') {
    try {
      const success = copywritingDb.deleteBrandConfig(brandIdMatch[1]);
      return jsonResponse({ success });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/copywriting/brands/:id/analyze - Trigger brand analysis
  const analyzeMatch = pathname.match(
    /^\/api\/copywriting\/brands\/([^/]+)\/analyze$/
  );
  if (analyzeMatch && req.method === 'POST') {
    try {
      const brandId = analyzeMatch[1];
      const brand = copywritingDb.getBrandConfig(brandId);

      if (!brand) {
        return jsonResponse({ error: 'Brand not found' }, 404);
      }

      // Start async scraping (run in background)
      // Pass brand name so priority brands (like SCEX) get deep treatment
      const results = await scrapeAllBrandUrls({
        name: brand.name,
        website_url: brand.website_url,
        instagram_url: brand.instagram_url,
        facebook_url: brand.facebook_url,
        linkedin_url: brand.linkedin_url,
      });

      // Store scraped content
      for (const result of results) {
        if (result.success && result.content) {
          copywritingDb.addScrapedContent(
            brandId,
            result.platform,
            result.content,
            {
              contentType: result.contentType,
              metadata: result.metadata,
            }
          );
        }
      }

      return jsonResponse({
        success: true,
        results: results.map((r) => ({
          platform: r.platform,
          success: r.success,
          error: r.error,
        })),
      });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/copywriting/brands/:id/deep-analyze - Deep crawl + LLM analysis
  const deepAnalyzeMatch = pathname.match(
    /^\/api\/copywriting\/brands\/([^/]+)\/deep-analyze$/
  );
  if (deepAnalyzeMatch && req.method === 'POST') {
    try {
      const brandId = deepAnalyzeMatch[1];
      const brand = copywritingDb.getBrandConfig(brandId);

      if (!brand) {
        return jsonResponse({ error: 'Brand not found' }, 404);
      }

      // Parse request body for options
      let maxPages = 25;
      let runLlmAnalysis = true;
      try {
        const body = (await req.json()) as { maxPages?: number; runLlmAnalysis?: boolean };
        if (body.maxPages) maxPages = Math.min(body.maxPages, 100);
        if (body.runLlmAnalysis !== undefined) runLlmAnalysis = body.runLlmAnalysis;
      } catch {
        // Use defaults if no body or invalid JSON
      }

      console.log(`[CopywritingAPI] Starting deep analysis for brand ${brand.name}`);

      // Step 1: Deep crawl website if URL is provided
      let crawledPages: CrawledPage[] = [];
      if (brand.website_url) {
        console.log(`[CopywritingAPI] Deep crawling ${brand.website_url} (max ${maxPages} pages)`);
        crawledPages = await deepCrawl(brand.website_url, { maxPages });

        // Store crawled pages in database
        for (const page of crawledPages) {
          copywritingDb.addScrapedPage(brandId, page.url, {
            pageType: page.pageType,
            title: page.title,
            extractedContent: page.extractedContent as unknown as Record<string, unknown>,
            wordCount: page.wordCount,
            detectedTopics: page.detectedTopics,
            crawlDepth: page.crawlDepth,
          });
        }

        console.log(`[CopywritingAPI] Stored ${crawledPages.length} pages`);
      }

      // Step 2: Scrape social media (existing logic)
      const socialResults = await scrapeAllBrandUrls({
        instagram_url: brand.instagram_url,
        facebook_url: brand.facebook_url,
        linkedin_url: brand.linkedin_url,
      });

      // Store social content
      for (const result of socialResults) {
        if (result.success && result.content) {
          copywritingDb.addScrapedContent(brandId, result.platform, result.content, {
            contentType: result.contentType,
            metadata: result.metadata,
          });
        }
      }

      // Step 3: Run LLM analysis if requested
      let voiceAnalysis: VoiceAnalysisResult | null = null;
      if (runLlmAnalysis && (crawledPages.length > 0 || socialResults.some((r) => r.success))) {
        console.log('[CopywritingAPI] Running LLM content analysis...');

        // Get existing voice profile for reference
        const existingProfile = copywritingDb.getCurrentVoiceProfile(brandId);

        // Get social content from database
        const socialContent = copywritingDb.getScrapedContent(brandId);

        // Run analysis
        voiceAnalysis = await analyzeContent(
          crawledPages,
          {
            brandName: brand.name,
            websiteUrl: brand.website_url,
            language: brand.language,
            existingToneScores: existingProfile
              ? {
                  formality: existingProfile.formality_score ?? undefined,
                  humor: existingProfile.humor_score ?? undefined,
                  energy: existingProfile.energy_score ?? undefined,
                  authority: existingProfile.authority_score ?? undefined,
                }
              : undefined,
          },
          socialContent
        );

        // Store voice analysis in database
        copywritingDb.createOrUpdateVoiceAnalysis(brandId, {
          voiceDescription: voiceAnalysis.voiceDescription,
          writingStylePatterns: voiceAnalysis.writingStylePatterns,
          vocabularyPreferences: voiceAnalysis.vocabularyPreferences,
          exampleHooks: voiceAnalysis.exampleHooks,
          generatedGuidelines: voiceAnalysis.generatedGuidelines,
          toneDimensions: voiceAnalysis.toneDimensions,
          samplesAnalyzed: voiceAnalysis.samplesAnalyzed,
          confidenceScore: voiceAnalysis.confidenceScore,
        });

        // Also update the basic voice profile with new scores
        copywritingDb.createVoiceProfile(brandId, {
          formality_score: voiceAnalysis.toneDimensions.formality,
          humor_score: voiceAnalysis.toneDimensions.humor,
          energy_score: voiceAnalysis.toneDimensions.energy,
          authority_score: voiceAnalysis.toneDimensions.authority,
          samples_analyzed: voiceAnalysis.samplesAnalyzed,
          confidence_score: voiceAnalysis.confidenceScore,
          winning_hooks: JSON.stringify(voiceAnalysis.exampleHooks),
        });

        console.log('[CopywritingAPI] Voice analysis complete');
      }

      // Build response
      const crawlSummary = crawledPages.length > 0 ? getCrawlSummary(crawledPages) : null;

      return jsonResponse({
        success: true,
        crawl: crawlSummary
          ? {
              pagesScraped: crawlSummary.totalPages,
              totalWords: crawlSummary.totalWords,
              pageTypes: crawlSummary.pageTypes,
              detectedTopics: crawlSummary.allTopics,
            }
          : null,
        social: socialResults.map((r) => ({
          platform: r.platform,
          success: r.success,
          error: r.error,
        })),
        voiceAnalysis: voiceAnalysis
          ? {
              voiceDescription: voiceAnalysis.voiceDescription,
              toneDimensions: voiceAnalysis.toneDimensions,
              confidenceScore: voiceAnalysis.confidenceScore,
              samplesAnalyzed: voiceAnalysis.samplesAnalyzed,
            }
          : null,
      });
    } catch (error) {
      console.error('[CopywritingAPI] Deep analysis error:', error);
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/brands/:id/voice-analysis - Get LLM-generated voice analysis
  const voiceAnalysisMatch = pathname.match(
    /^\/api\/copywriting\/brands\/([^/]+)\/voice-analysis$/
  );
  if (voiceAnalysisMatch && req.method === 'GET') {
    try {
      const analysis = copywritingDb.getVoiceAnalysis(voiceAnalysisMatch[1]);

      if (!analysis) {
        return jsonResponse({ error: 'Voice analysis not found. Run /deep-analyze first.' }, 404);
      }

      // Parse JSON fields
      const response = {
        ...analysis,
        writing_style_patterns: JSON.parse(analysis.writing_style_patterns || '{}'),
        vocabulary_preferences: JSON.parse(analysis.vocabulary_preferences || '{}'),
        example_hooks: JSON.parse(analysis.example_hooks || '[]'),
        tone_dimensions: JSON.parse(analysis.tone_dimensions || '{}'),
      };

      return jsonResponse(response);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/brands/:id/voice-analysis/instructions - Get concise instructions
  const voiceInstructionsMatch = pathname.match(
    /^\/api\/copywriting\/brands\/([^/]+)\/voice-analysis\/instructions$/
  );
  if (voiceInstructionsMatch && req.method === 'GET') {
    try {
      const analysis = copywritingDb.getVoiceAnalysis(voiceInstructionsMatch[1]);

      if (!analysis) {
        return jsonResponse({ error: 'Voice analysis not found. Run /deep-analyze first.' }, 404);
      }

      // Convert to VoiceAnalysisResult format
      const voiceResult: VoiceAnalysisResult = {
        voiceDescription: analysis.voice_description,
        toneDimensions: JSON.parse(analysis.tone_dimensions || '{}'),
        writingStylePatterns: JSON.parse(analysis.writing_style_patterns || '{}'),
        vocabularyPreferences: JSON.parse(analysis.vocabulary_preferences || '{}'),
        exampleHooks: JSON.parse(analysis.example_hooks || '[]'),
        exampleCTAs: [],
        generatedGuidelines: analysis.generated_guidelines,
        samplesAnalyzed: analysis.samples_analyzed,
        confidenceScore: analysis.confidence_score,
      };

      const maxLength = parseInt(url.searchParams.get('maxLength') || '800', 10);
      const instructions = generateConciseInstructions(voiceResult, maxLength);

      return jsonResponse({ instructions });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/brands/:id/scraped-pages - Get crawled pages
  const scrapedPagesMatch = pathname.match(
    /^\/api\/copywriting\/brands\/([^/]+)\/scraped-pages$/
  );
  if (scrapedPagesMatch && req.method === 'GET') {
    try {
      const pageType = url.searchParams.get('pageType') || undefined;
      const pages = copywritingDb.getScrapedPages(scrapedPagesMatch[1], pageType);
      const count = copywritingDb.getScrapedPagesCount(scrapedPagesMatch[1]);

      return jsonResponse({ pages, totalCount: count });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // SCRAPING ENDPOINTS
  // ============================================================================

  // POST /api/copywriting/scrape - Scrape specific URL
  if (pathname === '/api/copywriting/scrape' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        url: string;
        platform: 'instagram' | 'facebook' | 'linkedin' | 'website';
        brandId?: string;
      };

      if (!body.url || !body.platform) {
        return jsonResponse({ error: 'url and platform are required' }, 400);
      }

      const result = await scrapePlatform(body.platform, body.url);

      // Optionally store if brandId provided
      if (body.brandId && result.success && result.content) {
        copywritingDb.addScrapedContent(body.brandId, body.platform, result.content, {
          contentType: result.contentType,
          metadata: result.metadata,
        });
      }

      return jsonResponse(result);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/scraping/content/:brandId - Get scraped content
  const scrapedContentMatch = pathname.match(
    /^\/api\/copywriting\/scraping\/content\/([^/]+)$/
  );
  if (scrapedContentMatch && req.method === 'GET') {
    try {
      const platform = url.searchParams.get('platform') || undefined;
      const content = copywritingDb.getScrapedContent(scrapedContentMatch[1], platform);
      return jsonResponse({ content });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // VOICE PROFILE ENDPOINTS
  // ============================================================================

  // GET /api/copywriting/voice/:brandId - Get current voice profile
  const voiceMatch = pathname.match(/^\/api\/copywriting\/voice\/([^/]+)$/);
  if (voiceMatch && req.method === 'GET') {
    try {
      const profile = copywritingDb.getCurrentVoiceProfile(voiceMatch[1]);
      if (!profile) {
        return jsonResponse({ error: 'Voice profile not found' }, 404);
      }

      // Parse JSON fields before returning
      const response = {
        ...profile,
        top_frameworks: profile.top_frameworks ? JSON.parse(profile.top_frameworks) : [],
        top_triggers: profile.top_triggers ? JSON.parse(profile.top_triggers) : [],
        winning_hooks: profile.winning_hooks ? JSON.parse(profile.winning_hooks) : [],
        avoid_patterns: profile.avoid_patterns ? JSON.parse(profile.avoid_patterns) : [],
      };

      return jsonResponse(response);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/voice/:brandId/history - Get voice profile versions
  const voiceHistoryMatch = pathname.match(
    /^\/api\/copywriting\/voice\/([^/]+)\/history$/
  );
  if (voiceHistoryMatch && req.method === 'GET') {
    try {
      const profiles = copywritingDb.getVoiceProfileHistory(voiceHistoryMatch[1]);
      return jsonResponse({ profiles });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/copywriting/voice/:brandId/refresh - Regenerate voice profile
  const voiceRefreshMatch = pathname.match(
    /^\/api\/copywriting\/voice\/([^/]+)\/refresh$/
  );
  if (voiceRefreshMatch && req.method === 'POST') {
    try {
      const brandId = voiceRefreshMatch[1];

      // Get all scraped content for this brand
      const content = copywritingDb.getScrapedContent(brandId);

      if (content.length === 0) {
        return jsonResponse(
          { error: 'No scraped content available. Run /analyze first.' },
          400
        );
      }

      // Combine all content for analysis
      const allText = content.map((c) => c.raw_content).join('\n\n');

      // Analyze content to generate voice profile scores
      // In production, this would use Claude for sophisticated analysis
      const analysisResult = analyzeContentForVoiceProfile(allText, content.length);

      // Create voice profile with analyzed scores
      const profile = copywritingDb.createVoiceProfile(brandId, {
        formality_score: analysisResult.formality,
        humor_score: analysisResult.humor,
        energy_score: analysisResult.energy,
        authority_score: analysisResult.authority,
        vocabulary_complexity: analysisResult.vocabularyComplexity,
        avg_sentence_length: analysisResult.avgSentenceLength,
        emoji_density: analysisResult.emojiDensity,
        hashtag_density: analysisResult.hashtagDensity,
        samples_analyzed: content.length,
        confidence_score: content.length >= 10 ? 0.8 : content.length >= 5 ? 0.6 : 0.4,
      });

      return jsonResponse(profile);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // COPY GENERATION ENDPOINTS
  // ============================================================================

  // POST /api/copywriting/generate/social - Generate social media copy
  if (pathname === '/api/copywriting/generate/social' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        brandId: string;
        platform: string;
        topic: string;
        briefing?: string;
        variations?: number;
        frameworks?: string[];
      };

      if (!body.brandId || !body.platform || !body.topic) {
        return jsonResponse(
          { error: 'brandId, platform, and topic are required' },
          400
        );
      }

      // Get current voice profile version
      const profile = copywritingDb.getCurrentVoiceProfile(body.brandId);
      const voiceVersion = profile?.version || 1;

      // Placeholder: In production, this would call the copywriting agents
      // For now, create placeholder entries
      const copies = [];
      const variationCount = body.variations || 3;

      for (let i = 1; i <= variationCount; i++) {
        const copy = copywritingDb.createGeneratedCopy(body.brandId, `[Placeholder copy ${i}]`, {
          contentType: 'social',
          platform: body.platform,
          variationNumber: i,
          voiceProfileVersion: voiceVersion,
        });
        copies.push(copy);
      }

      return jsonResponse({ copies });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/copywriting/generate/newsletter - Generate newsletter copy
  if (pathname === '/api/copywriting/generate/newsletter' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        brandId: string;
        topic: string;
        briefing?: string;
      };

      if (!body.brandId || !body.topic) {
        return jsonResponse({ error: 'brandId and topic are required' }, 400);
      }

      const profile = copywritingDb.getCurrentVoiceProfile(body.brandId);
      const voiceVersion = profile?.version || 1;

      const copy = copywritingDb.createGeneratedCopy(body.brandId, '[Placeholder newsletter]', {
        contentType: 'newsletter',
        platform: 'email',
        voiceProfileVersion: voiceVersion,
      });

      return jsonResponse(copy);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // COPY MANAGEMENT ENDPOINTS
  // ============================================================================

  // GET /api/copywriting/copy/:brandId - List generated copy
  const copyListMatch = pathname.match(/^\/api\/copywriting\/copy\/([^/]+)$/);
  if (copyListMatch && req.method === 'GET') {
    try {
      const status = url.searchParams.get('status') || undefined;
      const copies = copywritingDb.listGeneratedCopy(copyListMatch[1], status);
      return jsonResponse({ copies });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/copy/item/:copyId - Get specific copy
  const copyItemMatch = pathname.match(/^\/api\/copywriting\/copy\/item\/([^/]+)$/);
  if (copyItemMatch && req.method === 'GET') {
    try {
      const copy = copywritingDb.getGeneratedCopy(copyItemMatch[1]);
      if (!copy) {
        return jsonResponse({ error: 'Copy not found' }, 404);
      }
      return jsonResponse(copy);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/copy/item/:copyId/formatted - Get copy in all formats
  const copyFormattedMatch = pathname.match(
    /^\/api\/copywriting\/copy\/item\/([^/]+)\/formatted$/
  );
  if (copyFormattedMatch && req.method === 'GET') {
    try {
      const copy = copywritingDb.getGeneratedCopy(copyFormattedMatch[1]);
      if (!copy) {
        return jsonResponse({ error: 'Copy not found' }, 404);
      }

      const formatted: FormattedCopy = formatCopy(copy.copy_text);

      return jsonResponse({
        id: copy.id,
        platform: copy.platform,
        content_type: copy.content_type,
        formats: formatted,
      });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/copy/item/:copyId/format/:format - Get copy in specific format
  const copyFormatMatch = pathname.match(
    /^\/api\/copywriting\/copy\/item\/([^/]+)\/format\/(raw|wordpress|linkedin|markdown)$/
  );
  if (copyFormatMatch && req.method === 'GET') {
    try {
      const copy = copywritingDb.getGeneratedCopy(copyFormatMatch[1]);
      if (!copy) {
        return jsonResponse({ error: 'Copy not found' }, 404);
      }

      const format = copyFormatMatch[2] as CopyFormat;
      const formattedText = getCopyInFormat(copy.copy_text, format);

      return jsonResponse({
        id: copy.id,
        platform: copy.platform,
        content_type: copy.content_type,
        format,
        text: formattedText,
      });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/copywriting/copy/save-from-chat - Save content from chat to Copy Library
  if (pathname === '/api/copywriting/copy/save-from-chat' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        brandId: string;
        sessionId?: string;
        copyText: string;
        platform?: string;
        contentType?: string;
      };

      if (!body.brandId || !body.copyText) {
        return jsonResponse({ error: 'brandId and copyText are required' }, 400);
      }

      const copy = copywritingDb.createGeneratedCopy(body.brandId, body.copyText, {
        contentType: body.contentType || 'linkedin_post',
        platform: body.platform || 'linkedin',
        sessionId: body.sessionId,
      });

      console.log('📝 Saved copy from chat to library:', copy.id);
      return jsonResponse({ success: true, copy }, 201);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // PUT /api/copywriting/copy/item/:copyId/status - Update copy status
  const copyStatusMatch = pathname.match(
    /^\/api\/copywriting\/copy\/item\/([^/]+)\/status$/
  );
  if (copyStatusMatch && req.method === 'PUT') {
    try {
      const body = (await req.json()) as {
        status: 'draft' | 'approved' | 'published' | 'archived';
        publishedUrl?: string;
      };

      if (!body.status) {
        return jsonResponse({ error: 'status is required' }, 400);
      }

      const success = copywritingDb.updateCopyStatus(
        copyStatusMatch[1],
        body.status,
        body.publishedUrl
      );

      if (!success) {
        return jsonResponse({ error: 'Copy not found' }, 404);
      }

      const copy = copywritingDb.getGeneratedCopy(copyStatusMatch[1]);
      return jsonResponse(copy);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/copywriting/copy/item/:copyId/publish - Mark as published
  const copyPublishMatch = pathname.match(
    /^\/api\/copywriting\/copy\/item\/([^/]+)\/publish$/
  );
  if (copyPublishMatch && req.method === 'POST') {
    try {
      const body = (await req.json()) as { publishedUrl: string };

      if (!body.publishedUrl) {
        return jsonResponse({ error: 'publishedUrl is required' }, 400);
      }

      const success = copywritingDb.updateCopyStatus(
        copyPublishMatch[1],
        'published',
        body.publishedUrl
      );

      if (!success) {
        return jsonResponse({ error: 'Copy not found' }, 404);
      }

      const copy = copywritingDb.getGeneratedCopy(copyPublishMatch[1]);
      return jsonResponse(copy);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // COPY SECTIONS ENDPOINTS (for copy-centric image generation)
  // ============================================================================

  // POST /api/copywriting/copy/:copyId/analyze-sections - Analyze copy and create sections
  const analyzeSectionsMatch = pathname.match(
    /^\/api\/copywriting\/copy\/([^/]+)\/analyze-sections$/
  );
  if (analyzeSectionsMatch && req.method === 'POST') {
    try {
      const copyId = analyzeSectionsMatch[1];
      const copy = copywritingDb.getGeneratedCopy(copyId);

      if (!copy) {
        return jsonResponse({ error: 'Copy not found' }, 404);
      }

      // Delete existing sections before re-analyzing
      copywritingDb.deleteCopySections(copyId);

      // Analyze sections using LLM
      const analysisResult = await analyzeCopySections(
        copy.copy_text,
        copy.content_type
      );

      // Store sections in database
      const storedSections = analysisResult.sections.map((section, index) => {
        return copywritingDb.createCopySection({
          copy_id: copyId,
          section_type: section.section_type,
          section_index: index,
          content: section.content,
          suggested_visual_concept: section.suggested_visual_concept,
          image_id: null,
        });
      });

      return jsonResponse({
        copyId,
        sections: storedSections,
        totalSections: storedSections.length,
        contentType: analysisResult.contentType,
      });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/copy/:copyId/sections - Get sections for a copy
  const getSectionsMatch = pathname.match(
    /^\/api\/copywriting\/copy\/([^/]+)\/sections$/
  );
  if (getSectionsMatch && req.method === 'GET') {
    try {
      const copyId = getSectionsMatch[1];

      // Verify copy exists
      const copy = copywritingDb.getGeneratedCopy(copyId);
      if (!copy) {
        return jsonResponse({ error: 'Copy not found' }, 404);
      }

      const sections = copywritingDb.getCopySections(copyId);

      return jsonResponse({
        copyId,
        sections,
        totalSections: sections.length,
      });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // PUT /api/copywriting/sections/:sectionId/image - Link image to section
  const sectionImageMatch = pathname.match(
    /^\/api\/copywriting\/sections\/([^/]+)\/image$/
  );
  if (sectionImageMatch && req.method === 'PUT') {
    try {
      const body = (await req.json()) as { imageId: string | null };
      const sectionId = sectionImageMatch[1];

      const success = copywritingDb.updateCopySectionImage(sectionId, body.imageId);

      if (!success) {
        return jsonResponse({ error: 'Section not found' }, 404);
      }

      const section = copywritingDb.getCopySection(sectionId);
      return jsonResponse(section);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // PUT /api/copywriting/sections/:sectionId/visual-concept - Update visual concept
  const sectionConceptMatch = pathname.match(
    /^\/api\/copywriting\/sections\/([^/]+)\/visual-concept$/
  );
  if (sectionConceptMatch && req.method === 'PUT') {
    try {
      const body = (await req.json()) as { concept: string };
      const sectionId = sectionConceptMatch[1];

      if (!body.concept) {
        return jsonResponse({ error: 'concept is required' }, 400);
      }

      const success = copywritingDb.updateCopySectionVisualConcept(sectionId, body.concept);

      if (!success) {
        return jsonResponse({ error: 'Section not found' }, 404);
      }

      const section = copywritingDb.getCopySection(sectionId);
      return jsonResponse(section);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/brands/:brandId/copies-with-media - Get copies with sections and images
  const copiesWithMediaMatch = pathname.match(
    /^\/api\/copywriting\/brands\/([^/]+)\/copies-with-media$/
  );
  if (copiesWithMediaMatch && req.method === 'GET') {
    try {
      const brandId = copiesWithMediaMatch[1];

      // Verify brand exists
      const brand = copywritingDb.getBrandConfig(brandId);
      if (!brand) {
        return jsonResponse({ error: 'Brand not found' }, 404);
      }

      const copiesWithMedia = copywritingDb.getCopiesWithMedia(brandId);

      return jsonResponse({
        brandId,
        copies: copiesWithMedia,
        totalCopies: copiesWithMedia.length,
      });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // DELETE /api/copywriting/sections/:sectionId - Delete a section
  const deleteSectionMatch = pathname.match(
    /^\/api\/copywriting\/sections\/([^/]+)$/
  );
  if (deleteSectionMatch && req.method === 'DELETE') {
    try {
      const success = copywritingDb.deleteCopySection(deleteSectionMatch[1]);
      return jsonResponse({ success });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // ENGAGEMENT TRACKING ENDPOINTS
  // ============================================================================

  // POST /api/copywriting/engagement/:copyId/track - Add engagement metrics
  const engagementTrackMatch = pathname.match(
    /^\/api\/copywriting\/engagement\/([^/]+)\/track$/
  );
  if (engagementTrackMatch && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        hoursSincePublish: number;
        metrics: {
          impressions?: number;
          engagements?: number;
          engagementRate?: number;
          platformMetrics?: Record<string, unknown>;
        };
      };

      if (body.hoursSincePublish === undefined || !body.metrics) {
        return jsonResponse(
          { error: 'hoursSincePublish and metrics are required' },
          400
        );
      }

      const engagement = copywritingDb.addEngagementMetrics(
        engagementTrackMatch[1],
        body.hoursSincePublish,
        body.metrics
      );

      return jsonResponse(engagement);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/engagement/:copyId/metrics - Get engagement history
  const engagementMetricsMatch = pathname.match(
    /^\/api\/copywriting\/engagement\/([^/]+)\/metrics$/
  );
  if (engagementMetricsMatch && req.method === 'GET') {
    try {
      const metrics = copywritingDb.getEngagementMetrics(engagementMetricsMatch[1]);
      return jsonResponse({ metrics });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // INSIGHTS ENDPOINTS
  // ============================================================================

  // GET /api/copywriting/insights/:brandId - Get learned insights
  const insightsMatch = pathname.match(/^\/api\/copywriting\/insights\/([^/]+)$/);
  if (insightsMatch && req.method === 'GET') {
    try {
      const insights = copywritingDb.getInsights(insightsMatch[1]);
      return jsonResponse({ insights });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/copywriting/insights/:brandId/analyze - Trigger learning analysis
  const insightsAnalyzeMatch = pathname.match(
    /^\/api\/copywriting\/insights\/([^/]+)\/analyze$/
  );
  if (insightsAnalyzeMatch && req.method === 'POST') {
    try {
      const brandId = insightsAnalyzeMatch[1];

      // Get all engagement data for this brand's copy
      const copies = copywritingDb.listGeneratedCopy(brandId, 'published');

      if (copies.length < 3) {
        return jsonResponse(
          { error: 'Need at least 3 published copies with engagement data to analyze' },
          400
        );
      }

      // Placeholder: In production, this would analyze patterns
      const insight = copywritingDb.addInsight(
        brandId,
        'framework_performance',
        { placeholder: 'Analysis pending' },
        0.5,
        copies.length
      );

      return jsonResponse(insight);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // REFERENCE MATERIALS ENDPOINTS
  // ============================================================================

  // POST /api/copywriting/brands/:id/references - Add reference material
  const addReferenceMatch = pathname.match(
    /^\/api\/copywriting\/brands\/([^/]+)\/references$/
  );
  if (addReferenceMatch && req.method === 'POST') {
    try {
      const brandId = addReferenceMatch[1];
      const body = (await req.json()) as {
        materialType: 'url' | 'file' | 'text' | 'project';
        title: string;
        content: string;
        sourceUrl?: string;
        tags?: string[];
      };

      if (!body.materialType || !body.title || !body.content) {
        return jsonResponse(
          { error: 'materialType, title, and content are required' },
          400
        );
      }

      const reference = copywritingDb.addReferenceMaterial(brandId, {
        materialType: body.materialType,
        title: body.title,
        content: body.content,
        sourceUrl: body.sourceUrl,
        tags: body.tags,
      });

      return jsonResponse(reference, 201);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/brands/:id/references - List reference materials
  if (addReferenceMatch && req.method === 'GET') {
    try {
      const materialType = url.searchParams.get('type') || undefined;
      const references = copywritingDb.getReferenceMaterials(
        addReferenceMatch[1],
        materialType
      );
      return jsonResponse({ references });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/references/:id - Get single reference
  const getReferenceMatch = pathname.match(
    /^\/api\/copywriting\/references\/([^/]+)$/
  );
  if (getReferenceMatch && req.method === 'GET') {
    try {
      const reference = copywritingDb.getReferenceMaterial(getReferenceMatch[1]);
      if (!reference) {
        return jsonResponse({ error: 'Reference not found' }, 404);
      }
      return jsonResponse(reference);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // PUT /api/copywriting/references/:id - Update reference
  if (getReferenceMatch && req.method === 'PUT') {
    try {
      const body = (await req.json()) as {
        title?: string;
        content?: string;
        tags?: string[];
      };

      const success = copywritingDb.updateReferenceMaterial(getReferenceMatch[1], {
        title: body.title,
        content: body.content,
        tags: body.tags ? JSON.stringify(body.tags) : undefined,
      });

      if (!success) {
        return jsonResponse({ error: 'Reference not found' }, 404);
      }

      const reference = copywritingDb.getReferenceMaterial(getReferenceMatch[1]);
      return jsonResponse(reference);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // DELETE /api/copywriting/references/:id - Delete reference
  if (getReferenceMatch && req.method === 'DELETE') {
    try {
      const success = copywritingDb.deleteReferenceMaterial(getReferenceMatch[1]);
      return jsonResponse({ success });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // CONTENT GENERATION SESSION ENDPOINTS
  // ============================================================================

  // POST /api/copywriting/sessions - Create generation session
  if (pathname === '/api/copywriting/sessions' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        brandId: string;
        contentType: 'linkedin_post' | 'facebook_post' | 'instagram_post' | 'article' | 'newsletter' | 'custom';
      };

      if (!body.brandId || !body.contentType) {
        return jsonResponse({ error: 'brandId and contentType are required' }, 400);
      }

      const session = copywritingDb.createSession(body.brandId, body.contentType);
      return jsonResponse(session, 201);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/sessions/:id - Get session state
  const sessionMatch = pathname.match(/^\/api\/copywriting\/sessions\/([^/]+)$/);
  if (sessionMatch && req.method === 'GET') {
    try {
      const session = copywritingDb.getSession(sessionMatch[1]);
      if (!session) {
        return jsonResponse({ error: 'Session not found' }, 404);
      }

      // Parse JSON fields
      const response = {
        ...session,
        briefing_data: JSON.parse(session.briefing_data || '{}'),
        generated_drafts: JSON.parse(session.generated_drafts || '[]'),
        feedback_history: JSON.parse(session.feedback_history || '[]'),
      };

      return jsonResponse(response);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // PUT /api/copywriting/sessions/:id - Update session
  if (sessionMatch && req.method === 'PUT') {
    try {
      const body = (await req.json()) as {
        workflowStep?: 'brand_select' | 'content_type' | 'briefing' | 'clarification' | 'generation' | 'refinement' | 'completed';
        briefingData?: Record<string, unknown>;
        generatedDrafts?: unknown[];
        feedbackHistory?: unknown[];
      };

      const success = copywritingDb.updateSession(sessionMatch[1], {
        workflowStep: body.workflowStep,
        briefingData: body.briefingData,
        generatedDrafts: body.generatedDrafts,
        feedbackHistory: body.feedbackHistory,
      });

      if (!success) {
        return jsonResponse({ error: 'Session not found' }, 404);
      }

      const session = copywritingDb.getSession(sessionMatch[1]);
      return jsonResponse(session);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/copywriting/sessions/:id/feedback - Add feedback to session
  const sessionFeedbackMatch = pathname.match(
    /^\/api\/copywriting\/sessions\/([^/]+)\/feedback$/
  );
  if (sessionFeedbackMatch && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        draftIndex: number;
        feedback: string;
        refinedDraft?: string;
      };

      if (body.draftIndex === undefined || !body.feedback) {
        return jsonResponse({ error: 'draftIndex and feedback are required' }, 400);
      }

      const success = copywritingDb.addSessionFeedback(sessionFeedbackMatch[1], {
        draft_index: body.draftIndex,
        feedback: body.feedback,
        refined_draft: body.refinedDraft,
      });

      if (!success) {
        return jsonResponse({ error: 'Session not found' }, 404);
      }

      const session = copywritingDb.getSession(sessionFeedbackMatch[1]);
      return jsonResponse(session);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/copywriting/sessions/:id/complete - Mark session complete
  const sessionCompleteMatch = pathname.match(
    /^\/api\/copywriting\/sessions\/([^/]+)\/complete$/
  );
  if (sessionCompleteMatch && req.method === 'POST') {
    try {
      const success = copywritingDb.completeSession(sessionCompleteMatch[1]);

      if (!success) {
        return jsonResponse({ error: 'Session not found' }, 404);
      }

      const session = copywritingDb.getSession(sessionCompleteMatch[1]);
      return jsonResponse(session);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/brands/:id/sessions - Get active sessions for brand
  const brandSessionsMatch = pathname.match(
    /^\/api\/copywriting\/brands\/([^/]+)\/sessions$/
  );
  if (brandSessionsMatch && req.method === 'GET') {
    try {
      const sessions = copywritingDb.getActiveSessions(brandSessionsMatch[1]);
      return jsonResponse({ sessions });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // POST TYPE TEMPLATES ENDPOINTS
  // ============================================================================

  // GET /api/copywriting/templates - List all templates (global + optional brand-specific)
  if (pathname === '/api/copywriting/templates' && req.method === 'GET') {
    try {
      const brandId = url.searchParams.get('brandId') || undefined;
      const category = url.searchParams.get('category') as 'thought_leadership' | 'social_proof' | 'engagement' | 'educational' | undefined;

      let templates;
      if (category) {
        templates = copywritingDb.getTemplatesByCategory(category, brandId);
      } else {
        templates = copywritingDb.getTemplates(brandId);
      }

      // Parse JSON fields for client
      const parsed = templates.map(t => ({
        ...t,
        platforms: JSON.parse(t.platforms || '[]'),
        structure: JSON.parse(t.structure || '{}'),
        variables: JSON.parse(t.variables || '[]'),
      }));

      return jsonResponse({ templates: parsed });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/templates/:id - Get single template
  const templateIdMatch = pathname.match(/^\/api\/copywriting\/templates\/([^/]+)$/);
  if (templateIdMatch && req.method === 'GET') {
    try {
      const template = copywritingDb.getTemplate(templateIdMatch[1]);
      if (!template) {
        return jsonResponse({ error: 'Template not found' }, 404);
      }

      const parsed = {
        ...template,
        platforms: JSON.parse(template.platforms || '[]'),
        structure: JSON.parse(template.structure || '{}'),
        variables: JSON.parse(template.variables || '[]'),
      };

      return jsonResponse(parsed);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/copywriting/brands/:id/templates - Create brand-specific template
  const createTemplateMatch = pathname.match(
    /^\/api\/copywriting\/brands\/([^/]+)\/templates$/
  );
  if (createTemplateMatch && req.method === 'POST') {
    try {
      const brandId = createTemplateMatch[1];
      const body = (await req.json()) as {
        name: string;
        category: 'thought_leadership' | 'social_proof' | 'engagement' | 'educational';
        structure: {
          sections: Array<{
            name: string;
            prompt: string;
            maxChars?: number;
            variables?: string[];
          }>;
          framework?: string;
          tone_adjustments?: Record<string, number | string>;
        };
        description?: string;
        platforms?: string[];
        exampleOutput?: string;
        variables?: string[];
      };

      if (!body.name || !body.category || !body.structure) {
        return jsonResponse(
          { error: 'name, category, and structure are required' },
          400
        );
      }

      const template = copywritingDb.createTemplate(
        brandId,
        body.name,
        body.category,
        body.structure,
        {
          description: body.description,
          platforms: body.platforms,
          exampleOutput: body.exampleOutput,
          variables: body.variables,
        }
      );

      // Parse JSON fields for response
      const parsed = {
        ...template,
        platforms: JSON.parse(template.platforms || '[]'),
        structure: JSON.parse(template.structure || '{}'),
        variables: JSON.parse(template.variables || '[]'),
      };

      return jsonResponse(parsed, 201);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // PUT /api/copywriting/templates/:id - Update template
  if (templateIdMatch && req.method === 'PUT') {
    try {
      const body = (await req.json()) as {
        name?: string;
        description?: string;
        category?: 'thought_leadership' | 'social_proof' | 'engagement' | 'educational';
        platforms?: string[];
        structure?: {
          sections: Array<{
            name: string;
            prompt: string;
            maxChars?: number;
            variables?: string[];
          }>;
          framework?: string;
          tone_adjustments?: Record<string, number | string>;
        };
        exampleOutput?: string;
        variables?: string[];
      };

      const success = copywritingDb.updateTemplate(templateIdMatch[1], body);

      if (!success) {
        return jsonResponse({ error: 'Template not found or is a system template' }, 404);
      }

      const template = copywritingDb.getTemplate(templateIdMatch[1]);
      if (!template) {
        return jsonResponse({ error: 'Template not found' }, 404);
      }

      const parsed = {
        ...template,
        platforms: JSON.parse(template.platforms || '[]'),
        structure: JSON.parse(template.structure || '{}'),
        variables: JSON.parse(template.variables || '[]'),
      };

      return jsonResponse(parsed);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // DELETE /api/copywriting/templates/:id - Delete template
  if (templateIdMatch && req.method === 'DELETE') {
    try {
      const success = copywritingDb.deleteTemplate(templateIdMatch[1]);
      if (!success) {
        return jsonResponse({ error: 'Template not found or is a system template' }, 404);
      }
      return jsonResponse({ success: true });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // BRAND TONE PRESETS ENDPOINTS
  // ============================================================================

  // GET /api/copywriting/brands/:id/tone-presets - List tone presets for brand
  const tonePresetsMatch = pathname.match(
    /^\/api\/copywriting\/brands\/([^/]+)\/tone-presets$/
  );
  if (tonePresetsMatch && req.method === 'GET') {
    try {
      const presets = copywritingDb.getTonePresets(tonePresetsMatch[1]);

      // Parse JSON fields for client
      const parsed = presets.map(p => ({
        ...p,
        tone_adjustments: JSON.parse(p.tone_adjustments || '{}'),
        use_cases: JSON.parse(p.use_cases || '[]'),
        example_phrases: JSON.parse(p.example_phrases || '[]'),
      }));

      return jsonResponse({ presets: parsed });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/copywriting/brands/:id/tone-presets - Create tone preset
  if (tonePresetsMatch && req.method === 'POST') {
    try {
      const brandId = tonePresetsMatch[1];
      const body = (await req.json()) as {
        name: string;
        toneAdjustments: {
          formality?: number | string;
          authority?: number | string;
          warmth?: number | string;
          humor?: number | string;
          energy?: number | string;
          avoidPhrases?: string[];
          preferPhrases?: string[];
        };
        description?: string;
        useCases?: string[];
        examplePhrases?: string[];
        isDefault?: boolean;
      };

      if (!body.name || !body.toneAdjustments) {
        return jsonResponse(
          { error: 'name and toneAdjustments are required' },
          400
        );
      }

      const preset = copywritingDb.createTonePreset(
        brandId,
        body.name,
        body.toneAdjustments,
        {
          description: body.description,
          useCases: body.useCases,
          examplePhrases: body.examplePhrases,
          isDefault: body.isDefault,
        }
      );

      // Parse JSON fields for response
      const parsed = {
        ...preset,
        tone_adjustments: JSON.parse(preset.tone_adjustments || '{}'),
        use_cases: JSON.parse(preset.use_cases || '[]'),
        example_phrases: JSON.parse(preset.example_phrases || '[]'),
      };

      return jsonResponse(parsed, 201);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/copywriting/brands/:id/tone-presets/auto-generate - Auto-generate defaults
  const autoGeneratePresetsMatch = pathname.match(
    /^\/api\/copywriting\/brands\/([^/]+)\/tone-presets\/auto-generate$/
  );
  if (autoGeneratePresetsMatch && req.method === 'POST') {
    try {
      const brandId = autoGeneratePresetsMatch[1];

      // Check if brand exists
      const brand = copywritingDb.getBrandConfig(brandId);
      if (!brand) {
        return jsonResponse({ error: 'Brand not found' }, 404);
      }

      // Check if presets already exist
      const existing = copywritingDb.getTonePresets(brandId);
      if (existing.length > 0) {
        return jsonResponse(
          { error: 'Brand already has tone presets. Delete them first to regenerate.' },
          400
        );
      }

      const presets = copywritingDb.createDefaultTonePresets(brandId);

      // Parse JSON fields for response
      const parsed = presets.map(p => ({
        ...p,
        tone_adjustments: JSON.parse(p.tone_adjustments || '{}'),
        use_cases: JSON.parse(p.use_cases || '[]'),
        example_phrases: JSON.parse(p.example_phrases || '[]'),
      }));

      return jsonResponse({ presets: parsed, count: presets.length }, 201);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/copywriting/tone-presets/:id - Get single tone preset
  const tonePresetIdMatch = pathname.match(/^\/api\/copywriting\/tone-presets\/([^/]+)$/);
  if (tonePresetIdMatch && req.method === 'GET') {
    try {
      const preset = copywritingDb.getTonePreset(tonePresetIdMatch[1]);
      if (!preset) {
        return jsonResponse({ error: 'Tone preset not found' }, 404);
      }

      const parsed = {
        ...preset,
        tone_adjustments: JSON.parse(preset.tone_adjustments || '{}'),
        use_cases: JSON.parse(preset.use_cases || '[]'),
        example_phrases: JSON.parse(preset.example_phrases || '[]'),
      };

      return jsonResponse(parsed);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // PUT /api/copywriting/tone-presets/:id - Update tone preset
  if (tonePresetIdMatch && req.method === 'PUT') {
    try {
      const body = (await req.json()) as {
        name?: string;
        description?: string;
        toneAdjustments?: {
          formality?: number | string;
          authority?: number | string;
          warmth?: number | string;
          humor?: number | string;
          energy?: number | string;
          avoidPhrases?: string[];
          preferPhrases?: string[];
        };
        useCases?: string[];
        examplePhrases?: string[];
        isDefault?: boolean;
      };

      const success = copywritingDb.updateTonePreset(tonePresetIdMatch[1], body);

      if (!success) {
        return jsonResponse({ error: 'Tone preset not found' }, 404);
      }

      const preset = copywritingDb.getTonePreset(tonePresetIdMatch[1]);
      if (!preset) {
        return jsonResponse({ error: 'Tone preset not found' }, 404);
      }

      const parsed = {
        ...preset,
        tone_adjustments: JSON.parse(preset.tone_adjustments || '{}'),
        use_cases: JSON.parse(preset.use_cases || '[]'),
        example_phrases: JSON.parse(preset.example_phrases || '[]'),
      };

      return jsonResponse(parsed);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // DELETE /api/copywriting/tone-presets/:id - Delete tone preset
  if (tonePresetIdMatch && req.method === 'DELETE') {
    try {
      const success = copywritingDb.deleteTonePreset(tonePresetIdMatch[1]);
      if (!success) {
        return jsonResponse({ error: 'Tone preset not found' }, 404);
      }
      return jsonResponse({ success: true });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // Route not handled
  return undefined;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

interface ScrapeResult {
  platform: 'instagram' | 'facebook' | 'linkedin' | 'website';
  success: boolean;
  content?: string;
  contentType?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

async function scrapePlatform(
  platform: 'instagram' | 'facebook' | 'linkedin' | 'website',
  url: string
): Promise<ScrapeResult> {
  try {
    switch (platform) {
      case 'instagram': {
        const username = extractInstagramUsername(url);
        const [profile, posts] = await Promise.all([
          scrapeInstagramProfile(username),
          scrapeInstagramPosts(username, 30),
        ]);

        const content = [
          `Bio: ${profile.bio}`,
          ...posts.map((p) => `Post: ${p.caption}`),
        ].join('\n\n');

        return {
          platform,
          success: true,
          content,
          contentType: 'profile+posts',
          metadata: { username, followers: profile.followers, postsScraped: posts.length },
        };
      }

      case 'facebook': {
        const pageId = extractFacebookPageId(url);
        const [page, posts] = await Promise.all([
          scrapeFacebookPage(pageId),
          scrapeFacebookPosts(pageId, 30),
        ]);

        const content = [
          `About: ${page.about}`,
          `Description: ${page.description}`,
          ...posts.map((p) => `Post: ${p.message}`),
        ].join('\n\n');

        return {
          platform,
          success: true,
          content,
          contentType: 'page+posts',
          metadata: { pageId: page.id, followers: page.followers, postsScraped: posts.length },
        };
      }

      case 'linkedin': {
        const companyId = extractLinkedInCompanyId(url);
        const [company, posts] = await Promise.all([
          scrapeLinkedInCompany(companyId),
          scrapeLinkedInPosts(companyId, 20),
        ]);

        const content = [
          `Tagline: ${company.tagline}`,
          `Description: ${company.description}`,
          ...posts.map((p) => `Post: ${p.text}`),
        ].join('\n\n');

        return {
          platform,
          success: true,
          content,
          contentType: 'company+posts',
          metadata: { companyId: company.id, followers: company.followers, postsScraped: posts.length },
        };
      }

      case 'website': {
        const pages = await scrapeWebsiteDeep(url, 3);
        const content = pages.map((p) => extractTextForAnalysis(p)).join('\n\n---\n\n');

        return {
          platform,
          success: true,
          content,
          contentType: 'website',
          metadata: { pagesScraped: pages.length },
        };
      }

      default:
        return { platform, success: false, error: 'Unknown platform' };
    }
  } catch (error) {
    return { platform, success: false, error: getErrorMessage(error) };
  }
}

/**
 * Analyze text content to extract voice profile metrics
 * In production, this would use Claude for sophisticated analysis
 */
function analyzeContentForVoiceProfile(
  text: string,
  _sampleCount: number
): {
  formality: number;
  humor: number;
  energy: number;
  authority: number;
  vocabularyComplexity: string;
  avgSentenceLength: number;
  emojiDensity: number;
  hashtagDensity: number;
} {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const wordCount = words.length;
  const sentenceCount = Math.max(sentences.length, 1);

  // Calculate average sentence length
  const avgSentenceLength = wordCount / sentenceCount;

  // Count emojis (basic regex for common emoji ranges)
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojiCount = (text.match(emojiRegex) || []).length;
  const emojiDensity = wordCount > 0 ? (emojiCount / wordCount) * 100 : 0;

  // Count hashtags
  const hashtagCount = (text.match(/#\w+/g) || []).length;
  const hashtagDensity = wordCount > 0 ? (hashtagCount / wordCount) * 100 : 0;

  // Analyze formality (based on word length, sentence structure)
  const longWords = words.filter((w) => w.length > 8).length;
  const longWordRatio = wordCount > 0 ? longWords / wordCount : 0;
  const formality = Math.min(100, Math.round(40 + longWordRatio * 200 + (avgSentenceLength > 15 ? 20 : 0)));

  // Analyze energy (exclamation marks, caps, action words)
  const exclamationCount = (text.match(/!/g) || []).length;
  const capsWords = words.filter((w) => w === w.toUpperCase() && w.length > 2).length;
  const energy = Math.min(100, Math.round(30 + exclamationCount * 3 + capsWords * 5 + (emojiCount > 0 ? 15 : 0)));

  // Analyze humor (informal patterns, playful punctuation)
  const laughPatterns = (text.match(/haha|lol|😂|🤣|😅/gi) || []).length;
  const playfulPunctuation = (text.match(/\.{3}|!{2,}|\?{2,}/g) || []).length;
  const humor = Math.min(100, Math.round(20 + laughPatterns * 10 + playfulPunctuation * 5 + emojiCount * 2));

  // Analyze authority (declarative statements, statistics, expertise markers)
  const numberCount = (text.match(/\d+%?/g) || []).length;
  const expertiseMarkers = (text.match(/\b(research|study|expert|proven|data|results|analysis)\b/gi) || []).length;
  const authority = Math.min(100, Math.round(35 + numberCount * 3 + expertiseMarkers * 8 + formality * 0.3));

  // Determine vocabulary complexity
  let vocabularyComplexity: string;
  if (longWordRatio > 0.15 || avgSentenceLength > 20) {
    vocabularyComplexity = 'technical';
  } else if (longWordRatio > 0.08 || avgSentenceLength > 12) {
    vocabularyComplexity = 'moderate';
  } else {
    vocabularyComplexity = 'simple';
  }

  return {
    formality: Math.max(0, Math.min(100, formality)),
    humor: Math.max(0, Math.min(100, humor)),
    energy: Math.max(0, Math.min(100, energy)),
    authority: Math.max(0, Math.min(100, authority)),
    vocabularyComplexity,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    emojiDensity: Math.round(emojiDensity * 100) / 100,
    hashtagDensity: Math.round(hashtagDensity * 100) / 100,
  };
}

// Brands that should always get deep treatment
const PRIORITY_BRANDS = ['scex', 'kenkai'];

async function scrapeAllBrandUrls(brand: {
  name?: string;
  website_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
}): Promise<ScrapeResult[]> {
  const tasks: Promise<ScrapeResult>[] = [];

  // Check if this is a priority brand that deserves deep treatment
  const isPriorityBrand = brand.name &&
    PRIORITY_BRANDS.some(pb => brand.name!.toLowerCase().includes(pb));

  if (brand.website_url) {
    if (isPriorityBrand) {
      // Priority brands get deep crawl treatment
      tasks.push(scrapeWebsiteDeepWithDeepCrawl(brand.website_url));
    } else {
      tasks.push(scrapePlatform('website', brand.website_url));
    }
  }
  if (brand.instagram_url) {
    tasks.push(scrapePlatform('instagram', brand.instagram_url));
  }
  if (brand.facebook_url) {
    tasks.push(scrapePlatform('facebook', brand.facebook_url));
  }
  if (brand.linkedin_url) {
    tasks.push(scrapePlatform('linkedin', brand.linkedin_url));
  }

  return Promise.all(tasks);
}

/**
 * Deep crawl for priority brands - uses the full deep crawler
 */
async function scrapeWebsiteDeepWithDeepCrawl(url: string): Promise<ScrapeResult> {
  try {
    console.log(`[CopywritingAPI] Priority brand detected - using deep crawl for ${url}`);
    const pages = await deepCrawl(url, { maxPages: 30 }); // Extra pages for priority brands

    // Extract all text content from crawled pages
    const content = pages.map(page => {
      const parts: string[] = [];
      parts.push(`=== ${page.title} (${page.pageType}) ===`);
      if (page.extractedContent.meta.description) {
        parts.push(`Description: ${page.extractedContent.meta.description}`);
      }
      for (const h1 of page.extractedContent.headings.h1) {
        parts.push(`# ${h1}`);
      }
      for (const h2 of page.extractedContent.headings.h2) {
        parts.push(`## ${h2}`);
      }
      for (const p of page.extractedContent.paragraphs.slice(0, 15)) {
        parts.push(p);
      }
      return parts.join('\n');
    }).join('\n\n---\n\n');

    return {
      platform: 'website',
      success: true,
      content,
      contentType: 'deep-crawl',
      metadata: {
        pagesScraped: pages.length,
        pageTypes: pages.reduce((acc, p) => {
          acc[p.pageType] = (acc[p.pageType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        totalWords: pages.reduce((acc, p) => acc + p.wordCount, 0),
      },
    };
  } catch (error) {
    return { platform: 'website', success: false, error: getErrorMessage(error) };
  }
}

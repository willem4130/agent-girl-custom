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
  scrapeWebsite,
  scrapeWebsiteDeep,
  extractTextForAnalysis,
} from '../scraping/website-scraper';

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

  // GET /api/copywriting/brands - List all brands
  if (pathname === '/api/copywriting/brands' && req.method === 'GET') {
    try {
      const brands = copywritingDb.listBrandConfigs();
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
      const results = await scrapeAllBrandUrls(brand);

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
      return jsonResponse(profile);
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

      // Create placeholder profile (actual analysis would use Claude)
      const profile = copywritingDb.createVoiceProfile(brandId, {
        samples_analyzed: content.length,
        confidence_score: content.length >= 10 ? 0.8 : 0.5,
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

async function scrapeAllBrandUrls(brand: {
  website_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
}): Promise<ScrapeResult[]> {
  const tasks: Promise<ScrapeResult>[] = [];

  if (brand.website_url) {
    tasks.push(scrapePlatform('website', brand.website_url));
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

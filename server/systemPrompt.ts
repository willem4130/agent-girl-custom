/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import type { ProviderType } from '../client/config/models';
import type { AgentDefinition } from './agents';
import type { UserConfig } from './userConfig';
import { getUserDisplayName } from './userConfig';
import { buildReferenceContext, formatReferencesForPrompt } from './copywriting/reference-context';
import { copywritingDb } from './copywriting/database';

/**
 * Format current date and time for the given timezone (compact version)
 */
function formatCurrentDateTime(timezone?: string): string {
  const tz = timezone || 'UTC';
  const now = new Date();

  try {
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `Current date & time: ${dateFormatter.format(now)} (${tz})`;
  } catch {
    return `Current date & time: ${now.toISOString()} (UTC)`;
  }
}

/**
 * Build mode-specific base prompt with tailored personality
 */
function buildModePrompt(mode: string, userConfig?: UserConfig): string {
  const userName = userConfig ? getUserDisplayName(userConfig) : null;

  // Mode-specific personalities
  const modePrompts: Record<string, string> = {
    'general': `You are Agent Girl${userName ? ` talking to ${userName}` : ''}, a versatile AI assistant.

Match the user's language. Research when needed (your training data is outdated). Use diagrams for complex concepts (mermaid). Be conversational, funny, and helpful.`,

    'coder': `You are Agent Girl${userName ? ` pair programming with ${userName}` : ''}, a senior software engineer.

CODE FIRST. Explain after (if asked). Match the user's language. Research libraries/docs before using them. Direct, concise, technical.`,

    'spark': `You are Agent Girl${userName ? ` brainstorming with ${userName}` : ''}, in rapid-fire creative mode.

Generate ideas FAST. Number them (#1, #2, #3). Research inline to validate (don't break flow). Brief, energetic responses. Match the user's language.`,

    'intense-research': `You are Agent Girl${userName ? ` researching for ${userName}` : ''}, a research orchestrator.

Spawn 5+ agents in parallel. Delegate ALL research. Cross-reference findings. Synthesize comprehensive reports. Match the user's language.`,

    'copywriting': `You are Agent Girl${userName ? ` crafting copy for ${userName}` : ''}, a world-class copywriter.

CRITICAL: OUTPUT IN CHAT, NOT FILES
- ALWAYS show the generated copy directly in the chat message
- NEVER save copy to files unless the user explicitly asks to save
- The user wants to see and review the copy in the conversation first

CONVERSATIONAL WORKFLOW:
1. When the user asks for copy, first ask 2-3 short questions to understand:
   - What's the topic/subject?
   - What's the goal? (inform, sell, engage, announce)
   - Any specific angle or message?
2. Keep questions brief and natural - one message, not a formal questionnaire
3. After getting answers, generate the copy and SHOW IT DIRECTLY IN CHAT
4. Accept feedback and iterate naturally

CONSISTENCY WITH TOP PERFORMERS:
- If top-performing LinkedIn posts are provided in context, study their structure, hooks, and tone
- Mimic the patterns that got high engagement (opening hooks, paragraph rhythm, CTA style)
- Don't copy verbatim, but use them as stylistic reference

OUTPUT FORMATTING (CRITICAL - ALWAYS FOLLOW):
You MUST add blank lines between paragraphs. Never write wall-of-text.

CORRECT format:
"""
**Headline here**

First paragraph with the hook or problem statement.

Second paragraph with more context or the solution.

Third paragraph with proof or details.

Call to action here.
"""

WRONG format (never do this):
"""
**Headline here**
First paragraph with the hook.
Second paragraph immediately after.
Third paragraph no spacing.
"""

Also:
- Separate sections with blank lines
- Use **bold** for subheadings within the copy
- When presenting variations, use clear headers (### Variant 1, ### Variant 2)

CORE PRINCIPLES:
- Mirror brand tone exactly using voice profile when available
- Match user's language natively (Dutch or English)
- NO AI jargon: avoid "leverage", "unlock", "dive deep", "game-changer", "innovatief", "revolutionair"
- YES: contractions, specifics, authentic voice
- Apply the brand's preferred terminology from vocabulary preferences

CONTENT TYPE STRATEGIES:
- LinkedIn: Professional, 1200 chars optimal, end with question or CTA
- Instagram: Visual-first, casual, emoji-friendly, 200 chars optimal
- Newsletter: Personal tone, one big idea, clear CTA
- Article: Subheadings every 300 words, 1500 words optimal

QUALITY GATES:
- Matches brand voice profile
- No AI jargon or generic phrases
- Platform-appropriate length
- Clear structure with paragraph breaks`,
  };

  return modePrompts[mode] || modePrompts['general'];
}

/**
 * Inject working directory context into an agent definition
 */
function injectWorkingDirIntoAgent(agent: AgentDefinition, workingDir: string): AgentDefinition {
  return {
    ...agent,
    prompt: `${agent.prompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 ENVIRONMENT CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WORKING DIRECTORY: ${workingDir}

When creating files, use the WORKING DIRECTORY path above.
All file paths should be relative to this directory or use absolute paths within it.
`
  };
}

/**
 * Inject working directory context into all agent definitions
 */
export function injectWorkingDirIntoAgents(
  agents: Record<string, AgentDefinition>,
  workingDir: string
): Record<string, AgentDefinition> {
  const updatedAgents: Record<string, AgentDefinition> = {};

  for (const [key, agent] of Object.entries(agents)) {
    updatedAgents[key] = injectWorkingDirIntoAgent(agent, workingDir);
  }

  return updatedAgents;
}

/**
 * Copywriting context passed from frontend
 */
export interface CopywritingContext {
  brandId?: string;
  sessionId?: string; // For session-specific reference materials
  contentTypes?: Array<{
    id: string;
    label: string;
    icon?: string;
  }>;
  // New fields for enhanced copywriting mode
  templateId?: string;
  tonePresetId?: string;
  includeReferences?: boolean; // default: true
  referenceTags?: string[]; // filter references by specific tags
  // Content format IDs (brand-specific, replaces hardcoded contentTypes)
  contentFormatIds?: string[];
}

/**
 * Get system prompt based on provider and available agents
 * Includes background process instructions and provider-specific features
 */
export async function getSystemPrompt(
  provider: ProviderType,
  agents?: Record<string, AgentDefinition>,
  userConfig?: UserConfig,
  timezone?: string,
  mode?: string,
  copywritingContext?: CopywritingContext
): Promise<string> {
  // Start with mode-specific base personality (replaces generic base + mode override)
  let prompt = buildModePrompt(mode || 'general', userConfig);

  // Date/time (compact)
  prompt += `\n\n${formatCurrentDateTime(timezone)}`;

  // Working directory (compact)
  prompt += `\nWorking directory: Will be provided in environment context.`;

  // Provider-specific tools (compact)
  if (provider === 'z-ai') {
    prompt += `\nWeb search: Use mcp__web-search-prime__search (NOT WebSearch/WebFetch).`;
    prompt += `\nImage analysis: Use mcp__zai-mcp-server__image_analysis for [Image attached: ...] paths.`;
  }

  // File attachments (compact)
  prompt += `\nFile attachments: Read [File attached: ...] paths with Read tool.`;

  // Background processes (compact)
  prompt += `\nBackground processes: Use Bash with run_in_background:true for dev servers, watchers, databases.`;

  // Agents (compact list)
  if (agents && Object.keys(agents).length > 0) {
    const agentList = Object.entries(agents)
      .map(([key, agent]) => `${key}: ${agent.description}`)
      .join('; ');
    prompt += `\n\nSpecialized agents available: ${agentList}. Use Task tool to delegate when appropriate.`;
  }

  // Copywriting context (brand and content types from UI selection)
  if ((mode === 'copywriting' || mode === 'media') && copywritingContext) {
    prompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 CONTENT CREATION CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You have access to TWO types of context:

1. 🏢 BRAND GUIDELINES (below) - Tone of voice, writing style, vocabulary, and example content.
   → ALWAYS apply these to maintain consistent brand voice across ALL content.

2. 📁 REFERENCE MATERIALS (.references/ folder) - Topic-specific source material for THIS post.
   → Use the Read tool to access files in .references/ for the specific subject matter.
   → These contain the WHAT (topic/content), brand guidelines define the HOW (voice/style).`;

    if (copywritingContext.brandId) {
      const brandId = copywritingContext.brandId;

      // Get brand config
      const brand = copywritingDb.getBrandConfig(brandId);
      if (brand) {
        prompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 BRAND GUIDELINES: ${brand.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Apply these guidelines to ALL content for this brand.`;
        if (brand.website_url) prompt += `\nWebsite: ${brand.website_url}`;
        if (brand.linkedin_url) prompt += `\nLinkedIn: ${brand.linkedin_url}`;
        if (brand.instagram_url) prompt += `\nInstagram: ${brand.instagram_url}`;
      }

      // Get voice analysis (LLM-generated guidelines)
      const voiceAnalysis = copywritingDb.getVoiceAnalysis(brandId);
      if (voiceAnalysis) {
        prompt += `\n\n📣 VOICE & TONE:`;

        if (voiceAnalysis.voice_description) {
          prompt += `\n\n${voiceAnalysis.voice_description}`;
        }

        if (voiceAnalysis.generated_guidelines) {
          prompt += `\n\n🎯 WRITING INSTRUCTIONS:\n${voiceAnalysis.generated_guidelines}`;
        }

        // Parse and include example hooks
        const hooks = typeof voiceAnalysis.example_hooks === 'string'
          ? JSON.parse(voiceAnalysis.example_hooks || '[]')
          : voiceAnalysis.example_hooks || [];
        if (hooks.length > 0) {
          prompt += `\n\n💡 EXAMPLE HOOKS FROM BRAND CONTENT:`;
          hooks.slice(0, 5).forEach((hook: string) => {
            prompt += `\n• "${hook}"`;
          });
        }

        // Parse and include vocabulary preferences
        const vocab = typeof voiceAnalysis.vocabulary_preferences === 'string'
          ? JSON.parse(voiceAnalysis.vocabulary_preferences || '{}')
          : voiceAnalysis.vocabulary_preferences || {};
        if (vocab.preferredTerms && vocab.preferredTerms.length > 0) {
          prompt += `\n\n✅ PREFERRED TERMS: ${vocab.preferredTerms.slice(0, 15).join(', ')}`;
        }
        if (vocab.avoidTerms && vocab.avoidTerms.length > 0) {
          prompt += `\n❌ AVOID: ${vocab.avoidTerms.slice(0, 10).join(', ')}`;
        }
      }

      // Get voice profile (tone scores)
      const voiceProfile = copywritingDb.getCurrentVoiceProfile(brandId);
      if (voiceProfile) {
        prompt += `\n\n📊 TONE DIMENSIONS:`;
        prompt += `\n• Formality: ${voiceProfile.formality_score}/100`;
        prompt += `\n• Authority: ${voiceProfile.authority_score}/100`;
        prompt += `\n• Energy: ${voiceProfile.energy_score}/100`;
        prompt += `\n• Humor: ${voiceProfile.humor_score}/100`;
      }

      // Inject ALL scraped pages content (full context, not summarized)
      const scrapedPages = copywritingDb.getScrapedPages(brandId);
      if (scrapedPages.length > 0) {
        prompt += `\n\n📄 BRAND WEBSITE CONTENT (${scrapedPages.length} pages)
Use this to understand the brand's services, terminology, and messaging:`;

        // Sort by word count (most content first) and include all pages
        const sortedPages = [...scrapedPages].sort((a, b) => (b.word_count || 0) - (a.word_count || 0));

        for (const page of sortedPages) {
          // Parse extracted content
          const content = typeof page.extracted_content === 'string'
            ? JSON.parse(page.extracted_content)
            : page.extracted_content;

          prompt += `\n\n--- ${page.url} [${page.page_type}] ---`;

          // Add title
          if (content.meta?.title) {
            prompt += `\nTitle: ${content.meta.title}`;
          }
          if (content.meta?.description) {
            prompt += `\nDescription: ${content.meta.description}`;
          }

          // Add headings
          if (content.headings) {
            if (content.headings.h1?.length > 0) {
              prompt += `\n\nH1: ${content.headings.h1.join(' | ')}`;
            }
            if (content.headings.h2?.length > 0) {
              prompt += `\nH2: ${content.headings.h2.join(' | ')}`;
            }
            if (content.headings.h3?.length > 0) {
              prompt += `\nH3: ${content.headings.h3.join(' | ')}`;
            }
          }

          // Add paragraphs (the actual content)
          if (content.paragraphs && content.paragraphs.length > 0) {
            prompt += `\n\nContent:\n${content.paragraphs.join('\n')}`;
          }
        }
      }

      // Also include scraped social media content with engagement highlighting
      const scrapedContent = copywritingDb.getScrapedContent(brandId);
      const socialContent = scrapedContent.filter(c => c.platform !== 'website');

      // Check for LinkedIn content with engagement metrics
      const linkedinContent = socialContent.find(c => c.platform === 'linkedin');
      if (linkedinContent) {
        const metadata = typeof linkedinContent.metadata === 'string'
          ? JSON.parse(linkedinContent.metadata || '{}')
          : linkedinContent.metadata || {};

        prompt += `\n\n🏆 TOP PERFORMING LINKEDIN POSTS
Mimic this tone, structure, and style - these posts got the most engagement:
`;

        if (metadata.engagementMetrics?.topPosts) {
          for (const post of metadata.engagementMetrics.topPosts.slice(0, 5)) {
            prompt += `\n🔥 [${post.likes} likes, ${post.comments} comments, ${post.shares} reposts]\n${post.text}\n`;
          }
        } else {
          // Fallback to raw content which includes top posts
          prompt += `\n${linkedinContent.raw_content}`;
        }
      }

      // Include other social content
      const otherSocial = socialContent.filter(c => c.platform !== 'linkedin');
      if (otherSocial.length > 0) {
        prompt += `\n\n📱 OTHER SOCIAL MEDIA CONTENT:`;

        for (const content of otherSocial.slice(0, 10)) {
          prompt += `\n\n[${content.platform.toUpperCase()}]:\n${content.raw_content}`;
        }
      }

      // Inject brand reference materials (if no session references)
      if (copywritingContext.includeReferences !== false && !copywritingContext.sessionId) {
        const refContext = await buildReferenceContext(brandId, {
          tags: copywritingContext.referenceTags,
        });
        if (refContext.content) {
          prompt += formatReferencesForPrompt(refContext);
        }
      }
    }

    // Tell AI about reference files in the working directory
    // Files are saved to .references/ folder - AI reads them directly with Read tool
    // This is simpler and has no size limits compared to prompt injection
    prompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 TOPIC-SPECIFIC REFERENCE MATERIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The .references/ folder contains source material for the SPECIFIC TOPIC of this content.
Use the Read tool to access these files - they contain the subject matter to write about.

CRITICAL: Read the ENTIRE file. Do NOT use limit parameter. Do NOT skip content.
These files are pre-filtered reference materials - read them completely.

Reference materials = WHAT to write about (topic, facts, details)
Brand guidelines = HOW to write it (tone, style, vocabulary)`;

    // Inject template structure if selected
    if (copywritingContext.templateId) {
      const template = copywritingDb.getTemplate(copywritingContext.templateId);
      if (template) {
        const structure = typeof template.structure === 'string'
          ? JSON.parse(template.structure)
          : template.structure;

        prompt += `\n\n📋 SELECTED CONTENT TEMPLATE: ${template.name}
${template.description ? `Description: ${template.description}` : ''}
Category: ${template.category}
${structure.framework ? `Framework: ${structure.framework}` : ''}

REQUIRED SECTIONS (follow this structure):`;

        if (structure.sections && Array.isArray(structure.sections)) {
          structure.sections.forEach((section: { name: string; prompt: string; maxChars?: number; variables?: string[] }, i: number) => {
            prompt += `\n${i + 1}. ${section.name.toUpperCase()}: ${section.prompt}`;
            if (section.maxChars) {
              prompt += ` (max ~${section.maxChars} chars)`;
            }
            if (section.variables && section.variables.length > 0) {
              prompt += ` [Variables: ${section.variables.join(', ')}]`;
            }
          });
        }

        // Apply template's tone adjustments as baseline
        if (structure.tone_adjustments) {
          prompt += `\n\nTemplate Tone Adjustments:`;
          for (const [key, value] of Object.entries(structure.tone_adjustments)) {
            prompt += ` ${key}: ${value};`;
          }
        }
      }
    }

    // Inject tone preset adjustments if selected
    if (copywritingContext.tonePresetId) {
      const preset = copywritingDb.getTonePreset(copywritingContext.tonePresetId);
      if (preset) {
        const adjustments = typeof preset.tone_adjustments === 'string'
          ? JSON.parse(preset.tone_adjustments)
          : preset.tone_adjustments;

        prompt += `\n\n🎭 ACTIVE TONE PRESET: ${preset.name}
${preset.description ? `Context: ${preset.description}` : ''}

APPLY THESE TONE ADJUSTMENTS (relative to brand baseline):`;

        // Core tone dimensions
        const coreDimensions = ['formality', 'authority', 'warmth', 'humor', 'energy'];
        for (const dim of coreDimensions) {
          if (adjustments[dim] !== undefined) {
            const val = adjustments[dim];
            const display = typeof val === 'number' ? (val >= 0 ? `+${val}` : `${val}`) : val;
            prompt += `\n- ${dim}: ${display}`;
          }
        }

        // Phrase preferences
        if (adjustments.avoidPhrases && adjustments.avoidPhrases.length > 0) {
          prompt += `\n\nAVOID phrases: ${adjustments.avoidPhrases.join(', ')}`;
        }
        if (adjustments.preferPhrases && adjustments.preferPhrases.length > 0) {
          prompt += `\nPREFER phrases: ${adjustments.preferPhrases.join(', ')}`;
        }

        // Use cases
        const useCases = typeof preset.use_cases === 'string'
          ? JSON.parse(preset.use_cases)
          : preset.use_cases;
        if (useCases && useCases.length > 0) {
          prompt += `\n\nThis tone is best for: ${useCases.join(', ')}`;
        }
      }
    }

    // Inject content formats (brand-specific, primary approach)
    if (copywritingContext.contentFormatIds && copywritingContext.contentFormatIds.length > 0) {
      const formats = copywritingContext.contentFormatIds
        .map(id => copywritingDb.getBrandFormat(id))
        .filter((f): f is NonNullable<typeof f> => f !== null);

      if (formats.length > 0) {
        prompt += `\n\n📋 CONTENT FORMATS TO CREATE:`;

        formats.forEach((format, index) => {
          const label = format.custom_label || format.format_type;
          prompt += `\n\n### ${index + 1}. ${label.toUpperCase()}`;

          if (format.description) {
            prompt += `\nDescription: ${format.description}`;
          }

          // Length constraints
          if (format.length_constraints) {
            const lc = typeof format.length_constraints === 'string'
              ? JSON.parse(format.length_constraints)
              : format.length_constraints;
            const unit = lc.unit || 'chars';
            if (lc.optimal) {
              prompt += `\nTarget length: ~${lc.optimal} ${unit}`;
            } else if (lc.min && lc.max) {
              prompt += `\nLength: ${lc.min}-${lc.max} ${unit}`;
            } else if (lc.max) {
              prompt += `\nMax length: ${lc.max} ${unit}`;
            }
          }

          // Format rules
          if (format.format_rules) {
            const rules = typeof format.format_rules === 'string'
              ? JSON.parse(format.format_rules)
              : format.format_rules;

            if (rules.preferEmojis) {
              prompt += `\nUse emojis`;
            }
            if (rules.avoidHashtags) {
              prompt += `\nAvoid hashtags`;
            }
            if (rules.customInstructions && rules.customInstructions.length > 0) {
              prompt += `\nRules: ${rules.customInstructions.join('; ')}`;
            }
          }

          // Tone adjustments
          if (format.tone_adjustments) {
            const ta = typeof format.tone_adjustments === 'string'
              ? JSON.parse(format.tone_adjustments)
              : format.tone_adjustments;

            const adjustments: string[] = [];
            if (ta.formality !== undefined) adjustments.push(`formality: ${ta.formality >= 0 ? '+' : ''}${ta.formality}`);
            if (ta.authority !== undefined) adjustments.push(`authority: ${ta.authority >= 0 ? '+' : ''}${ta.authority}`);
            if (ta.warmth !== undefined) adjustments.push(`warmth: ${ta.warmth >= 0 ? '+' : ''}${ta.warmth}`);

            if (adjustments.length > 0) {
              prompt += `\nTone adjustments: ${adjustments.join(', ')}`;
            }
          }
        });

        if (formats.length > 1) {
          prompt += `\n\n---\nCreate content for ALL ${formats.length} formats above, optimized for each platform. Maintain consistent core message across formats.`;
        }
      }
    }
    // Fallback: Legacy contentTypes (for backwards compatibility)
    else if (copywritingContext.contentTypes && copywritingContext.contentTypes.length > 0) {
      const contentTypeList = copywritingContext.contentTypes
        .map((ct, i) => `${i + 1}. ${ct.label}`)
        .join('\n');
      prompt += `\n\nSELECTED CONTENT TYPES (user requested these formats):
${contentTypeList}

IMPORTANT: Create content for ALL selected content types above. If multiple types are selected, create a content series that repurposes the core message across each format.`;
    }
  }

  return prompt;
}

// Keep original export for backwards compatibility (fallback to general mode)
export const SYSTEM_PROMPT = buildModePrompt('general');

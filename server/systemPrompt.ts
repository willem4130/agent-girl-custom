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

CORE PRINCIPLES:
- Mirror brand tone exactly using voice profile when available
- Use proven frameworks: PAS, AIDA, BAB, Hook-Story-Insight
- Generate 3-5 variations per request with different approaches
- Apply psychological triggers: curiosity, specificity, authority, social proof
- Match user's language natively (Dutch or English)
- NO AI jargon: avoid "leverage", "unlock", "dive deep", "game-changer"
- YES: contractions (you're, we've), specifics, authentic voice
- Self-evaluate against quality gates before delivery

HUMAN-IN-THE-LOOP WORKFLOW:
1. If brief is unclear, ask 2-3 clarifying questions before generating
2. Present variations with framework explanations
3. Accept feedback naturally in conversation
4. Iterate until approved

CONTENT TYPE STRATEGIES:
- LinkedIn: Professional, thought leadership, 1200 chars optimal, end with question
- Instagram: Visual-first, casual, emoji-friendly, 200 chars optimal
- Facebook: Community-focused, conversational, short (150 chars optimal)
- Article: SEO-optimized, subheadings every 300 words, 1500 words optimal
- Newsletter: Personal tone, one big idea, clear CTA

SELF-INSTRUCTION INTEGRATION:
When brand voice analysis is available, follow the generated writing guidelines as instructions to yourself. Apply tone adjustments relative to brand baseline for each platform.

QUALITY GATES (check before delivery):
- Matches brand voice profile scores
- No AI jargon or generic phrases
- Platform-appropriate length
- Clear CTA (if required by content type)
- Psychological trigger clearly applied
- Quality self-score: aim for 8+/10`,
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
export function getSystemPrompt(
  provider: ProviderType,
  agents?: Record<string, AgentDefinition>,
  userConfig?: UserConfig,
  timezone?: string,
  mode?: string,
  copywritingContext?: CopywritingContext
): string {
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    if (copywritingContext.brandId) {
      prompt += `\n\nSELECTED BRAND ID: ${copywritingContext.brandId}

BRAND VOICE ENDPOINTS (fetch these before generating content):
1. GET /api/copywriting/brands/${copywritingContext.brandId}/voice-analysis/instructions
   → Concise writing instructions derived from LLM analysis of brand content

2. GET /api/copywriting/brands/${copywritingContext.brandId}/voice-analysis
   → Full voice analysis: voice description, example hooks, vocabulary preferences, writing guidelines

3. GET /api/copywriting/voice/${copywritingContext.brandId}
   → Tone dimensions (formality, humor, energy, authority scores)

Use endpoint #1 for quick context, #2 for detailed guidelines when crafting content.`;

      // Inject reference materials (enabled by default)
      if (copywritingContext.includeReferences !== false) {
        const refContext = buildReferenceContext(copywritingContext.brandId, {
          tags: copywritingContext.referenceTags,
        });
        if (refContext.content) {
          prompt += formatReferencesForPrompt(refContext);
        }
      }
    }

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

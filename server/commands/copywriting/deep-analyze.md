# /deep-analyze - Deep Brand Analysis

## What This Does
Performs a comprehensive analysis of a brand's content across all configured platforms using deep web crawling and LLM-powered voice analysis.

## How to Use
/deep-analyze [brand name or URL]

Examples:
/deep-analyze (analyzes currently selected brand)
/deep-analyze ExampleBrand
/deep-analyze https://example.com

## What Gets Analyzed

### Website Deep Crawl
- Up to 25 pages (configurable up to 100)
- Automatic sitemap discovery
- Smart URL prioritization (/about, /services, /blog first)
- Page type classification
- Content extraction (headings, paragraphs, meta, structured data)
- robots.txt compliance

### Social Media (if configured)
- Instagram: Profile bio + recent posts
- LinkedIn: Company page + posts
- Facebook: Page info + posts

## Analysis Output

### Voice Description
A narrative description of the brand's unique voice and personality.

### Tone Dimensions (0-100 scores)
- **Formality**: Casual → Formal
- **Humor**: Serious → Playful
- **Energy**: Calm → Energetic
- **Authority**: Humble → Authoritative
- **Warmth**: Professional → Personal
- **Directness**: Indirect → Direct

### Writing Style Patterns
- Sentence structures
- Common transitions
- Opening patterns
- Closing patterns
- Paragraph length

### Vocabulary Preferences
- Preferred words (frequently used)
- Words to avoid
- Brand-specific terms
- Industry jargon

### Extracted Examples
- 5-10 effective hooks from actual content
- Strong CTAs found
- Persuasive phrases

### Writing Guidelines
LLM-generated self-instruction guide for writing in this brand's voice.

## Usage Notes
- Deep analysis takes 1-3 minutes depending on website size
- Results are stored for future content generation
- Re-run periodically to capture voice evolution
- Use for new brands or when brand voice needs refresh

## Follow-up Actions
After deep analysis, you can:
- Use /create to generate content in brand voice
- Use /social for quick social posts
- Ask questions about the brand voice

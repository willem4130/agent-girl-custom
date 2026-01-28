# /create - Guided Content Creation

## What This Does
Launches a guided content creation workflow with clarifying questions to ensure high-quality output.

## How to Use
/create [content type]

Available content types:
- `linkedin` - LinkedIn thought leadership post
- `instagram` - Instagram visual caption
- `facebook` - Facebook community post
- `article` - Long-form blog/article
- `newsletter` - Email newsletter
- `custom` - Any format

Examples:
/create linkedin
/create instagram our new product launch
/create article about sustainable fashion trends

## Workflow Steps

### Step 1: Clarification (Agent asks 2-3 questions if brief is unclear)
- What is the main topic/angle?
- Who is the target audience?
- What action should readers take?

### Step 2: Generation
- Generate 3-5 variations using different frameworks
- Apply brand voice profile if available
- Use platform-specific tone adjustments

### Step 3: Refinement
- Present variations with explanations
- Accept feedback in chat
- Iterate until approved

## Platform-Specific Frameworks

**LinkedIn (Hook-Story-Insight)**
- Bold opening hook
- Personal story/observation
- Key insight with takeaway
- Engagement question

**Instagram (Hook-Value-CTA)**
- First line visible in feed - make it count
- Brief value/story
- Clear CTA with emojis

**Facebook (Story-Based)**
- Relatable opening
- Quick narrative
- Discussion prompt

**Article (Problem-Solution)**
- SEO-optimized headline
- Clear problem statement
- Comprehensive solution
- Actionable takeaways

**Newsletter (One Big Idea)**
- Personal opening
- Single valuable insight
- Story/example
- Personal sign-off

## Output Format
For each variation:
- **Framework**: [Framework used]
- **Length**: [Character/word count]
- **Copy**: [The actual content]
- **Why it works**: [Brief explanation]

## Quality Gates Applied
- Matches brand voice profile
- No AI jargon (leverage, unlock, dive deep)
- Platform-appropriate length
- Clear CTA (if required)
- Self-evaluated quality score

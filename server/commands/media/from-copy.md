# /from-copy - Generate Media from Copywriting Content

## Purpose
Generate images or videos based on existing copy from Copywriting mode.

## Usage
```
/from-copy [copy-text-or-id]
```

## Arguments
- `copy-text-or-id` (optional): Either the copy ID from the database or paste the copy text directly

## Workflow

1. **Identify the Copy**
   - If an ID is provided, fetch the copy from the Content Hub
   - If text is provided, analyze it directly
   - If neither, ask the user to provide copy or select from recent content

2. **Analyze the Copy**
   - Extract key themes and messages
   - Identify emotional tone (energetic, calm, professional, playful)
   - Detect product/service focus
   - Note any specific visual cues mentioned

3. **Generate Visual Concept**
   - Create a prompt that complements (not duplicates) the message
   - Match the copy's tone with appropriate visual style
   - Suggest aspect ratio based on copy's intended platform

4. **Confirm with User**
   - Present the proposed visual direction
   - Offer style preset options
   - Ask for any adjustments before generating

## Example Interaction

**User**: /from-copy "Transform your morning routine with our premium coffee blend. Wake up to perfection."

**Assistant**: I'll create a visual that complements this coffee copy.

**Analysis**:
- Theme: Premium morning coffee experience
- Tone: Sophisticated, aspirational
- Focus: Coffee product, morning transformation

**Proposed Visual**:
- Style: Lifestyle photography, warm morning light
- Scene: Steam rising from a premium coffee cup, golden hour lighting
- Mood: Cozy, inviting, elevated everyday moment

**Recommended Settings**:
- Aspect Ratio: 1:1 (Instagram) or 4:5 (Facebook/Instagram)
- Style Preset: Photoshoot or Lifestyle
- Provider: Seedream (best for product lifestyle)

Shall I generate this image, or would you like to adjust the direction?

## Notes
- Creates automatic link between generated media and source copy in Content Hub
- Platform-optimized aspect ratios based on copy metadata
- Maintains visual consistency with brand's visual style settings

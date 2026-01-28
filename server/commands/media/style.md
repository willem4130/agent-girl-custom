# /style - Configure Brand Visual Style

## Purpose
Set up and manage brand visual identity settings for consistent media generation.

## Usage
```
/style [subcommand]
```

## Subcommands

### `/style setup`
Interactive wizard to configure brand visual style:
- Primary and secondary brand colors
- Logo URL and preferred placement
- Default style presets (photoshoot, minimal, corporate, etc.)
- Default aspect ratios for different platforms
- Anti-AI detection preferences
- Negative prompts (things to always avoid)

### `/style show`
Display current visual style configuration for the brand.

### `/style colors [hex-codes...]`
Set brand colors.
```
/style colors #6B5CE7 #A855F7 #ffffff
```

### `/style logo [url]`
Set logo URL for overlays.
```
/style logo https://example.com/logo.png
```

### `/style preset [preset-name]`
Set default style preset.
Available presets: photoshoot, minimal, corporate, lifestyle, product, social-media, editorial, cinematic, documentary

### `/style aspect [ratio]`
Set default aspect ratio.
Common ratios: 1:1, 16:9, 9:16, 4:3, 4:5

### `/style anti-ai [on|off]`
Toggle anti-AI detection techniques.

## Example Interaction

**User**: /style setup

**Assistant**: Let's configure your brand's visual style for consistent media generation.

**Step 1: Brand Colors**
What are your primary brand colors? You can provide hex codes or describe them.

*User provides colors*

**Step 2: Style Preference**
What visual style best represents your brand?
1. Photoshoot - Professional product photography
2. Minimal - Clean, simple compositions
3. Corporate - Business-professional look
4. Lifestyle - Authentic, everyday moments
5. Cinematic - Dramatic, movie-like quality

*User selects*

**Step 3: Platform Focus**
Which platforms do you primarily create content for?
- Instagram (1:1, 4:5, 9:16)
- LinkedIn (16:9, 1:1)
- TikTok/Reels (9:16)
- YouTube (16:9)
- Website/Blog (16:9, 4:3)

*User selects*

**Step 4: Anti-AI Detection**
Would you like to apply techniques to make images look more authentic and less AI-generated?
- Film grain and texture
- Natural lighting imperfections
- Environmental context

*User confirms*

**Summary**:
Your visual style is now configured:
- Colors: #6B5CE7 (primary), #A855F7 (secondary)
- Style: Lifestyle
- Default Ratio: 4:5 (Instagram optimized)
- Anti-AI: Enabled

All future media generations will use these settings by default.

## Notes
- Settings are saved per brand
- Can be overridden for individual generations
- Colors are used for prompt enhancement and consistency guidance

/**
 * Advanced Style Templates
 *
 * Sophisticated style builders for different visual aesthetics.
 * Each builder takes specific inputs and produces optimized prompts
 * with appropriate negative prompts.
 *
 * Ported from image-prompt-generator project.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PromptOutput {
  prompt: string;
  negativePrompt: string;
  characterCount: number;
}

// Photoshoot Style
export interface PhotoshootInput {
  subject: string;
  setting?: string;
  lighting?: 'studio' | 'natural' | 'golden-hour' | 'dramatic' | 'soft';
  camera?: string; // e.g., "Canon EOS R5", "Hasselblad"
  lens?: string; // e.g., "85mm f/1.4", "50mm"
  mood?: string;
}

// Anime Style
export interface AnimeInput {
  subject: string;
  style?: 'modern' | 'classic' | 'chibi' | 'realistic';
  studio?: string; // e.g., "Studio Ghibli", "Kyoto Animation"
  mood?: string;
  setting?: string;
}

// Cartoon Style
export interface CartoonInput {
  subject: string;
  style?: 'pixar' | 'disney' | 'looney-tunes' | 'modern' | 'retro';
  mood?: 'happy' | 'adventurous' | 'dramatic' | 'comedic';
  setting?: string;
}

// 3D Render Style
export interface ThreeDRenderInput {
  subject: string;
  engine?: 'octane' | 'vray' | 'cycles' | 'unreal';
  lighting?: 'studio' | 'hdri' | 'dramatic' | 'soft';
  materials?: string[];
  setting?: string;
}

// Illustration Style
export interface IllustrationInput {
  subject: string;
  medium?: 'digital' | 'watercolor' | 'ink' | 'pencil' | 'vector';
  style?: 'editorial' | 'book' | 'concept-art' | 'fashion';
  artistRef?: string;
  mood?: string;
}

// Cyberpunk Style
export interface CyberpunkInput {
  subject: string;
  elements?: ('neon' | 'rain' | 'holograms' | 'augmentations' | 'cityscape')[];
  mood?: 'dark' | 'vibrant' | 'gritty' | 'sleek';
  setting?: string;
}

// Pixel Art Style
export interface PixelArtInput {
  subject: string;
  bitDepth?: '8-bit' | '16-bit' | '32-bit';
  palette?: 'gameboy' | 'nes' | 'snes' | 'custom';
  style?: 'retro' | 'modern' | 'isometric';
}

// Cinematic Photography Style
export interface CinematicInput {
  subject: string;
  filmStock?: string; // e.g., "Kodak Portra 400", "Fuji Velvia"
  director?: string; // e.g., "Wes Anderson", "Roger Deakins"
  aspect?: '2.35:1' | '1.85:1' | '16:9';
  mood?: string;
}

// Watercolor Style
export interface WatercolorInput {
  subject: string;
  technique?: 'wet-on-wet' | 'dry-brush' | 'loose' | 'detailed';
  paperType?: 'hot-press' | 'cold-press' | 'rough';
  palette?: 'vibrant' | 'muted' | 'pastel' | 'earth-tones';
}

// ============================================================================
// STYLE BUILDERS
// ============================================================================

/**
 * Build a professional photoshoot-style prompt
 */
export function buildPhotoshootPrompt(input: PhotoshootInput): PromptOutput {
  const parts: string[] = [];

  // Core subject
  parts.push(input.subject);

  // Setting
  if (input.setting) {
    parts.push(input.setting);
  }

  // Lighting
  const lightingMap: Record<string, string> = {
    'studio': 'professional studio lighting, softbox lighting, rim light',
    'natural': 'natural lighting, window light, soft shadows',
    'golden-hour': 'golden hour lighting, warm sunlight, soft glow',
    'dramatic': 'dramatic lighting, strong shadows, high contrast',
    'soft': 'soft diffused lighting, even illumination, minimal shadows',
  };
  parts.push(lightingMap[input.lighting || 'natural']);

  // Camera/lens
  if (input.camera) {
    parts.push(`shot on ${input.camera}`);
  }
  if (input.lens) {
    parts.push(`${input.lens} lens`);
  }

  // Mood
  if (input.mood) {
    parts.push(`${input.mood} mood`);
  }

  // Quality markers
  parts.push(
    'professional photography',
    'high-end commercial photography',
    'sharp focus',
    '8K resolution',
    'realistic skin texture',
    'subtle film grain'
  );

  // Anti-plastic additions for realism
  parts.push(
    'natural skin pores',
    'subsurface scattering',
    'imperfect skin',
    'authentic expression'
  );

  const prompt = parts.join(', ');

  const negativePrompt = [
    'plastic skin',
    'airbrushed',
    'overly smooth',
    'wax figure',
    'mannequin',
    'uncanny valley',
    'blurry',
    'low quality',
    'amateur',
    'overexposed',
    'underexposed',
    'distorted features',
    'asymmetrical',
  ].join(', ');

  return {
    prompt,
    negativePrompt,
    characterCount: prompt.length,
  };
}

/**
 * Build an anime-style prompt
 */
export function buildAnimePrompt(input: AnimeInput): PromptOutput {
  const parts: string[] = [];

  // Quality tags (common in anime generation)
  parts.push('masterpiece', 'best quality', 'high resolution');

  // Core subject
  parts.push(input.subject);

  // Style variant
  const styleMap: Record<string, string> = {
    'modern': 'modern anime style, clean lines, vibrant colors',
    'classic': 'classic anime style, 90s anime aesthetic',
    'chibi': 'chibi style, cute, big head, small body',
    'realistic': 'realistic anime, semi-realistic, detailed features',
  };
  parts.push(styleMap[input.style || 'modern']);

  // Studio reference
  if (input.studio) {
    parts.push(`${input.studio} style`);
  }

  // Setting
  if (input.setting) {
    parts.push(input.setting);
  }

  // Mood
  if (input.mood) {
    parts.push(`${input.mood} atmosphere`);
  }

  // Technical quality
  parts.push(
    'detailed anime art',
    'beautiful eyes',
    'detailed hair',
    'dynamic pose'
  );

  const prompt = parts.join(', ');

  const negativePrompt = [
    'lowres',
    'bad anatomy',
    'bad hands',
    'text',
    'error',
    'missing fingers',
    'extra digit',
    'fewer digits',
    'cropped',
    'worst quality',
    'low quality',
    'normal quality',
    'jpeg artifacts',
    'signature',
    'watermark',
    'username',
    'blurry',
    'ugly',
    'duplicate',
    'morbid',
    'mutilated',
  ].join(', ');

  return {
    prompt,
    negativePrompt,
    characterCount: prompt.length,
  };
}

/**
 * Build a cartoon-style prompt
 */
export function buildCartoonPrompt(input: CartoonInput): PromptOutput {
  const parts: string[] = [];

  // Core subject
  parts.push(input.subject);

  // Style variant
  const styleMap: Record<string, string> = {
    'pixar': 'Pixar 3D animation style, smooth render, expressive characters',
    'disney': 'Disney animation style, fluid movement, magical atmosphere',
    'looney-tunes': 'classic Looney Tunes style, exaggerated expressions, slapstick energy',
    'modern': 'modern cartoon style, bold outlines, flat colors',
    'retro': 'vintage cartoon style, limited color palette, classic animation',
  };
  parts.push(styleMap[input.style || 'modern']);

  // Mood
  const moodMap: Record<string, string> = {
    'happy': 'cheerful, bright colors, joyful expression',
    'adventurous': 'dynamic pose, action lines, exciting atmosphere',
    'dramatic': 'dramatic lighting, intense expression, high stakes',
    'comedic': 'funny expression, humorous situation, comedic timing',
  };
  if (input.mood) {
    parts.push(moodMap[input.mood]);
  }

  // Setting
  if (input.setting) {
    parts.push(input.setting);
  }

  // Quality
  parts.push(
    'cartoon illustration',
    'vibrant colors',
    'clean lines',
    'expressive characters'
  );

  const prompt = parts.join(', ');

  const negativePrompt = [
    'realistic',
    'photorealistic',
    'uncanny valley',
    'creepy',
    'dark',
    'scary',
    'violent',
    'low quality',
    'blurry',
    'amateur',
    'sketch',
    'unfinished',
  ].join(', ');

  return {
    prompt,
    negativePrompt,
    characterCount: prompt.length,
  };
}

/**
 * Build a 3D render-style prompt
 */
export function buildThreeDRenderPrompt(input: ThreeDRenderInput): PromptOutput {
  const parts: string[] = [];

  // Core subject
  parts.push(input.subject);

  // Render engine
  const engineMap: Record<string, string> = {
    'octane': 'Octane render, photorealistic, ray tracing',
    'vray': 'V-Ray render, architectural visualization, precise lighting',
    'cycles': 'Blender Cycles render, path tracing, realistic materials',
    'unreal': 'Unreal Engine 5, real-time ray tracing, Nanite geometry',
  };
  parts.push(engineMap[input.engine || 'octane']);

  // Lighting
  const lightingMap: Record<string, string> = {
    'studio': 'studio lighting setup, three-point lighting',
    'hdri': 'HDRI environment lighting, natural reflections',
    'dramatic': 'dramatic rim lighting, volumetric lighting',
    'soft': 'soft ambient lighting, global illumination',
  };
  parts.push(lightingMap[input.lighting || 'studio']);

  // Materials
  if (input.materials && input.materials.length > 0) {
    parts.push(`PBR materials: ${input.materials.join(', ')}`);
  }

  // Setting
  if (input.setting) {
    parts.push(input.setting);
  }

  // Quality
  parts.push(
    '8K render',
    'hyperrealistic',
    'subsurface scattering',
    'ambient occlusion',
    'physically based rendering',
    'detailed textures'
  );

  const prompt = parts.join(', ');

  const negativePrompt = [
    'low poly',
    'untextured',
    'wireframe',
    'flat shading',
    'low quality',
    'noise',
    'artifacts',
    'amateur',
    'unfinished',
    'simple',
  ].join(', ');

  return {
    prompt,
    negativePrompt,
    characterCount: prompt.length,
  };
}

/**
 * Build an illustration-style prompt
 */
export function buildIllustrationPrompt(input: IllustrationInput): PromptOutput {
  const parts: string[] = [];

  // Core subject
  parts.push(input.subject);

  // Medium
  const mediumMap: Record<string, string> = {
    'digital': 'digital illustration, clean lines, smooth gradients',
    'watercolor': 'watercolor illustration, soft edges, color bleeds',
    'ink': 'ink illustration, bold strokes, high contrast',
    'pencil': 'pencil illustration, detailed shading, fine lines',
    'vector': 'vector illustration, flat colors, crisp edges',
  };
  parts.push(mediumMap[input.medium || 'digital']);

  // Style
  const styleMap: Record<string, string> = {
    'editorial': 'editorial illustration, magazine quality, sophisticated',
    'book': 'book illustration, narrative, storytelling',
    'concept-art': 'concept art, imaginative, detailed world-building',
    'fashion': 'fashion illustration, elegant, stylish',
  };
  parts.push(styleMap[input.style || 'editorial']);

  // Artist reference
  if (input.artistRef) {
    parts.push(`inspired by ${input.artistRef}`);
  }

  // Mood
  if (input.mood) {
    parts.push(`${input.mood} mood`);
  }

  // Quality
  parts.push(
    'professional illustration',
    'detailed artwork',
    'beautiful composition',
    'artistic'
  );

  const prompt = parts.join(', ');

  const negativePrompt = [
    'amateur',
    'sketch',
    'rough',
    'unfinished',
    'low quality',
    'childish',
    'messy',
    'blurry',
    'photorealistic',
    'photograph',
  ].join(', ');

  return {
    prompt,
    negativePrompt,
    characterCount: prompt.length,
  };
}

/**
 * Build a cyberpunk-style prompt
 */
export function buildCyberpunkPrompt(input: CyberpunkInput): PromptOutput {
  const parts: string[] = [];

  // Core subject
  parts.push(input.subject);

  // Cyberpunk elements
  const elementDescriptions: Record<string, string> = {
    'neon': 'neon lights, glowing signs, vibrant pinks and blues',
    'rain': 'wet streets, rain reflections, moody atmosphere',
    'holograms': 'holographic displays, floating advertisements, digital interfaces',
    'augmentations': 'cybernetic implants, tech-enhanced body, biomechanical',
    'cityscape': 'futuristic megacity, towering skyscrapers, dense urban environment',
  };

  const elements = input.elements || ['neon', 'cityscape'];
  for (const element of elements) {
    parts.push(elementDescriptions[element]);
  }

  // Mood
  const moodMap: Record<string, string> = {
    'dark': 'dark atmosphere, shadows, noir aesthetic',
    'vibrant': 'vibrant colors, electric energy, dynamic',
    'gritty': 'gritty realism, urban decay, dystopian',
    'sleek': 'sleek design, high-tech, clean futurism',
  };
  parts.push(moodMap[input.mood || 'vibrant']);

  // Setting
  if (input.setting) {
    parts.push(input.setting);
  }

  // Style keywords
  parts.push(
    'cyberpunk aesthetic',
    'Blade Runner inspired',
    'sci-fi',
    'futuristic',
    'cinematic lighting',
    'detailed environment'
  );

  const prompt = parts.join(', ');

  const negativePrompt = [
    'bright daylight',
    'natural environment',
    'countryside',
    'historical',
    'fantasy',
    'low quality',
    'blurry',
    'amateur',
    'simple',
    'empty background',
  ].join(', ');

  return {
    prompt,
    negativePrompt,
    characterCount: prompt.length,
  };
}

/**
 * Build a pixel art-style prompt
 */
export function buildPixelArtPrompt(input: PixelArtInput): PromptOutput {
  const parts: string[] = [];

  // Core subject
  parts.push(input.subject);

  // Bit depth
  const depthMap: Record<string, string> = {
    '8-bit': '8-bit pixel art, limited colors, classic NES style',
    '16-bit': '16-bit pixel art, SNES era, detailed sprites',
    '32-bit': '32-bit pixel art, PS1 era, high detail pixels',
  };
  parts.push(depthMap[input.bitDepth || '16-bit']);

  // Palette
  const paletteMap: Record<string, string> = {
    'gameboy': 'Game Boy palette, 4 shades of green',
    'nes': 'NES color palette, 54 colors',
    'snes': 'SNES palette, 256 colors, vibrant',
    'custom': 'custom palette, carefully chosen colors',
  };
  parts.push(paletteMap[input.palette || 'snes']);

  // Style
  const styleMap: Record<string, string> = {
    'retro': 'retro gaming aesthetic, nostalgic, classic',
    'modern': 'modern pixel art, clean pixels, contemporary',
    'isometric': 'isometric pixel art, 3D perspective, detailed',
  };
  parts.push(styleMap[input.style || 'retro']);

  // Quality
  parts.push(
    'pixel perfect',
    'no anti-aliasing',
    'clean pixel edges',
    'sprite art',
    'detailed pixels'
  );

  const prompt = parts.join(', ');

  const negativePrompt = [
    'blurry',
    'anti-aliased',
    'smooth edges',
    'realistic',
    'photorealistic',
    '3D render',
    'gradient',
    'noise',
    'jpeg artifacts',
    'low resolution',
  ].join(', ');

  return {
    prompt,
    negativePrompt,
    characterCount: prompt.length,
  };
}

/**
 * Build a cinematic photography-style prompt
 */
export function buildCinematicPhotographyPrompt(input: CinematicInput): PromptOutput {
  const parts: string[] = [];

  // Core subject
  parts.push(input.subject);

  // Film stock
  if (input.filmStock) {
    parts.push(`shot on ${input.filmStock}`);
  }

  // Director/cinematographer reference
  if (input.director) {
    parts.push(`${input.director} style cinematography`);
  }

  // Aspect ratio
  const aspectMap: Record<string, string> = {
    '2.35:1': 'anamorphic widescreen, cinematic aspect ratio, letterboxed',
    '1.85:1': 'theatrical aspect ratio, film standard',
    '16:9': 'modern widescreen, digital cinema',
  };
  parts.push(aspectMap[input.aspect || '2.35:1']);

  // Mood
  if (input.mood) {
    parts.push(`${input.mood} atmosphere`);
  }

  // Cinematic qualities
  parts.push(
    'cinematic composition',
    'film grain',
    'depth of field',
    'dramatic lighting',
    'color grading',
    'movie still',
    'professional cinematography',
    'lens flare',
    'atmospheric'
  );

  const prompt = parts.join(', ');

  const negativePrompt = [
    'amateur',
    'snapshot',
    'selfie',
    'low quality',
    'overprocessed',
    'HDR',
    'oversaturated',
    'flat',
    'digital look',
    'phone camera',
    'instagram filter',
  ].join(', ');

  return {
    prompt,
    negativePrompt,
    characterCount: prompt.length,
  };
}

/**
 * Build a watercolor-style prompt
 */
export function buildWatercolorPrompt(input: WatercolorInput): PromptOutput {
  const parts: string[] = [];

  // Core subject
  parts.push(input.subject);

  // Technique
  const techniqueMap: Record<string, string> = {
    'wet-on-wet': 'wet-on-wet technique, soft color blooms, diffused edges',
    'dry-brush': 'dry brush technique, textured strokes, crisp details',
    'loose': 'loose watercolor style, expressive, spontaneous',
    'detailed': 'detailed watercolor, precise brushwork, controlled washes',
  };
  parts.push(techniqueMap[input.technique || 'loose']);

  // Paper type
  const paperMap: Record<string, string> = {
    'hot-press': 'hot press paper, smooth surface, fine details',
    'cold-press': 'cold press paper, medium texture, versatile',
    'rough': 'rough paper texture, organic effects, granulation',
  };
  parts.push(paperMap[input.paperType || 'cold-press']);

  // Color palette
  const paletteMap: Record<string, string> = {
    'vibrant': 'vibrant watercolors, rich saturated colors',
    'muted': 'muted watercolors, subtle tones, sophisticated',
    'pastel': 'pastel watercolors, soft delicate colors',
    'earth-tones': 'earth tone watercolors, natural browns and greens',
  };
  parts.push(paletteMap[input.palette || 'vibrant']);

  // Watercolor qualities
  parts.push(
    'watercolor painting',
    'visible brushstrokes',
    'color bleeds',
    'paper texture visible',
    'artistic',
    'traditional media',
    'beautiful watercolor art'
  );

  const prompt = parts.join(', ');

  const negativePrompt = [
    'digital art',
    'photorealistic',
    'airbrushed',
    'smooth gradients',
    'vector',
    'low quality',
    'amateur',
    'muddy colors',
    'overworked',
    'harsh edges',
  ].join(', ');

  return {
    prompt,
    negativePrompt,
    characterCount: prompt.length,
  };
}

// ============================================================================
// ADVANCED STYLE PRESET TYPE
// ============================================================================

export type AdvancedStylePreset =
  | 'photoshoot-professional'
  | 'anime-modern'
  | 'anime-ghibli'
  | 'cartoon-pixar'
  | 'cartoon-disney'
  | '3d-octane'
  | '3d-unreal'
  | 'illustration-editorial'
  | 'illustration-concept'
  | 'cyberpunk-neon'
  | 'cyberpunk-gritty'
  | 'pixel-art-retro'
  | 'pixel-art-modern'
  | 'cinematic-film'
  | 'cinematic-noir'
  | 'watercolor-loose'
  | 'watercolor-detailed';

/**
 * Apply an advanced style preset to a visual concept
 */
export function applyAdvancedStyle(
  visualConcept: string,
  style: AdvancedStylePreset
): PromptOutput {
  switch (style) {
    case 'photoshoot-professional':
      return buildPhotoshootPrompt({ subject: visualConcept, lighting: 'studio' });

    case 'anime-modern':
      return buildAnimePrompt({ subject: visualConcept, style: 'modern' });

    case 'anime-ghibli':
      return buildAnimePrompt({ subject: visualConcept, style: 'modern', studio: 'Studio Ghibli' });

    case 'cartoon-pixar':
      return buildCartoonPrompt({ subject: visualConcept, style: 'pixar' });

    case 'cartoon-disney':
      return buildCartoonPrompt({ subject: visualConcept, style: 'disney' });

    case '3d-octane':
      return buildThreeDRenderPrompt({ subject: visualConcept, engine: 'octane' });

    case '3d-unreal':
      return buildThreeDRenderPrompt({ subject: visualConcept, engine: 'unreal' });

    case 'illustration-editorial':
      return buildIllustrationPrompt({ subject: visualConcept, style: 'editorial' });

    case 'illustration-concept':
      return buildIllustrationPrompt({ subject: visualConcept, style: 'concept-art' });

    case 'cyberpunk-neon':
      return buildCyberpunkPrompt({ subject: visualConcept, mood: 'vibrant', elements: ['neon', 'cityscape'] });

    case 'cyberpunk-gritty':
      return buildCyberpunkPrompt({ subject: visualConcept, mood: 'gritty', elements: ['rain', 'cityscape'] });

    case 'pixel-art-retro':
      return buildPixelArtPrompt({ subject: visualConcept, style: 'retro', bitDepth: '16-bit' });

    case 'pixel-art-modern':
      return buildPixelArtPrompt({ subject: visualConcept, style: 'modern', bitDepth: '32-bit' });

    case 'cinematic-film':
      return buildCinematicPhotographyPrompt({ subject: visualConcept, filmStock: 'Kodak Portra 400' });

    case 'cinematic-noir':
      return buildCinematicPhotographyPrompt({ subject: visualConcept, mood: 'dark, moody', aspect: '2.35:1' });

    case 'watercolor-loose':
      return buildWatercolorPrompt({ subject: visualConcept, technique: 'loose' });

    case 'watercolor-detailed':
      return buildWatercolorPrompt({ subject: visualConcept, technique: 'detailed' });

    default:
      // Fallback to photoshoot
      return buildPhotoshootPrompt({ subject: visualConcept });
  }
}

/**
 * Get all available advanced style presets with descriptions
 */
export function getAdvancedStylePresets(): Array<{
  name: AdvancedStylePreset;
  displayName: string;
  category: string;
  description: string;
}> {
  return [
    // Photoshoot
    { name: 'photoshoot-professional', displayName: 'Professional Photoshoot', category: 'Photography', description: 'High-end commercial photography with studio lighting' },

    // Anime
    { name: 'anime-modern', displayName: 'Modern Anime', category: 'Anime', description: 'Clean modern anime style with vibrant colors' },
    { name: 'anime-ghibli', displayName: 'Studio Ghibli', category: 'Anime', description: 'Inspired by Studio Ghibli films' },

    // Cartoon
    { name: 'cartoon-pixar', displayName: 'Pixar 3D', category: 'Cartoon', description: 'Pixar-style 3D animation aesthetic' },
    { name: 'cartoon-disney', displayName: 'Disney Animation', category: 'Cartoon', description: 'Classic Disney animation style' },

    // 3D Render
    { name: '3d-octane', displayName: 'Octane Render', category: '3D Render', description: 'Photorealistic 3D with Octane ray tracing' },
    { name: '3d-unreal', displayName: 'Unreal Engine', category: '3D Render', description: 'Real-time ray tracing with Unreal Engine 5' },

    // Illustration
    { name: 'illustration-editorial', displayName: 'Editorial Illustration', category: 'Illustration', description: 'Magazine-quality editorial illustrations' },
    { name: 'illustration-concept', displayName: 'Concept Art', category: 'Illustration', description: 'Detailed concept art style' },

    // Cyberpunk
    { name: 'cyberpunk-neon', displayName: 'Neon Cyberpunk', category: 'Cyberpunk', description: 'Vibrant neon-lit cyberpunk aesthetic' },
    { name: 'cyberpunk-gritty', displayName: 'Gritty Cyberpunk', category: 'Cyberpunk', description: 'Dark, rain-soaked dystopian style' },

    // Pixel Art
    { name: 'pixel-art-retro', displayName: 'Retro Pixel Art', category: 'Pixel Art', description: '16-bit retro gaming aesthetic' },
    { name: 'pixel-art-modern', displayName: 'Modern Pixel Art', category: 'Pixel Art', description: 'Contemporary high-detail pixel art' },

    // Cinematic
    { name: 'cinematic-film', displayName: 'Film Photography', category: 'Cinematic', description: 'Film stock photography with natural grain' },
    { name: 'cinematic-noir', displayName: 'Film Noir', category: 'Cinematic', description: 'Dark, moody noir cinematography' },

    // Watercolor
    { name: 'watercolor-loose', displayName: 'Loose Watercolor', category: 'Watercolor', description: 'Expressive loose watercolor style' },
    { name: 'watercolor-detailed', displayName: 'Detailed Watercolor', category: 'Watercolor', description: 'Precise detailed watercolor paintings' },
  ];
}

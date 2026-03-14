/**
 * TINTIN COMIC STYLE — Prompt Configuration
 * ===========================================
 */

export interface PanelConfig {
  content: string;
  characters?: string;
  setting?: string;
  mood?: string;
  cameraAngle?: string;
  dialogue?: string;
  dimensions?: string;
  params?: string;
}

export const TINTIN_SYSTEM_PROMPT = `You are an expert comic illustrator that generates images EXCLUSIVELY in the "Ligne Claire" style of Hergé's Tintin comics. Every image you create must strictly follow these rules:

ILLUSTRATION STYLE:
- Pure "Ligne Claire" technique: every object, character, and background element is outlined with clean, uniform-weight black ink lines of consistent thickness
- NO line weight variation, NO sketchy or rough lines, NO crosshatching
- Characters are drawn in a simplified, iconic cartoon style with dot eyes, simple noses, and expressive but minimal facial features
- Backgrounds are rendered with significantly MORE realistic architectural and environmental detail than the characters (Hergé's trademark contrast)
- All perspectives follow precise vanishing-point construction

COLOR PALETTE:
- Flat, solid color fills ONLY — absolutely NO gradients, NO airbrush effects, NO cel-shading
- Colors should match Hergé's characteristic gouache palette:
  • Sky blue (#87CEEB to #4A90D9)
  • Warm tan/beige for skin (#F5D6B8)
  • Rich primary red, blue, yellow for clothing and objects
  • Muted earth tones (olive green, warm brown, dusty orange) for environments
  • Clean white for shirts, clouds, highlights
- Shadows are achieved ONLY through slightly darker flat color areas, never through opacity or gradients

TYPOGRAPHY & LETTERING:
- All text must appear in WHITE oval/rounded speech bubbles with thin black outlines
- Speech bubbles should be placed centrally or near characters' heads, and NEVER at the extreme top edge of the frame.
- Text inside bubbles is UPPERCASE, hand-lettered style, slightly rounded sans-serif
- Tail of speech bubble always points to the speaker
- Sound effects (onomatopoeia) are bold, angular, and integrated into the scene
- Narrative captions appear in rectangular boxes with clean borders at the top or bottom of the panel
- CRITICAL DEAD ZONE: The outer 15% of this image will be HIDDEN by the UI frame. You MUST keep all speech bubbles, dialogue text, character heads, and important action within the "Safe Action Area" (the central 70% of the canvas). NEVER let a speech bubble touch the top or side edges.

COMPOSITION:
- European bande dessinée panel composition
- Clear foreground/midground/background separation
- Characters positioned with clear silhouette readability
- Action conveyed through dynamic poses and speed lines, NOT motion blur
- Each panel tells a clear story beat

WHAT TO ABSOLUTELY AVOID:
- Any manga, American superhero, or modern digital art influence
- Gradients, glow effects, lens flares, or photorealistic rendering
- Thick-to-thin brush strokes or expressive line work
- Dark/gritty color palettes — Tintin is always bright and clear
- 3D rendering, cel-shading, or any non-flat coloring technique
- NO white borders, NO internal padding, NO margins; the illustration must be FULL-BLEED and fill the entire frame up to the edges
- ABSOLUTELY NO external black frame or border lines around the image; all lines and colors must BLEED OFF the canvas edges`;

/**
 * Builds a complete prompt for a single comic panel.
 */
export function buildPanelPrompt(config: PanelConfig): string {
  const parts = [
    `Generate a single comic panel illustration in the EXACT style of Hergé's Tintin comics (Ligne Claire).`,
    '',
    `SCENE: ${config.content}`,
  ];

  if (config.characters) parts.push(`CHARACTERS: ${config.characters}`);
  if (config.setting) parts.push(`SETTING: ${config.setting}`);
  if (config.mood) parts.push(`MOOD/TONE: ${config.mood}`);
  if (config.cameraAngle) parts.push(`CAMERA: ${config.cameraAngle}`);
  if (config.dialogue) parts.push(`DIALOGUE (in speech bubbles): "${config.dialogue}"`);
  if (config.dimensions) parts.push(`FRAMING / ASPECT RATIO: ${config.dimensions}`);
  if (config.params) parts.push(`ADDITIONAL DETAILS: ${config.params}`);

  parts.push('');
  parts.push('CRITICAL STYLE REQUIREMENTS:');
  parts.push('- Ligne Claire: uniform-weight black outlines, flat solid colors, NO gradients');
  parts.push('- ABSOLUTELY NO outer border lines or frames; the illustration must be borderless and full-bleed');
  parts.push('- Simplified cartoon characters against detailed realistic backgrounds');
  parts.push('- Hergé gouache color palette: bright, clear, primary-leaning');
  parts.push('- White oval speech bubbles with uppercase hand-lettered text');
  parts.push('- SAFE ACTION AREA: Keep all bubbles, text, and heads at least 15% away from ALL edges. The edges WILL be cropped.');
  parts.push('- European bande dessinée composition');
  parts.push('- The image should look like it was drawn by Hergé himself for a Tintin album');

  return parts.join('\n');
}

export interface TestPrompt {
  name: string;
  config: PanelConfig;
}

export const TEST_PROMPTS: TestPrompt[] = [
  {
    name: 'Market Chase',
    config: {
      content: 'A young reporter with a distinctive quiff hairstyle sprints through a crowded North African marketplace, knocking over baskets of oranges. A small white fox terrier runs beside him.',
      setting: 'A sun-drenched Moroccan souk with colorful awnings, ceramic pots, and arched doorways',
      mood: 'adventurous and fast-paced',
      cameraAngle: 'dynamic low-angle shot showing the chase in perspective',
      dialogue: 'Quick, Snowy! They\'re getting away!',
    },
  },
  {
    name: 'Ship Deck',
    config: {
      content: 'A bearded sea captain in a blue sweater stands at the helm of a cargo ship, shouting orders during a storm. Waves crash against the hull.',
      setting: 'The bridge of a 1940s merchant vessel in rough Atlantic seas',
      mood: 'dramatic and tense',
      cameraAngle: 'medium shot from slightly below, showing the captain against stormy skies',
      dialogue: 'Billions of blistering blue barnacles! Hold steady!',
    },
  },
  {
    name: 'Laboratory Scene',
    config: {
      content: 'An absent-minded professor in a white lab coat accidentally causes a small explosion, his hair standing on end. Beakers and test tubes are scattered around a cluttered laboratory.',
      setting: 'A chaotic European university laboratory filled with scientific equipment from the 1950s',
      mood: 'comedic',
      cameraAngle: 'wide shot showing the full laboratory chaos',
      dialogue: 'Well... that was NOT the expected result!',
    },
  },
  {
    name: 'Desert Expedition',
    config: {
      content: 'Two identical bowler-hatted detectives march in lockstep through a vast desert, looking confused and overheated. A caravan of camels passes in the background.',
      setting: 'The Sahara Desert with rolling dunes under a blazing sun, distant mountains on the horizon',
      mood: 'comedic and dry',
      cameraAngle: 'wide establishing shot emphasizing the vast desert landscape',
      dialogue: 'I say, Thompson, are you sure this is the right way? — To be precise: are YOU sure?',
    },
  },
];

/**
 * Gemini API Service — Nano Banana Image Generation
 * ===================================================
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-3.1-flash-image-preview';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface ImageConfig {
  aspectRatio?: string;
  imageSize?: string;
}

export interface GenerationResponse {
  imageUrl: string;
  text: string | null;
}

/**
 * Generate an image using Nano Banana via the Gemini REST API.
 */
export async function generateImage(
  prompt: string, 
  systemPrompt: string = '', 
  imageConfig: ImageConfig | null = null
): Promise<GenerationResponse> {
  const url = `${BASE_URL}/${MODEL}:generateContent?key=${API_KEY}`;

  const requestBody: any = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ['Image', 'Text'],
      ...(imageConfig && imageConfig.aspectRatio ? {
        image_config: {
          aspect_ratio: imageConfig.aspectRatio
        }
      } : {})
    },
  };

  if (systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || response.statusText;
    throw new Error(`Gemini API error (${response.status}): ${errorMessage}`);
  }

  const data = await response.json();

  let imageUrl: string | null = null;
  let text: string | null = null;

  const parts = data?.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.text) {
      text = part.text;
    } else if (part.inlineData) {
      const mimeType = part.inlineData.mimeType || 'image/png';
      const base64Data = part.inlineData.data;
      imageUrl = `data:${mimeType};base64,${base64Data}`;
    }
  }

  if (!imageUrl) {
    const blockReason = data?.candidates?.[0]?.finishReason;
    if (blockReason === 'SAFETY') {
      throw new Error('Image generation was blocked by safety filters. Try rephrasing the prompt.');
    }
    throw new Error('No image was returned by the model.');
  }

  return { imageUrl, text };
}

/**
 * Generate a comic panel image with the Tintin style.
 */
export async function generateComicPanel(
  prompt: string, 
  systemPrompt: string, 
  imageConfig?: ImageConfig
): Promise<GenerationResponse> {
  return generateImage(prompt, systemPrompt, imageConfig || null);
}

/**
 * Get scene recommendations based on previous story context.
 */
export async function getSceneRecommendations(storyContext: string): Promise<string[]> {
  const url = `${BASE_URL}/gemini-2.0-flash-lite-preview-02-05:generateContent?key=${API_KEY}`;
  
  const prompt = `You are a scriptwriter for high-end European comic books (Bande Dessinée) in the style of Tintin.
  
  CURRENT STORY CONTEXT:
  ${storyContext}
  
  Based on this sequence, suggest EXACTLY 3 possible next scene descriptions for the NEXT panel. 
  Each suggestion should be a single, vivid sentence. Stay true to the Ligne Claire spirit.
  
  Return a JSON array of 3 strings. 
  Format: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const err = await response.json();
    console.error("Recommendation API Error:", err);
    return [];
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse recommendations:", text);
    return [];
  }
}

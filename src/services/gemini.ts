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

/**
 * Gemini API Service — Nano Banana Image Generation
 * ===================================================
 * 
 * Uses the Gemini REST API directly (no SDK) to generate comic panel images
 * via the Nano Banana (Gemini image generation) model.
 * 
 * Model: gemini-2.0-flash-exp (Nano Banana — optimized for speed)
 * Endpoint: v1beta generateContent with responseModalities: ["TEXT", "IMAGE"]
 */

const API_KEY = 'AIzaSyDKb4icDOT0tCDBfbsEdJrYp7NVhmPzs8k';
const MODEL = 'gemini-3.1-flash-image-preview';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Generate an image using Nano Banana via the Gemini REST API.
 * 
 * @param {string} prompt        — The full text prompt (including style instructions)
 * @param {string} systemPrompt  — The system-level instruction for style enforcement
 * @param {Object} [imageConfig] — Optional dimensions configuration (aspectRatio, imageSize)
 * @returns {Promise<{ imageUrl: string, text: string | null }>}
 */
export async function generateImage(prompt, systemPrompt = '', imageConfig = null) {
  const url = `${BASE_URL}/${MODEL}:generateContent?key=${API_KEY}`;

  const requestBody = {
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

  // Add system instruction if provided
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

  // Extract image and text from response parts
  let imageUrl = null;
  let text = null;

  const parts = data?.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.text) {
      text = part.text;
    } else if (part.inlineData) {
      // Convert base64 image data to a data URL
      const mimeType = part.inlineData.mimeType || 'image/png';
      const base64Data = part.inlineData.data;
      imageUrl = `data:${mimeType};base64,${base64Data}`;
    }
  }

  if (!imageUrl) {
    // Check for blocked content
    const blockReason = data?.candidates?.[0]?.finishReason;
    if (blockReason === 'SAFETY') {
      throw new Error('Image generation was blocked by safety filters. Try rephrasing the prompt.');
    }
    throw new Error('No image was returned by the model. The response may have been filtered or the model returned text-only.');
  }

  return { imageUrl, text };
}

/**
 * Generate a comic panel image with the Tintin style.
 * Convenience wrapper that combines the prompt builder with the API call.
 * 
 * @param {string} prompt       — The built panel prompt
 * @param {string} systemPrompt — The Tintin system prompt
 * @param {Object} [imageConfig] — The style/dimension config
 * @returns {Promise<{ imageUrl: string, text: string | null }>}
 */
export async function generateComicPanel(prompt, systemPrompt, imageConfig) {
  return generateImage(prompt, systemPrompt, imageConfig);
}

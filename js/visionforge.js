/**
 * visionforge.js — Vision Forge image generation module.
 *
 * Provides AI-powered image generation via the Gemini API (or a local stub
 * for demo/development environments).
 *
 * Exports:
 *   generateImage(prompt, options?)    → Promise<{ url: string, prompt: string, model: string }>
 *   describeImage(imageUrl, prompt?)   → Promise<{ description: string }>
 *   getHistory()                       → Array<VisionForgeEntry>
 *   clearHistory()                     → void
 *   IS_VISION_AVAILABLE                → boolean
 */

const HISTORY_KEY = 'visionforge-history';
const MAX_HISTORY = 20;

/* ── Capability check ────────────────────────────────────────────────────── */

/**
 * True when a Gemini API key is available in the environment.
 */
export const IS_VISION_AVAILABLE = (() => {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.__GEMINI_API_KEY === 'string' &&
      window.__GEMINI_API_KEY.length > 0
    );
  } catch {
    return false;
  }
})();

/* ── Gemini API helpers ──────────────────────────────────────────────────── */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

async function callGemini(endpoint, body) {
  const apiKey = window.__GEMINI_API_KEY;
  const url = `${GEMINI_BASE}/${endpoint}?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }
  return res.json();
}

/* ── Demo stub ───────────────────────────────────────────────────────────── */

const DEMO_IMAGES = [
  'https://picsum.photos/seed/vf1/512/512',
  'https://picsum.photos/seed/vf2/512/512',
  'https://picsum.photos/seed/vf3/512/512',
  'https://picsum.photos/seed/vf4/512/512',
  'https://picsum.photos/seed/vf5/512/512',
];

let _demoIdx = 0;

function demoGenerate(prompt) {
  const url = DEMO_IMAGES[_demoIdx % DEMO_IMAGES.length];
  _demoIdx++;
  return { url, prompt, model: 'demo-stub' };
}

/* ── History helpers ─────────────────────────────────────────────────────── */

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function appendHistory(entry) {
  const history = loadHistory();
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Storage quota exceeded — skip persistence
  }
}

/* ── Public API ──────────────────────────────────────────────────────────── */

/**
 * Generate an image from a text prompt.
 *
 * On demo hosts (no API key) returns a placeholder image URL.
 * In production, calls the Gemini image generation endpoint.
 *
 * @param {string} prompt
 * @param {{ aspectRatio?: '1:1'|'16:9'|'4:3', style?: string }} [options={}]
 * @returns {Promise<{ url: string, prompt: string, model: string }>}
 */
export async function generateImage(prompt, options = {}) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('A non-empty prompt is required.');
  }

  const trimmedPrompt = prompt.trim();
  let result;

  if (IS_VISION_AVAILABLE) {
    const styleHint = options.style ? ` Style: ${options.style}.` : '';
    const body = {
      contents: [{ parts: [{ text: trimmedPrompt + styleHint }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    };
    const data = await callGemini('models/gemini-2.0-flash-preview-image-generation:generateContent', body);
    const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!part?.inlineData?.data) {
      throw new Error('Gemini did not return an image.');
    }
    const mimeType = part.inlineData.mimeType || 'image/png';
    result = {
      url: `data:${mimeType};base64,${part.inlineData.data}`,
      prompt: trimmedPrompt,
      model: 'gemini-2.0-flash-preview-image-generation',
    };
  } else {
    result = demoGenerate(trimmedPrompt);
  }

  appendHistory({ ...result, generatedAt: new Date().toISOString() });
  return result;
}

/**
 * Describe an existing image using Gemini Vision.
 * Falls back to a static placeholder on demo hosts.
 *
 * @param {string} imageUrl - URL or base64 data URL of the image.
 * @param {string} [prompt='Describe this image in detail.']
 * @returns {Promise<{ description: string }>}
 */
export async function describeImage(imageUrl, prompt = 'Describe this image in detail.') {
  if (!imageUrl) throw new Error('imageUrl is required.');

  if (!IS_VISION_AVAILABLE) {
    return { description: '[Demo mode] Image description unavailable without a Gemini API key.' };
  }

  // Convert URL to inline data if it's a data URL
  let imagePart;
  if (imageUrl.startsWith('data:')) {
    const [header, data] = imageUrl.split(',');
    const mimeType = header.replace('data:', '').replace(';base64', '');
    imagePart = { inlineData: { mimeType, data } };
  } else {
    imagePart = { fileData: { mimeType: 'image/jpeg', fileUri: imageUrl } };
  }

  const body = {
    contents: [{ parts: [imagePart, { text: prompt }] }],
  };
  const data = await callGemini('models/gemini-2.0-flash:generateContent', body);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return { description: text.trim() };
}

/**
 * Return the generation history (most recent first).
 * @returns {Array<{ url: string, prompt: string, model: string, generatedAt: string }>}
 */
export function getHistory() {
  return loadHistory();
}

/**
 * Clear the generation history.
 */
export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}

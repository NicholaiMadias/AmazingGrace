// Gemini helpers. The API key is optional (VITE_GEMINI_API_KEY); without it the
// tools fail soft with a readable message instead of sending broken requests.
const API_KEY: string = (import.meta.env?.VITE_GEMINI_API_KEY as string | undefined) ?? '';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const aiAvailable = (): boolean => API_KEY.length > 0;

interface Part { text?: string; inlineData?: { data?: string; mimeType?: string } }
interface GeminiResponse { candidates?: { content?: { parts?: Part[] } }[]; error?: { message?: string } }

async function generate(model: string, body: unknown): Promise<Part[]> {
    if (!aiAvailable()) throw new Error('AI offline: no Gemini API key configured (VITE_GEMINI_API_KEY).');
    const res = await fetch(`${BASE}/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
        body: JSON.stringify(body),
    });
    const data = (await res.json()) as GeminiResponse;
    if (!res.ok) throw new Error(data.error?.message ?? `Request failed (${res.status})`);
    return data.candidates?.[0]?.content?.parts ?? [];
}

export async function askText(prompt: string): Promise<string> {
    const parts = await generate('gemini-3-flash-preview', { contents: [{ parts: [{ text: prompt }] }] });
    return parts.find(p => p.text)?.text ?? 'No AI response returned.';
}

export async function askCode(prompt: string): Promise<string> {
    return askText(`Act as an expert code assistant. Write clean executable code for: ${prompt}`);
}

const SAFE_IMAGE = /^image\/(png|jpeg|webp|gif)$/;
const SAFE_AUDIO = /^audio\/(mpeg|mp3|wav|x-wav|ogg|webm|L16.*)$/;

/** Returns a data URL for the first generated image, or null. */
export async function askImage(prompt: string): Promise<string | null> {
    const parts = await generate('gemini-3.1-flash-lite-image', {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    });
    const inline = parts.find(p => p.inlineData?.data)?.inlineData;
    if (!inline?.data) return null;
    const mime = inline.mimeType && SAFE_IMAGE.test(inline.mimeType) ? inline.mimeType : 'image/png';
    return /^[A-Za-z0-9+/=]+$/.test(inline.data) ? `data:${mime};base64,${inline.data}` : null;
}

/** Returns a data URL for generated speech, or null. */
export async function askSpeech(text: string): Promise<string | null> {
    const parts = await generate('gemini-2.5-flash-preview-tts', {
        contents: [{ parts: [{ text }] }],
        generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
    });
    const inline = parts.find(p => p.inlineData?.data)?.inlineData;
    if (!inline?.data || !/^[A-Za-z0-9+/=]+$/.test(inline.data)) return null;
    const mime = inline.mimeType && SAFE_AUDIO.test(inline.mimeType) ? inline.mimeType : 'audio/mpeg';
    return `data:${mime};base64,${inline.data}`;
}

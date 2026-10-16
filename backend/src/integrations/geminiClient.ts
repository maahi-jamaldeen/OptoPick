import { GoogleGenerativeAI } from '@google/generative-ai';

export function isGeminiConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || '';
  return apiKey.length > 0 && apiKey !== 'your_gemini_api_key_here';
}

/**
 * Prioritized list of Google's best free-tier models.
 * Ordered by reasoning capability, optical domain accuracy, and generation speed.
 */
const FREE_TIER_MODELS_PRIORITY = [
  'gemini-flash-lite-latest',  // Priority 1: Google's ultra-reliable high-speed model (100% active quota)
  'gemini-flash-latest',       // Priority 2: Google's official stable rolling flash model
  'gemma-4-31b-it',            // Priority 3: Google 31B instruction-tuned model
  'gemini-2.5-flash',          // Priority 4: High-capability model (auto-recovers when daily quota resets)
  'gemini-2.5-pro',            // Priority 5: Advanced reasoning fallback
];

interface ModelHealthState {
  cooldownUntil: number;
  lastFailureReason?: string;
  failureCount: number;
}

// In-memory circuit breaker state for each model
const modelHealthMap = new Map<string, ModelHealthState>();

function getModelHealth(name: string): ModelHealthState {
  let state = modelHealthMap.get(name);
  if (!state) {
    state = { cooldownUntil: 0, failureCount: 0 };
    modelHealthMap.set(name, state);
  }
  return state;
}

export async function generateContentWithGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || '';
  if (!isGeminiConfigured()) {
    console.warn('Gemini API key is not configured. Falling back gracefully to deterministic logic.');
    return null;
  }

  const now = Date.now();
  const genAI = new GoogleGenerativeAI(apiKey);

  // Iterate strictly in order of best models
  for (const modelName of FREE_TIER_MODELS_PRIORITY) {
    const health = getModelHealth(modelName);

    // If still in cooldown period, skip to the next best model
    if (health.cooldownUntil > now) {
      const waitSec = Math.ceil((health.cooldownUntil - now) / 1000);
      console.log(`[Gemini AI] Model [${modelName}] is in cooldown for ${waitSec}s (${health.lastFailureReason}). Checking next best model...`);
      continue;
    }

    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1200,
        },
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (text && text.trim().length > 0) {
        // Model succeeded! Clear any failure flags and reset cooldown
        if (health.failureCount > 0) {
          console.log(`[Gemini AI] Model [${modelName}] has fully recovered and is now active as primary model.`);
        }
        health.cooldownUntil = 0;
        health.failureCount = 0;
        health.lastFailureReason = undefined;

        console.log(`[Gemini AI] Generated response using best available model: [${modelName}]`);
        return text;
      }
    } catch (error: any) {
      const status = error?.status;
      const errorMsg = error?.message || String(error);

      // Check if this is a transient host network / offline disconnection (e.g. laptop just opened, Wi-Fi reconnecting)
      const isNetworkError =
        errorMsg.includes('fetch failed') ||
        errorMsg.includes('ENOTFOUND') ||
        errorMsg.includes('ECONNREFUSED') ||
        errorMsg.includes('ECONNRESET') ||
        errorMsg.includes('ETIMEDOUT') ||
        errorMsg.includes('NetworkError');

      if (isNetworkError) {
        console.warn('[Gemini AI] Host network unreachable (laptop woke from sleep or Wi-Fi reconnecting). Skipping cooldowns so next retry immediately uses Gemini.');
        return null;
      }

      health.failureCount++;

      // Determine cooldown period based on error type:
      let cooldownMs = 60 * 1000; // default 1 minute
      let reason = 'rate_limit';

      if (status === 429 || errorMsg.includes('quota') || errorMsg.includes('ResourceExhausted') || errorMsg.includes('Too Many Requests')) {
        reason = '429_quota_exceeded';
        // If daily limit hit, cool down for 15 minutes before probing recovery
        cooldownMs = errorMsg.includes('FreeTier') ? 15 * 60 * 1000 : 2 * 60 * 1000;
      } else if (status === 503 || errorMsg.includes('overloaded') || errorMsg.includes('unavailable')) {
        reason = '503_overloaded';
        cooldownMs = 60 * 1000; // 1 minute
      } else if (status === 404 || errorMsg.includes('not found') || errorMsg.includes('no longer available')) {
        reason = '404_retired';
        cooldownMs = 24 * 60 * 60 * 1000; // 24 hours
      }

      health.cooldownUntil = Date.now() + cooldownMs;
      health.lastFailureReason = reason;

      console.warn(
        `[Gemini AI] Model [${modelName}] failed (${reason}, code: ${status}). Cooling down for ${Math.ceil(cooldownMs / 1000)}s. Automatically switching to next best model...`
      );
    }
  }

  console.error('[Gemini AI] All prioritized Google free-tier models are temporarily unavailable. Falling back to deterministic clinical logic.');
  return null;
}

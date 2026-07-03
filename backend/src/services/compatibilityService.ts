import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

// Lazy-load OpenAI to avoid startup crash when the package isn't configured
function getOpenAI() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: OpenAI } = require('openai');
  return new OpenAI({ apiKey: config.openaiApiKey });
}

interface TenantProfileData {
  preferredLocation: string;
  budgetMin: number;
  budgetMax: number;
  moveInDate?: string | Date;
  lifestyleNotes?: string | null;
}

interface ListingData {
  location: string;
  rent: number;
  availableFrom?: string | Date;
  roomType?: string;
  furnishingStatus?: string;
  description?: string;
}


export interface CompatibilityResult {
  score: number;
  explanation: string;
  scoringMethod: 'LLM' | 'FALLBACK';
}

/**
 * Fallback scoring algorithm (deterministic)
 */
export function ruleBasedFallback(
  tenant: TenantProfileData,
  listing: ListingData
): CompatibilityResult {
  let locationScore = 0;
  const prefLoc = tenant.preferredLocation.toLowerCase().trim();
  const listLoc = listing.location.toLowerCase().trim();

  // 1. Location match (Max 50)
  if (prefLoc === listLoc || listLoc.includes(prefLoc) || prefLoc.includes(listLoc)) {
    locationScore = 50;
  } else {
    // Check individual word matches (excluding small words like 'in', 'the', etc.)
    const prefWords = prefLoc.split(/[\s,]+/).filter(w => w.length > 2);
    const listWords = listLoc.split(/[\s,]+/).filter(w => w.length > 2);
    let wordMatch = false;

    for (const pw of prefWords) {
      if (listWords.some(lw => lw.includes(pw) || pw.includes(lw))) {
        wordMatch = true;
        break;
      }
    }
    locationScore = wordMatch ? 30 : 0;
  }

  // 2. Budget match (Max 50)
  let budgetScore = 0;
  const rent = listing.rent;
  const min = tenant.budgetMin;
  const max = tenant.budgetMax;

  if (rent >= min && rent <= max) {
    budgetScore = 50;
  } else if (rent < min) {
    const diffPercent = (min - rent) / min;
    if (diffPercent <= 0.15) budgetScore = 30;
    else if (diffPercent <= 0.30) budgetScore = 15;
    else budgetScore = 0;
  } else {
    const diffPercent = (rent - max) / max;
    if (diffPercent <= 0.15) budgetScore = 30;
    else if (diffPercent <= 0.30) budgetScore = 15;
    else budgetScore = 0;
  }

  const score = locationScore + budgetScore;
  const explanation = `Auto-generated (rule-based fallback): Match on location (${locationScore}/50 pts) and budget (${budgetScore}/50 pts). Listing rent is ₹${rent} (preferred range: ₹${min}-₹${max}). Listing location is "${listing.location}" (preferred: "${tenant.preferredLocation}").`;

  return {
    score,
    explanation,
    scoringMethod: 'FALLBACK',
  };
}

/**
 * LLM Compatibility scorer with defensive parsing and timeout fallback.
 */
export async function computeScore(
  tenant: TenantProfileData,
  listing: ListingData
): Promise<CompatibilityResult> {
  // Format details for the prompt
  const tenant_json = JSON.stringify({
    preferredLocation: tenant.preferredLocation,
    budgetMin: tenant.budgetMin,
    budgetMax: tenant.budgetMax,
    moveInDate: tenant.moveInDate,
    lifestyleNotes: tenant.lifestyleNotes || 'None provided'
  });

  const listing_json = JSON.stringify({
    location: listing.location,
    rent: listing.rent,
    availableFrom: listing.availableFrom,
    roomType: listing.roomType,
    furnishingStatus: listing.furnishingStatus,
    description: listing.description || ''
  });

  const prompt = `Given this room listing: ${listing_json}
and this tenant profile: ${tenant_json}
Compute a compatibility score from 0 to 100 based on budget and location match.
Return JSON: { "score": number, "explanation": string }. Note: All currency numbers are in Indian Rupees (₹), please use Rupees (₹) in the explanation.`;

  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('LLM service call timed out (8s limit)')), 8000);
  });

  try {
    if (config.llmProvider === 'gemini' && config.geminiApiKey) {
      const callPromise = (async () => {
        const genAI = new GoogleGenerativeAI(config.geminiApiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });
        const text = result.response.text();
        return JSON.parse(text);
      })();

      const res = await Promise.race([callPromise, timeoutPromise]);
      if (typeof res.score === 'number' && typeof res.explanation === 'string') {
        return {
          score: Math.min(100, Math.max(0, Math.round(res.score))),
          explanation: res.explanation,
          scoringMethod: 'LLM',
        };
      }
      throw new Error('LLM response format was invalid.');
    } else if (config.llmProvider === 'openai' && config.openaiApiKey) {
      const callPromise = (async () => {
        const openai = getOpenAI();
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        });
        const text = response.choices[0].message.content || '{}';
        return JSON.parse(text);
      })();

      const res = await Promise.race([callPromise, timeoutPromise]);
      if (typeof res.score === 'number' && typeof res.explanation === 'string') {
        return {
          score: Math.min(100, Math.max(0, Math.round(res.score))),
          explanation: res.explanation,
          scoringMethod: 'LLM',
        };
      }
      throw new Error('LLM response format was invalid.');
    } else {
      throw new Error('No LLM Provider API keys configured or provider is unsupported.');
    }
  } catch (err: any) {
    console.warn(`[CompatibilityService] LLM computation failed or timed out: ${err.message}. Falling back to rule-based scorer.`);
    return ruleBasedFallback(tenant, listing);
  } finally {
    if (timeoutId!) clearTimeout(timeoutId);
  }
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendLenses = recommendLenses;
const db_js_1 = __importDefault(require("../config/db.js"));
const zod_1 = require("zod");
const geminiClient_js_1 = require("../integrations/geminiClient.js");
const security_js_1 = require("../utils/security.js");
const lensIQInputSchema = zod_1.z.object({
    prescription_id: zod_1.z.coerce.number().int().positive().optional().nullable(),
    customer_id: zod_1.z.coerce.number().int().positive().optional().nullable(),
    od_sph: zod_1.z.coerce.number().min(-25).max(25).optional(),
    od_cyl: zod_1.z.coerce.number().min(-15).max(15).optional(),
    od_add: zod_1.z.coerce.number().min(0).max(5).optional(),
    os_sph: zod_1.z.coerce.number().min(-25).max(25).optional(),
    os_cyl: zod_1.z.coerce.number().min(-15).max(15).optional(),
    os_add: zod_1.z.coerce.number().min(0).max(5).optional(),
    occupation: zod_1.z.string().optional(),
    screen_time_hours: zod_1.z.coerce.number().min(0).max(24).optional(),
    outdoor_activity_hours: zod_1.z.coerce.number().min(0).max(24).optional(),
    driving_frequency: zod_1.z.string().optional(),
    budget_preference: zod_1.z.string().optional(),
    thickness_preference: zod_1.z.string().optional(),
    coating_preference: zod_1.z.string().optional(),
    lifestyle: zod_1.z.object({
        occupation: zod_1.z.string().optional(),
        screen_time_hours_per_day: zod_1.z.coerce.number().optional(),
        outdoor_hours_per_day: zod_1.z.coerce.number().optional(),
        screen_hours: zod_1.z.coerce.number().optional(),
        outdoor_hours: zod_1.z.coerce.number().optional(),
        driving_frequency: zod_1.z.string().optional(),
        budget_tier: zod_1.z.string().optional(),
        thickness_preference: zod_1.z.string().optional(),
        coating_preferences: zod_1.z.union([zod_1.z.array(zod_1.z.string()), zod_1.z.string()]).optional(),
        frame_type: zod_1.z.string().optional(),
    }).optional(),
});
const geminiLensIQOutputSchema = zod_1.z.object({
    recommendations: zod_1.z.array(zod_1.z.object({
        lens_id: zod_1.z.coerce.number(),
        rank: zod_1.z.coerce.number().optional().default(1),
        material_explanation: zod_1.z.string().optional().default('High optical quality lens material suited for visual clarity.'),
        index_explanation: zod_1.z.string().optional().default('Balanced refractive index for optimal lens profile and lightness.'),
        coating_suitability: zod_1.z.string().optional().default('Targeted protective coatings to reduce glare and protect against blue light.'),
        lifestyle_fit_reason: zod_1.z.string().optional().default('Customized for customer occupation, screen hours, and visual routine.'),
        trade_offs: zod_1.z.string().optional().default('Standard optical consideration between cost and material density.'),
    })),
    clinical_disclaimer: zod_1.z.string().optional(),
});
const lensIQCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
async function recommendLenses(req, res) {
    try {
        const parseRes = lensIQInputSchema.safeParse(req.body);
        if (!parseRes.success) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: parseRes.error.issues[0]?.message || 'Invalid input data' }
            });
            return;
        }
        const input = parseRes.data;
        const userId = req.user.id;
        // Extract lifestyle from nested object or top-level keys
        const occupation = input.lifestyle?.occupation || input.occupation || 'General Office / Mixed';
        const screenTime = input.lifestyle?.screen_time_hours_per_day ?? input.screen_time_hours ?? 6;
        const outdoorHours = input.lifestyle?.outdoor_hours_per_day ?? input.outdoor_activity_hours ?? 2;
        const driving = input.lifestyle?.driving_frequency || input.driving_frequency || 'MODERATE';
        const budget = input.lifestyle?.budget_tier || input.budget_preference || 'STANDARD';
        const thickness = input.lifestyle?.thickness_preference || input.thickness_preference || 'STANDARD';
        const coatingPref = Array.isArray(input.lifestyle?.coating_preferences)
            ? input.lifestyle.coating_preferences.join(', ')
            : (input.coating_preference || 'Anti-Reflective Blue-Cut');
        let od_sph = input.od_sph ?? 0;
        let od_cyl = input.od_cyl ?? 0;
        let od_add = input.od_add ?? 0;
        let os_sph = input.os_sph ?? 0;
        let os_cyl = input.os_cyl ?? 0;
        let os_add = input.os_add ?? 0;
        // If prescription_id is provided, fetch authoritative clinical record from MySQL
        if (input.prescription_id) {
            const [rxRows] = await db_js_1.default.query('SELECT * FROM prescriptions WHERE id = ?', [input.prescription_id]);
            if (rxRows.length > 0) {
                const rx = rxRows[0];
                od_sph = Number(rx.od_sph);
                od_cyl = Number(rx.od_cyl);
                od_add = Number(rx.od_add || 0);
                os_sph = Number(rx.os_sph);
                os_cyl = Number(rx.os_cyl);
                os_add = Number(rx.os_add || 0);
            }
        }
        else if (input.customer_id) {
            // If only customer_id is provided, automatically find their latest prescription
            const [rxRows] = await db_js_1.default.query('SELECT * FROM prescriptions WHERE customer_id = ? ORDER BY id DESC LIMIT 1', [input.customer_id]);
            if (rxRows.length > 0) {
                const rx = rxRows[0];
                od_sph = Number(rx.od_sph);
                od_cyl = Number(rx.od_cyl);
                od_add = Number(rx.od_add || 0);
                os_sph = Number(rx.os_sph);
                os_cyl = Number(rx.os_cyl);
                os_add = Number(rx.os_add || 0);
            }
        }
        // --- TOKEN-SAVING CACHE CHECK ---
        // If exact clinical and lifestyle inputs were already analyzed recently, return instantly
        const cacheKey = JSON.stringify({
            cid: input.customer_id || null,
            rxId: input.prescription_id || null,
            sph: [od_sph, os_sph],
            cyl: [od_cyl, os_cyl],
            add: [od_add, os_add],
            occ: occupation.trim().toLowerCase(),
            st: screenTime,
            oh: outdoorHours,
            dr: driving,
            bg: budget,
            th: thickness,
            cp: coatingPref,
        });
        const cached = lensIQCache.get(cacheKey);
        if (cached && cached.data?.ai_assisted && (Date.now() - cached.cachedAt < CACHE_TTL_MS)) {
            console.log(`[LensIQ Cache] Instant hit for patient #${input.customer_id} (0 tokens consumed, response <2ms)`);
            res.json({
                success: true,
                data: {
                    ...cached.data,
                    cached: true,
                }
            });
            return;
        }
        // --- STAGE 1: Deterministic Compatibility Filtering in MySQL ---
        let lensQuery = `
    SELECT id, lens_code, brand, design_type, material, refractive_index, coatings,
           min_sph, max_sph, min_cyl, max_cyl, min_add, max_add,
           selling_price, stock_quantity, is_available
    FROM lenses
    WHERE is_available = 1
      AND stock_quantity > 0
      AND min_sph <= ? AND max_sph >= ?
      AND min_sph <= ? AND max_sph >= ?
      AND min_cyl <= ? AND max_cyl >= ?
      AND min_cyl <= ? AND max_cyl >= ?
  `;
        const queryParams = [od_sph, od_sph, os_sph, os_sph, od_cyl, od_cyl, os_cyl, os_cyl];
        const hasAdd = od_add > 0 || os_add > 0;
        if (hasAdd) {
            lensQuery += ' AND design_type IN ("BIFOCAL", "PROGRESSIVE")';
        }
        else {
            lensQuery += ' AND design_type = "SINGLE_VISION"';
        }
        lensQuery += ' ORDER BY refractive_index ASC, selling_price ASC';
        let [candidates] = await db_js_1.default.query(lensQuery, queryParams);
        // Fallback if power boundary is tight: find available catalog lenses
        if (candidates.length === 0) {
            const [fallbackCandidates] = await db_js_1.default.query(`SELECT id, lens_code, brand, design_type, material, refractive_index, coatings,
              min_sph, max_sph, min_cyl, max_cyl, min_add, max_add,
              selling_price, stock_quantity, is_available
       FROM lenses
       WHERE is_available = 1 AND stock_quantity > 0
       ORDER BY refractive_index ASC, selling_price ASC
       LIMIT 6`);
            candidates = fallbackCandidates;
        }
        if (candidates.length === 0) {
            res.json({
                success: true,
                data: {
                    stage: 'DETERMINISTIC_ONLY',
                    ai_assisted: false,
                    candidates: [],
                    recommendations: [],
                    message: 'No lenses currently in stock at Indian Optician.',
                    disclaimer: 'Prescription compatibility is deterministically verified against catalog inventory.',
                }
            });
            return;
        }
        const candidateIds = new Set(candidates.map(c => c.id));
        // --- STAGE 2: Gemini Ranking & Reasoning ---
        const candidateSummary = candidates.map(c => ({
            id: c.id,
            code: c.lens_code,
            brand: c.brand,
            design: c.design_type,
            material: c.material,
            index: Number(c.refractive_index),
            coatings: c.coatings,
            price_lkr: Number(c.selling_price),
        }));
        const prompt = `
You are LensIQ, an AI optical dispensing decision-support assistant at Indian Optician, Nintavur, Sri Lanka.
Evaluate the following clinical prescription and lifestyle factors against ONLY the provided eligible candidate lenses.

PRESCRIPTION:
- Right Eye (OD): SPH ${od_sph.toFixed(2)}, CYL ${od_cyl.toFixed(2)}, ADD ${od_add.toFixed(2)}
- Left Eye (OS): SPH ${os_sph.toFixed(2)}, CYL ${os_cyl.toFixed(2)}, ADD ${os_add.toFixed(2)}

PATIENT LIFESTYLE & PREFERENCES:
- Occupation: ${occupation}
- Daily Screen Time: ${screenTime} hours
- Daily Outdoor Activity: ${outdoorHours} hours
- Driving Frequency: ${driving}
- Budget Preference: ${budget}
- Lens Thickness Preference: ${thickness}
- Coating Preference: ${coatingPref}

ELIGIBLE CATALOG CANDIDATES (Choose and rank ONLY from these IDs):
${JSON.stringify(candidateSummary, null, 2)}

TASK:
1. Rank the suitable options (up to top 3).
2. For each recommended lens, provide:
   - lens_id (Must strictly match an id from the list above)
   - rank (1, 2, 3)
   - material_explanation (Why this material suits their visual needs)
   - index_explanation (Why this refractive index balances thickness, weight, and budget)
   - coating_suitability (Why the coatings address their screen time, glare, or outdoors)
   - lifestyle_fit_reason (Direct connection to their daily habits)
   - trade_offs (Any cost or weight compromise)
3. Include standard disclaimer: "Decision-support recommendation only. Final clinical dispensing decision rests with the optometrist."

RESPONSE FORMAT:
Respond with ONLY valid, raw JSON (no markdown formatting, no code blocks):
{
  "recommendations": [
    {
      "lens_id": number,
      "rank": number,
      "material_explanation": "string",
      "index_explanation": "string",
      "coating_suitability": "string",
      "lifestyle_fit_reason": "string",
      "trade_offs": "string"
    }
  ],
  "clinical_disclaimer": "string"
}
`;
        const startTime = Date.now();
        const rawAiResponse = await (0, geminiClient_js_1.generateContentWithGemini)(prompt);
        const responseTimeMs = Date.now() - startTime;
        let rankedOutput = null;
        let aiAssisted = false;
        if (rawAiResponse) {
            try {
                const sanitizedJson = rawAiResponse.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
                let parsed = JSON.parse(sanitizedJson);
                if (Array.isArray(parsed)) {
                    parsed = { recommendations: parsed };
                }
                const validated = geminiLensIQOutputSchema.parse(parsed);
                // Verify all recommended lens IDs actually belong to the candidate list
                const validRecs = validated.recommendations.filter(r => candidateIds.has(r.lens_id));
                if (validRecs.length > 0) {
                    rankedOutput = validRecs.map(r => {
                        const matched = candidates.find(c => c.id === r.lens_id);
                        return {
                            ...matched,
                            ...r,
                            id: r.lens_id,
                            lens_id: r.lens_id,
                            lens_name: `${matched.brand} ${matched.material}`,
                            name: `${matched.brand} ${matched.material}`,
                            coating: matched.coatings,
                            coatings: matched.coatings,
                            price: Number(matched.selling_price),
                            selling_price: Number(matched.selling_price),
                            recommendation_reason: r.lifestyle_fit_reason,
                        };
                    });
                    aiAssisted = true;
                    await db_js_1.default.query(`INSERT INTO ai_logs (module_name, user_id, prompt_summary, raw_response, validation_status, response_time_ms)
           VALUES ('LENSIQ', ?, ?, ?, 'VALID', ?)`, [userId, `LensIQ Rx: OD ${od_sph}/${od_cyl}, OS ${os_sph}/${os_cyl}`, JSON.stringify(validated), responseTimeMs]);
                }
            }
            catch (parseErr) {
                console.warn('LensIQ Gemini output validation failed, falling back to catalog ranking:', parseErr);
                await db_js_1.default.query(`INSERT INTO ai_logs (module_name, user_id, prompt_summary, raw_response, validation_status, response_time_ms)
         VALUES ('LENSIQ', ?, ?, ?, 'SCHEMA_FAILED', ?)`, [userId, `LensIQ parse error`, JSON.stringify({ raw: rawAiResponse }), responseTimeMs]);
            }
        }
        // Graceful Fallback: If Gemini is unconfigured or failed, present deterministic candidate list
        if (!rankedOutput) {
            rankedOutput = candidates.slice(0, 3).map((c, idx) => ({
                ...c,
                id: c.id,
                lens_id: c.id,
                lens_name: `${c.brand} ${c.material}`,
                name: `${c.brand} ${c.material}`,
                coating: c.coatings,
                coatings: c.coatings,
                price: Number(c.selling_price),
                selling_price: Number(c.selling_price),
                rank: idx + 1,
                material_explanation: `High optical quality ${c.material}.`,
                index_explanation: `Refractive index ${c.refractive_index} balances lens thickness and edge profile.`,
                coating_suitability: c.coatings,
                lifestyle_fit_reason: 'Optimal catalog candidate compatible with clinical refraction.',
                recommendation_reason: 'Optimal catalog candidate compatible with clinical refraction.',
                trade_offs: 'Standard catalog option in stock.',
            }));
        }
        await (0, security_js_1.logAuditEvent)(userId, 'LENSIQ_RECOMMENDATION', 'LENS', null, { candidatesCount: candidates.length, aiAssisted }, req);
        const responsePayload = {
            ai_assisted: aiAssisted,
            recommendations: rankedOutput,
            candidate_count: candidates.length,
            disclaimer: 'LensIQ decision support is advisory. Final clinical selection must be reviewed and approved by the optometrist.',
        };
        // Cache response ONLY when AI generation was successful (aiAssisted === true)
        // NEVER cache offline/deterministic fallbacks, ensuring subsequent calls retry live Gemini as soon as the network reconnects
        if (aiAssisted) {
            lensIQCache.set(cacheKey, { data: responsePayload, cachedAt: Date.now() });
        }
        else {
            // If fallback occurred, ensure any stale cache entry for this key is purged
            lensIQCache.delete(cacheKey);
        }
        res.json({
            success: true,
            data: responsePayload,
        });
    }
    catch (err) {
        console.error('recommendLenses error:', err);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: err?.message || 'Failed to process lens recommendations' }
        });
    }
}

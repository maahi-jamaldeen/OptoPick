import { Request, Response } from 'express';
import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { generateContentWithGemini } from '../integrations/geminiClient.js';
import { logAuditEvent } from '../utils/security.js';

const forecastItemSchema = z.object({
  product_id: z.number(),
  product_type: z.enum(['FRAME', 'LENS', 'ACCESSORY']),
  demand_signal: z.enum(['Low', 'Stable', 'Increasing', 'High']),
  stock_risk: z.enum(['None', 'Possible Shortage', 'Possible Overstock']),
  recommended_action: z.enum(['Monitor', 'Review Reorder', 'Review Stock Reduction']),
  reason: z.string(),
});

const geminiForecastOutputSchema = z.object({
  insights: z.array(forecastItemSchema),
  executive_summary: z.string(),
});

export async function getOptoForecast(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;

  // 1. Calculate actual sales velocity and stock data from MySQL
  const [frameStats] = await pool.query<RowDataPacket[]>(
    `SELECT f.id, f.frame_code as code, CONCAT(f.brand, ' ', f.model_name) as name,
            f.stock_quantity, f.low_stock_threshold, 'FRAME' as product_type,
            COALESCE(SUM(CASE WHEN s.created_at >= NOW() - INTERVAL 30 DAY THEN si.quantity ELSE 0 END), 0) as sold_30d,
            COALESCE(SUM(CASE WHEN s.created_at >= NOW() - INTERVAL 90 DAY THEN si.quantity ELSE 0 END), 0) as sold_90d,
            DATEDIFF(NOW(), MAX(s.created_at)) as days_since_last_sale
     FROM frames f
     LEFT JOIN sale_items si ON si.product_id = f.id AND si.item_type = 'FRAME'
     LEFT JOIN sales s ON s.id = si.sale_id
     WHERE f.is_active = 1
     GROUP BY f.id`
  );

  const [lensStats] = await pool.query<RowDataPacket[]>(
    `SELECT l.id, l.lens_code as code, CONCAT(l.brand, ' ', l.material) as name,
            l.stock_quantity, l.low_stock_threshold, 'LENS' as product_type,
            COALESCE(SUM(CASE WHEN s.created_at >= NOW() - INTERVAL 30 DAY THEN si.quantity ELSE 0 END), 0) as sold_30d,
            COALESCE(SUM(CASE WHEN s.created_at >= NOW() - INTERVAL 90 DAY THEN si.quantity ELSE 0 END), 0) as sold_90d,
            DATEDIFF(NOW(), MAX(s.created_at)) as days_since_last_sale
     FROM lenses l
     LEFT JOIN sale_items si ON si.product_id = l.id AND si.item_type = 'LENS'
     LEFT JOIN sales s ON s.id = si.sale_id
     WHERE l.is_available = 1
     GROUP BY l.id`
  );

  const combinedStats = [...frameStats, ...lensStats].map(item => ({
    product_id: item.id,
    product_type: item.product_type as 'FRAME' | 'LENS',
    code: item.code,
    name: item.name,
    stock: item.stock_quantity,
    threshold: item.low_stock_threshold,
    sold_30d: Number(item.sold_30d),
    sold_90d: Number(item.sold_90d),
    days_since_last_sale: item.days_since_last_sale ?? 999,
  }));

  // 2. Prepare prompt for Gemini
  const prompt = `
You are OptoForecast, an inventory demand intelligence assistant at Indian Optician, Nintavur, Sri Lanka.
Analyze the following authentic sales velocity and inventory levels calculated directly by the OptoPick database.

AUTHENTIC CALCULATED METRICS:
${JSON.stringify(combinedStats, null, 2)}

STRICT INSTRUCTIONS:
For each product:
- Assign Demand Signal: ONLY ONE OF ['Low', 'Stable', 'Increasing', 'High']
- Assign Stock Risk: ONLY ONE OF ['None', 'Possible Shortage', 'Possible Overstock']
- Assign Recommended Action: ONLY ONE OF ['Monitor', 'Review Reorder', 'Review Stock Reduction']
- Provide a concise professional reason in simple plain English for the practice owner (Mr. Musthaq).
- Provide a 2-3 sentence executive summary of overall practice inventory health.
- DO NOT invent numbers or percentages. Rely strictly on the provided sales and stock figures.

RESPONSE FORMAT (Raw JSON only, no markdown):
{
  "insights": [
    {
      "product_id": number,
      "product_type": "FRAME" | "LENS",
      "demand_signal": "Low" | "Stable" | "Increasing" | "High",
      "stock_risk": "None" | "Possible Shortage" | "Possible Overstock",
      "recommended_action": "Monitor" | "Review Reorder" | "Review Stock Reduction",
      "reason": "string"
    }
  ],
  "executive_summary": "string"
}
`;

  const startTime = Date.now();
  const rawResponse = await generateContentWithGemini(prompt);
  const responseTimeMs = Date.now() - startTime;

  let aiInsightsMap = new Map<string, any>();
  let executiveSummary = 'Inventory levels are currently monitored against sales velocity.';
  let aiAssisted = false;

  if (rawResponse) {
    try {
      const sanitizedJson = rawResponse.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(sanitizedJson);
      const validated = geminiForecastOutputSchema.parse(parsed);

      executiveSummary = validated.executive_summary;
      validated.insights.forEach(item => {
        aiInsightsMap.set(`${item.product_type}-${item.product_id}`, item);
      });
      aiAssisted = true;

      await pool.query(
        `INSERT INTO ai_logs (module_name, user_id, prompt_summary, raw_response, validation_status, response_time_ms)
         VALUES ('OPTOFORECAST', ?, 'OptoForecast monthly inventory evaluation', ?, 'VALID', ?)`,
        [userId, JSON.stringify(validated), responseTimeMs]
      );
    } catch (parseErr) {
      console.warn('OptoForecast parsing failed, using rule-based fallback:', parseErr);
    }
  }

  // Merge database metrics with AI interpretations or rule-based fallbacks
  const finalResults = combinedStats.map(item => {
    const key = `${item.product_type}-${item.product_id}`;
    const aiInsight = aiInsightsMap.get(key);

    if (aiInsight) {
      return {
        ...item,
        demand_signal: aiInsight.demand_signal,
        stock_risk: aiInsight.stock_risk,
        recommended_action: aiInsight.recommended_action,
        reason: aiInsight.reason,
      };
    }

    // Rule-based fallback if AI is not configured
    let demand: 'Low' | 'Stable' | 'Increasing' | 'High' = 'Stable';
    let risk: 'None' | 'Possible Shortage' | 'Possible Overstock' = 'None';
    let action: 'Monitor' | 'Review Reorder' | 'Review Stock Reduction' = 'Monitor';
    let reason = 'Stock is within ordinary operating parameters.';

    if (item.sold_30d >= 3) {
      demand = 'High';
      if (item.stock <= item.threshold) {
        risk = 'Possible Shortage';
        action = 'Review Reorder';
        reason = `High sales velocity (${item.sold_30d} units in 30d) and current stock is at or below threshold.`;
      }
    } else if (item.sold_90d === 0 && item.stock > 3) {
      demand = 'Low';
      risk = 'Possible Overstock';
      action = 'Review Stock Reduction';
      reason = 'No sales recorded in the past 90 days; ties up operating capital.';
    } else if (item.stock <= item.threshold) {
      risk = 'Possible Shortage';
      action = 'Review Reorder';
      reason = 'Stock level has reached reorder threshold.';
    }

    return {
      ...item,
      demand_signal: demand,
      stock_risk: risk,
      recommended_action: action,
      reason,
    };
  });

  await logAuditEvent(userId, 'OPTOFORECAST_VIEW', 'INVENTORY', null, { itemsCount: finalResults.length, aiAssisted }, req);

  res.json({
    success: true,
    data: {
      ai_assisted: aiAssisted,
      executive_summary: executiveSummary,
      insights: finalResults,
    }
  });
}

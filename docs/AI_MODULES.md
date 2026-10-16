# OptoPick — AI Subsystems Engineering Specification

## 1. Architectural Philosophy: Deterministic First, AI Second

In healthcare and optometric retail, unconstrained artificial intelligence poses severe clinical and financial risks. An AI model hallucinating an impossible optical lens or advising incorrect cylinder transposition can cause patient eye strain, headaches, and financial loss.

**OptoPick** implements a rigorous **Deterministic First, AI Second** architectural paradigm:
1. **Clinical & Technical Boundaries are 100% Deterministic:** Physics, optical prescription boundaries, stock availability, and financial totals are governed exclusively by MySQL constraints and backend TypeScript code.
2. **AI Functions Strictly as Decision Support:** The Google Gemini API is utilized exclusively for multi-variable ranking, qualitative reasoning synthesis, demand summarization, and tone adaptation.
3. **Zero-PII Privacy Barrier:** No customer names, phone numbers, email addresses, or national identity data are ever transmitted to external AI endpoints.
4. **Resilient Fail-Soft Redundancy:** If the external AI service is unreachable, rate-limited, or returns invalid syntax, OptoPick falls back instantaneously to deterministic catalog algorithms with zero disruption to daily optical center operations.

```
+-----------------------------------------------------------------------------------+
|                           OPTICAL DISPENSING WORKFLOW                             |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|               STAGE 1: DETERMINISTIC FILTERING (MySQL & Backend)                 |
|  - Queries catalog where stock_quantity > 0 AND is_available = 1                  |
|  - Bounded by diopter limits: min_sph <= Rx <= max_sph, min_cyl <= Rx <= max_cyl  |
|  - Design gating: Presbyopia (ADD > 0) -> Bifocal/Progressive; Distance -> Single |
+-----------------------------------------------------------------------------------+
                                         |
                       [ Verified Technical Candidates Only ]
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                  STAGE 2: GEMINI LIFESTYLE RANKING & REASONING                    |
|  - Prompt constructed with candidate IDs + lifestyle questionnaire inputs         |
|  - Strictly isolated from PII (Zero names, phone numbers, or addresses)          |
|  - Gemini ranks top candidates and explains optical coating & index benefits      |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                    VALIDATION GATEWAY & HALLUCINATION FILTER                      |
|  - Zod schema validates raw JSON response structure                               |
|  - Strips any lens ID not present in Stage 1 candidate pool                       |
|  - Fallback to catalog ordering if parsing fails                                  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                       DISPENSING DECISION SUPPORT DISPLAY                         |
|  - Ranked candidates presented to Optometrist / Dispenser with trade-offs         |
|  - Mandatory clinical advisory disclaimer displayed                               |
+-----------------------------------------------------------------------------------+
```

---

## 2. Module 1: LensIQ — Intelligent Lens Recommendation Engine

### 2.1 Problem Solved (P-04)
At Indian Optician, staff traditionally relied on memory and manufacturer booklets to recommend lenses, often defaulting to basic plastic lenses even for heavy computer users or high myopes, leading to chromatic aberration, unnecessary lens weight, and lost revenue opportunities.

### 2.2 Stage 1: Deterministic Optical Filtering
Before invoking AI, the backend executes an authoritative SQL query against `lenses`:
```sql
SELECT id, lens_code, brand, design_type, material, refractive_index, coatings,
       min_sph, max_sph, min_cyl, max_cyl, selling_price, stock_quantity
FROM lenses
WHERE is_available = 1
  AND stock_quantity > 0
  AND min_sph <= ? AND max_sph >= ?  -- OD Sphere
  AND min_sph <= ? AND max_sph >= ?  -- OS Sphere
  AND min_cyl <= ? AND max_cyl >= ?  -- OD Cylinder
  AND min_cyl <= ? AND max_cyl >= ?  -- OS Cylinder
  AND design_type = ?                -- Gated by presence of ADD power
ORDER BY refractive_index ASC, selling_price ASC;
```

### 2.3 Stage 2: Gemini Multi-Factor Evaluation
Eligible catalog candidates are packaged into a structured prompt alongside patient lifestyle variables:
- **Daily Screen Time (Hours):** Drives recommendation for blue-violet light filtration and anti-reflective multi-coatings.
- **Outdoor Activity (Hours):** Determines necessity of photochromic transition technology or UV400 blocking.
- **Driving Frequency (Low / Moderate / High):** Prioritizes anti-glare hydrophobic coatings for night-time halogen dazzle reduction.
- **Thickness & Aesthetic Preference:** High minus prescriptions (e.g., SPH < -4.00 D) are matched with 1.61, 1.67, or 1.74 high-index materials to minimize edge thickness.
- **Budget Preference:** Respects customer constraints (Economy, Standard, Premium).

### 2.4 Anti-Hallucination & Safety Validation
The raw response is parsed against `geminiLensIQOutputSchema`:
```typescript
const validRecs = validated.recommendations.filter(r => candidateIds.has(r.lens_id));
```
Any recommendation containing a `lens_id` that was not in the deterministic candidate pool is rejected immediately, preventing the dispensing of non-existent or technically incompatible lenses.

---

## 3. Module 2: OptoForecast — Predictive Demand & Stock Intelligence

### 3.1 Problem Solved (P-05)
Stockouts of popular anti-reflective progressive lenses and fast-moving unisex frames occurred unexpectedly, while obsolete fashion frames occupied valuable display space without sales for over six months.

### 3.2 Sales Velocity Analytics
OptoForecast aggregates historical transactions from `sale_items`, `sales`, and `inventory_movements`:
- **Rolling Sales Velocity:** Daily and 30-day unit turnover rate per SKU.
- **Days of Inventory Remaining (DIR):** `Current Stock / (30-Day Sales / 30)`.
- **Classification Engine:**
  - `FAST_MOVING`: SKUs with sales velocity exceeding 1.5 units/week and DIR < 14 days.
  - `LOW_STOCK_CRITICAL`: SKUs where `stock_quantity <= low_stock_threshold`.
  - `SLOW_MOVING_EXCESS`: SKUs with `stock_quantity > 10` and zero sales in the preceding 60 days.

### 3.3 Gemini Contextual Synthesis
The deterministic metric summaries are provided to Gemini to generate actionable procurement intelligence:
- Identifies emerging demand trends specific to Nintavur and the Eastern Province (e.g., student eye examinations during school term intake).
- Suggests targeted supplier reorder batches with recommended reorder quantities.
- Formulates promotional clearance strategies for slow-moving frame designs.

---

## 4. Module 3: OptoRecall — Automated Customer Retention Engine

### 4.1 Problem Solved (P-06)
Indian Optician had no structured recall mechanism. Spectacles sent to the Colombo glazing laboratory often sat ready on shelves for weeks without patient collection, and patients rarely returned for their annual 12-month optical review.

### 4.2 Candidate Detection Rules
1. **Order Ready for Collection:**
   - Condition: `sales.order_status = 'READY_FOR_COLLECTION'` AND `sales.updated_at <= NOW() - INTERVAL 3 DAY`.
   - Goal: Prompt customer to collect their spectacles and settle any remaining balance.
2. **Annual Refraction Review Due:**
   - Condition: `prescriptions.exam_date BETWEEN NOW() - INTERVAL 13 MONTH AND NOW() - INTERVAL 11 MONTH` AND no subsequent examination exists for the customer.
   - Goal: Remind customer that prescription clarity and eye health degrade over 12 months.
3. **Lapsed Customer:**
   - Condition: Last recorded sale was greater than 18 months ago.
   - Goal: Friendly check-in invitation for a complimentary optical adjustment.

### 4.3 Human-in-the-Loop Review & Approval Gate
OptoRecall strictly prevents autonomous dispatch of unreviewed messages:
```
[ OptoRecall Engine identifies candidate ]
                 |
                 v
[ Gemini drafts courteous, personalized message ]
                 |
                 v
[ DRAFT DISPLAYED IN OPTOPICK UI MODAL ]
- Recipient phone and email displayed
- Textarea populated with AI draft
- Optical Staff / Optometrist edits or refines text
                 |
        +--------+--------+
        |                 |
[ CANCEL / DISCARD ]   [ APPROVE & DISPATCH ]
                          |
                          v
               - Recorded in communications table
               - Dispatched via Nodemailer SMTP / SMS
```

---

## 5. AI Auditing, Telemetry & Logging

All external AI interactions are recorded in the relational table `ai_logs`:
- `module_name`: `'LENSIQ'`, `'OPTO_FORECAST'`, or `'OPTO_RECALL'`.
- `user_id`: ID of the authenticated staff member who triggered the action.
- `prompt_summary`: Truncated, anonymized summary of prompt parameters.
- `raw_response`: Verbatim JSON response string returned by Gemini.
- `validation_status`: `'VALID'`, `'SCHEMA_FAILED'`, or `'NETWORK_ERROR'`.
- `response_time_ms`: Round-trip execution latency in milliseconds.
- `created_at`: Exact timestamp.

This ensures complete diagnostic visibility and adherence to clinical governance standards.

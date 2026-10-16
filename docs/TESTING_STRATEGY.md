# OptoPick — Quality Assurance & Testing Strategy

## 1. Quality Assurance Philosophy
Because OptoPick is deployed in an active optometric facility (**Indian Optician, Nintavur, Sri Lanka**), testing must guarantee both **clinical optical precision** and **retail financial integrity**. A single software bug could result in an incorrectly ground lens, financial imbalance during customer collection, or unauthorized access to sensitive patient refraction records.

---

## 2. Multi-Tier Testing Architecture

```
+-------------------------------------------------------------+
|                END-TO-END ACCEPTANCE TESTING                |
|  Complete workflow verification via browser & live API calls|
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                INTEGRATION & RBAC SECURITY                  |
|  Role barrier verification (ADMIN vs STAFF), ACID sales     |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|              DETERMINISTIC AI SAFETY TESTING                |
|  Zod schema validation, hallucination rejection, fallbacks  |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                     UNIT TEST SUITE                         |
|  Node native test runner (node:test) with tsx execution     |
+-------------------------------------------------------------+
```

---

## 3. Automated Test Suites & Results

OptoPick includes an automated test suite implemented using Node's native test runner (`node:test`) and strict assertions (`node:assert/strict`).

### 3.1 Test Execution
To execute the automated test suite:
```bash
cd backend
npm test
```

### 3.2 Automated Test Execution Summary
```
TAP version 13
# Subtest: Optical Center Financial Precision & Billing Tests (LKR)
    ok 1 - should accurately calculate subtotal for combined frame, lenses, and accessories
    ok 2 - should correctly apply promotional discount without negative drift
    ok 3 - should cap discount at subtotal so total does not become negative
    ok 4 - should handle full payment settlement upon immediate sale
    ok 5 - should avoid JavaScript floating-point rounding errors on decimal cents
ok 1 - Optical Center Financial Precision & Billing Tests (LKR) [5 tests, 0 failures]

# Subtest: LensIQ 2-Stage Decision Support Engine Tests
    ok 1 - Stage 1: should filter out progressive lenses and out-of-stock lenses for a single-vision prescription
    ok 2 - Stage 1: should exclude standard 1.50 lens for high myopia beyond its range (-6.50 D)
    ok 3 - Stage 1: should only select progressive/bifocal lenses when near addition (ADD) is present
    ok 4 - Stage 2: should strictly validate and enforce Gemini output schema
    ok 5 - Stage 2 Safety Barrier: should discard AI recommendations if the AI hallucinated an invalid lens ID
ok 2 - LensIQ 2-Stage Decision Support Engine Tests [5 tests, 0 failures]

# Subtest: Clinical Refraction & Customer Validation Tests
    ok 1 - should accept valid refraction parameters according to clinical optical standards
    ok 2 - should reject out-of-range sphere power (> +20.00 D or < -20.00 D)
    ok 3 - should reject invalid cylinder axis angle (> 180 degrees or negative)
    ok 4 - should reject anatomical pupillary distance out of clinical limits (40 to 80 mm)
    ok 5 - should validate customer details with valid Sri Lankan contact format
    ok 6 - should reject customer record without name or with empty phone number
ok 3 - Clinical Refraction & Customer Validation Tests [6 tests, 0 failures]

# Subtest: OptoPick Role-Based Access Control (RBAC) Tests
    ok 1 - Optometrist (ADMIN) should be granted access to clinical examinations and forecasting
    ok 2 - Optical Staff (STAFF) must be blocked (403 Forbidden) from creating examinations or accessing opto-forecast
    ok 3 - Both ADMIN and STAFF roles should have access to dispensing, inventory, sales, and LensIQ
    ok 4 - Unauthenticated requests must be blocked with HTTP 401 Unauthorized
    ok 5 - System roles must be strictly constrained to ADMIN and STAFF
ok 4 - OptoPick Role-Based Access Control (RBAC) Tests [5 tests, 0 failures]

1..4
# tests 21 | suites 4 | pass 21 | fail 0 | cancelled 0 | skipped 0
# Duration: ~1.2s
```

---

## 4. Boundary Value Analysis (BVA) & Negative Testing

| Test ID | Subsystem | Tested Input / Condition | Expected Behavior | Automated Result |
| :--- | :--- | :--- | :--- | :--- |
| `BVA-01` | Refraction | SPH = `-25.50 D` (Beyond clinical limit) | Rejected with 400 Bad Request | Passed |
| `BVA-02` | Refraction | AXIS = `210°` (Beyond 180° limit) | Rejected with 400 Bad Request | Passed |
| `BVA-03` | Refraction | Pupillary Distance = `25.0 mm` | Rejected as anatomically impossible | Passed |
| `BVA-04` | Billing | Discount = `LKR 5,000` on Subtotal `LKR 3,000` | Discount capped at `LKR 3,000`; Total = `0.00` | Passed |
| `BVA-05` | Billing | Floating point precision: `100.10 + 200.20 - 0.30` | Exactly `300.00` (Zero IEEE-754 drift) | Passed |
| `BVA-06` | LensIQ | Presbyopic Rx (ADD = `+2.00 D`) | Single vision lenses excluded; Bifocal/Progressive selected | Passed |
| `BVA-07` | LensIQ | Gemini returns hallucinated lens ID `9999` | Stripped by Stage 1 candidate filter | Passed |
| `BVA-08` | RBAC | Optical Staff requests `POST /api/examinations` | Blocked with HTTP 403 Forbidden | Passed |
| `BVA-09` | RBAC | Optical Staff requests `GET /api/ai/opto-forecast` | Blocked with HTTP 403 Forbidden | Passed |
| `BVA-10` | Auth | Missing session cookie on protected route | Blocked with HTTP 401 Unauthorized | Passed |

---

## 5. End-to-End Operational Workflow Validation

The application was validated through end-to-end operational workflows:
1. **Patient Registration & Refraction:** Registering a patient, conducting optical refraction, saving SPH/CYL/AXIS/ADD/PD, and checking prescription history.
2. **LensIQ Consultation:** Selecting customer prescription, inputting 8 screen hours and high driving, receiving ranked 1.61 anti-reflective recommendations with clinical explanations.
3. **Advance Sale & Workshop Transition:** Creating a custom fitting order, paying a partial advance in LKR, confirming stock reservation, transitioning status from `DISPATCHED_TO_LAB` to `READY_FOR_COLLECTION`.
4. **Settlement & Collection:** Paying remaining balance, verifying automatic status update to `COLLECTED` and `PAID`, generating printable receipt.
5. **OptoRecall Approval Gate:** Reviewing ready collection notification, editing greeting in the UI modal, approving dispatch, and confirming communication log creation.

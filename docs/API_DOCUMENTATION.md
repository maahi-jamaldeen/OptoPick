# OptoPick — REST API Documentation & Engineering Specification

## 1. Architectural Overview & Standards
All API endpoints follow RESTful design principles and produce standard JSON responses. The application runs on Express with TypeScript, backed by connection-pooled MySQL transactions and secured by HMAC session cookies and Argon2id password hashing.

### 1.1 Base URL
- Development: `http://localhost:5000/api`
- Production: `https://<domain-or-ip>/api`

### 1.2 Authentication & Headers
- **Session Transport:** HTTP-only, secure, SameSite cookies (`optopick_session`) signed via HMAC-SHA256 (`COOKIE_SECRET`).
- **CSRF & Cross-Origin:** Strict CORS policy allowing only designated frontend origins (default: `http://localhost:3000`).
- **Content-Type:** `application/json` for all request bodies.

### 1.3 Uniform Response Formats

#### Standard Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

#### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human-readable descriptive error message",
    "details": [ ... ]
  }
}
```

#### Common HTTP Status Codes
| Code | Meaning | Typical Trigger |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | Successful GET, PUT, or standard POST |
| `201 Created` | Entity created | Successful registration, examination, sale, or product addition |
| `400 Bad Request` | Validation failure | Missing required fields, schema rejection by Zod, insufficient stock |
| `401 Unauthorized` | Not authenticated | Missing or tampered session cookie |
| `403 Forbidden` | RBAC restriction | Optical Staff attempting to access Optometrist-only endpoints |
| `404 Not Found` | Entity not found | Invalid customer ID, missing prescription ID, or unknown product |
| `429 Too Many Requests` | Rate limit breached | Exceeding 100 requests per 15-minute window |
| `500 Internal Error` | Server fault | Unhandled database or system exception |

---

## 2. Authentication & Session Endpoints (`/api/auth`)

### 2.1 User Login
- **URL:** `POST /api/auth/login`
- **Access:** Public (Rate-limited to 5 attempts per 15 min per IP)
- **Description:** Verifies username and Argon2id password hash, sets signed session cookie.
- **Request Body:**
```json
{
  "username": "optometrist",
  "password": "Admin@12345"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "optometrist",
      "full_name": "M. S. Mohamed Musthaq",
      "email": "musthaq@indianoptician.lk",
      "role": "ADMIN"
    }
  }
}
```

### 2.2 Current Session Profile
- **URL:** `GET /api/auth/me`
- **Access:** Authenticated (`ADMIN`, `STAFF`)
- **Description:** Returns currently authenticated user session.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "optometrist",
      "full_name": "M. S. Mohamed Musthaq",
      "email": "musthaq@indianoptician.lk",
      "role": "ADMIN"
    }
  }
}
```

### 2.3 User Logout
- **URL:** `POST /api/auth/logout`
- **Access:** Authenticated (`ADMIN`, `STAFF`)
- **Description:** Clears the HTTP-only session cookie.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": { "message": "Successfully logged out" }
}
```

---

## 3. Dashboard Endpoints (`/api/dashboard`)

### 3.1 Financial & Operational KPI Statistics
- **URL:** `GET /api/dashboard/stats`
- **Access:** Authenticated (`ADMIN`, `STAFF`)
  - *Note:* If role is `STAFF`, financial revenue figures are masked/hidden, showing operational queues and low stock metrics only.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "total_revenue": 485000.00,
    "sales_count": 34,
    "pending_workshop_orders": 6,
    "ready_for_collection_count": 4,
    "low_stock_count": 5,
    "active_customers": 128
  }
}
```

### 3.2 Sales & Order Trends (Recharts)
- **URL:** `GET /api/dashboard/trends`
- **Access:** Authenticated (`ADMIN` only)
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "monthly_sales": [
      { "month": "May 2026", "revenue": 125000.00, "orders": 12 },
      { "month": "Jun 2026", "revenue": 185000.00, "orders": 18 }
    ],
    "category_breakdown": [
      { "item_type": "FRAME", "count": 28, "total_lkr": 240000.00 },
      { "item_type": "LENS", "count": 32, "total_lkr": 195000.00 },
      { "item_type": "ACCESSORY", "count": 14, "total_lkr": 50000.00 }
    ]
  }
}
```

---

## 4. Customer Management Endpoints (`/api/customers`)

### 4.1 Search & List Customers
- **URL:** `GET /api/customers?search=Nintavur`
- **Access:** Authenticated (`ADMIN`, `STAFF`)
- **Query Parameters:**
  - `search` (optional): Matches against `customer_code`, `full_name`, or `phone_number`.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "customer_code": "CUST-2026-0001",
      "full_name": "A. R. Mohamed Fazil",
      "phone_number": "0773456789",
      "email": "fazil@example.com",
      "address": "Hospital Road, Nintavur",
      "age": 34,
      "gender": "MALE",
      "occupation": "School Teacher",
      "created_at": "2026-10-10T09:30:00.000Z"
    }
  ]
}
```

### 4.2 Create New Customer
- **URL:** `POST /api/customers`
- **Access:** Authenticated (`ADMIN`, `STAFF`)
- **Request Body:**
```json
{
  "full_name": "K. L. Fathima Rizna",
  "phone_number": "0768912345",
  "email": "rizna@example.com",
  "address": "Main Street, Sammanthurai",
  "age": 28,
  "gender": "FEMALE",
  "occupation": "Software QA Engineer",
  "preferences_notes": "Allergic to nickel frames. Prefers blue-defense coatings."
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "customer_code": "CUST-2026-0005",
    "full_name": "K. L. Fathima Rizna"
  }
}
```

---

## 5. Clinical Examination & Refraction (`/api/examinations`)

### 5.1 Record Clinical Examination & Prescription
- **URL:** `POST /api/examinations`
- **Access:** Strictly Optometrist (`ADMIN`)
- **Description:** Inserts clinical examination, signs electronic prescription, and automatically marks previous prescriptions for this customer as `is_latest = 0`.
- **Request Body:**
```json
{
  "customer_id": 5,
  "exam_date": "2026-10-14",
  "clinical_notes": "Mild asthenopia, screen exposure > 8 hrs. Fundus clear, IOP normal.",
  "od_sph": -2.25,
  "od_cyl": -0.75,
  "od_axis": 90,
  "od_add": 0.00,
  "os_sph": -2.00,
  "os_cyl": -0.50,
  "os_axis": 85,
  "os_add": 0.00,
  "pd": 63.0
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "examination_id": 8,
    "prescription_id": 8,
    "message": "Clinical examination recorded and prescription issued."
  }
}
```

### 5.2 Prescription Chronological History
- **URL:** `GET /api/examinations/customer/:customerId`
- **Access:** Authenticated (`ADMIN`, `STAFF`)
- **Response `200 OK`:** Returns array of historical prescriptions for side-by-side comparison of refractive shift over time.

---

## 6. Catalog & Inventory (`/api/products`, `/api/inventory`)

### 6.1 List Product Catalog
- **URLs:**
  - `GET /api/products/frames`
  - `GET /api/products/lenses`
  - `GET /api/products/accessories`
  - `GET /api/products/suppliers`
- **Access:** Authenticated (`ADMIN`, `STAFF`)

### 6.2 Stock-In Replenishment
- **URL:** `POST /api/inventory/stock-in`
- **Access:** Authenticated (`ADMIN`, `STAFF`)
- **Description:** Adds physical inventory to stock and records an immutable entry in `inventory_movements`.
- **Request Body:**
```json
{
  "product_type": "FRAME",
  "product_id": 3,
  "quantity": 10,
  "notes": "Replenished from VisionTech Lanka invoice #VT-9921"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "new_stock": 18,
    "message": "Stock replenished successfully."
  }
}
```

---

## 7. Sales, Dispensing & ACID Transactions (`/api/sales`)

### 7.1 Create Sale / Custom Fitting Order
- **URL:** `POST /api/sales`
- **Access:** Authenticated (`ADMIN`, `STAFF`)
- **Description:** Executes ACID transaction: reserves inventory, deducts stock, calculates LKR totals, generates `INV-YYYY-XXXX`, and logs initial advance payment.
- **Request Body:**
```json
{
  "customer_id": 5,
  "prescription_id": 8,
  "items": [
    { "item_type": "FRAME", "product_id": 2, "quantity": 1, "unit_price": 9500.00 },
    { "item_type": "LENS", "product_id": 4, "quantity": 2, "unit_price": 4500.00 }
  ],
  "discount_amount": 1000.00,
  "paid_amount": 10000.00,
  "payment_method": "CASH",
  "order_type": "CUSTOM_FITTING_ORDER",
  "notes": "Patient requested anti-glare fitting before Friday."
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "sale_id": 14,
    "sale_number": "INV-2026-0014",
    "subtotal": 18500.00,
    "discount_amount": 1000.00,
    "total_amount": 17500.00,
    "paid_amount": 10000.00,
    "balance_amount": 7500.00,
    "payment_status": "PARTIALLY_PAID",
    "order_status": "DISPATCHED_TO_LAB"
  }
}
```

### 7.2 Add Balance Payment
- **URL:** `POST /api/sales/:id/payments`
- **Access:** Authenticated (`ADMIN`, `STAFF`)
- **Request Body:**
```json
{
  "amount": 7500.00,
  "payment_method": "CARD",
  "payment_type": "BALANCE"
}
```
- **Response `200 OK`:** Updates `paid_amount`, sets `balance_amount = 0.00`, and transitions `payment_status` to `PAID`.

### 7.3 Update Workshop Status
- **URL:** `PATCH /api/sales/:id/order-status`
- **Access:** Authenticated (`ADMIN`, `STAFF`)
- **Request Body:**
```json
{
  "order_status": "READY_FOR_COLLECTION"
}
```

---

## 8. AI Modules (`/api/ai`)

### 8.1 LensIQ Recommendation Engine
- **URL:** `POST /api/ai/lens-iq/recommend`
- **Access:** Authenticated (`ADMIN`, `STAFF`)
- **Description:** Executes 2-stage recommendation. Stage 1 queries MySQL deterministically for optical power matching and stock availability. Stage 2 provides Gemini-powered lifestyle ranking and explanation.
- **Request Body:**
```json
{
  "prescription_id": 8,
  "occupation": "Software Engineer",
  "screen_time_hours": 10,
  "outdoor_activity_hours": 1,
  "driving_frequency": "LOW",
  "budget_preference": "STANDARD",
  "thickness_preference": "THIN",
  "coating_preference": "Blue Defense Anti-Reflective"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "ai_assisted": true,
    "recommendations": [
      {
        "lens_id": 4,
        "rank": 1,
        "lens_code": "LENS-SV-161-BC",
        "brand": "Kodak UVBlue Lens",
        "selling_price": 4500.00,
        "material_explanation": "MR-8 resin provides outstanding optical clarity with high impact resistance.",
        "index_explanation": "1.61 refractive index reduces edge thickness by 22% for the -2.25 D prescription.",
        "coating_suitability": "Blue-light filtration reduces digital eye strain from 10 hours daily monitor use.",
        "lifestyle_fit_reason": "Ideal balance for prolonged coding and low outdoor UV exposure.",
        "trade_offs": "Slightly higher cost than basic 1.50 index."
      }
    ],
    "disclaimer": "LensIQ decision support is advisory. Final clinical selection must be reviewed and approved by the optometrist."
  }
}
```

### 8.2 OptoForecast Demand & Inventory Intelligence
- **URL:** `GET /api/ai/opto-forecast`
- **Access:** Strictly Optometrist (`ADMIN`)
- **Description:** Aggregates rolling sales velocity and stock quantities across frames, lenses, and accessories. Uses Gemini to synthesize actionable restocking alerts and seasonal advice.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "categories": {
      "FAST_MOVING": [ ... ],
      "LOW_STOCK_CRITICAL": [ ... ],
      "SLOW_MOVING_EXCESS": [ ... ]
    },
    "ai_insights": {
      "executive_summary": "High demand observed for lightweight TR90 frames and 1.61 blue-cut lenses in Nintavur.",
      "reorder_recommendations": [ ... ],
      "seasonal_advice": "Prepare for increased school term eye tests in Q1."
    }
  }
}
```

### 8.3 OptoRecall Automated Retention Engine
- **URLs:**
  - `GET /api/ai/opto-recall/candidates` (Lists ready-for-pickup and annual checkup candidates)
  - `POST /api/ai/opto-recall/generate-draft` (Generates personalized notification draft with zero PII)
  - `POST /api/ai/opto-recall/approve` (Human-in-the-loop approval: saves communication log and dispatches SMS/Email)
- **Access:** Authenticated (`ADMIN`, `STAFF`)

---

## 9. User Administration (`/api/users`)

### 9.1 List Users
- **URL:** `GET /api/users`
- **Access:** Strictly Optometrist (`ADMIN`)

### 9.2 Create Staff Account
- **URL:** `POST /api/users`
- **Access:** Strictly Optometrist (`ADMIN`)
- **Request Body:**
```json
{
  "username": "dispenser_amal",
  "password": "StaffPassword@123",
  "full_name": "Amal Perera",
  "email": "amal@indianoptician.lk",
  "role": "STAFF"
}
```

### 9.3 Toggle User Status
- **URL:** `PATCH /api/users/:id/status`
- **Access:** Strictly Optometrist (`ADMIN`)

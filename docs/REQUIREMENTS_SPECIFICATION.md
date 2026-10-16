# OptoPick — Software Requirements Specification (SRS)
**Client:** Indian Optician, No 67/1, Main Street, Nintavur - 13, Sri Lanka

---

## 1. Introduction
This Software Requirements Specification covers the functional and non-functional requirements for **OptoPick**, an intelligent, web-based Optical Center Management System engineered for Indian Optician.

## 2. User Roles and Personas

### 2.1 Administrator / Optometrist (Mr. Musthaq - Practice Owner & Eye Consultant)
- Sole authorized professional who conducts comprehensive refraction examinations.
- Records and signs clinical prescriptions (Sphere, Cylinder, Axis, Addition, PD).
- Reviews patient chronological refraction history and vision changes.
- Accesses financial reports, sales analytics, and OptoForecast inventory intelligence.
- Manages user accounts, system configuration, and supplier partnerships.

### 2.2 Optical Staff (Dispensing & Front-of-Shop Staff)
- Welcomes and registers customers in Nintavur.
- Retrieves authorized prescriptions immediately from the shared digital system.
- Assists patients with frame selection and lens options.
- Runs LensIQ to explain lens materials, coatings, and refractive indices.
- Creates sales orders, records advances and balance payments in LKR.
- Manages inventory receipts, logs movements, and tracks workshop fulfillment status.
- Cannot create or modify clinical prescriptions; cannot view gross financial profit margins.

---

## 3. Functional Requirements (FR)

### FR-01: Authentication & User Management
- **FR-01.1:** Secure credential authentication using Argon2id password hashing.
- **FR-01.2:** Server-managed session tokens with HttpOnly, SameSite cookies.
- **FR-01.3:** Role-Based Access Control (RBAC) enforced on routes, controllers, and database access.
- **FR-01.4:** Administrator user management (create, list, activate, deactivate staff accounts).
- **FR-01.5:** Secure forgot password process with single-use, expiring SHA256 tokens and Nodemailer dispatch.

### FR-02: Customer Management
- **FR-02.1:** Register customers with contact details, address, age, gender, occupation, and lifestyle preferences.
- **FR-02.2:** Auto-generation of unique Customer Code (`CUST-YYYY-XXXX`).
- **FR-02.3:** Real-time multi-field search by customer code, name, or phone number.
- **FR-02.4:** Unified profile view aggregating contact info, chronological prescriptions, order history, and communications.

### FR-03: Eye Examination & Prescription Management
- **FR-03.1:** Dedicated refraction entry for Right Eye (OD) and Left Eye (OS):
  - Sphere (SPH): -20.00 to +20.00 D in 0.25 D steps.
  - Cylinder (CYL): -10.00 to +10.00 D in 0.25 D steps.
  - Axis: 0 to 180 degrees.
  - Addition (ADD): 0.00 to +4.00 D.
  - Pupillary Distance (PD): 40.0 to 80.0 mm.
- **FR-03.2:** Chronological preservation of all past refractions without overwriting.
- **FR-03.3:** Side-by-side comparative visualization of previous and current examinations.
- **FR-03.4:** Real-time digital hand-off: newly signed refractions are instantly available to dispensing staff.

### FR-04: Product Catalog & Real-Time Inventory
- **FR-04.1:** Catalog management for Frames, Lenses, and Optical Accessories.
- **FR-04.2:** Lens specifications record supported SPH/CYL/ADD ranges, refractive index, and coatings.
- **FR-04.3:** Real-time stock status categorized into `IN_STOCK`, `LOW_STOCK`, and `OUT_OF_STOCK`.
- **FR-04.4:** Atomic, sales-linked stock deduction using MySQL transactions.
- **FR-04.5:** Traceable `inventory_movements` ledger logging all stock modifications with reasons and responsible user.
- **FR-04.6:** Stock-In replenishment workflow.

### FR-05: Sales, Billing & Workshop Fulfillment
- **FR-05.1:** Dispensing wizard linking Customer, Prescription, Frame, Lens, and Accessories.
- **FR-05.2:** Precise decimal calculation of subtotal, discounts, net payable, and balances in LKR.
- **FR-05.3:** Multi-payment recording (advance deposit, balance collection, full settlement).
- **FR-05.4:** Workshop lifecycle tracking: `ORDER_PLACED` -> `DISPATCHED_TO_LAB` -> `RECEIVED_FROM_LAB` -> `READY_FOR_COLLECTION` -> `COLLECTED`.
- **FR-05.5:** Professional, printable optical receipt and tax invoice.

### FR-06: LensIQ (AI Lens Decision Support)
- **FR-06.1:** Stage 1 Deterministic Range Filter: Queries MySQL lenses to verify supported Rx power boundaries and in-stock availability.
- **FR-06.2:** Stage 2 Gemini Ranking: Reasons over valid candidate lenses using patient occupation, screen time, outdoors, driving, and budget.
- **FR-06.3:** Structured Zod response validation and verification that all recommended IDs exist in candidate shortlist.
- **FR-06.4:** Mandatory clinical disclaimer. Graceful fallback if Gemini is unreachable.

### FR-07: OptoForecast (AI Inventory Demand Insight)
- **FR-07.1:** Backend calculations of 30-day and 90-day sales velocity, current stock, and days since last sale.
- **FR-07.2:** Gemini categorizes products strictly into proposal-specified categories:
  - Demand Signal: `Low`, `Stable`, `Increasing`, `High`
  - Stock Risk: `None`, `Possible Shortage`, `Possible Overstock`
  - Recommended Action: `Monitor`, `Review Reorder`, `Review Stock Reduction`
- **FR-07.3:** Recharts visual presentation of stock vs sales velocity.

### FR-08: OptoRecall (AI Patient Retention)
- **FR-08.1:** Rule-based detection of ready orders, overdue 12-month annual reviews, and lapsed customers (>24 months).
- **FR-08.2:** Privacy-safe message drafting (no PII transmitted to Gemini).
- **FR-08.3:** Mandatory human review and approval gate before message dispatch.
- **FR-08.4:** Nodemailer SMTP email dispatch with audit logging.

---

## 4. Non-Functional Requirements (NFR)

- **NFR-01 (Security):** Argon2id password hashing, HttpOnly session cookies, parameterized queries (SQL injection prevention), rate limiting.
- **NFR-02 (Data Integrity):** ACID transactions for all inventory deductions and financial receipts.
- **NFR-03 (Performance):** Customer search response time < 150 ms; database connection pooling with up to 10 persistent connections.
- **NFR-04 (Usability & Accessibility):** WCAG 2.2 AA contrast compliance; tabular numerals for all refraction values and prices; clean Manrope and Inter typography.
- **NFR-05 (Availability & Resiliency):** 100% of core optical operations remain functional even during complete internet or Gemini API outages.

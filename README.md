# OptoPick — AI-Powered Intelligent Optical Center Management System

> **A Smarter Approach to Optimal Selection**  
> **Client:** Indian Optician, Main Street, Nintavur, Sri Lanka  
> **Academic Context:** Higher Diploma Final Project in Computing / Software Engineering  

[![Node.js LTS](https://img.shields.io/badge/Node.js-v22.x%20LTS-green.svg)](https://nodejs.org/)
[![React 18](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%20%7C%20MariaDB-orange.svg)](https://www.mysql.com/)
[![Tests](https://img.shields.io/badge/Tests-21%20Passed-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

---

## 1. Executive Summary & Problem Context

**Indian Optician** is an established optical retail and ophthalmic dispensing center located on Main Street in Nintavur, in Sri Lanka's Eastern Province. Managed by lead optometrist **Mr. M. S. Mohamed Musthaq**, the center faced severe operational bottlenecks caused by manual paper-based record-keeping:
- Clinical refraction records stored in physical paper books, leading to lost histories and inability to detect refractive shifts.
- Manual lens selection relying on memory, frequently defaulting to basic plastic lenses even for heavy computer users or high myopes.
- Unpredictable inventory stockouts of popular frames and high-index lenses, while capital was trapped in slow-moving stock.
- Lack of proactive patient recall for spectacle collections and 12-month follow-up eye examinations.

**OptoPick** replaces these manual workflows with a unified, production-ready optical center management system integrating deterministic clinical safety with Google Gemini decision support.

---

## 2. Core Subsystems

```
+---------------------------------------------------------------------------------------------------+
|                                        OPTOPICK ECOSYSTEM                                         |
+---------------------------------------------------------------------------------------------------+
|  1. CORE OPTICAL CENTER MANAGEMENT                                                                |
|     - Customer Profiles & Multi-Field Search (CUST-YYYY-XXXX)                                     |
|     - Clinical Refraction Examination Matrix (OD/OS SPH, CYL, AXIS, ADD, PD)                      |
|     - Inventory Movement Ledger (Real-time stock reservation & replenishment)                     |
|     - ACID Sales & Billing (Advance payments, balance tracking, LKR pricing, printable receipts)  |
|     - 5-Stage Workshop Lifecycle Tracking (Ordered -> Lab -> Received -> Ready -> Collected)      |
+---------------------------------------------------------------------------------------------------+
|  2. LENSIQ — 2-STAGE LENS RECOMMENDATION ENGINE                                                   |
|     - Stage 1: Deterministic MySQL optical power and design filtering                             |
|     - Stage 2: Gemini AI multi-factor lifestyle ranking (Screen hours, outdoors, driving, budget) |
|     - Anti-Hallucination Gate: Verifies AI lens IDs against physical inventory                    |
|     - Full fail-soft fallback if external AI is offline                                           |
+---------------------------------------------------------------------------------------------------+
|  3. OPTOFORECAST — PREDICTIVE DEMAND & STOCK INTELLIGENCE                                         |
|     - 30-Day and 90-Day sales velocity aggregation across SKUs                                    |
|     - Classification: Fast Moving, Low Stock Critical, Slow Moving Excess                         |
|     - Actionable restocking recommendations and seasonal optical advice                           |
+---------------------------------------------------------------------------------------------------+
|  4. OPTORECALL — AUTOMATED RETENTION & CUSTOMER LIFECYCLE                                         |
|     - Automated candidate identification (Ready for pickup > 3 days, Annual checkup due)          |
|     - Zero-PII AI courteous draft generation                                                      |
|     - Mandatory Human-in-the-Loop review and approval modal before dispatch                      |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Technology Stack

- **Frontend:**
  - React 18 with TypeScript and Vite
  - Bootstrap 5 responsive grid & layout utilities
  - Custom "Optical Precision" design system in Vanilla CSS (Deep Navy `#123B50`, Optical Teal `#167D8D`, Warm Gold `#D69A43`)
  - Tabular numerals (`font-variant-numeric: tabular-nums`) for clinical and financial alignment
  - Lucide Icons & Recharts for data visualization
- **Backend:**
  - Node.js LTS (v22) with Express and TypeScript
  - Zod runtime schema validation
  - Argon2id cryptographic password hashing
  - HMAC-SHA256 signed HTTP-only session cookies
  - `mysql2/promise` with connection pooling (10 connections)
  - Centralized security audit logging (`audit_logs`)
- **Database:**
  - MySQL 8.0+ / MariaDB (XAMPP / phpMyAdmin compatible)
  - 16 normalized relational tables with strict foreign key constraints and `DECIMAL(10,2)` monetary precision
- **AI Integration:**
  - Google Gemini API (`@google/generative-ai`)
  - Server-side only, isolated, zero-PII, deterministic safety boundaries
- **Testing:**
  - Node native test runner (`node:test`) with TypeScript execution via `tsx`
  - 21 automated unit, integration, and security tests

---

## 4. Quickstart Guide

### 4.1 Prerequisites
- Node.js v20.x or v22.x LTS
- MySQL 8.0+ or XAMPP (Apache + MariaDB) running on port `3306`

### 4.2 Database Initialization & Seeding
1. Create database and import schema:
   ```bash
   mysql -u root -p -e "CREATE DATABASE optopick_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u root -p optopick_db < database/schema.sql
   mysql -u root -p optopick_db < database/seeds/dev_seed.sql
   ```

### 4.3 Backend Setup & Launch
```bash
cd backend
npm install
npm run dev
```
*Backend starts on `http://localhost:5000`*. Verify health at `http://localhost:5000/api/health`.

### 4.4 Frontend Setup & Launch
```bash
cd frontend
npm install
npm run dev
```
*Frontend dev server starts on `http://localhost:3000`*.

---

## 5. Seed Credentials & User Roles

| Role | Username | Password | Full Name & Title | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `optometrist` | `Admin@12345` | M. S. Mohamed Musthaq (Optometrist) | Full access: Clinical exams, Rx signing, LensIQ, OptoForecast, Billing, User management |
| **STAFF** | `staff` | `Staff@12345` | Fathima Shifa (Dispensing Staff) | Operational access: Customers, Sales, Workshop progression, OptoRecall, Stock-in |

---

## 6. Automated Test Suite

To run all automated unit, clinical validation, financial precision, and RBAC tests:
```bash
cd backend
npm test
```

### Test Coverage Highlights:
- **Financial Precision (5 tests):** Exact LKR calculations, discount bounds, advance payments, balance remaining, and floating-point rounding safety.
- **LensIQ Decision Engine (5 tests):** Stage 1 deterministic range filtering, presbyopia gating, out-of-stock exclusion, Stage 2 Gemini schema validation, and hallucinated lens ID rejection.
- **Clinical Refraction (6 tests):** Physiological boundaries for SPH, CYL, AXIS (0-180°), ADD, and Pupillary Distance (40-80mm), plus customer validation.
- **RBAC Barriers (5 tests):** Optometrist vs Staff role restrictions, 403 Forbidden enforcement on examinations and forecasting, and 401 unauthenticated protection.

---

## 7. Project Documentation Index

Detailed architectural and operational documentation is located in the [`docs/`](file:///e:/Assignment/Sem-4/Final_Project/docs) directory:

1. [System Architecture & Engineering Specification](file:///e:/Assignment/Sem-4/Final_Project/docs/ARCHITECTURE.md)
2. [Software Requirements Specification (SRS)](file:///e:/Assignment/Sem-4/Final_Project/docs/REQUIREMENTS_SPECIFICATION.md)
3. [Requirements Traceability Matrix (RTM)](file:///e:/Assignment/Sem-4/Final_Project/docs/REQUIREMENTS_TRACEABILITY_MATRIX.md)
4. [Database Design & Data Dictionary](file:///e:/Assignment/Sem-4/Final_Project/docs/DATABASE_DESIGN.md)
5. [REST API Documentation & Schemas](file:///e:/Assignment/Sem-4/Final_Project/docs/API_DOCUMENTATION.md)
6. [UI/UX Specification & "Optical Precision" Design System](file:///e:/Assignment/Sem-4/Final_Project/docs/UI_UX_SPECIFICATION.md)
7. [AI Subsystems Engineering Specification (LensIQ, OptoForecast, OptoRecall)](file:///e:/Assignment/Sem-4/Final_Project/docs/AI_MODULES.md)
8. [Quality Assurance & Testing Strategy](file:///e:/Assignment/Sem-4/Final_Project/docs/TESTING_STRATEGY.md)
9. [Production Deployment & Operations Guide](file:///e:/Assignment/Sem-4/Final_Project/docs/DEPLOYMENT_GUIDE.md)
10. [User Manual & Operational Guide](file:///e:/Assignment/Sem-4/Final_Project/docs/USER_GUIDE.md)

---

## 8. Repository Structure

```
Final_Project/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection pool (mysql2)
│   │   ├── controllers/     # Auth, Exams, Sales, Products, Inventory, AI, Dashboard
│   │   ├── integrations/    # Google Gemini and Nodemailer SMTP adapters
│   │   ├── middleware/      # Auth, RBAC roleGuard, Rate limiting, Error handler
│   │   ├── routes/          # Express route definitions
│   │   ├── utils/           # HMAC session tokens, Audit logger
│   │   ├── validation/      # Zod validation schemas
│   │   ├── app.ts           # Express application configuration
│   │   └── server.ts        # Server entry point
│   ├── tests/               # Automated test suites (21 unit & integration tests)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout, Sidebar, Header, InvoiceModal, RecallModal
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # Dashboard, Customers, Exams, Products, Sales, LensIQ, etc.
│   │   ├── services/        # Centralized typed API service layer
│   │   ├── styles/          # "Optical Precision" custom design system tokens
│   │   ├── App.tsx          # Client-side router and role-guarded routes
│   │   └── main.tsx         # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── database/
│   ├── schema.sql           # 16 Relational tables, indexes, and foreign keys
│   └── seeds/
│       └── dev_seed.sql     # Seed data for Indian Optician, Nintavur
├── docs/                    # 10 Complete technical and operational specifications
├── OptoPick_Proposal.pdf    # Academic project proposal & source of truth
└── README.md                # Master project overview
```

---

## 9. Academic & Professional Certification
Developed for **Indian Optician, Nintavur, Sri Lanka** as a production-grade Higher Diploma in Computing final project adhering to enterprise software engineering standards.

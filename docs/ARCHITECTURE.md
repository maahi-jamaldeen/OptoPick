# OptoPick — System Architecture & Engineering Specification

## 1. Executive System Overview
**OptoPick** is an AI-Powered Intelligent Optical Center Management System engineered for **Indian Optician, Nintavur, Sri Lanka**. The application replaces fragmented manual marking books, paper hand-offs, and monthly spreadsheets with an integrated, three-tier architecture adhering to healthcare data integrity and retail precision.

## 2. Three-Tier Architectural Topology

```
+-------------------------------------------------------------+
|                     PRESENTATION TIER                       |
|  React 18 + TypeScript + Vite + Bootstrap 5 + Lucide Icons  |
|         "Optical Precision" Professional Design System      |
+-------------------------------------------------------------+
                              |
                     HTTPS / REST API (JSON)
                              |
+-------------------------------------------------------------+
|                     APPLICATION TIER                        |
|  Node.js + Express + TypeScript + Zod + Argon2id Security   |
|                                                             |
|  [Auth Middleware & RBAC]     [Centralized Error Handling]  |
|  [Customer & Rx Services]     [Inventory & Movement Ledger] |
|  [Sales & ACID Billing]       [Nodemailer SMTP Client]      |
|  [LensIQ 2-Stage Engine]      [OptoForecast & OptoRecall]   |
+-------------------------------------------------------------+
            |                                     |
   SQL Queries (mysql2)                  JSON Prompts (HTTPS)
   Connection Pool (10)                           |
            |                                     v
+-------------------------+            +----------------------+
|        DATA TIER        |            |   EXTERNAL AI TIER   |
|   MySQL 8.0 / MariaDB   |            |  Google Gemini API   |
|    16 Relational Tables |            |  (Server-Side Only)  |
+-------------------------+            +----------------------+
```

### 2.1 Presentation Tier (Frontend)
- **Framework:** React 18 with TypeScript and Vite.
- **Styling Architecture:** Custom "Optical Precision" design tokens built with Vanilla CSS and Bootstrap 5 responsive grid utilities.
- **Icons & Data Visualization:** Lucide Icons and Recharts.
- **State & Communication:** Native React Context (`AuthContext`), React Hooks, and native Fetch API. Zero unnecessary state management libraries or third-party ORMs.

### 2.2 Application Tier (Backend)
- **Framework:** Express.js with TypeScript running on Node.js LTS (v22).
- **Layered Structure:**
  - `routes/`: HTTP routing and endpoint registration.
  - `controllers/`: HTTP request/response orchestration.
  - `middleware/`: Authentication (`authMiddleware`), Role Guard (`roleGuard`), Rate Limiting, Centralized Error Handling.
  - `validation/`: Runtime validation schemas using Zod.
  - `integrations/`: Isolated adapters for Google Gemini (`geminiClient.ts`) and SMTP (`mailerClient.ts`).
  - `utils/`: HMAC session tokens and centralized audit logging (`logAuditEvent`).

### 2.3 Data Tier (MySQL Database)
- **Engine:** MySQL 8.0+ / MariaDB (XAMPP compatible).
- **Driver:** `mysql2/promise` with connection pooling, parameterized queries, and ACID transactions.
- **Entities:** 16 relational tables with strict foreign keys, cascade rules, and decimal precision (`DECIMAL(10,2)` in LKR).

### 2.4 External AI Tier (Google Gemini)
- Strictly isolated on the server. No client-side exposure of API keys.
- **Deterministic First, AI Second:** Every AI recommendation is constrained by backend database rules. If the AI service is unreachable, core optical center operations remain 100% functional.

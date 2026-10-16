# OptoPick — Requirements Traceability Matrix (RTM)

| Problem ID | Business Problem Description | Project Objective | Functional Requirement | System Module | Database Entities | Test Verification |
|---|---|---|---|---|---|---|
| **P-01** | Fragmented Customer & Rx Paper Records | Objective 1: Centralized digital database | **FR-01, FR-02** | Customer Management | `customers`, `prescriptions` | Unit tests on code generation; latency tests on search |
| **P-02** | Difficult to Find Historical Exam Records | Objective 2: Chronological Rx history | **FR-03** | Eye Examinations | `examinations`, `prescriptions` | Historical queries; side-by-side comparison screen test |
| **P-03** | Time-Consuming Order & Billing Errors | Objective 3: Automated billing & invoicing | **FR-05** | Sales & Billing | `sales`, `sale_items`, `payments` | Monetary decimal arithmetic tests; invoice print test |
| **P-04** | Departmental Hand-off Miscommunication | Objective 4: Connected operational workflow | **FR-02, FR-03, FR-05** | Dispensing Counter | `examinations`, `sales` | Realtime prescription retrieval during sales checkout |
| **P-05** | Inaccurate Stock Levels & Stockouts | Objective 5: Real-time sales-linked inventory | **FR-04** | Inventory Management | `frames`, `lenses`, `inventory_movements` | ACID rollback test; concurrent purchase stock test |
| **P-06** | Guesswork Inventory Purchasing | Objective 6: Predictive demand insight | **FR-07** | OptoForecast | `sales`, `inventory_movements`, `ai_logs` | Sales velocity calculations; Gemini output schema checks |
| **P-07** | Uncollected Orders & Missed Reviews | Objective 7: Lifecycle trigger tools | **FR-08** | OptoRecall | `sales`, `communications` | Status trigger test; email draft preview test |
| **P-08** | Inconsistent Lens Selection Quality | Objective 8: Standardized lens recommendation | **FR-06** | LensIQ | `lenses`, `prescriptions`, `ai_logs` | 2-stage filter boundary tests; Gemini ranking verification |
| **P-09** | Patient Attrition & Follow-up Deficit | Objective 9: Re-engagement & retention | **FR-08** | OptoRecall | `customers`, `communications` | Privacy scrubbing test; approval gate verification |

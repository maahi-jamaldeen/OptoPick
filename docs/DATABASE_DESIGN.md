# OptoPick — Database Design & Schema Guide
**Engine:** MySQL 8.0+ / MariaDB (XAMPP Compatible)
**Database:** `optopick_db`
**Character Set:** `utf8mb4` | **Collation:** `utf8mb4_unicode_ci`

---

## 1. Relational Entities Summary

| # | Table Name | Purpose | Primary Key | Critical Foreign Keys |
|---|---|---|---|---|
| 1 | `users` | Practice credentials, roles, active status | `id` | None |
| 2 | `customers` | Patient profiles, contact, age, lifestyle | `id` | None |
| 3 | `examinations` | Eye examination clinical encounter | `id` | `customer_id` -> `customers(id)`, `examiner_id` -> `users(id)` |
| 4 | `prescriptions` | Refractive values (OD/OS SPH, CYL, AXIS, ADD, PD) | `id` | `examination_id` -> `examinations(id)`, `customer_id` -> `customers(id)` |
| 5 | `suppliers` | Optical lens labs and frame suppliers | `id` | None |
| 6 | `frames` | Spectacle frame catalog with dimensions & stock | `id` | `supplier_id` -> `suppliers(id)` |
| 7 | `lenses` | Ophthalmic lenses with supported Rx power ranges | `id` | `supplier_id` -> `suppliers(id)` |
| 8 | `accessories` | Optical cleaning solutions, microfiber cloths, cases | `id` | `supplier_id` -> `suppliers(id)` |
| 9 | `sales` | Sales transactions, advance/balance split, workshop status | `id` | `customer_id` -> `customers(id)`, `prescription_id` -> `prescriptions(id)` |
| 10 | `sale_items` | Itemized line items preserving historical sale price | `id` | `sale_id` -> `sales(id)` ON DELETE CASCADE |
| 11 | `payments` | Audit records of advances and balance payments in LKR | `id` | `sale_id` -> `sales(id)`, `user_id` -> `users(id)` |
| 12 | `inventory_movements`| Traceable stock ledger for all quantity modifications | `id` | `reference_sale_id` -> `sales(id)`, `user_id` -> `users(id)` |
| 13 | `communications` | OptoRecall drafts, review notices, email statuses | `id` | `customer_id` -> `customers(id)`, `approved_by_user_id` -> `users(id)` |
| 14 | `ai_logs` | Audit trail of prompts, responses, response times | `id` | `user_id` -> `users(id)` |
| 15 | `audit_logs` | System activity ledger (logins, updates, deletions) | `id` | `user_id` -> `users(id)` |
| 16 | `system_settings` | Practice configuration (clinic details, recall periods) | `id` | None |

---

## 2. Relational Integrity & Data Preservation Rules

1. **Historical Sale Prices:** When a sale is completed, line items are stored in `sale_items` with `unit_price = current selling_price`. Any future updates to the product's catalog price do not alter historical invoices.
2. **Chronological Prescriptions:** Prescriptions are strictly appended. An update to a patient's refraction creates a new examination encounter; prior prescriptions retain their historical values with `is_latest = 0`.
3. **Traceable Inventory:** Stock quantities cannot change without an accompanying entry in `inventory_movements`. The movement record captures `previous_quantity`, `new_quantity`, `quantity_change`, the acting user ID, and the reference transaction.
4. **Monetary Precision:** All currency fields are stored as `DECIMAL(10,2)` in Sri Lankan Rupees (**LKR**) to eliminate floating-point calculation errors.

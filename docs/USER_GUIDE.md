# OptoPick — User Manual & Optical Center Operational Guide

**Client:** Indian Optician, Main Street, Nintavur, Sri Lanka  
**System:** OptoPick — AI-Powered Intelligent Optical Center Management System  
**Tagline:** A Smarter Approach to Optimal Selection  

---

## 1. Introduction & Access Roles

OptoPick is tailored specifically for the clinical and retail operations of **Indian Optician, Nintavur**. The system supports two distinct operational roles:

1. **Administrator / Optometrist (`ADMIN`):**
   - Held by **Mr. M. S. Mohamed Musthaq** (Lead Optometrist & Business Owner).
   - Full access to all clinical examination modules, electronic prescription signing, executive financial dashboards, OptoForecast inventory intelligence, and staff account administration.
2. **Optical Staff / Dispenser (`STAFF`):**
   - Held by counter staff and dispensing assistants.
   - Access to customer registration, product catalog searches, stock replenishment, sales order processing, workshop status progression, collection settlements, and OptoRecall message dispatch.

---

## 2. Authentication & Navigation

### 2.1 Logging In
1. Open your web browser and navigate to `http://localhost:3000` (or your local optical center server IP).
2. Enter your username and password:
   - **Optometrist:** `optometrist` / `Admin@12345`
   - **Optical Staff:** `staff` / `Staff@12345`
3. Click **Sign In**. Once authenticated, you will be directed to your role-specific dashboard.

---

## 3. Optometrist Clinical Workflows (`ADMIN`)

### 3.1 Conducting a Clinical Eye Examination & Issuing a Prescription
1. Navigate to **Prescriptions & Exams** from the sidebar and click **+ New Examination**.
2. Select or search for the patient (e.g. `A. R. Mohamed Fazil`).
3. Enter the clinical findings:
   - **Right Eye (OD):** Sphere (SPH), Cylinder (CYL), Axis (0–180°), and Near Addition (ADD).
   - **Left Eye (OS):** Sphere (SPH), Cylinder (CYL), Axis (0–180°), and Near Addition (ADD).
   - **Pupillary Distance (PD):** Combined or monocular PD in millimeters (e.g., `63.0 mm`).
   - **Clinical Notes:** Record anterior segment findings, fundus observation, or intraocular pressure.
4. Click **Sign & Save Examination**.
   - *The system automatically archives previous prescriptions for this patient and marks the new record as authoritative (`is_latest = 1`).*

### 3.2 Utilizing LensIQ for Tailored Dispensing Decision Support
1. Navigate to **LensIQ** in the sidebar.
2. Select the customer and their active prescription.
3. Fill out the lifestyle questionnaire:
   - **Daily Screen Hours:** Enter typical monitor/mobile exposure (e.g., `8 hours`).
   - **Outdoor Activity:** Enter average sunlight hours.
   - **Driving Frequency:** Choose Low, Moderate, or High (for night glare considerations).
   - **Budget & Thickness Preference:** Select customer's aesthetic and cost constraints.
4. Click **Analyze & Generate Recommendations**.
5. Review the top ranked candidate lenses:
   - Observe why high-index materials (1.61 or 1.67) and anti-reflective blue-defense coatings are selected.
   - Use the clinical talking points to explain the benefits to the patient before proceeding to sales.

### 3.3 Strategic Demand Planning with OptoForecast
1. Navigate to **OptoForecast** (exclusive to Optometrist).
2. Review the three inventory health categories:
   - **Fast Moving:** Items with high turnover requiring urgent replenishment.
   - **Low Stock Critical:** Items at or below minimum threshold.
   - **Slow Moving Excess:** Capital tied up in stagnant stock.
3. Inspect the **AI Inventory Intelligence** card for supplier reorder advice and seasonal optical trends.

---

## 4. Optical Staff Operational Workflows (`STAFF`)

### 4.1 Registering a New Customer
1. Navigate to **Customers** and click **+ Add Customer**.
2. Complete the patient details: Full Name, Phone Number, Age, Gender, and Occupation.
3. Add any frame or lens material allergies in the **Preferences / Notes** box.
4. Click **Save Customer**. A unique identifier (e.g. `CUST-2026-0005`) is automatically assigned.

### 4.2 Creating a Custom Fitting Sales Order & Taking Advance
1. Navigate to **Sales & Orders** and click **+ New Sale**.
2. **Step 1:** Select the customer and attach their active clinical prescription.
3. **Step 2:** Select the chosen **Frame** and **Lenses**. The system automatically verifies real-time stock.
4. **Step 3 (Financials):**
   - Subtotal is computed automatically in Sri Lankan Rupees (**LKR**).
   - Enter any approved promotional discount.
   - Enter the **Advance Payment** collected from the customer (e.g., `LKR 5,000.00`).
   - Select the payment method (**Cash**, **Card**, or **Bank Transfer**).
   - Set Order Type to **Custom Fitting Order** (spectacles requiring glazing lab assembly).
5. Click **Create Sale Order**.
   - The system executes an ACID transaction, reserves the frame and lenses from inventory, logs the advance payment receipt, and sets the workshop status to `DISPATCHED_TO_LAB`.
6. Click **Print Invoice** to provide the customer with their official receipt showing the advance paid and remaining balance.

### 4.3 Updating Workshop Lifecycle
When custom eyewear progresses through assembly:
1. In the **Sales & Orders** table, find the order.
2. Use the status dropdown to progress the job:
   - `DISPATCHED_TO_LAB`: Spectacles sent to Colombo / local glazing workshop.
   - `RECEIVED_FROM_LAB`: Finished spectacles received back at Indian Optician.
   - `READY_FOR_COLLECTION`: Spectacles inspected, cleaned, verified against prescription, and ready for patient pickup.

### 4.4 Final Collection & Settlement
1. When the patient arrives to collect their spectacles, open their order in **Sales & Orders**.
2. Click **Add Payment / Collect**.
3. Verify the remaining balance (e.g. `LKR 6,500.00`).
4. Enter the settlement payment and select the payment method.
5. Click **Record Payment**.
   - *Payment status automatically transitions to `PAID`, order status updates to `COLLECTED`, and the final receipt is generated.*

### 4.5 OptoRecall Patient Communication Approval Gate
1. Navigate to **OptoRecall**.
2. The queue displays patients whose orders have been ready for collection > 3 days or whose annual eye checkup is due.
3. Click **Draft Message** next to a patient.
4. The **Human-in-the-Loop Review Modal** appears with an AI-crafted courteous message.
5. Review the message text and edit if necessary to personalize greetings in Tamil or English.
6. Click **Approve & Dispatch**.
   - The system logs the communication in the database and dispatches the notification via SMS or Email.

### 4.6 Stock Replenishment (Stock-In)
1. Navigate to **Inventory** and click **+ Stock-In**.
2. Select the product category (**Frame**, **Lens**, or **Accessory**) and specific SKU.
3. Enter the quantity received and supplier invoice number in the notes.
4. Click **Record Stock-In**. The live stock count updates immediately and an immutable movement ledger entry is written.

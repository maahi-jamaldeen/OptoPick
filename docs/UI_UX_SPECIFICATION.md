
# OptoPick — UI/UX Specification & "Optical Precision" Design System

## 1. Design Philosophy: "Optical Precision"

Optical center management software operates at the intersection of **clinical healthcare accuracy** and **premium optical retail**. The interface must evoke:
1. **Clinical Trust & Authority:** Reassuring the optometrist and patient of scientific exactness.
2. **Operational Ergonomics:** High legibility, zero clutter, and rapid keyboard/mouse navigation during busy dispensing hours.
3. **Visual Excellence:** Replacing dated desktop win32/spreadsheet paradigms with a state-of-the-art web application.

---

## 2. Design Tokens & Color Palette

The color system is inspired by optical lenses, ophthalmic instruments, and anti-reflective lens coatings:

| Token Name | Hex Code | HSL Equivalent | Clinical & Semantic Role |
| :--- | :--- | :--- | :--- |
| `--color-deep-navy` | `#123B50` | `hsl(201, 63%, 19%)` | Primary brand color, sidebar background, primary headers, clinical authority |
| `--color-optical-teal`| `#167D8D` | `hsl(188, 73%, 32%)` | Primary action buttons, interactive toggles, active indicators, brand accent |
| `--color-teal-tint` | `#E8F4F6` | `hsl(189, 44%, 94%)` | Subtle card highlights, hover states, active navigation backgrounds |
| `--color-warm-gold` | `#D69A43` | `hsl(36, 64%, 55%)` | Premium tier lenses, LensIQ highlights, warning states, gold accents |
| `--color-clinical-slate`| `#64748B` | `hsl(215, 16%, 47%)` | Subtitles, secondary text, metadata labels, table header styling |
| `--color-alert-red` | `#EF4444` | `hsl(0, 84%, 60%)` | Critical low-stock warnings, balance overdue badges, error validation |
| `--color-success-green`| `#10B981` | `hsl(160, 84%, 39%)` | Paid balances, successful laboratory arrivals, clinical approval gates |
| `--color-bg-pearl` | `#F8FAFC` | `hsl(210, 40%, 98%)` | Eye-strain reducing soft workspace background (prevents optical fatigue) |
| `--color-surface-white`| `#FFFFFF` | `hsl(0, 0%, 100%)` | Card surfaces, modal dialogs, data tables, printable invoice views |

---

## 3. Typography & Numerical Precision

### 3.1 Font Families
- **Primary Body & Display Stack:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Monospace & Code Stack:** `'JetBrains Mono', 'Fira Code', 'Courier New', monospace`

### 3.2 Tabular Numerals for Optical & Financial Alignment
During refraction testing and financial tallying, numerical digits must never shift horizontally.
All clinical diopter fields (`SPH`, `CYL`, `AXIS`, `ADD`, `PD`) and financial amounts (`LKR`) strictly enforce:
```css
font-variant-numeric: tabular-nums;
font-feature-settings: "tnum" 1;
```

### 3.3 Type Scale Hierarchy
- **`h1` Page Title:** 24px / 1.3 line-height / Semi-Bold (600) / Deep Navy
- **`h2` Section Header:** 18px / 1.35 line-height / Medium (500) / Deep Navy
- **`h3` Card Header:** 15px / 1.4 line-height / Semi-Bold (600) / Deep Navy
- **Body Text:** 14px / 1.5 line-height / Regular (400) / Slate 800
- **Secondary Caption / Timestamp:** 12px / 1.4 line-height / Regular (400) / Clinical Slate
- **Badge / Pill Label:** 11px / 1.2 line-height / Bold (700) / Uppercase with letter-spacing `0.05em`

---

## 4. Layout Architecture & Workspace Ergonomics

### 4.1 Frame Structure
```
+-----------------------------------------------------------------------------------+
|  [OptoPick Brand & Logo]   | Header Bar: Active User, Role Pill, Quick Actions   |
+----------------------------+------------------------------------------------------+
|  SIDEBAR NAVIGATION (240px)| MAIN CONTENT WORKSPACE                               |
|  - Dashboard               | Breadcrumbs & Page Action Bar                        |
|  - Customers               | ---------------------------------------------------  |
|  - Prescriptions & Exams   | [ Metric KPI Cards Grid: 4 columns ]                 |
|  - Product Catalog         | ---------------------------------------------------  |
|  - Inventory Management    | [ Primary Data Table / Interactive Form Wizard ]    |
|  - Sales & Orders          |                                                      |
|  - LensIQ Decision Support |                                                      |
|  - OptoForecast            |                                                      |
|  - OptoRecall Retention    |                                                      |
|  - User Management (Admin) |                                                      |
|  ------------------------  |                                                      |
|  [ Indian Optician, Nintavur ]                                                    |
+-----------------------------------------------------------------------------------+
```

### 4.2 Responsive Breakpoints
- **Desktop (>= 1200px):** Full two-column layout with 240px static navigation sidebar.
- **Laptop / Tablet (768px - 1199px):** Collapsible sidebar toggle, multi-column cards adapt to 2 columns.
- **Mobile (< 768px):** Off-canvas slide-out navigation drawer, stacked single-column cards with responsive horizontal table scroll.

---

## 5. Specialized Component Specifications

### 5.1 Clinical Refraction Matrix (OD / OS Side-by-Side)
- **Visual Design:** Distinct side-by-side card container dividing Right Eye (**Oculus Dexter - OD**) and Left Eye (**Oculus Sinister - OS**).
- **Stepping Ergonomics:**
  - `SPH` and `CYL` increment/decrement in standard optical steps of `0.25 D`.
  - `AXIS` inputs bounded between `0°` and `180°`.
  - `ADD` inputs formatted as positive additions (`+0.75` to `+4.00 D`).
  - Pupillary Distance (`PD`) centered between both eyes in millimeters (`mm`).

### 5.2 Status Badge Taxonomy
All status badges feature soft background tints and high-contrast text:
- **Order Status:**
  - `ORDER_PLACED`: Soft Slate `#F1F5F9` text `#475569`
  - `DISPATCHED_TO_LAB`: Soft Amber `#FEF3C7` text `#92400E`
  - `RECEIVED_FROM_LAB`: Soft Sky `#E0F2FE` text `#0369A1`
  - `READY_FOR_COLLECTION`: Soft Teal `#CCFBF1` text `#0F766E`
  - `COLLECTED`: Soft Emerald `#D1FAE5` text `#065F46`
- **Payment Status:**
  - `PENDING`: Light Rose `#FFE4E6` text `#BE123C`
  - `PARTIALLY_PAID`: Light Amber `#FEF3C7` text `#B45309`
  - `PAID`: Light Emerald `#D1FAE5` text `#047857`

### 5.3 LensIQ Recommendation Card
- **Rank Badge:** Gold pill for Rank #1, Teal for Rank #2, Slate for Rank #3.
- **Technical Metrics Strip:** Refractive Index (`1.61 High Index`), Material (`MR-8 Impact Resistant`), Design (`Single Vision Aspheric`).
- **Clinical Reasoning Section:** Clear paragraphs explaining lifestyle suitability, blue-light filtration, and thickness trade-offs.
- **Prominent Disclaimer:** Rendered in an amber callout with an alert icon: *"Advisory Decision Support Only. Clinical verification required by optometrist."*

### 5.4 Printable Invoice & Optical Prescription Document
- Standard A4 / 80mm thermal receipt dual layout.
- Clear Indian Optician masthead:
  - *Indian Optician — Optometric Center & Eyewear Specialist*
  - *Main Street, Nintavur, Sri Lanka | Tel: 067-2250123*
- Detailed itemization of Frame code, Lens parameters, subtotal, discount, advance payment, and remaining balance.
- Optometrist signature line and collection instructions.

---

## 6. Accessibility & WCAG 2.1 AA Compliance

1. **Color Contrast:** All body text meets or exceeds the `4.5:1` contrast ratio against backgrounds. Deep Navy on White achieves `11.8:1`.
2. **Keyboard Focus:** High-visibility outline focus ring (`2px solid var(--color-optical-teal)` with `2px` offset) on all interactive inputs, buttons, and tab controls.
3. **Screen Readers:** ARIA labels on all icon-only buttons (e.g., `aria-label="Edit customer"`, `aria-label="View optical prescription"`).

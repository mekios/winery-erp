# 🍇 Winery ERP — Project Specification (RFP Document)

## 1. Overview

**Winery ERP** is a cloud platform for **wine production management**, inspired by vintrace & vinsight, but designed with a unique purpose:

> A **consultant-first**, **multi-winery**, **event-driven** system that tracks winemaking operations, composition, instructions, analyses, and inventory in real time.

The system replaces spreadsheets, WhatsApp messages, and scattered workflows with a **centralized, auditable, data-driven application**.

It must support:

- Multiple wineries  
- Consultant oversight  
- Full production lifecycle  
- Real-time tank composition  
- Work orders  
- Lab results  
- Additions & inventory  
- Traceability  
- Compliance  
- Scalability  

---

## 2. Primary User Roles

### 2.1 Consultant (Super Admin)
- Oversees all wineries  
- Creates instructions & protocols  
- Reviews operations  
- Ensures quality & compliance  
- Manages cross-winery dashboards

### 2.2 Winery Owner / Manager
- Has full access to their winery’s data  
- Oversees local staff  
- Views production & inventory dashboards  
- Approves or reviews work orders

### 2.3 Winemaker / Cellar Staff
- Receives tasks / work orders  
- Executes and records operations  
- Logs analyses, additions, and transfers  
- Updates tank/barrel information

### 2.4 Lab Personnel
- Enters analytical data  
- Views historical results per tank/lot  
- Flags abnormal results (e.g. high VA, low SO₂)

---

## 3. Project Goals

### 3.1 Operational Goals
- Centralize winemaking operations across multiple wineries  
- Provide reliable, auditable history for every tank, barrel, and wine lot  
- Ensure consistent application of protocols and consultant instructions  
- Streamline collaboration between consultant and wineries  
- Reduce errors in blends, additions, and transfers  

### 3.2 Technical Goals
- Event-sourced core data model (Transfers, Additions, Analyses as events)  
- Real-time composition engine (Tank Composition V2 / ledger-based)  
- Cloud-based, multi-tenant SaaS architecture  
- API-first design for future integrations & mobile apps  
- Mobile-friendly user interface suitable for cellar work  

---

## 4. The Problem Being Solved

Currently, wineries rely heavily on:

- Google Sheets  
- Phone calls & WhatsApp messages  
- Static PDFs / paper notes  
- Manual lab logs  
- Untracked or partially tracked tank operations  

This leads to:

- Missing or inconsistent data across systems  
- No reliable batch/variety/vineyard tracking from grape to bottle  
- Lost or misunderstood instructions  
- Unverified execution of tasks  
- Poor traceability for blends and complex movements  
- Inventory inaccuracies (additives, packaging)  

**The new system aims to eliminate these issues** by providing **a single source of truth** with a clear, auditable history.

---

# 5. Core Features (High Level)

## 5.1 Multi-Winery Management

- One consultant account can access **multiple wineries**.  
- Each winery has **isolated data** (tanks, batches, inventory, users).  
- Consultant has a cross-winery dashboard with:
  - open tasks,
  - critical alerts,
  - fermentation status,
  - integrity issues (Unknown volume, etc.).

## 5.2 Batches & Harvest Intake

- Fruit/must intake recording:
  - date, grower, vineyard block, variety, weight, must volume.  
- Batch creation with auto-generated codes (equivalent to current `Batch_ID` logic in Google Sheets).  
- Vineyard & variety breakdown per batch (`Grape_Sources` model):
  - % by variety  
  - % by vineyard / grower  
- Support for:
  - free-run + pressings  
  - multiple tanks per batch at intake (mapped later via Transfers).

## 5.3 Tanks, Barrels & Equipment Registry

- Tank registry:
  - ID, type (settling/fermentation/storage), capacity, material, location, notes.  
- Barrel registry:
  - ID, volume, wood type, year, status (active / retired).  
- Equipment registry:
  - presses, pumps, filters, bottling lines, etc.  
- Future support for equipment-based workflow diagrams and SOPs.

## 5.4 Transfers (Event Log)

The **Transfers** module is the core production event log.  
Every liquid movement is represented as an event, such as:

- Fill  
- Rack  
- Blend  
- Move  
- Top-up  
- Bottle  
- Dispose  

Each transfer event includes:

- From/To tank or barrel (either or both can be null depending on action)  
- Date/time  
- Volume  
- Batch ID and/or wine lot ID (if known)  
- Notes  
- User who recorded it  
- Links to related work orders (if the transfer is execution of an instruction)  

These events are **immutable**. Corrections are done via new events (adjustments), not by overwriting history.

## 5.5 Additions (Materials Consumption)

- Record additions of:
  - SO₂ products  
  - Nutrients  
  - Enzymes  
  - Finings / clarification agents  
  - Gums, proteins, etc.  
- Each addition is:
  - linked to a tank/barrel,  
  - linked to a material from inventory,  
  - specified with dosage (g/hL, mL/hL) and total quantity used,  
  - recorded with date/time and user.  
- Additions reduce stock **automatically** in inventory.

## 5.6 Lab Analyses

- Centralized module to record lab results per:
  - tank,
  - barrel,
  - wine lot.  

Typical parameters:

- Baume / Brix / density  
- pH  
- TA (titratable acidity)  
- VA (volatile acidity)  
- Free SO₂  
- Total SO₂  
- Temperature  
- Optional: malic acid, turbidity (NTU), color, etc.  

Features:

- History of analyses for each container/lot  
- Graphs over time (e.g. fermentation curve, SO₂ tracking)  
- Links to alerts (e.g. high VA warning, low free SO₂ warning)  

## 5.7 Work Orders (Instructions)

Consultant or winery manager defines **work orders**:

- Transfers to perform (e.g. rack tank A → tank B)  
- Additions to add (e.g. add X g/hL potassium metabisulfite)  
- Lab analyses to run (e.g. check VA, Free/Total SO₂)  
- Checks/inspections (e.g. taste evaluation, fermentation observation)  

Each work order:

- Has status: `PLANNED`, `IN_PROGRESS`, `DONE`, `VERIFIED`, `CANCELLED`  
- Can contain multiple lines (work order lines) for specific actions.  
- Is assigned to specific users or generic roles.  

When cellar staff marks a line as **Done**:

- The system **automatically generates the corresponding event**:
  - transfer → `transfers` record  
  - addition → `additions` + `material_movements`  
  - analysis → `analyses` record  
- Links the created event back to the work order line for audit and reporting.

## 5.8 Tank Composition Engine (V2)

This is a **key differentiator** and must be implemented carefully.

### Concept

- `transfers` is the **raw event log** (movements in/out of tanks).  
- `tank_ledger` is a **derived ledger** that decomposes each event by composition keys (batches, lots, or “Unknown”).

### Behavior

- When a transfer has an explicit `batch_id` or `wine_lot_id`, the attribution is **explicit**.  
- When a transfer is **batch-less** (no batch/lot specified), the volume inherits the **current composition of the source tank** proportionally.  
- If the source tank has no known composition (e.g. missing history), the moved volume is attributed to an `Unknown` composition key.

### Output

For any tank at any time, the system can compute:

- current volume  
- breakdown by:
  - batch,
  - variety,
  - vineyard / grower,  
- Unknown volume (integrity flag).

The engine also supports:

- detection of negative composition volumes (overdraw errors)  
- detection of date/order inconsistencies  
- integrity views and alerts.

## 5.9 Inventory Management

- Material master data:
  - additives (SO₂, nutrients, etc.)  
  - packaging (bottles, corks, labels, cartons)  
- Stock levels per location (cellar, warehouse, etc.).  
- Material movements:
  - purchases  
  - transfers between locations  
  - additions (automatic consumption)  
  - adjustments  

Target:

- Reliable inventory for winemaking materials & packaging  
- Basic low-stock alerts  

## 5.10 Reporting & Dashboards

Sample dashboards:

- Harvest overview:
  - by grower, by variety, by vineyard  
- Tank overview:
  - current volume, stage, composition, last analysis, open tasks  
- Fermentation monitoring:
  - density/Brix over time, temperature, progression  
- Work orders:
  - open tasks by winery / user / due date  
- Inventory:
  - current stock vs reorder levels  

---

# 6. System Architecture Requirements

## 6.1 Multi-Tenant SaaS

- One deployment serves multiple wineries.  
- Data is partitioned by `winery_id` in all relevant tables.  
- Consultant user can see multiple wineries based on membership; winery users can only see their own winery.

Possible approaches:

- Single database with winery_id in all tenant-scoped tables, or  
- Schema-per-tenant (optional, to be decided with the agency).

## 6.2 Event-Sourcing Principles

- **Events are append-only** (Transfers, Additions, Analyses, Material Movements).  
- Current state (e.g. tank volume, composition, inventory levels) is computed or cached as **materialized views**.  
- Corrections happen via additional events, not by editing past events.

## 6.3 API-First Backend

- Backend exposes a clean REST or GraphQL API.  
- All frontend clients use the API (no server-side rendering logic only).  
- Ready for:
  - future dedicated mobile app,  
  - integrations (e.g. external LIMS, accounting).

## 6.4 Web Application (Frontend)

- Modern SPA framework (React, Vue, or Angular).  
- Responsive design for tablet/phone use in the cellar.  
- Intuitive UX:
  - minimal data entry friction,  
  - clear navigation by winery → tanks → tasks → history.  

## 6.5 Authentication & Authorization

- Login system with email/password (and potentially SSO later).  
- Role-based access control based on `winery_memberships`.  
- Different visibility and permissions per role/type.

---

# 7. Database Model Summary

A full schema is maintained separately (Markdown + Mermaid ERD).  
Main entities:

```text
Users, Wineries, Winery Memberships
Grape Varieties, Growers, Vineyard Blocks
Tanks, Barrels, Equipment
Harvest Seasons, Batches, Batch Sources
Wine Lots, Lot-Batch Links
Transfers
Materials, Material Stocks, Material Movements, Additions
Analyses
Tank Ledger (composition)
Work Orders, Work Order Lines
Packaging SKUs, Bottling Runs
```

The DB is designed to support:

- multi-tenancy via `winery_id`,  
- event-sourcing,  
- advanced composition logic,  
- reporting and dashboards.

---

# 8. Development Roadmap (Recommended)

## 8.1 Phase 1 — Foundation (MVP)

Focus: production core + minimal UX.

- Multi-winery setup, authentication, memberships.  
- Tanks, Batches, Grape Sources (basic intake logic).  
- Transfers (manual entry, full history).  
- Analyses (manual entry, basic charts).  
- Tank Composition V1:
  - by batch,  
  - by variety & vineyard based on explicit batch usage.  
- Simple Work Orders:
  - create instructions, mark as done, manual link to events.  
- Simple dashboards:
  - current tank volumes,  
  - recent transfers,  
  - recent analyses.

## 8.2 Phase 2 — Intelligence & Automation

- Tank Composition V2 (ledger engine with inheritance).  
- Full Work Order integration:
  - executing a work order auto-creates events.  
- Additions + Inventory:
  - integrate materials, stock, and additions.  
- Integrity checks & alerts:
  - Unknown volume, negative ledger keys, out-of-range lab values.  
- Consultant multi-winery dashboard.

## 8.3 Phase 3 — Commercial Layer

- Bottling runs:
  - source tank/lot → packaging SKUs, bottles produced, scrap.  
- Packaging SKUs:
  - mapping to finished goods.  
- Basic costing:
  - track cost at batch / lot / SKU level.  

## 8.4 Phase 4 — Advanced Features

- Equipment workflows and diagrams.  
- Workflow templates / SOPs per winery.  
- Advanced automation / rule-based alerts.  
- Offline-friendly mobile client for cellar use.  

---

# 9. Deliverables Required From the Agency

## 9.1 Backend Deliverables

- Full implementation of core entities and relations.  
- Secure, well-documented API (OpenAPI / Swagger or GraphQL schema).  
- Tank Ledger (Composition V2) engine implementation.  
- Work Orders execution logic.  
- Tests:
  - unit tests for logic,  
  - integration tests around events and ledger reconstruction.  

## 9.2 Frontend Deliverables

- Multi-winery navigation and login.  
- Tanks, batches, and transfers management UI.  
- Work orders creation & execution workflows.  
- Lab analyses entry + visualization.  
- Inventory & additions management (Phase 2).  
- Tank composition views with breakdowns (batch/variety/vineyard).  
- Responsive design for tablets used in winery environments.

## 9.3 DevOps Deliverables

- CI/CD pipeline.  
- Dev, staging, and production environments.  
- Database backup strategy.  
- Basic observability (logs, error reporting, metrics).  

---

# 10. Expected Skills From the Agency

- Experience building **ERP-like or manufacturing systems**.  
- Familiarity with **event-sourced architectures** or similar patterns.  
- Strong data modeling skills for traceability use cases.  
- A track record of **UI/UX** work in professional applications.  
- Ability to provide technical guidance on:
  - multi-tenancy model,  
  - performance for large event logs,  
  - security and compliance.

---

# 11. Provided Assets (From Client)

The client (consultant) already has:

- Google Sheets prototype with:
  - Batches  
  - Grape_Sources  
  - Transfers  
  - Tanks  
  - Analyses  
  - Tank Composition V1 & V2 logic  
- Batch ID formula and structure.  
- Detailed description of Tank Composition V2 (ledger engine).  
- Markdown files:
  - Database schema  
  - Project specification (this document)  
- Mermaid ERD diagram.

These should be treated as the **functional blueprint** for the system.

---

# 12. Success Criteria

The system will be considered successful if:

- The consultant can log in and see **all wineries** with a clear overview of:
  - tasks,
  - alerts,
  - key production status.  
- Each winery can run its day-to-day operations (harvest, transfers, additions, analyses) **entirely inside the system**.  
- Tank composition is reliable enough to support:
  - variety/vineyard labeling claims,  
  - internal quality tracking.  
- Inventory discrepancies are reduced thanks to addition tracking.  
- Work orders reduce miscommunication between consultant and winery staff.  
- The system is robust, performant, and comfortable to use daily in actual cellar conditions.

---

# 13. License & IP

All business logic, algorithms, specifications, and documentation in this project (including this document, the ledger design, formulas, and the Sheets prototype) are **intellectual property of the client** and must be treated as confidential.

---

# End of Document

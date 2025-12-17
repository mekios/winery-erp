# 📋 Winery ERP — Development Plan

> Step-by-step roadmap from project initialization to deployment.  
> Reference: `Winery_ERP_Technical_Decisions.md`, `Winery_ERP_Project_Description.md`

---

## Current Status

| Phase | Status | Completed |
|-------|--------|-----------|
| **Phase 0** | ✅ COMPLETE | Dec 11, 2024 |
| **Phase 1** | 🔄 IN PROGRESS | Sprint 1.1-1.5 ✅, Starting 1.6 |
| **Phase 2** | ⏳ Pending | - |
| **Phase 3** | ⏳ Pending | - |
| **Phase 4** | ⏳ Pending | - |

### Recent Completed Work (Dec 17, 2024)
- ✅ Sprint 1.5: Lab Analyses (backend + frontend)
  - Analysis model with all wine parameters (pH, TA, VA, Brix, SO₂, etc.)
  - Computed fields (molecular SO₂, potential alcohol, MLF progress)
  - Analysis history endpoints for tanks and wine lots
  - Full-page analysis form with parameter groups
  - Analyses list with filtering by sample type
- ✅ Sprint 1.4: Transfers & Wine Lots (backend + frontend)
  - Transfer model with action types (FILL, RACK, BLEND, etc.)
  - WineLot model with batch linking (LotBatchLink)
  - Transfer validation (volume checks, capacity limits)
  - Transfers list with filter by action type
  - Wine lots list with filters (status, vintage)
  - Full-page forms for both entities
- ✅ Sprint 1.3: Harvest & Batches (backend + frontend)
- ✅ Winery Management UI (admin can create/manage wineries and members)
- ✅ UI/UX Improvements:
  - Design system with Purple Admin theme
  - Full-width data grids with inline filter chips
  - Lucide icons for sidebar and listings
  - Collapsible sidebar with icon-only mode
  - Custom scrollbar styling
  - Full-page form routes (replacing dialogs)
  - Sectioned form layouts with design system buttons

### Development Environment (Current Ports)

| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 5432 | - |
| Redis | 6380 | - |
| Backend API | 8001 | http://localhost:8001/api/v1/ |
| API Docs | 8001 | http://localhost:8001/api/docs/ |
| Frontend | 4201 | http://localhost:4201 |
| Admin Panel | 8001 | http://localhost:8001/admin/ |

---

## Overview

| Phase | Focus | Duration (Est.) |
|-------|-------|-----------------|
| **Phase 0** | Project Setup & Scaffolding | ~~1-2 days~~ ✅ DONE |
| **Phase 1** | MVP Core (Backend + Frontend) | 4-6 weeks |
| **Phase 2** | Intelligence & Automation | 3-4 weeks |
| **Phase 3** | Commercial Features | 2-3 weeks |
| **Phase 4** | Polish & Deployment | 1-2 weeks |

**Total Estimated Time:** 10-15 weeks (depending on team size)

---

## Phase 0: Project Setup & Scaffolding ✅ COMPLETE

### 0.1 Repository & Environment Setup
- [x] Initialize Git repository
- [x] Create `.gitignore` (Python, Node, Docker, IDE files)
- [x] Create `README.md` with project overview
- [x] Set up branch strategy (main, develop, feature/*)
- [x] Move existing docs to `docs/` folder

### 0.2 Docker Infrastructure
- [x] Create `docker-compose.yml` for development
- [x] Create `docker-compose.prod.yml` for production
- [x] Create `.env.example` template
- [x] Test PostgreSQL + Redis containers

### 0.3 Backend Scaffolding (Django)
- [x] Create Django project structure (`backend/`)
- [x] Configure settings (base, development, production)
- [x] Set up Django REST Framework
- [x] Configure JWT authentication (SimpleJWT)
- [x] Set up CORS headers
- [x] Configure drf-spectacular for OpenAPI
- [x] Create `Dockerfile` and `Dockerfile.prod`
- [x] Create requirements files (base, dev, prod)

### 0.4 Frontend Scaffolding (Angular)
- [x] Create Angular 17+ project (`frontend/`)
- [x] Install Angular Material (in package.json)
- [x] Set up environment files
- [x] Configure proxy for API calls (dev)
- [x] Create `Dockerfile` and `Dockerfile.prod`
- [x] Set up nginx.conf for production

### 0.5 Development Workflow
- [x] Test full stack with `docker compose up`
- [x] Document local development commands in README
- [x] Create `Makefile` for common operations

**Deliverable:** ✅ Running infrastructure with backend API operational

---

## Phase 1: MVP Core

### Sprint 1.1: Authentication & Multi-Tenancy (Week 1) — ✅ COMPLETE

#### Backend ✅ COMPLETE
- [x] Create `users` app
  - [x] Custom User model (email as username)
  - [x] User serializers
  - [x] Registration endpoint
  - [x] JWT token endpoints (login, refresh)
  - [x] Current user endpoint (`/api/v1/users/me/`)
- [x] Create `wineries` app
  - [x] Winery model
  - [x] WineryMembership model (with roles enum)
  - [x] Winery serializers
  - [x] WineryTenantMiddleware
  - [x] Winery selection/switching endpoint
- [x] Create base permissions
  - [x] IsWineryMember
  - [x] IsWineryOwnerOrReadOnly
  - [x] IsLabStaffOrHigher
  - [x] CanExecuteWorkOrders
- [ ] Write unit tests for auth & middleware (deferred to Phase 4)

#### Frontend ✅ COMPLETE
- [x] Create `core` module
  - [x] AuthService (login, logout, token refresh, session persistence)
  - [x] AuthInterceptor (JWT injection, no circular dependency)
  - [x] AuthGuard (waits for auth initialization)
  - [x] WineryService
- [x] Create `auth` feature module
  - [x] Login page (Purple Admin theme)
  - [x] Registration page
- [x] Create app shell
  - [x] Main layout with sidebar navigation (Purple Admin theme)
  - [x] Top bar with winery selector
  - [x] User menu (profile, logout)
- [x] Create Dashboard component (with mock data)
- [x] Test login/registration flow end-to-end ✅
- [x] Test session persistence on refresh ✅
- [x] Test winery selection flow ✅

**Deliverable:** ✅ Users can register, login, select winery, see dashboard (Dec 11, 2024)

---

### Sprint 1.2: Master Data & Equipment (Week 2) — ✅ COMPLETE

#### Backend ✅ COMPLETE
- [x] Create `master_data` app
  - [x] GrapeVariety model + API
  - [x] Grower model + API
  - [x] VineyardBlock model + API
- [x] Create `equipment` app
  - [x] Tank model + API (with summary endpoint)
  - [x] Barrel model + API
  - [x] Equipment model + API
- [x] Add filtering with django-filter
- [x] Create WineryRequiredMixin for DRF views
- [ ] Write model tests (deferred to Phase 4)

#### Frontend ✅ COMPLETE
- [x] Create `shared` components
  - [x] DataTableComponent (reusable with sorting, pagination, search)
  - [x] ConfirmDialogComponent
  - [x] ApiService
- [x] Create `master-data` feature module
  - [x] Grape varieties list/create/edit (with dialog)
  - [x] Growers list/create/edit (with dialog)
  - [x] Vineyard blocks list/create/edit (with dialog, linked growers/varieties)
- [x] Create `equipment` feature module
  - [x] Tanks list with filtering & summary cards
  - [x] Tank create/edit dialog
  - [x] Barrels list with filtering
  - [x] Barrel create/edit dialog
- [x] Update sidebar navigation with new routes
- [x] Add disabled state for future routes

**Deliverable:** ✅ Full CRUD for master data and equipment (Dec 11, 2024)

---

### Sprint 1.3: Harvest & Batches (Week 3) ✅ COMPLETE

#### Backend ✅ COMPLETE
- [x] Create `harvest` app
  - [x] HarvestSeason model + API
  - [x] Batch model + API (with auto-generated batch codes)
  - [x] BatchSource model + API
- [x] Implement batch code generation logic (YYYY-NNN format)
- [x] Add computed fields (total weight, variety breakdown)
- [ ] Write tests for batch creation flow (deferred to Phase 4)

#### Frontend ✅ COMPLETE
- [x] Create `harvest` feature module
  - [x] Harvest seasons list with CRUD (full-page form)
  - [x] Batch list with filters (season, stage)
  - [x] Batch create/edit (full-page form with grape sources)
- [x] Full-page forms replacing dialog modals
- [x] Sectioned form layouts with design system buttons
- [ ] Batch detail view (sources breakdown) - deferred to 1.4
- [ ] Add batch sources inline editing - deferred to 1.4

**Deliverable:** ✅ Users can record harvest intake with full source tracking (Dec 17, 2024)

---

### Sprint 1.4: Transfers & Wine Lots (Week 4) ✅ COMPLETE

#### Backend
- [x] Create `production` app
  - [x] Transfer model + API
  - [x] WineLot model + API
  - [x] LotBatchLink model + API
- [x] Implement transfer validation rules
  - [x] Volume cannot exceed source tank current volume
  - [x] Validate tank/barrel references
  - [x] Validate destination capacity
- [x] Create transfer action types (FILL, RACK, BLEND, TOP_UP, DRAIN, BARREL_FILL, BARREL_EMPTY, BARREL_RACK, FILTER, BOTTLE)
- [ ] Write transfer tests (deferred)

#### Frontend
- [x] Create `transfers` feature module
  - [x] Transfer log list (filterable by action type)
  - [x] Create/Edit transfer form (full-page, sectioned layout)
    - Action type selection
    - Source/destination tank/barrel dropdowns
    - Volume, temperature
    - Optional batch/lot linking
- [x] Create `wine-lots` feature module
  - [x] Wine lots list (with status and vintage filters)
  - [x] Wine lot create/edit (full-page form)
  - [x] Batch linking support (LotBatchLink model)

**Deliverable:** ✅ Full transfer logging, wine lot management (Dec 17, 2024)

---

### Sprint 1.5: Lab Analyses (Week 5) ✅ COMPLETE

#### Backend ✅ COMPLETE
- [x] Create `lab` app
  - [x] Analysis model + API (all parameters)
  - [x] Analysis validation (range checks)
- [x] Add computed fields (e.g., potential alcohol from Brix, molecular SO₂)
- [x] Create analysis history endpoint per tank/lot

#### Frontend ✅ COMPLETE
- [x] Create `analyses` feature module
  - [x] Analysis list (by tank, barrel, or lot)
  - [x] Analysis entry form (with parameter groups)
  - [ ] Analysis history charts (deferred to Phase 2)
    - Fermentation curve (density/Brix over time)
    - SO₂ tracking chart
    - pH/TA chart
- [x] Add quick-entry mode for common parameters

**Deliverable:** ✅ Full lab analysis entry with computed fields (Dec 17, 2024)

---

### Sprint 1.6: Dashboard & Polish (Week 6)

#### Backend
- [ ] Create dashboard aggregation endpoints
  - [ ] Tank summary (count by status, total volume)
  - [ ] Recent transfers
  - [ ] Recent analyses
  - [ ] Batches by stage
- [ ] Performance optimization (select_related, prefetch_related)
- [ ] API documentation review

#### Frontend
- [ ] Create `dashboard` feature module
  - [ ] Winery overview cards (tanks, batches, active lots)
  - [ ] Recent activity feed
  - [ ] Quick actions (new transfer, new analysis)
  - [ ] Tank status overview (visual grid or list)
- [ ] Responsive design testing
- [ ] Error handling improvements
- [ ] Loading states and skeletons

**Deliverable:** Working MVP with dashboard, all core CRUD operations

---

## Phase 2: Intelligence & Automation

### Sprint 2.1: Tank Composition Engine V1 (Week 7)

#### Backend
- [ ] Create `ledger` app
  - [ ] TankLedger model
  - [ ] Ledger entry creation on transfer save (Django signals)
- [ ] Implement explicit attribution (batch_id present)
- [ ] Create tank composition endpoint
  - [ ] Current volume by batch
  - [ ] Current volume by variety
  - [ ] Current volume by vineyard/grower
- [ ] Write comprehensive ledger tests

#### Frontend
- [ ] Update tank detail view
  - [ ] Composition breakdown panel
  - [ ] Pie chart by batch/variety
  - [ ] Composition history over time
- [ ] Add composition info to transfer form preview

**Deliverable:** Basic tank composition tracking with explicit batch attribution

---

### Sprint 2.2: Tank Composition Engine V2 (Week 8)

#### Backend
- [ ] Implement proportional inheritance
  - [ ] When no batch_id: inherit source tank composition
  - [ ] Split volume proportionally across source components
- [ ] Implement "Unknown" attribution
  - [ ] Flag transfers with unknown source
  - [ ] Track Unknown volume separately
- [ ] Add integrity checks
  - [ ] Detect negative composition (overdraw)
  - [ ] Detect date inconsistencies
- [ ] Create ledger rebuild management command
- [ ] Write edge case tests

#### Frontend
- [ ] Add integrity alerts to dashboard
- [ ] Show Unknown volume warnings on tanks
- [ ] Create integrity report view

**Deliverable:** Full composition engine with inheritance and integrity tracking

---

### Sprint 2.3: Work Orders Basic (Week 9)

#### Backend
- [ ] Create `work_orders` app
  - [ ] WorkOrder model + API
  - [ ] WorkOrderLine model + API
- [ ] Implement work order status flow (PLANNED → IN_PROGRESS → DONE → VERIFIED)
- [ ] Add assignment logic (user or role)
- [ ] Write tests

#### Frontend
- [ ] Create `work-orders` feature module
  - [ ] Work order list (by status, assignee)
  - [ ] Work order detail view
  - [ ] Create work order form
    - Title, description, priority, due date
    - Add lines (transfer, addition, analysis, check)
  - [ ] Work order execution view
    - Mark lines as complete
    - Add notes/comments

**Deliverable:** Basic work order creation and manual completion

---

### Sprint 2.4: Work Orders → Events Integration (Week 10)

#### Backend
- [ ] Implement auto-event creation on line completion
  - [ ] Transfer line → creates Transfer record
  - [ ] Addition line → creates Addition + MaterialMovement
  - [ ] Analysis line → creates Analysis record
- [ ] Link created events back to work order line
- [ ] Add verification workflow (optional supervisor sign-off)

#### Frontend
- [ ] Update work order execution UI
  - [ ] Pre-filled forms from line data
  - [ ] Confirmation before event creation
  - [ ] Show linked events after completion
- [ ] Add "Execute from Work Order" flow

**Deliverable:** Work orders that automatically create production events

---

### Sprint 2.5: Inventory & Additions (Week 11)

#### Backend
- [ ] Create `inventory` app
  - [ ] Material model + API
  - [ ] MaterialStock model + API
  - [ ] MaterialMovement model + API
  - [ ] Addition model + API
- [ ] Implement stock adjustment on movement
- [ ] Link additions to material stock (auto-decrement)
- [ ] Add low-stock detection

#### Frontend
- [ ] Create `inventory` feature module
  - [ ] Materials list (with categories)
  - [ ] Material detail (current stock by location)
  - [ ] Stock movement history
  - [ ] Addition log per tank
  - [ ] Create addition form (with dosage calculator)
- [ ] Add low-stock alerts to dashboard

**Deliverable:** Full inventory tracking with automatic stock updates

---

## Phase 3: Commercial Features

### Sprint 3.1: Packaging & Bottling (Week 12)

#### Backend
- [ ] Create `packaging` app
  - [ ] PackagingSKU model + API
  - [ ] BottlingRun model + API
- [ ] Link bottling to source tank/lot
- [ ] Calculate volume reduction on bottling

#### Frontend
- [ ] Create `packaging` feature module
  - [ ] SKU management
  - [ ] Bottling run list
  - [ ] Create bottling run form
  - [ ] Bottling summary reports

**Deliverable:** Bottling run recording with SKU tracking

---

### Sprint 3.2: Consultant Dashboard (Week 13)

#### Backend
- [ ] Create cross-winery aggregation endpoints
- [ ] Implement consultant-specific permissions
- [ ] Add alert aggregation (across wineries)

#### Frontend
- [ ] Create consultant dashboard
  - [ ] Multi-winery overview
  - [ ] Open tasks across all wineries
  - [ ] Critical alerts (high VA, low SO₂, Unknown volume)
  - [ ] Quick winery switching
- [ ] Add winery comparison views

**Deliverable:** Consultant can monitor all wineries from single dashboard

---

### Sprint 3.3: Reports & Export (Week 14)

#### Backend
- [ ] Create reporting endpoints
  - [ ] Harvest summary by grower/variety/vineyard
  - [ ] Production report by wine lot
  - [ ] Inventory report
- [ ] Add CSV/Excel export capability
- [ ] Add PDF generation (optional)

#### Frontend
- [ ] Create `reports` feature module
  - [ ] Report selection
  - [ ] Date range filters
  - [ ] Export buttons (CSV, PDF)
  - [ ] Print-friendly views

**Deliverable:** Standard reports with export functionality

---

## Phase 4: Polish & Deployment

### Sprint 4.1: Testing & Bug Fixes (Week 15)

#### Backend
- [ ] Increase test coverage to 80%+
- [ ] Load testing with realistic data
- [ ] Security audit (permissions, SQL injection, XSS)
- [ ] Fix identified bugs

#### Frontend
- [ ] Component testing (key components)
- [ ] E2E tests for critical flows (Cypress/Playwright)
  - [ ] Login → Create batch → Transfer → Analyze
  - [ ] Work order creation and execution
- [ ] Cross-browser testing
- [ ] Mobile/tablet responsive testing
- [ ] Fix UI/UX issues

**Deliverable:** Stable, tested application

---

### Sprint 4.2: Deployment Setup (Week 16)

#### Infrastructure
- [ ] Provision Vultr VPS (High Frequency 2 vCPU, 4GB RAM)
- [ ] Install Docker & Docker Compose
- [ ] Configure firewall (UFW)
- [ ] Set up domain DNS
- [ ] Configure SSL with Let's Encrypt

#### Application
- [ ] Create production environment file
- [ ] Build production Docker images
- [ ] Deploy with docker compose
- [ ] Run migrations
- [ ] Create initial superuser
- [ ] Load seed data (if applicable)

#### Monitoring
- [ ] Set up basic logging
- [ ] Configure error reporting (Sentry optional)
- [ ] Set up database backups (daily)
- [ ] Create deployment documentation

**Deliverable:** Application deployed and accessible at production URL

---

### Sprint 4.3: Go-Live & Handover (Week 16+)

- [ ] Final QA on production
- [ ] User acceptance testing (UAT)
- [ ] Create user documentation / help guides
- [ ] Train initial users
- [ ] Monitor for issues (first week)
- [ ] Establish support process

**Deliverable:** Production system live with trained users

---

## Post-Launch Roadmap (Future)

### Phase 5: Advanced Features (Future)
- [ ] PWA / Offline support
- [ ] Native mobile app (optional)
- [ ] Equipment workflow diagrams
- [ ] SOP templates per winery
- [ ] Advanced rule-based alerts
- [ ] External integrations (LIMS, accounting)
- [ ] Multi-language support
- [ ] Cost tracking at batch/lot level

---

## Development Checklist Summary

### Before Each Sprint
- [ ] Review sprint goals
- [ ] Set up feature branches
- [ ] Update documentation if needed

### During Development
- [ ] Write tests alongside code
- [ ] Update API documentation (drf-spectacular)
- [ ] Keep frontend types in sync with API

### Sprint Completion
- [ ] Code review
- [ ] Merge to develop branch
- [ ] Deploy to staging (if available)
- [ ] Demo to stakeholders

### Before Deployment
- [ ] All tests passing
- [ ] No critical linting errors
- [ ] Environment variables documented
- [ ] Backup strategy confirmed
- [ ] Rollback plan ready

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Composition engine complexity** | Start with V1 (explicit only), add V2 incrementally |
| **Scope creep** | Stick to MVP features, defer nice-to-haves |
| **Performance issues** | Early load testing, optimize queries, add indexes |
| **Multi-tenant data leaks** | Comprehensive permission tests, middleware coverage |
| **Deployment issues** | Test full stack locally with production config |

---

## Quick Start Commands

```bash
# Clone and setup
git clone <repo-url>
cd winery_erp
cp .env.example .env
# Edit .env with your values

# Build and start all services
docker compose build
docker compose up -d

# Generate and run migrations (first time only)
docker compose run --rm backend python manage.py makemigrations
docker compose run --rm backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Access Points (note: ports adjusted to avoid conflicts)
# Frontend:    http://localhost:4201
# Backend API: http://localhost:8001/api/v1/
# API Docs:    http://localhost:8001/api/docs/
# Admin:       http://localhost:8001/admin/

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Run tests
docker compose exec backend pytest
docker compose exec frontend ng test

# Useful make commands
make up          # Start all services
make down        # Stop all services
make logs        # View all logs
make migrate     # Run migrations
make superuser   # Create superuser
make shell       # Django shell

# Production deployment
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Files Created in Phase 0

```
winery_erp/
├── backend/
│   ├── apps/
│   │   ├── users/           # Custom User model, auth endpoints
│   │   └── wineries/        # Multi-tenancy, memberships, permissions
│   ├── config/
│   │   └── settings/        # base.py, development.py, production.py
│   ├── Dockerfile
│   └── requirements/
├── frontend/
│   ├── src/app/
│   │   ├── core/            # AuthService, WineryService, guards, interceptors
│   │   └── features/        # auth (login, register), dashboard
│   ├── Dockerfile
│   └── package.json
├── docs/                    # All documentation
├── nginx/                   # Production nginx config
├── scripts/                 # deploy.sh, backup-db.sh
├── docker-compose.yml       # Development stack
├── docker-compose.prod.yml  # Production stack
├── Makefile                 # Helper commands
└── README.md
```

---

*Last updated: December 17, 2024*


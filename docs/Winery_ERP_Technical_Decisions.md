# 🛠️ Winery ERP — Technical Decisions & Architecture

> This document captures all technical decisions for the Winery ERP project.  
> Reference documents: `Winery_ERP_Project_Description.md`, `Winery_ERP_Database_Model.md`, `Winery_ERP_ERD.mmd`

---

## 1. Technology Stack

### 1.1 Core Technologies

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Frontend** | Angular | 17+ | Enterprise-grade, TypeScript-first, excellent for complex forms & data grids, strong typing |
| **Backend** | Django | 5.x | Mature ORM, built-in admin panel, excellent for data-heavy applications, Python ecosystem |
| **API Framework** | Django REST Framework | 3.15+ | Powerful serialization, viewsets, permissions, OpenAPI schema generation |
| **Database** | PostgreSQL | 16 | UUIDs, JSONB support, excellent for event-sourcing patterns, specified in DB model |
| **Containerization** | Docker + Docker Compose | Latest | Consistent dev/prod environments, easy deployment |
| **Deployment** | Vultr VPS | - | Cost-effective, good global coverage, simple for MVP/testing |

### 1.2 Backend Dependencies

```text
# Core
Django>=5.0
djangorestframework>=3.15
psycopg[binary]>=3.1          # PostgreSQL adapter (async-ready)

# Authentication & Security
djangorestframework-simplejwt  # JWT authentication
django-cors-headers            # CORS for Angular SPA

# API Documentation
drf-spectacular               # OpenAPI 3.0 schema generation

# Configuration & Environment
django-environ                # 12-factor app configuration
python-decouple               # Environment variables

# Filtering & Search
django-filter                 # Querystring filtering for API

# Production Server
gunicorn                      # Production WSGI server
whitenoise                    # Static file serving

# Background Tasks (Phase 2)
celery                        # Async task queue
redis                         # Celery broker + caching

# Development
pytest-django                 # Testing framework
factory-boy                   # Test fixtures
black                         # Code formatting
ruff                          # Linting
```

### 1.3 Frontend Dependencies

```text
# Core
@angular/core                 # Angular 17+
@angular/material             # UI component library
@angular/cdk                  # Component dev kit

# Styling
tailwindcss                   # Utility-first CSS (optional, can use Material only)

# State Management (Optional)
@ngrx/store                   # Redux-style state management
@ngrx/effects                 # Side effects handling

# Data Visualization
ngx-charts                    # Charts for dashboards
chart.js + ng2-charts         # Alternative charting

# Data Grids
ag-grid-angular               # Advanced data grid (for transfers, analyses tables)

# API Client
@openapitools/openapi-generator-cli  # Auto-generate typed API client

# PWA Support
@angular/pwa                  # Progressive Web App capabilities

# Development
prettier                      # Code formatting
eslint                        # Linting
```

---

## 2. Architecture Decisions

### 2.1 Multi-Tenancy Strategy

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Approach** | Row-level isolation via `winery_id` | Simpler than schema-per-tenant, sufficient for expected scale (dozens of wineries) |
| **Implementation** | Django middleware + model managers | Automatic filtering on all tenant-scoped queries |
| **Global Tables** | Users, lookup tables without `winery_id` | Shared authentication, reference data |

**Implementation Pattern:**
```python
# Middleware sets current winery on request
# Custom model manager filters by winery_id automatically
# Views/serializers enforce winery context
```

### 2.2 Authentication & Authorization

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Auth Method** | JWT (JSON Web Tokens) | Stateless, API-friendly, works well with SPA |
| **Library** | djangorestframework-simplejwt | Well-maintained, feature-complete |
| **Token Lifetime** | Access: 15 min, Refresh: 7 days | Balance security and UX |
| **RBAC** | Via `winery_memberships.role` | 5 roles: CONSULTANT, WINERY_OWNER, WINEMAKER, CELLAR_STAFF, LAB |

**Permission Hierarchy:**
```
CONSULTANT     → Full access to all wineries in membership
WINERY_OWNER   → Full access to own winery
WINEMAKER      → Full production access, limited admin
CELLAR_STAFF   → Execute work orders, record events
LAB            → Enter/view analyses only
```

### 2.3 API Design

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Style** | REST with ViewSets | Familiar, well-tooled, matches CRUD patterns |
| **Versioning** | URL-based (`/api/v1/`) | Clear, easy to manage |
| **Documentation** | OpenAPI 3.0 via drf-spectacular | Auto-generated, Swagger UI included |
| **Pagination** | Cursor-based for event logs, offset for master data | Performance for large event tables |
| **Filtering** | django-filter | Declarative, integrates with DRF |

**Alternative Considered:** GraphQL — offers flexible queries but adds complexity; REST is sufficient for this use case.

### 2.4 Event Sourcing & Tank Ledger

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Event Storage** | Append-only tables (transfers, additions, analyses) | Immutable audit trail, supports recomputation |
| **Corrections** | New adjustment events, not edits | Maintains history integrity |
| **Ledger Computation** | Materialized view + Django signals | Balance between real-time and performance |
| **Rebuild Strategy** | Management command to rebuild ledger from events | Recovery from corruption, schema changes |

**Tank Ledger Engine (V2) Implementation:**
```
1. Transfer event created → Django signal fires
2. Signal handler computes ledger entries:
   - If batch_id specified: explicit attribution
   - If no batch_id: inherit source tank composition proportionally
   - If source unknown: attribute to "Unknown" key
3. Insert ledger rows (append-only)
4. Materialized view aggregates current state per tank
```

### 2.5 File Storage

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Storage Backend** | Vultr Object Storage (S3-compatible) | Scalable, cheap, CDN-ready |
| **Django Integration** | django-storages + boto3 | Standard approach |
| **Use Cases** | Lab reports, photos, documents | Not heavy file usage expected |

---

## 3. Project Structure

### 3.1 Monorepo Layout

```
winery_erp/
├── docker-compose.yml           # Development stack
├── docker-compose.prod.yml      # Production overrides
├── .env.example                 # Environment template
├── README.md                    # Project overview
├── Makefile                     # Common commands
│
├── docs/                        # Documentation
│   ├── Winery_ERP_Project_Description.md
│   ├── Winery_ERP_Database_Model.md
│   ├── Winery_ERP_ERD.mmd
│   └── Winery_ERP_Technical_Decisions.md
│
├── backend/                     # Django application
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   ├── manage.py
│   ├── config/                  # Django settings
│   │   ├── __init__.py
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── apps/                    # Django apps
│   │   ├── users/
│   │   ├── wineries/
│   │   ├── master_data/
│   │   ├── equipment/
│   │   ├── harvest/
│   │   ├── production/
│   │   ├── inventory/
│   │   ├── lab/
│   │   ├── ledger/
│   │   ├── work_orders/
│   │   └── packaging/
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── development.txt
│   │   └── production.txt
│   └── tests/
│
├── frontend/                    # Angular application
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   ├── nginx.conf               # Production nginx config
│   ├── angular.json
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── core/            # Auth, guards, interceptors, services
│       │   ├── shared/          # Common components, pipes, directives
│       │   ├── features/        # Feature modules
│       │   │   ├── auth/
│       │   │   ├── dashboard/
│       │   │   ├── wineries/
│       │   │   ├── tanks/
│       │   │   ├── batches/
│       │   │   ├── transfers/
│       │   │   ├── analyses/
│       │   │   ├── work-orders/
│       │   │   ├── inventory/
│       │   │   └── reports/
│       │   ├── app.component.ts
│       │   ├── app.config.ts
│       │   └── app.routes.ts
│       ├── assets/
│       ├── environments/
│       └── styles/
│
├── nginx/                       # Production reverse proxy
│   ├── nginx.conf
│   └── ssl/
│
└── scripts/                     # Utility scripts
    ├── deploy.sh
    ├── backup-db.sh
    ├── generate-api-client.sh
    └── seed-data.sh
```

### 3.2 Django Apps Breakdown

| App | Responsibility | Key Models |
|-----|----------------|------------|
| `users` | Authentication, user management | User (custom) |
| `wineries` | Multi-tenant core, memberships | Winery, WineryMembership |
| `master_data` | Reference data | GrapeVariety, Grower, VineyardBlock |
| `equipment` | Cellar assets | Tank, Barrel, Equipment |
| `harvest` | Grape intake | HarvestSeason, Batch, BatchSource |
| `production` | Wine movements | Transfer, WineLot, LotBatchLink |
| `inventory` | Materials management | Material, MaterialStock, MaterialMovement, Addition |
| `lab` | Analytical data | Analysis |
| `ledger` | Composition engine | TankLedger (+ computation logic) |
| `work_orders` | Task management | WorkOrder, WorkOrderLine |
| `packaging` | Finished goods | PackagingSKU, BottlingRun |

### 3.3 Angular Features Breakdown

| Feature Module | Responsibility |
|----------------|----------------|
| `auth` | Login, logout, password reset |
| `dashboard` | Consultant & winery dashboards |
| `wineries` | Winery selection, settings |
| `tanks` | Tank registry, current status, composition view |
| `batches` | Harvest intake, batch creation, sources |
| `transfers` | Event log, movement recording |
| `analyses` | Lab data entry, charts, history |
| `work-orders` | Task creation, assignment, execution |
| `inventory` | Materials, stock levels, additions |
| `reports` | Harvest summary, production reports |

---

## 4. Docker Configuration

### 4.1 Current Development Ports

> **Note:** Ports adjusted to avoid conflicts with existing services on developer machine.

| Service | Internal Port | External Port | URL |
|---------|---------------|---------------|-----|
| PostgreSQL | 5432 | 5432 | - |
| Redis | 6379 | **6380** | - |
| Backend | 8000 | **8001** | http://localhost:8001 |
| Frontend | 4200 | **4201** | http://localhost:4201 |

### 4.2 Development Stack

```yaml
# docker-compose.yml (simplified)
services:
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U winery -d winery_erp"]

  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"  # External 6380 to avoid conflict

  backend:
    build: ./backend
    ports:
      - "8001:8000"  # External 8001 to avoid conflict
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_healthy }
    command: >
      sh -c "python manage.py migrate &&
             python manage.py runserver 0.0.0.0:8000"

  frontend:
    build: ./frontend
    ports:
      - "4201:4200"  # External 4201 to avoid conflict
    command: ng serve --host 0.0.0.0 --poll 2000

volumes:
  postgres_data:
  backend_static:
```

### 4.2 Production Stack

```yaml
# docker-compose.prod.yml
version: '3.9'

services:
  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - DEBUG=False
      - DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - ALLOWED_HOSTS=${ALLOWED_HOSTS}
    depends_on:
      - db
      - redis
    restart: unless-stopped

  celery:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    command: celery -A config worker -l info
    environment:
      - DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## 5. Deployment Strategy

### 5.1 Vultr Setup (Testing/MVP)

| Resource | Specification | Est. Cost |
|----------|---------------|-----------|
| **VPS** | High Frequency, 2 vCPU, 4GB RAM | ~$24/month |
| **OS** | Ubuntu 22.04 LTS | - |
| **Storage** | 80GB NVMe | Included |
| **Backup** | Vultr automatic backups | ~$4.80/month |
| **Domain** | Point DNS to VPS IP | External |
| **SSL** | Let's Encrypt via Certbot | Free |

### 5.2 Deployment Process

```bash
# 1. Initial server setup
ssh root@your-vultr-ip
apt update && apt upgrade -y
apt install docker.io docker-compose-plugin -y

# 2. Clone repository
git clone https://github.com/your-org/winery_erp.git
cd winery_erp

# 3. Configure environment
cp .env.example .env
nano .env  # Set production values

# 4. Build and deploy
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 5. Run migrations
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

# 6. Create superuser
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# 7. Setup SSL (first time)
certbot --nginx -d yourdomain.com
```

### 5.3 CI/CD Pipeline (Future)

```
GitHub Actions / GitLab CI:
  1. On push to main:
     - Run backend tests (pytest)
     - Run frontend tests (ng test)
     - Build Docker images
     - Push to container registry
  2. On tag/release:
     - Deploy to staging
     - Manual approval
     - Deploy to production
```

---

## 6. Development Workflow

### 6.1 Local Development

```bash
# Start all services
docker compose up -d

# Access points
# Frontend:  http://localhost:4200
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/api/docs/
# Admin:     http://localhost:8000/admin/

# Backend shell
docker compose exec backend python manage.py shell

# Run migrations
docker compose exec backend python manage.py migrate

# Create migrations
docker compose exec backend python manage.py makemigrations

# Run tests
docker compose exec backend pytest
docker compose exec frontend ng test

# Generate API client for Angular
./scripts/generate-api-client.sh
```

### 6.2 API Client Generation

```bash
# scripts/generate-api-client.sh
#!/bin/bash
# Generate TypeScript client from OpenAPI schema

curl http://localhost:8000/api/schema/ -o ./frontend/openapi.json

npx @openapitools/openapi-generator-cli generate \
  -i ./frontend/openapi.json \
  -g typescript-angular \
  -o ./frontend/src/app/core/api \
  --additional-properties=ngVersion=17
```

---

## 7. Security Considerations

| Concern | Mitigation |
|---------|------------|
| **SQL Injection** | Django ORM (parameterized queries) |
| **XSS** | Angular sanitization + DRF escaping |
| **CSRF** | JWT-based (stateless, no CSRF needed) |
| **Data Isolation** | Middleware enforces `winery_id` filtering |
| **Secrets** | Environment variables, never in code |
| **HTTPS** | Enforced in production via nginx |
| **Rate Limiting** | Django REST throttling |
| **Audit Trail** | `created_by`, `updated_at` on all events |

---

## 8. Performance Considerations

| Concern | Strategy |
|---------|----------|
| **Tank Ledger Queries** | Materialized views, indexed by `tank_id` + `event_datetime` |
| **Large Event Tables** | Cursor pagination, date-range filtering |
| **Dashboard Aggregations** | Redis caching for expensive computations |
| **API Response Times** | Select related/prefetch related in DRF |
| **Frontend Bundle Size** | Lazy loading feature modules |
| **Database Indexes** | On `winery_id`, foreign keys, `created_at` |

---

## 9. Testing Strategy

### 9.1 Backend Testing

| Type | Tool | Coverage Target |
|------|------|-----------------|
| Unit Tests | pytest | Models, services, ledger logic |
| API Tests | pytest + DRF test client | All endpoints |
| Integration | pytest + test database | Event → Ledger flow |

### 9.2 Frontend Testing

| Type | Tool | Coverage Target |
|------|------|-----------------|
| Unit Tests | Jest / Karma | Services, pipes, utilities |
| Component Tests | Angular Testing Library | UI components |
| E2E Tests | Cypress / Playwright | Critical user flows |

---

## 10. Phase Mapping to Technical Work

### Phase 1 — Foundation (MVP)
- [ ] Project scaffolding (Docker, Django, Angular)
- [ ] User authentication (JWT)
- [ ] Multi-tenant middleware
- [ ] Core models: Wineries, Tanks, Batches, Transfers
- [ ] Basic CRUD APIs
- [ ] Angular shell with routing
- [ ] Tank & Batch management UI
- [ ] Transfer logging UI
- [ ] Simple dashboard

### Phase 2 — Intelligence
- [ ] Tank Ledger V2 engine
- [ ] Work Orders with auto-event creation
- [ ] Inventory & Additions module
- [ ] Analyses with charts
- [ ] Alerts & integrity checks
- [ ] Consultant cross-winery dashboard

### Phase 3 — Commercial
- [ ] Bottling runs
- [ ] Packaging SKUs
- [ ] Basic costing

### Phase 4 — Advanced
- [ ] PWA / offline support
- [ ] Equipment workflows
- [ ] Advanced reporting
- [ ] External integrations

---

## 11. Code Patterns & Examples (from Context7)

> These patterns are sourced from official documentation via Context7 and should be used as references during implementation.

### 11.1 Django Multi-Tenant Middleware Pattern

```python
# apps/wineries/middleware.py
class WineryTenantMiddleware:
    """
    Middleware that sets the current winery on the request based on user membership.
    Must be placed after AuthenticationMiddleware.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Set winery context from session or header
        winery_id = request.headers.get('X-Winery-ID') or request.session.get('winery_id')
        
        if request.user.is_authenticated and winery_id:
            # Verify user has access to this winery
            from apps.wineries.models import WineryMembership
            membership = WineryMembership.objects.filter(
                user=request.user,
                winery_id=winery_id,
                is_active=True
            ).first()
            request.winery = membership.winery if membership else None
            request.winery_role = membership.role if membership else None
        else:
            request.winery = None
            request.winery_role = None

        response = self.get_response(request)
        return response


# settings.py
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "apps.wineries.middleware.WineryTenantMiddleware",  # After auth
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
```

### 11.2 Django REST Framework Custom Permissions

```python
# apps/core/permissions.py
from rest_framework import permissions


class IsWineryMember(permissions.BasePermission):
    """
    Permission that checks if user is a member of the current winery.
    """
    def has_permission(self, request, view):
        return request.winery is not None


class IsWineryOwnerOrReadOnly(permissions.BasePermission):
    """
    Full access for WINERY_OWNER and CONSULTANT roles.
    Read-only for other roles.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.winery is not None
        return request.winery_role in ['CONSULTANT', 'WINERY_OWNER']


class IsLabStaffOrHigher(permissions.BasePermission):
    """
    Permission for lab analyses - LAB role and above can edit.
    """
    ALLOWED_ROLES = ['CONSULTANT', 'WINERY_OWNER', 'WINEMAKER', 'LAB']
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.winery is not None
        return request.winery_role in self.ALLOWED_ROLES


# Usage in views
class TankViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsWineryMember]
    
    def get_queryset(self):
        return Tank.objects.filter(winery=self.request.winery)
```

### 11.3 Angular Standalone Component Pattern

```typescript
// app/features/tanks/components/tank-list/tank-list.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TankService } from '../../services/tank.service';
import { Tank } from '../../models/tank.model';

@Component({
  selector: 'app-tank-list',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './tank-list.component.html',
  styleUrls: ['./tank-list.component.scss']
})
export class TankListComponent implements OnInit {
  private tankService = inject(TankService);
  
  displayedColumns: string[] = ['code', 'name', 'type', 'capacity_l', 'location', 'is_active'];
  dataSource = new MatTableDataSource<Tank>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.tankService.getTanks().subscribe(tanks => {
      this.dataSource.data = tanks;
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
```

### 11.4 Angular Material Table Template

```html
<!-- tank-list.component.html -->
<mat-form-field appearance="outline" class="filter-field">
  <mat-label>Filter tanks</mat-label>
  <input matInput (keyup)="applyFilter($event)" placeholder="Search by code or name...">
</mat-form-field>

<div class="mat-elevation-z8">
  <table mat-table [dataSource]="dataSource" matSort>
    
    <!-- Code Column -->
    <ng-container matColumnDef="code">
      <th mat-header-cell *matHeaderCellDef mat-sort-header>Code</th>
      <td mat-cell *matCellDef="let tank">{{ tank.code }}</td>
    </ng-container>

    <!-- Name Column -->
    <ng-container matColumnDef="name">
      <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
      <td mat-cell *matCellDef="let tank">{{ tank.name }}</td>
    </ng-container>

    <!-- Type Column -->
    <ng-container matColumnDef="type">
      <th mat-header-cell *matHeaderCellDef mat-sort-header>Type</th>
      <td mat-cell *matCellDef="let tank">{{ tank.type }}</td>
    </ng-container>

    <!-- Capacity Column -->
    <ng-container matColumnDef="capacity_l">
      <th mat-header-cell *matHeaderCellDef mat-sort-header>Capacity (L)</th>
      <td mat-cell *matCellDef="let tank">{{ tank.capacity_l | number }}</td>
    </ng-container>

    <!-- Location Column -->
    <ng-container matColumnDef="location">
      <th mat-header-cell *matHeaderCellDef mat-sort-header>Location</th>
      <td mat-cell *matCellDef="let tank">{{ tank.location }}</td>
    </ng-container>

    <!-- Status Column -->
    <ng-container matColumnDef="is_active">
      <th mat-header-cell *matHeaderCellDef>Status</th>
      <td mat-cell *matCellDef="let tank">
        <span [class.active]="tank.is_active" [class.inactive]="!tank.is_active">
          {{ tank.is_active ? 'Active' : 'Inactive' }}
        </span>
      </td>
    </ng-container>

    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
    <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
        [routerLink]="['/tanks', row.id]"></tr>

    <!-- No Data Row -->
    <tr class="mat-row" *matNoDataRow>
      <td class="mat-cell" colspan="6">No tanks found</td>
    </tr>
  </table>

  <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]" 
                 aria-label="Select page of tanks">
  </mat-paginator>
</div>
```

### 11.5 Angular Lazy-Loaded Routes

```typescript
// app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { wineryGuard } from './core/guards/winery.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, wineryGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },
  {
    path: 'tanks',
    canActivate: [authGuard, wineryGuard],
    loadChildren: () => import('./features/tanks/tanks.routes').then(m => m.TANK_ROUTES)
  },
  {
    path: 'batches',
    canActivate: [authGuard, wineryGuard],
    loadChildren: () => import('./features/batches/batches.routes').then(m => m.BATCH_ROUTES)
  },
  {
    path: 'transfers',
    canActivate: [authGuard, wineryGuard],
    loadChildren: () => import('./features/transfers/transfers.routes').then(m => m.TRANSFER_ROUTES)
  },
  {
    path: 'analyses',
    canActivate: [authGuard, wineryGuard],
    loadChildren: () => import('./features/analyses/analyses.routes').then(m => m.ANALYSIS_ROUTES)
  },
  {
    path: 'work-orders',
    canActivate: [authGuard, wineryGuard],
    loadChildren: () => import('./features/work-orders/work-orders.routes')
      .then(m => m.WORK_ORDER_ROUTES)
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component')
      .then(m => m.NotFoundComponent)
  }
];
```

### 11.6 JWT Authentication Service (Angular)

```typescript
// app/core/services/auth.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of } from 'rxjs';

interface TokenResponse {
  access: string;
  refresh: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  login(email: string, password: string) {
    return this.http.post<TokenResponse>('/api/v1/auth/token/', { email, password })
      .pipe(
        tap(response => {
          localStorage.setItem(this.ACCESS_TOKEN_KEY, response.access);
          localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refresh);
          this.isAuthenticated.set(true);
          this.loadCurrentUser();
        })
      );
  }

  logout() {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  refreshToken() {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) return of(null);
    
    return this.http.post<TokenResponse>('/api/v1/auth/token/refresh/', { 
      refresh: refreshToken 
    }).pipe(
      tap(response => {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, response.access);
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  private loadCurrentUser() {
    this.http.get<User>('/api/v1/auth/me/').subscribe(user => {
      this.currentUser.set(user);
    });
  }
}
```

---

## 12. Open Decisions (To Be Finalized)

| Decision | Options | Notes |
|----------|---------|-------|
| **State Management** | NgRx vs Signals vs Services | Signals recommended (Angular 17+) |
| **UI Library** | Angular Material vs PrimeNG vs Custom | Material recommended |
| **Background Tasks** | Celery vs Django-Q vs none (Phase 1) | Celery for Phase 2 |
| **Hosting Upgrade** | Vultr VPS → Vultr Kubernetes | When scaling needed |
| **Managed DB** | Container vs Vultr Managed PostgreSQL | Managed for production |

---

## 13. Context7 Library References

These are the verified library IDs for fetching up-to-date documentation:

| Library | Context7 ID | Snippets |
|---------|-------------|----------|
| **Django 5.2** | `/websites/djangoproject_en_5_2` | 3,585 |
| **Django 6.0** | `/websites/djangoproject_en_6_0` | 10,667 |
| **Django REST Framework** | `/websites/django-rest-framework` | 659 |
| **DRF Spectacular** | `/tfranzel/drf-spectacular` | 267 |
| **Angular** | `/angular/angular` | 332 |
| **Angular (llmstxt)** | `/llmstxt/angular_dev_llms_txt` | 1,586 |
| **Angular Material** | `/angular/material2-docs-content` | 2,385 |
| **PostgreSQL** | `/websites/postgresql` | 61,065 |
| **PostgreSQL 16** | `/websites/postgresql_16` | 9,250 |
| **Psycopg3** | `/psycopg/psycopg` | 502 |
| **django-filter** | `/websites/django-filter_readthedocs_io_en_stable` | 214 |
| **SimpleJWT** | `/jazzband/djangorestframework-simplejwt` | 25 |

---

*Last updated: December 2024*  
*Documentation sourced via Context7 MCP*


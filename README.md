# 🍇 Winery ERP

**Wine Production Management System** — A modern, multi-tenant ERP for wineries.

[![Django](https://img.shields.io/badge/Django-5.x-green.svg)](https://www.djangoproject.com/)
[![Angular](https://img.shields.io/badge/Angular-17.x-red.svg)](https://angular.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docs.docker.com/compose/)

---

## 📋 Overview

Winery ERP is a cloud platform for **wine production management**, designed with:

- **Multi-tenant architecture** — One deployment serves multiple wineries
- **Event-driven core** — Full traceability from grape to bottle
- **Consultant-first design** — Cross-winery oversight and management
- **Real-time composition tracking** — Know exactly what's in every tank

## ✨ Features

- 🏭 **Multi-Winery Management** — Manage multiple wineries from a single account
- 🍇 **Harvest & Batch Tracking** — Record grape intake with source traceability
- 🛢️ **Tank & Barrel Management** — Full equipment registry and status tracking
- 🔄 **Transfer Logging** — Event-sourced production movements
- 🧪 **Lab Analyses** — Track fermentation, SO₂, pH, and more
- 📋 **Work Orders** — Assign and track cellar tasks
- 📦 **Inventory Management** — Materials and additions tracking
- 📊 **Dashboards & Reports** — Real-time production visibility

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- Make (optional, for convenience commands)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/winery_erp.git
cd winery_erp

# Copy environment file
cp .env.example .env

# Build and start all services
make setup

# Or without make:
docker compose up -d
docker compose exec backend python manage.py migrate
```

### Access Points

> **Note:** Ports adjusted to avoid conflicts (8001, 4201, 6380)

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:4201 |
| **Backend API** | http://localhost:8001/api/v1/ |
| **API Documentation** | http://localhost:8001/api/docs/ |
| **Admin Panel** | http://localhost:8001/admin/ |

### Create Admin User

```bash
make superuser
# Or: docker compose exec backend python manage.py createsuperuser
```

## 🛠️ Development

### Common Commands

```bash
# Start services
make up

# View logs
make logs

# Run backend tests
make test-backend

# Run database migrations
make migrate

# Create new migrations
make makemigrations

# Open Django shell
make shell

# Format code
make format-backend
```

See `make help` for all available commands.

### Project Structure

```
winery_erp/
├── backend/                 # Django REST API
│   ├── config/             # Django settings
│   ├── apps/               # Django applications
│   │   ├── users/          # Authentication
│   │   ├── wineries/       # Multi-tenancy
│   │   └── ...             # Feature apps
│   └── requirements/       # Python dependencies
├── frontend/               # Angular SPA
│   ├── src/app/
│   │   ├── core/           # Services, guards, interceptors
│   │   ├── shared/         # Common components
│   │   └── features/       # Feature modules
│   └── ...
├── nginx/                  # Production reverse proxy
├── docs/                   # Documentation
├── docker-compose.yml      # Development stack
└── docker-compose.prod.yml # Production stack
```

## 📖 Documentation

- [Project Description](docs/Winery_ERP_Project_Description.md) — Business requirements
- [Database Model](docs/Winery_ERP_Database_Model.md) — Schema documentation
- [Technical Decisions](docs/Winery_ERP_Technical_Decisions.md) — Architecture & stack
- [Development Plan](docs/Winery_ERP_Development_Plan.md) — Roadmap & sprints

## 🧰 Tech Stack

### Backend
- **Django 5** — Web framework
- **Django REST Framework** — API toolkit
- **PostgreSQL 16** — Database
- **Redis** — Caching & task queue
- **JWT** — Authentication

### Frontend
- **Angular 17** — SPA framework
- **Angular Material** — UI components
- **RxJS** — Reactive programming
- **TypeScript** — Type safety

### Infrastructure
- **Docker** — Containerization
- **Nginx** — Reverse proxy
- **Vultr** — Cloud hosting (planned)

## 🔐 User Roles

| Role | Description |
|------|-------------|
| **Consultant** | Oversees multiple wineries, full access |
| **Winery Owner** | Full access to their winery |
| **Winemaker** | Production access, creates work orders |
| **Cellar Staff** | Executes tasks, records events |
| **Lab** | Enters and views analyses |

## 🚢 Deployment

### Production Build

```bash
# Build production images
make prod-build

# Start production stack
make prod-up
```

### Environment Variables

See `.env.example` for all configuration options. Key variables:

```bash
# Django
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com

# Database
DATABASE_URL=postgres://user:pass@host:5432/dbname

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

## 🧪 Testing

```bash
# Backend tests
make test-backend

# Frontend tests
make test-frontend

# All tests
make test-backend && make test-frontend
```

## 📄 License

This project is proprietary software. All rights reserved.

---

Built with ❤️ for winemakers everywhere.


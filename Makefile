# Winery ERP - Makefile
# Common commands for development and deployment

.PHONY: help build up down restart logs shell test migrate makemigrations superuser clean

# Colors
BLUE=\033[0;34m
GREEN=\033[0;32m
YELLOW=\033[0;33m
NC=\033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Winery ERP - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# =============================================================================
# Docker Commands
# =============================================================================

build: ## Build all Docker containers
	docker compose build

up: ## Start all services in development mode
	docker compose up -d

up-logs: ## Start all services with logs attached
	docker compose up

down: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose restart

logs: ## View logs from all services
	docker compose logs -f

logs-backend: ## View backend logs only
	docker compose logs -f backend

logs-frontend: ## View frontend logs only
	docker compose logs -f frontend

ps: ## Show status of all services
	docker compose ps

# =============================================================================
# Backend Commands
# =============================================================================

shell: ## Open Django shell
	docker compose exec backend python manage.py shell

bash: ## Open bash in backend container
	docker compose exec backend bash

migrate: ## Run database migrations
	docker compose exec backend python manage.py migrate

makemigrations: ## Create new migrations
	docker compose exec backend python manage.py makemigrations

superuser: ## Create a superuser
	docker compose exec backend python manage.py createsuperuser

collectstatic: ## Collect static files
	docker compose exec backend python manage.py collectstatic --noinput

test-backend: ## Run backend tests
	docker compose exec backend pytest

lint-backend: ## Run backend linting
	docker compose exec backend ruff check .
	docker compose exec backend black --check .

format-backend: ## Format backend code
	docker compose exec backend black .
	docker compose exec backend ruff check --fix .

# =============================================================================
# Frontend Commands
# =============================================================================

npm: ## Run npm command (usage: make npm cmd="install package")
	docker compose exec frontend npm $(cmd)

test-frontend: ## Run frontend tests
	docker compose exec frontend ng test --watch=false

lint-frontend: ## Run frontend linting
	docker compose exec frontend ng lint

build-frontend: ## Build frontend for production
	docker compose exec frontend ng build --configuration=production

# =============================================================================
# Database Commands
# =============================================================================

db-shell: ## Open PostgreSQL shell
	docker compose exec db psql -U winery -d winery_erp

db-backup: ## Backup database
	@mkdir -p backups
	docker compose exec db pg_dump -U winery winery_erp > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup created in backups/$(NC)"

db-restore: ## Restore database from backup (usage: make db-restore file=backups/backup.sql)
	docker compose exec -T db psql -U winery -d winery_erp < $(file)

# =============================================================================
# Production Commands
# =============================================================================

prod-build: ## Build for production
	docker compose -f docker-compose.prod.yml build

prod-up: ## Start production services
	docker compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production services
	docker compose -f docker-compose.prod.yml down

prod-logs: ## View production logs
	docker compose -f docker-compose.prod.yml logs -f

# =============================================================================
# Utility Commands
# =============================================================================

clean: ## Remove all containers, volumes, and images
	docker compose down -v --rmi all --remove-orphans

clean-volumes: ## Remove only volumes (keeps images)
	docker compose down -v

setup: ## Initial setup - build and start everything
	@echo "$(BLUE)Setting up Winery ERP...$(NC)"
	cp -n .env.example .env || true
	docker compose build
	docker compose up -d db redis
	@echo "$(YELLOW)Waiting for database to be ready...$(NC)"
	sleep 10
	docker compose run --rm backend python manage.py makemigrations
	docker compose run --rm backend python manage.py migrate
	docker compose up -d
	@echo ""
	@echo "$(GREEN)Setup complete!$(NC)"
	@echo "$(BLUE)Frontend:$(NC) http://localhost:4201"
	@echo "$(BLUE)Backend API:$(NC) http://localhost:8001/api/v1/"
	@echo "$(BLUE)API Docs:$(NC) http://localhost:8001/api/docs/"
	@echo "$(BLUE)Admin:$(NC) http://localhost:8001/admin/"
	@echo ""
	@echo "$(YELLOW)Run 'make superuser' to create an admin account$(NC)"

generate-api: ## Generate Angular API client from OpenAPI schema
	docker compose exec frontend npm run generate-api


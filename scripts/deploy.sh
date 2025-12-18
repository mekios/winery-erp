#!/bin/bash
set -e

# ==============================================
# Winery ERP Deployment Script
# ==============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🍷 Winery ERP Deployment Script${NC}"
echo "=================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Create one from .env.example or see docs/VULTR_DEPLOYMENT.md"
    exit 1
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$SECRET_KEY" ] || [ "$SECRET_KEY" == "your-very-long-secret-key-at-least-50-chars-here" ]; then
    echo -e "${RED}Error: SECRET_KEY not set or using default!${NC}"
    echo "Generate one with: openssl rand -base64 64"
    exit 1
fi

if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" == "your-strong-password-here" ]; then
    echo -e "${RED}Error: POSTGRES_PASSWORD not set or using default!${NC}"
    echo "Generate one with: openssl rand -base64 32"
    exit 1
fi

echo -e "${GREEN}✓ Environment variables look good${NC}"

# Build and deploy
echo ""
echo -e "${YELLOW}Building Docker images...${NC}"
docker compose -f docker-compose.prod.yml build

echo ""
echo -e "${YELLOW}Starting services...${NC}"
docker compose -f docker-compose.prod.yml up -d

echo ""
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
sleep 10

echo ""
echo -e "${YELLOW}Running migrations...${NC}"
docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput

echo ""
echo -e "${YELLOW}Collecting static files...${NC}"
docker compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

echo ""
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""
echo "Services running:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}Your app is available at:${NC}"
echo "  Frontend: http://$(hostname -I | awk '{print $1}')/"
echo "  Admin:    http://$(hostname -I | awk '{print $1}')/admin/"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Load demo data (includes users): docker compose -f docker-compose.prod.yml exec backend python manage.py setup_demo_data"
echo "  2. Or create a superuser manually: docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser"
echo ""

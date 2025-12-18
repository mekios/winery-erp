#!/bin/bash
# Database Backup Script for Winery ERP

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/winery_erp_${TIMESTAMP}.sql"
COMPOSE_FILE="${1:-docker-compose.yml}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

echo -e "${YELLOW}Creating database backup...${NC}"

# Create backup
docker compose -f ${COMPOSE_FILE} exec -T db pg_dump -U winery winery_erp > ${BACKUP_FILE}

# Compress backup
gzip ${BACKUP_FILE}

echo -e "${GREEN}✅ Backup created: ${BACKUP_FILE}.gz${NC}"

# Cleanup old backups (keep last 7 days)
echo -e "${YELLOW}Cleaning up old backups...${NC}"
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +7 -delete

echo -e "${GREEN}Done!${NC}"






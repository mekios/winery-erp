# Vultr Deployment Guide

This guide explains how to deploy Winery ERP to a Vultr VPS for demo/testing purposes.

## Prerequisites

- Vultr account with billing set up
- SSH key added to your Vultr account
- Domain name (optional, but recommended for SSL)

## Step 1: Create a Vultr VPS

### Recommended Specs (Demo)

| Setting | Value |
|---------|-------|
| **Type** | Cloud Compute - Regular |
| **Location** | Choose closest to your users |
| **OS** | Ubuntu 24.04 LTS |
| **Plan** | $12/mo (2 vCPU, 2GB RAM, 55GB NVMe) |
| **Auto Backups** | Optional |

1. Go to [Vultr](https://www.vultr.com/) → Deploy → Cloud Compute
2. Select **Regular Performance**
3. Choose your region
4. Select **Ubuntu 24.04 LTS x64**
5. Choose the **$12/month** plan (or higher for production)
6. Add your **SSH Key**
7. Set a hostname: `winery-erp-demo`
8. Click **Deploy Now**

Wait for the server to be ready (~1-2 minutes).

## Step 2: Initial Server Setup

SSH into your server:

```bash
ssh root@YOUR_SERVER_IP
```

Run the initial setup:

```bash
# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y docker.io docker-compose-plugin git ufw

# Start Docker
systemctl enable docker
systemctl start docker

# Configure firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create deploy user
adduser --disabled-password --gecos '' deploy
usermod -aG docker deploy

# Set up SSH for deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

## Step 3: Deploy the Application

Switch to deploy user:

```bash
su - deploy
```

Clone your repository (or upload via scp/rsync):

```bash
# Option A: Clone from Git
git clone https://github.com/YOUR_USERNAME/winery_erp.git
cd winery_erp

# Option B: Upload from local machine (run on your local machine)
# rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '__pycache__' \
#   --exclude '*.pyc' --exclude 'postgres_data' \
#   ./ deploy@YOUR_SERVER_IP:~/winery_erp/
```

Create the environment file:

```bash
cd ~/winery_erp

cat > .env << 'EOF'
# Database
POSTGRES_DB=winery_erp
POSTGRES_USER=winery
POSTGRES_PASSWORD=your-strong-password-here

# Django
SECRET_KEY=your-very-long-secret-key-at-least-50-chars-here
DATABASE_URL=postgres://winery:your-strong-password-here@db:5432/winery_erp
REDIS_URL=redis://redis:6379/0
ALLOWED_HOSTS=YOUR_SERVER_IP,YOUR_DOMAIN.com
CORS_ALLOWED_ORIGINS=http://YOUR_SERVER_IP,https://YOUR_DOMAIN.com
EOF
```

**Important:** Replace the following:
- `your-strong-password-here` → Generate with `openssl rand -base64 32`
- `your-very-long-secret-key` → Generate with `openssl rand -base64 64`
- `YOUR_SERVER_IP` → Your Vultr server IP
- `YOUR_DOMAIN.com` → Your domain (if using one)

## Step 4: Build and Start

Build the production images:

```bash
cd ~/winery_erp

# Build frontend first (needed for nginx)
docker compose -f docker-compose.prod.yml build

# Start all services
docker compose -f docker-compose.prod.yml up -d
```

Run migrations and create demo data:

```bash
# Run migrations
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Create superuser
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# Or load demo data (if you have fixtures)
docker compose -f docker-compose.prod.yml exec backend python manage.py loaddata demo_data
```

## Step 5: Verify Deployment

Check that all services are running:

```bash
docker compose -f docker-compose.prod.yml ps
```

You should see:
```
NAME                  STATUS
winery_backend_prod   Up
winery_db_prod        Up (healthy)
winery_nginx_prod     Up
winery_redis_prod     Up (healthy)
```

Test the endpoints:
```bash
# Health check
curl http://localhost/health

# API
curl http://localhost/api/v1/

# Frontend
curl http://localhost/ | head -20
```

## Step 6: Access Your App

Open your browser:
- **Frontend**: `http://YOUR_SERVER_IP/`
- **Django Admin**: `http://YOUR_SERVER_IP/admin/`
- **API Docs**: `http://YOUR_SERVER_IP/api/v1/schema/swagger-ui/`

## Optional: Set Up SSL with Let's Encrypt

For HTTPS support with a domain:

```bash
# Install certbot
apt install -y certbot

# Get certificate (stop nginx first)
docker compose -f docker-compose.prod.yml stop nginx
certbot certonly --standalone -d YOUR_DOMAIN.com

# Copy certificates
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/YOUR_DOMAIN.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/YOUR_DOMAIN.com/privkey.pem nginx/ssl/

# Update nginx.conf to enable HTTPS (uncomment the SSL server block)
# Then restart nginx
docker compose -f docker-compose.prod.yml up -d nginx
```

## Useful Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f backend

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Stop all services
docker compose -f docker-compose.prod.yml down

# Update and redeploy
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Database backup
docker compose -f docker-compose.prod.yml exec db pg_dump -U winery winery_erp > backup.sql

# Database restore
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U winery winery_erp
```

## Troubleshooting

### Container won't start
```bash
docker compose -f docker-compose.prod.yml logs backend
```

### Database connection issues
```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py dbshell
```

### Frontend shows blank page
Check nginx logs:
```bash
docker compose -f docker-compose.prod.yml logs nginx
```

### 502 Bad Gateway
Backend might not be ready. Wait and check:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs backend
```

## Security Checklist

- [ ] Changed default database password
- [ ] Generated a strong SECRET_KEY
- [ ] Enabled UFW firewall
- [ ] Set up SSL/HTTPS
- [ ] Disabled DEBUG mode
- [ ] Changed demo user passwords
- [ ] Set up regular backups

## Cost Estimate

| Service | Monthly Cost |
|---------|-------------|
| Vultr VPS ($12 plan) | $12 |
| Domain (optional) | ~$1/mo |
| **Total** | **~$12-13/mo** |

For production, consider:
- Managed database ($15+/mo)
- Load balancer ($10/mo)
- Block storage for backups ($1/GB)





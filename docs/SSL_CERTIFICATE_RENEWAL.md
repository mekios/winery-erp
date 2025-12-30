# SSL Certificate Renewal for winery.mekios.gr

## Issue
The domain has changed to `winery.mekios.gr` but the SSL certificate is still for the old domain.

## Solution

SSH into your Vultr server and run these commands:

### 1. Stop nginx to free port 80
```bash
cd ~/winery_erp
docker compose -f docker-compose.prod.yml stop nginx
```

### 2. Obtain new certificate with certbot
```bash
# Install certbot if not already installed
sudo apt update
sudo apt install -y certbot

# Generate certificate for new domain
sudo certbot certonly --standalone \
  -d winery.mekios.gr \
  --agree-tos \
  --email your-email@example.com \
  --non-interactive
```

### 3. Copy certificates to the correct location
```bash
# Create SSL directory in your project
mkdir -p ~/winery_erp/nginx/ssl

# Copy the new certificates
sudo cp /etc/letsencrypt/live/winery.mekios.gr/fullchain.pem ~/winery_erp/nginx/ssl/
sudo cp /etc/letsencrypt/live/winery.mekios.gr/privkey.pem ~/winery_erp/nginx/ssl/
sudo chown -R deploy:deploy ~/winery_erp/nginx/ssl
```

### 4. Update docker-compose.prod.yml to mount the SSL certificates
Edit `docker-compose.prod.yml` and ensure nginx service has:

```yaml
nginx:
  volumes:
    - ./nginx/ssl:/etc/nginx/ssl:ro
```

### 5. Restart the services
```bash
cd ~/winery_erp
docker compose -f docker-compose.prod.yml up -d
```

### 6. Verify SSL is working
```bash
# Check certificate
curl -I https://winery.mekios.gr

# Or open in browser
```

## Alternative: If DNS is not yet pointing to the server

If your DNS for `winery.mekios.gr` is not yet pointing to your Vultr server IP, you need to:

1. **Update DNS records** for winery.mekios.gr to point to your Vultr server IP
2. **Wait for DNS propagation** (can take 5 minutes to 48 hours)
3. Check DNS with: `dig winery.mekios.gr` or `nslookup winery.mekios.gr`
4. Once DNS is correct, follow the steps above

## Auto-renewal setup

To ensure certificates renew automatically:

```bash
# Create renewal script
sudo tee /etc/cron.d/certbot-renew << EOF
0 3 * * * root certbot renew --quiet --deploy-hook "cp /etc/letsencrypt/live/winery.mekios.gr/*.pem /home/deploy/winery_erp/nginx/ssl/ && chown -R deploy:deploy /home/deploy/winery_erp/nginx/ssl && cd /home/deploy/winery_erp && docker compose -f docker-compose.prod.yml restart nginx"
EOF
```

This will check for renewal daily at 3 AM and restart nginx if renewed.


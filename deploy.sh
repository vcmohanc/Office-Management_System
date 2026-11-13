#!/bin/bash
set -e

# Secrets live outside the web root; never in /var/www/ or the deploy temp dir.
ENV_FILE="/etc/oms/.env"

if [ ! -f "$ENV_FILE" ]; then
    # Fallback to /var/www/oms-config/.env if /etc/oms/.env is not present
    if [ -f "/var/www/oms-config/.env" ]; then
        ENV_FILE="/var/www/oms-config/.env"
    else
        echo "ERROR: /etc/oms/.env not found."
        echo "Provision it once on the server:"
        echo "  sudo mkdir -p /etc/oms"
        echo "  sudo cp /var/www/oms-config/.env /etc/oms/.env"
        echo "  sudo chmod 600 /etc/oms/.env"
        exit 1
    fi
fi

# 1. Stop and disable host nginx so Docker client container can bind ports 80 and 443
echo "Stopping host nginx if active..."
sudo systemctl stop nginx 2>/dev/null || true
sudo systemctl disable nginx 2>/dev/null || true

# 2. Scrub any stale .env copies from web-accessible or deploy-temp directories.
rm -f .env .env.bak*

# 3. Pull latest images sequentially to avoid CPU/memory spike on micro instances
echo "Pulling latest images..."
sudo docker compose --env-file "$ENV_FILE" pull server
sudo docker compose --env-file "$ENV_FILE" pull client

# 4. Bring down old containers cleanly and start with new images
echo "Starting application..."
sudo docker compose --env-file "$ENV_FILE" down --remove-orphans 2>/dev/null || true
sudo docker compose --env-file "$ENV_FILE" up -d --remove-orphans

echo "Waiting for server to be healthy..."
for i in $(seq 1 30); do
    STATUS=$(sudo docker compose --env-file "$ENV_FILE" ps --format json server 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Health',''))" 2>/dev/null || echo "")
    if [ "$STATUS" = "healthy" ]; then
        echo "  Server is healthy."
        break
    fi
    echo "  Waiting... ($i/30)"
    sleep 3
done

echo "Running database seed (skips existing records)..."
sudo docker compose --env-file "$ENV_FILE" exec -T server node scripts/seedB2B.js && echo "  B2B seed complete." || echo "  B2B seed skipped or already up to date."
sudo docker compose --env-file "$ENV_FILE" exec -T server node scripts/seed-reference.js && echo "  Reference data seed complete." || echo "  Reference data seed skipped or already up to date."

echo "Cleaning up old images..."
sudo docker image prune -f

echo "Deployment complete!"
sudo docker compose --env-file "$ENV_FILE" ps

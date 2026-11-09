#!/bin/bash
set -e

# Secrets live outside the web root; never in /var/www/ or the deploy temp dir.
ENV_FILE="/etc/oms/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: $ENV_FILE not found."
    echo "Provision it once on the server:"
    echo "  sudo mkdir -p /etc/oms"
    echo "  sudo nano /etc/oms/.env        # paste your production secrets"
    echo "  sudo chmod 600 /etc/oms/.env"
    echo "  sudo chown root:root /etc/oms/.env"
    exit 1
fi

# Scrub any stale .env copies from web-accessible or deploy-temp directories.
rm -f .env .env.bak*
sudo rm -f /var/www/oms-config/.env /var/www/oms-temp-config/.env 2>/dev/null || true
sudo rmdir --ignore-fail-on-non-empty /var/www/oms-config /var/www/oms-temp-config 2>/dev/null || true

echo "Pulling latest images..."
sudo docker compose --env-file "$ENV_FILE" pull

echo "Starting application..."
sudo docker compose --env-file "$ENV_FILE" up -d

echo "Waiting for server to be healthy..."
for i in $(seq 1 20); do
    STATUS=$(sudo docker compose --env-file "$ENV_FILE" ps --format json server 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Health',''))" 2>/dev/null || echo "")
    if [ "$STATUS" = "healthy" ]; then
        echo "  Server is healthy."
        break
    fi
    echo "  Waiting... ($i/20)"
    sleep 3
done

echo "Running database seed (skips existing records)..."
sudo docker compose --env-file "$ENV_FILE" exec -T server node scripts/seedB2B.js && echo "  B2B seed complete." || echo "  B2B seed skipped or already up to date."
sudo docker compose --env-file "$ENV_FILE" exec -T server node scripts/seed-reference.js && echo "  Reference data seed complete." || echo "  Reference data seed skipped or already up to date."

echo "Cleaning up old images..."
sudo docker image prune -f

echo "Deployment complete!"
sudo docker compose --env-file "$ENV_FILE" ps

#!/bin/bash
set -e

ENV_FILE="/var/www/oms-temp-config/.env"

if [ ! -f "$ENV_FILE" ]; then
    if [ -f /home/ubuntu/.env ]; then
        echo "Found .env in /home/ubuntu/.env, copying to $ENV_FILE..."
        sudo mkdir -p /var/www/oms-temp-config
        sudo cp /home/ubuntu/.env "$ENV_FILE"
        sudo chown ubuntu:ubuntu "$ENV_FILE"
        sudo chmod 640 "$ENV_FILE"
    else
        echo "Error: $ENV_FILE not found."
        exit 1
    fi
fi

# Ensure no .env sits inside oms-temp directory
rm -f .env .env.bak*

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

#!/bin/bash
set -e

if [ ! -f .env ]; then
    echo "Error: .env file not found. Please copy .env.example to .env and configure secrets."
    exit 1
fi

echo "Pulling latest images..."
sudo docker compose pull

echo "Starting application..."
sudo docker compose up -d

echo "Waiting for server to be healthy..."
for i in $(seq 1 20); do
    STATUS=$(sudo docker compose ps --format json server 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Health',''))" 2>/dev/null || echo "")
    if [ "$STATUS" = "healthy" ]; then
        echo "  Server is healthy."
        break
    fi
    echo "  Waiting... ($i/20)"
    sleep 3
done

echo "Running database seed (skips existing records)..."
sudo docker compose exec -T server node scripts/seedB2B.js && echo "  Seed complete." || echo "  Seed skipped or already up to date."

echo "Cleaning up old images..."
sudo docker image prune -f

echo "Deployment complete!"
sudo docker compose ps

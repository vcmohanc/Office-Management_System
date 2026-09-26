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

echo "Cleaning up old images..."
sudo docker image prune -f

echo "Deployment complete!"
sudo docker compose ps

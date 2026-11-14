#!/usr/bin/env bash
# deploy-prod.sh — full production deployment for OMS
# Run from ~/oms/ on the server:  bash deploy-prod.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "================================================"
echo "  OMS Production Deploy"
echo "================================================"

# ── 1. Resolve .env (prefer /etc/oms/.env, outside any web root) ───────────────
ENV_FILE="/etc/oms/.env"
if ! sudo test -f "$ENV_FILE" 2>/dev/null; then
  if [ -f "/var/www/oms-config/.env" ]; then
    ENV_FILE="/var/www/oms-config/.env"
  elif [ -f "$SCRIPT_DIR/.env" ]; then
    ENV_FILE="$SCRIPT_DIR/.env"
  else
    echo ""
    echo "ERROR: .env file not found at /etc/oms/.env or $SCRIPT_DIR/.env"
    echo ""
    echo "Create /etc/oms/.env with at minimum:"
    echo "  MONGO_INITDB_ROOT_USERNAME=admin"
    echo "  MONGO_INITDB_ROOT_PASSWORD=<strong-password>"
    echo "  JWT_SECRET=<64-char-random-string>"
    echo "  CLIENT_URL=https://oms.vegecoop.net"
    echo "  PORT=5000"
    echo ""
    exit 1
  fi
fi

echo "  Using env file: $ENV_FILE"

# ── 2. Check required env vars ────────────────────────────────────────────────
check_var() {
  local var="$1"
  local val
  val="$(sudo grep -E "^${var}=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'"'"' ' || true)"
  if [ -z "$val" ]; then
    echo "ERROR: $var is not set in $ENV_FILE"
    return 1
  fi
}

MISSING=0
for V in MONGO_INITDB_ROOT_USERNAME MONGO_INITDB_ROOT_PASSWORD JWT_SECRET; do
  if ! check_var "$V"; then MISSING=1; fi
done

if [ "$MISSING" -eq 1 ]; then
  echo ""
  echo "Fix the missing variables above and re-run."
  exit 1
fi

echo "  .env OK"

# ── 3. Stop host nginx if active so Docker client can bind ports 80 & 443 ────
echo "Stopping host nginx if active..."
sudo systemctl stop nginx 2>/dev/null || true
sudo systemctl disable nginx 2>/dev/null || true

# ── 4. Remove override file (not needed in production) ────────────────────────
# docker-compose.override.yml is for local dev only.
OVERRIDE="$SCRIPT_DIR/docker-compose.override.yml"
if [ -f "$OVERRIDE" ]; then
  echo "  Removing docker-compose.override.yml (dev-only file)"
  rm -f "$OVERRIDE"
fi

# ── 5. Pull latest images & start ─────────────────────────────────────────────
echo ""
echo "Pulling latest images..."
sudo docker compose --env-file "$ENV_FILE" pull server
sudo docker compose --env-file "$ENV_FILE" pull client

echo ""
echo "Starting containers..."
sudo docker compose --env-file "$ENV_FILE" up -d --no-build --remove-orphans

# ── 6. Wait for server to be healthy ──────────────────────────────────────────
echo ""
echo "Waiting for server health check..."
TRIES=0
MAX=30
until sudo docker compose --env-file "$ENV_FILE" exec -T server node -e "require('http').get('http://127.0.0.1:5000/api/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))" 2>/dev/null; do
  TRIES=$((TRIES+1))
  if [ "$TRIES" -ge "$MAX" ]; then
    echo ""
    echo "ERROR: Server did not become healthy after ${MAX} checks"
    echo "Check logs with:  sudo docker compose --env-file \"$ENV_FILE\" logs server --tail=50"
    exit 1
  fi
  printf "."
  sleep 2
done
echo " healthy!"

# ── 7. Seed all data ──────────────────────────────────────────────────────────
echo ""
echo "Seeding reference + business data..."
sudo docker compose --env-file "$ENV_FILE" exec -T server node scripts/seed-all.js

echo ""
echo "================================================"
echo "  Deploy complete!"
echo "  App: https://oms.vegecoop.net"
echo "================================================"
echo ""
echo "If this is a FRESH deployment (no admin user yet), create one:"
echo ""
echo "  docker compose exec server node scripts/create-admin.js <username> <password>"
echo ""
echo "Example:"
echo "  docker compose exec server node scripts/create-admin.js admin MyStrongPass123"
echo ""

#!/bin/sh
set -e

mkdir -p /app/uploads 2>/dev/null || true

if [ "$(id -u)" = "0" ]; then
    chown -R node:node /app/uploads 2>/dev/null || true
    chmod 775 /app/uploads 2>/dev/null || true
    exec su-exec node "$@"
else
    exec "$@"
fi

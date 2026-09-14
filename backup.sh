#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

# Load environment variables
source .env

BACKUP_DIR="/var/backups/mongodb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/mongo_backup_${TIMESTAMP}.archive"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "Starting MongoDB backup..."

# Run mongodump inside the container and output to an archive file
docker exec oms-mongo-1 mongodump \
  --username="${MONGO_ROOT_USER}" \
  --password="${MONGO_ROOT_PASSWORD}" \
  --authenticationDatabase=admin \
  --archive > "${BACKUP_FILE}"

echo "Backup created at ${BACKUP_FILE}"

# Cleanup old backups based on retention policy
find "$BACKUP_DIR" -type f -name "mongo_backup_*.archive" -mtime +${BACKUP_RETENTION_DAYS} -exec rm {} \;
echo "Old backups cleaned up."

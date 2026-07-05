#!/bin/sh
set -eu

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
POSTGRES_DB="${POSTGRES_DB:-suzuki_cello}"
POSTGRES_USER="${POSTGRES_USER:-suzuki}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="${BACKUP_DIR}/${POSTGRES_DB}-${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"

echo "Backup written to $BACKUP_FILE"
echo "Copy this file to off-VPS storage before relying on it."

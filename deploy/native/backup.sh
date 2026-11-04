#!/usr/bin/env bash
# Nightly dump of the database (run by cron as the postgres user), keeping BACKUP_KEEP_DAYS days.
set -euo pipefail
DIR="${BACKUP_DIR:-/var/backups/aiworkbook}"
KEEP="${BACKUP_KEEP_DAYS:-14}"
mkdir -p "$DIR"
pg_dump --format=custom --file="$DIR/workbook-$(date -u +%Y-%m-%dT%H%M%SZ).dump" workbook
find "$DIR" -name 'workbook-*.dump' -mtime +"$KEEP" -delete

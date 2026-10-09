#!/bin/sh
# Nightly compressed dump of the database into ./backups, keeping BACKUP_KEEP_DAYS days.
set -eu
while true; do
	stamp=$(date -u +%Y-%m-%dT%H%M%SZ)
	pg_dump --format=custom --file="/backups/workbook-$stamp.dump"
	echo "backup written: workbook-$stamp.dump"
	find /backups -name 'workbook-*.dump' -mtime +"${BACKUP_KEEP_DAYS:-14}" -delete
	sleep 86400
done

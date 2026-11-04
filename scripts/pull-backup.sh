#!/bin/bash
# Pulls a consistent DB snapshot and all listing photos from the server into backups/.
set -euo pipefail

SERVER=root@161.35.80.19
APP=/var/www/pocketlist
DEST="$(cd "$(dirname "$0")/.." && pwd)/backups"
KEEP_DAYS=30
STAMP=$(date +%F-%H%M)

mkdir -p "$DEST/db" "$DEST/uploads"

# .backup is safe while the app is writing; a plain cp of dev.db is not.
ssh -o BatchMode=yes -o ConnectTimeout=20 "$SERVER" \
  "sqlite3 $APP/dev.db \".backup '$APP/backups/nightly.db'\""
scp -q -o BatchMode=yes "$SERVER:$APP/backups/nightly.db" "$DEST/db/.incoming.db"

# Don't let a bad transfer replace a good backup.
[ "$(sqlite3 "$DEST/db/.incoming.db" 'pragma integrity_check;')" = "ok" ]
mv "$DEST/db/.incoming.db" "$DEST/db/prod-$STAMP.db"

# No --delete: a photo lost on the server must survive here.
rsync -a -e "ssh -o BatchMode=yes" "$SERVER:$APP/uploads/" "$DEST/uploads/"

find "$DEST/db" -name 'prod-*.db' -mtime +"$KEEP_DAYS" -delete

echo "$(date '+%F %T') ok: prod-$STAMP.db, $(find "$DEST/uploads" -type f | wc -l | tr -d ' ') photo files"

#!/bin/sh
# Automated backup: timestamped tarball of data/ (DB, uploads, logs) with retention.
# Usage: deploy/backup.sh [keep]  (default keep=7)
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEEP="${1:-7}"
TS="$(date +%Y%m%d-%H%M%S)"
OUT="$ROOT/backups/amp-data-$TS.tgz"
mkdir -p "$ROOT/backups"
tar -czf "$OUT" -C "$ROOT" data
# verify integrity
tar -tzf "$OUT" >/dev/null
echo "backup OK: $OUT ($(du -h "$OUT" | cut -f1))"
# retention: keep newest $KEEP
ls -t "$ROOT/backups"/amp-data-*.tgz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f
echo "retention: keeping newest $KEEP"

#!/bin/sh
# Graceful stop (SIGTERM -> server drains and exits).
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$ROOT/deploy/.pid" ]; then
  PID="$(cat "$ROOT/deploy/.pid")"
  if kill -0 "$PID" 2>/dev/null; then kill -TERM "$PID"; echo "stopped $PID"; else echo "pid $PID not running"; fi
  rm -f "$ROOT/deploy/.pid"
else
  echo "no pid file; trying pkill node server.js"
  pkill -TERM -f "node server.js" || true
fi

#!/bin/sh
# Production starter: Loads deploy/.env if present, starts server detached with log.
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$ROOT/server.log"
if [ -f "$ROOT/deploy/.env" ]; then set -a; . "$ROOT/deploy/.env"; set +a; fi
PORT="${PORT:-8082}"
if lsof -ti:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then echo "port $PORT already in use"; exit 1; fi
cd "$ROOT"
PORT="$PORT" nohup node server.js >>"$LOG" 2>&1 &
echo $! > "$ROOT/deploy/.pid"
echo "started pid $(cat "$ROOT/deploy/.pid") on :$PORT (log $LOG)"

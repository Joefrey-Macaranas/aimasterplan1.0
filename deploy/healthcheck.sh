#!/bin/sh
# Healthcheck for prod monitoring / launchd / CI. Exits 0 when healthy.
set -eu
PORT="${PORT:-8082}"
BASE="http://localhost:${PORT}"
code="$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health" || echo 000)"
if [ "$code" != "200" ]; then echo "UNHEALTHY ($code)"; exit 1; fi
echo "OK $BASE/api/health"

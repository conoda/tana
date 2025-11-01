#!/usr/bin/env bash
set -euo pipefail

# Check if redis is running
if docker ps --filter "name=redis" --filter "status=running" --format '{{.Names}}' | grep -q '^redis$'; then
  echo "✅ redis is already running"
else
  echo "▶️  Starting redis..."
  docker compose -f docker.db.yml up -d redis
fi
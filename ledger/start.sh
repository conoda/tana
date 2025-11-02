#!/bin/bash
# Start ledger service with correct database URL

cd "$(dirname "$0")"

export DATABASE_URL='postgres://tana:tana_dev_password@localhost:5432/tana'
export PORT=8080
export NODE_ENV=development

echo "🚀 Starting Tana Ledger Service..."
echo "📊 Database: $DATABASE_URL"

bun run dev

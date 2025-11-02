#!/bin/bash
# Start all Tana services with mprocs

cd "$(dirname "$0")"

echo "🚀 Starting Tana development environment..."
echo ""
echo "Services that will start:"
echo "  ✅ postgres  - Database (auto)"
echo "  ✅ redis     - Cache (auto)"
echo "  ✅ ledger    - Account service (auto)"
echo "  ✅ web       - Website (auto)"
echo "  ⏸️  contracts - Smart contracts (manual)"
echo "  ⏸️  node      - Blockchain node (manual)"
echo ""
echo "Press Ctrl+A then Q to quit all processes"
echo ""

mprocs

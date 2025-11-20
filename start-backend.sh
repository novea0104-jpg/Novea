#!/bin/bash

echo "🚀 Starting Novea Backend Server..."
echo ""
echo "▶️  Backend will run on port 3000"
echo "▶️  Frontend already running on port 8081"
echo "▶️  Keep this terminal open while testing"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start backend server
PORT=3000 npx tsx server/index.ts

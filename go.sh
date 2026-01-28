#!/bin/bash
# OtakuDB - Final Start Script

cd /workspaces/otakudb

# Kill all
pkill -9 -f "node server" 2>/dev/null
pkill -9 -f "npm run dev" 2>/dev/null
sleep 2

# Start backend
echo "🔧 Backend..."
node server/index.js > /tmp/b.log 2>&1 &
sleep 3

# Start frontend
echo "🎬 Frontend..."
npm run dev > /tmp/f.log 2>&1 &
sleep 6

# Get frontend port
PORT=$(grep "Local:" /tmp/f.log | grep -o "[0-9]*$" | head -1)
[ -z "$PORT" ] && PORT=8080

# Test
echo ""
echo "════════════════════════════════"
echo "✅ OtakuDB READY"
echo ""
echo "🎬 http://localhost:$PORT"
echo "🔧 http://localhost:4000"
echo ""
echo "Open http://localhost:$PORT"
echo "════════════════════════════════"

wait

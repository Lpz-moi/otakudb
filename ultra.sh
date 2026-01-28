#!/bin/bash
cd /workspaces/otakudb
pkill -9 -f "node server" 2>/dev/null
pkill -9 -f "npm run dev" 2>/dev/null
sleep 2
rm -rf .vite 2>/dev/null
node server/index.js > /tmp/b.log 2>&1 &
sleep 3
npm run dev > /tmp/f.log 2>&1 &
sleep 6
PORT=$(grep "Local:" /tmp/f.log | tail -1 | grep -o "[0-9]*$" | head -1)
[ -z "$PORT" ] && PORT=8080
echo ""
echo "🎬 http://localhost:$PORT"
echo "🔧 http://localhost:4000"
echo ""
wait

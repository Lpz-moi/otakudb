#!/bin/bash

echo "🚀 Démarrage OtakuDB..."

cd /workspaces/otakudb

# Backend
echo "🔧 Backend..."
node server/index.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

# Frontend
echo "🎬 Frontend..."
npm run dev > /tmp/vite.log 2>&1 &
FRONTEND_PID=$!
sleep 3

echo ""
echo "✅ Démarré!"
echo "🎬 http://localhost:8080"
echo "🔧 http://localhost:3001"
echo ""
echo "📝 Ouvre http://localhost:8080 et teste le login"

# Garder actif
wait
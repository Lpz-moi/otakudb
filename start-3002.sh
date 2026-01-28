#!/bin/bash

# Démarrage OtakuDB avec port 3002

echo "🚀 Démarrage OtakuDB (port 3002)..."

# Nettoyer
pkill -f "node server" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 1

cd /workspaces/otakudb

# Backend
echo "🔧 Backend sur port 3002..."
node server/index.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

# Vérifier backend
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo "❌ Backend failed"
  cat /tmp/backend.log
  exit 1
fi

# Frontend
echo "🎬 Frontend..."
npm run dev > /tmp/vite.log 2>&1 &
FRONTEND_PID=$!
sleep 3

# Vérifier frontend
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
  echo "❌ Frontend failed"
  cat /tmp/vite.log
  exit 1
fi

# Test
echo "🔍 Test connectivité..."
BACKEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/auth/discord/login 2>/dev/null)
FRONTEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null)

echo "Backend: $BACKEND_OK, Frontend: $FRONTEND_OK"

if [ "$BACKEND_OK" = "200" ] && [ "$FRONTEND_OK" = "200" ]; then
  echo ""
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "✅ OtakuDB fonctionne sur port 3002!"
  echo ""
  echo "🎬 Frontend: http://localhost:8080"
  echo "🔧 Backend:  http://localhost:3002"
  echo ""
  echo "📝 Ouvre http://localhost:8080 dans ton navigateur"
  echo "   Clique sur Login avec Discord"
  echo "╚════════════════════════════════════════════════════════════╝"
else
  echo "❌ Problème de connectivité"
fi

# Garder actif
trap 'echo "Arrêt demandé..."; exit 0' INT TERM
wait
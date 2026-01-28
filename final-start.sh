#!/bin/bash

echo "🚀 OtakuDB - Démarrage final (port 3003)"

# Nettoyer
pkill -9 -f "node server" 2>/dev/null
pkill -9 -f "npm run dev" 2>/dev/null
pkill -9 -f "vite" 2>/dev/null
sleep 2

cd /workspaces/otakudb

# Démarrer backend
echo "🔧 Backend (port 3003)..."
node server/index.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Vérifier backend
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo "❌ Backend failed"
  cat /tmp/backend.log
  exit 1
fi

# Démarrer frontend
echo "🎬 Frontend..."
npm run dev > /tmp/vite.log 2>&1 &
FRONTEND_PID=$!
sleep 4

# Vérifier frontend
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
  echo "❌ Frontend failed"
  cat /tmp/vite.log
  exit 1
fi

# Test final
echo "🔍 Test connectivité..."
BACKEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/api/auth/discord/login 2>/dev/null)
FRONTEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null)

echo "Backend: $BACKEND_TEST, Frontend: $FRONTEND_TEST"

if [ "$BACKEND_TEST" = "200" ] && [ "$FRONTEND_TEST" = "200" ]; then
  echo ""
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "🎉 SUCCÈS! OtakuDB fonctionne parfaitement!"
  echo ""
  echo "🎬 Frontend: http://localhost:8080"
  echo "🔧 Backend:  http://localhost:3003"
  echo ""
  echo "📝 Actions:"
  echo "   1. Ouvre http://localhost:8080 dans ton navigateur"
  echo "   2. Clique sur le bouton 'Login with Discord'"
  echo "   3. Tu seras redirigé vers Discord"
  echo "   4. Accepte les permissions"
  echo "   5. Tu reviendras connecté à OtakuDB!"
  echo ""
  echo "🔧 Les services tournent en arrière-plan"
  echo "╚════════════════════════════════════════════════════════════╝"
else
  echo "❌ Problème détecté"
fi

# Garder actif
trap 'echo ""; echo "🛑 Arrêt demandé - Services arrêtés"; exit 0' INT TERM
wait
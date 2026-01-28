#!/bin/bash

echo "🚀 Démarrage d'OtakuDB..."

# Arrêter les processus précédents
pkill -f "node server" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 1

# Aller au répertoire du projet
cd /workspaces/otakudb

# Démarrer le backend
echo "🔧 Backend startup..."
node server/index.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

# Vérifier que le backend démarre
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo "❌ Backend failed to start"
  cat /tmp/backend.log
  exit 1
fi

echo "✅ Backend running (PID: $BACKEND_PID)"

# Démarrer le frontend
echo "🎬 Frontend startup..."
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

if ! kill -0 $FRONTEND_PID 2>/dev/null; then
  echo "❌ Frontend failed to start"
  cat /tmp/frontend.log
  exit 1
fi

echo "✅ Frontend running (PID: $FRONTEND_PID)"

# Test de connectivité
echo "🔍 Test de connectivité..."
sleep 2

if curl -s http://localhost:3001/api/auth/discord/login > /dev/null 2>&1; then
  echo "✅ Backend accessible"
else
  echo "❌ Backend non accessible"
fi

if curl -s http://localhost:8080 > /dev/null 2>&1; then
  echo "✅ Frontend accessible"
else
  echo "❌ Frontend non accessible"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ OtakuDB is running!"
echo ""
echo "🎬 Frontend: http://localhost:8080"
echo "🔧 Backend: http://localhost:3001"
echo ""
echo "📝 Ouvre http://localhost:8080 dans le navigateur"
echo "   Clique sur Login avec Discord"
echo ""
echo "🔄 Pour arrêter: Ctrl+C ou pkill -f 'node server' && pkill -f 'npm run dev'"
echo "═══════════════════════════════════════════════"

# Keep script alive
wait

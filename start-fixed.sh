#!/bin/bash

# Script de démarrage OtakuDB avec gestion des erreurs

echo "🚀 Démarrage OtakuDB..."

# Nettoyer les processus existants
pkill -f "node server" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 1

cd /workspaces/otakudb

# Démarrer backend
echo "🔧 Backend..."
node server/index.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

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
sleep 3

# Vérifier frontend
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
  echo "❌ Frontend failed"
  cat /tmp/vite.log
  exit 1
fi

# Test connectivité
echo "🔍 Test connectivité..."
BACKEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/discord/login 2>/dev/null)
FRONTEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null)

echo "Backend: $BACKEND_OK, Frontend: $FRONTEND_OK"

if [ "$BACKEND_OK" = "200" ] && [ "$FRONTEND_OK" = "200" ]; then
  echo ""
  echo "✅ TOUT FONCTIONNE!"
  echo "🎬 http://localhost:8080"
  echo "🔧 http://localhost:3001"
  echo ""
  echo "📝 Ouvre http://localhost:8080 et clique sur Login"
  echo "   Si tu vois encore l'erreur, ouvre la console (F12)"
  echo "   et envoie-moi les messages"
else
  echo "❌ Problème de connectivité"
fi

# Garder actif
wait
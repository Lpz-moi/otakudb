#!/bin/bash

echo "🔍 DIAGNOSTIC COMPLET OtakuDB"
echo "═══════════════════════════════════════════════════════════"

# Démarrer les services
echo ""
echo "1️⃣ Démarrage des services..."
echo "─────────────────────────────────────────────────────────"

cd /workspaces/otakudb

# Backend
echo "🔧 Démarrage backend..."
node server/index.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

# Frontend
echo "🎬 Démarrage frontend..."
npm run dev > /tmp/vite.log 2>&1 &
FRONTEND_PID=$!
sleep 4

echo ""
echo "2️⃣ Vérification des processus..."
echo "─────────────────────────────────────────────────────────"

if kill -0 $BACKEND_PID 2>/dev/null; then
  echo "✅ Backend PID: $BACKEND_PID"
else
  echo "❌ Backend arrêté"
  cat /tmp/backend.log
  exit 1
fi

if kill -0 $FRONTEND_PID 2>/dev/null; then
  echo "✅ Frontend PID: $FRONTEND_PID"
else
  echo "❌ Frontend arrêté"
  cat /tmp/vite.log
  exit 1
fi

echo ""
echo "3️⃣ Test des ports..."
echo "─────────────────────────────────────────────────────────"

if lsof -i :3001 2>/dev/null | grep -q LISTEN; then
  echo "✅ Port 3001 (backend) en écoute"
else
  echo "❌ Port 3001 (backend) pas en écoute"
fi

if lsof -i :8080 2>/dev/null | grep -q LISTEN; then
  echo "✅ Port 8080 (frontend) en écoute"
else
  echo "❌ Port 8080 (frontend) pas en écoute"
fi

echo ""
echo "4️⃣ Test des endpoints..."
echo "─────────────────────────────────────────────────────────"

BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/discord/login 2>/dev/null)
if [ "$BACKEND_STATUS" = "200" ]; then
  echo "✅ Backend endpoint: HTTP $BACKEND_STATUS"
else
  echo "❌ Backend endpoint: HTTP $BACKEND_STATUS"
fi

FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null)
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "✅ Frontend: HTTP $FRONTEND_STATUS"
else
  echo "❌ Frontend: HTTP $FRONTEND_STATUS"
fi

echo ""
echo "5️⃣ Test CORS..."
echo "─────────────────────────────────────────────────────────"

CORS_HEADER=$(curl -s -I -H "Origin: http://localhost:8080" http://localhost:3001/api/auth/discord/login 2>/dev/null | grep "Access-Control-Allow-Origin" | awk '{print $2}')
if [ -n "$CORS_HEADER" ]; then
  echo "✅ CORS: $CORS_HEADER"
else
  echo "❌ CORS: Pas d'en-tête trouvé"
fi

echo ""
echo "6️⃣ Configuration..."
echo "─────────────────────────────────────────────────────────"

echo "VITE_API_URL: $(grep VITE_API_URL /workspaces/otakudb/.env | cut -d'=' -f2)"
echo "FRONTEND_URL: $(grep FRONTEND_URL /workspaces/otakudb/.env | cut -d'=' -f2)"

echo ""
echo "7️⃣ Test de fetch simulé..."
echo "─────────────────────────────────────────────────────────"

# Simuler le fetch du frontend
FETCH_TEST=$(curl -s -H "Origin: http://localhost:8080" -H "Content-Type: application/json" http://localhost:3001/api/auth/discord/login 2>/dev/null | jq -r '.authUrl' 2>/dev/null | head -c 50)
if [ -n "$FETCH_TEST" ] && [ "$FETCH_TEST" != "null" ]; then
  echo "✅ Fetch simulé: OK (${FETCH_TEST}...)"
else
  echo "❌ Fetch simulé: ÉCHEC"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📝 RÉSULTATS:"
echo ""
echo "🎬 Frontend: http://localhost:8080"
echo "🔧 Backend: http://localhost:3001"
echo ""
echo "📋 Si tout est ✅, ouvre http://localhost:8080"
echo "   Ouvre la console (F12) et clique sur Login"
echo "   Envoie-moi les logs de la console"
echo ""
echo "🔄 Les services restent actifs en arrière-plan"
echo "═══════════════════════════════════════════════════════════"

# Garder les processus actifs
wait
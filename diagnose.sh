#!/bin/bash

echo "🔍 DIAGNOSTIC OtakuDB"
echo "═══════════════════════════════════════════════════════════"

echo ""
echo "1️⃣ Vérification des ports..."
echo "─────────────────────────────────────────────────────────"

if lsof -i :3001 2>/dev/null | grep -q "LISTEN"; then
  echo "✅ Port 3001 (backend) - EN ÉCOUTE"
else
  echo "❌ Port 3001 (backend) - ARRÊTÉ"
fi

if lsof -i :8080 2>/dev/null | grep -q "LISTEN"; then
  echo "✅ Port 8080 (frontend) - EN ÉCOUTE"
else
  echo "❌ Port 8080 (frontend) - ARRÊTÉ"
fi

echo ""
echo "2️⃣ Test d'accès au backend..."
echo "─────────────────────────────────────────────────────────"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/discord/login 2>/dev/null)
if [ "$STATUS" = "200" ]; then
  echo "✅ Backend répond (HTTP $STATUS)"
else
  echo "❌ Backend n'a pas répondu (HTTP $STATUS)"
fi

echo ""
echo "3️⃣ Vérification CORS..."
echo "─────────────────────────────────────────────────────────"

CORS=$(curl -s -I -H "Origin: http://localhost:8080" http://localhost:3001/api/auth/discord/login 2>/dev/null | grep "Access-Control-Allow-Origin" | awk '{print $2}')
if [ -n "$CORS" ]; then
  echo "✅ CORS accepte: $CORS"
else
  echo "⚠️  Pas d'en-tête CORS trouvé"
fi

echo ""
echo "4️⃣ Logs du backend..."
echo "─────────────────────────────────────────────────────────"
tail -5 /tmp/backend.log 2>/dev/null || echo "❌ Pas de logs"

echo ""
echo "5️⃣ Variable VITE_API_URL..."
echo "─────────────────────────────────────────────────────────"
grep "VITE_API_URL" /workspaces/otakudb/.env

echo ""
echo "✅ Diagnostic terminé"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📝 Si tout est ✅, ouvre http://localhost:8080 dans le navigateur"
echo "   Ouvre la console (F12) et clique sur Login"

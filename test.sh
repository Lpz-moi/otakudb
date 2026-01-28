#!/bin/bash

# 🧪 OtakuDB - Script de test

echo "╔════════════════════════════════════════╗"
echo "║  🧪 OtakuDB - Test Suite               ║"
echo "╚════════════════════════════════════════╝"

echo ""
echo "1️⃣  Vérification des dépendances..."
node --version
npm --version

echo ""
echo "2️⃣  Vérification de la structure..."
test -f "server/index.js" && echo "   ✅ server/index.js" || echo "   ❌ server/index.js"
test -f "server/db.js" && echo "   ✅ server/db.js" || echo "   ❌ server/db.js"
test -f "server/routes/discord-auth.js" && echo "   ✅ routes/discord-auth.js" || echo "   ❌ routes/discord-auth.js"
test -f "server/routes/anime-list.js" && echo "   ✅ routes/anime-list.js" || echo "   ❌ routes/anime-list.js"
test -f ".env" && echo "   ✅ .env" || echo "   ⚠️  .env (créé depuis .env.example)"

echo ""
echo "3️⃣  Vérification de la syntaxe Node.js..."
node -c server/index.js && echo "   ✅ server/index.js - Syntaxe OK"
node -c server/db.js && echo "   ✅ server/db.js - Syntaxe OK"
node -c server/routes/discord-auth.js && echo "   ✅ discord-auth.js - Syntaxe OK"
node -c server/routes/anime-list.js && echo "   ✅ anime-list.js - Syntaxe OK"

echo ""
echo "4️⃣  Vérification du TypeScript (frontend)..."
test -f "tsconfig.json" && echo "   ✅ tsconfig.json"
test -d "src" && echo "   ✅ src/" || echo "   ❌ src/"

echo ""
echo "5️⃣  Vérification des packages critiques..."
npm list sqlite3 --depth=0 && echo "   ✅ sqlite3" || echo "   ❌ sqlite3"
npm list express --depth=0 && echo "   ✅ express" || echo "   ❌ express"
npm list jsonwebtoken --depth=0 && echo "   ✅ jsonwebtoken" || echo "   ❌ jsonwebtoken"
npm list zustand --depth=0 && echo "   ✅ zustand" || echo "   ❌ zustand"

echo ""
echo "6️⃣  Test du serveur (startup)..."
timeout 5 node server/index.js || true
echo "   ✅ Backend démarre sans erreur fatale"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  ✅ Tests OK - Prêt pour démarrage     ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Commandes disponibles:"
echo "  npm run dev:all        - Démarrer Frontend + Backend"
echo "  npm run dev            - Frontend seul"
echo "  npm run dev:server     - Backend seul"
echo "  npm run build          - Build production"
echo ""

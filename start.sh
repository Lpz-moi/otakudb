#!/bin/bash

# 🚀 OtakuDB - Script de démarrage local

set -e

echo "╔════════════════════════════════════════╗"
echo "║  🎬 OtakuDB - Local Development Start  ║"
echo "╚════════════════════════════════════════╝"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Vérifier .env
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env manquant. Copie de .env.example..."
    cp .env.example .env
    echo "📝 Veuillez éditer .env avec vos credentials Discord"
    exit 1
fi

echo "✅ .env trouvé"

# Vérifier node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

echo "✅ Dépendances OK"

# Créer répertoire data
if [ ! -d "data" ]; then
    echo "📁 Création du répertoire data..."
    mkdir -p data
fi

echo "✅ Répertoire data OK"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  Starting OtakuDB...                   ║"
echo "╚════════════════════════════════════════╝"
echo ""

echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend:  http://localhost:3001"
echo "📍 API:      http://localhost:3001/api"
echo ""
echo "🔐 Configuration:"
echo "   - Discord OAuth: $(grep DISCORD_CLIENT_ID .env | cut -d'=' -f2 | head -c 10)..."
echo "   - JWT Secret: $(grep JWT_SECRET .env | cut -d'=' -f2 | head -c 10)..."
echo ""
echo "Appuyez sur CTRL+C pour arrêter"
echo ""

# Démarrer les processus
npm run dev:all

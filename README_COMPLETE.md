# 🎬 OtakuDB - Gestionnaire d'Anime Personnel

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![SQLite](https://img.shields.io/badge/SQLite-3+-003B57?logo=sqlite)](https://www.sqlite.org)

Une application web moderna pour gérer votre liste d'animes personnelle avec synchronisation multi-appareils via Discord OAuth2.

## ✨ Caractéristiques

- **🔐 Authentification Discord OAuth2** - Connexion sécurisée avec Discord
- **📱 Multi-appareils** - Synchronisation automatique entre navigateurs et appareils
- **🎨 Interface moderne** - UI responsive avec Tailwind CSS et shadcn/ui
- **🗄️ Base de données** - SQLite pour la persistence des données
- **⚡ Temps réel** - Synchronisation instantanée des modifications
- **📊 Statistiques** - Dashboards et statistiques personnalisées
- **🌙 Mode sombre** - Support complet du mode sombre
- **📱 PWA** - Fonctionne hors ligne

## 🚀 Démarrage rapide

### Prérequis

- Node.js 16+
- npm 8+
- Discord Developer Account

### Installation

```bash
# Cloner le repository
git clone https://github.com/Lpz-moi/otakudb.git
cd otakudb

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos credentials Discord
```

### Configuration Discord

1. Aller sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Créer une nouvelle application
3. Copier le **Client ID** et **Client Secret**
4. Ajouter les URIs de redirect:
   - Développement: `http://localhost:3001/api/auth/discord/callback`
   - Production: `https://votre-domain.com/api/auth/discord/callback`

### Lancement

```bash
# Développement (frontend + backend)
npm run dev:all

# Frontend seul (http://localhost:5173)
npm run dev

# Backend seul (http://localhost:3001)
npm run dev:server

# Build production
npm run build
```

## 📚 Documentation

- [Guide de déploiement](./DEPLOYMENT.md) - Railway, Vercel, Docker
- [Architecture API](./API.md) - Endpoints et schémas
- [Guide développeur](./DEVELOPER.md) - Contribution et développement

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────────┐
│   Frontend      │         │  Backend Express     │
│  React + Vite   ◄────────►│  SQLite Database     │
│  TypeScript     │  REST   └──────────────────────┘
│  Zustand        │  API           │
└─────────────────┘             Discord
      │                          OAuth2
      │
   localStorage
   (cache local)
```

### Base de données

**Utilisateurs:**
```sql
CREATE TABLE users (
  discord_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  avatar TEXT,
  email TEXT,
  created_at DATETIME,
  updated_at DATETIME
)
```

**Liste d'animes:**
```sql
CREATE TABLE anime_list (
  id INTEGER PRIMARY KEY,
  user_discord_id TEXT NOT NULL,
  anime_id INTEGER NOT NULL,
  anime_title TEXT NOT NULL,
  anime_image TEXT,
  status TEXT (watching/completed/planned/dropped),
  progress INTEGER,
  rating REAL (0-10),
  notes TEXT,
  is_favorite BOOLEAN,
  added_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (user_discord_id) REFERENCES users(discord_id)
)
```

## 🔌 API Endpoints

### Authentification

```
GET  /api/auth/discord/login       # Get Discord auth URL
GET  /api/auth/discord/callback    # OAuth callback
GET  /api/auth/discord/me          # Current user
POST /api/auth/discord/logout      # Logout
```

### Liste d'animes

```
GET  /api/anime                    # Get user's list
POST /api/anime                    # Add anime
PUT  /api/anime/:id                # Update anime
DELETE /api/anime/:id              # Remove anime
GET  /api/anime/stats              # User stats
```

## 📦 Stack technologique

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **Zustand** - State management
- **React Query** - Data fetching
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Framer Motion** - Animations

### Backend
- **Express.js** - Framework web
- **Node.js** - Runtime
- **SQLite3** - Database
- **JWT** - Authentication
- **Discord.js** - OAuth integration

## 🔐 Sécurité

- ✅ JWT tokens signés et validés
- ✅ Cookies httpOnly sécurisés
- ✅ CORS configuré correctement
- ✅ Protection CSRF avec state tokens
- ✅ Validation des données côté serveur
- ✅ Hash des secrets en production

## 🚀 Déploiement

### Railway (Recommandé)

```bash
# Connecter votre GitHub
# Railway détecte automatiquement le Node.js project
# Configure les variables d'environnement
# Déploie automatiquement
```

### Vercel + Railway

```bash
# Backend sur Railway (voir DEPLOYMENT.md)
# Frontend sur Vercel (CLI ou GitHub)
vercel env add VITE_API_URL https://votre-api-railway.app
```

### Docker

```bash
docker build -t otakudb .
docker run -p 3001:3001 -p 5173:5173 otakudb
```

## 📊 Monitoring

```bash
# Health check
curl http://localhost:3001/api/health

# Check auth
curl -b "session_token=..." http://localhost:3001/api/auth/discord/me
```

## 🤝 Contribution

Les contributions sont bienvenues! Pour participer:

1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est licensé sous la MIT License - voir [LICENSE](LICENSE) pour les détails.

## 📞 Support

- 📧 Email: [support@otakudb.dev](mailto:support@otakudb.dev)
- 🐛 Issues: [GitHub Issues](https://github.com/Lpz-moi/otakudb/issues)
- 💬 Discord: [Discord Server](https://discord.gg/otakudb)

## 🎯 Roadmap

- [ ] Export/Import de listes
- [ ] Recommandations personnalisées
- [ ] Notifications de nouveaux épisodes
- [ ] Partage de listes avec amis
- [ ] Mobile app native (React Native)
- [ ] Intégration MyAnimeList
- [ ] Graphiques statistiques avancés
- [ ] Commentaires et notes

---

Développé avec ❤️ par [Lpz-moi](https://github.com/Lpz-moi)

**Dernière mise à jour:** Janvier 2026

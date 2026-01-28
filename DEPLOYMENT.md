# 🚀 OtakuDB - Guide de Déploiement

## 📋 Table des matières

1. [Installation locale](#installation-locale)
2. [Configuration Discord OAuth2](#configuration-discord-oauth2)
3. [Lancement](#lancement)
4. [Déploiement Railway](#déploiement-railway)
5. [Déploiement Vercel](#déploiement-vercel)
6. [Variables d'environnement](#variables-denvironnement)
7. [Architecture et Synchronisation](#architecture-et-synchronisation)

---

## 🔧 Installation locale

### Prérequis

- Node.js 16+ (recommandé: LTS)
- npm 8+
- Git

### Installation

1. Cloner le repository
```bash
git clone https://github.com/Lpz-moi/otakudb.git
cd otakudb
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer l'environnement (voir [Configuration Discord OAuth2](#configuration-discord-oauth2))
```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

4. Lancer en développement
```bash
npm run dev:all
```

Le frontend sera accessible à `http://localhost:5173`
Le backend sera accessible à `http://localhost:3001`

---

## 🎮 Configuration Discord OAuth2

### Créer une application Discord

1. Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Cliquez sur "New Application"
3. Nommez votre application "OtakuDB"
4. Aller à "OAuth2" → "General"
5. Copyez le **Client ID** → `.env: DISCORD_CLIENT_ID`
6. Cliquez "Reset Secret" et copyez → `.env: DISCORD_CLIENT_SECRET`

### Configurer les Redirect URIs

Dans "OAuth2" → "Redirects", ajoutez:

**Développement:**
```
http://localhost:3001/api/auth/discord/callback
```

**Production (Railway):**
```
https://votre-app-railway.up.railway.app/api/auth/discord/callback
```

**Production (Vercel + Express):**
```
https://votre-backend-railway.up.railway.app/api/auth/discord/callback
```

### Configurer les scopes

Dans "OAuth2" → "URL Generator", sélectionnez:
- `identify`
- `email`

---

## ▶️ Lancement

### Développement (Frontend + Backend)
```bash
npm run dev:all
```

### Frontend seul (avec backend distant)
```bash
npm run dev
```

### Backend seul
```bash
npm run dev:server
```

### Production (Build)
```bash
npm run build
npm run preview
```

---

## 🚂 Déploiement Railway

Railway est la solution la plus simple pour déployer à la fois le frontend et le backend.

### Déploiement simplifié

1. **Connecter le repository GitHub**
   - Visitez [Railway.app](https://railway.app)
   - Login avec GitHub
   - Cliquez "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Autorisez et sélectionnez `otakudb`

2. **Railway détecte automatiquement:**
   - Node.js backend
   - Vite frontend

3. **Ajouter les variables d'environnement**
   - Allez dans "Variables"
   - Ajoutez:
     ```
     NODE_ENV=production
     DISCORD_CLIENT_ID=your-id
     DISCORD_CLIENT_SECRET=your-secret
     JWT_SECRET=votre-clé-super-secrète
     FRONTEND_URL=https://votre-app.up.railway.app
     DATABASE_URL=./data/otakudb.db (SQLite local)
     VITE_API_URL=https://votre-app.up.railway.app
     ```

4. **Déployer**
   - Railway détecte le `package.json` et crée un déploiement
   - C'est automatique! 🎉

### Configuration railway.json (optionnel)

Créez un `railway.json` à la racine:

```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm run build && npm run dev:server"
  }
}
```

---

## ✨ Déploiement Vercel

**Option 1: Vercel pour le frontend + Railway pour le backend**

### Déployer le backend sur Railway (voir section ci-dessus)

### Déployer le frontend sur Vercel

1. Déployez automatiquement:
```bash
vercel
```

2. Ou via GitHub:
   - Visitez [Vercel](https://vercel.com)
   - Importez le repository GitHub
   - Dans "Settings" → "Environment Variables":
     ```
     VITE_API_URL=https://votre-backend-railway.up.railway.app
     ```

3. Vercel déploie automatiquement à chaque push sur `main`

---

## 📋 Variables d'environnement

### Backend (.env)

```env
# Environnement
NODE_ENV=development                 # development ou production
PORT=3001                            # Port du backend

# Frontend
FRONTEND_URL=http://localhost:5173   # URL du frontend

# Discord OAuth2
DISCORD_CLIENT_ID=...                # Obtenir du Discord Developer Portal
DISCORD_CLIENT_SECRET=...            # Sécurisé!
DISCORD_REDIRECT_URI=...             # OAuth callback URL

# Sécurité
JWT_SECRET=...                       # Générer: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Base de données
DATABASE_URL=./data/otakudb.db       # SQLite local

# Frontend (utilisé lors du build Vite)
VITE_API_URL=http://localhost:3001   # API URL
```

### Générer une JWT_SECRET sécurisée

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🏗️ Architecture et Synchronisation

### Synchronisation Multi-Appareils

L'application utilise une synchronisation robuste:

1. **Au premier login:**
   - Créer un utilisateur Discord en DB
   - Récupérer la liste vide ou existante

2. **À chaque action (ajouter/modifier/supprimer):**
   - Action locale immédiate (optimistic update)
   - Envoi au backend
   - Synchronisation avec la DB

3. **Au changement de navigateur/appareil:**
   - Nouvelle authentification Discord
   - Rechargement de la liste depuis le backend
   - Les données sont toujours à jour!

### Base de données

**Utilisateurs:**
```sql
- discord_id (PK)
- username
- avatar
- email
- created_at
- updated_at
```

**Liste d'animes:**
```sql
- id (PK)
- user_discord_id (FK)
- anime_id (unique par user)
- anime_title
- anime_image
- status (watching/completed/planned/dropped)
- progress
- rating (0-10)
- notes
- is_favorite
- added_at
- updated_at
```

### Structure des requêtes API

```
POST   /api/auth/discord/login      → Get auth URL
GET    /api/auth/discord/callback   → OAuth callback
GET    /api/auth/discord/me         → Current user
POST   /api/auth/discord/logout     → Logout

GET    /api/anime                   → Get user's anime list
POST   /api/anime                   → Add anime
PUT    /api/anime/:id               → Update anime
DELETE /api/anime/:id               → Remove anime
GET    /api/anime/stats             → Get stats
```

---

## 🐛 Dépannage

### "Port already in use"
```bash
npm run kill:port  # Windows
# ou
lsof -i :3001 && kill -9 <PID>  # Mac/Linux
```

### "Discord callback error"
- Vérifier DISCORD_CLIENT_ID et DISCORD_CLIENT_SECRET
- Vérifier DISCORD_REDIRECT_URI dans Discord Developer Portal
- Vérifier FRONTEND_URL

### "Database error"
- Vérifier les permissions du dossier `./data`
- Supprimer `./data/otakudb.db` et relancer (recréera le schéma)

### "CORS error"
- Vérifier FRONTEND_URL dans le backend .env
- Vérifier que le backend accepte les credentials

---

## 📊 Monitoring

### Health check
```bash
curl http://localhost:3001/api/health
```

### Logs du backend
Activer les logs détaillés avec `console.log` au démarrage

---

## 🔒 Sécurité Production

1. **JWT_SECRET**: Générer une clé cryptographiquement sécurisée
2. **CORS**: Configurer l'origine exacte du frontend
3. **HTTPS**: Utiliser en production (Railway/Vercel le font automatiquement)
4. **Cookies**: HttpOnly + Secure + SameSite en production
5. **Credentials**: Ne jamais committer les secrets dans Git

---

## 📞 Support

Pour plus d'informations:
- [Discord Developer Portal](https://discord.com/developers)
- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Express.js Guide](https://expressjs.com)

---

**Déployé avec ❤️ par OtakuDB**

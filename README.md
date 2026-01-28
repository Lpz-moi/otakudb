# OtakuDB - Application de Gestion d'Anime

Application web moderne pour suivre, découvrir et gérer vos animes préférés avec authentification Discord OAuth et stockage cloud sur Discord.

## 🚀 Fonctionnalités

### Authentification & Stockage
- ✅ **Authentification Discord OAuth2** complète
- ✅ **Stockage cloud sur Discord** (serveurs Discord comme base de données)
- ✅ **Synchronisation multi-appareils** automatique
- ✅ **Sessions sécurisées** avec JWT tokens

### Découverte & Recommandations
- ✅ **Système de découverte** avec swipe cards
- ✅ **Recommandations intelligentes** basées sur vos favoris
- ✅ **Tri fonctionnel** (popularité, note, date, alphabétique, épisodes)
- ✅ **Filtres avancés** (genres, année, statut, épisodes)
- ✅ **Pagination dynamique** pour varier les résultats
- ✅ **Seed quotidien** pour éviter les mêmes résultats

### Gestion des Listes
- ✅ **Listes personnalisées** (En cours, À voir, Terminés, Favoris)
- ✅ **Suivi de progression** par épisode
- ✅ **Système de notes** (1-5 étoiles)
- ✅ **Tags et notes personnelles**

### Recherche
- ✅ **Recherche instantanée** avec debounce
- ✅ **Suggestions automatiques**
- ✅ **Historique de recherche** (stocké sur Discord)
- ✅ **Filtres de recherche** avancés

### Préférences
- ✅ **Version préférée** (VF/VOSTFR/Tout)
- ✅ **Profil utilisateur** avec avatar Discord
- ✅ **Statistiques détaillées**
- ✅ **Thème personnalisable** (dark/light)

### Notifications (À venir)
- 🔄 Notifications push desktop
- 🔄 Notifications mobile (PWA)
- 🔄 Centre de notifications in-app

## 📋 Prérequis

- Node.js 18+ et npm
- Un compte Discord Developer (pour OAuth)
- (Optionnel) Un serveur Discord pour le stockage

## 🛠️ Installation

### 1. Cloner le projet

```bash
git clone <votre-repo>
cd otakudb
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer Discord OAuth

Suivez le guide complet dans [DISCORD_SETUP.md](./DISCORD_SETUP.md) pour :
- Créer une application Discord
- Configurer OAuth2
- Obtenir les credentials nécessaires

### 4. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Discord OAuth Configuration
DISCORD_CLIENT_ID=votre_client_id
DISCORD_CLIENT_SECRET=votre_client_secret
DISCORD_REDIRECT_URI=http://localhost:3001/api/auth/discord/callback

# Optionnel - Si vous utilisez un serveur Discord
DISCORD_SERVER_ID=votre_server_id
DISCORD_BOT_TOKEN=votre_bot_token

# JWT Secret (changez en production)
JWT_SECRET=votre-super-secret-jwt-key-change-in-production

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:8080

# API URL (pour le frontend)
VITE_API_URL=http://localhost:3001
```

### 5. Démarrer l'application

#### Développement

```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev
```

Ou utilisez `concurrently` pour démarrer les deux en même temps :

```bash
npm run dev:all
```

#### Production

```bash
# Build
npm run build

# Démarrer le serveur
npm run dev:server
```

## 📁 Structure du Projet

```
otakudb/
├── server/                 # Backend Express
│   ├── index.js           # Point d'entrée du serveur
│   └── routes/            # Routes API
│       ├── discord-auth.js # Authentification Discord
│       └── discord-data.js # Stockage Discord
├── src/
│   ├── components/         # Composants React
│   │   ├── anime/         # Composants anime
│   │   ├── layout/        # Layout (Header, Sidebar, etc.)
│   │   ├── search/        # Composants de recherche
│   │   └── ui/            # Composants UI (shadcn/ui)
│   ├── pages/             # Pages de l'application
│   ├── services/          # Services API
│   │   ├── discordAuth.ts      # Service auth Discord
│   │   ├── discordStorage.ts   # Service stockage Discord
│   │   └── jikanApi.ts         # API Jikan (MyAnimeList)
│   ├── stores/            # Stores Zustand
│   │   ├── authStore.ts         # Store authentification
│   │   ├── animeListStore.ts    # Store liste anime (localStorage)
│   │   └── animeListStoreDiscord.ts # Store liste anime (Discord)
│   └── App.tsx            # Composant principal
├── .env.example           # Exemple de variables d'environnement
├── DISCORD_SETUP.md       # Guide de configuration Discord
└── README.md              # Ce fichier
```

## 🔧 Technologies Utilisées

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - Composants UI
- **Zustand** - State management
- **React Router** - Routing
- **Framer Motion** - Animations
- **TanStack Query** - Data fetching

### Backend
- **Express** - Framework Node.js
- **JWT** - Authentification
- **Discord OAuth2** - Authentification Discord
- **Discord API** - Stockage des données

### APIs Externes
- **Jikan API** - Données anime (MyAnimeList non-officiel)
- **Discord API** - Authentification et stockage

## 📖 Guide d'Utilisation

### Connexion

1. Cliquez sur "Se connecter avec Discord" dans le header ou la sidebar
2. Autorisez l'application sur Discord
3. Vous serez redirigé vers l'application connecté

### Découvrir des Animes

1. Allez sur la page **Découvrir**
2. Utilisez les boutons de tri pour changer l'ordre
3. Ouvrez les filtres pour affiner vos recherches
4. Swipez ou cliquez sur les boutons pour ajouter/passer

### Gérer vos Listes

1. Allez sur **Mes Listes**
2. Utilisez les onglets pour naviguer entre les différentes listes
3. Cliquez sur un anime pour voir les détails
4. Modifiez la progression et les notes depuis la page de détails

### Rechercher

1. Allez sur **Recherche**
2. Tapez le nom d'un anime
3. Utilisez les filtres pour affiner les résultats
4. Cliquez sur un anime pour voir les détails

## 🏗️ Architecture Discord

Les données sont stockées sur Discord via l'API Discord :

- **Channels par type** : Chaque type de donnée a son propre channel
- **Messages embeds** : Les données sont stockées dans des embeds JSON
- **Message IDs** : Utilisés comme identifiants uniques
- **Batch operations** : Optimisation des requêtes multiples

Voir [DISCORD_SETUP.md](./DISCORD_SETUP.md) pour plus de détails.

## 🔒 Sécurité

- ✅ Tokens Discord stockés de manière sécurisée (httpOnly cookies)
- ✅ JWT pour les sessions
- ✅ Refresh automatique des tokens
- ✅ CORS configuré
- ✅ Rate limiting géré automatiquement
- ✅ Validation des inputs

## 🐛 Dépannage

### L'authentification ne fonctionne pas

1. Vérifiez que les variables d'environnement sont correctes
2. Vérifiez que l'URL de callback correspond exactement dans Discord Developer Portal
3. Vérifiez les logs du serveur pour les erreurs

### Les données ne se synchronisent pas

1. Vérifiez que vous êtes connecté
2. Vérifiez que les tokens Discord sont valides
3. Vérifiez les logs du serveur
4. Vérifiez les permissions du bot (si vous utilisez un serveur)

### Erreur "Rate Limited"

L'application gère automatiquement le rate limiting. Si vous voyez cette erreur :
- Attendez quelques secondes
- Réduisez la fréquence des requêtes
- Vérifiez que le cache fonctionne correctement

## 📝 TODO / Améliorations Futures

- [ ] Notifications push complètes (desktop + mobile)
- [ ] PWA complète avec service worker
- [ ] Import depuis MyAnimeList/AniList
- [ ] Partage social des listes
- [ ] Graphiques de statistiques avancés
- [ ] Mode offline amélioré
- [ ] Tests unitaires et E2E
- [ ] Documentation API complète

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Ouvrir une issue pour signaler un bug
- Proposer une nouvelle fonctionnalité
- Soumettre une pull request

## 📄 Licence

Ce projet est sous licence MIT.

## 🙏 Remerciements

- **Jikan API** pour les données anime
- **Discord** pour l'infrastructure OAuth et stockage
- **shadcn/ui** pour les composants UI
- **Tous les contributeurs** de ce projet

## 📞 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez [DISCORD_SETUP.md](./DISCORD_SETUP.md) pour la configuration
- Vérifiez les logs du serveur pour les erreurs

---

**Fait avec ❤️ pour la communauté anime**

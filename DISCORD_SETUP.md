# Guide de Configuration Discord OAuth

Ce guide vous explique comment configurer l'authentification Discord OAuth et le stockage des données sur Discord pour OtakuDB.

## 1. Créer une Application Discord

1. Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Cliquez sur **"New Application"**
3. Donnez un nom à votre application (ex: "OtakuDB")
4. Cliquez sur **"Create"**

## 2. Configurer OAuth2

1. Dans le menu de gauche, allez dans **"OAuth2"**
2. Dans la section **"Redirects"**, ajoutez l'URL de callback :
   - Développement : `http://localhost:3001/api/auth/discord/callback`
   - Production : `https://votre-domaine.com/api/auth/discord/callback`
3. Notez votre **Client ID** et **Client Secret** (cliquez sur "Reset Secret" si nécessaire)

## 3. Configurer les Scopes

Les scopes nécessaires sont :
- `identify` : Pour obtenir le username et l'avatar
- `email` : Pour obtenir l'email de l'utilisateur
- `guilds` : Pour accéder aux informations des serveurs (optionnel)

## 4. Créer un Bot Discord (Optionnel - pour serveur dédié)

Si vous voulez utiliser un serveur Discord pour stocker les données :

1. Allez dans **"Bot"** dans le menu de gauche
2. Cliquez sur **"Add Bot"**
3. Notez le **Bot Token**
4. Activez les **Privileged Gateway Intents** si nécessaire :
   - **Server Members Intent** (pour voir les membres)
   - **Message Content Intent** (pour lire les messages)

## 5. Créer un Serveur Discord (Optionnel)

1. Créez un nouveau serveur Discord
2. Invitez votre bot avec les permissions suivantes :
   - **Manage Channels** : Pour créer des channels par utilisateur
   - **Send Messages** : Pour envoyer des messages
   - **Read Message History** : Pour lire les messages
   - **Manage Messages** : Pour modifier/supprimer les messages
3. Notez l'ID du serveur (activez le mode développeur dans Discord > Paramètres > Avancé)

## 6. Configuration des Variables d'Environnement

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

## 7. Alternative : Utiliser des Direct Messages (DMs)

Si vous ne voulez pas créer un serveur Discord, l'application peut utiliser des Direct Messages avec l'utilisateur. Dans ce cas :

- Laissez `DISCORD_SERVER_ID` et `DISCORD_BOT_TOKEN` vides
- L'application utilisera automatiquement les DMs

## 8. Structure des Données sur Discord

Les données sont stockées sous forme de messages embeds dans Discord :

- **Channel #user-profile** : Profil utilisateur
- **Channel #anime-favorites** : Liste des favoris (1 message = 1 anime)
- **Channel #anime-lists** : Listes personnalisées
- **Channel #preferences** : Préférences utilisateur
- **Channel #history** : Historique de visionnage
- **Channel #notifications** : Notifications

Chaque message contient un embed avec les données JSON dans la description.

## 9. Limitations de l'API Discord

- **Rate Limiting** : 50 requêtes/seconde par utilisateur
- **Taille des messages** : Maximum 2000 caractères (embeds : 6000 caractères)
- **Pagination** : Maximum 100 messages par requête

L'application gère automatiquement :
- Le rate limiting avec une queue
- La pagination des messages
- Le batch processing pour optimiser les requêtes

## 10. Sécurité

⚠️ **Important** :
- Ne commitez JAMAIS votre `.env` dans Git
- Utilisez un JWT_SECRET fort en production
- Activez HTTPS en production
- Configurez CORS correctement pour votre domaine

## 11. Test de l'Authentification

1. Démarrez le serveur backend : `npm run dev:server`
2. Démarrez le frontend : `npm run dev`
3. Cliquez sur "Se connecter avec Discord"
4. Autorisez l'application
5. Vous devriez être redirigé vers `/auth/success`

## 12. Dépannage

### Erreur "Invalid redirect URI"
- Vérifiez que l'URL dans `.env` correspond exactement à celle dans Discord Developer Portal
- Les URLs doivent correspondre caractère par caractère

### Erreur "Missing Access"
- Vérifiez que les scopes sont correctement configurés
- Vérifiez que l'utilisateur a autorisé l'application

### Erreur "Rate Limited"
- L'application gère automatiquement le rate limiting
- Si vous voyez cette erreur, attendez quelques secondes

### Les données ne se synchronisent pas
- Vérifiez que les tokens Discord sont valides
- Vérifiez les logs du serveur pour les erreurs
- Vérifiez que le bot a les bonnes permissions (si vous utilisez un serveur)

## Support

Pour plus d'aide, consultez :
- [Discord API Documentation](https://discord.com/developers/docs)
- [OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)

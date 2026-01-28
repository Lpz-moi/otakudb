# Guide de Lancement Local

## Étape 1 : Installer les dépendances

```bash
npm install
```

## Étape 2 : Configurer Discord OAuth (Optionnel pour tester)

Si vous voulez tester l'authentification Discord, suivez [DISCORD_SETUP.md](./DISCORD_SETUP.md) pour :
1. Créer une application Discord
2. Obtenir votre Client ID et Client Secret
3. Configurer le fichier `.env`

**Note** : L'application fonctionne aussi sans Discord OAuth pour tester les autres fonctionnalités.

## Étape 3 : Lancer l'application

### Option A : Lancer séparément (Recommandé pour le développement)

**Terminal 1 - Backend :**
```bash
npm run dev:server
```
Le serveur backend sera disponible sur `http://localhost:3001`

**Terminal 2 - Frontend :**
```bash
npm run dev
```
Le frontend sera disponible sur `http://localhost:8080`

### Option B : Lancer avec concurrently (si installé)

```bash
npm run dev:all
```

## Étape 4 : Accéder à l'application

Ouvrez votre navigateur et allez sur : **http://localhost:8080**

## Dépannage

### Erreur "Cannot find module"
- Vérifiez que `npm install` s'est terminé correctement
- Supprimez `node_modules` et `package-lock.json`, puis réinstallez :
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### Erreur "Port already in use"
- Le port 3001 (backend) ou 8080 (frontend) est déjà utilisé
- Changez le port dans `.env` ou arrêtez l'autre application

### Erreur Discord OAuth
- Vérifiez que votre `.env` contient les bonnes valeurs
- Vérifiez que l'URL de callback dans Discord Developer Portal correspond exactement à celle dans `.env`
- Consultez [DISCORD_SETUP.md](./DISCORD_SETUP.md) pour plus d'aide

### Le frontend ne peut pas se connecter au backend
- Vérifiez que le backend est bien lancé sur le port 3001
- Vérifiez que `VITE_API_URL` dans `.env` correspond au port du backend
- Vérifiez les logs du backend pour les erreurs CORS

## Commandes Utiles

```bash
# Installer les dépendances
npm install

# Lancer le backend uniquement
npm run dev:server

# Lancer le frontend uniquement
npm run dev

# Build pour production
npm run build

# Lancer les tests
npm test
```

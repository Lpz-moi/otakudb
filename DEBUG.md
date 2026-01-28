# Guide de Débogage

## Problème : Page Noire

Si vous voyez une page noire, voici les étapes de débogage :

### 1. Vérifier la Console du Navigateur

Ouvrez la console (F12) et vérifiez les erreurs :
- Erreurs JavaScript rouges
- Erreurs de réseau (CORS, 404, etc.)
- Erreurs de modules manquants

### 2. Vérifier que les Serveurs sont Lancés

**Backend (port 3001) :**
```bash
npm run dev:server
```
Vérifiez que vous voyez : `🚀 Server running on port 3001`

**Frontend (port 8080) :**
```bash
npm run dev
```
Vérifiez que vous voyez : `Local: http://localhost:8080`

### 3. Vérifier les Erreurs Communes

#### Erreur "Cannot find module"
- Les dépendances ne sont pas installées
- Solution : `npm install`

#### Erreur CORS
- Le backend n'est pas lancé ou mal configuré
- Vérifiez que `FRONTEND_URL` dans `.env` correspond à `http://localhost:8080`

#### Erreur "Failed to fetch"
- Le backend n'est pas accessible
- Vérifiez que le backend est lancé sur le port 3001
- Vérifiez que `VITE_API_URL` dans `.env` est `http://localhost:3001`

### 4. Vérifier les Imports

Si vous voyez des erreurs d'import :
- Vérifiez que tous les fichiers existent
- Vérifiez que les chemins sont corrects
- Vérifiez que les composants UI sont bien installés

### 5. Mode Développement

Pour voir plus d'erreurs :
1. Ouvrez la console (F12)
2. Allez dans l'onglet "Console"
3. Regardez les erreurs en rouge
4. Cliquez sur les erreurs pour voir plus de détails

### 6. Réinitialiser

Si rien ne fonctionne :
```bash
# Arrêter tous les serveurs (Ctrl+C)

# Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install

# Relancer
npm run dev:server  # Terminal 1
npm run dev         # Terminal 2
```

### 7. Vérifier le Fichier .env

Assurez-vous que le fichier `.env` existe et contient :
```env
PORT=3001
FRONTEND_URL=http://localhost:8080
VITE_API_URL=http://localhost:3001
```

### 8. Erreurs Spécifiques

#### "ErrorBoundary" s'affiche
- Une erreur React s'est produite
- Regardez les détails dans l'interface
- Vérifiez la console pour plus d'informations

#### Page blanche/noire sans erreur
- Vérifiez que `index.html` charge bien `main.tsx`
- Vérifiez que `main.tsx` importe bien `App.tsx`
- Vérifiez que le CSS est bien chargé

#### Erreurs de build Vite
- Vérifiez que tous les imports sont corrects
- Vérifiez que TypeScript compile sans erreur
- Regardez les erreurs dans le terminal où `npm run dev` est lancé

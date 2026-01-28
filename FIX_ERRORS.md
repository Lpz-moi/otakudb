# Guide de Correction des Erreurs

## Problèmes Identifiés

1. **Cache Vite corrompu** - Les dépendances ne sont pas trouvées
2. **Source map corrompue** dans lucide-react
3. **Dépendances non optimisées**

## Solution Rapide

### Étape 1 : Nettoyer le cache Vite

```bash
# Supprimer le cache Vite
Remove-Item -Recurse -Force node_modules\.vite
```

### Étape 2 : Réinstaller les dépendances (si nécessaire)

```bash
# Supprimer node_modules et réinstaller
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
```

### Étape 3 : Redémarrer les serveurs

**Arrêter tous les serveurs** (Ctrl+C dans chaque terminal)

**Puis relancer :**
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend  
npm run dev
```

## Si ça ne fonctionne toujours pas

### Option A : Réinstaller complètement

```bash
# Arrêter tous les serveurs
# Supprimer tout
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

# Réinstaller
npm install

# Relancer
npm run dev:server  # Terminal 1
npm run dev         # Terminal 2
```

### Option B : Vérifier les versions Node.js

Assurez-vous d'utiliser Node.js 18+ :
```bash
node --version
```

Si vous avez une version plus ancienne, mettez à jour Node.js.

### Option C : Utiliser npm au lieu de yarn

Si vous utilisez yarn, essayez avec npm :
```bash
npm install
npm run dev
```

## Erreurs Spécifiques

### "The file does not exist at node_modules/.vite/deps/..."
- **Cause** : Cache Vite corrompu
- **Solution** : Supprimer `node_modules/.vite` et redémarrer

### "Unexpected end of file in source map"
- **Cause** : Source map corrompue dans une dépendance
- **Solution** : Réinstaller les dépendances ou ignorer (déjà configuré dans vite.config.ts)

### Page noire sans erreur visible
- **Cause** : JavaScript ne se charge pas
- **Solution** : 
  1. Ouvrir la console (F12)
  2. Vérifier l'onglet "Console" pour les erreurs
  3. Vérifier l'onglet "Network" pour les fichiers qui ne se chargent pas

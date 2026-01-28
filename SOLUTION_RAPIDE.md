# 🚨 Solution Rapide - Port Déjà Utilisé

## Problème : `EADDRINUSE: address already in use :::3001`

Le port 3001 est déjà utilisé par un autre processus (probablement une ancienne instance du serveur).

## Solution Immédiate

### Option 1 : Utiliser le script automatique (Recommandé)

```powershell
npm run kill:port
```

Puis relancez :
```powershell
npm run dev:server
```

### Option 2 : Tuer le processus manuellement

**Étape 1 : Trouver le processus**
```powershell
netstat -ano | findstr :3001
```

Vous verrez quelque chose comme :
```
TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    12345
```

**Étape 2 : Tuer le processus**
Remplacez `12345` par le PID que vous avez trouvé :
```powershell
taskkill /PID 12345 /F
```

**Étape 3 : Relancer le serveur**
```powershell
npm run dev:server
```

### Option 3 : Changer le port

Si vous ne pouvez pas tuer le processus, changez le port dans `.env` :

```env
PORT=3002
```

Et dans `.env` aussi :
```env
VITE_API_URL=http://localhost:3002
```

Puis relancez le serveur.

## Vérification

Après avoir libéré le port, vous devriez voir :
```
🚀 Server running on port 3001
```

## Si le problème persiste

1. **Vérifiez tous les terminaux** - Il peut y avoir un serveur qui tourne en arrière-plan
2. **Redémarrez votre IDE** - Parfois les processus restent actifs
3. **Redémarrez votre ordinateur** - Solution ultime si rien ne fonctionne

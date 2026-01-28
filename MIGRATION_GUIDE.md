# 🔄 Migration Guide - Synchronisation Backend

Ce guide explique comment migrer du stockage local (`useAnimeListStore`) à la synchronisation backend (`useAnimeListDiscordStore`).

## 📋 Vue d'ensemble des changements

### Avant (Local Storage)
```typescript
import { useAnimeListStore } from '@/stores/animeListStore';

const { addToList, removeFromList, updateStatus } = useAnimeListStore();

// Pas de synchronisation avec backend
```

### Après (Backend Sync)
```typescript
import { useAnimeListDiscordStore } from '@/stores/animeListStoreDiscord';

const { addToList, removeFromList, updateStatus, syncFromBackend } = useAnimeListDiscordStore();

// Utilisateur doit être authentifié
// Automatique sync avec le backend
```

## 🔧 Étapes de migration

### 1. Mettre à jour App.tsx

```typescript
import { useAnimeListDiscordStore } from "@/stores/animeListStoreDiscord";

const App = () => {
  const { isAuthenticated } = useAuthStore();
  const { syncFromBackend } = useAnimeListDiscordStore();

  // Quand l'utilisateur se connecte, charger la liste
  useEffect(() => {
    if (isAuthenticated) {
      syncFromBackend();
    }
  }, [isAuthenticated, syncFromBackend]);

  return (/* ... */);
};
```

### 2. Utiliser le nouveau store dans les composants

**Avant:**
```tsx
import { useAnimeListStore } from '@/stores/animeListStore';

export const HomePage = () => {
  const { getItemsByStatus, getStats } = useAnimeListStore();
  
  return /* ... */;
};
```

**Après:**
```tsx
import { useAnimeListDiscordStore } from '@/stores/animeListStoreDiscord';

export const HomePage = () => {
  const { getItemsByStatus, getStats, isSyncing, error } = useAnimeListDiscordStore();
  
  if (isSyncing) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorMessage error={error} />;
  }
  
  return /* ... */;
};
```

### 3. Mettre à jour les opérations CRUD

**Ajouter un anime:**
```tsx
// Avant
animeListStore.addToList(anime, 'watching');

// Après
await animeListDiscordStore.addToList(anime, 'watching');
```

**Supprimer un anime:**
```tsx
// Avant
animeListStore.removeFromList(animeId);

// Après
await animeListDiscordStore.removeFromList(animeId);
```

**Mettre à jour un anime:**
```tsx
// Avant
animeListStore.updateStatus(animeId, 'completed');

// Après
await animeListDiscordStore.updateStatus(animeId, 'completed');
```

## 🔄 Fluxes de données

### Authentification → Synchronisation

```
User logs in
    ↓
checkAuth() called
    ↓
isAuthenticated = true
    ↓
useEffect() triggered
    ↓
syncFromBackend() called
    ↓
GET /api/anime
    ↓
Items loaded into store
    ↓
UI re-renders with data
```

### Modification → Sync → Backend

```
User adds anime
    ↓
updateItem() called
    ↓
PUT /api/anime/:id
    ↓
Backend updates DB
    ↓
Response received
    ↓
Store updated locally
    ↓
UI re-renders
```

## ✅ Checklist de migration

- [ ] Mettre à jour App.tsx pour initialiser la sync
- [ ] Remplacer tous les `useAnimeListStore` par `useAnimeListDiscordStore`
- [ ] Mettre à jour les appels CRUD pour être async/await
- [ ] Ajouter la gestion d'erreurs
- [ ] Tester que la sync fonctionne au login
- [ ] Tester que les modifications se synchronisent
- [ ] Tester le changement de navigateur/device
- [ ] Garder le localStorage comme fallback hors ligne

## 🔐 Authentification requise

**Important:** Tous les endpoints `/api/anime` requièrent l'authentification!

Le middleware vérifie:
- Présence du cookie `session_token`
- Validité du JWT
- Extraction du `discord_id`

```javascript
// Middleware du backend
const authenticate = async (req, res, next) => {
  const sessionToken = req.cookies.session_token;
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const decoded = jwt.verify(sessionToken, JWT_SECRET);
    req.userId = decoded.discord_id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

## 🌐 Fallback hors ligne

Le store utilise `zustand/persist` pour sauvegarder les données en localStorage:

```typescript
// Quand offline, le store utilise le cache local
// Quand online, il sync avec le backend
```

## 📊 Éxemples complets

### HomePage.tsx (mis à jour)

```tsx
import { useAnimeListDiscordStore } from '@/stores/animeListStoreDiscord';
import { useAuthStore } from '@/stores/authStore';

export const HomePage = () => {
  const { isAuthenticated } = useAuthStore();
  const { 
    getItemsByStatus, 
    getStats, 
    isSyncing, 
    error,
    syncFromBackend 
  } = useAnimeListDiscordStore();

  const watchingList = getItemsByStatus('watching');
  const stats = getStats();

  // Reload si pas de sync
  useEffect(() => {
    if (isAuthenticated && !isSyncing && error) {
      syncFromBackend();
    }
  }, [isAuthenticated, isSyncing, error, syncFromBackend]);

  if (isSyncing && watchingList.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      <StatsCard stats={stats} />
      <AnimeGrid animes={watchingList} />
    </div>
  );
};
```

### AnimeDetailPage.tsx (mis à jour)

```tsx
export const AnimeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const animeId = Number(id);
  
  const { isInList, getItemById, addToList, removeFromList } = useAnimeListDiscordStore();
  const { isAuthenticated } = useAuthStore();

  const handleAddToList = async () => {
    if (!isAuthenticated) {
      return showLoginPrompt();
    }

    try {
      await addToList(anime, 'planned');
      showToast('Anime ajouté à la liste');
    } catch (error) {
      showToast('Erreur lors de l\'ajout', 'error');
    }
  };

  return (
    <div>
      <AnimeHeader anime={anime} />
      {isInList(animeId) ? (
        <RemoveButton onClick={() => removeFromList(animeId)} />
      ) : (
        <AddButton onClick={handleAddToList} disabled={!isAuthenticated} />
      )}
    </div>
  );
};
```

## 🐛 Dépannage

### "Not authenticated" error
- Vérifier que l'utilisateur est loggé
- Vérifier que le cookie `session_token` est présent
- Vérifier que le token n'a pas expiré

### "Sync failed" error
- Vérifier la connexion réseau
- Vérifier que le backend tourne sur http://localhost:3001
- Vérifier les logs du navigateur (console)
- Vérifier les logs du backend

### Données manquantes après refresh
- Le localStorage est gardé comme fallback
- Faire une sync manuelle: `await syncFromBackend()`
- Vérifier que la DB backend n'a pas perdu les données

## 📚 Références

- [Zustand Persistence](https://github.com/pmndrs/zustand#persisting-store-state)
- [Service Worker Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

**Support:** Pour toute question, ouvrir une issue sur GitHub

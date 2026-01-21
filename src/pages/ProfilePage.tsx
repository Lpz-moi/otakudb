import { useState } from 'react';
import { User, Settings, Info, Download, Upload, Trash2, Edit2, Check, X } from 'lucide-react';
import { useAnimeListStore } from '@/stores/animeListStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { getStats } = useAnimeListStore();
  const stats = getStats();
  
  const { 
    profile, 
    createProfile, 
    updateProfile, 
    deleteProfile,
    versionPreference,
    setVersionPreference,
    exportData,
    importData,
    reminders,
    watchedEpisodes
  } = useUserPreferencesStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.username || '');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  const handleCreateProfile = () => {
    if (!newUsername.trim()) {
      toast.error('Veuillez entrer un pseudo');
      return;
    }
    createProfile(newUsername.trim());
    setNewUsername('');
    setShowCreateForm(false);
    toast.success('Compte créé avec succès !');
  };

  const handleUpdateName = () => {
    if (!editName.trim()) {
      toast.error('Le pseudo ne peut pas être vide');
      return;
    }
    updateProfile({ username: editName.trim() });
    setIsEditing(false);
    toast.success('Pseudo mis à jour');
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `otakudb-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Données exportées');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (importData(content)) {
          toast.success('Données importées avec succès');
        } else {
          toast.error('Erreur lors de l\'import');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleDeleteProfile = () => {
    if (confirm('Êtes-vous sûr ? Toutes vos préférences et rappels seront supprimés.')) {
      deleteProfile();
      toast.success('Compte supprimé');
    }
  };

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <User className="w-6 h-6 text-primary" />
        <h1 className="text-xl sm:text-2xl font-display font-bold">Mon Profil</h1>
      </div>

      {/* Profile Card */}
      {!profile && !showCreateForm ? (
        <div className="glass-card p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Créer un compte local</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Vos données sont stockées uniquement sur cet appareil.
            Aucune connexion internet requise.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            Créer mon compte
          </button>
        </div>
      ) : showCreateForm ? (
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Nouveau compte</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Pseudo</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Votre pseudo"
                className="input-search"
                maxLength={20}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreateProfile} className="btn-primary flex-1">
                Créer
              </button>
              <button 
                onClick={() => setShowCreateForm(false)} 
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-bold text-primary">
                {profile?.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-secondary rounded-lg px-3 py-1.5 text-foreground text-lg font-bold w-full"
                    maxLength={20}
                    autoFocus
                  />
                  <button onClick={handleUpdateName} className="p-2 text-rating-green">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => setIsEditing(false)} className="p-2 text-muted-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground truncate">{profile?.username}</h2>
                  <button 
                    onClick={() => { setEditName(profile?.username || ''); setIsEditing(true); }}
                    className="p-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Membre depuis {new Date(profile?.createdAt || '').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-border">
            <div className="text-center p-3 rounded-xl bg-secondary/50">
              <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Animes</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/50">
              <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalEpisodes}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Épisodes</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/50">
              <p className="text-xl sm:text-2xl font-bold text-foreground">{reminders.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Rappels</p>
            </div>
          </div>
        </div>
      )}

      {/* Preferences */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Préférences
        </h3>
        
        {/* Version preference */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Version préférée</p>
              <p className="text-xs text-muted-foreground">Filtrer le calendrier par défaut</p>
            </div>
            <div className="flex gap-1 bg-secondary/50 rounded-lg p-0.5">
              {(['all', 'vf', 'vostfr'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVersionPreference(v)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    versionPreference === v
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {v === 'all' ? 'Tout' : v.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Données
        </h3>
        
        <button 
          onClick={handleExport}
          className="w-full glass-card p-4 flex items-center gap-4 hover:bg-card-hover transition-colors active:scale-[0.99]"
        >
          <div className="w-10 h-10 rounded-xl bg-rating-green/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-rating-green" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground">Exporter mes données</p>
            <p className="text-xs text-muted-foreground">Sauvegarder en fichier JSON</p>
          </div>
        </button>

        <button 
          onClick={handleImport}
          className="w-full glass-card p-4 flex items-center gap-4 hover:bg-card-hover transition-colors active:scale-[0.99]"
        >
          <div className="w-10 h-10 rounded-xl bg-status-watching/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-status-watching" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground">Importer des données</p>
            <p className="text-xs text-muted-foreground">Restaurer depuis un fichier</p>
          </div>
        </button>

        {profile && (
          <button 
            onClick={handleDeleteProfile}
            className="w-full glass-card p-4 flex items-center gap-4 hover:bg-destructive/10 transition-colors active:scale-[0.99]"
          >
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-destructive">Supprimer mon compte</p>
              <p className="text-xs text-muted-foreground">Efface toutes les préférences</p>
            </div>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
            <p>Données fournies par Jikan API (MyAnimeList non-officiel)</p>
            <p>Toutes vos données sont stockées localement sur cet appareil.</p>
            <p className="text-[10px] sm:text-xs opacity-70">Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

import { useState } from 'react';
import { User, Info, Download, Upload, Trash2, Edit2, Check, X, Shield } from 'lucide-react';
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
    toast.success('Profil créé');
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
          toast.success('Données importées');
        } else {
          toast.error('Erreur lors de l\'import');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleDeleteProfile = () => {
    if (confirm('Supprimer votre profil ? Vos préférences et rappels seront effacés.')) {
      deleteProfile();
      toast.success('Profil supprimé');
    }
  };

  return (
    <div className="page-container space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <User className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-display font-bold">Mon Profil</h1>
      </div>

      {/* Profile Card */}
      {!profile && !showCreateForm ? (
        <div className="glass-card p-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-base font-bold text-foreground mb-2">Créer un profil local</h2>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Vos données restent sur cet appareil. Aucun compte en ligne requis.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            Créer mon profil
          </button>
        </div>
      ) : showCreateForm ? (
        <div className="glass-card p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Nouveau profil</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Pseudo</label>
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
        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary">
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
                    className="bg-secondary rounded-lg px-3 py-1.5 text-foreground font-bold w-full"
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
                  <h2 className="text-lg font-bold text-foreground truncate">{profile?.username}</h2>
                  <button 
                    onClick={() => { setEditName(profile?.username || ''); setIsEditing(true); }}
                    className="p-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                Membre depuis {new Date(profile?.createdAt || '').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
            <div className="text-center p-2.5 rounded-xl bg-secondary/50">
              <p className="text-lg font-bold text-foreground">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Animes</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-secondary/50">
              <p className="text-lg font-bold text-foreground">{stats.totalEpisodes}</p>
              <p className="text-[10px] text-muted-foreground">Épisodes</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-secondary/50">
              <p className="text-lg font-bold text-foreground">{reminders.length}</p>
              <p className="text-[10px] text-muted-foreground">Rappels</p>
            </div>
          </div>
        </div>
      )}

      {/* Preferences */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Préférences
        </h3>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground">Version préférée</p>
              <p className="text-[11px] text-muted-foreground">Filtre par défaut du calendrier</p>
            </div>
            <div className="flex gap-0.5 bg-secondary/50 rounded-lg p-0.5 flex-shrink-0">
              {(['all', 'vf', 'vostfr'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVersionPreference(v)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
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
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Données
        </h3>
        
        <button 
          onClick={handleExport}
          className="w-full glass-card p-3.5 flex items-center gap-3 hover:bg-card-hover transition-colors active:scale-[0.99]"
        >
          <div className="w-9 h-9 rounded-xl bg-rating-green/10 flex items-center justify-center">
            <Download className="w-4 h-4 text-rating-green" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-sm text-foreground">Exporter mes données</p>
            <p className="text-[11px] text-muted-foreground">Sauvegarder en fichier JSON</p>
          </div>
        </button>

        <button 
          onClick={handleImport}
          className="w-full glass-card p-3.5 flex items-center gap-3 hover:bg-card-hover transition-colors active:scale-[0.99]"
        >
          <div className="w-9 h-9 rounded-xl bg-status-watching/10 flex items-center justify-center">
            <Upload className="w-4 h-4 text-status-watching" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-sm text-foreground">Importer des données</p>
            <p className="text-[11px] text-muted-foreground">Restaurer depuis un fichier</p>
          </div>
        </button>

        {profile && (
          <button 
            onClick={handleDeleteProfile}
            className="w-full glass-card p-3.5 flex items-center gap-3 hover:bg-destructive/10 transition-colors active:scale-[0.99]"
          >
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-destructive" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm text-destructive">Supprimer mon profil</p>
              <p className="text-[11px] text-muted-foreground">Efface toutes les préférences</p>
            </div>
          </button>
        )}
      </div>

      {/* Info Footer */}
      <div className="glass-card p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-muted-foreground space-y-1 leading-relaxed">
            <p>Vos données sont stockées localement sur cet appareil.</p>
            <p>Données fournies par Jikan API (MyAnimeList non-officiel).</p>
            <p className="opacity-60">Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

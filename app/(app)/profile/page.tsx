'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { User, Phone, Calendar, Briefcase, MessageSquare, Lock } from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    fullName: '',
    phone1: '',
    phone2: '',
    birthday: '',
    profession: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/users/me');
        const data = await res.json();
        if (data.profile) {
          setProfile({
            fullName: data.profile.fullName || '',
            phone1: data.profile.phone1 || '',
            phone2: data.profile.phone2 || '',
            birthday: data.profile.birthday ? new Date(data.profile.birthday).toISOString().split('T')[0] : '',
            profession: data.profile.profession || '',
          });
        }
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
       const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Échec de la mise à jour du profil');
      }
      
      toast.success('Profil mis à jour !');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSendSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuggesting(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: suggestion }),
      });
      if (!res.ok) throw new Error('Failed to send suggestion');
      toast.success('Suggestion sent!');
      setSuggestion('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSuggesting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><span className="loading loading-spinner loading-lg"></span></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mon Profil</h1>
        <button 
          onClick={() => setIsEditing(!isEditing)} 
          className={`btn ${isEditing ? 'btn-outline' : 'btn-primary'}`}
        >
          {isEditing ? 'Annuler' : 'Modifier le Profil'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">Informations Personnelles</h2>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text">Nom Complet</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-base-content/50" />
                      <input 
                        type="text" 
                        disabled={!isEditing}
                        className="input input-bordered pl-10 w-full" 
                        value={profile.fullName}
                        onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text">Profession</span></label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 w-4 h-4 text-base-content/50" />
                      <input 
                        type="text" 
                        disabled={!isEditing}
                        className="input input-bordered pl-10 w-full" 
                        value={profile.profession}
                        onChange={(e) => setProfile({...profile, profession: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text">Téléphone 1</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-base-content/50" />
                      <input 
                        type="tel" 
                        disabled={!isEditing}
                        className="input input-bordered pl-10 w-full" 
                        value={profile.phone1}
                        onChange={(e) => setProfile({...profile, phone1: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text">Téléphone 2</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-base-content/50" />
                      <input 
                        type="tel" 
                        disabled={!isEditing}
                        className="input input-bordered pl-10 w-full" 
                        value={profile.phone2}
                        onChange={(e) => setProfile({...profile, phone2: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text">Date de Naissance</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-4 h-4 text-base-content/50" />
                      <input 
                        type="date" 
                        disabled={!isEditing}
                        className="input input-bordered pl-10 w-full" 
                        value={profile.birthday}
                        onChange={(e) => setProfile({...profile, birthday: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end mt-6">
                    <button type="submit" className="btn btn-primary">Enregistrer les modifications</button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="space-y-6">
          <div className="card bg-base-200 shadow-md border border-base-300">
            <div className="card-body p-6">
              <h2 className="card-title text-lg mb-2">Sécurité</h2>
              <p className="text-sm text-base-content/70 mb-4">Gérez votre mot de passe et vos paramètres d'authentification.</p>
              <a 
                href="https://app.kinde.com/profile" 
                target="_blank" 
                className="btn btn-outline btn-sm gap-2"
              >
                <Lock className="w-4 h-4" /> Modifier le mot de passe
              </a>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body p-6">
              <h2 className="card-title text-lg mb-2 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Suggestions
              </h2>
              <p className="text-sm text-base-content/70 mb-4">Une suggestion ou un feedback ? Dites-le nous !</p>
              <form onSubmit={handleSendSuggestion} className="space-y-3">
                <textarea 
                  className="textarea textarea-bordered w-full" 
                  placeholder="Votre suggestion..."
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  rows={4}
                />
                <button 
                  type="submit" 
                  disabled={suggesting || !suggestion.trim()}
                  className="btn btn-primary btn-sm w-full"
                >
                  {suggesting ? <span className="loading loading-spinner"></span> : 'Envoyer la suggestion'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    phone1: '',
    phone2: '',
    birthday: '',
    profession: '',
  });
  const router = useRouter();

  useEffect(() => {
    async function checkProfile() {
      try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data.isAuthenticated && !data.isProfileComplete) {
          setIsOpen(true);
          if (data.profile) {
            setFormData({
              fullName: data.profile.fullName || '',
              phone1: data.profile.phone1 || '',
              phone2: data.profile.phone2 || '',
              birthday: data.profile.birthday ? new Date(data.profile.birthday).toISOString().split('T')[0] : '',
              profession: data.profile.profession || '',
            });
          }
        }
      } catch (error) {
        console.error('Error checking profile status:', error);
      } finally {
        setLoading(false);
      }
    }
    checkProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.[0]?.message || 'Failed to update profile');
      }

      toast.success('Profile updated successfully!');
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isOpen) return null;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-base-300">
        <div className="p-6 border-b border-base-200 bg-base-200/50">
          <h2 className="text-2xl font-bold text-base-content">Complete Your Profile</h2>
          <p className="text-sm text-base-content/70">Please provide your details to continue using the platform.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Full Name</span>
            </label>
            <input 
              type="text" 
              className="input input-bordered w-full" 
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Phone Number 1 (Required)</span>
            </label>
            <input 
              type="tel" 
              required 
              className="input input-bordered w-full" 
              placeholder="+237..."
              value={formData.phone1}
              onChange={(e) => setFormData({...formData, phone1: e.target.value})}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Phone Number 2 (Optional)</span>
            </label>
            <input 
              type="tel" 
              className="input input-bordered w-full" 
              placeholder="+237..."
              value={formData.phone2}
              onChange={(e) => setFormData({...formData, phone2: e.target.value})}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Birthday</span>
            </label>
            <input 
              type="date" 
              className="input input-bordered w-full" 
              value={formData.birthday}
              onChange={(e) => setFormData({...formData, birthday: e.target.value})}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Profession</span>
            </label>
            <input 
              type="text" 
              className="input input-bordered w-full" 
              placeholder="e.g. Software Engineer"
              value={formData.profession}
              onChange={(e) => setFormData({...formData, profession: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !formData.phone1}
            className="btn btn-primary w-full mt-4"
          >
            {loading ? <span className="loading loading-spinner"></span> : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

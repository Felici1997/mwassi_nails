"use client"
import Wrapper from '@/app/components/Wrapper';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import React, { useEffect, useState } from 'react';
import Notification from '@/app/components/Notification';
import Image from 'next/image';
import { Clock7, Users, ImageIcon } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  imgUrl: string;
  duration: number;
}

interface Appointment {
  startTime: string;
  endTime: string;
}

interface ServiceData {
  service: Service;
  existingAppointments: Appointment[];
  salonId: string;
}

const Page = ({ params }: { params: { id: string } }) => {
  const { user } = useKindeBrowserClient();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [mergedSlots, setMergedSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  const [notification, setNotification] = useState<string>('');
  const closeNotification = () => setNotification("");

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', phone1: '', phone2: '', birthday: '', profession: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const today = new Date();
    const formatedDate = today.toISOString().split('T')[0];
    setSelectedDate(formatedDate);
  }, []);

  const fetchServiceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/services/${params.id}/availabilities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serviceId: params.id,
          appointmentDate: selectedDate.split('-').reverse().join('/')
        })
      });
 
 
      if (response.ok) {
        const data = await response.json();
        setServiceData({
          service: data.service,
          existingAppointments: data.existingAppointments,
          salonId: data.salonId
        });
        calculateAvailableSlots(data.existingAppointments, data.service.duration);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Erreur lors de la récupération des données du service.');
        console.error('Erreur lors de la récupération des données du service.');
      }
 
    } catch (error) {
      setError('Une erreur inattendue est survenue.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchServiceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, params.id]);

  const parseTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const calculateAvailableSlots = (appointments: Appointment[], duration: number) => {
    const slots: string[] = [];
    const workingHours = [{ start: '08:00', end: '19:00' }];
    const today = new Date();
    const selectedDateObj = new Date(selectedDate);

    const now = today.getHours() * 60 + today.getMinutes();

    workingHours.forEach(({ start, end }) => {
      const startTime = parseTime(start);
      const endTime = parseTime(end);

      for (let time = startTime; time + duration <= endTime; time += 30) {
        const slotStart = formatTime(time);
        const slotEnd = formatTime(time + duration);

        const istoday = selectedDateObj.toDateString() === today.toDateString();
        const isPastSlot = istoday && time < now;

        const overlappingCount = appointments.filter(({ startTime: resStartStr, endTime: resEndStr }) => {
            const resStart = parseTime(resStartStr);
            const resEnd = parseTime(resEndStr);
            return (time < resEnd && time + duration > resStart);
        }).length;

        const isFull = overlappingCount >= 4;

        if (!isFull && !isPastSlot) {
          slots.push(`${slotStart} - ${slotEnd}`);
        }
      }
    });

    setAvailableSlots(slots);
  };

  const isSlotSelected = (slot: string) => {
    return selectedSlots.includes(slot);
  };

  const handleSlotClick = (slot: string) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots([]);
      setMergedSlots([]);
    } else {
      setSelectedSlots([slot]);
      setMergedSlots([slot]);
    }
  };

  const handleAppointment = async () => {
    if (!user) {
      setNotification('Veuillez vous connecter pour réserver.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          serviceId: params.id,
          staffId: null,
          appointmentDate: selectedDate.split('-').reverse().join('/'),
          timeSlots: mergedSlots,
          notes: notes || undefined
        })
      });

      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.requiresProfile) {
          const meRes = await fetch('/api/users/me');
          if (meRes.ok) {
            const meData = await meRes.json();
            if (meData.profile) {
              setProfileForm({
                fullName: meData.profile.fullName || '',
                phone1: meData.profile.phone1 || '',
                phone2: meData.profile.phone2 || '',
                birthday: meData.profile.birthday ? new Date(meData.profile.birthday).toISOString().split('T')[0] : '',
                profession: meData.profile.profession || '',
              });
            }
          }
          setShowProfileModal(true);
          setIsSubmitting(false);
          return;
        }
        setNotification(errorData.message || 'Erreur.');
        return;
      }

      if (response.ok) {
        setNotification('Rendez-vous réussi !');
        fetchServiceData();
        setSelectedSlots([]);
        setMergedSlots([]);
      } else {
        const errorData = await response.json();
        setNotification(errorData.message || 'Erreur lors de la réservation.');
      }
    } catch {
      setNotification('Erreur serveur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileForm, email: user?.email }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erreur'); }
      setShowProfileModal(false);
      handleAppointment();
    } catch {
      setNotification('Erreur lors de la sauvegarde du profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <Wrapper>
      {notification && <Notification message={notification} onclose={closeNotification} />}

      <div>
        <h1 className='text-2xl mb-4'> Réserver ce service </h1>
        {loading && (
          <div className="flex justify-center p-20"><span className="loading loading-spinner loading-lg"></span></div>
        )}
        {error && (
          <div className="alert alert-error shadow-lg">
            <div>
              <span>{error}</span>
            </div>
            <button className="btn btn-sm" onClick={fetchServiceData}>Réessayer</button>
          </div>
        )}
        {!loading && !error && serviceData && (
          <div className='flex'>
            <div className="w-full h-fit">
              {mergedSlots.length > 0 && (
                <ul className='hidden md:flex flex-wrap gap-1 mb-4 items-center'>
                  Créneaux choisis :
                  {mergedSlots.map((mergedSlot, index) => (
                    <li key={index} className='badge badge-ghost'>{mergedSlot}</li>
                  ))}
                </ul>
              )}

              <div className='flex'>
                <div className='md:border-base-300 md:border md:rounded-xl md:p-5 h-fit md:w-1/3'>
                  {serviceData.service.imgUrl ? (
                    <Image src={serviceData.service.imgUrl} alt={serviceData.service.id}
                      width={400}
                      height={400}
                      quality={100}
                      className='shadow-sm w-full  h-48 object-cover rounded-xl'
                    />
                  ) : (
                    <Image src="/placeholder.jpg" alt={serviceData.service.name}
                      width={400}
                      height={400}
                      className='shadow-sm w-full h-48 object-cover rounded-xl'
                    />
                  )}
                  <div className='flex items-center mt-4'>
                    <div className='badge badge-secondary'>
                      <Users className='mr-2 w-4' />
                      {serviceData.service.price} FCFA
                    </div>
                    <h1 className='font-bold text-xl ml-2'>{serviceData.service.name}</h1>
                  </div>
                  <p className='text-sm my-2 text-gray-500'>{serviceData.service.description}</p>
                  <button className="btn btn-outline mt-4 btn-sm btn-secondary md:hidden block" onClick={() => (document.getElementById('my_modal') as HTMLDialogElement).showModal()}>Choisir un créneau</button>
                </div>

                <div className='hidden md:block ml-4 w-2/3 '>
                  <div className='flex flex-col gap-4'>
                    <div className='flex'>
                      <input type="date" value={selectedDate} className='input input-bordered w-full' min={new Date().toISOString().split('T')[0]} onChange={(e) => setSelectedDate(e.target.value)} />
                      <button 
  className='btn btn-secondary ml-4' 
  disabled={mergedSlots.length === 0 || isSubmitting} 
  onClick={handleAppointment}
>
  {isSubmitting ? <span className="loading loading-spinner"></span> : 'Réserver'}
</button>
                    </div>
                    
                    <details className="mt-4 bg-base-200 rounded-xl p-3">
                      <summary className="text-sm font-medium cursor-pointer text-base-content/70">Ajouter des précisions</summary>
                      <div className='mt-3 space-y-3'>
                        <textarea
                          className='textarea textarea-bordered w-full'
                          placeholder='Détails ou précisions sur votre service...'
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                        />
                        <div className='flex items-center gap-3'>
                          <label className='btn btn-outline btn-sm gap-2 cursor-not-allowed opacity-50'>
                            <ImageIcon className='w-4 h-4' />
                            Bientôt disponible
                          </label>
                        </div>
                      </div>
                    </details>

                    <ul className='grid grid-cols-2 gap-4 mt-4'>
                      {availableSlots.length > 0 ? (
                        availableSlots.map((slot, index) => (
                          <button key={index} className={`btn w-full btn-md ${isSlotSelected(slot) ? 'btn-secondary' : 'btn-outline btn-ghost border border-base-300 text-gray-500 hover:bg-secondary hover:border-secondary'} `} onClick={() => handleSlotClick(slot)}>
                            <Clock7 className='w-4' /> {slot}
                          </button>
                        ))
                      ) : (
                        <p>Aucun créneau disponible.</p>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <dialog id="my_modal" className="modal">
                <div className="modal-box">
                  <form method="dialog">
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                  </form>
                  <div className='w-full mt-5 '>
                    {mergedSlots.length > 0 && (
                      <ul className='flex flex-wrap gap-1 mb-4 items-center'>
                        Créneaux choisis :
                        {mergedSlots.map((mergedSlot, index) => (
                          <li key={index} className='badge badge-ghost'>{mergedSlot}</li>
                        ))}
                      </ul>
                    )}
                    <div className='flex flex-col gap-4'>
                      <div className='flex'>
                        <input type="date" value={selectedDate} className='input input-bordered w-full' min={new Date().toISOString().split('T')[0]} onChange={(e) => setSelectedDate(e.target.value)} />
<button 
  className='btn btn-secondary ml-4' 
  disabled={mergedSlots.length === 0 || isSubmitting} 
  onClick={handleAppointment}
>
  {isSubmitting ? <span className="loading loading-spinner"></span> : 'Réserver'}
</button>
                      </div>
                      <details className="mt-4 bg-base-200 rounded-xl p-3">
                        <summary className="text-sm font-medium cursor-pointer text-base-content/70">Ajouter des précisions</summary>
                        <div className='mt-3 space-y-3'>
                          <textarea
                            className='textarea textarea-bordered w-full'
                            placeholder='Détails ou précisions...'
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                          />
                          <div className='flex items-center gap-3'>
                            <label className='btn btn-outline btn-sm gap-2 cursor-not-allowed opacity-50'>
                              <ImageIcon className='w-4 h-4' />
                              Bientôt disponible
                            </label>
                          </div>
                        </div>
                      </details>
                      <ul className='grid grid-cols-2 gap-4 mt-4'>
                        {availableSlots.length > 0 ? (
                          availableSlots.map((slot, index) => (
                            <button key={index} className={`btn w-full btn-md ${isSlotSelected(slot) ? 'btn-secondary' : 'btn-outline btn-ghost border border-base-300 text-gray-500 hover:bg-secondary hover:border-secondary'} `} onClick={() => handleSlotClick(slot)}>
                              <Clock7 className='w-4' /> {slot}
                            </button>
                          ))
                        ) : (
                          <p>Aucun créneau disponible.</p>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </dialog>
            </div>
          </div>
        )}
      </div>

      {showProfileModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-base-300">
            <div className="p-6 border-b border-base-200 bg-base-200/50">
              <h2 className="text-2xl font-bold text-base-content">Complétez Votre Profil</h2>
              <p className="text-sm text-base-content/70">Veuillez fournir vos informations avant de réserver.</p>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-medium">Nom Complet <span className="text-error">*</span></span></label>
                <input type="text" required className="input input-bordered w-full" placeholder="Jean Dupont" value={profileForm.fullName} onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})} />
              </div>
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-medium">Téléphone 1 <span className="text-error">*</span></span></label>
                <input type="tel" required className="input input-bordered w-full" placeholder="+237..." value={profileForm.phone1} onChange={(e) => setProfileForm({...profileForm, phone1: e.target.value})} />
              </div>
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-medium">Téléphone 2 (Optionnel)</span></label>
                <input type="tel" className="input input-bordered w-full" placeholder="+237..." value={profileForm.phone2} onChange={(e) => setProfileForm({...profileForm, phone2: e.target.value})} />
              </div>
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-medium">Date de Naissance</span></label>
                <input type="date" className="input input-bordered w-full" value={profileForm.birthday} onChange={(e) => setProfileForm({...profileForm, birthday: e.target.value})} />
              </div>
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-medium">Profession</span></label>
                <input type="text" className="input input-bordered w-full" placeholder="ex: Ingénieur" value={profileForm.profession} onChange={(e) => setProfileForm({...profileForm, profession: e.target.value})} />
              </div>
              <button type="submit" disabled={savingProfile || !profileForm.phone1 || !profileForm.fullName} className="btn btn-primary w-full mt-4">
                {savingProfile ? <span className="loading loading-spinner"></span> : 'Enregistrer et continuer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </Wrapper>
  )
}

export default Page;

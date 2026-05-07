"use client"
import Wrapper from '@/app/components/Wrapper';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import React, { useEffect, useState } from 'react';
import Notification from '@/app/components/Notification';
import Image from 'next/image';
import { Clock7, Users } from 'lucide-react';

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
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [mergedSlots, setMergedSlots] = useState<string[]>([]);
  const [salonId, setSalonId] = useState<string | null>(null);

  const [notification, setNotification] = useState<string>('');
  const closeNotification = () => setNotification("");

  useEffect(() => {
    const today = new Date();
    const formatedDate = today.toISOString().split('T')[0];
    setSelectedDate(formatedDate);
  }, []);

  const fetchServiceData = async () => {
    try {
      const response = await fetch('/api/availabilities', {
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
        setSalonId(data.salonId);
        calculateAvailableSlots(data.existingAppointments, data.service.duration);
      } else {
        console.error('Erreur lors de la récupération des données du service.');
      }

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchServiceData();
    }
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
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          serviceId: params.id,
          staffId: null,
          appointmentDate: selectedDate.split('-').reverse().join('/'),
          timeSlots: mergedSlots
        })
      });

      if (response.ok) {
        setNotification('Rendez-vous réussi !');
        fetchServiceData();
        setSelectedSlots([]);
        setMergedSlots([]);
      } else {
        const errorData = await response.json();
        setNotification(errorData.message || 'Erreur lors de la réservation.');
      }
    } catch (error) {
      setNotification('Erreur serveur');
    }
  };

  return (
    <Wrapper>
      {notification && <Notification message={notification} onclose={closeNotification} />}

      <div>
        <h1 className='text-2xl mb-4'> Réserver ce service </h1>
        {serviceData && (
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
                  <Image src={serviceData.service.imgUrl ? serviceData.service.imgUrl : '/placeholder.jpg'} alt={serviceData.service.id}
                    width={400}
                    height={400}
                    quality={100}
                    className='shadow-sm w-full  h-48 object-cover rounded-xl'
                  />
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
                      <button className='btn btn-secondary ml-4' disabled={mergedSlots.length === 0} onClick={handleAppointment}>Réserver</button>
                    </div>
                    
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
                        <button className='btn btn-secondary ml-4' disabled={mergedSlots.length === 0} onClick={handleAppointment}>Réserver</button>
                      </div>
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
    </Wrapper>
  )
}

export default Page;

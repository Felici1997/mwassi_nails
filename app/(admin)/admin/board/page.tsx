"use client"
import React, { useEffect, useState } from 'react'
import { Clock, Bell, Crown } from 'lucide-react'
import dayjs from 'dayjs'


interface Appointment {
  id: string;
  user: { givenName: string | null; familyName: string | null; email: string };
  service: { name: string; id: string };
  staff: { name: string; id: string };
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

const AppointmentBoard = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [pendingCount, setPendingCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm'))
 
    const fetchData = async () => {
        try {
            const response = await fetch(`/api/admin/appointments`);
            const data = await response.json();
            
            const todayISO = dayjs().format('YYYY-MM-DD');
            const todaySlash = dayjs().format('DD/MM/YYYY');
            
            const todaysAppointments = (data.appointments || []).filter((app: Appointment) => 
                app.appointmentDate === todayISO || app.appointmentDate === todaySlash
            );
            
            const confirmed = todaysAppointments.filter((app: Appointment) => app.status === 'CONFIRMED');
            const pending = todaysAppointments.filter((app: Appointment) => app.status !== 'CONFIRMED');
            
            setPendingCount(pending.length);
            const sorted = confirmed.sort((a: Appointment, b: Appointment) => a.startTime.localeCompare(b.startTime));
            setAppointments(sorted);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };
 
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(dayjs().format('HH:mm'));
        }, 1000);
 
        const dataInterval = setInterval(() => {
            fetchData();
        }, 30000);
 
        fetchData();
        return () => {
            clearInterval(timer);
            clearInterval(dataInterval);
        };
    }, []);


    if (loading) return (
        <div className='bg-black h-screen w-full flex items-center justify-center'>
            <span className="loading loading-spinner loading-lg text-amber-400"></span>
        </div>
    );

    return (
        <div className='bg-black bg-[radial-gradient(ellipse_at_top,_rgba(127,29,29,0.35),_transparent_55%)] min-h-screen w-full text-amber-400 font-mono p-0 m-0 overflow-hidden'>
            {/* Header */}
            <div className='relative bg-gradient-to-b from-zinc-950 to-black text-amber-400 p-4 flex justify-between items-center border-b-2 border-amber-500/70 shadow-[0_4px_20px_rgba(127,29,29,0.5)]'>
                <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-2'>
                        <Clock className='w-8 h-8 text-amber-400' />
                        <h1 className='text-3xl md:text-5xl font-black uppercase tracking-tighter text-amber-400'>
                            SESSIONS DU JOUR
                        </h1>
                    </div>
                    {pendingCount > 0 && (
                        <div className='relative ml-4 bg-red-700 text-amber-300 p-2 rounded-full flex items-center gap-2 px-3 shadow-lg border border-amber-500/60 animate-pulse'>
                            <Bell className='w-5 h-5' />
                            <span className='font-bold'>{pendingCount}</span>
                        </div>
                    )}
                </div>
                <div className='flex flex-col items-end gap-1'>
                    <div className='flex items-center gap-2 text-red-500'>
                        <Crown className='w-4 h-4' />
                        <span className='text-xs md:text-sm font-bold uppercase tracking-[0.2em]'>Mwassi Nails</span>
                    </div>
                    <div className='text-3xl md:text-5xl font-black text-amber-400'>
                        {currentTime}
                    </div>
                </div>
            </div>
            {/* Accent line */}
            <div className='h-[3px] w-full bg-gradient-to-r from-red-700 via-amber-400 to-red-700'></div>

            {/* Board Table */}
            <div className='w-full overflow-hidden'>
                <div className='grid grid-cols-5 gap-0 border-b-2 border-red-900/60 bg-zinc-950 text-amber-500 p-3 font-bold uppercase text-sm md:text-lg tracking-widest'>
                    <div className='col-span-2'>Client</div>
                    <div>Service</div>
                    <div>Heure</div>
                    <div>Personnel</div>
                    <div className='text-right'>Statut</div>
                </div>

                <div className='flex flex-col'>
                    {appointments.length > 0 ? (
                        appointments.map((app, index) => (
                            <div 
                                key={app.id} 
                                className={`grid grid-cols-5 gap-0 p-3 border-b border-red-900/30 text-xl md:text-3xl font-bold uppercase tracking-tight transition-colors
                                ${index % 2 === 0 ? 'bg-black text-amber-400' : 'bg-zinc-950 text-amber-300'}`}
                            >
                                <div className='col-span-2 truncate pr-4'>
                                    {app.user?.givenName || 'Client'} {app.user?.familyName || ''}
                                </div>
                                <div className='truncate text-amber-200/90'>{app.service?.name}</div>
                                <div className='text-center text-amber-100'>{app.startTime}</div>
                                <div className='truncate text-amber-200/60'>{app.staff?.name || '---'}</div>
                                <div className={`text-right font-black ${app.status === 'CONFIRMED' ? 'text-amber-300' : app.status === 'REJECTED' ? 'text-red-500' : 'text-red-400/80'}`}>
                                    {app.status === 'CONFIRMED' ? 'CONFIRMÉ' : app.status === 'REJECTED' ? 'REJETÉ' : 'ATTENTE'}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className='flex items-center justify-center h-64 text-2xl text-zinc-600 italic'>
                            Aucun rendez-vous prévu pour aujourd'hui.
                        </div>
                    )}
                </div>
            </div>

            {/* Footer decoration */}
            <div className='fixed bottom-0 w-full h-2 bg-gradient-to-r from-red-700 via-amber-400 to-red-700'></div>
        </div>
    );
}

export default AppointmentBoard;

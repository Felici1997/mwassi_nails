"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '@/app/components/Wrapper'
import { Clock, Bell } from 'lucide-react'
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

const AppointmentBoard = ({ params }: { params: { salonId: string } }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [pendingCount, setPendingCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm'))

    const fetchData = async () => {
        try {
            const response = await fetch(`/api/admin/appointments?salonId=${params.salonId}`);
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
    }, [params.salonId]);

    if (loading) return (
        <div className='bg-black h-screen w-full flex items-center justify-center'>
            <span className="loading loading-spinner loading-lg text-yellow-400"></span>
        </div>
    );

    return (
        <div className='bg-black min-h-screen w-full text-yellow-400 font-mono p-0 m-0 overflow-hidden'>
            {/* Airport-style Header */}
            <div className='bg-yellow-500 text-black p-4 flex justify-between items-center border-b-4 border-black'>
                <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-2'>
                        <Clock className='w-8 h-8' />
                        <h1 className='text-3xl md:text-5xl font-black uppercase tracking-tighter'>SESSIONS DU JOUR</h1>
                    </div>
                    {pendingCount > 0 && (
                        <div className='relative ml-4 bg-black text-yellow-500 p-2 rounded-full flex items-center gap-2 px-3 shadow-lg animate-bounce'>
                            <Bell className='w-5 h-5' />
                            <span className='font-bold'>{pendingCount}</span>
                        </div>
                    )}
                </div>
                <div className='text-3xl md:text-5xl font-black'>
                    {currentTime}
                </div>
            </div>


            {/* Board Table */}
            <div className='w-full overflow-hidden'>
                <div className='grid grid-cols-5 gap-0 border-b border-yellow-900/30 bg-zinc-900 text-yellow-600 p-3 font-bold uppercase text-sm md:text-lg tracking-widest'>
                    <div className='col-span-2'>Client</div>
                    <div>Service</div>
                    <div>Heure</div>
                    <div>Personnel</div>
                    <div>Statut</div>
                </div>

                <div className='flex flex-col'>
                    {appointments.length > 0 ? (
                        appointments.map((app, index) => (
                            <div 
                                key={app.id} 
                                className={`grid grid-cols-5 gap-0 p-3 border-b border-zinc-800 text-xl md:text-3xl font-bold uppercase tracking-tight transition-colors
                                ${index % 2 === 0 ? 'bg-zinc-950 text-yellow-400' : 'bg-zinc-900 text-yellow-500'}`}
                            >
                                <div className='col-span-2 truncate pr-4'>
                                    {app.user?.givenName || 'Client'} {app.user?.familyName || ''}
                                </div>
                                <div className='truncate'>{app.service?.name}</div>
                                <div className='text-center'>{app.startTime}</div>
                                <div className='truncate'>{app.staff?.name || '---'}</div>
                                <div className={`text-right ${app.status === 'CONFIRMED' ? 'text-green-500' : app.status === 'REJECTED' ? 'text-red-500' : 'text-yellow-600'}`}>
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
            <div className='fixed bottom-0 w-full h-2 bg-yellow-500'></div>
        </div>
    );
}

export default AppointmentBoard;

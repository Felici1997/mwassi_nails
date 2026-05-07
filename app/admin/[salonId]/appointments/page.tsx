"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '@/app/components/Wrapper'
import Notification from '@/app/components/Notification'
import { Calendar, Clock, User, Trash2, Edit3 } from 'lucide-react'

interface Appointment {
  id: string;
  user: { givenName: string | null; familyName: string | null; email: string };
  service: { name: string; id: string };
  staff: { name: string; id: string };
  appointmentDate: string;
  startTime: string;
  endTime: string;
}

interface Service {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  name: string;
}

const AdminAppointments = ({ params }: { params: { salonId: string } }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [staff, setStaff] = useState<Staff[]>([])
    const [loading, setLoading] = useState(true)
    const [notification, setNotification] = useState('')

    // State for editing
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
    const [editFormData, setEditFormData] = useState<any>({})

    const closeNotification = () => setNotification("")

    const fetchData = async () => {
        try {
            const [appRes, serRes, stfRes] = await Promise.all([
                fetch(`/api/admin/appointments?salonId=${params.salonId}`),
                fetch(`/api/services?salonId=${params.salonId}`),
                fetch(`/api/staff?salonId=${params.salonId}`)
            ])

            const appData = await appRes.json()
            const serData = await serRes.json()
            const stfData = await stfRes.json()

            setAppointments(appData.appointments || [])
            setServices(serData.services || [])
            setStaff(stfData.staff || [])
            setLoading(false)
        } catch (error) {
            console.error(error)
            setLoading(false)
        }
    }

    const handleCancelAppointment = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return;
        
        try {
            const response = await fetch('/api/admin/appointments', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })

            if (response.ok) {
                setNotification('Rendez-vous annulé avec succès !')
                fetchData()
            } else {
                setNotification('Erreur lors de l\'annulation')
            }
        } catch (error) {
            setNotification('Erreur serveur')
        }
    }

    const openEditModal = (app: Appointment) => {
        setEditingAppointment(app)
        setEditFormData({
            id: app.id,
            appointmentDate: app.appointmentDate,
            startTime: app.startTime,
            endTime: app.endTime,
            serviceId: app.service.id,
            staffId: app.staff?.id || ''
        })
    }

    const handleUpdateAppointment = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch('/api/admin/appointments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData)
            })

            if (response.ok) {
                setNotification('Rendez-vous mis à jour !')
                setEditingAppointment(null)
                fetchData()
            } else {
                setNotification('Erreur lors de la mise à jour')
            }
        } catch (error) {
            setNotification('Erreur serveur')
        }
    }

    useEffect(() => {
        fetchData()
    }, [params.salonId])

    // Group appointments by date
    const groupedAppointments = appointments.reduce((acc, app) => {
        const date = app.appointmentDate
        if (!acc[date]) {
            acc[date] = []
        }
        acc[date].push(app)
        return acc
    }, {} as Record<string, Appointment[]>)

    // Sort dates
    const sortedDates = Object.keys(groupedAppointments).sort()

    return (
        <Wrapper>
            {notification && <Notification message={notification} onclose={closeNotification} />}
            <div className='p-5'>
                <h1 className='text-2xl font-bold mb-6'>Calendrier Global des RDV</h1>
                
                {loading ? (
                    <div className='text-center mt-32'><span className="loading loading-spinner loading-lg"></span></div>
                ) : (
                    <div className='flex flex-col gap-8'>
                        {sortedDates.length > 0 ? (
                            sortedDates.map(date => (
                                <div key={date} className='space-y-4'>
                                    <h2 className='text-xl font-semibold border-b pb-2 text-secondary'>{date}</h2>
                                    <div className='grid grid-cols-1 gap-4'>
                                        {groupedAppointments[date].map(app => (
                                            <div key={app.id} className='bg-white p-4 rounded-xl shadow-sm border border-base-200 flex justify-between items-center'>
                                                <div className='flex items-center gap-4'>
                                                    <div className='bg-secondary/10 p-3 rounded-full text-secondary'>
                                                        <Calendar className='w-5 h-5' />
                                                    </div>
                                                    <div>
                                                        <p className='font-bold'>{app.user?.givenName || 'Client'} {app.user?.familyName || ''}</p>
                                                        <p className='text-sm text-gray-500'>{app.service?.name} - {app.staff?.name || 'Non assigné'}</p>
                                                    </div>
                                                </div>
                                                <div className='flex items-center gap-6'>
                                                    <div className='text-right'>
                                                        <p className='font-semibold'>{app.startTime} - {app.endTime}</p>
                                                    </div>
                                                    <div className='flex gap-2'>
                                                        <button 
                                                            onClick={() => openEditModal(app)}
                                                            className='btn btn-ghost btn-sm text-primary'
                                                            title="Modifier le RDV"
                                                        >
                                                            <Edit3 className='w-4' />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleCancelAppointment(app.id)} 
                                                            className='btn btn-ghost btn-sm text-error'
                                                            title="Annuler le RDV"
                                                        >
                                                            <Trash2 className='w-4' />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className='text-center text-gray-500'>Aucun rendez-vous enregistré.</p>
                        )}
                    </div>
                )}

                {/* Edit Modal */}
                {editingAppointment && (
                    <div className='modal modal-open'>
                        <div className='modal-box max-w-md'>
                            <h3 className='font-bold text-lg mb-4'>Modifier le rendez-vous</h3>
                            <form onSubmit={handleUpdateAppointment} className='flex flex-col gap-4'>
                                <div className='form-control'>
                                    <label className='label'>Date</label>
                                    <input 
                                        type="date"
                                        className='input input-bordered' 
                                        value={editFormData.appointmentDate}
                                        onChange={e => setEditFormData({...editFormData, appointmentDate: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className='flex gap-2'>
                                    <div className='form-control flex-1'>
                                        <label className='label'>Début</label>
                                        <input 
                                            type="time"
                                            className='input input-bordered' 
                                            value={editFormData.startTime}
                                            onChange={e => setEditFormData({...editFormData, startTime: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className='form-control flex-1'>
                                        <label className='label'>Fin</label>
                                        <input 
                                            type="time"
                                            className='input input-bordered' 
                                            value={editFormData.endTime}
                                            onChange={e => setEditFormData({...editFormData, endTime: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className='form-control'>
                                    <label className='label'>Service</label>
                                    <select 
                                        className='select select-bordered'
                                        value={editFormData.serviceId}
                                        onChange={e => setEditFormData({...editFormData, serviceId: e.target.value})}
                                        required
                                    >
                                        <option value="">Sélectionner un service...</option>
                                        {services.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='form-control'>
                                    <label className='label'>Personnel</label>
                                    <select 
                                        className='select select-bordered'
                                        value={editFormData.staffId}
                                        onChange={e => setEditFormData({...editFormData, staffId: e.target.value})}
                                    >
                                        <option value="">Aucun / Non assigné</option>
                                        {staff.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='modal-action'>
                                    <button type='button' className='btn' onClick={() => setEditingAppointment(null)}><X className='w-4' /> Annuler</button>
                                    <button type='submit' className='btn btn-secondary'><Save className='w-4' /> Enregistrer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Wrapper>
    )
}

export default AdminAppointments


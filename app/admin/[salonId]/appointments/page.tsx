"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '@/app/components/Wrapper'
import Notification from '@/app/components/Notification'
import { Calendar, Clock, User, Trash2, Edit3, CheckCircle2, Clock4, Search, X, Save } from 'lucide-react'
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
    const [searchQuery, setSearchQuery] = useState('')
    const [rejectionModal, setRejectionModal] = useState<{ id: string, note: string } | null>(null)
    
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

            if (!appRes.ok) throw new Error(`Appointments API error: ${appRes.status}`)
            if (!serRes.ok) throw new Error(`Services API error: ${serRes.status}`)
            if (!stfRes.ok) throw new Error(`Staff API error: ${stfRes.status}`)

            const appData = await appRes.json()
            const serData = await serRes.json()
            const stfData = await stfRes.json()

            setAppointments(appData.appointments || [])
            setServices(serData.services || [])
            setStaff(stfData.staff || [])
            setLoading(false)
        } catch (error: any) {
            console.error(error)
            setNotification(error.message || 'Erreur lors du chargement des données')
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
        const [day, month, year] = app.appointmentDate.split('/');
        const formattedDate = `${year}-${month}-${day}`;
        
        setEditingAppointment(app)
        setEditFormData({
            id: app.id,
            appointmentDate: formattedDate,
            startTime: app.startTime,
            endTime: app.endTime,
            serviceId: app.service.id,
            staffId: app.staff?.id || ''
        })
    }

    const handleUpdateAppointment = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const [year, month, day] = editFormData.appointmentDate.split('-');
            const formattedDate = `${day}/${month}/${year}`;

            const response = await fetch('/api/admin/appointments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...editFormData, appointmentDate: formattedDate })
            })
            
            const data = await response.json();

            if (response.ok) {
                setNotification('Rendez-vous mis à jour !')
                setEditingAppointment(null)
                fetchData()
            } else {
                setNotification(data.message || 'Erreur lors de la mise à jour')
            }
        } catch (error) {
            setNotification('Erreur serveur')
        }
    }

    useEffect(() => {
        fetchData();

        const interval = setInterval(() => {
            fetchData();
        }, 30000);

        return () => clearInterval(interval);
    }, [params.salonId])

    const handleUpdateStatus = async (id: string, status: 'CONFIRMED' | 'REJECTED', note?: string) => {
        try {
            const response = await fetch('/api/admin/appointments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, rejectionNote: note })
            })
            if (response.ok) {
                setNotification(`Rendez-vous ${status === 'CONFIRMED' ? 'confirmé' : 'rejeté'} avec succès !`)
                fetchData()
            } else {
                setNotification('Erreur lors de la mise à jour du statut')
            }
        } catch (error) {
            setNotification('Erreur serveur')
        }
    }

    const handleConfirmRejection = async () => {
        if (!rejectionModal) return;
        await handleUpdateStatus(rejectionModal.id, 'REJECTED', rejectionModal.note);
        setRejectionModal(null);
    }

    const renderAppointmentRow = (app: Appointment) => {
        const parts = app.appointmentDate.split('/');
        const [day, month, year] = parts;
        const paddedDay = (day || '01').padStart(2, '0');
        const paddedMonth = (month || '01').padStart(2, '0');
        const paddedYear = year || '1970';
        const appointmentDateTime = dayjs(`${paddedYear}-${paddedMonth}-${paddedDay} ${app.startTime}`);
        const isPast = appointmentDateTime.isBefore(dayjs());
        const isNowOrFuture = !isPast;



        return (
            <tr key={app.id} className={`hover:bg-base-100 ${isPast ? 'opacity-60' : ''}`}>
                <td className='p-4 font-medium'>
                    {app.user?.givenName || 'Client'} {app.user?.familyName || ''}
                    <div className='text-xs text-gray-400'>{app.user?.email}</div>
                </td>
                <td className='p-4'>{app.service?.name}</td>
                <td className='p-4'>{app.staff?.name || 'Non assigné'}</td>
                <td className='p-4'>{app.appointmentDate}</td>
                <td className='p-4'>{app.startTime} - {app.endTime}</td>
                <td className='p-4'>
                    {app.status === 'CONFIRMED' ? (
                        <div className='flex items-center gap-1 text-success font-semibold'>
                            <CheckCircle2 className='w-4 h-4' /> Confirmé
                        </div>
                    ) : app.status === 'REJECTED' ? (
                        <div className='flex items-center gap-1 text-error font-semibold'>
                            <X className='w-4 h-4' /> Rejeté
                        </div>
                    ) : isNowOrFuture ? (
                        <div className='flex items-center gap-1 text-warning font-semibold'>
                            <Clock4 className='w-4 h-4' /> En attente
                        </div>
                    ) : (
                        <div className='flex items-center gap-1 text-gray-400 font-semibold'>
                            <CheckCircle2 className='w-4 h-4' /> Passé
                        </div>
                    )}
                </td>
                <td className='p-4 flex gap-2'>
                    {!isPast && (
                        <>
                                <button 
                                    onClick={() => handleUpdateStatus(app.id, 'CONFIRMED')}
                                    className='btn btn-ghost btn-xs text-success'
                                    title="Confirmer"
                                >
                                    <CheckCircle2 className='w-4' />
                                </button>
                                <button 
                                    onClick={() => setRejectionModal({ id: app.id, note: '' })}
                                    className='btn btn-ghost btn-xs text-error'
                                    title="Rejeter"
                                >
                                    <X className='w-4' />
                                </button>
                            <button 
                                onClick={() => openEditModal(app)}
                                className='btn btn-ghost btn-xs text-primary'
                                title="Modifier"
                            >
                                <Edit3 className='w-4' />
                            </button>
                            <button 
                                onClick={() => handleCancelAppointment(app.id)} 
                                className='btn btn-ghost btn-xs text-error'
                                title="Annuler"
                            >
                                <Trash2 className='w-4' />
                            </button>
                        </>
                    )}
                </td>
            </tr>
        );
    }

    const filteredAppointments = appointments.filter(app => {
        const fullName = `${app.user?.givenName || ''} ${app.user?.familyName || ''}`.toLowerCase();
        const email = app.user?.email.toLowerCase() || '';
        return fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    });

    const allSorted = filteredAppointments.sort((a, b) => {
        const aParts = a.appointmentDate.split('/');
        const bParts = b.appointmentDate.split('/');
        
        const format = (parts: string[]) => {
            const [d, m, y] = parts;
            return `${y || '1970'}-${(m || '01').padStart(2, '0')}-${(d || '01').padStart(2, '0')}`;
        };

        const dateA = dayjs(`${format(aParts)} ${a.startTime}`);
        const dateB = dayjs(`${format(bParts)} ${b.startTime}`);
        
        const now = dayjs();
        const aIsPast = dateA.isBefore(now);
        const bIsPast = dateB.isBefore(now);

        if (aIsPast !== bIsPast) {
            return aIsPast ? 1 : -1; // Upcoming first
        }
        
        return dateA.diff(dateB);
    })

    return (
        <Wrapper>
            {notification && <Notification message={notification} onclose={closeNotification} />}
            <div className='p-5'>
                <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6'>
                    <h1 className='text-2xl font-bold'>Calendrier Global des RDV</h1>
                    <div className='flex gap-2 w-full md:w-auto'>
                        <div className='relative w-full md:w-80'>
                            <input 
                                type="text" 
                                placeholder="Rechercher un client..." 
                                className='input input-bordered w-full pl-10'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search className='absolute left-3 top-3 w-4 h-4 text-gray-400' />
                        </div>
                    </div>
                </div>
                
                {loading ? (
                    <div className='text-center mt-32'><span className="loading loading-spinner loading-lg"></span></div>
                ) : (
                    <div className='overflow-x-auto bg-white rounded-xl shadow-sm border border-base-200'>
                        <table className='table table-zebra w-full'>
                            <thead className='bg-base-200'>
                                <tr>
                                    <th className='p-4'>Client</th>
                                    <th className='p-4'>Service</th>
                                    <th className='p-4'>Personnel</th>
                                    <th className='p-4'>Date</th>
                                    <th className='p-4'>Heure</th>
                                    <th className='p-4'>Statut</th>
                                    <th className='p-4 text-center'>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allSorted.length > 0 ? (
                                    allSorted.map(app => renderAppointmentRow(app))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className='text-center py-10 text-gray-500 italic'>
                                            Aucun rendez-vous trouvé.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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

                                {rejectionModal && (
                                    <div className='modal modal-open'>
                                        <div className='modal-box max-w-md'>
                                            <h3 className='font-bold text-lg mb-4 text-error'>Rejeter le rendez-vous</h3>
                                            <div className='form-control'>
                                                <label className='label'>Motif du refus (optionnel)</label>
                                                <textarea 
                                                    className='textarea textarea-bordered' 
                                                    value={rejectionModal.note}
                                                    onChange={e => setRejectionModal({...rejectionModal, note: e.target.value})}
                                                    placeholder="Expliquez pourquoi le rendez-vous est rejeté..."
                                                ></textarea>
                                            </div>
                                            <div className='modal-action'>
                                                <button type='button' className='btn' onClick={() => setRejectionModal(null)}><X className='w-4' /> Annuler</button>
                                                <button type='button' className='btn btn-error text-white' onClick={handleConfirmRejection}>Confirmer le refus</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

            </div>
        </Wrapper>
    )
}

export default AdminAppointments

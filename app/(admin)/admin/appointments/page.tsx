"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '@/app/components/Wrapper'
import Notification from '@/app/components/Notification'
import Image from 'next/image'
import { Calendar, Clock, User, Trash2, Edit3, CheckCircle2, Clock4, Search, X, Save, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import dayjs from 'dayjs'

interface Appointment {
  id: string;
  user: { givenName: string | null; familyName: string | null; fullName: string | null; email: string };
  service: { name: string; id: string };
  staff: { name: string; id: string };
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  imageUrl?: string;
}

interface Service {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  name: string;
}

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const DAYS_SHORT_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAYS_FULL_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

const AdminAppointments = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [staff, setStaff] = useState<Staff[]>([])
    const [loading, setLoading] = useState(true)
    const [notification, setNotification] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [rejectionModal, setRejectionModal] = useState<{ id: string, note: string } | null>(null)

    // State for the calendar view
    const [currentMonth, setCurrentMonth] = useState(dayjs())
    const [selectedDate, setSelectedDate] = useState(dayjs())

    // State for editing
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
    const [editFormData, setEditFormData] = useState<Record<string, unknown>>({})

    const closeNotification = () => setNotification("")

    const fetchData = async () => {
        try {
            const [appRes, serRes, stfRes] = await Promise.all([
                fetch(`/api/admin/appointments`),
                fetch(`/api/services`),
                fetch(`/api/staff`)
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
        } catch (error) {
            console.error(error)
            setNotification(error instanceof Error ? error.message : 'Erreur lors du chargement des données')
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
        } catch {
            setNotification('Erreur serveur')
        }
    }

    const openEditModal = (app: Appointment) => {
        const formattedDate = parseAppointmentDate(app.appointmentDate).format('YYYY-MM-DD')

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
        } catch {
            setNotification('Erreur serveur')
        }
    }

    useEffect(() => {
        fetchData();

        const interval = setInterval(() => {
            fetchData();
        }, 30000);

        return () => clearInterval(interval);
    }, [])


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
        } catch {
            setNotification('Erreur serveur')
        }
    }

    const handleConfirmRejection = async () => {
        if (!rejectionModal) return;
        await handleUpdateStatus(rejectionModal.id, 'REJECTED', rejectionModal.note);
        setRejectionModal(null);
    }

    // --- Date helpers ---

    // Handles both "DD/MM/YYYY" and "YYYY-MM-DD" formats
    const parseAppointmentDate = (dateStr: string) => {
        if (!dateStr) return dayjs.invalid()

        if (dateStr.includes('/')) {
            const [day, month, year] = dateStr.split('/')
            const paddedDay = (day || '01').padStart(2, '0')
            const paddedMonth = (month || '01').padStart(2, '0')
            const paddedYear = year || '1970'
            return dayjs(`${paddedYear}-${paddedMonth}-${paddedDay}`)
        }

        return dayjs(dateStr)
    }

    const isAppointmentPast = (app: Appointment) => {
        const appDate = parseAppointmentDate(app.appointmentDate)
        const appointmentDateTime = dayjs(`${appDate.format('YYYY-MM-DD')} ${app.startTime}`)
        return appointmentDateTime.isBefore(dayjs())
    }

    const isAppointmentPending = (app: Appointment) => {
        if (app.status === 'CONFIRMED' || app.status === 'REJECTED') return false
        return !isAppointmentPast(app)
    }

    const getAppointmentsForDate = (date: dayjs.Dayjs) => {
        return filteredAppointments
            .filter(app => parseAppointmentDate(app.appointmentDate).isSame(date, 'day'))
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
    }

    // --- Render helpers ---

    const renderStatusBadge = (app: Appointment, isPast: boolean) => {
        if (app.status === 'CONFIRMED') {
            return (
                <div className='flex items-center gap-1 text-success font-semibold text-xs'>
                    <CheckCircle2 className='w-3.5 h-3.5' /> Confirmé
                </div>
            )
        }
        if (app.status === 'REJECTED') {
            return (
                <div className='flex items-center gap-1 text-error font-semibold text-xs'>
                    <X className='w-3.5 h-3.5' /> Rejeté
                </div>
            )
        }
        if (!isPast) {
            return (
                <div className='flex items-center gap-1 text-warning font-semibold text-xs'>
                    <Clock4 className='w-3.5 h-3.5' /> En attente
                </div>
            )
        }
        return (
            <div className='flex items-center gap-1 text-gray-400 font-semibold text-xs'>
                <CheckCircle2 className='w-3.5 h-3.5' /> Passé
            </div>
        )
    }

    const renderAppointmentCard = (app: Appointment) => {
        const isPast = isAppointmentPast(app)

        return (
            <div key={app.id} className={`border border-base-200 rounded-lg p-4 bg-white ${isPast ? 'opacity-60' : ''}`}>
                <div className='flex justify-between items-start gap-2 mb-2'>
                    <div>
                        <p className='font-semibold'>{app.user?.fullName || app.user?.givenName || 'Client'}</p>
                        <p className='text-xs text-gray-400'>{app.user?.email}</p>
                    </div>
                    {renderStatusBadge(app, isPast)}
                </div>

                <div className='flex items-center gap-2 text-sm text-gray-600 mb-1'>
                    <Clock className='w-4 h-4' /> {app.startTime} - {app.endTime}
                </div>
                <div className='text-sm text-gray-700 font-medium mb-1'>
                    {app.service?.name}
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <User className='w-4 h-4' /> {app.staff?.name || 'Non assigné'}
                </div>

                {app.notes && (
                    <p className='text-xs text-base-content/60 italic mt-2 flex items-center gap-1'>
                        <FileText className='w-3 h-3' /> {app.notes}
                    </p>
                )}
                {app.imageUrl && (
                    <Image src={app.imageUrl} alt='Photo du service' width={80} height={80} className='rounded mt-2 object-cover w-20 h-20' />
                )}

                {!isPast && (
                    <div className='flex flex-wrap gap-2 pt-3 mt-3 border-t border-base-200'>
                        <button
                            onClick={() => handleUpdateStatus(app.id, 'CONFIRMED')}
                            className='btn btn-xs btn-outline text-success gap-1'
                            title="Confirmer"
                        >
                            <CheckCircle2 className='w-3.5 h-3.5' /> Confirmer
                        </button>
                        <button
                            onClick={() => setRejectionModal({ id: app.id, note: '' })}
                            className='btn btn-xs btn-outline text-error gap-1'
                            title="Rejeter"
                        >
                            <X className='w-3.5 h-3.5' /> Rejeter
                        </button>
                        <button
                            onClick={() => openEditModal(app)}
                            className='btn btn-xs btn-outline text-primary gap-1'
                            title="Modifier"
                        >
                            <Edit3 className='w-3.5 h-3.5' /> Modifier
                        </button>
                        <button
                            onClick={() => handleCancelAppointment(app.id)}
                            className='btn btn-xs btn-ghost text-error gap-1'
                            title="Annuler"
                        >
                            <Trash2 className='w-3.5 h-3.5' /> Annuler
                        </button>
                    </div>
                )}
            </div>
        )
    }

    const renderCalendar = () => {
        const startOfMonth = currentMonth.startOf('month')
        const daysInMonth = currentMonth.daysInMonth()
        // Monday = 0 ... Sunday = 6
        const firstDayOffset = (startOfMonth.day() + 6) % 7
        const totalCells = Math.ceil((daysInMonth + firstDayOffset) / 7) * 7

        const cells = []
        for (let i = 0; i < totalCells; i++) {
            const dayNumber = i - firstDayOffset + 1
            const date = startOfMonth.add(dayNumber - 1, 'day')
            cells.push({ date, isCurrentMonth: dayNumber >= 1 && dayNumber <= daysInMonth })
        }

        return (
            <div className='bg-white rounded-xl shadow-sm border border-base-200 p-4'>
                <div className='flex items-center justify-between mb-4'>
                    <button
                        onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
                        className='btn btn-ghost btn-sm btn-circle'
                        title="Mois précédent"
                    >
                        <ChevronLeft className='w-5 h-5' />
                    </button>
                    <div className='flex flex-col items-center'>
                        <h2 className='font-bold text-lg capitalize'>{MONTHS_FR[currentMonth.month()]} {currentMonth.year()}</h2>
                        <button
                            onClick={() => { setCurrentMonth(dayjs()); setSelectedDate(dayjs()) }}
                            className='text-xs text-primary hover:underline'
                        >
                            Aujourd&apos;hui
                        </button>
                    </div>
                    <button
                        onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
                        className='btn btn-ghost btn-sm btn-circle'
                        title="Mois suivant"
                    >
                        <ChevronRight className='w-5 h-5' />
                    </button>
                </div>

                <div className='grid grid-cols-7 gap-1 mb-1'>
                    {DAYS_SHORT_FR.map(d => (
                        <div key={d} className='text-center text-xs font-semibold text-gray-400 py-1'>
                            {d}
                        </div>
                    ))}
                </div>

                <div className='grid grid-cols-7 gap-1'>
                    {cells.map(({ date, isCurrentMonth }) => {
                        const dayApps = getAppointmentsForDate(date)
                        const isSelected = date.isSame(selectedDate, 'day')
                        const isToday = date.isSame(dayjs(), 'day')
                        const hasPending = dayApps.some(isAppointmentPending)

                        let cellClasses = 'relative flex flex-col items-center justify-center aspect-square rounded-lg text-sm font-medium transition-colors w-full '
                        if (!isCurrentMonth) cellClasses += 'text-gray-300 '
                        else cellClasses += 'text-gray-700 '

                        if (isSelected) cellClasses += 'bg-primary text-white '
                        else if (isToday) cellClasses += 'border-2 border-primary '
                        else cellClasses += 'hover:bg-base-200 '

                        const dotClass = isSelected ? 'bg-white' : (hasPending ? 'bg-warning' : 'bg-primary')

                        return (
                            <button
                                key={date.format('YYYY-MM-DD')}
                                onClick={() => setSelectedDate(date)}
                                className={cellClasses}
                            >
                                <span>{date.date()}</span>
                                {dayApps.length > 0 && (
                                    <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    const filteredAppointments = appointments.filter(app => {
        const fullName = (app.user?.fullName || `${app.user?.givenName || ''} ${app.user?.familyName || ''}`).toLowerCase();
        const email = app.user?.email.toLowerCase() || '';
        return fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    });

    const selectedDateAppointments = getAppointmentsForDate(selectedDate)

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
                    <div className='grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start'>
                        {renderCalendar()}

                        <div className='bg-white rounded-xl shadow-sm border border-base-200 p-4'>
                            <div className='flex items-center gap-2 mb-1'>
                                <Calendar className='w-5 h-5 text-primary' />
                                <h3 className='font-bold text-lg capitalize'>
                                    {DAYS_FULL_FR[(selectedDate.day() + 6) % 7]} {selectedDate.date()} {MONTHS_FR[selectedDate.month()]} {selectedDate.year()}
                                </h3>
                            </div>
                            <p className='text-sm text-gray-500 mb-4'>
                                {selectedDateAppointments.length} rendez-vous
                            </p>

                            {selectedDateAppointments.length > 0 ? (
                                <div className='flex flex-col gap-3'>
                                    {selectedDateAppointments.map(app => renderAppointmentCard(app))}
                                </div>
                            ) : (
                                <p className='text-center text-gray-400 italic py-10'>
                                    Aucun rendez-vous ce jour-là.
                                </p>
                            )}
                        </div>
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

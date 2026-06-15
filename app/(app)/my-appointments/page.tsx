"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '@/app/components/Wrapper'
import Notification from '@/app/components/Notification'
import { Calendar, CheckCircle2, Clock4, Edit3, Trash2, X, Save } from 'lucide-react'
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs'

interface Appointment {
  id: string;
  service: { name: string };
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  rejectionNote?: string;
}

const MyAppointments = () => {
  const { user } = useKindeBrowserClient()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState('')
  const closeNotification = () => setNotification("")

  // State for editing
  const [isEditing, setIsEditing] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [editFormData, setEditFormData] = useState({
    appointmentDate: '',
    startTime: '',
    endTime: ''
  })

  const fetchMyAppointments = async () => {
    if (!user?.email) return

    try {
      const response = await fetch(`/api/appointments?email=${user.email}`)
      if (!response.ok) throw new Error('Erreur lors de la récupération')
      const data = await response.json()
      setAppointments(data.appointments || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyAppointments()
  }, [user?.email])

  const handleCancel = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return

    try {
      const response = await fetch('/api/appointments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        setNotification('Rendez-vous annulé.')
        fetchMyAppointments()
      } else {
        setNotification('Erreur lors de l\'annulation.')
      }
    } catch (err) {
      setNotification('Erreur serveur.')
    }
  }

  const openEditModal = (app: Appointment) => {
    setEditingAppointment(app)
    setEditFormData({
      appointmentDate: app.appointmentDate,
      startTime: app.startTime,
      endTime: app.endTime
    })
    setIsEditing(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAppointment) return

    try {
      const response = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAppointment.id,
          ...editFormData
        })
      })

      if (response.ok) {
        setNotification('Rendez-vous mis à jour.')
        setIsEditing(false)
        setEditingAppointment(null)
        fetchMyAppointments()
      } else {
        const errorData = await response.json()
        setNotification(errorData.message || 'Erreur lors de la mise à jour.')
      }
    } catch (err) {
      setNotification('Erreur serveur.')
    }
  }

  const isActionDisabled = (date: string, time: string) => {
    const [day, month, year] = date.split('/');
    const isoDate = `${year}-${month}-${day}`;
    const appointmentDateTime = new Date(`${isoDate}T${time}`);
    const now = new Date();
    const diffInMs = now.getTime() - appointmentDateTime.getTime();
    const fiveHoursInMs = 5 * 60 * 60 * 1000;
    return diffInMs > fiveHoursInMs;
  }

  const getStatusIcon = (date: string, time: string) => {
    const [day, month, year] = date.split('/');
    const isoDate = `${year}-${month}-${day}`;
    const appointmentDateTime = new Date(`${isoDate}T${time}`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return appointmentDateTime < today ? <CheckCircle2 className='w-5 h-5 text-success' /> : <Clock4 className='w-5 h-5 text-warning' />
  }

  const renderAppointmentCard = (app: Appointment, isPast: boolean) => {
    const disabled = isActionDisabled(app.appointmentDate, app.startTime);
    return (
      <div key={app.id} className={`bg-white p-4 rounded-xl shadow-sm border border-base-200 flex justify-between items-center ${isPast ? 'opacity-50 grayscale' : ''} ${disabled ? 'opacity-60' : ''}`}>
        <div className='flex items-center gap-4'>
          <div className='bg-secondary/10 p-3 rounded-full text-secondary'>
            <Calendar className='w-5 h-5' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <p className='font-bold'>{app.service.name}</p>
              <span className={`badge badge-sm ${
                app.status === 'CONFIRMED' ? 'badge-success' : 
                app.status === 'REJECTED' ? 'badge-error' : 
                'badge-ghost'
              }`}>
                {app.status === 'CONFIRMED' ? 'Confirmé' : app.status === 'REJECTED' ? 'Rejeté' : 'En attente'}
              </span>
            </div>
            <p className='text-sm text-gray-500'>{app.appointmentDate}</p>
            {app.status === 'REJECTED' && app.rejectionNote && (
              <p className='text-xs text-error italic mt-1'>Note: {app.rejectionNote}</p>
            )}
          </div>
        </div>
        <div className='flex items-center gap-6'>
          <div className='text-right'>
            <p className='font-semibold'>{app.startTime} - {app.endTime}</p>
          </div>
          {!isPast && (
            <div className='flex gap-2'>
              <button 
                onClick={() => openEditModal(app)} 
                disabled={disabled}
                className='btn btn-ghost btn-sm text-primary disabled:text-gray-400'
              >
                <Edit3 className='w-4' />
              </button>
              <button 
                onClick={() => handleCancel(app.id)} 
                disabled={disabled}
                className='btn btn-ghost btn-sm text-error disabled:text-gray-400'
              >
                <Trash2 className='w-4' />
              </button>
            </div>
          )}
          {getStatusIcon(app.appointmentDate, app.startTime)}
        </div>
      </div>
    )
  }

  return (
    <Wrapper>
      {notification && <Notification message={notification} onclose={closeNotification} />}
      <div className='p-5'>
        <h1 className='text-2xl font-bold mb-6'>Mes Rendez-vous</h1>

        {loading ? (
          <div className='text-center mt-32'><span className="loading loading-spinner loading-lg"></span></div>
        ) : appointments.length > 0 ? (
          <div className='space-y-8'>
            <div>
              <h2 className='text-lg font-semibold mb-4 text-secondary'>À venir</h2>
              <div className='grid grid-cols-1 gap-4'>
                {appointments
                  .filter(app => {
                    const [day, month, year] = app.appointmentDate.split('/');
                    const isoDate = `${year}-${month}-${day}`;
                    return new Date(`${isoDate}T${app.startTime}`) >= new Date();
                  })
                  .map(app => renderAppointmentCard(app, false))}
              </div>
            </div>

            {appointments.some(app => {
                const [day, month, year] = app.appointmentDate.split('/');
                const isoDate = `${year}-${month}-${day}`;
                return new Date(`${isoDate}T${app.startTime}`) < new Date();
            }) && (
              <div>
                <h2 className='text-lg font-semibold mb-4 text-gray-400'>Passés</h2>
                <div className='grid grid-cols-1 gap-4'>
                  {appointments
                    .filter(app => {
                      const [day, month, year] = app.appointmentDate.split('/');
                      const isoDate = `${year}-${month}-${day}`;
                      return new Date(`${isoDate}T${app.startTime}`) < new Date();
                    })
                    .map(app => renderAppointmentCard(app, true))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className='text-center py-20 bg-base-200 rounded-2xl'>
            <Calendar className='w-12 h-12 mx-auto text-gray-400 mb-4' />
            <p className='text-gray-500'>Vous n'avez aucun rendez-vous prévu.</p>
          </div>
        )}

        {/* Edit Modal */}
        {isEditing && editingAppointment && (
          <div className='modal modal-open'>
            <div className='modal-box'>
              <h3 className='font-bold text-lg mb-4'>Modifier le rendez-vous</h3>
              <form onSubmit={handleUpdate} className='flex flex-col gap-4'>
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
                <div className='modal-action'>
                  <button type='button' className='btn' onClick={() => setIsEditing(false)}><X className='w-4' /> Annuler</button>
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

export default MyAppointments


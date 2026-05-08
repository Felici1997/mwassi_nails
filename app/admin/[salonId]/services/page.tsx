"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '@/app/components/Wrapper'
import Notification from '@/app/components/Notification'
import { Trash2, Edit3, Save, X, PlusCircle } from 'lucide-react'
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs'

const ManageServices = ({ params }: { params: { salonId: string } }) => {
    const { user } = useKindeBrowserClient()
    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [editingService, setEditingService] = useState<any>(null)
    const [notification, setNotification] = useState('')
    
    // State for creating a new service
    const [isCreating, setIsCreating] = useState(false)
    const [newService, setNewService] = useState({
        name: '',
        price: '',
        duration: '',
        category: '',
        description: ''
    })
    
    const closeNotification = () => setNotification("")
    
    const fetchServices = async () => {
        try {
            const response = await fetch(`/api/services?salonId=${params.salonId}`)
            const data = await response.json()
            setServices(data.services)
            setLoading(false)
        } catch (err) {
            console.error(err)
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchServices()
    }, [params.salonId])

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch('/api/services/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingService)
            })

            if (response.ok) {
                setNotification('Service mis à jour avec succès !')
                setEditingService(null)
                fetchServices()
            } else {
                setNotification('Erreur lors de la mise à jour')
            }
        } catch (err) {
            setNotification('Erreur serveur')
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newService.name,
                    price: newService.price,
                    duration: newService.duration,
                    category: newService.category,
                    description: newService.description
                })
            })

            if (response.ok) {
                setNotification('Service créé avec succès !')
                setIsCreating(false)
                setNewService({ name: '', price: '', duration: '', category: '', description: '' })
                fetchServices()
            } else {
                const result = await response.json()
                setNotification(result.message || 'Erreur lors de la création')
            }
        } catch (err) {
            setNotification('Erreur serveur')
        }
    }

    if (loading) return <Wrapper><div className='text-center mt-32'><span className="loading loading-spinner loading-lg"></span></div></Wrapper>

    return (
        <Wrapper>
            {notification && <Notification message={notification} onclose={closeNotification} />}
            <div className='p-5'>
                <div className='flex justify-between items-center mb-6'>
                    <h1 className='text-2xl font-bold'>Gestion des Services</h1>
                    <button onClick={() => setIsCreating(true)} className='btn btn-secondary flex items-center gap-2'>
                        <PlusCircle className='w-4' /> Ajouter un Service
                    </button>
                </div>
                
                <div className='overflow-x-auto'>
                    <table className='table w-full'>
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Prix</th>
                                <th>Durée</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map(service => (
                                <tr key={service.id}>
                                    <td>
                                        <div className='font-bold'>{service.name}</div>
                                        <div className='text-xs text-gray-400'>{service.category}</div>
                                    </td>
                                    <td>{service.price} FCFA</td>
                                    <td>{service.duration} min</td>
                                    <td className='flex gap-2'>
                                        <button onClick={() => setEditingService(service)} className='btn btn-sm btn-ghost'><Edit3 className='w-4' /></button>
                                        <button className='btn btn-sm btn-ghost text-error'><Trash2 className='w-4' /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {editingService && (
                    <div className='modal modal-open'>
                        <div className='modal-box'>
                            <h3 className='font-bold text-lg mb-4'>Modifier le Service</h3>
                            <form onSubmit={handleUpdate} className='flex flex-col gap-4'>
                                <div className='form-control'>
                                    <label className='label'>Nom</label>
                                    <input 
                                        className='input input-bordered' 
                                        value={editingService.name} 
                                        onChange={e => setEditingService({...editingService, name: e.target.value})}
                                    />
                                </div>
                                <div className='form-control'>
                                    <label className='label'>Prix (FCFA)</label>
                                    <input 
                                        type='number' 
                                        className='input input-bordered' 
                                        value={editingService.price} 
                                        onChange={e => setEditingService({...editingService, price: e.target.value})}
                                    />
                                </div>
                                <div className='form-control'>
                                    <label className='label'>Durée (min)</label>
                                    <input 
                                        type='number' 
                                        className='input input-bordered' 
                                        value={editingService.duration} 
                                        onChange={e => setEditingService({...editingService, duration: e.target.value})}
                                    />
                                </div>
                                <div className='modal-action'>
                                    <button type='button' className='btn' onClick={() => setEditingService(null)}><X className='w-4' /> Annuler</button>
                                    <button type='submit' className='btn btn-secondary'><Save className='w-4' /> Enregistrer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isCreating && (
                    <div className='modal modal-open'>
                        <div className='modal-box'>
                            <h3 className='font-bold text-lg mb-4'>Ajouter un nouveau Service</h3>
                            <form onSubmit={handleCreate} className='flex flex-col gap-4'>
                                <div className='form-control'>
                                    <label className='label'>Nom du service</label>
                                    <input 
                                        className='input input-bordered' 
                                        value={newService.name} 
                                        onChange={e => setNewService({...newService, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className='form-control'>
                                    <label className='label'>Catégorie</label>
                                    <select 
                                        className='select select-bordered' 
                                        value={newService.category} 
                                        onChange={e => setNewService({...newService, category: e.target.value})}
                                    >
                                        <option value=''>Sélectionner...</option>
                                        <option value='Ongles Naturels'>Ongles Naturels</option>
                                        <option value='Construction Chablon'>Construction Chablon</option>
                                        <option value='Construction Pop it'>Construction Pop it</option>
                                        <option value='Sur Capsules'>Sur Capsules</option>
                                        <option value='Soins'>Soins</option>
                                        <option value='Nail Art'>Nail Art</option>
                                        <option value='Dépose'>Dépose</option>
                                        <option value='Renforcement'>Renforcement</option>
                                    </select>
                                </div>
                                <div className='flex gap-4'>
                                    <div className='form-control flex-1'>
                                        <label className='label'>Prix (FCFA)</label>
                                        <input 
                                            type='number' 
                                            className='input input-bordered' 
                                            value={newService.price} 
                                            onChange={e => setNewService({...newService, price: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className='form-control flex-1'>
                                        <label className='label'>Durée (min)</label>
                                        <input 
                                            type='number' 
                                            className='input input-bordered' 
                                            value={newService.duration} 
                                            onChange={e => setNewService({...newService, duration: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className='form-control'>
                                    <label className='label'>Description</label>
                                    <textarea 
                                        className='textarea textarea-bordered' 
                                        value={newService.description} 
                                        onChange={e => setNewService({...newService, description: e.target.value})}
                                    ></textarea>
                                </div>
                                <div className='modal-action'>
                                    <button type='button' className='btn' onClick={() => setIsCreating(false)}><X className='w-4' /> Annuler</button>
                                    <button type='submit' className='btn btn-secondary'><Save className='w-4' /> Créer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Wrapper>
    )
}

export default ManageServices

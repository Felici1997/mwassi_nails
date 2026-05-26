"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '@/app/components/Wrapper'
import Notification from '@/app/components/Notification'
import { Trash2, Edit3, Save, X, UserPlus, Search } from 'lucide-react'

interface StaffMember {
  id: string;
  name: string;
  userId: string;
  user: {
    givenName: string | null;
    familyName: string | null;
    email: string;
  };
}

interface UserListItem {
  id: string;
  email: string;
  givenName: string | null;
  familyName: string | null;
}

const ManageStaff = ({ params }: { params: { salonId: string } }) => {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(true)
    const [notification, setNotification] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    
    // State for creating a new staff member
  const [isCreating, setIsCreating] = useState(false)
  const [newStaff, setNewStaff] = useState({
    name: '',
    userId: ''
  })

  // State for editing an existing staff member
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)

  const fetchStaff = async () => {
    try {
      const response = await fetch(`/api/staff?salonId=${params.salonId}`)
      const data = await response.json()
      setStaff(data.staff)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data.users)
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  useEffect(() => {
    fetchStaff()
    fetchUsers()
  }, [params.salonId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStaff.name,
          salonId: params.salonId,
          userId: newStaff.userId
        })
      })

      if (response.ok) {
        setNotification('Membre ajouté avec succès !')
        setIsCreating(false)
        setNewStaff({ name: '', userId: '' })
        fetchStaff()
      } else {
        const result = await response.json()
        setNotification(result.message || 'Erreur lors de la création')
      }
    } catch (err) {
      setNotification('Erreur serveur')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStaff) return

    try {
      const response = await fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingStaff.id,
          name: editingStaff.name
        })
      })

      if (response.ok) {
        setNotification('Membre mis à jour !')
        setEditingStaff(null)
        fetchStaff()
      } else {
        setNotification('Erreur lors de la mise à jour')
      }
    } catch (err) {
      setNotification('Erreur serveur')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce membre ?')) return

    try {
      const response = await fetch('/api/staff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        setNotification('Membre supprimé !')
        fetchStaff()
      } else {
        setNotification('Erreur lors de la suppression')
      }
    } catch (err) {
      setNotification('Erreur serveur')
    }
  }

    const filteredStaff = staff.filter(member => 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <Wrapper><div className='text-center mt-32'><span className="loading loading-spinner loading-lg"></span></div></Wrapper>
    
    return (
        <Wrapper>
            {notification && <Notification message={notification} onclose={closeNotification} />}
            <div className='p-5'>
                <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6'>
                    <h1 className='text-2xl font-bold'>Gestion du Personnel</h1>
                    <div className='flex gap-2 w-full md:w-auto'>
                        <div className='relative w-full md:w-80'>
                            <input 
                                type="text" 
                                placeholder="Rechercher un membre..." 
                                className='input input-bordered w-full pl-10'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search className='absolute left-3 top-3 w-4 h-4 text-gray-400' />
                        </div>
                        <button onClick={() => setIsCreating(true)} className='btn btn-secondary flex items-center gap-2'>
                            <UserPlus className='w-4' /> Ajouter
                        </button>
                    </div>
                </div>
                
                <div className='overflow-x-auto bg-white rounded-xl shadow-sm border border-base-200'>
                    <table className='table table-zebra w-full'>
                        <thead className='bg-base-200'>
                            <tr>
                                <th className='p-4'>Nom</th>
                                <th className='p-4'>Email</th>
                                <th className='p-4 text-center'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStaff.length > 0 ? (
                                filteredStaff.map(member => (
                                    <tr key={member.id}>
                                        <td className='p-4'>
                                            <div className='font-bold'>{member.name}</div>
                                        </td>
                                        <td className='p-4'>
                                            <div className='text-sm text-gray-500'>{member.user.email}</div>
                                        </td>
                                        <td className='p-4 flex justify-center gap-2'>
                                            <button onClick={() => setEditingStaff(member)} className='btn btn-ghost btn-xs text-primary'><Edit3 className='w-4' /></button>
                                            <button onClick={() => handleDelete(member.id)} className='btn btn-ghost btn-xs text-error'><Trash2 className='w-4' /></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className='text-center py-10 text-gray-500 italic'>
                                        Aucun membre trouvé.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>


        {/* Modal Create */}
        {isCreating && (
          <div className='modal modal-open'>
            <div className='modal-box'>
              <h3 className='font-bold text-lg mb-4'>Ajouter un nouveau membre</h3>
              <form onSubmit={handleCreate} className='flex flex-col gap-4'>
                <div className='form-control'>
                  <label className='label'>Nom d'affichage</label>
                  <input 
                    className='input input-bordered' 
                    value={newStaff.name} 
                    onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                    required
                  />
                </div>
                <div className='form-control'>
                  <label className='label'>Sélectionner un utilisateur existant</label>
                  <select 
                    className='select select-bordered'
                    value={newStaff.userId}
                    onChange={e => setNewStaff({...newStaff, userId: e.target.value})}
                    required
                  >
                    <option value="">Sélectionnez un utilisateur...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.givenName} {u.familyName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className='modal-action'>
                  <button type='button' className='btn' onClick={() => setIsCreating(false)}><X className='w-4' /> Annuler</button>
                  <button type='submit' className='btn btn-secondary'><Save className='w-4' /> Créer</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit */}
        {editingStaff && (
          <div className='modal modal-open'>
            <div className='modal-box'>
              <h3 className='font-bold text-lg mb-4'>Modifier le membre</h3>
              <form onSubmit={handleUpdate} className='flex flex-col gap-4'>
                <div className='form-control'>
                  <label className='label'>Nom d'affichage</label>
                  <input 
                    className='input input-bordered' 
                    value={editingStaff.name} 
                    onChange={e => setEditingStaff({...editingStaff, name: e.target.value})}
                    required
                  />
                </div>
                <div className='modal-action'>
                  <button type='button' className='btn' onClick={() => setEditingStaff(null)}><X className='w-4' /> Annuler</button>
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

export default ManageStaff

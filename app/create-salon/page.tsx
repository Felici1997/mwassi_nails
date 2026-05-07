"use client"

import React, { useEffect, useState } from 'react'
import Wrapper from '../components/Wrapper'
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs'
import Notification from '../components/Notification'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'

export interface Salon {
    id: string;
    name: string;
}


const Page = () => {
    const { user } = useKindeBrowserClient();
    const [salonName, setSalonName] = useState('')
    const [loading, setLoading] = useState(true)
    const [salons, setSalons] = useState<Salon[] | null>(null)


    const [notification, setNotification] = useState<string>('')
    const closeNotification = () => {
        setNotification("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!salonName) {
            setNotification('Le nom du salon est requis')
            return
        }
        try {
            const response = await fetch('/api/salons', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user?.email,
                    salonName: salonName
                })
            })

            if (!response.ok) {
                const { message } = await response.json()
                setNotification(message)
                return
            }

            setNotification('Salon créé avec succès !')
            fetchSalons()
            setSalonName('')

        } catch (error) {
            console.error(error)
            setNotification('Erreur interne du serveur')
        }
    }

    const fetchSalons = async () => {
        try {
            if (user?.email) {
                const response = await fetch(`/api/salons?email=${user.email}`, {
                    method: 'GET'
                })

                if (!response.ok) {
                    const { message } = await response.json()
                    throw new Error(message)
                }

                const data = await response.json()
                setSalons(data.salons)
                setLoading(false)
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchSalons()
    } , [user])

    const handleDelete = async (salonId : string) => {
        if(confirm('Voulez-vous vraiment supprimer ce salon ?')){
              try {
                const response = await fetch('/api/salons' , {
                    method : 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      id : salonId
                    })
                })

                if (!response.ok) {
                    const { message } = await response.json()
                    setNotification(message)
                    return
                }
    
                setNotification('Salon supprimé avec succès !')
                fetchSalons()
                
              } catch (error) {
                  console.error(error)
                  setNotification('Erreur interne du serveur.');
              }
        }
    }

    return (
        <Wrapper>

            {notification && (
                <Notification message={notification} onclose={closeNotification}></Notification>
            )}
            <div>
                <h1 className=' text-2xl  mb-4'>Créer un salon d'onglerie</h1>
                <form onSubmit={handleSubmit} >
                    <div className='mb-4 flex flex-row'>
                        <input
                            type="text"
                            id='salonName'
                            value={salonName}
                            onChange={(e) => setSalonName(e.target.value)}
                            placeholder="Nom du salon"
                            required
                            className='input input-bordered  maw-w-xs'
                        />
                        <button
                            type='submit'
                            className='btn btn-secondary ml-2'
                        >
                            Créer le salon
                        </button>

                    </div>
                </form>

                <h1 className=' text-2xl  mb-4 font-bold'>Mes salons</h1>

                {loading ? (
                    <div className='text-center mt-32'>
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>

                ) : salons && salons.length > 0 ? (
                    <ul className='list-decimal divide-base-200 divide-y'>

                        {salons.map((salon) => (
                            <li key={salon.id} className='py-4 flex flex-col md:flex-row md:items-center justify-between'>
                                <div className="badge badge-secondary badge-outline mb-2 md:mb-0">{salon.name}</div>
                                <div className='flex items-center'>
                                    <Link href={`staff/${salon.id}`} className='btn mr-2 btn-sm btn-outline btn-secondary'>Ajouter du personnel</Link>
                                    <Link href={`services/${salon.id}`} className='btn mr-2 btn-sm btn-outline btn-secondary'>Ajouter des services</Link>
                                    <button 
                                       className='btn btn-sm'
                                       onClick={() => handleDelete(salon.id)}
                                    
                                    >
                                       <Trash2 className='w-4'/>
                                    </button>
                                </div>
                                
                            </li>
                        ))}

                    </ul>
                ) : (
                    <p>Aucun salon trouvé.</p>
                )}

            </div>
        </Wrapper>
    )
}

export default Page;

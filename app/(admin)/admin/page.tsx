"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '@/app/components/Wrapper'
import Link from 'next/link'
import { LayoutDashboard, Scissors, CalendarDays, Users, Monitor } from 'lucide-react'


interface Stats {
    totalServices: number;
    appointmentsToday: number;
    totalRevenue: number;
}

const AdminDashboard = () => {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
 
    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats')
            const data = await response.json()
            setStats(data)
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }
 
    useEffect(() => {
        fetchStats()
    }, [])
 
    return (
        <Wrapper>
            <div className='p-5'>
                <h1 className='text-3xl font-bold mb-8'>Tableau de Bord Administrateur</h1>
                
                <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                    <Link href={`/admin/board`} className='p-6 bg-zinc-900 text-yellow-400 rounded-2xl shadow-lg hover:scale-105 transition-transform flex flex-col items-center text-center border-2 border-yellow-500'>
                        <Monitor className='w-12 h-12 mb-4' />
                        <h2 className='text-xl font-bold'>Tableau d'affichage</h2>
                        <p className='text-sm opacity-80'>Vue Aéroport (TV/Tablette)</p>
                    </Link>
                    <Link href={`/admin/appointments`} className='p-6 bg-secondary text-white rounded-2xl shadow-lg hover:scale-105 transition-transform flex flex-col items-center text-center'>
                        <CalendarDays className='w-12 h-12 mb-4' />
                        <h2 className='text-xl font-bold'>Gérer les RDV</h2>
                        <p className='text-sm opacity-80'>Voir et modifier tous les rendez-vous</p>
                    </Link>
                    <Link href={`/admin/services`} className='p-6 bg-white border-2 border-secondary text-secondary rounded-2xl shadow-lg hover:scale-105 transition-transform flex flex-col items-center text-center'>
                        <Scissors className='w-12 h-12 mb-4' />
                        <h2 className='text-xl font-bold'>Gérer les Services</h2>
                        <p className='text-sm text-gray-500'>Modifier les tarifs et durations</p>
                    </Link>
                    <Link href={`/admin/staff`} className='p-6 bg-white border-2 border-secondary text-secondary rounded-2xl shadow-lg hover:scale-105 transition-transform flex flex-col items-center text-center'>
                        <Users className='w-12 h-12 mb-4' />
                        <h2 className='text-xl font-bold'>Gérer le Personnel</h2>
                        <p className='text-sm text-gray-500'>Ajouter ou modifier les employées</p>
                    </Link>
                </div>
 
 
                <div className='mt-12 p-6 bg-base-200 rounded-2xl'>
                    <h3 className='text-xl font-bold mb-4'>Statistiques Rapides</h3>
                    {loading ? (
                        <div className='flex justify-center py-4'><span className="loading loading-spinner loading-md"></span></div>
                    ) : (
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div className='p-4 bg-white rounded-xl shadow-sm'>
                                <p className='text-gray-500 text-sm'>Total Services</p>
                                <p className='text-2xl font-bold'>{stats?.totalServices ?? 0}</p>
                            </div>
                            <div className='p-4 bg-white rounded-xl shadow-sm'>
                                <p className='text-gray-500 text-sm'>RDV Aujourd'hui</p>
                                <p className='text-2xl font-bold'>{stats?.appointmentsToday ?? 0}</p>
                            </div>
                            <div className='p-4 bg-white rounded-xl shadow-sm'>
                                <p className='text-gray-500 text-sm'>Chiffre d'affaires estimé</p>
                                <p className='text-2xl font-bold'>{stats?.totalRevenue?.toLocaleString() ?? 0} Fcfa</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Wrapper>
    )
}

export default AdminDashboard

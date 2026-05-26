"use client";

import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs'
import { CalendarCheck, Menu, X } from 'lucide-react'
import Link from 'next/link';
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";

const Navbar = () => {
    const { user } = useKindeBrowserClient()
    const pathname = usePathname();
    const [loading, setLoading] = useState<boolean>(true)
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)
    const [role, setRole] = useState<string | null>(null)

    useEffect(() => {
        if (user?.email === 'mrpfouapo@gmail.com') {
            setRole('ADMIN');
            setLoading(false);
        } else if (user) {
            // Fallback to API for other users
            const fetchRole = async () => {
                try {
                    const res = await fetch('/api/me');
                    const data = await res.json();
                    if (res.ok) {
                        setRole(data.role);
                    }
                } catch (e) {
                    console.error("Failed to fetch role", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchRole();
        } else {
            setLoading(false);
        }
    }, [user])

    const isActive = (link: string) => pathname === link


    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    return (
        <div className='fixed top-0 w-full bg-white backdrop-blur-sm z-50'>
            <nav className='md:px-[10%] p-5 border-b border-base-200 w-full bg-white'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='text-2xl font-bold flex items-center'>
                            <div className='bg-secondary p-1 mr-1 rounded-md text-white'>
                                <CalendarCheck />
                            </div>
                            <span>Nail<span className='text-secondary'>Book</span></span>
                        </h1>
                        {loading ? (
                            <div className=' flex justify-end mt-2'>
                                <span className="loading loading-spinner loading-xs"></span>
                            </div>
                        ) : (
                            <div className=' flex justify-end mt-2'>
                                <div className="badge badge-ghost">{user?.email}</div>
                            </div>
                        )

                        }
                    </div>

                    <div className=' hidden md:flex items-center space-x-6'>

                        <Link href={'/dashboard'} className={`link link-hover font-extrabold ${isActive('/dashboard') ? 'text-secondary' : ''} `}>
                            Réserver
                        </Link>
                        
                        <Link href={'/my-appointments'} className={`link link-hover font-extrabold ${isActive('/my-appointments') ? 'text-secondary' : ''} `}>
                            Mes rendez-vous
                        </Link>
                        
                        {role === 'ADMIN' && (
                            <Link href={'/admin'} className={`link link-hover font-extrabold ${isActive('/admin') ? 'text-secondary' : ''} `}>
                                Admin
                            </Link>
                        )}



                    </div>

                    <LogoutLink className='btn btn-secondary btn-sm hidden md:flex'>Déconnexion</LogoutLink>

                    <div className='md:hidden'>
                        <button className='btn btn-ghost mb-2' onClick={toggleMenu}>
                            {isMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>

                </div>
            </nav>

            {isMenuOpen && (
                <div className='md:hidden shadow-lg p-4 rounded-lg space-y-4 flex flex-col mt-3'>
                    <Link href={'/dashboard'} className={`link link-hover font-extrabold ${isActive('/dashboard') ? 'text-secondary' : ''} `}>
                        Réserver
                    </Link>
                    
                    <Link href={'/my-appointments'} className={`link link-hover font-extrabold ${isActive('/my-appointments') ? 'text-secondary' : ''} `}>
                        Mes rendez-vous
                    </Link>
                    
                    {role === 'ADMIN' && (
                        <Link href={'/admin'} className={`link link-hover font-extrabold ${isActive('/admin') ? 'text-secondary' : ''} `}>
                            Admin
                        </Link>
                    )}
                    
                    <LogoutLink className='btn btn-secondary btn-sm  '>Déconnexion</LogoutLink>
                </div>
            )}
        </div>
    )
}

export default Navbar
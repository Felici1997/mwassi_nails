"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '@/app/components/Wrapper'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, ChevronRight } from 'lucide-react'

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  imgUrl: string;
}

const Dashboard = () => {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      const data = await response.json()
      setServices(data.services || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  if (loading) {
    return (
      <Wrapper>
        <div className='text-center mt-32'>
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <div className='p-5'>
        <h1 className='text-3xl font-bold mb-8 text-center'>Nos Services</h1>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {services.map((service) => (
            <div key={service.id} className='card bg-base-100 shadow-xl border border-base-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300'>
              <figure className='relative h-48 w-full'>
                {service.imgUrl ? (
                  <Image
                    src={service.imgUrl}
                    alt={service.name}
                    fill
                    className='object-cover'
                  />
                ) : (
                  <div className='flex items-center justify-center h-full bg-base-200 text-base-content/40'>
                    <div className='text-center'>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                      <span className='text-sm'>Aucune image</span>
                    </div>
                  </div>
                )}
              </figure>
              <div className='card-body p-5'>
                <h2 className='card-title text-xl font-bold'>{service.name}</h2>
                <p className='text-sm text-gray-500 line-clamp-2 min-h-[40px]'>{service.description}</p>
                
                <div className='flex items-center gap-4 my-2 text-sm text-gray-600'>
                  <div className='flex items-center gap-1'>
                    <Clock className='w-4 h-4 text-secondary' />
                    <span>{service.duration} min</span>
                  </div>
                  <div className='font-bold text-secondary'>
                    {service.price.toLocaleString()} FCFA
                  </div>
                </div>

                <div className='card-actions justify-end mt-4'>
                  <Link 
                    href={`/appointments/${service.id}`} 
                    className='btn btn-secondary btn-block flex items-center justify-center gap-2'
                  >
                    Réserver <ChevronRight className='w-4 h-4' />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {services.length === 0 && (
          <div className='text-center py-20'>
            <p className='text-gray-500 text-lg'>Aucun service disponible pour le moment.</p>
          </div>
        )}
      </div>
    </Wrapper>
  )
}

export default Dashboard

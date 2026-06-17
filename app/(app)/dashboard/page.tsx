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
                  <Image
                    src="/placeholder.jpg"
                    alt={service.name}
                    fill
                    className='object-cover'
                  />
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

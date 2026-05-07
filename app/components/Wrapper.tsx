import React from 'react'
import Navbar from './Navbar'

type WrapperProps = {
    children : React.ReactNode
}

const Wrapper = ({children} :WrapperProps ) => {
  return (
    <div>
        <Navbar/>
        <div className='px-5 mt-24 md:mt-28 md:px-[10%] mb-10'>
            {children}
        </div>
    </div>
  )
}

export default Wrapper
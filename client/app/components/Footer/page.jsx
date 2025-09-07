import React from 'react'

const Footer = () => {
  
  return (
    <>
      <nav className="h-auto w-full bg-black border-b border-gray-800">
        <div className="mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <img
                  src="/assets/icons/icon.svg"
                  alt="CollabNest Icon"
                  className="w-10 h-10"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold font-mono">
                  <span className="text-yellow">Collab</span>
                  <span className="text-DarkBlue">Nest</span>
                </h1>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Footer
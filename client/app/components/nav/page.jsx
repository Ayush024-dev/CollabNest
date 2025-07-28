import React, { useEffect, useState } from 'react'
import { Menu, X, User, MessageCircle, Info, Newspaper } from 'lucide-react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import LoadingPage from '../loading/page'

const NavBar = ({ profileLink }) => {
  const [isloggedin, setLoggedIn] = useState(false);
  const [userid, setUserid] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const check = async () => {
    try {
      const data = await axios.get("http://localhost:8080/api/v1/users/isLoggedIn", { withCredentials: true });
      
      console.log(data);
      if (data.data.message == true) {
        setLoggedIn(data.data.message);
      }

      setUserid(data.data.user_id);
      localStorage.setItem("user", data.data.user_id);
      
    } catch (error) {
      console.error(error);
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }

  const handleNavigation = (path) => {
    setIsLoading(true);
    router.push(path);
    setIsMobileMenuOpen(false);
    
    // Hide loading after a short delay to ensure the new page has loaded
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }

  useEffect(() => {
    check();
  }, [])

  return (
    <>
      {isLoading && <LoadingPage message="Loading..." />}
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

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              {!isloggedin ? (
                <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 transform hover:scale-105">
                  Login
                </button>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    className="text-gray-300 hover:text-white font-mono px-3 py-2 rounded-md text-sm font-medium transition duration-150 hover:bg-gray-800 flex items-center space-x-2"
                    onClick={() => { handleNavigation('/components/feeds'); }}
                  >
                    <Newspaper size={16} />
                    <span>Feeds</span>
                  </button>
                  <button
                    className="text-gray-300 hover:text-white font-mono px-3 py-2 rounded-md text-sm font-medium transition duration-150 hover:bg-gray-800 flex items-center space-x-2"
                    onClick={() => { handleNavigation(`/components/messages?user=${userid}`); }}
                  >
                    <MessageCircle size={16} />
                    <span>Messages</span>
                  </button>
                  <button
                    className="text-gray-300 hover:text-white font-mono px-3 py-2 rounded-md text-sm font-medium transition duration-150 hover:bg-gray-800 flex items-center space-x-2"
                    onClick={() => { handleNavigation(`/components/UserProfile?user=${userid}`); }}
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              {!isloggedin ? (
                <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-lg transition duration-200 text-sm">
                  Login
                </button>
              ) : (
                <button
                  onClick={toggleMobileMenu}
                  className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-md transition duration-150"
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && isloggedin && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-900 rounded-lg mt-2 border border-gray-700">
                <button
                  className="text-gray-300 hover:text-white font-mono block px-3 py-2 rounded-md text-base font-medium transition duration-150 hover:bg-gray-800 w-full text-left flex items-center space-x-3"
                  onClick={() => { handleNavigation('/components/feeds'); }}
                >
                  <Info size={18} />
                  <span>About Us</span>
                </button>
                <button
                  className="text-gray-300 hover:text-white font-mono block px-3 py-2 rounded-md text-base font-medium transition duration-150 hover:bg-gray-800 w-full text-left flex items-center space-x-3"
                  onClick={() => { handleNavigation(`/components/messages?user=${userid}`); }}
                >
                  <MessageCircle size={18} />
                  <span>Messages</span>
                </button>
                <button
                  className="text-gray-300 hover:text-white font-mono block px-3 py-2 rounded-md text-base font-medium transition duration-150 hover:bg-gray-800 w-full text-left flex items-center space-x-3"
                  onClick={() => { handleNavigation(`/components/UserProfile?user=${userid}`); }}
                >
                  <User size={18} />
                  <span>Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Logo Title (visible when menu is closed) */}
        <div className="sm:hidden px-4 pb-2">
          <h1 className="text-lg font-bold font-mono text-center">
            <span className="text-yellow">Collab</span>
            <span className="text-DarkBlue">Nest</span>
          </h1>
        </div>
      </nav>
    </>
  )
}

export default NavBar
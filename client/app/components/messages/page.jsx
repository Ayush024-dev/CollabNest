"use client"
import React, { useState, useEffect, useRef, Suspense } from "react"
import LeftPanel from "./leftpanel/page"
import RightPanel from "./rightPanel/page"
import axios from "axios";
import { Alert } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import socket from "@/app/lib/socket";
import { useSearchParams } from 'next/navigation';
import NavBar from "../nav/page";

const MessagesContent = () => {
  const [error, setError] = useState("");
  const [users, getusers] = useState({});
  const [showId, setShowId] = useState("");
  const [reqUserId, setReqUserId] = useState("");
  const [auth, checkAuth] = useState(true);
  const [loading, setloading]=useState(false);
  const [statusMap, setStatusMap] = useState({}); // { userId: true | timestamp }
  const statusMapRef = useRef({}); // for async updates
  const searchParams = useSearchParams();
  const [leftPanelWidth, setLeftPanelWidth] = useState(30); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Mobile state management
  const [isMobile, setIsMobile] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setLeftPanelWidth(100); // Full width on mobile
      } else {
        setLeftPanelWidth(30); // Reset to default on desktop
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // On mobile, when a chat is selected, hide left panel
  useEffect(() => {
    if (isMobile && showId) {
      setShowLeftPanel(false);
    }
  }, [showId, isMobile]);

  // const location = useLocation();

  useEffect(() => {
    setloading(true);
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get("user");
    const targetParam = params.get("target");

    if (userParam) {
      const decodedId = decodeURIComponent(userParam).replace(/ /g, "+");
      const loggedIn = localStorage.getItem("user");
      if (loggedIn === decodedId) {
        setReqUserId(decodedId);
      } else {
        checkAuth(false);
      }
    }
    else checkAuth(false);

    if (targetParam) {
      const decodedTarget = decodeURIComponent(targetParam).replace(/ /g, "+");
      setShowId(decodedTarget);
    }

    setloading(false);
  }, []);

  // NEW: Listen for changes in the URL's target param and update showId
  useEffect(() => {
    const targetParam = searchParams.get("target");
    if (targetParam) {
      const decodedTarget = decodeURIComponent(targetParam).replace(/ /g, "+");
      setShowId(decodedTarget);
    }
  }, [searchParams]);

  useEffect(() => {
    if (reqUserId) {
      // Ensure user is in personal room for status updates
      console.log('[Messages] Ensuring user is in personal room:', reqUserId);
      socket.emit('joinRoom', { room: reqUserId, type: "Personal" });
      console.log('[Messages] Joining message room:', reqUserId + "-message");
      socket.emit('joinRoom', { room: reqUserId + "-message", type: "Message" });
      return () => {
        console.log('[Messages] Leaving message room:', reqUserId + "-message");
        socket.emit('leaveRoom', { room: reqUserId + "-message", type: "Message" });
        // Don't leave personal room - keep it active for status updates
      };
    }
  }, [reqUserId]);

  // Add this after reqUserId is set
  const joinedPersonalRoomRef = useRef(false);
  useEffect(() => {
    if (reqUserId && !joinedPersonalRoomRef.current) {
      console.log('[Messages] (local) Emitting joinRoom for personal room:', reqUserId);
      socket.emit('joinRoom', { room: reqUserId, type: 'Personal' });
      joinedPersonalRoomRef.current = true;
    }
  }, [reqUserId]);

  // Listen for online/offline events once
  useEffect(() => {
    const handleOnline = ({ userId }) => {
      console.log('[Messages] Received userOnline:', userId);
      setStatusMap(prev => {
        const updated = { ...prev, [userId]: true };
        statusMapRef.current = updated;
        console.log('[Messages] Updated statusMap:', updated);
        return updated;
      });
    };
    const handleOffline = ({ userId, timestamp }) => {
      console.log('[Messages] Received userOffline:', userId, timestamp);
      setStatusMap(prev => {
        const updated = { ...prev, [userId]: timestamp };
        statusMapRef.current = updated;
        console.log('[Messages] Updated statusMap:', updated);
        return updated;
      });
    };
    
    // Listen for logout events to reset status
    const handleLogout = () => {
      console.log('[Messages] Received logout event, resetting statusMap');
      setStatusMap({});
      statusMapRef.current = {};
    };
    
    socket.on("userOnline", handleOnline);
    socket.on("userOffline", handleOffline);
    socket.on("logout", handleLogout);
    
    return () => {
      socket.off("userOnline", handleOnline);
      socket.off("userOffline", handleOffline);
      socket.off("logout", handleLogout);
    };
  }, []);


  // Fetch status for all contacts when users are loaded (only if not already set by real-time events)
  useEffect(() => {
    if (users && users.data && reqUserId) {
      const userIds = Object.keys(users.data).filter(id => id !== reqUserId);
      userIds.forEach(async (id) => {
        // Only fetch from backend if we don't have real-time status
        if (statusMapRef.current[id] === undefined) {
          console.log('[Messages] Fetching status for user:', id);
          await getStatus(id);
        } else {
          console.log('[Messages] Using cached status for user:', id, statusMapRef.current[id]);
        }
      });
    }
  }, [users, reqUserId]);


  const fetchUsers = async () => {
    try {
      setloading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/allUserInfo`, {
        withCredentials: true,
      });
      // console.log(response)
      getusers(response);
    } catch (error) {
      console.error("User fetch failed:", error);
      setError(error?.response?.message || "Could not fetch users");
    }finally{
      setloading(false);
    }
  };

  const handleErrorAlert = (message) => {
    setError(message);
    setTimeout(() => setError(""), 2000);
  };

  const handleShowId = (Id) =>{
    setShowId(Id);
    // On mobile, hide left panel when chat is selected
    if (isMobile) {
      setShowLeftPanel(false);
    }
  }

  // Helper to get status for a userId
  const getStatus = async (userId) => {
    // If status is already in map, return it
    if (statusMapRef.current[userId] !== undefined) {
      return statusMapRef.current[userId];
    }
    // Otherwise, fetch lastSeen from backend
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/message/GetStatus`,
        { encryptedId: userId },
        { withCredentials: true }
      );
      const lastSeen = response.data?.data?.lastSeen || null;
      
      // Only set the status if we don't already have real-time status
      if (statusMapRef.current[userId] === undefined) {
        setStatusMap(prev => {
          const updated = { ...prev, [userId]: lastSeen };
          statusMapRef.current = updated;
          console.log('[Messages] Set initial status for user:', userId, lastSeen);
          return updated;
        });
      }
      return lastSeen;
    } catch (e) {
      console.error('[Messages] Error fetching status for user:', userId, e);
      return null;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    document.title = "CollabNest - Message";
  }, []);

  if (!auth) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-red-500 text-xl">
        404 - Page Not Found or Unauthorized Access
      </div>
    );
  }

  // Synchronous helper to get status for a userId
  const getStatusSync = (userId) => {
    const status = statusMap[userId];
    console.log('[Messages] getStatusSync called for', userId, 'returning:', status, 'statusMap:', statusMap);
    return status;
  };

  // Handle mouse down on divider
  const handleMouseDown = (e) => {
    if (isMobile) return; // Disable resizing on mobile
    setIsDragging(true);
    e.preventDefault();
  };

  // Handle mouse move for resizing
  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current || isMobile) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain between 20% and 60%
    if (newWidth >= 20 && newWidth <= 60) {
      setLeftPanelWidth(newWidth);
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners
  React.useEffect(() => {
    if (isDragging && !isMobile) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, isMobile]);

  // Handle back button on mobile
  const handleBackToContacts = () => {
    setShowLeftPanel(true);
    setShowId("");
  };

  return (
    <div className="flex flex-col w-full h-screen">
      <NavBar />
      <div 
        ref={containerRef}
        className="w-full h-[90vh] flex rounded-xl shadow-lg overflow-hidden relative"
        style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid #e2e8f0'
        }}
      >
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg flex items-center gap-3 max-w-xs sm:max-w-none">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div className="text-slate-700 font-medium text-sm sm:text-base">Loading...</div>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute z-50 top-2 sm:top-4 right-2 sm:right-4 left-2 sm:left-auto">
            <Alert icon={<ErrorIcon fontSize="inherit" />} severity="error">
              {error}
            </Alert>
          </div>
        )}
        
        {/* Left Panel */}
        <div
          className={`
            ${isMobile 
              ? `absolute inset-0 z-30 bg-white transition-transform duration-300 ${
                  showLeftPanel ? 'translate-x-0' : '-translate-x-full'
                }`
              : 'overflow-y-auto bg-white border-r border-slate-200'
            }
          `}
          style={!isMobile ? { width: `${leftPanelWidth}%` } : {}}
        >
          {!loading && users && (
            <LeftPanel
              users={users}
              SetshowId={handleShowId}
              onShowError={handleErrorAlert}
              reqUserId={reqUserId}
              initialTarget={showId}
              showId={showId}
            />
          )}
        </div>

        {/* Resizable Divider */}
        {!isMobile && (
          <div
            className="w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize transition-colors duration-200 relative group"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-400 group-hover:bg-opacity-20 transition-colors duration-200"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-slate-400 rounded-full group-hover:bg-blue-500 transition-colors duration-200"></div>
          </div>
        )}

        {/* Right Panel */}
        <div
          className={`
            ${isMobile 
              ? `absolute inset-0 z-20 bg-white transition-transform duration-300 ${
                  showLeftPanel ? 'translate-x-full' : 'translate-x-0'
                }`
              : 'relative bg-white'
            }
          `}
          style={!isMobile ? { width: `${100 - leftPanelWidth}%` } : {}}
        >
          {!loading && users && showId ? (
            <RightPanel
              users={users}
              onShowError={handleErrorAlert}
              reqUserId={reqUserId}
              showId={showId}
              getStatus={getStatusSync}
              statusMap={statusMap}
              onBackToContacts={isMobile ? handleBackToContacts : undefined}
              isMobile={isMobile}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-gradient-to-br from-slate-50 to-slate-100 p-4">
              <div className="text-center space-y-4">
                <div className="w-16 sm:w-24 h-16 sm:h-24 mx-auto bg-slate-200 rounded-full flex items-center justify-center">
                  <svg className="w-8 sm:w-12 h-8 sm:h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-700 mb-2">Welcome to Messages</h3>
                  <p className="text-sm sm:text-base text-slate-500 px-4">
                    {isMobile ? "Tap a contact to start messaging" : "Select a contact from the left panel to start messaging"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

}

// Main Messages component that wraps MessagesContent in Suspense
const Messages = () => {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
};

export default Messages
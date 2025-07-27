'use client'
import React, { useEffect, useRef } from 'react';
import socket from '@/app/lib/socket';

const PersonalRoomProvider = ({ children }) => {
  const joinedPersonalRoomRef = useRef(false);

  useEffect(() => {
    const encryptedUserId = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    console.log('[PersonalRoomProvider] Running useEffect. encryptedUserId:', encryptedUserId);
    if (encryptedUserId && !joinedPersonalRoomRef.current) {
      console.log('[PersonalRoomProvider] Emitting joinRoom for personal room:', encryptedUserId);
      socket.emit('joinRoom', { room: encryptedUserId, type: 'Personal' });
      joinedPersonalRoomRef.current = true;
      const handleLogout = () => {
        console.log('[PersonalRoomProvider] Received logout event, resetting joinedPersonalRoomRef');
        joinedPersonalRoomRef.current = false;
      };
      socket.on('logout', handleLogout);
      return () => {
        socket.off('logout', handleLogout);
      };
    }
  }, []);

  return children;
};

export default PersonalRoomProvider; 
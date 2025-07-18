"use client"
import React, { useState, useEffect } from "react"
import LeftPanel from "./leftpanel/page"
import RightPanel from "./rightPanel/page"
import axios from "axios";
import { Alert } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import socket from "@/app/lib/socket";
import { useRef } from "react";

const Messages = () => {
  const [error, setError] = useState("");
  const [users, getusers] = useState({});
  const [showId, setShowId] = useState("");
  const [reqUserId, setReqUserId] = useState("");
  const [auth, checkAuth] = useState(true);
  const [loading, setloading]=useState(false);
  const [statusMap, setStatusMap] = useState({}); // { userId: true | timestamp }
  const statusMapRef = useRef({}); // for async updates


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

  // Listen for online/offline events once
  useEffect(() => {
    const handleOnline = ({ userId }) => {
      setStatusMap(prev => {
        const updated = { ...prev, [userId]: true };
        statusMapRef.current = updated;
        return updated;
      });
    };
    const handleOffline = ({ userId, timestamp }) => {
      setStatusMap(prev => {
        const updated = { ...prev, [userId]: timestamp };
        statusMapRef.current = updated;
        return updated;
      });
    };
    socket.on("userOnline", handleOnline);
    socket.on("userOffline", handleOffline);
    return () => {
      socket.off("userOnline", handleOnline);
      socket.off("userOffline", handleOffline);
    };
  }, []);

  // Join/leave personal room for real-time status
  useEffect(() => {
    if (reqUserId) {
      socket.emit('joinRoom', { room: reqUserId, type: "Personal" });
      return () => {
        socket.emit('leaveRoom', { room: reqUserId, type: "Personal" });
      };
    }
  }, [reqUserId]);

  // Fetch status for all contacts when users are loaded
  useEffect(() => {
    if (users && users.data && reqUserId) {
      const userIds = Object.keys(users.data).filter(id => id !== reqUserId);
      userIds.forEach(async (id) => {
        if (statusMapRef.current[id] === undefined) {
          await getStatus(id);
        }
      });
    }
  }, [users, reqUserId]);


  const fetchUsers = async () => {
    try {
      setloading(true);
      const response = await axios.get("http://localhost:8080/api/v1/users/allUserInfo", {
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
        "http://localhost:8080/api/v1/message/GetStatus",
        { encryptedId: userId },
        { withCredentials: true }
      );
      const lastSeen = response.data?.data?.lastSeen || null;
      setStatusMap(prev => {
        const updated = { ...prev, [userId]: lastSeen };
        statusMapRef.current = updated;
        return updated;
      });
      return lastSeen;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (!auth) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-red-500 text-xl">
        404 - Page Not Found or Unauthorized Access
      </div>
    );
  }

  // Synchronous helper to get status for a userId
  const getStatusSync = (userId) => statusMap[userId];

  return (

    <div className="w-full h-[90vh] flex border rounded shadow overflow-hidden bg-white">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-600 bg-opacity-50">
          <div className="text-white text-xl">Loading...</div>
        </div>
      )}
      {console.log(users)}
      {error && (
        <div className="absolute z-50 top-4 right-4">
          <Alert icon={<ErrorIcon fontSize="inherit" />} severity="error">
            {error}
          </Alert>
        </div>
      )}
      {/* Left Panel */}
      <div className="w-[30%] border-r overflow-y-auto">
        {!loading && users && (
          <LeftPanel
            users={users}
            SetshowId={handleShowId}
            onShowError={handleErrorAlert}
            reqUserId={reqUserId}
            initialTarget={showId}
          />
        )}
      </div>

      {/* Right Panel */}
      <div className="w-[70%] relative">
        {!loading && users && showId ? (
          <RightPanel
            users={users}
            onShowError={handleErrorAlert}
            reqUserId={reqUserId}
            showId={showId}
            getStatus={getStatusSync}
            statusMap={statusMap}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Select a contact to start messaging
          </div>
        )}
      </div>
    </div>
  )

}

export default Messages
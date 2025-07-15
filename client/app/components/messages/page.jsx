"use client"
import React, { useState, useEffect } from "react"
import LeftPanel from "./leftpanel/page"
import RightPanel from "./rightPanel/page"
import axios from "axios";
import { Alert } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
// import io from "socket.io-client";
// import { useLocation } from "react-router-dom";

const Messages = () => {
  const [error, setError] = useState("");
  const [users, getusers] = useState({});
  const [showId, setShowId] = useState("");
  const [reqUserId, setReqUserId] = useState("");
  const [selectedUser, setSelected] = useState(null);
  const [auth, checkAuth] = useState(true);


  // const location = useLocation();

  useEffect(() => {
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
  }, []);


  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/v1/users/allUserInfo", {
        withCredentials: true,
      });
      getusers(response);
    } catch (error) {
      console.error("User fetch failed:", error);
      setError(error?.response?.message || "Could not fetch users");
    }
  };

  const handleErrorAlert = (message) => {
    setError(message);
    setTimeout(() => setError(""), 2000);
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

  return (

    <div className="w-full h-[90vh] flex border rounded shadow overflow-hidden bg-white">
      {error && (
        <div className="absolute z-50 top-4 right-4">
          <Alert icon={<ErrorIcon fontSize="inherit" />} severity="error">
            {error}
          </Alert>
        </div>
      )}
      {/* Left Panel */}
      <div className="w-[30%] border-r overflow-y-auto">
        {users && (
          <LeftPanel
            users={users}
            setShowId={setShowId}
            onShowError={handleErrorAlert}
            reqUserId={reqUserId}
            setSelected={setSelected}
            initialTarget={showId}
          />
        )}
      </div>

      {/* Right Panel */}
      <div className="w-[70%] relative">
        {users && showId ? (
          <RightPanel
            users={users}
            onShowError={handleErrorAlert}
            reqUserId={reqUserId}
            showId={showId}
            Selecteduser={selectedUser}
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
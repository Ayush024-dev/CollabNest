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
  const [auth, checkAuth] = useState(true);
  const [loading, setloading]=useState(false);


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
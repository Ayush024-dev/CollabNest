"use client"
import React, { useState, useEffect } from "react"
import axios from "axios";
import socket from '@/app/lib/socket'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronUp, ChevronDown, X, UserPlus, MessageCircle, UserCheck } from "lucide-react"

import { useRouter } from "next/navigation";

const Notification = ({ Allusers, onShowError, countofNew }) => {
  const [notRead, getNotRead] = useState([]);
  const [Read, getRead] = useState([]);
  const [users, getUsers] = useState([]);
  const [showPrevious, setShowPrevious] = useState(false);

  const router=useRouter();

  const notifications = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/v1/users/showNotification", { withCredentials: true });
      console.log(response.data);

      const currNotification = response.data.data;
      const currReadArr = []; const currNotReadArr = [];
      currNotification.forEach(element => {
        if (element.read == true) currReadArr.push(element);
        else currNotReadArr.push(element);
      });

      getNotRead(currNotReadArr);
      getRead(currReadArr);
      // Removed countofNew here

    } catch (error) {
      console.log(error);
      onShowError(error?.response?.data?.message || "Not able to show notification!!");
    }
  }

  const handleRead = async (notif) => {
    try {
      await axios.patch(
        "http://localhost:8080/api/v1/users/toggleStatus",
        { notification_id: notif._id },
        { withCredentials: true }
      );

      getNotRead(prev => prev.filter(n => n._id !== notif._id));
      getRead(prev => [notif, ...prev]);
    } catch (error) {
      console.log(error);
      onShowError(error?.response?.data?.message);
    }
  }

  const handleDecision = async ({ encryptedId, type, notification_id }) => {
    try {
      const setdecison = await axios.post(
        "http://localhost:8080/api/v1/users/AcceptOrRejectConnectionRequest",
        { encryptedId: encryptedId, type: type },
        { withCredentials: true }
      );

      console.log(setdecison);
      // Find the notification object in notRead
      const notif = notRead.find(n => n._id === notification_id);
      if (notif) {
        notif.__decision = type;
        handleRead(notif);
      }
    } catch (error) {
      console.log(error);
      onShowError(error?.response?.data?.message);
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "connection_req":
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case "connection_accepted":
        return <UserCheck className="w-4 h-4 text-green-400" />;
      case "message":
        return <MessageCircle className="w-4 h-4 text-purple-400" />;
      default:
        return <UserPlus className="w-4 h-4 text-blue-400" />;
    }
  }

  const getNotificationText = (notif, sender) => {
    switch (notif.type) {
      case "connection_req":
        return `${sender?.name || 'Someone'} sent you a connection request`;
      case "connection_accepted":
        return `${sender?.name || 'Someone'} accepted your connection request`;
      case "message":
        return `${sender?.name || 'Someone'} sent you a message`;
      default:
        return `${sender?.name || 'Someone'} sent you a notification`;
    }
  }

  const NotificationItem = ({ notif, isRead = false }) => {
    const sender = users.data?.[notif.from.toString()];
    console.log(sender);
    return (
      <div className={`p-4 rounded-lg border transition-all duration-200 hover:bg-gray-700/50 ${isRead ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-800 border-gray-600'
        }`}>
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10 ring-2 ring-gray-600">
            <AvatarImage src={sender?.avatar} alt={sender?.name} />
            <AvatarFallback className="bg-gray-700 text-gray-200">
              {sender?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getNotificationIcon(notif.type)}
              <p className={`text-sm font-medium ${isRead ? 'text-gray-400' : 'text-gray-200'}`}>
                {getNotificationText(notif, sender)}
              </p>
            </div>

            {/* Action buttons for unread connection requests */}
            {!isRead && notif.type === "connection_req" && !notif.__decision && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleDecision({
                    encryptedId: sender._id,
                    type: "Accept",
                    notification_id: notif._id
                  })}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="border border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => handleDecision({
                    encryptedId: sender._id,
                    type: "Reject",
                    notification_id: notif._id
                  })}
                >
                  Reject
                </Button>
              </div>
            )}

            {/* Decision status */}
            {notif.__decision && (
              <p className={`text-sm font-medium mt-2 ${notif.__decision === 'Accept' ? 'text-green-400' : 'text-red-400'
                }`}>
                {notif.__decision}ed
              </p>
            )}

            {/* Read button for message notification */}
            {!isRead && notif.type === "message" && (
              <div className="flex items-start gap-3">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white mt-3"
                  onClick={() => handleRead(notif)}
                >
                  Mark as Read
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="border border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => {
                    const loggedInUser = localStorage.getItem("user");

                    if(loggedInUser && sender._id){
                      router.push(`/components/messages?user=${loggedInUser}&target=${sender._id}`);
                    }
                    handleRead(notif);
                  }}
                >
                  Read Message
                </Button>
              </div>


            )}

            {/* Read button for other notifications */}
            {!isRead && notif.type !== "connection_req" && notif.type !== "message" && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white mt-3"
                onClick={() => handleRead(notif)}
              >
                Mark as Read
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (typeof countofNew === "function") {
      countofNew(notRead.length);
    }
  }, [notRead, countofNew]);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (Allusers) getUsers(Allusers);
        else {
          const response = await axios.get('http://localhost:8080/api/v1/users/allUserInfo');
          getUsers(response);
        }
        await notifications();
        socket.on("newNotification", (notification) => {
          getNotRead((prevNotif) => {
            if (prevNotif.some((notif) => notif._id === notification._id)) {
              return prevNotif;
            }
            return [notification, ...prevNotif];
          });
        });
        // Removed countofNew here
        return () => {
          socket.off('newNotification');
        };
      } catch (error) {
        console.error("Failed to initialize notification socket or fetch users:", error);
      }
    }
    initialize();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-[66vw] h-[66vh] flex flex-col overflow-hidden">

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">

          {/* New Notifications View */}
          <div className={`flex-1 flex flex-col transition-all duration-300 ${showPrevious ? 'hidden' : 'block'}`}>
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">New Notifications</h2>
              {notRead.length > 0 && (
                <p className="text-sm text-gray-400 mt-1">{notRead.length} unread notification{notRead.length !== 1 ? 's' : ''}</p>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {notRead.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-sm">No new notifications</p>
                  </div>
                </div>
              ) : (
                notRead.map((notif) => (
                  <NotificationItem key={notif._id} notif={notif} isRead={false} />
                ))
              )}
            </div>
          </div>

          {/* Previous Notifications View */}
          <div className={`flex-1 flex flex-col transition-all duration-300 ${showPrevious ? 'block' : 'hidden'}`}>
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Previous Notifications</h2>
              {Read.length > 0 && (
                <p className="text-sm text-gray-400 mt-1">{Read.length} read notification{Read.length !== 1 ? 's' : ''}</p>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {Read.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-lg font-medium">No previous notifications</p>
                    <p className="text-sm">Notifications you've read will appear here</p>
                  </div>
                </div>
              ) : (
                Read.map((notif) => (
                  <NotificationItem key={notif._id} notif={notif} isRead={true} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Accordion Toggle */}
        <div className="border-t border-gray-700">
          <Button
            variant="ghost"
            className="w-full h-14 text-gray-300 hover:bg-gray-800 hover:text-white rounded-none justify-between px-6"
            onClick={() => setShowPrevious(!showPrevious)}
          >
            <span className="font-medium">
              {showPrevious ? 'New Notifications' : 'Previous Notifications'}
            </span>
            {showPrevious ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
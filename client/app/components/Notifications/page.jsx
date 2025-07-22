import React, { useState, useEffect } from "react"
import axios from "axios";
import { ChevronUp, ChevronDown, X, UserPlus, MessageCircle, UserCheck, ChevronLeft, ChevronRight } from "lucide-react"

const Notification = ({ Allusers, onShowError, countofNew }) => {
  const [notRead, getNotRead] = useState([]);
  const [Read, getRead] = useState([]);
  const [users, getUsers] = useState([]);
  const [showPrevious, setShowPrevious] = useState(false);
  
  // Pagination states
  const [currentPageNew, setCurrentPageNew] = useState(1);
  const [currentPagePrevious, setCurrentPagePrevious] = useState(1);
  const itemsPerPage = 5;

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

  // Pagination logic
  const getPaginatedItems = (items, currentPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = (items) => {
    return Math.ceil(items.length / itemsPerPage);
  };

  const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 text-sm text-gray-300">
            {currentPage}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const NotificationItem = ({ notif, isRead = false }) => {
    const sender = users.data?.[notif.from.toString()];
    console.log(sender);
    
    return (
      <div className={`p-4 rounded-lg border transition-all duration-200 hover:bg-gray-700/50 ${isRead ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-800 border-gray-600'
        }`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center ring-2 ring-gray-600">
            <img 
              src={sender?.avatar || '/default-avatar.png'} 
              alt={sender?.name || 'User'} 
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-full h-full rounded-full bg-gray-700 text-gray-200 flex items-center justify-center text-sm font-medium" style={{display: 'none'}}>
              {sender?.name?.charAt(0) || 'U'}
            </div>
          </div>

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
                <button
                  className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  onClick={() => handleDecision({
                    encryptedId: sender._id,
                    type: "Accept",
                    notification_id: notif._id
                  })}
                >
                  Accept
                </button>
                <button
                  className="px-4 py-2 text-sm border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={() => handleDecision({
                    encryptedId: sender._id,
                    type: "Reject",
                    notification_id: notif._id
                  })}
                >
                  Reject
                </button>
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
                <button
                  className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg mt-3 transition-colors"
                  onClick={() => handleRead(notif)}
                >
                  Mark as Read
                </button>
                <button
                  className="px-4 py-2 text-sm border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg mt-3 transition-colors"
                  onClick={() => {
                    const loggedInUser = localStorage.getItem("user");
                    if(loggedInUser && sender._id){
                      window.location.href = `/components/messages?user=${loggedInUser}&target=${sender._id}`;
                    }
                    handleRead(notif);
                  }}
                >
                  Read Message
                </button>
              </div>
            )}

            {/* Read button for other notifications */}
            {!isRead && notif.type !== "connection_req" && notif.type !== "message" && (
              <button
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg mt-3 transition-colors"
                onClick={() => handleRead(notif)}
              >
                Mark as Read
              </button>
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
        
        // Socket functionality would need to be implemented separately in Vite
        // socket.on("newNotification", (notification) => {
        //   getNotRead((prevNotif) => {
        //     if (prevNotif.some((notif) => notif._id === notification._id)) {
        //       return prevNotif;
        //     }
        //     return [notification, ...prevNotif];
        //   });
        // });
        
      } catch (error) {
        console.error("Failed to initialize notification or fetch users:", error);
      }
    }
    initialize();
  }, []);

  // Get paginated items
  const paginatedNewNotifications = getPaginatedItems(notRead, currentPageNew);
  const paginatedPreviousNotifications = getPaginatedItems(Read, currentPagePrevious);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-[66vw] h-[66vh] flex flex-col overflow-hidden">

        {/* New Notifications View */}
        <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${showPrevious ? 'hidden' : 'flex'}`}>
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">New Notifications</h2>
            {notRead.length > 0 && (
              <p className="text-sm text-gray-400 mt-1">{notRead.length} unread notification{notRead.length !== 1 ? 's' : ''}</p>
            )}
          </div>

          {/* Notifications List with Custom Scrollbar */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 min-h-0">
            {paginatedNewNotifications.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-lg font-medium">All caught up!</p>
                  <p className="text-sm">No new notifications</p>
                </div>
              </div>
            ) : (
              paginatedNewNotifications.map((notif) => (
                <NotificationItem key={notif._id} notif={notif} isRead={false} />
              ))
            )}
          </div>

          {/* Pagination for New Notifications */}
          <div className="flex-shrink-0">
            <PaginationControls
              currentPage={currentPageNew}
              totalPages={getTotalPages(notRead)}
              onPageChange={setCurrentPageNew}
            />
          </div>
        </div>

        {/* Previous Notifications View */}
        <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${showPrevious ? 'flex' : 'hidden'}`}>
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">Previous Notifications</h2>
            {Read.length > 0 && (
              <p className="text-sm text-gray-400 mt-1">{Read.length} read notification{Read.length !== 1 ? 's' : ''}</p>
            )}
          </div>

          {/* Notifications List with Custom Scrollbar */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 min-h-0">
            {paginatedPreviousNotifications.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-lg font-medium">No previous notifications</p>
                  <p className="text-sm">Notifications you've read will appear here</p>
                </div>
              </div>
            ) : (
              paginatedPreviousNotifications.map((notif) => (
                <NotificationItem key={notif._id} notif={notif} isRead={true} />
              ))
            )}
          </div>

          {/* Pagination for Previous Notifications */}
          <div className="flex-shrink-0">
            <PaginationControls
              currentPage={currentPagePrevious}
              totalPages={getTotalPages(Read)}
              onPageChange={setCurrentPagePrevious}
            />
          </div>
        </div>

        {/* Accordion Toggle */}
        <div className="flex-shrink-0 border-t border-gray-700">
          <button
            className="w-full h-14 text-gray-300 hover:bg-gray-800 hover:text-white rounded-none justify-between px-6 flex items-center transition-colors"
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
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
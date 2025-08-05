"use client"
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Video, FilesIcon, Check } from "lucide-react";
import SearchBar from "./SearchBar/page";
import socket from "@/app/lib/socket";

const LeftPanel = ({ users, onShowError, SetshowId, reqUserId, initialTarget, showId }) => {
    const [conversations, setConversations] = useState([]);

    const getLastConverse = async () => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/message/GetLastConversation`,
                { withCredentials: true }
            );

            const data = response?.data?.data;
            setConversations(data);
        } catch (error) {
            console.log(error);
            onShowError(error.message || "Could not show left panel");
        }
    };

    useEffect(() => {
        getLastConverse();
        // Real-time update for last conversation
        const handleUpdateConverse = (msg) => {
          console.log('[LeftPanel] Received update_converse:', msg);
          const conversation = msg.conversation || msg;
          // If the current user is either sender or receiver (should always be true)
          if (conversation.sender === reqUserId || conversation.receiver === reqUserId) {
            setConversations((prev) => {
              // Find the conversation (by sender/receiver pair)
              const idx = prev.findIndex(
                c => (
                  (c.sender === conversation.sender && c.receiver === conversation.receiver) ||
                  (c.sender === conversation.receiver && c.receiver === conversation.sender)
                )
              );
              const updatedConvo = {
                _id: prev[idx]?._id || `synthetic-${conversation.sender}-${conversation.receiver}`,
                sender: conversation.sender,
                receiver: conversation.receiver,
                lastMessage: conversation.lastMessage,
                updatedAt: conversation.updatedAt || new Date().toISOString(),
              };
              let newConvos;
              if (idx !== -1) {
                // Update existing
                newConvos = [...prev];
                newConvos[idx] = updatedConvo;
              } else {
                // Add new
                newConvos = [updatedConvo, ...prev];
              }
              // Optionally, sort by updatedAt desc
              newConvos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
              return newConvos;
            });
          }
        };
        socket.on("update_converse", handleUpdateConverse);
        // Listen for edit_converse event
        const handleEditConverse = (msg) => {
          console.log('[LeftPanel] Received edit_converse:', msg);
          const { conversationId, lastMessage } = msg;
          setConversations((prev) => prev.map(convo =>
            convo._id === conversationId
              ? {
                  ...convo,
                  lastMessage: {
                    ...convo.lastMessage,
                    ...lastMessage,
                  },
                  updatedAt: new Date().toISOString(),
                }
              : convo
          ));
        };
        socket.on("edit_converse", handleEditConverse);
        // Listen for delete_converse event (delete for me and for everyone)
        const handleDeleteConverse = (msg) => {
          console.log('[LeftPanel] Received delete_converse:', msg);
          const convoObj = msg.myConvo || msg.convo;
          if (!convoObj) return;
          setConversations((prev) => prev.map(convo =>
            convo._id === convoObj._id
              ? {
                  ...convo,
                  lastMessage: convoObj.lastMessage,
                  updatedAt: convoObj.updatedAt || new Date().toISOString(),
                }
              : convo
          ));
        };
        socket.on("delete_converse", handleDeleteConverse);

        // Real-time increment unread count
        const handleIncrementUnread = ({ conversationId }) => {
          setConversations(prev => prev.map(convo =>
            convo._id === conversationId ||
            ([convo.sender, convo.receiver].sort().join('-') === conversationId)
              ? { ...convo, unreadCount: (convo.unreadCount || 0) + 1 }
              : convo
          ));
        };
        socket.on('incrementUnread', handleIncrementUnread);

        // Real-time reset unread count
        const handleUnreadCountReset = ({ conversationId }) => {
          setConversations(prev => prev.map(convo =>
            convo._id === conversationId ||
            ([convo.sender, convo.receiver].sort().join('-') === conversationId)
              ? { ...convo, unreadCount: 0 }
              : convo
          ));
        };
        socket.on('unreadCountReset', handleUnreadCountReset);

        return () => {
          socket.off("update_converse", handleUpdateConverse);
          socket.off("edit_converse", handleEditConverse);
          socket.off("delete_converse", handleDeleteConverse);
          socket.off('incrementUnread', handleIncrementUnread);
          socket.off('unreadCountReset', handleUnreadCountReset);
        };
    }, []);

    let displayConversations = conversations;

    if(
        initialTarget && 
        users.data && 
        !conversations.some(
            c => (users.data[c.sender.toString()]?._id === initialTarget && users.data[c.receiver.toString()]?._id === reqUserId) || 
            (users.data[c.receiver.toString()]?._id === initialTarget && users.data[c.sender.toString()]?._id === reqUserId)
        )
    ) {
        displayConversations.push({
            _id: 'synthetic-' + initialTarget, // unique id for React key
            sender: reqUserId,                 // logged-in user (encrypted)
            receiver: initialTarget,           // target user (encrypted)
            lastMessage: null,                 // no message yet
            updatedAt: new Date().toISOString(),
            isSynthetic: true,                 // (optional) flag for your own logic
        });
    }

    const handleClick = (senderId) => {

        if(initialTarget){
            SetshowId(initialTarget);

            initialTarget="";
        }
        else{
            SetshowId(senderId);
        }

      };

    const formatTimeOrDate = (timestamp) => {
        const updated = new Date(timestamp);
        const now = new Date();

        const isToday =
            updated.getDate() === now.getDate() &&
            updated.getMonth() === now.getMonth() &&
            updated.getFullYear() === now.getFullYear();

        return isToday
            ? updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : updated.toLocaleDateString();
    };

    return (
        <div className="w-full h-full px-3 sm:px-4 py-3 overflow-y-auto space-y-2 bg-gradient-to-b from-slate-50 to-slate-100">
            <SearchBar users={users} onShowError={onShowError} reqUserId={reqUserId} />
            {displayConversations.map((converse) => {
                const otherUserId = (converse.sender!= reqUserId)? converse.sender : converse.receiver; 
                const user = users?.data[otherUserId];
                const lastMessage = converse?.lastMessage;
                const isSelected = showId === otherUserId;

                return (
                    <div
                        key={converse._id}
                        onClick={() => {
                            handleClick(otherUserId)
                        }}
                        className={`flex items-center gap-3 sm:gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                            isSelected 
                                ? 'bg-blue-50 border-blue-200 shadow-md ring-1 ring-blue-100' 
                                : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'
                        }`}
                    >
                        <Avatar className={`w-10 h-10 sm:w-12 sm:h-12 ring-2 transition-all duration-200 ${
                            isSelected ? 'ring-blue-400' : 'ring-slate-300'
                        }`}>
                            <AvatarImage
                                src={user?.avatar}
                                alt={user?.name || "User"}
                            />
                            <AvatarFallback className={`text-white font-semibold ${
                                isSelected ? 'bg-blue-500' : 'bg-slate-500'
                            }`}>
                                {user?.name?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <h3 className={`font-semibold text-sm sm:text-base truncate ${
                                    isSelected ? 'text-blue-900' : 'text-slate-800'
                                }`}>{user?.name || "Unknown User"}</h3>
                                <span className={`text-xs ${
                                    isSelected ? 'text-blue-600' : 'text-slate-500'
                                }`}>
                                    {formatTimeOrDate(converse.updatedAt)}
                                </span>
                                {converse.unreadCount > 0 && (
                                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white min-w-[20px]">
                                    {converse.unreadCount}
                                  </span>
                                )}
                            </div>
                            <p className={`text-xs sm:text-sm truncate flex items-center gap-1 ${
                                isSelected ? 'text-blue-700' : 'text-slate-600'
                            }`}>
                                {converse.sender === reqUserId && lastMessage?.read && (
                                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                                )}
                                {lastMessage?.type === "text" && lastMessage.content}

                                {lastMessage?.type === "image" && (
                                    <>
                                        <span>[Image]</span>
                                        <Image className="w-3 h-3 sm:w-4 sm:h-4 inline-block" />
                                    </>
                                )}

                                {lastMessage?.type === "file" && (
                                    <>
                                        <span>[File]</span>
                                        <FilesIcon className="w-3 h-3 sm:w-4 sm:h-4 inline-block" />
                                    </>
                                )}

                                {lastMessage?.type === "video" && (
                                    <>
                                        <span>[Video]</span>
                                        <Video className="w-3 h-3 sm:w-4 sm:h-4 inline-block" />
                                    </>
                                )}

                                {!["text", "image", "file", "video"].includes(lastMessage?.type) && (
                                    <span>[Media]</span>
                                )}
                            </p>

                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default LeftPanel;
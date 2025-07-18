"use client"
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Video, FilesIcon } from "lucide-react";
import SearchBar from "./SearchBar/page";
import socket from "@/app/lib/socket";

const LeftPanel = ({ users, onShowError, SetshowId, reqUserId, initialTarget }) => {
    const [conversations, setConversations] = useState([]);

    const getLastConverse = async () => {
        try {
            const response = await axios.get(
                "http://localhost:8080/api/v1/message/GetLastConversation",
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
        return () => {
          socket.off("update_converse", handleUpdateConverse);
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
        <div className="w-full h-full px-4 py-2 overflow-y-auto space-y-4">
            <SearchBar users={users} onShowError={onShowError} reqUserId={reqUserId} />
            {displayConversations.map((converse) => {
                const otherUserId = (converse.sender!= reqUserId)? converse.sender : converse.receiver; 
                const user = users.data[otherUserId];
                const lastMessage = converse?.lastMessage;

                return (
                    <div
                        key={converse._id}
                        onClick={() => {
                            handleClick(otherUserId)
                        }}
                        className="flex items-center gap-4 p-3 rounded hover:bg-gray-100 cursor-pointer transition"
                    >
                        <Avatar className="w-12 h-12 ring-2 ring-gray-600">
                            <AvatarImage
                                src={user?.avatar}
                                alt={user?.name || "User"}
                            />
                            <AvatarFallback className="bg-gray-700 text-gray-200">
                                {user?.name?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-base truncate">{user?.name || "Unknown User"}</h3>
                                <span className="text-xs text-gray-500">
                                    {formatTimeOrDate(converse.updatedAt)}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate flex items-center gap-1">
                                {lastMessage?.type === "text" && lastMessage.content}

                                {lastMessage?.type === "image" && (
                                    <>
                                        <span>[Image]</span>
                                        <Image className="w-4 h-4 inline-block" />
                                    </>
                                )}

                                {lastMessage?.type === "file" && (
                                    <>
                                        <span>[File]</span>
                                        <FilesIcon className="w-4 h-4 inline-block" />
                                    </>
                                )}

                                {lastMessage?.type === "video" && (
                                    <>
                                        <span>[Video]</span>
                                        <Video className="w-4 h-4 inline-block" />
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

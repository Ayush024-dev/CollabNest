"use client"
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import socket from "@/lib/socket";
import socket from "@/app/lib/socket";
import InputMessage from "../InputMessage/page";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const RightPanel = ({ users, onShowError, showId, reqUserId })=>{
    const [messages, setMessages] = useState([]);
    const scrollRef = useRef(null);
    const prevRoomRef = useRef(null);
  
    const fetchMessages = async () => {
      try {
        if (!showId) return;
  
        const response = await axios.post(
          "http://localhost:8080/api/v1/message/GetMessage",
          { encryptedId: showId },
          { withCredentials: true }
        );
        setMessages(response.data?.data || []);
      } catch (error) {
        onShowError(error?.response?.data?.message || "Could not fetch messages");
      }
    };
  
    useEffect(() => {
      fetchMessages();
    }, [showId]);
  
    useEffect(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
      if (!showId || !reqUserId) return;
      const roomName = [reqUserId, showId].sort().join('-');
      // Leave previous room if any
      if (prevRoomRef.current && prevRoomRef.current !== roomName) {
        socket.emit('leaveRoom', prevRoomRef.current);
      }
      // Join new room
      socket.emit('joinRoom', { roomName, type: "Chat"});
      prevRoomRef.current = roomName;

      const handleNewMessage = (msg) => {
        const message = msg.encryptedMsg || msg;
        console.log("Received message event: ", msg);
        if(
          (users.data[message.sender.toString()]?._id === reqUserId && users.data[message.receiver.toString()]?._id === showId) ||
          (users.data[message.sender.toString()]?._id === showId && users.data[message.receiver.toString()]?._id === reqUserId)
        ) {
          setMessages((prev) =>[...prev, message]);
        }
      };
      socket.on("newMessage", handleNewMessage);
      return () => {
        socket.off("newMessage", handleNewMessage);
      };
    }, [showId, reqUserId, users]);

    if(!showId) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Select a chat to start messaging.
        </div>
      );
    }
    console.log(users)
    const receiver = users.data[showId.toString()];

    return (
      <div className="flex flex-col w-2/3 h-full border-l">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b shadow-sm bg-white">
        <Avatar className="w-12 h-12">
          <AvatarImage src={receiver.avatar} />
          <AvatarFallback>{receiver.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold">{receiver.name}</h3>
          <p className="text-sm text-gray-500">{receiver.institute}</p>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50 space-y-3">
        {messages.map((msg, index) => {
          const isSender = users.data[msg.sender.toString()]?._id === reqUserId;
          const bubbleColor = isSender ? "bg-yellow-200" : "bg-blue-100";
          const align = isSender ? "justify-end" : "justify-start";
          const textAlign = isSender ? "text-right" : "text-left";
          const user = users.data[msg.sender.toString()];
          const time = msg.updatedAt ? new Date(msg.updatedAt) : (msg.timestamp ? new Date(msg.timestamp) : null);
          const formattedTime = time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

          return (
            <div key={index} className={`flex ${align} items-end gap-2`}>
              {/* Avatar */}
              {!isSender && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
              )}
              {/* Message Bubble with Menu */}
              <div className="relative flex flex-col">
                {/* Menu at top right */}
                {msg.sender.toString() === reqUserId && (
                  <div className="absolute top-3 right-1 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-full hover:bg-gray-200 focus:outline-none">
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {/* TODO: Edit logic */}}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {/* TODO: Delete logic */}}>Delete</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {/* TODO: Reply logic */}}>Reply</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                {/* Message Bubble */}
                <div className={`max-w-sm px-4 py-2 rounded-lg shadow ${bubbleColor} ${textAlign} mt-4`} style={{ minWidth: '4rem' }}>
                  {msg.type === "text" && <p>{msg.content}</p>}
                  {msg.type === "emoji" && <p className="text-3xl">{msg.content}</p>}
                  {msg.type === "image" && (
                    <div className="flex flex-col items-start">
                      <img src={msg.fileUrl} alt="image" className="rounded-md w-64" />
                      {msg.content && (
                        <span className="mt-1 text-sm text-gray-700">{msg.content}</span>
                      )}
                    </div>
                  )}
                  {msg.type === "file" && (
                    <div className="flex flex-col items-start">
                      <a href={msg.fileUrl} download className="underline text-blue-600">
                        Download File
                      </a>
                      {msg.content && (
                        <span className="mt-1 text-sm text-gray-700">{msg.content}</span>
                      )}
                    </div>
                  )}
                  {msg.type === "video" && (
                    <div className="flex flex-col items-start">
                      <video src={msg.fileUrl} controls className="w-64 rounded-md" />
                      {msg.content && (
                        <span className="mt-1 text-sm text-gray-700">{msg.content}</span>
                      )}
                    </div>
                  )}
                  {/* Message Time */}
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-500">{formattedTime}</span>
                  </div>
                </div>
              </div>
              {/* Sender's avatar on right if desired (optional) */}
              {isSender && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Message */}
      <div className="border-t p-4 bg-white">
        <InputMessage
          receiverId={showId}
          onSend={(msg) => setMessages((prev) => [...prev, msg])}
          onShowError={onShowError}
        />
      </div>
    </div>
    )
}

export default RightPanel
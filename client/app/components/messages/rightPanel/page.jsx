"use client"
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { io } from "socket.io-client";

const socket = io("http://localhost:8080", {
  withCredentials: true,
});

const RightPanel = ({ users, onShowError, showId, reqUserId, Selecteduser })=>{
    const [messages, setMessages] = useState([]);
    const scrollRef = useRef(null);
  
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
        console.log(error);
        onShowError(error?.response?.data?.message || "Could not fetch messages");
      }
    };
  
    useEffect(() => {
      fetchMessages();
    }, [showId]);
  
    useEffect(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(()=>{
      const handleNewMessage = (msg) =>{
        if(
          (users.data[msg.sender.toString()]._id === reqUserId && users.data[msg.receiver.toString()]._id === showId) ||
          (users.data[msg.sender.toString()]._id === showId && users.data[msg.receiver.toString()]._id === reqUserId)
        ) {
          setMessages((prev) =>[...prev, msg]);
        }
      };

      socket.on("newMessage", handleNewMessage);

      return () => {
        socket.off("newMessage", handleNewMessage);
      };
    },[])

    if(!showId) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Select a chat to start messaging.
        </div>
      );
    }

    const receiver = Selecteduser;

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
          const isSender = users.data[msg.sender]._id === reqUserId;
          const bubbleColor = isSender ? "bg-yellow-200" : "bg-blue-100";
          const align = isSender ? "justify-end" : "justify-start";
          const textAlign = isSender ? "text-right" : "text-left";

          return (
            <div key={index} className={`flex ${align}`}>
              <div className={`max-w-sm px-4 py-2 rounded-lg shadow ${bubbleColor} ${textAlign}`}>
                {msg.type === "text" && <p>{msg.content}</p>}
                {msg.type === "image" && (
                  <img src={msg.fileUrl} alt="image" className="rounded-md w-64" />
                )}
                {msg.type === "file" && (
                  <a href={msg.fileUrl} download className="underline text-blue-600">
                    Download File
                  </a>
                )}
                {msg.type === "video" && (
                  <video src={msg.fileUrl} controls className="w-64 rounded-md" />
                )}
              </div>
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
        />
      </div>
    </div>
    )
}

export default RightPanel
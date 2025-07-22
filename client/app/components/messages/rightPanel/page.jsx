"use client"
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import socket from "@/lib/socket";
import socket from "@/app/lib/socket";
import InputMessage from "../InputMessage/page";
import { MoreHorizontal, ArrowDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const RightPanel = ({ users, onShowError, showId, reqUserId, getStatus, statusMap }) => {
    const [messages, setMessages] = useState([]);
    const [isOnline, setIsOnline] = useState(false);
    const [lastSeen, setLastSeen] = useState(null);
    const scrollRef = useRef(null);
    const prevRoomRef = useRef(null);
    const [showNewMsgIndicator, setShowNewMsgIndicator] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const scrollContainerRef = useRef(null);
    const [editingMsgId, setEditingMsgId] = useState(null);
    const [editContent, setEditContent] = useState("");
    const [replyToMsg, setReplyToMsg] = useState(null); // New state for reply
  
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
  
    // Scroll to bottom instantly when chat is opened (showId changes only)
    useEffect(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        setIsAtBottom(true);
        setShowNewMsgIndicator(false);
      }
    }, [showId]);

    // Show indicator if new message arrives and user is not at bottom; scroll if at bottom
    useEffect(() => {
      if (!scrollContainerRef.current) return;
      const container = scrollContainerRef.current;
      if (isAtBottom) {
        container.scrollTop = container.scrollHeight;
        setShowNewMsgIndicator(false);
      } else {
        setShowNewMsgIndicator(true);
      }
    }, [messages]);

    // Track scroll position to update isAtBottom
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const container = scrollContainerRef.current;
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;
      setIsAtBottom(atBottom);
      if (atBottom) setShowNewMsgIndicator(false);
    };

    // Handler for indicator click
    const handleScrollToBottom = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        setIsAtBottom(true);
        setShowNewMsgIndicator(false);
      }
    };

    // Listen for userOnline/userOffline events and update status in real time
    useEffect(() => {
      const handleOnline = ({ userId }) => {
        if (userId === showId) {
          setIsOnline(true);
          setLastSeen(null);
        }
      };
      const handleOffline = ({ userId, timestamp }) => {
        if (userId === showId) {
          setIsOnline(false);
          setLastSeen(timestamp);
        }
      };
      socket.on("userOnline", handleOnline);
      socket.on("userOffline", handleOffline);
      return () => {
        socket.off("userOnline", handleOnline);
        socket.off("userOffline", handleOffline);
      };
    }, [showId]);

    // Update status when showId or statusMap changes
    useEffect(() => {
      if (!showId) return;
      const status = getStatus(showId);
      if (status === true) {
        setIsOnline(true);
        setLastSeen(null);
      } else if (status) {
        setIsOnline(false);
        setLastSeen(status);
      } else {
        setIsOnline(false);
        setLastSeen(null);
      }
    }, [showId, statusMap]);

    useEffect(() => {
      if (!showId || !reqUserId) return;
      const roomName = [reqUserId, showId].sort().join('-');
      // Leave previous room if any
      if (prevRoomRef.current && prevRoomRef.current !== roomName) {
        socket.emit('leaveRoom', { room: prevRoomRef.current, type: "Chat" });
      }
      // Join new room
      socket.emit('joinRoom', { room: roomName, type: "Chat" });
      prevRoomRef.current = roomName;

      const handleNewMessage = (msg) => {
        const message = msg.encryptedMsg || msg;
        // Only add message if it belongs to this chat
        if (
          (message.sender === reqUserId && message.receiver === showId) ||
          (message.sender === showId && message.receiver === reqUserId)
        ) {
          setMessages((prev) => [...prev, message]);
        }
      };
      socket.on("newMessage", handleNewMessage);
      return () => {
        socket.off("newMessage", handleNewMessage);
      };
    }, [showId, reqUserId]);

    // Listen for messageEdited event
    useEffect(() => {
      const handleMessageEdited = ({ messageId, newContent, timestamp }) => {
        setMessages((prevMsgs) =>
          prevMsgs.map((msg) =>
            msg._id === messageId
              ? { ...msg, content: newContent, updatedAt: timestamp, edited: true }
              : msg
          )
        );
      };
      socket.on("messageEdited", handleMessageEdited);
      return () => {
        socket.off("messageEdited", handleMessageEdited);
      };
    }, []);

    // Listen for delete_message event (delete for me and for everyone)
    useEffect(() => {
      const handleDeleteMessage = ({ messageId, type }) => {
        if (type === "delete_for_me" || type === "delete_for_everyone") {
          setMessages((prevMsgs) => prevMsgs.filter((msg) => msg._id !== messageId));
        }
      };
      socket.on("delete_message", handleDeleteMessage);
      return () => {
        socket.off("delete_message", handleDeleteMessage);
      };
    }, []);

    if(!showId) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Select a chat to start messaging.
        </div>
      );
    }
    const receiver = users.data[showId.toString()];

    return (
      <div className="flex flex-col w-full h-full">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-b border-slate-300 shadow-sm bg-gradient-to-r from-slate-700 to-slate-800">
        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-slate-400">
          <AvatarImage src={receiver?.avatar} alt={receiver?.name || "User"}/>
          <AvatarFallback className="bg-slate-500 text-white font-semibold">{receiver.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white">{receiver.name}</h3>
          <p className="text-xs sm:text-sm text-slate-300">{receiver.institute}</p>
          <p className="text-xs text-slate-400">
            {isOnline
              ? "Online"
              : lastSeen
                ? `Last seen: ${new Date(lastSeen).toLocaleString()}`
                : "Offline"}
          </p>
        </div>
      </div>

      {/* Chat Window */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 bg-gradient-to-b from-slate-50 to-white space-y-3 relative custom-scrollbar"
        onScroll={handleScroll}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent'
        }}
      >
        {messages.map((msg, index) => {
          // console.log(msg.type);
          const isSender = msg.sender === reqUserId;
          const bubbleColor = isSender ? "bg-emerald-500 text-white" : "bg-white border border-slate-200";
          const align = isSender ? "justify-end" : "justify-start";
          const user = users.data[msg.sender.toString()];
          const time = msg.updatedAt ? new Date(msg.updatedAt) : (msg.timestamp ? new Date(msg.timestamp) : null);
          const formattedTime = time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

          // WhatsApp-style edit UI
          const isEditing = editingMsgId === msg._id;

          // Helper: If this is the last message
          const isLastMessage = index === messages.length - 1;

          // Handler to scroll to bottom after media loads
          const handleMediaLoad = () => {
            if (scrollContainerRef.current && isAtBottom) {
              scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
          };

          // Helper: If this message is being replied to by another message
          const replySnippet = msg.replyTo
            ? (() => {
                const original = messages.find(m => m._id === msg.replyTo);
                if (!original) return <div className="text-xs italic text-gray-400 border-l-4 border-gray-300 pl-2 mb-1">Original message not found</div>;
                let preview = original.content;
                if (original.type === "image") preview = "[Image]";
                if (original.type === "video") preview = "[Video]";
                if (original.type === "file") preview = original.content ? original.content : "[File]";
                if (original.type === "emoji") preview = original.content;
                return (
                  <div
                    className="text-xs bg-gray-100 border-l-4 border-blue-400 pl-2 mb-2 py-2 cursor-pointer hover:bg-blue-50 transition"
                    style={{ fontSize: '0.95rem' }}
                    onClick={() => {
                      const el = document.getElementById(original._id);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-blue-400', 'transition');
                        setTimeout(() => {
                          el.classList.remove('ring-2', 'ring-blue-400', 'transition');
                        }, 1200);
                      }
                    }}
                  >
                    <span className="font-semibold text-blue-600">Replying to:</span> {preview}
                  </div>
                );
              })()
            : null;

          return (
            <div key={index} className={`flex ${align} items-end gap-2`}>
              {/* Avatar */}
              {!isSender && (
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8 ring-1 ring-slate-300">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-emerald-500 text-white text-xs font-semibold">{user?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
              )}
              {/* Message Bubble with Menu */}
              <div className="relative flex flex-col">
                {/* Menu at top right */}
                {msg.sender === reqUserId && !isEditing && (
                  <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-full hover:bg-blue-600 focus:outline-none">
                          <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4 text-blue-200 hover:text-white" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(msg.type === "text" || msg.type === "emoji") && (
                          <DropdownMenuItem onClick={() => {
                            setEditingMsgId(msg._id.toString());
                            setEditContent(msg.content);
                          }}>
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={async () => {
                          try {
                            const roomName = [reqUserId, showId].sort().join('-');
                            await axios.patch(
                              "http://localhost:8080/api/v1/message/DeleteMessageForMe",
                              {
                                messageId: msg._id,
                                type: "delete_for_me",
                                roomName,
                              },
                              { withCredentials: true }
                            );
                            // Optimistically remove the message for the current user
                            setMessages((prevMsgs) => prevMsgs.filter((m) => m._id !== msg._id));
                          } catch (err) {
                            onShowError(err?.response?.data?.message || "Failed to delete message");
                          }
                        }}>Delete for me</DropdownMenuItem>
                        <DropdownMenuItem onClick={async () => {
                          try {
                            const roomName = [reqUserId, showId].sort().join('-');
                            await axios.delete(
                              "http://localhost:8080/api/v1/message/DeleteMessageForEveryone",
                              {
                                data: {
                                  messageId: msg._id,
                                  type: "delete_for_everyone",
                                  roomName,
                                },
                                withCredentials: true
                              }
                            );
                            // Optimistically remove the message for both users
                            setMessages((prevMsgs) => prevMsgs.filter((m) => m._id !== msg._id));
                          } catch (err) {
                            onShowError(err?.response?.data?.message || "Failed to delete message for everyone");
                          }
                        }}>Delete for everyone</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setReplyToMsg(msg); // Set reply target
                        }}>Reply</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                {msg.sender !== reqUserId && (
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-full hover:bg-slate-200 focus:outline-none">
                        <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={async () => {
                        try {
                          const roomName = [reqUserId, showId].sort().join('-');
                          await axios.patch(
                            "http://localhost:8080/api/v1/message/DeleteMessageForMe",
                            {
                              messageId: msg._id,
                              type: "delete_for_me",
                              roomName,
                            },
                            { withCredentials: true }
                          );
                          setMessages((prevMsgs) => prevMsgs.filter((m) => m._id !== msg._id));
                        } catch (err) {
                          onShowError(err?.response?.data?.message || "Failed to delete message");
                        }
                      }}>Delete for me</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setReplyToMsg(msg); // Set reply target
                      }}>Reply</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                )}
                {/* Message Bubble */}
                <div 
                  id={msg._id} 
                  className={`group max-w-xs sm:max-w-sm px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm ${bubbleColor} mt-2 relative`}
                  style={{ minWidth: '3rem' }}
                >
                  {/* Reply snippet if this message is a reply */}
                  {replySnippet}
                  {isEditing ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!editContent.trim()) return;
                        try {
                          const roomName = [reqUserId, showId].sort().join('-');
                          await axios.patch(
                            "http://localhost:8080/api/v1/message/EditMessage",
                            {
                              messageId: msg._id,
                              newContent: editContent,
                              roomName,
                            },
                            { withCredentials: true }
                          );
                          setEditingMsgId(null);
                          setEditContent("");
                        } catch (err) {
                          onShowError(err?.response?.data?.message || "Failed to edit message");
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        className="flex-1 border rounded px-2 py-1 text-sm"
                        value={editContent}
                        autoFocus
                        onChange={e => setEditContent(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Escape") {
                            setEditingMsgId(null);
                            setEditContent("");
                          }
                        }}
                      />
                      <button type="submit" className="text-blue-600 font-semibold">Save</button>
                      <button type="button" className="text-gray-500" onClick={() => { setEditingMsgId(null); setEditContent(""); }}>Cancel</button>
                    </form>
                  ) : (
                    <>
                      {msg.type === "text" && (
                        <p className="text-sm sm:text-base break-words">
                          {msg.content}
                          {msg.edited && (
                            <span className={`text-xs ml-1 ${isSender ? 'text-blue-200' : 'text-slate-500'}`}>
                              (edited)
                            </span>
                          )}
                        </p>
                      )}
                      {msg.type === "emoji" && <p className="text-2xl sm:text-3xl">{msg.content}</p>}
                      {msg.type === "image" && (
                        <div className="flex flex-col items-start">
                          <img 
                            src={msg.fileUrl} 
                            alt="image" 
                            className="rounded-lg w-48 sm:w-64 max-w-full" 
                            onLoad={isLastMessage ? handleMediaLoad : undefined} 
                          />
                          {msg.content && (
                            <span className={`mt-2 text-xs sm:text-sm ${isSender ? 'text-blue-100' : 'text-slate-700'}`}>
                              {msg.content}
                            </span>
                          )}
                        </div>
                      )}
                      {msg.type === "file" && (
                        <div className="flex flex-col items-start">
                          <a 
                            href={msg.fileUrl} 
                            download 
                            className={`underline ${isSender ? 'text-blue-200 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}
                            onLoad={isLastMessage ? handleMediaLoad : undefined}
                          >
                            Download File
                          </a>
                          {msg.content && (
                            <span className={`mt-2 text-xs sm:text-sm ${isSender ? 'text-blue-100' : 'text-slate-700'}`}>
                              {msg.content}
                            </span>
                          )}
                        </div>
                      )}
                      {msg.type === "video" && (
                        <div className="flex flex-col items-start">
                          <video 
                            src={msg.fileUrl} 
                            controls 
                            className="w-48 sm:w-64 max-w-full rounded-lg" 
                            onLoadedData={isLastMessage ? handleMediaLoad : undefined} 
                          />
                          {msg.content && (
                            <span className={`mt-2 text-xs sm:text-sm ${isSender ? 'text-blue-100' : 'text-slate-700'}`}>
                              {msg.content}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {/* Message Time */}
                  <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mt-1`}>
                    <span className={`text-xs ${isSender ? 'text-blue-200' : 'text-slate-500'}`}>
                      {formattedTime}
                    </span>
                  </div>
                </div>
              </div>
              {/* Sender's avatar on right if desired (optional) */}
              {isSender && (
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8 ring-1 ring-blue-300">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">{user?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}
        <div ref={scrollRef} />
        {/* New message indicator */}
        {showNewMsgIndicator && (
          <button
            onClick={handleScrollToBottom}
            className="fixed bottom-20 sm:bottom-24 right-4 sm:right-12 z-20 bg-blue-500 hover:bg-blue-600 text-white p-2 sm:p-3 rounded-full shadow-lg flex items-center animate-bounce transition-colors"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            aria-label="Scroll to latest message"
          >
            <ArrowDown className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Input Message */}
      <div className="border-t border-slate-300 p-3 sm:p-4 bg-white">
        <InputMessage
          receiverId={showId}
          onSend={(msg) => setMessages((prev) => [...prev, { ...msg, sender: reqUserId, receiver: showId }])}
          onShowError={onShowError}
          replyToMsg={replyToMsg}
          clearReplyToMsg={() => setReplyToMsg(null)}
        />
      </div>
    </div>
    )
}

export default RightPanel
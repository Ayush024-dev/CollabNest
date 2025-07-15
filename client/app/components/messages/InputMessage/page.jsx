import React, { useState, useRef } from "react";
import axios from "axios";
import { EmojiSmile, Paperclip, Send } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

const InputMessage = ({ receiverId, onSend }) => {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleSendMessage = async () => {
    if (!text && !file) return;

    try {
      const formData = new FormData();
      formData.append("receiverId", receiverId);
      if (text) formData.append("content", text);
      if (file) formData.append("fileUrl", file);

      const response = await axios.post(
        "http://localhost:8080/api/v1/message/SendMessage",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const newMsg = response.data.data;

      onSend(newMsg); // Update UI
      setText("");
      setFile(null);
    } catch (error) {
      console.error("Message send error:", error);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-white border rounded px-3 py-2">
      {/* Emoji Picker Toggle */}
      <div className="relative">
        <EmojiSmile
          className="text-yellow-500 cursor-pointer"
          onClick={() => setShowEmoji(!showEmoji)}
        />
        {showEmoji && (
          <div className="absolute bottom-12 left-0 z-40">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>

      {/* File Picker */}
      <Paperclip
        className="cursor-pointer text-gray-600"
        onClick={() => fileInputRef.current.click()}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,application/pdf,application/msword"
      />

      {/* Message Text */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSendMessage();
        }}
        placeholder="Type your message..."
        className="flex-1 outline-none px-3 py-2 text-sm"
      />

      {/* Send Button */}
      <Send
        className="text-blue-500 cursor-pointer"
        onClick={handleSendMessage}
      />
    </div>
  );
};

export default InputMessage;

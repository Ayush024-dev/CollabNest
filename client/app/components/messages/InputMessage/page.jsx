import React, { useState, useRef } from "react";
import axios from "axios";
import { Smile, Paperclip, Send } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

const InputMessage = ({ receiverId, onSend, onShowError, replyToMsg, clearReplyToMsg }) => {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState(""); // New state for file caption
  const [loading, setLoading] = useState(false); // Loading state for send button
  const fileInputRef = useRef(null);

  const handleEmojiClick = (emojiData) => {
    if (file) {
      setCaption((prev) => prev + emojiData.emoji);
    } else {
      setText((prev) => prev + emojiData.emoji);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setCaption("");
  };

  const handleSendMessage = async () => {
    if ((!text && !file) || loading) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("encryptedId", receiverId); // Assuming receiverId is already encrypted

      let messageType = "text";
      if (file) {
        const mime = file.type;
        if (mime.startsWith("image/")) messageType = "image";
        else if (mime.startsWith("video/")) messageType = "video";
        else messageType = "file";
        formData.append("file", file); // Use 'file' as per backend
        formData.append("content", caption); // Send caption as content
      } else if (text) {
        const emojiRegex = /^\p{Emoji}+$/u;
        if (emojiRegex.test(text.trim())) {
          messageType = "emoji";
        } else {
          messageType = "text";
        }
        formData.append("content", text);
      }
      formData.append("type", messageType);

      // Add replyTo if replying
      if (replyToMsg && replyToMsg._id) {
        formData.append("replyTo", replyToMsg._id);
      }

      const response = await axios.post(
        "http://localhost:8080/api/v1/message/SendMessage",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const newMsg = response.data.data;

      setText("");
      setFile(null);
      setCaption("");
      setLoading(false);
      if (clearReplyToMsg) clearReplyToMsg();
    } catch (error) {
      console.error("Message send error:", error);
      onShowError(error.response?.data?.message || "Not able send message")
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Reply snippet above input */}
      {replyToMsg && (
        <div className="flex items-center bg-gray-100 border-l-4 border-blue-400 px-2 py-2 mb-1 text-xs relative">
          <span className="font-semibold text-blue-600 mr-2">Replying to:</span>
          <span>
            {replyToMsg.type === "image" && "[Image]"}
            {replyToMsg.type === "video" && "[Video]"}
            {replyToMsg.type === "file" && (replyToMsg.content ? replyToMsg.content : "[File]")}
            {replyToMsg.type === "emoji" && replyToMsg.content}
            {replyToMsg.type === "text" && replyToMsg.content}
          </span>
          <button className="ml-2 text-gray-400 hover:text-red-500 absolute right-2 top-1/2 -translate-y-1/2" onClick={clearReplyToMsg}>&times;</button>
        </div>
      )}
      <div className="flex items-center gap-2 bg-white border rounded px-3 py-2">
        {/* Emoji Picker Toggle */}
        <div className="relative">
          <Smile
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

        {/* File Preview and Caption Input */}
        {file && (
          <div className="flex items-center gap-2">
            {/* File preview */}
            {file.type.startsWith("image/") && (
              <img src={URL.createObjectURL(file)} alt="preview" className="w-16 h-16 object-cover rounded" />
            )}
            {file.type.startsWith("video/") && (
              <video src={URL.createObjectURL(file)} controls className="w-16 h-16 rounded" />
            )}
            {!file.type.startsWith("image/") && !file.type.startsWith("video/") && (
              <span className="text-xs text-gray-700">{file.name}</span>
            )}
            {/* Caption input */}
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="flex-1 outline-none px-2 py-1 text-sm border rounded"
            />
            {/* Remove file button */}
            <button onClick={handleRemoveFile} className="text-red-500 text-xs ml-2">✕</button>
          </div>
        )}

        {/* Message Text (hide if file is selected) */}
        {!file && (
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
        )}

        {/* Send Button */}
        <button
          className="text-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSendMessage}
          disabled={loading || (!text && !file)}
          style={{ background: 'none', border: 'none', padding: 0 }}
          type="button"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          ) : (
            <Send />
          )}
        </button>
      </div>
    </div>
  );
};

export default InputMessage;

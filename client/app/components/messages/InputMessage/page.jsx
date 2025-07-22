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
        <div className="flex items-center bg-slate-100 border-l-4 border-blue-400 px-3 py-2 mb-2 text-xs sm:text-sm relative rounded-r-lg">
          <span className="font-semibold text-blue-600 mr-2">Replying to:</span>
          <span>
            {replyToMsg.type === "image" && "[Image]"}
            {replyToMsg.type === "video" && "[Video]"}
            {replyToMsg.type === "file" && (replyToMsg.content ? replyToMsg.content : "[File]")}
            {replyToMsg.type === "emoji" && replyToMsg.content}
            {replyToMsg.type === "text" && replyToMsg.content}
          </span>
          <button className="ml-2 text-slate-400 hover:text-red-500 absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors" onClick={clearReplyToMsg}>&times;</button>
        </div>
      )}
      <div className="flex items-center gap-2 sm:gap-3 bg-white border border-slate-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm hover:shadow-md transition-shadow">
        {/* Emoji Picker Toggle */}
        <div className="relative">
          <Smile
            className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 cursor-pointer hover:text-yellow-600 transition-colors"
            onClick={() => setShowEmoji(!showEmoji)}
          />
          {showEmoji && (
            <div className="absolute bottom-12 sm:bottom-14 left-0 z-40">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>

        {/* File Picker */}
        <Paperclip
          className="w-5 h-5 sm:w-6 sm:h-6 cursor-pointer text-slate-600 hover:text-slate-700 transition-colors"
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
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            {/* File preview */}
            {file.type.startsWith("image/") && (
              <img src={URL.createObjectURL(file)} alt="preview" className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border border-slate-200" />
            )}
            {file.type.startsWith("video/") && (
              <video src={URL.createObjectURL(file)} controls className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg border border-slate-200" />
            )}
            {!file.type.startsWith("image/") && !file.type.startsWith("video/") && (
              <span className="text-xs sm:text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{file.name}</span>
            )}
            {/* Caption input */}
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="flex-1 outline-none px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
            />
            {/* Remove file button */}
            <button onClick={handleRemoveFile} className="text-red-500 hover:text-red-600 text-sm ml-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors">✕</button>
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
            className="flex-1 outline-none px-3 py-2 text-sm sm:text-base placeholder-slate-400 focus:placeholder-slate-300 transition-colors"
          />
        )}

        {/* Send Button */}
        <button
          className="text-blue-500 hover:text-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded-full hover:bg-blue-50 transition-colors disabled:hover:bg-transparent"
          onClick={handleSendMessage}
          disabled={loading || (!text && !file)}
          style={{ background: 'none', border: 'none', padding: 0 }}
          type="button"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          ) : (
            <Send className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </button>
      </div>
    </div>
  );
};

export default InputMessage;
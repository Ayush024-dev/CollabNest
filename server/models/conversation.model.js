import mongoose from "mongoose";

const conversationSchema= new mongoose.Schema({
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    lastMessage: {
        content: { type: String },
        fileUrl: { type: String },
        type: {
          type: String,
          enum: ["text", "image", "video", "file", "emoji"],
        },
        read: { type: Boolean, default: false }, 
      }
}, {timestamps:true})

const LastConversations= mongoose.model("Conversation", conversationSchema)

export default LastConversations
import mongoose from 'mongoose'

const messageSchema= new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      type: {
        type: String,
        enum: ["text", "image", "video", "file", "emoji"],
        required: true,
      },
      content: {
        type: String,
        default: "", 
      },
      fileUrl: {
        type: String,
      },
      replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
      },
      read: {
        type: Boolean,
        default: false,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
}, {timestamps:true})

const Message=mongoose.model("Message", messageSchema)

export default Message
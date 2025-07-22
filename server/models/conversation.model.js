import mongoose from "mongoose";

const userConversationSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  lastMessage: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true
    },
    content: String,
    type: {
      type: String,
      enum: ["text", "image", "video", "file", "emoji"],
    },
    fileUrl: String,
    timestamp: Date,
    read: { type: Boolean, default: false }
  }
}, { timestamps: true });

userConversationSchema.index({ sender: 1, receiver: 1, owner: 1 }, { unique: true }); 
userConversationSchema.index({ owner: 1 });


const UserConversation = mongoose.model("UserConversation", userConversationSchema);

export default UserConversation;

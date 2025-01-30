import mongoose from "mongoose";
// Define a separate schema for replies
const replySchema = new mongoose.Schema({
    replyingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    reply: { type: String, required: [true, "Reply cannot be empty"] }, 
    likes: { type: Map, of: Boolean, default: {} } 
}, { timestamps: true }); 

// Define the main comment schema
const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'PostSchema', required: true }, 
    personId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    comment:{ type: String, required: [true, "comment cannot be empty"] },
    likes: { type: Map, of: Boolean, default: {} }, 
    replies: [replySchema] 
}, { timestamps: true }); 

const Comment=mongoose.model('Comment', commentSchema);

export default Comment

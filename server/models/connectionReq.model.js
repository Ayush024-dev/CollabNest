import mongoose from "mongoose";
const connectionRequestSchema = new mongoose.Schema({
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  });
  
  // Prevent duplicates
  connectionRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
  
  const ConnectionRequest = mongoose.model('ConnectionRequest', connectionRequestSchema);

  export default ConnectionRequest
  
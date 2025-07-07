import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // receiver
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // sender
  type: { type: String, enum: ['connection_req', 'connection_accepted', 'message'], required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification

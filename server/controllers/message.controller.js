import Message from "../models/messages.model.js";
import LastConversations from "../models/conversation.model.js";
import User from "../models/user.model.js";

import { ApiResponse } from "../utils/ApirResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import fs from 'fs/promises'


// controllers
const sendMessage = AsyncHandler(async (req, res) => {
  try {
    const { encryptedId, content, type, replyTo } = req.body

    const senderId = req.userId;

    if (!encryptedId || !type) throw new ApiError(400, "Receiver and message type are required");

    const receiverId = decrypt(encryptedId);

    const me = await User.findById(senderId);
    if (!me.connections.includes(receiverId)) {
      throw new ApiError(403, "Message not allowed because you're not a connection!!");
    }

    if (type === "text") {
      if (!content) throw new ApiError(400, "Empty content can't be there");
    }

    let fileLocalPath;
    let file;
    // console.log("My files: ", req.files);
    if (req.files && req.files.file && req.files.file[0]) {
      fileLocalPath = req.files.file[0].path;
      file = await uploadOnCloudinary(fileLocalPath);

      console.log(file);
    }

    const messageData = {
      sender: senderId,
      receiver: receiverId,
      content,
      type,
      replyTo: replyTo || null,
      fileUrl: file?.url || "",
    };

    const message = await Message.create(messageData);




    await LastConversations.findOneAndUpdate(
      {
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId }
        ]
      },
      {
        sender: senderId,
        receiver: receiverId,
        lastMessage: {
          content,
          fileUrl: file?.url || "",
          type,
          read: false,
        },
      },
      { upsert: true, new: true }
    );

    if (fileLocalPath) {
      try {
        await fs.unlink(fileLocalPath);
        console.log("local file removed successfully")
      } catch (unlinkError) {
        console.error("Failed to delete local file:", unlinkError);
      }
    }

    const encryptedMsg={
      ...message.toObject(),
      sender: encrypt(senderId.toString()),
      receiver: encrypt(receiverId.toString())
    }

    const io = req.app.get("io");
    const roomName = [encrypt(senderId.toString()), encrypt(receiverId.toString())].sort().join('-');
    // console.log(`Emitted newMessage to room ${roomName}`);
    io.to(roomName).emit("newMessage", {
      encryptedMsg,
    });

    io.to(encrypt(senderId.toString())).emit("update_converse", {
      conversation: {
        sender: encrypt(senderId.toString()),
        receiver: encrypt(receiverId.toString()),
        lastMessage: {
          content,
          fileUrl: file?.url || "",
          type,
          read: false,
        },
        updatedAt: message.updatedAt || new Date().toISOString(),
      }
    });
    io.to(encrypt(receiverId.toString())).emit("update_converse", {
      conversation: {
        sender: encrypt(senderId.toString()),
        receiver: encrypt(receiverId.toString()),
        lastMessage: {
          content,
          fileUrl: file?.url || "",
          type,
          read: false,
        },
        updatedAt: message.updatedAt || new Date().toISOString(),
      }
    });

    return res
      .status(201)
      .json(new ApiResponse(201, encryptedMsg, "Message sent successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, error?.message || "Not able to send message")
  }
});

const getMessage = AsyncHandler(async (req, res) => {
  try {
    const { encryptedId } = req.body;
    const myId = req.userId;

    if (!encryptedId) throw new ApiError(404, "User not found!!");

    const receiverId = decrypt(encryptedId);


    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: receiverId },
        { sender: receiverId, receiver: myId }
      ]
    }).sort({ createdAt: 1 });


    const encryptedMsg = messages.map((m) => ({
      ...m.toObject(),
      sender: encrypt(m.sender.toString()),
      receiver: encrypt(m.receiver.toString()),
    }));


    return res.json(
      new ApiResponse(200, encryptedMsg, "Messages fetched successfully")
    );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, error?.message || "Not able to get message!!");
  }
});


const lastConversation = AsyncHandler(async (req, res) => {
  try {
    const myId = req.userId;

    const LastConverse = await LastConversations.find({
      $or: [
        { sender: myId },
        { receiver: myId }
      ]
    }).sort({ updatedAt: -1 });

    const encryptedConversations = LastConverse.map((c) => ({
      ...c.toObject(),
      sender: encrypt(c.sender.toString()),
      receiver: encrypt(c.receiver.toString()),
    }));

    

    return res.json(
      new ApiResponse(200, encryptedConversations, "Last conversation fetched successfully!!")
    )
  } catch (error) {
    console.log(error);

    throw new ApiError(500, error?.message || "Last conversation not found")
  }
})

const EditMessage = AsyncHandler(async (req, res) => {
  try {
    const { message_id, type, newContent } = req.body;

    if (!message_id || !type) {
      throw new ApiError(400, "Message ID and operation type are required");
    }

    const validTypes = ["edit", "delete"];
    if (!validTypes.includes(type)) {
      throw new ApiError(400, "Invalid operation type");
    }

    const message = await Message.findById(message_id);
    if (!message) {
      throw new ApiError(404, "Message not found");
    }

    if (type === "edit") {
      if (!newContent) {
        throw new ApiError(400, "New content is required to edit the message");
      }

      message.content = newContent;
      await message.save();

      return res.status(200).json(
        new ApiResponse(200, message, "Message edited successfully")
      );
    }

    if (type === "delete") {

      if (message.fileUrl) {
        try {
          const publicId = extractPublicId(message.fileUrl);
          await cloudinary.uploader.destroy(publicId);
        } catch (mediaError) {
          console.warn("⚠️ Failed to delete media from Cloudinary:", mediaError.message);
        }
      }


      await Message.findByIdAndDelete(message_id);

      return res.status(200).json(
        new ApiResponse(200, null, "Message deleted successfully")
      );
    }

  } catch (error) {
    console.log(error);
    throw new ApiError(500, error?.message || "Failed to update message");
  }
});

const getLastSeen = AsyncHandler(async (req, res) => {
  try {
    const { encryptedId } = req.body;
    if (!encryptedId) throw new ApiError(400, "User ID is required");
    const userId = decrypt(encryptedId);
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    return res.json(
      new ApiResponse(200, { lastSeen: user.lastSeen }, "Last seen fetched successfully")
    );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, error?.message || "Could not fetch last seen");
  }
});

export {
  sendMessage,
  getMessage,
  lastConversation,
  EditMessage,
  getLastSeen
}
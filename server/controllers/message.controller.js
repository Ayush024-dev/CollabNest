import Message from "../models/messages.model.js";
import LastConversations from "../models/conversation.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

import { ApiResponse } from "../utils/ApirResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from 'fs/promises'
import { delete_from_cloudinary } from "../utils/Delete_from_cloudinary.js";


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

    let participants = [senderId, receiverId];

    const messageData = {
      sender: senderId,
      receiver: receiverId,
      content,
      type,
      replyTo: replyTo || null,
      fileUrl: file?.url || "",
      view: participants
    };

    const message = await Message.create(messageData);

    // Setting or updating last conversation 

    // This is when sender is me and receiver is other user
    await LastConversations.findOneAndUpdate(
      { owner: senderId },
      {
        sender: senderId,
        receiver: receiverId,
        lastMessage: {
          messageId: message._id,
          content,
          fileUrl: file?.url || "",
          type,
          read: false,
        },
      },
      { upsert: true, new: true }
    );

    // this is when other user is sender and I am receiver
    await LastConversations.findOneAndUpdate(
      { owner: receiverId },
      {
        sender: senderId,
        receiver: receiverId,
        lastMessage: {
          messageId: message._id,
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

    const encryptedMsg = {
      ...message.toObject(),
      sender: encrypt(senderId.toString()),
      receiver: encrypt(receiverId.toString()),
      view: message.view.map(id => encrypt(id.toString()))
    };


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
          messageId: message._id
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
          messageId: message._id
        },
        updatedAt: message.updatedAt || new Date().toISOString(),
      }
    });

    // Message notification logic
    const encryptedReceiverId = encrypt(receiverId.toString());
    const socketsInReceiverRoom = io.sockets.adapter.rooms.get(encryptedReceiverId);
    if (!socketsInReceiverRoom || socketsInReceiverRoom.size === 0) {
      // Receiver is not online, create notification
      const notification = await Notification.create({
        user: receiverId,
        from: senderId,
        type: 'message',
      });
      // Encrypt user and from fields for frontend
      const encryptedNotification = {
        ...notification.toObject(),
        user: encrypt(notification.user.toString()),
        from: encrypt(notification.from.toString()),
      };
      io.to(encryptedReceiverId).emit('newNotification', encryptedNotification);
    }

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
      $and: [
        {
          $or: [
            { sender: myId, receiver: receiverId },
            { sender: receiverId, receiver: myId }
          ]
        },
        { view: myId }
      ]
    }).sort({ createdAt: 1 });



    const encryptedMsg = messages.map((m) => ({
      ...m.toObject(),
      sender: encrypt(m.sender.toString()),
      receiver: encrypt(m.receiver.toString()),
      view: m.view.map(id => encrypt(id.toString()))
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

    const LastConverse = await LastConversations.find({ owner: myId }).sort({ updatedAt: -1 });

    const encryptedConversations = LastConverse.map((c) => ({
      ...c.toObject(),
      owner: encrypt(c.owner.toString()),
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
    const { messageId, newContent, roomName } = req.body;
    const io = req.app.get("io");

    if (!messageId || !newContent?.trim()) {
      throw new ApiError(400, "Message ID and new content are required");
    }

    // console.log("messageId: ", messageId);
    // console.log("newContent: ", newContent);
    // console.log("roomName: ", roomName);

    if (!roomName) throw new ApiError(404, "Room name not found!!");

    const [encSenderId, encReceiverId] = roomName.split("-");
    const senderId = decrypt(encSenderId);
    const receiverId = decrypt(encReceiverId);

    const message = await Message.findById(messageId);
    if (!message) {
      throw new ApiError(404, "Message not found");
    }

    const myId=req.userId;

    if(message.sender !== myId){
      throw new ApiError(403, "You are not allowed to edit this message");
    }

    message.content = newContent.trim();
    await message.save();



    // Emit the edit event to the room
    io.to(roomName).emit("messageEdited", {
      messageId: message._id,
      newContent: message.content,
      timestamp: new Date(),
    });

    const conversation = await LastConversations.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    // console.log("conversation: ", conversation);
    let lastMsgId;
    if (conversation) {

      for (const convo of conversation) {
        lastMsgId = convo.lastMessage.messageId;
        break;
      }


    }

    console.log("lastMsgId: ", lastMsgId);

    if (
      lastMsgId && lastMsgId.toString() === messageId
    ) {
      console.log("Inside the conversation")
      for (const convo of conversation) {
        const targetRoom = encrypt(convo.owner.toString());

        io.to(targetRoom).emit("edit_converse", {
          conversationId: convo._id, // each participant gets their conversationId
          lastMessage: {
            messageId: message._id,
            content: newContent.trim(),
            edited: true
          }
        });

        // Optional: update the stored lastMessage content
        if (
          convo.lastMessage &&
          convo.lastMessage.messageId.toString() === messageId
        ) {
          await LastConversations.updateOne(
            { _id: convo._id },
            {
              $set: {
                "lastMessage.content": newContent.trim(),
              }
            }
          );
        }
      }
    }


    return res.status(200).json(
      new ApiResponse(200, message, "Message edited successfully")
    );
  } catch (error) {
    console.log("Edit Message Error:", error);
    throw new ApiError(500, error?.message || "Failed to update message");
  }
});

const DeleteMessageForMe = AsyncHandler(async (req, res) => {
  try {
    const { messageId, type, roomName } = req.body;
    const myId = req.userId;
    const io = req.app.get("io");

    if (!messageId || !type || !roomName) {
      throw new ApiError(400, "Missing required parameters");
    }

    const [EncryptedsenderId, EncryptedreceiverId] = roomName.split("-");
    const senderId = decrypt(EncryptedsenderId);
    const receiverId = decrypt(EncryptedreceiverId);

    const message = await Message.findById(messageId);
    if (!message) {
      throw new ApiError(404, "Message not found");
    }
    // (No Cloudinary delete for 'delete for me')

    // Remove myId from view[]
    if (message.view.includes(myId)) {
      message.view = message.view.filter(
        (uid) => uid.toString() !== myId.toString()
      );
      await message.save();
    }

    // Check if it was lastMessage for me
    const myConvo = await LastConversations.findOne({
      owner: myId,
      $or: [
        {
          sender: senderId,
          receiver: receiverId,
        },
        {
          sender: receiverId,
          receiver: senderId,
        },
      ],
    });

    if (myConvo?.lastMessage?.messageId?.toString() === messageId) {
      // Find latest visible message for me
      const newLast = await Message.findOne({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId },
        ],
        view: myId,
      })
        .sort({ updatedAt: -1 })
        .lean();

      myConvo.lastMessage = newLast
        ? {
          messageId: newLast._id,
          content: newLast.content,
          type: newLast.type,
          timestamp: newLast.updatedAt,
          read: newLast.read
        }
        : null;

      myConvo.createdAt = newLast.createdAt;
      myConvo.updatedAt = newLast.updatedAt;

      await myConvo.save();

      // Emit event to my personal room
      io.to(encrypt(myId.toString())).emit("delete_converse", {
        myConvo
      });
    }

    // Emit delete event to update message in frontend
    io.to(encrypt(myId.toString())).emit("delete_message", {
      messageId,
      type,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Message deleted for me"));
  } catch (error) {
    console.error(error);
    throw new ApiError(500, error?.message || "Failed to delete message");
  }
});

const DeleteMessageForEveryone = AsyncHandler(async (req, res) => {
  try {
    const { messageId, type, roomName } = req.body;
    const myId = req.userId;
    const io = req.app.get("io");

    if (!messageId || !type || !roomName) {
      throw new ApiError(400, "Missing required parameters");
    }

    const [EncryptedsenderId, EncryptedreceiverId] = roomName.split("-");
    const senderId = decrypt(EncryptedsenderId);
    const receiverId = decrypt(EncryptedreceiverId);

    const message = await Message.findById(messageId);
    if (!message) {
      throw new ApiError(404, "Message not found");
    }

    if(message.sender !== myId){
      throw new ApiError(403, "You are not allowed to delete this message");
    }

    const messageType = message.type;
    const fileUrl = message.fileUrl;
    if (["image", "video", "file"].includes(messageType) && fileUrl) {
      try {
        const urlParts = fileUrl.split("/");
        const uploadIndex = urlParts.findIndex(part => part === "upload");
        if (uploadIndex !== -1 && urlParts.length > uploadIndex + 1) {
          const publicIdWithExt = urlParts.slice(uploadIndex + 1).join("/");
          const lastDot = publicIdWithExt.lastIndexOf(".");
          const publicId = lastDot !== -1 ? publicIdWithExt.substring(0, lastDot) : publicIdWithExt;
          await delete_from_cloudinary(publicId);
        }
      } catch (err) {
        console.error("Failed to extract public_id or delete from Cloudinary:", err);
      }
    }
    await Message.findByIdAndDelete(messageId);

    const conversations = await LastConversations.find({
      $or: [
        { owner: senderId },
        { owner: receiverId },
      ],
      $or: [
        {
          sender: senderId,
          receiver: receiverId,
        },
        {
          sender: receiverId,
          receiver: senderId,
        },
      ],
    });

    for (const convo of conversations) {
      const ownerId = convo.owner.toString();
      if (convo.lastMessage?.messageId?.toString() === messageId) {
        const newLast = await Message.findOne({
          $or: [
            { sender: senderId, receiver: receiverId },
            { sender: receiverId, receiver: senderId },
          ],
          view: ownerId,
        })
          .sort({ updatedAt: -1 })
          .lean();

        convo.lastMessage = newLast
          ? {
            messageId: newLast._id,
            content: newLast.content,
            type: newLast.type,
            timestamp: newLast.updatedAt,
            read: newLast.read
          }
          : null;

        convo.createdAt = newLast.createdAt;
        convo.updatedAt = newLast.updatedAt

        await convo.save();

        // Emit last message update
        io.to(encrypt(ownerId)).emit("delete_converse", {
          convo
        });
      }
    }

    // Emit delete message event to both
    io.to(roomName).emit("delete_message", {
      messageId,
      type,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Message deleted for everyone"));
  } catch (error) {
    console.error(error);
    throw new ApiError(500, error?.message || "Failed to delete message");
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
  DeleteMessageForMe,
  DeleteMessageForEveryone,
  getLastSeen
}
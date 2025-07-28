import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "http"
import LastConversations from "./models/conversation.model.js";
import { encrypt, decrypt } from "./utils/encryption.js";
import User from "./models/user.model.js";
import Message from "./models/messages.model.js";


const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
})

io.on("connection", (socket) => {
    // console.log("user connected");
    // console.log("socket id ", socket.id);

    socket.on('joinRoom', async ({room, type}) => {
        socket.join(room);
        // console.log(`[Server] Socket ${socket.id} joined room ${room} of type ${type}`);
        
        // Debug: Log all rooms this socket is in
        const socketRooms = Array.from(socket.rooms);
        // console.log(`[Server] Socket ${socket.id} is now in rooms:`, socketRooms);
        
        if (type === "Personal") {
            socket.userRoom = room; // Always set
            const decryptedUserId = decrypt(room);
            // console.log(`[Server] New personal room join for user: ${decryptedUserId}`);

            try {
                const userId = decryptedUserId;

                const UserConverse = await LastConversations.find({
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                })

                if(UserConverse){
                    // console.log(`[Server] User ${userId} has ${UserConverse.length} contacts`);
                    const notifiedContacts = new Set(); // Prevent double notifications
                    UserConverse.forEach(contact =>{
                        let contactId, encryptedContactId;
                        if(contact.sender.toString() === userId) {
                            contactId = contact.receiver.toString();
                        } else {
                            contactId = contact.sender.toString();
                        }
                        
                        // Prevent double notifications to the same contact
                        if (notifiedContacts.has(contactId)) {
                            // console.log(`[Server] Skipping duplicate notification to contact ${contactId}`);
                            return;
                        }
                        notifiedContacts.add(contactId);
                        
                        encryptedContactId = encrypt(contactId);
                        // console.log(`[Server] Notifying contact ${contactId} (encrypted: ${encryptedContactId}) that user ${userId} (encrypted: ${room}) is online`);
                        io.to(encryptedContactId).emit("userOnline", { userId: room });
                    })
                }

                // Notify the joining user about all their contacts who are online
                if(UserConverse){
                    for (const contact of UserConverse) {
                        let contactId, encryptedContactId;
                        if(contact.sender.toString() === userId) {
                            contactId = contact.receiver.toString();
                        } else {
                            contactId = contact.sender.toString();
                        }
                        encryptedContactId = encrypt(contactId);
                        // console.log(`[Server] Checking if contact ${contactId} (encrypted: ${encryptedContactId}) is online: ${socketsInContactRoom ? socketsInContactRoom.size : 0} sockets`);
                        const socketsInContactRoom = io.sockets.adapter.rooms.get(encryptedContactId);
                        if (socketsInContactRoom && socketsInContactRoom.size > 0) {
                            // console.log(`[Server] Notifying user ${userId} (encrypted: ${room}) that contact ${contactId} (encrypted: ${encryptedContactId}) is online`);
                            io.to(room).emit("userOnline", { userId: encryptedContactId });
                        }
                    }
                }
            } catch (error) {
                // console.log(error);
            }
        }
    });

    socket.on('leaveRoom', async ({ room, type }) => {
        socket.leave(room);
        // console.log(`[Server] Socket ${socket.id} left room ${room} of type ${type}`);
        
        // Debug: Log all rooms this socket is in after leaving
        const socketRooms = Array.from(socket.rooms);
        // console.log(`[Server] Socket ${socket.id} is now in rooms:`, socketRooms);

        if (type === "Personal") {
            try {
                const userId = decrypt(room);
                const timestamp = new Date();
                
                // Check if this was the last socket for this user
                const socketsInRoom = io.sockets.adapter.rooms.get(room);
                if (!socketsInRoom || socketsInRoom.size === 0) {
                    // console.log(`[Server] User ${userId} is now completely offline. Updating lastSeen and notifying contacts.`);
                    // Update lastSeen in DB only when user is completely offline
                    await User.findByIdAndUpdate(userId, { lastSeen: timestamp });
                    
                    const UserConverse = await LastConversations.find({
                        $or: [{ sender: userId }, { receiver: userId }]
                    });
                    UserConverse.forEach(contact => {
                        const contactId = contact.sender.toString() === userId
                            ? contact.receiver.toString()
                            : contact.sender.toString();
                        const encryptedContactId = encrypt(contactId);
                        // console.log(`[Server] Notifying contact ${contactId} (encrypted: ${encryptedContactId}) that user ${userId} (encrypted: ${room}) is offline`);
                        io.to(encryptedContactId).emit('userOffline', { userId: room, timestamp });
                    });
                }
            } catch (e) {
                // console.log(e);
            }
        }
    });

    socket.on('disconnect', async () => {
        // console.log(`[Server] User disconnected: ${socket.id}`);
        
        if (socket.userRoom) {
            const socketsInRoom = io.sockets.adapter.rooms.get(socket.userRoom);
            if (!socketsInRoom || socketsInRoom.size === 0) {
                // This was the last socket for this user
                const userId = decrypt(socket.userRoom);
                const timestamp = new Date();
                // console.log(`[Server] Last socket for user ${userId} (encrypted: ${socket.userRoom}) disconnected, updating lastSeen and notifying contacts.`);
                try {
                    await User.findByIdAndUpdate(userId, { lastSeen: timestamp });
                    const UserConverse = await LastConversations.find({
                        $or: [{ sender: userId }, { receiver: userId }]
                    });
                    UserConverse.forEach(contact => {
                        const contactId = contact.sender.toString() === userId
                            ? contact.receiver.toString()
                            : contact.sender.toString();
                        const encryptedContactId = encrypt(contactId);
                        // console.log(`[Server] Notifying contact ${contactId} (encrypted: ${encryptedContactId}) that user ${userId} (encrypted: ${socket.userRoom}) is offline`);
                        io.to(encryptedContactId).emit('userOffline', { userId: socket.userRoom, timestamp });
                    });
                } catch (e) {
                    // console.log('[Server] Error in disconnect handler:', e);
                }
            }
        }
        
        // Clean up any remaining rooms for this socket
        const socketRooms = Array.from(socket.rooms);
        // console.log(`[Server] Cleaning up rooms for socket ${socket.id}:`, socketRooms);
    });

    // Handle logout event
    socket.on('logout', () => {
        // console.log(`[Server] User logged out: ${socket.id}`);
        // Broadcast logout event to all clients
        io.emit('logout');
    });

    // Handle marking messages as read when chat is opened
    socket.on('readMessages', async ({ conversationId }) => {
        try {
            // conversationId is the room name: [encA, encB].sort().join('-')
            const [encA, encB] = conversationId.split('-');
            const userId = decrypt(socket.userRoom); // The receiver (current user)
            const contactId = (decrypt(encA) === userId) ? decrypt(encB) : decrypt(encA);

            // Mark all unread messages as read
            await Message.updateMany({
                sender: contactId,
                receiver: userId,
                read: false
            }, { $set: { read: true } });

            // Find the last message in this conversation
            const lastMsg = await Message.findOne({
                $or: [
                    { sender: contactId, receiver: userId },
                    { sender: userId, receiver: contactId }
                ]
            }).sort({ updatedAt: -1 });

            // Emit to update UI for receiver
            io.to(socket.userRoom).emit('unreadCountReset', { conversationId });

            if (lastMsg) {
                // Emit update_converse to the sender's personal room
                io.to(encrypt(lastMsg.sender)).emit('update_converse', {
                    conversation: {
                        sender: encrypt(contactId),
                        receiver: encrypt(userId),
                        lastMessage: {
                            messageId: lastMsg._id,
                            content: lastMsg.content,
                            fileUrl: lastMsg.fileUrl,
                            type: lastMsg.type,
                            read: true,
                            timestamp: lastMsg.updatedAt,
                        },
                        updatedAt: lastMsg.updatedAt,
                    }
                });
                // Emit messageRead for the last message to the sender for right panel tick
                io.to(encrypt(contactId)).emit('messageRead', {
                    messageId: lastMsg._id,
                    conversationId
                });
            }
        } catch (e) {
            // console.log('[Server] Error in readMessages handler:', e);
        }
    });
})

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))
app.use(cookieParser())

app.set('io', io);


//routes
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import messageRoutes from "./routes/message.routes.js"

app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/message", messageRoutes);


export { server };
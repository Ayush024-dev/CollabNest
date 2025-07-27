import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "http"
import LastConversations from "./models/conversation.model.js";
import { encrypt, decrypt } from "./utils/encryption.js";
import User from "./models/user.model.js";


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
    console.log("user connected");
    console.log("socket id ", socket.id);

    socket.on('joinRoom', async ({room, type}) => {
        socket.join(room);
        console.log(`[Server] Socket ${socket.id} joined room ${room} of type ${type}`);
        
        // Debug: Log all rooms this socket is in
        const socketRooms = Array.from(socket.rooms);
        console.log(`[Server] Socket ${socket.id} is now in rooms:`, socketRooms);
        
        if (type === "Personal") {
            socket.userRoom = room; // Store encrypted userId on socket

            try {
                const userId = decrypt(room);

                const UserConverse = await LastConversations.find({
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                })

                if(UserConverse){
                    console.log(`[Server] User ${userId} has ${UserConverse.length} contacts`);
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
                            console.log(`[Server] Skipping duplicate notification to contact ${contactId}`);
                            return;
                        }
                        notifiedContacts.add(contactId);
                        
                        encryptedContactId = encrypt(contactId);
                        // Notify all contacts that this user is online
                        console.log(`[Server] Notifying contact ${contactId} that user ${userId} is online`);
                        io.to(encryptedContactId).emit('userOnline', { userId: room });
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
                        // Check if the contact's personal room has any sockets (i.e., is online)
                        const socketsInContactRoom = io.sockets.adapter.rooms.get(encryptedContactId);
                        console.log(`[Server] Checking if contact ${contactId} is online: ${socketsInContactRoom ? socketsInContactRoom.size : 0} sockets`);
                        if (socketsInContactRoom && socketsInContactRoom.size > 0) {
                            // Notify the joining user that this contact is online
                            console.log(`[Server] Notifying user ${userId} that contact ${contactId} is online`);
                            io.to(room).emit('userOnline', { userId: encryptedContactId });
                        }
                    }
                }
            } catch (error) {
                console.log(error);
            }
        }
    });

    socket.on('leaveRoom', async ({ room, type }) => {
        socket.leave(room);
        console.log(`[Server] Socket ${socket.id} left room ${room} of type ${type}`);
        
        // Debug: Log all rooms this socket is in after leaving
        const socketRooms = Array.from(socket.rooms);
        console.log(`[Server] Socket ${socket.id} is now in rooms:`, socketRooms);

        if (type === "Personal") {
            try {
                const userId = decrypt(room);
                const timestamp = new Date();
                
                // Check if this was the last socket for this user
                const socketsInRoom = io.sockets.adapter.rooms.get(room);
                if (!socketsInRoom || socketsInRoom.size === 0) {
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
                        // Notify contacts that this user is offline
                        io.to(encryptedContactId).emit('userOffline', { userId: room, timestamp });
                    });
                }
            } catch (e) {
                console.log(e);
            }
        }
    });

    socket.on('disconnect', async () => {
        console.log(`[Server] User disconnected: ${socket.id}`);
        
        if (socket.userRoom) {
            const socketsInRoom = io.sockets.adapter.rooms.get(socket.userRoom);
            if (!socketsInRoom || socketsInRoom.size === 0) {
                // This was the last socket for this user
                const userId = decrypt(socket.userRoom);
                const timestamp = new Date();
                console.log(`[Server] Last socket for user ${userId} disconnected, updating lastSeen`);
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
                        console.log(`[Server] Notifying contact ${contactId} that user ${userId} is offline`);
                        io.to(encryptedContactId).emit('userOffline', { userId: socket.userRoom, timestamp });
                    });
                } catch (e) {
                    console.log('[Server] Error in disconnect handler:', e);
                }
            }
        }
        
        // Clean up any remaining rooms for this socket
        const socketRooms = Array.from(socket.rooms);
        console.log(`[Server] Cleaning up rooms for socket ${socket.id}:`, socketRooms);
    });

    // Handle logout event
    socket.on('logout', () => {
        console.log(`[Server] User logged out: ${socket.id}`);
        // Broadcast logout event to all clients
        io.emit('logout');
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
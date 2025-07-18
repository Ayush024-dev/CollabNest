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

        if (type === "Chat") {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room ${room}`);
        }
        else if (type === "Personal") {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room ${room}`);

            try {
                const userId = decrypt(room);

                const UserConverse = await LastConversations.find({
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                })

                if(UserConverse){
                    UserConverse.forEach(contact =>{
                        let contactId, encryptedContactId;
                        if(contact.sender.toString() === userId) {
                            contactId = contact.receiver.toString();
                        } else {
                            contactId = contact.sender.toString();
                        }
                        encryptedContactId = encrypt(contactId);
                        // Always emit as { userId: encryptedUserId }
                        io.to(encryptedContactId).emit('userOnline', { userId: room });
                    })
                }

                // NEW: Notify the joining user about all their contacts who are online
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
                        if (socketsInContactRoom && socketsInContactRoom.size > 0) {
                            // Notify the joining user that this contact is online
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
        console.log(`Socket ${socket.id} left room ${room}`);

        if (type === "Personal") {
            try {
                const userId = decrypt(room);
                const timestamp = new Date();
                // Update lastSeen in DB
                await User.findByIdAndUpdate(userId, { lastSeen: timestamp }); // Assuming User model is available
                const UserConverse = await LastConversations.find({
                    $or: [{ sender: userId }, { receiver: userId }]
                });
                UserConverse.forEach(contact => {
                    const contactId = contact.sender.toString() === userId
                        ? contact.receiver.toString()
                        : contact.sender.toString();
                    const encryptedContactId = encrypt(contactId);
                    // Always emit as { userId: encryptedUserId, timestamp }
                    io.to(encryptedContactId).emit('userOffline', { userId: room, timestamp });
                });
            } catch (e) {
                console.log(e);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
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
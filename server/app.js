import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "http"
import LastConversations from "./models/conversation.model.js";
import { encrypt, decrypt } from "./utils/encryption.js";


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
                        if(contact.sender.toString() === userId) {
                            io.to(encrypt(contact.receiver.toString())).emit('userOnline',room);
                        }
                        else {
                            io.to(encrypt(contact.sender.toString())).emit('userOnline', room);
                        }
                    })
                }
            } catch (error) {
                console.log(error);
            }
        }
    });

    socket.on('leaveRoom', (room) => {
        socket.leave(room);
        console.log(`Socket ${socket.id} left room ${room}`);
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
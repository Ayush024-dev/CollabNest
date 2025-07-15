import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "http"


const app=express();
const server= createServer(app);

const io= new Server(server, {
    cors:{
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    }
})

io.on("connection",(socket)=>{
    console.log("user connected");
    console.log("socket id ",socket.id);

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
})

app.use(cors({
    origin:'http://localhost:3000',
    credentials:true
}));

app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(cookieParser())

app.set('io',io);


//routes
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import messageRoutes from "./routes/message.routes.js"

app.use("/api/v1/users" , userRouter);
app.use("/api/v1/posts",postRouter);
app.use("/api/v1/message", messageRoutes);


export { server };
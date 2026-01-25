import express from 'express';
import "dotenv/config";
import cors from "cors";
import http from "http"
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';


//create express app and http server
const app = express();
const server = http.createServer(app);

// Create Socket,io server
export const io = new Server(server, {
    cors: { origin: "*" }

})

//store online users
export const userSocketMap = {}; //{userId: socketId}

//Socket.io connection handler
io.on("connection", (Socket) => {
    const userId = Socket.handshake.query.userId;
    console.log("User Connection", userId);
    if (userId) userSocketMap[userId] = Socket.id;
    // emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    Socket.on("disconnect", () => {
        console.log("User disconnected");
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})
// Middlewares
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// Routes 
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Connect to mogodb
await connectDB();



const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log("Server is running on PORT: ", + PORT));


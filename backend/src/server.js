import express from "express"
import "dotenv/config"
import cors from "cors"

import authRoutes from "./routes/auth.route.js"
import userRoutes from "./routes/user.route.js"
import chatRoutes from "./routes/chat.route.js"

import { connectDB } from "./lib/db.js"
import cookieParser from "cookie-parser" // middleware để parse cookie

const app = express()
const PORT = process.env.PORT

app.use(
    cors({
        origin: ["http://localhost:5173", "http://localhost:5174"], // URL của frontend
        credentials: true, // approve gửi cookie từ frontend
    })
)

app.use(express.json()) // middleware để parse JSON body
app.use(cookieParser()) // middleware để parse cookie

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/chat", chatRoutes)

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
    connectDB()
})
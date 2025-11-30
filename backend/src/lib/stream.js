import {StreamChat} from "stream-chat"
import "dotenv/config"

const apiKey = process.env.STREAM_API_KEY
const apiSecret = process.env.STREAM_API_SECRET

if(!apiKey || !apiSecret) {
    console.error("Stream API key or secret is missing")
}
const streamClient = StreamChat.getInstance(apiKey, apiSecret)


// Upsert a Stream user
export const upsertStreamUser = async (userData) => {
    try{
        await streamClient.upsertUser(userData)
        console.log("Upsert Stream user:", userData)
        return userData
    }catch(error){
        console.error("Error upsetting Stream user:", error)
        throw new Error("Failed to upsert Stream user")
    }
}
// Generate a Stream token for a user
// export const generateStreamToken = (userId) => {
//     try {
//         const token = streamClient.createToken(userId)
//         return token
//     } catch (error) {
//         console.error("Error generating Stream token:", error)
//         throw new Error("Failed to generate Stream token")
//     }
// }

export const generateStreamToken = (userId) => {
    try {
        const userIdStr = userId.toString()
        return streamClient.createToken(userIdStr)
    } catch (error) {
        console.error("Error generating Stream token:", error)
    }
}
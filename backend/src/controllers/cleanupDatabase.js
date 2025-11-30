// cleanupDatabase.js - XÓA TẤT CẢ
import mongoose from "mongoose";
import FriendRequest from "../models/FriendRequest.js";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Kết nối MongoDB thành công");

    // XÓA TẤT CẢ FRIEND REQUESTS
    const result = await FriendRequest.deleteMany({});
    console.log(`✅ Đã xóa TẤT CẢ ${result.deletedCount} friend requests`);

    const count = await FriendRequest.countDocuments();
    console.log(`Còn lại ${count} friend requests trong DB`);

    process.exit(0);
  } catch (error) {
    console.error("Lỗi cleanup:", error);
    process.exit(1);
  }
}

cleanup();

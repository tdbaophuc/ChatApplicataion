import User from "../models/User.js"
import FriendRequest from "../models/FriendRequest.js"


export async function getRecommendedUsers(req, res){
    try{
        const currentUserId = req.user.id
        const currentUser = req.user
        
        const recommendedUsers = await User.find({
            $and: [
                {_id: {$ne: currentUserId}},
                {_id: {$nin: currentUser.friends}},
                {isOnboarded: true}
            ]
        })
        res.status(200).json(recommendedUsers)

    }catch(error){
        console.error("Error getRecommendedUser", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

export async function getMyFriends(req, res){ 
    try{
        const user = await User.findById(req.user.id)
        .select("friends")
        .populate("friends", "fullName profilePic nativeLanguage learningLanguage")

    res.status(200).json(user.friends)
    }catch(error){
        console.error("Error in getMyFriends controller", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

export async function sendFriendRequest(req, res){
    try{
        const myId = req.user.id
        const { id: recipientId } = req.params // lấy id người nhận từ param  
        
        if(myId === recipientId){
            return res.status(400).json({ message: "You can't send friend request to yourself" })
        }

        const recipient = await User.findById(recipientId)
        if(!recipient){
            return res.status(404).json({ message: "Recipient not found" })
        }

        if(recipient.friends.includes(myId)){
            return res.status(400).json({ message: "You are already friends with this user" })
        }

        const existingRequest = await FriendRequest.findOne({
            $or: [
                {sender: myId, recipient: recipientId},
                {sender: recipientId, recipient: myId}
            ],
            status: {$in: ["pending", "accepted"]}
        })

        if(existingRequest){
            return res
            .status(400)
            .json({ message: "A friend request already exists between you and this user" })
        }

        const friendRequest = await FriendRequest.create({
            sender: myId,
            recipient: recipientId
        }) 
         res.status(201).json(friendRequest);
    }catch(error){
        console.error("Error in sendFriendRequest controller", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

export async function acceptFriendRequest(req, res){
    try{
        const { id: requestId } = req.params

        const friendRequest = await FriendRequest.findById(requestId)
        if(!friendRequest){
            return res.status(404).json({ message: "Friend request not found" })
        }

        // kiểm tra quyền chấp nhận, người nhận mới mới chấp nhận
        if(friendRequest.recipient.toString() !== req.user.id){
            return res.status(403).json({ message: "You are not authorized to accept this request" })
        }
        friendRequest.status = "accepted"
        await friendRequest.save()

        await User.findByIdAndUpdate(friendRequest.sender, {
            $addToSet: { friends: friendRequest.recipient }
        }
        )

        await User.findByIdAndUpdate(friendRequest.recipient, {
            $addToSet: { friends: friendRequest.sender }
        })

        res.status(200).json({ message: "Friend request accepted" })

    }catch(error){
        console.error("Error in acceptFriendRequest controller", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


export async function getOutgoingFriendReq(req, res){
    try {
        const outgoingRequests = await FriendRequest.find({
            sender: req.user.id,
            status: "pending"
        }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage")

        res.status(200).json(outgoingRequests)
    } catch (error) {
        console.error("Error in getOutgoingFriendReq controller", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

export async function declineFriendRequest(req, res) {
    try{
        const {id: requestId} = req.params
        const currentUserId = req.user.id

        const friendRequest = await FriendRequest.findById(requestId)
        if(!friendRequest){
            return res.status(404).json({ message: "Friend request not found" });
        }

        if(friendRequest.recipient.toString() !== currentUserId){
            return res.status(403).json({ message: "You can only cancle request sent to you" });
        }

        if(friendRequest.status !== "pending"){
            return res.status(400).json({ message: "Friend request is not pending" });
        }

        friendRequest.status = "declined";
        await friendRequest.save();

        res.status(200).json({ message: "Friend request cancelled successfully", friendRequest });
    }catch(error){
        console.error("Error declining friend request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
}

export async function removeFriend(req, res) {
  try {
    const { id: friendId } = req.params;
    const currentUserId = req.user.id;

    if (!friendId || friendId == currentUserId) {
      return res.status(400).json({ message: "Invalid friend ID" });
    }

    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser.friends.includes(friendId)) {
      return res
        .status(400)
        .json({ message: "You are not friends with this user" });
    }

    // XÓA KHỎI FRIENDS LIST
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: currentUserId },
    });

    // ← SỬA: XÓA HOÀN TOÀN FRIEND REQUEST THAY VÌ UPDATE STATUS
    await FriendRequest.deleteMany({
      $or: [
        { sender: currentUserId, recipient: friendId },
        { sender: friendId, recipient: currentUserId },
      ],
    });

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
    console.error("Error removing friend:", error.message);
  }
}

export async function cancelFriendRequest(req, res) {
    try{
        const {id: requestId} = req.params
        const currentUserId = req.user.id

        const friendRequest = await FriendRequest.findById(requestId)
        if(!friendRequest){
            return res.status(404).json({ message: "Friend request not found" });
        }

        if(friendRequest.sender.toString() !== currentUserId){
            return res.status(403).json({ message: "You can only cancel requests you sent" });
        }

        if(friendRequest.status !== "pending"){
            return res.status(400).json({ message: "Friend request is not pending" });
        }

        await FriendRequest.findByIdAndDelete(requestId)

        res.status(200).json({ message: "Friend request cancelled successfully" });

    }catch(error){
        console.error("Error cancelling friend request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
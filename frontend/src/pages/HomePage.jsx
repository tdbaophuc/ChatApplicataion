import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  cancelFriendRequest,
  getOutgoingFriendReq,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
} from "../lib/api";
import { Link } from "react-router";
import {MapPinIcon, UserPlusIcon, UsersIcon, XIcon } from "lucide-react";

import { capitalize } from "../lib/until.js";

import FriendCard, { getLanguageFlag } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";

const HomePage = () => {
  const queryClient = useQueryClient();
  const [loadingUsers, setLoadingUsers] = useState(new Set()); // Track loading users

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsersQuery } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  const { data: outgoingFriendReq = [] } = useQuery({
    queryKey: ["outgoingFriendReq"],
    queryFn: getOutgoingFriendReq,
  });

  const getRequestIdByUserId = (userId) => {
    const request = outgoingFriendReq?.find(req => req.recipient._id === userId);
    return request?._id;
  };

  const { mutate: sendRequestMutation } = useMutation({
    mutationFn: sendFriendRequest,
    onMutate: (userId) => {
      // Add user to loading set
      setLoadingUsers(prev => new Set([...prev, userId]));
    },
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReq"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // Remove user from loading set
      setLoadingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    },
    onError: (error, userId) => {
      console.error("Error sending friend request:", error);
      // Remove user from loading set
      setLoadingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  });

  const { mutate: cancelRequestMutation } = useMutation({
    mutationFn: cancelFriendRequest,
    onMutate: (requestId) => {
      // Find userId by requestId
      const request = outgoingFriendReq?.find(req => req._id === requestId);
      if (request) {
        setLoadingUsers(prev => new Set([...prev, request.recipient._id]));
      }
    },
    onSuccess: (data, requestId) => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReq"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // Find userId and remove from loading set
      const request = outgoingFriendReq?.find(req => req._id === requestId);
      if (request) {
        setLoadingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(request.recipient._id);
          return newSet;
        });
      }
    },
    onError: (error, requestId) => {
      console.error("Error cancelling friend request:", error);
      // Find userId and remove from loading set
      const request = outgoingFriendReq?.find(req => req._id === requestId);
      if (request) {
        setLoadingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(request.recipient._id);
          return newSet;
        });
      }
      alert("Không thể hủy lời mời kết bạn!");
    }
  });

  const isPendingRequest = (userId) => {
    return outgoingFriendReq?.some(req => req.recipient._id === userId);
  };

  if (loadingFriends || loadingUsersQuery) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Friends Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <UsersIcon className="size-6 text-emerald-600" />
          <h2 className="text-xl font-semibold">My Friends</h2>
        </div>

        {friends.length === 0 ? (
          <NoFriendsFound />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <FriendCard key={friend._id} friend={friend} />
            ))}
          </div>
        )}
      </div>

      {/* Recommended Users Section - Clean & Theme-aware */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <UserPlusIcon className="size-6 text-blue-600" />
            <h2 className="text-xl font-semibold">People You May Know</h2>
          </div>
          <div className="badge badge-neutral badge-sm">
            {recommendedUsers.length} people
          </div>
        </div>

        {recommendedUsers.length === 0 ? (
          <div className="text-center py-12">
            <UserPlusIcon className="size-16 text-base-content/20 mx-auto mb-4" />
            <p className="text-base-content/60 text-lg">No recommendations available</p>
            <p className="text-base-content/40 text-sm mt-1">Check back later for new suggestions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendedUsers.map((user) => (
              <div key={user._id} className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow duration-200 border border-base-300">
                <div className="card-body p-4">
                  <div className="flex items-center justify-between">
                    
                    {/* Left: User Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <Link to={`/profile/${user._id}`}>
                        <div className="avatar">
                          <div className="w-14 h-14 rounded-full ring-2 ring-base-300 hover:ring-primary transition-colors">
                            <img
                              src={user.profilePic || "/avatar.png"}
                              alt={user.fullName}
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </Link>
                      
                      <div className="flex-1">
                        <Link to={`/profile/${user._id}`}>
                          <h3 className="font-semibold text-base hover:text-primary cursor-pointer transition-colors">
                            {user.fullName}
                          </h3>
                        </Link>
                        
                        <div className="flex items-center gap-1 text-sm text-base-content/60 mb-2">
                          <MapPinIcon className="size-3" />
                          <span>{user.location || "Unknown"}</span>
                        </div>

                        {/* Languages - Horizontal Layout */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base-content/50">Native:</span>
                            <span className="text-lg">{getLanguageFlag(user.nativeLanguage)}</span>
                            <span className="font-medium text-base-content/80">
                              {capitalize(user.nativeLanguage)}
                            </span>
                          </div>
                          
                          <div className="text-base-content/30">→</div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="text-base-content/50">Learning:</span>
                            <span className="text-lg">{getLanguageFlag(user.learningLanguage)}</span>
                            <span className="font-medium text-base-content/80">
                              {capitalize(user.learningLanguage)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Button */}
                    <div className="ml-4">
                      {isPendingRequest(user._id) ? (
                        <button
                          className="btn btn-error btn-sm"
                          onClick={() => {
                            const requestId = getRequestIdByUserId(user._id);
                            if (!requestId) {
                              alert("Không tìm thấy requestId để hủy!");
                              return;
                            }
                            cancelRequestMutation(requestId);
                          }}
                          disabled={loadingUsers.has(user._id)} // Check specific user
                        >
                          {loadingUsers.has(user._id) ? ( // Check specific user
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <>
                              <XIcon className="size-4 mr-1" />
                              Cancel
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => sendRequestMutation(user._id)}
                          disabled={loadingUsers.has(user._id)} // Check specific user
                        >
                          {loadingUsers.has(user._id) ? ( // Check specific user
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <>
                              <UserPlusIcon className="size-4 mr-1" />
                              Add Friend
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;

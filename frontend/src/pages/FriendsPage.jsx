import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelFriendRequest,
  getOutgoingFriendReq,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
  removeFriend,
} from "../lib/api";
import { Link } from "react-router";
import {
  MapPinIcon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
  SearchIcon,
  FilterIcon,
  GlobeIcon,
  BookOpenIcon,
} from "lucide-react";

import { capitalize } from "../lib/until.js";
import FriendCard, { getLanguageFlag } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";

const FriendsPage = () => {
  const queryClient = useQueryClient();
  const [loadingUsers, setLoadingUsers] = useState(new Set());

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    nativeLanguage: "",
    learningLanguage: "",
    location: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // 🆕 Load More state
  const [displayCount, setDisplayCount] = useState(5);

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsersQuery } =
    useQuery({
      queryKey: ["users"],
      queryFn: getRecommendedUsers,
    });

  const { data: outgoingFriendReq = [] } = useQuery({
    queryKey: ["outgoingFriendReq"],
    queryFn: getOutgoingFriendReq,
  });

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const allUsers = [...friends, ...recommendedUsers];
    return {
      nativeLanguages: [
        ...new Set(allUsers.map((user) => user.nativeLanguage).filter(Boolean)),
      ],
      learningLanguages: [
        ...new Set(
          allUsers.map((user) => user.learningLanguage).filter(Boolean)
        ),
      ],
      locations: [
        ...new Set(allUsers.map((user) => user.location).filter(Boolean)),
      ],
    };
  }, [friends, recommendedUsers]);

  // Filter and search logic
  const filteredFriends = useMemo(() => {
    return friends.filter((friend) => {
      const matchesSearch = friend.fullName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesNativeLanguage =
        !filters.nativeLanguage ||
        friend.nativeLanguage === filters.nativeLanguage;
      const matchesLearningLanguage =
        !filters.learningLanguage ||
        friend.learningLanguage === filters.learningLanguage;
      const matchesLocation =
        !filters.location || friend.location === filters.location;

      return (
        matchesSearch &&
        matchesNativeLanguage &&
        matchesLearningLanguage &&
        matchesLocation
      );
    });
  }, [friends, searchTerm, filters]);

  const filteredRecommendedUsers = useMemo(() => {
    return recommendedUsers.filter((user) => {
      const matchesSearch = user.fullName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesNativeLanguage =
        !filters.nativeLanguage ||
        user.nativeLanguage === filters.nativeLanguage;
      const matchesLearningLanguage =
        !filters.learningLanguage ||
        user.learningLanguage === filters.learningLanguage;
      const matchesLocation =
        !filters.location || user.location === filters.location;

      return (
        matchesSearch &&
        matchesNativeLanguage &&
        matchesLearningLanguage &&
        matchesLocation
      );
    });
  }, [recommendedUsers, searchTerm, filters]);

  // 🆕 Displayed users with limit
  const displayedRecommendedUsers = useMemo(() => {
    return filteredRecommendedUsers.slice(0, displayCount);
  }, [filteredRecommendedUsers, displayCount]);

  const hasMoreUsers = filteredRecommendedUsers.length > displayCount;
  const remainingCount = filteredRecommendedUsers.length - displayCount;

  // 🆕 Reset display count when filters change
  useEffect(() => {
    setDisplayCount(5);
  }, [searchTerm, filters]);

  const getRequestIdByUserId = (userId) => {
    const request = outgoingFriendReq?.find(
      (req) => req.recipient._id === userId
    );
    return request?._id;
  };

  const { mutate: sendRequestMutation } = useMutation({
    mutationFn: sendFriendRequest,
    onMutate: (userId) => {
      setLoadingUsers((prev) => new Set([...prev, userId]));
    },
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReq"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setLoadingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    },
    onError: (error, userId) => {
      console.error("Error sending friend request:", error);
      setLoadingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    },
  });

  const { mutate: cancelRequestMutation } = useMutation({
    mutationFn: cancelFriendRequest,
    onMutate: (requestId) => {
      const request = outgoingFriendReq?.find((req) => req._id === requestId);
      if (request) {
        setLoadingUsers((prev) => new Set([...prev, request.recipient._id]));
      }
    },
    onSuccess: (data, requestId) => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReq"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      const request = outgoingFriendReq?.find((req) => req._id === requestId);
      if (request) {
        setLoadingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(request.recipient._id);
          return newSet;
        });
      }
    },
    onError: (error, requestId) => {
      console.error("Error cancelling friend request:", error);
      const request = outgoingFriendReq?.find((req) => req._id === requestId);
      if (request) {
        setLoadingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(request.recipient._id);
          return newSet;
        });
      }
      alert("Không thể hủy lời mời kết bạn!");
    },
  });

  const { mutate: removeFriendMutation } = useMutation({
    mutationFn: removeFriend,
    onMutate: (friendId) => {
      setLoadingUsers((prev) => new Set([...prev, friendId]));
    },
    onSuccess: (data, friendId) => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setLoadingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    },
    onError: (error, friendId) => {
      console.error("Error removing friend:", error);
      setLoadingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
      alert("Không thể hủy kết bạn!");
    },
  });

  const isPendingRequest = (userId) => {
    return outgoingFriendReq?.some((req) => req.recipient._id === userId);
  };

  const clearFilters = () => {
    setFilters({
      nativeLanguage: "",
      learningLanguage: "",
      location: "",
    });
    setSearchTerm("");
    setDisplayCount(5); // 🆕 Reset display count
  };

  const hasActiveFilters =
    searchTerm ||
    filters.nativeLanguage ||
    filters.learningLanguage ||
    filters.location;

  // 🆕 Load More handler
  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 5);
  };

  const handleShowAll = () => {
    setDisplayCount(filteredRecommendedUsers.length);
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
      {/* Header with Search and Filters */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Find Friends</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content/60">
              {filteredFriends.length + filteredRecommendedUsers.length} people
              found
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40 size-4" />
            <input
              type="text"
              placeholder="Search by name..."
              className="input input-bordered w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className={`btn btn-outline ${showFilters ? "btn-active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterIcon className="size-4" />
            Filters
            {hasActiveFilters && (
              <div className="badge badge-primary badge-sm ml-1">!</div>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card bg-base-200 p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Native Language Filter */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-1">
                    <GlobeIcon className="size-4" />
                    Native Language
                  </span>
                </label>
                <select
                  className="select select-bordered"
                  value={filters.nativeLanguage}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      nativeLanguage: e.target.value,
                    }))
                  }
                >
                  <option value="">All Languages</option>
                  {filterOptions.nativeLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {capitalize(lang)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Learning Language Filter */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-1">
                    <BookOpenIcon className="size-4" />
                    Learning Language
                  </span>
                </label>
                <select
                  className="select select-bordered"
                  value={filters.learningLanguage}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      learningLanguage: e.target.value,
                    }))
                  }
                >
                  <option value="">All Languages</option>
                  {filterOptions.learningLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {capitalize(lang)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-1">
                    <MapPinIcon className="size-4" />
                    Location
                  </span>
                </label>
                <select
                  className="select select-bordered"
                  value={filters.location}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                >
                  <option value="">All Locations</option>
                  {filterOptions.locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="mt-4">
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                  <XIcon className="size-4" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* My Friends Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <UsersIcon className="size-6 text-emerald-600" />
          <h2 className="text-xl font-semibold">My Friends</h2>
          <div className="badge badge-neutral badge-sm">
            {filteredFriends.length}
          </div>
        </div>

        {filteredFriends.length === 0 ? (
          <div className="text-center py-8">
            {hasActiveFilters ? (
              <div>
                <UsersIcon className="size-12 text-base-content/20 mx-auto mb-2" />
                <p className="text-base-content/60">
                  No friends match your search criteria
                </p>
              </div>
            ) : (
              <NoFriendsFound />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFriends.map((friend) => (
              <FriendCard
                key={friend._id}
                friend={friend}
                onRemoveFriend={removeFriendMutation}
                isRemoving={loadingUsers.has(friend._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recommended Users Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <UserPlusIcon className="size-6 text-blue-600" />
          <h2 className="text-xl font-semibold">People You May Know</h2>
          <div className="badge badge-neutral badge-sm">
            {filteredRecommendedUsers.length}
          </div>
        </div>

        {filteredRecommendedUsers.length === 0 ? (
          <div className="text-center py-12">
            <UserPlusIcon className="size-16 text-base-content/20 mx-auto mb-4" />
            <p className="text-base-content/60 text-lg">
              {hasActiveFilters
                ? "No recommendations match your criteria"
                : "No recommendations available"}
            </p>
            <p className="text-base-content/40 text-sm mt-1">
              {hasActiveFilters
                ? "Try adjusting your filters"
                : "Check back later for new suggestions"}
            </p>
          </div>
        ) : (
          <>
            {/* 📋 LIST LAYOUT WITH LOAD MORE */}
            <div className="space-y-3">
              {displayedRecommendedUsers.map((user) => (
                <div
                  key={user._id}
                  className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow duration-200 border border-base-300"
                >
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
                              <span className="text-base-content/50">
                                Native:
                              </span>
                              <span className="text-lg">
                                {getLanguageFlag(user.nativeLanguage)}
                              </span>
                              <span className="font-medium text-base-content/80">
                                {capitalize(user.nativeLanguage)}
                              </span>
                            </div>

                            <div className="text-base-content/30">→</div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-base-content/50">
                                Learning:
                              </span>
                              <span className="text-lg">
                                {getLanguageFlag(user.learningLanguage)}
                              </span>
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
                            disabled={loadingUsers.has(user._id)}
                          >
                            {loadingUsers.has(user._id) ? (
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
                            disabled={loadingUsers.has(user._id)}
                          >
                            {loadingUsers.has(user._id) ? (
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

            {/* 🔄 LOAD MORE BUTTONS */}
            {hasMoreUsers && (
              <div className="flex flex-col items-center gap-3 mt-6">
                {/* Load More Button */}
                <button
                  className="btn btn-outline btn-wide"
                  onClick={handleLoadMore}
                >
                  <UserPlusIcon className="size-4 mr-2" />
                  Load More ({remainingCount} remaining)
                </button>

                {/* Show All Button (when more than 5 remaining) */}
                {remainingCount > 5 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleShowAll}
                  >
                    Show All ({filteredRecommendedUsers.length} users)
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;

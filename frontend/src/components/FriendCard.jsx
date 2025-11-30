import { Link } from "react-router-dom";
import { MessageCircle, UserMinus } from "lucide-react";
import { LANGUAGE_TO_FLAG } from "../constants";

const FriendCard = ({ friend, onRemoveFriend, isRemoving }) => {
  return (
    <div className="bg-base-100 rounded-xl p-4 hover:bg-base-200 transition-all duration-200 border border-base-300">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 h-10 rounded-full">
              <img src={friend.profilePic} alt={friend.fullName} />
            </div>
          </div>
          <h3 className="font-medium text-base-content truncate">
            {friend.fullName}
          </h3>
        </div>

        {/* REMOVE BUTTON - TOP RIGHT */}
        {onRemoveFriend && (
          <button
            className="btn btn-ghost btn-sm btn-circle hover:btn-error"
            onClick={() => onRemoveFriend(friend._id)}
            disabled={isRemoving}
            title="Remove friend"
          >
            {isRemoving ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <UserMinus className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* LANGUAGES */}
      <div className="flex gap-2 mb-4">
        <div className="flex items-center gap-1 text-xs text-base-content/70">
          {getLanguageFlag(friend.nativeLanguage)}
          <span>{friend.nativeLanguage}</span>
        </div>
        <div className="text-base-content/40">→</div>
        <div className="flex items-center gap-1 text-xs text-base-content/70">
          {getLanguageFlag(friend.learningLanguage)}
          <span>{friend.learningLanguage}</span>
        </div>
      </div>

      {/* MESSAGE BUTTON */}
      <Link
        to={`/chat/${friend._id}`}
        className="btn btn-primary btn-sm w-full gap-2"
      >
        <MessageCircle className="w-4 h-4" />
        Message
      </Link>
    </div>
  );
};

export default FriendCard;

// eslint-disable-next-line react-refresh/only-export-components
export function getLanguageFlag(language) {
  if (!language) return null;

  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/16x12/${countryCode}.png`}
        alt={`${langLower} flag`}
        className="w-4 h-3 rounded-sm"
      />
    );
  }
  return null;
}

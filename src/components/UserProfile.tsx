import type { User } from "../api/usersApi";
import "./UserProfile.css";

interface UserProfileProps {
  user: User;
  onSelect: (user: User) => void;
}

const UserProfile = ({ user, onSelect }: UserProfileProps) => {
  return (
    <div
      className="user-profile"
      onClick={() => onSelect(user)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect(user);
        }
      }}
    >
      <div className="user-avatar">
        <img src={user.avatar} alt={user.name} />
      </div>
      <span className="user-name">{user.name}</span>
    </div>
  );
};

export default UserProfile;

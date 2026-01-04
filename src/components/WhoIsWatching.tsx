import { useEffect, useState } from "react";
import type { User } from "../api/usersApi";
import { fetchUsers } from "../api/usersApi";
import UserProfile from "./UserProfile";
import LoadingScreen from "./LoadingScreen";
import LoginModal from "./LoginModal";
import "./WhoIsWatching.css";

const WhoIsWatching = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      const minLoadingTime = 2000; // Minimum 2 seconds loading screen

      try {
        // Wait for both the minimum time AND the data fetch to complete
        // Whichever takes longer will determine when loading ends
        const [fetchedUsers] = await Promise.all([
          fetchUsers(),
          new Promise((resolve) => setTimeout(resolve, minLoadingTime)),
        ]);

        console.log("Fetched users:", fetchedUsers);
        setUsers(fetchedUsers as User[]);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        // Show error but still stop loading
        alert(
          `Failed to load users: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setShowLoginModal(true);
    console.log("Selected user:", user);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // Navigate to main app or dashboard
    alert(`Welcome, ${selectedUser?.name}! 🎬 You are now logged in!`);
    // TODO: Add navigation to main app
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
    setSelectedUser(null);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <div className="who-is-watching">
        <div className="who-is-watching-container">
          <h1 className="who-is-watching-title">Who's watching?</h1>
          <div className="user-profiles-grid">
            {users.map((user) => (
              <UserProfile
                key={user.id}
                user={user}
                onSelect={handleUserSelect}
              />
            ))}
          </div>
        </div>
      </div>

      {showLoginModal && selectedUser && (
        <LoginModal
          user={selectedUser}
          onClose={handleCloseModal}
          onSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
};

export default WhoIsWatching;

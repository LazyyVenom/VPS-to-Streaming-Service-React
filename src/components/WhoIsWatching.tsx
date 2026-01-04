import { useEffect, useState } from "react";
import type { User } from "../api/usersApi";
import { fetchUsers } from "../api/usersApi";
import UserProfile from "./UserProfile";
import LoadingScreen from "./LoadingScreen";
import "./WhoIsWatching.css";

const WhoIsWatching = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [_, setSelectedUser] = useState<User | null>(null);

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

        setUsers(fetchedUsers as User[]);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    console.log("Selected user:", user);
    // Here you can add navigation logic or state management
    // For now, we'll just show an alert
    setTimeout(() => {
      alert(`Welcome, ${user.name}! 🎬`);
    }, 300);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
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
  );
};

export default WhoIsWatching;

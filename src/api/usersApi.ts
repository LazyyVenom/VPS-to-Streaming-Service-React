import config from "../config/config";

export interface User {
  id: string;
  name: string;
  avatar: string;
  type: "primary" | "friend" | "guest";
}

interface UserResponse {
  username: string;
}

// Helper function to determine user type based on username
const getUserType = (username: string): "primary" | "friend" | "guest" => {
  const lowerUsername = username.toLowerCase();
  if (lowerUsername === "anubhav") return "primary";
  if (lowerUsername.includes("dost") || lowerUsername === "anubhavkedost")
    return "friend";
  return "guest";
};

// Fetch users from the API
export const fetchUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch(
      `${config.BASE_URL}${config.API_ENDPOINTS.USERS}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const data: UserResponse[] = await response.json();

    // Transform the response to match our User interface
    const users: User[] = data.map((userResponse, index) => ({
      id: String(index + 1),
      name: userResponse.username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userResponse.username}`,
      type: getUserType(userResponse.username),
    }));

    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (id: string): Promise<User | undefined> => {
  try {
    const users = await fetchUsers();
    return users.find((u) => u.id === id);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return undefined;
  }
};

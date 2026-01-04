export interface User {
  id: string;
  name: string;
  avatar: string;
  type: "primary" | "friend" | "guest";
}

// Mock static data for users
const mockUsers: User[] = [
  {
    id: "1",
    name: "Anubhav",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anubhav",
    type: "primary",
  },
  {
    id: "2",
    name: "Anubhav Ke Dost",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Friend",
    type: "friend",
  },
  {
    id: "3",
    name: "Guest User",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest",
    type: "guest",
  },
];

// Simulated API call with delay
export const fetchUsers = async (): Promise<User[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockUsers);
    }, 500);
  });
};

// Get user by ID
export const getUserById = async (id: string): Promise<User | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = mockUsers.find((u) => u.id === id);
      resolve(user);
    }, 300);
  });
};

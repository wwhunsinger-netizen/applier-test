import { createContext, useContext, useState, ReactNode } from "react";
import { MOCK_USERS } from "./mockData";

type User = typeof MOCK_USERS[0];

interface UserContextType {
  currentUser: User;
  login: (email: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // Default to first user (Alex) if no one is logged in, or check localStorage
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedEmail = localStorage.getItem("jumpseat_user_email");
    return MOCK_USERS.find(u => u.email === savedEmail) || MOCK_USERS[0];
  });

  const login = (email: string) => {
    let user = MOCK_USERS.find(u => u.email === email);
    
    // If not found in mocks, check local storage for admin created clients
    if (!user) {
      try {
        const savedClientsStr = localStorage.getItem("admin_clients");
        if (savedClientsStr) {
          const savedClients = JSON.parse(savedClientsStr);
          const foundClient = savedClients.find((c: any) => c.email === email);
          if (foundClient) {
            user = {
              id: foundClient.id,
              name: foundClient.name,
              email: foundClient.email,
              role: "Client", // Force role to Client for these users
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(foundClient.name)}&background=random` // Generate avatar
            };
          }
        }
      } catch (e) {
        console.error("Error reading admin_clients", e);
      }
    }

    if (user) {
      setCurrentUser(user);
      localStorage.setItem("jumpseat_user_email", email);
    }
  };

  const logout = () => {
    // For demo purposes, reset to default user or keep as is, but we'll clear storage
    localStorage.removeItem("jumpseat_user_email");
  };

  return (
    <UserContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
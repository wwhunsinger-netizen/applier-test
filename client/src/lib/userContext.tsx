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
    const user = MOCK_USERS.find(u => u.email === email);
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
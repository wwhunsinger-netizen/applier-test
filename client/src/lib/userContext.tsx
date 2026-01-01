import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { MOCK_USERS } from "./mockData";
import { fetchClients, fetchAppliers } from "./api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  applicationsSent?: number;
  interviewsScheduled?: number;
};

interface UserContextType {
  currentUser: User;
  login: (email: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Cache for Supabase users
let cachedClients: Array<{id: string; name: string; email: string}> = [];
let cachedAppliers: Array<{id: string; name: string; email: string; is_active: boolean}> = [];

export function UserProvider({ children }: { children: ReactNode }) {
  // Default to first user (Admin) if no one is logged in
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedEmail = localStorage.getItem("jumpseat_user_email");
    const savedUser = localStorage.getItem("jumpseat_user_data");
    
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        // Fall through to default
      }
    }
    
    return MOCK_USERS.find(u => u.email === savedEmail) || MOCK_USERS[0];
  });

  // Fetch clients and appliers from Supabase on mount
  useEffect(() => {
    fetchClients()
      .then((clients) => {
        cachedClients = clients.map(c => ({
          id: c.id,
          name: `${c.first_name} ${c.last_name}`.trim(),
          email: c.email
        }));
      })
      .catch(console.error);
    
    fetchAppliers()
      .then((appliers) => {
        cachedAppliers = appliers.map(a => ({
          id: a.id,
          name: `${a.first_name} ${a.last_name}`.trim(),
          email: a.email,
          is_active: a.is_active
        }));
      })
      .catch(console.error);
  }, []);

  const login = (email: string) => {
    // First check MOCK_USERS
    let mockUser = MOCK_USERS.find(u => u.email === email);
    if (mockUser) {
      setCurrentUser(mockUser);
      localStorage.setItem("jumpseat_user_email", email);
      localStorage.setItem("jumpseat_user_data", JSON.stringify(mockUser));
      return;
    }
    
    // Check cached Supabase appliers
    const foundApplier = cachedAppliers.find(a => a.email === email && a.is_active);
    if (foundApplier) {
      const user: User = {
        id: foundApplier.id,
        name: foundApplier.name,
        email: foundApplier.email,
        role: "Applier",
        avatar: null
      };
      setCurrentUser(user);
      localStorage.setItem("jumpseat_user_email", email);
      localStorage.setItem("jumpseat_user_data", JSON.stringify(user));
      return;
    }
    
    // Check cached Supabase clients
    const foundClient = cachedClients.find(c => c.email === email);
    if (foundClient) {
      const user: User = {
        id: foundClient.id,
        name: foundClient.name,
        email: foundClient.email,
        role: "Client",
        avatar: null
      };
      setCurrentUser(user);
      localStorage.setItem("jumpseat_user_email", email);
      localStorage.setItem("jumpseat_user_data", JSON.stringify(user));
      return;
    }
    
    // If still not found, try fetching fresh from API
    Promise.all([fetchAppliers(), fetchClients()])
      .then(([appliers, clients]) => {
        // Check appliers first
        const applier = appliers.find(a => a.email === email && a.is_active);
        if (applier) {
          const user: User = {
            id: applier.id,
            name: `${applier.first_name} ${applier.last_name}`.trim(),
            email: applier.email,
            role: "Applier",
            avatar: null
          };
          setCurrentUser(user);
          localStorage.setItem("jumpseat_user_email", email);
          localStorage.setItem("jumpseat_user_data", JSON.stringify(user));
          return;
        }
        
        // Then check clients
        const client = clients.find(c => c.email === email);
        if (client) {
          const user: User = {
            id: client.id,
            name: `${client.first_name} ${client.last_name}`.trim(),
            email: client.email,
            role: "Client",
            avatar: null
          };
          setCurrentUser(user);
          localStorage.setItem("jumpseat_user_email", email);
          localStorage.setItem("jumpseat_user_data", JSON.stringify(user));
        }
      })
      .catch(console.error);
  };

  const logout = () => {
    localStorage.removeItem("jumpseat_user_email");
    localStorage.removeItem("jumpseat_user_data");
    setCurrentUser(MOCK_USERS[0]); // Reset to default user
    window.location.href = "/login"; // Redirect to login page
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
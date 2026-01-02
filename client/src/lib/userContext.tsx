import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { fetchClients, fetchAppliers } from "./api";

type AppUser = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Client" | "Applier";
  avatar: string | null;
  applicationsSent?: number;
  interviewsScheduled?: number;
};

interface UserContextType {
  currentUser: AppUser | null;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const ADMIN_EMAILS = ["admin@jumpseat.com", "admin@jumpseathub.com"];

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isLoading: authLoading, isAuthenticated: authAuthenticated, logout: authLogout } = useAuth();
  const queryClient = useQueryClient();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    if (!authUser?.email) {
      setAppUser(null);
      return;
    }

    const determineRole = async () => {
      setRoleLoading(true);
      const email = authUser.email!;
      
      if (ADMIN_EMAILS.includes(email.toLowerCase())) {
        setAppUser({
          id: authUser.id,
          name: `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() || "Admin",
          email: email,
          role: "Admin",
          avatar: authUser.profileImageUrl ?? null,
        });
        setRoleLoading(false);
        return;
      }

      try {
        const [appliers, clients] = await Promise.all([fetchAppliers(), fetchClients()]);

        const applier = appliers.find(a => a.email.toLowerCase() === email.toLowerCase() && a.is_active);
        if (applier) {
          setAppUser({
            id: applier.id,
            name: `${applier.first_name} ${applier.last_name}`.trim(),
            email: applier.email,
            role: "Applier",
            avatar: authUser.profileImageUrl ?? null,
          });
          setRoleLoading(false);
          return;
        }

        const client = clients.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (client) {
          setAppUser({
            id: client.id,
            name: `${client.first_name} ${client.last_name}`.trim(),
            email: client.email,
            role: "Client",
            avatar: authUser.profileImageUrl ?? null,
          });
          setRoleLoading(false);
          return;
        }

        setAppUser({
          id: authUser.id,
          name: `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() || email,
          email: email,
          role: "Client",
          avatar: authUser.profileImageUrl ?? null,
        });
      } catch (error) {
        console.error("Error determining user role:", error);
        setAppUser({
          id: authUser.id,
          name: `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() || email,
          email: email,
          role: "Client",
          avatar: authUser.profileImageUrl ?? null,
        });
      }
      setRoleLoading(false);
    };

    determineRole();
  }, [authUser]);

  const logout = () => {
    setAppUser(null);
    queryClient.clear();
    authLogout();
  };

  return (
    <UserContext.Provider value={{ 
      currentUser: appUser, 
      logout, 
      isAuthenticated: authAuthenticated && appUser !== null,
      isLoading: authLoading || roleLoading
    }}>
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

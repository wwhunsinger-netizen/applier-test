import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { User } from "@shared/models/auth";

async function fetchUser(): Promise<User | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return null;
  }

  const supabaseUser = session.user;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    firstName:
      supabaseUser.user_metadata?.first_name ||
      supabaseUser.user_metadata?.firstName ||
      null,
    lastName:
      supabaseUser.user_metadata?.last_name ||
      supabaseUser.user_metadata?.lastName ||
      null,
    profileImageUrl: supabaseUser.user_metadata?.avatar_url || null,
    createdAt: new Date(supabaseUser.created_at),
    updatedAt: new Date(),
  };
}

async function logout(): Promise<void> {
  await supabase.auth.signOut();
  window.location.href = "/login";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["supabase-auth-user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["supabase-auth-user"], null);
    },
  });

  return {
    user,
    isLoading: isLoading || user === undefined,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}

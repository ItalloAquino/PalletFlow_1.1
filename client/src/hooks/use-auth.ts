import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const clearAuth = () => {
    queryClient.clear();
    window.location.href = "/";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    clearAuth,
  };
}

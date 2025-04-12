import { createContext, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertUserSchema } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      // Update the query cache
      queryClient.setQueryData(["/api/user"], user);

      // Force a refetch to ensure we have the latest data
      refetchUser();

      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${user.username}!`,
      });

      // Use a small delay to ensure auth state is updated before redirect
      setTimeout(() => {
        setLocation("/");
      }, 100);
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: "Welcome to Netflix!",
      });
      setLocation("/profile");
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear all profile data from localStorage
      localStorage.removeItem("hasActiveProfile");
      localStorage.removeItem("activeProfileId");

      // Clear React Query cache
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();

      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });

      // Force a hard reload to the auth page to ensure a clean state
      setTimeout(() => {
        window.location.href = "/auth";
      }, 300);
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });

      // Even if the server logout fails, still clear local state and redirect
      localStorage.removeItem("hasActiveProfile");
      localStorage.removeItem("activeProfileId");
      queryClient.setQueryData(["/api/user"], null);
      setTimeout(() => {
        window.location.href = "/auth";
      }, 300);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

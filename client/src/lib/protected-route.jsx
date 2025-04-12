import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import { useState, useEffect } from "react";

export function ProtectedRoute({ path, component: Component }) {
  const { user, isLoading } = useAuth();
  const [hasLocalProfile, setHasLocalProfile] = useState(false);

  // Check for profile in localStorage on mount
  useEffect(() => {
    const hasProfileInStorage =
      localStorage.getItem("hasActiveProfile") === "true";
    const profileIdInStorage = localStorage.getItem("activeProfileId");

    if (hasProfileInStorage && profileIdInStorage) {
      setHasLocalProfile(true);
      console.log("Found profile in localStorage:", profileIdInStorage);
    }
  }, []);

  // Check if user has selected a profile
  const {
    data: profiles = [],
    isLoading: profilesLoading,
    error: profilesError,
  } = useQuery({
    queryKey: ["/api/profiles"],
    enabled: !!user,
  });

  // Get active profile
  const {
    data: activeProfile,
    isLoading: activeProfileLoading,
    error: activeProfileError,
  } = useQuery({
    queryKey: ["/api/profiles/active"],
    enabled: !!user && profiles.length > 0,
    retry: 1,
    retryDelay: 1000,
  });

  // Attempt to restore profile from localStorage if needed
  useEffect(() => {
    if (
      path === "/" &&
      hasLocalProfile &&
      !activeProfile &&
      !activeProfileLoading &&
      profiles.length > 0
    ) {
      const profileId = parseInt(
        localStorage.getItem("activeProfileId") || "0"
      );
      if (profileId > 0) {
        console.log(
          "Attempting to restore profile from localStorage:",
          profileId
        );
        apiRequest("POST", "/api/profiles/active", { profileId })
          .then(() => console.log("Profile restored from localStorage"))
          .catch((err) => console.error("Failed to restore profile:", err));
      }
    }
  }, [path, hasLocalProfile, activeProfile, activeProfileLoading, profiles]);

  // Debug logging
  useEffect(() => {
    console.log("Protected route state:", {
      path,
      loggedIn: !!user,
      hasProfiles: profiles.length > 0,
      hasActiveProfile: !!activeProfile,
      hasLocalProfile,
    });
  }, [path, user, profiles, activeProfile, hasLocalProfile]);

  // Handle loading state
  if (isLoading || profilesLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Handle not logged in
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Allow access to profile page regardless of profile selection
  if (path === "/profile") {
    return <Route path={path} component={Component} />;
  }

  // If no profiles or active profile and not relying on localStorage, redirect to profile
  if (!profiles.length || (!activeProfile && !hasLocalProfile)) {
    return (
      <Route path={path}>
        <Redirect to="/profile" />
      </Route>
    );
  }

  // User is logged in and either has an active profile or one in localStorage
  return <Route path={path} component={Component} />;
}

export function AdminRoute({ path, component: Component }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (!user.isAdmin) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import ProfileSelector from "@/components/profile/profile-selector";
import CreateProfile from "@/components/profile/create-profile";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { LogOut } from "lucide-react";

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [showAddProfile, setShowAddProfile] = useState(false);

  // Fetch profiles
  const {
    data: profiles = [],
    isLoading,
    refetch: refetchProfiles,
  } = useQuery({
    queryKey: ["/api/profiles"],
  });

  // Log profiles for debugging
  useEffect(() => {
    console.log("Profile page: profiles loaded", profiles);
  }, [profiles]);

  // Set active profile mutation
  const setActiveProfileMutation = useMutation({
    mutationFn: async (profileId) => {
      console.log("Setting active profile with ID:", profileId);
      const response = await apiRequest("POST", "/api/profiles/active", {
        profileId,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Profile set successfully:", data);
      // Important: Invalidate related queries first
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mylist"] });

      // Add debugging to ensure the home URL is correct
      const homeUrl = window.location.origin + ROUTES.HOME;
      console.log("Home URL:", homeUrl);

      // Insert a small delay to ensure server finishes processing
      toast({
        title: "Profile selected",
        description: "Redirecting to homepage...",
      });

      // Use both approaches for redundancy
      setTimeout(() => {
        try {
          console.log("Navigating to home page...");
          window.location.replace(homeUrl);
        } catch (error) {
          console.error("Navigation error:", error);
          // Fallback: Use a different approach if replace fails
          window.location.href = homeUrl;
        }
      }, 500);
    },
    onError: (error) => {
      console.error("Failed to set profile:", error);
      toast({
        title: "Failed to set active profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle profile selection
  const handleProfileSelect = (profile) => {
    console.log("Profile selected:", profile);

    // Show loading toast
    toast({
      title: "Setting profile...",
      description: "Please wait while we prepare your content",
    });

    // First, set a marker in localStorage to remember we have an active profile
    localStorage.setItem("hasActiveProfile", "true");
    localStorage.setItem("activeProfileId", profile.id.toString());

    // Set active profile on the server
    setActiveProfileMutation.mutate(profile.id);

    // Force navigation immediately - don't wait for server response
    // This bypasses the react router and ensures a full page refresh
    window.location.href = "/";
  };

  // Handle profile creation success
  const handleProfileCreated = () => {
    setShowAddProfile(false);
    // Refresh profiles after creating a new one
    refetchProfiles();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with logo and optional logout */}
      <header className="w-full p-6 flex justify-between items-center">
        <svg className="w-32 h-12" viewBox="0 0 1024 276.742" fill="#E50914">
          <path d="M140.803 258.904c-15.404 2.705-31.079 3.516-47.294 5.676l-49.458-144.856v151.073c-15.404 1.621-29.457 3.783-44.051 5.945v-276.742h41.08l56.212 157.021v-157.021h43.511v258.904zm85.131-157.558c16.757 0 42.431-.811 57.835-.811v43.24c-19.189 0-41.619 0-57.835.811v64.322c25.405-1.621 50.809-3.785 76.482-4.596v41.617l-119.724 9.461v-255.39h119.724v43.241h-76.482v58.105zm237.284-58.104h-44.862v198.908c-14.594 0-29.188 0-43.239.539v-199.447h-44.862v-43.242h132.965l-.002 43.242zm70.266 55.132h59.187v43.24h-59.187v98.104h-42.433v-239.718h120.808v43.241h-78.375v55.133zm148.641 103.507c24.594.539 49.456 2.434 73.51 3.783v42.701c-38.646-2.434-77.293-4.863-116.75-5.676v-242.689h43.24v201.881zm109.994 49.457c13.783.812 28.377 1.623 42.43 3.242v-254.58h-42.43v251.338zm231.881-251.338l-54.863 131.615 54.863 145.127c-16.217-2.162-32.432-5.135-48.648-7.838l-31.078-79.994-31.617 73.51c-15.678-2.705-30.812-3.516-46.484-5.678l55.672-126.75-50.269-129.992h46.482l28.377 72.699 30.27-72.699h47.295z" />
          <path d="M46.7 9.36L46.7 27.67 42.46 27.67 42.46 9.36 37.08 9.36 37.08 5.13 52.08 5.13 52.08 9.36 46.7 9.36z"></path>
          <path d="M25.59 27.67L25.59 0 36.05 0 36.05 4.24 29.83 4.24 29.83 12.09 35.19 12.09 35.19 16.32 29.83 16.32 29.83 23.43 36.05 23.43 36.05 27.67 25.59 27.67z"></path>
          <path d="M15.97 27.67L8.13 27.67 8.13 0 12.53 0 12.53 23.43 15.97 23.43 15.97 27.67z"></path>
          <path d="M0 27.67L0 0 4.24 0 4.24 27.67 0 27.67z"></path>
        </svg>

        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Clear localStorage first
              localStorage.removeItem("hasActiveProfile");
              localStorage.removeItem("activeProfileId");
              // Then attempt server logout
              logoutMutation.mutate();
              // Force redirect after a short delay
              setTimeout(() => {
                window.location.href = "/auth";
              }, 300);
            }}
            disabled={logoutMutation.isPending}
            className="text-gray-400 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4">
        {showAddProfile ? (
          <CreateProfile
            onCancel={() => setShowAddProfile(false)}
            onSuccess={handleProfileCreated}
          />
        ) : (
          <ProfileSelector
            onSelect={handleProfileSelect}
            onAddProfile={() => setShowAddProfile(true)}
          />
        )}
      </main>
    </div>
  );
}

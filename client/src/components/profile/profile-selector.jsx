import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AVATAR_IMAGES } from "@/lib/constants";
import { getRandomAvatarId } from "@/lib/utils";

export default function ProfileSelector({ onSelect, onAddProfile }) {
  const { toast } = useToast();
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const {
    data: profiles = [],
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["/api/profiles"],
  });

  // Log profile data for debugging
  useEffect(() => {
    console.log("ProfileSelector - Profiles data:", profiles);
    console.log("ProfileSelector - isLoading:", isLoading);
    console.log("ProfileSelector - error:", error);

    // Force refetch if profiles array is empty but shouldn't be
    if (!isLoading && !error && profiles.length === 0) {
      // This logs that we need to refetch
      console.log("ProfileSelector - No profiles found, might need to refetch");
    }
  }, [profiles, isLoading, error]);

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, name }) => {
      const response = await apiRequest("PATCH", `/api/profiles/${id}`, {
        name,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({
        title: "Profile updated",
        description: "Profile name has been updated successfully",
      });
      setEditingProfileId(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (id) => {
      await apiRequest("DELETE", `/api/profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({
        title: "Profile deleted",
        description: "Profile has been removed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startEditing = (profile) => {
    setEditingProfileId(profile.id);
    setEditingName(profile.name);
  };

  const saveProfileName = (id) => {
    if (editingName.trim() === "") return;
    updateProfileMutation.mutate({ id, name: editingName });
  };

  const handleKeyDown = (e, id) => {
    if (e.key === "Enter") {
      saveProfileName(id);
    }
  };

  const deleteProfile = (id) => {
    if (window.confirm("Are you sure you want to delete this profile?")) {
      deleteProfileMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-8 text-white">Who's watching?</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {profiles.map((profile) => (
          <div key={profile.id} className="flex flex-col items-center">
            <div className="relative group">
              {/* Delete button */}
              <button
                onClick={() => deleteProfile(profile.id)}
                className="absolute -top-2 -right-2 bg-black bg-opacity-70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                aria-label="Delete profile"
              >
                <X size={16} className="text-white" />
              </button>

              {/* Profile avatar */}
              <div
                onClick={() => {
                  if (editingProfileId !== profile.id) {
                    onSelect(profile);
                  }
                }}
                className={`w-24 h-24 overflow-hidden cursor-pointer rounded-md ${
                  editingProfileId !== profile.id ? "hover-scale" : ""
                }`}
              >
                <img
                  src={
                    AVATAR_IMAGES[
                      profile.avatarId !== undefined
                        ? profile.avatarId % AVATAR_IMAGES.length
                        : 0
                    ]
                  }
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to a default avatar if the image fails to load
                    e.currentTarget.src = AVATAR_IMAGES[0];
                    console.log("Avatar image error, using fallback");
                  }}
                />
              </div>
            </div>

            {/* Profile name or editing input */}
            {editingProfileId === profile.id ? (
              <div className="mt-2">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => saveProfileName(profile.id)}
                  onKeyDown={(e) => handleKeyDown(e, profile.id)}
                  autoFocus
                  className="text-center w-32"
                />
              </div>
            ) : (
              <button
                onClick={() => startEditing(profile)}
                className="mt-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                {profile.name}
              </button>
            )}
          </div>
        ))}

        {/* Add Profile button */}
        {profiles.length < 5 && (
          <div className="flex flex-col items-center">
            <button
              onClick={onAddProfile}
              className="w-24 h-24 flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer rounded-md hover-scale"
            >
              <Plus size={32} className="text-gray-400" />
            </button>
            <span className="mt-2 text-gray-400">Add Profile</span>
          </div>
        )}
      </div>

      {profiles.length > 0 && editingProfileId === null && (
        <Button
          className="mt-8 bg-transparent border border-gray-500 hover:border-white text-gray-400 hover:text-white px-6"
          onClick={() => {
            // Set first profile as active by default
            if (profiles.length > 0) {
              onSelect(profiles[0]);
            }
          }}
        >
          Manage Profiles
        </Button>
      )}
    </div>
  );
}

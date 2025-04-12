import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRandomAvatarId } from "@/lib/utils";
import { AVATAR_IMAGES } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

export default function CreateProfile({ onCancel, onSuccess }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Generate a random avatar ID once and store it in state so it doesn't change on re-renders
  const [avatarId] = useState(getRandomAvatarId());

  const createProfileMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/profiles", {
        name: profileName,
        userId: user?.id,
        avatarId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({
        title: "Profile created",
        description: `Profile "${profileName}" has been created successfully`,
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to create profile",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profileName.trim()) {
      toast({
        title: "Profile name required",
        description: "Please enter a name for this profile",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    createProfileMutation.mutate();
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Add Profile</h1>
      <p className="text-gray-400 mb-8 text-center">
        Add a profile for another person watching Netflix.
      </p>

      <div className="flex items-center mb-6 w-full">
        <div className="w-24 h-24 overflow-hidden mr-4">
          <img
            src={AVATAR_IMAGES[avatarId % AVATAR_IMAGES.length]}
            alt="Profile Avatar"
            className="w-full h-full object-cover"
          />
        </div>

        <form onSubmit={handleSubmit} className="flex-1">
          <Input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Name"
            className="bg-gray-700 border-0 h-12 text-white mb-4"
            disabled={isSubmitting}
            maxLength={20}
          />

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !profileName.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Creating..." : "Continue"}
            </Button>
          </div>
        </form>
      </div>

      <p className="text-gray-500 text-xs text-center mt-4">
        Profile avatars are assigned randomly and cannot be changed.
      </p>
    </div>
  );
}

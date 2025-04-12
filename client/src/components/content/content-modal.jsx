import { useState, useEffect } from "react";
import { X, Plus, ThumbsUp } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  getTMDbImageUrl,
  formatDate,
  formatGenres,
  truncateText,
} from "@/lib/utils";
import { FALLBACK_BACKDROP, ROUTES } from "@/lib/constants";

export default function ContentModal({
  isOpen,
  onClose,
  contentId,
  tmdbId,
  type = "movie",
  activeProfileId,
}) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedSeason, setSelectedSeason] = useState(1);

  // Fetch content details
  const { data: details, isLoading } = useQuery({
    queryKey: [`/api/content/${type}/${tmdbId}`],
    enabled: isOpen && !!tmdbId,
  });

  // Check if item is in user's list
  const { data: myListStatus, refetch: refetchMyList } = useQuery({
    queryKey: [
      `/api/mylist/${activeProfileId}/check/${details?.contentId || contentId}`,
    ],
    enabled:
      isOpen && !!activeProfileId && (!!details?.contentId || !!contentId),
  });

  // Add to my list mutation
  const addToMyListMutation = useMutation({
    mutationFn: async () => {
      // First check if we already have a contentId from the details or the props
      const existingContentId = details?.contentId || contentId;

      if (!existingContentId) {
        console.log("Trying to save content first, details:", details);

        // If contentId doesn't exist, we need to save the content to our database first
        try {
          const saveResponse = await apiRequest("POST", "/api/content", {
            tmdbId: tmdbId,
            type: type,
            title: details?.title || details?.name,
            overview: details?.overview,
            posterPath: details?.poster_path,
            backdropPath: details?.backdrop_path,
            releaseDate: details?.release_date || details?.first_air_date,
            voteAverage: details?.vote_average || 0,
            popularity: details?.popularity || 0,
            genreIds: JSON.stringify(details?.genre_ids || []),
            additionalData: JSON.stringify({
              media_type: type,
              ...details,
            }),
          });

          const savedContent = await saveResponse.json();
          console.log("Content saved with ID:", savedContent.id);

          // Now we can add to My List
          await apiRequest("POST", "/api/mylist", {
            profileId: activeProfileId,
            contentId: savedContent.id,
          });

          return;
        } catch (err) {
          console.error("Error saving content:", err);
          throw new Error("Failed to save content and add to list");
        }
      }

      // Normal flow if contentId exists
      await apiRequest("POST", "/api/mylist", {
        profileId: activeProfileId,
        contentId: existingContentId,
      });
    },
    onSuccess: () => {
      refetchMyList();
      // Also invalidate the /api/mylist query so the My List page updates immediately
      queryClient.invalidateQueries({ queryKey: ["/api/mylist"] });
      toast({
        title: "Added to My List",
        description: `"${
          details?.title || details?.name
        }" has been added to your list`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add to list",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove from my list mutation
  const removeFromMyListMutation = useMutation({
    mutationFn: async () => {
      // Use the contentId from the details object, which comes from our database
      // Or use the contentId passed directly as a prop (from My List page)
      const idToUse = details?.contentId || contentId;

      if (!idToUse) {
        console.error(
          "Missing content ID - details:",
          details,
          "contentId prop:",
          contentId
        );
        throw new Error("Content ID is missing");
      }

      await apiRequest("DELETE", `/api/mylist/${activeProfileId}/${idToUse}`);
    },
    onSuccess: () => {
      refetchMyList();
      // Also invalidate the /api/mylist query so the My List page updates immediately
      queryClient.invalidateQueries({ queryKey: ["/api/mylist"] });
      toast({
        title: "Removed from My List",
        description: `"${
          details?.title || details?.name
        }" has been removed from your list`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove from list",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Go to review page
  const handleReviewClick = () => {
    if (!tmdbId || !type) return;
    navigate(`${ROUTES.REVIEW}/${type}/${tmdbId}`);
    onClose();
  };

  // Toggle my list
  const toggleMyList = () => {
    if (myListStatus?.inList) {
      removeFromMyListMutation.mutate();
    } else {
      addToMyListMutation.mutate();
    }
  };

  // Reset selected season when content changes
  useEffect(() => {
    if (details) {
      setSelectedSeason(1);
    }
  }, [details?.id]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-y-auto max-h-[90vh] bg-[#181818] text-white">
        {/* Add proper dialog title for accessibility */}
        <DialogTitle className="sr-only">
          {details?.title || details?.name || "Content Details"}
        </DialogTitle>

        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Modal Header with Background */}
            <div className="relative h-[50vh]">
              <img
                src={
                  details?.backdrop_path
                    ? getTMDbImageUrl(details.backdrop_path)
                    : FALLBACK_BACKDROP
                }
                alt={details?.title || details?.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent"></div>

              <button
                className="absolute top-4 right-4 text-white text-2xl z-10"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={24} />
              </button>

              <div className="absolute bottom-6 left-6">
                <h2 className="text-4xl font-bold mb-4">
                  {details?.title || details?.name}
                </h2>
                <div className="flex items-center space-x-4 mb-4">
                  <Button
                    className="bg-white text-black hover:bg-gray-200 rounded-md"
                    size="lg"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Play
                  </Button>

                  <Button
                    onClick={toggleMyList}
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    disabled={
                      addToMyListMutation.isPending ||
                      removeFromMyListMutation.isPending
                    }
                  >
                    {myListStatus?.inList ? (
                      <X size={16} />
                    ) : (
                      <Plus size={16} />
                    )}
                  </Button>

                  <Button
                    onClick={handleReviewClick}
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                  >
                    <ThumbsUp size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row mb-8">
                <div className="w-full md:w-2/3 md:pr-6">
                  <div className="flex items-center mb-4">
                    <span className="text-green-500 font-bold">
                      {details?.vote_average
                        ? `${Math.round(details.vote_average * 10)}% Match`
                        : "New Release"}
                    </span>
                    <span className="mx-2">
                      {formatDate(
                        details?.release_date || details?.first_air_date || ""
                      )}
                    </span>
                    <span className="border border-gray-600 px-1 text-xs">
                      {details?.adult ? "18+" : "PG"}
                    </span>
                    {details?.number_of_seasons && (
                      <span className="ml-2">
                        {details.number_of_seasons} Seasons
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-300 mb-4">
                    {details?.overview}
                  </p>

                  {details?.genres && (
                    <div className="text-sm text-gray-400">
                      <span className="text-gray-300">Genres:</span>{" "}
                      {formatGenres(details.genres)}
                    </div>
                  )}
                </div>

                <div className="w-full md:w-1/3 mt-6 md:mt-0">
                  {details?.cast && (
                    <div className="mb-4">
                      <span className="text-gray-300">Cast:</span>{" "}
                      <span className="text-gray-400">
                        {truncateText(
                          details.cast.map((actor) => actor.name).join(", "),
                          100
                        )}
                      </span>
                    </div>
                  )}

                  {details?.director && (
                    <div className="mb-4">
                      <span className="text-gray-300">Director:</span>{" "}
                      <span className="text-gray-400">{details.director}</span>
                    </div>
                  )}

                  {details?.creator && (
                    <div className="mb-4">
                      <span className="text-gray-300">Creator:</span>{" "}
                      <span className="text-gray-400">{details.creator}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Episodes Section (for TV Shows) */}
              {type === "tv" &&
                details?.seasons &&
                details.seasons.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center mb-4">
                      <h3 className="text-xl font-bold">Episodes</h3>
                      {details.seasons.length > 1 && (
                        <select
                          value={selectedSeason}
                          onChange={(e) =>
                            setSelectedSeason(Number(e.target.value))
                          }
                          className="ml-4 bg-transparent border border-gray-600 rounded px-2 py-1"
                        >
                          {details.seasons.map((season) => (
                            <option
                              key={season.season_number}
                              value={season.season_number}
                            >
                              Season {season.season_number}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {details.episodes && (
                      <div className="space-y-4">
                        {details.episodes
                          .filter(
                            (episode) =>
                              episode.season_number === selectedSeason
                          )
                          .map((episode) => (
                            <div
                              key={episode.id}
                              className="flex border-b border-gray-700 pb-4"
                            >
                              <div className="w-40 h-24 relative flex-shrink-0">
                                {episode.still_path ? (
                                  <img
                                    src={getTMDbImageUrl(episode.still_path)}
                                    alt={`Episode ${episode.episode_number}`}
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-800 rounded flex items-center justify-center">
                                    <span className="text-gray-500">
                                      No Preview
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4 flex-grow">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium">
                                    {episode.episode_number}. {episode.name}
                                  </h4>
                                  <span className="text-sm text-gray-400">
                                    {episode.runtime
                                      ? `${episode.runtime}m`
                                      : ""}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-400 mt-1">
                                  {truncateText(
                                    episode.overview ||
                                      "No description available.",
                                    200
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

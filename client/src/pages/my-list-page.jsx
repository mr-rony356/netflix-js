import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ContentModal from "@/components/content/content-modal";
import { Loader2 } from "lucide-react";
import ContentCard from "@/components/content/content-card";

export default function MyListPage() {
  // Define state
  const [selectedContent, setSelectedContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get active profile
  const { data: activeProfile } = useQuery({
    queryKey: ["/api/profiles/active"],
  });

  // Fetch my list content
  const {
    data: myListContent,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["/api/mylist"],
    enabled: !!activeProfile?.id,
    retry: 1, // Only retry once to avoid too many retries on 404
    refetchOnWindowFocus: true,
    staleTime: 1000, // Consider data fresh for 1 second to prevent multiple refreshes
    refetchInterval: 5000, // Refresh every 5 seconds while page is open
  });

  // Handle content item click
  const handleContentClick = (content) => {
    setSelectedContent(content);
    setIsModalOpen(true);
  };

  // Format content items for display
  const formatContentItems = () => {
    if (!myListContent || myListContent.length === 0) return [];

    return myListContent
      .map((item) => {
        if (!item.content) {
          console.error("Missing content in myList item:", item);
          return null;
        }

        // Handle content data structure
        const content = item.content;

        return {
          ...content,
          id: content.tmdbId,
          title: content.title || "",
          name: content.title || "",
          media_type: content.type,
          poster_path: content.posterPath || "",
          backdrop_path: content.backdropPath || "",
          contentId: item.contentId,
        };
      })
      .filter((item) => item !== null);
  };

  const contentItems = formatContentItems();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-28 px-4 md:px-16">
        {" "}
        {/* Add padding top to account for fixed header */}
        {/* Page header with title */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white">My List</h1>
          <p className="text-lg text-gray-400 mt-2">
            Your saved movies and TV shows
          </p>
        </div>
        {/* Content grid */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : isError && error instanceof Error ? (
          <div className="flex flex-col justify-center items-center min-h-[400px] text-gray-400">
            <p className="text-xl mb-2">Your list is empty</p>
            <p className="text-sm">
              Add movies and TV shows to your list by clicking the + button
            </p>
          </div>
        ) : contentItems.length === 0 ? (
          <div className="flex flex-col justify-center items-center min-h-[400px] text-gray-400">
            <p className="text-xl mb-2">Your list is empty</p>
            <p className="text-sm">
              Add movies and TV shows to your list by clicking the + button
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {contentItems.map((item) => (
              <ContentCard
                key={`${item.id}-${item.media_type || "unknown"}`}
                item={item}
                onClick={() => handleContentClick(item)}
              />
            ))}
          </div>
        )}
        <div className="mt-16">
          <Footer />
        </div>
      </div>

      {/* Content details modal */}
      <ContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contentId={selectedContent?.contentId}
        tmdbId={selectedContent?.id || selectedContent?.tmdbId}
        type={selectedContent?.media_type || selectedContent?.type || "movie"}
        activeProfileId={activeProfile?.id}
      />
    </div>
  );
}

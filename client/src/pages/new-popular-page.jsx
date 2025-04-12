import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ContentModal from "@/components/content/content-modal";
import InfiniteGrid from "@/components/content/infinite-grid";

export default function NewPopularPage() {
  const [selectedContent, setSelectedContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contentType, setContentType] = useState("all"); // all, tv, movies

  // Get active profile
  const { data: activeProfile } = useQuery({
    queryKey: ["/api/profiles/active"],
  });

  // Fetch initial popular content
  const { data: initialPopularContent, isLoading } = useQuery({
    queryKey: ["/api/content/popular", contentType],
    enabled: !!activeProfile,
    queryFn: async () => {
      const response = await fetch(
        `/api/content/popular?limit=20&type=${contentType}`
      );
      if (!response.ok) throw new Error("Failed to fetch popular content");
      return await response.json();
    },
  });

  // Function to fetch more content for infinite scroll
  const fetchMoreContent = useCallback(
    async (page) => {
      try {
        const response = await fetch(
          `/api/content/popular?page=${page}&limit=20&type=${contentType}`
        );
        if (!response.ok) throw new Error("Failed to fetch more content");
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching more content:", error);
        throw error;
      }
    },
    [contentType]
  );

  // Handle content item click
  const handleContentClick = (content) => {
    setSelectedContent(content);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-28 px-4 md:px-16">
        {" "}
        {/* Add padding top to account for fixed header */}
        {/* Page header with title */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white">
            New & Popular
          </h1>
          <p className="text-lg text-gray-400 mt-2">
            Discover the latest and most-watched content on Netflix. Updated
            weekly with fresh titles and trending favorites.
          </p>
        </div>
        {/* Content type filter */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            className={`px-5 py-1 rounded-full ${
              contentType === "all"
                ? "bg-white text-black font-medium"
                : "bg-[#333] text-white"
            }`}
            onClick={() => setContentType("all")}
          >
            All
          </button>
          <button
            className={`px-5 py-1 rounded-full ${
              contentType === "tv"
                ? "bg-white text-black font-medium"
                : "bg-[#333] text-white"
            }`}
            onClick={() => setContentType("tv")}
          >
            TV Shows
          </button>
          <button
            className={`px-5 py-1 rounded-full ${
              contentType === "movie"
                ? "bg-white text-black font-medium"
                : "bg-[#333] text-white"
            }`}
            onClick={() => setContentType("movie")}
          >
            Movies
          </button>
        </div>
        {/* Infinite scrolling content grid */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <InfiniteGrid
            initialItems={initialPopularContent || []}
            fetchItems={fetchMoreContent}
            onItemClick={handleContentClick}
            filters={{ type: contentType === "all" ? undefined : contentType }}
          />
        )}
        <Footer />
      </div>

      {/* Content details modal */}
      <ContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contentId={selectedContent?.contentId}
        tmdbId={selectedContent?.id}
        type={
          selectedContent?.media_type ||
          (selectedContent?.title ? "movie" : "tv")
        }
        activeProfileId={activeProfile?.id}
      />
    </div>
  );
}

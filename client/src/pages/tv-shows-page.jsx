import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ContentBanner from "@/components/content/content-banner";
import ContentRow from "@/components/content/content-row";
import ContentModal from "@/components/content/content-modal";
import { getRandomItem } from "@/lib/utils";
import {
  getRecommendationsForProfile,
  getHighestRatedContent,
} from "@/lib/ai-recommendations";
import { CONTENT_TYPES, GENRE_IDS } from "@/lib/constants";
import { fetchTVShowsByGenre } from "@/lib/tmdb-api";

export default function TVShowsPage() {
  const [selectedContent, setSelectedContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get active profile
  const { data: activeProfile } = useQuery({
    queryKey: ["/api/profiles/active"],
  });

  // Fetch all TV shows
  const { data: tvShowsData } = useQuery({
    queryKey: ["/api/content/tvshows"],
    enabled: !!activeProfile,
  });

  // Fetch personalized recommendations for TV shows
  const { data: recommendedShows } = useQuery({
    queryKey: ["/api/content/recommendations/tvshows", activeProfile?.id],
    enabled: !!activeProfile?.id,
    queryFn: async () => {
      const allRecs = await getRecommendationsForProfile(activeProfile?.id, 20);
      // Filter to only include TV shows
      return allRecs.filter((item) => item.media_type === "tv");
    },
  });

  // Fetch new releases
  const { data: newShows } = useQuery({
    queryKey: ["/api/content/newest/tvshows"],
    enabled: !!activeProfile,
    queryFn: async () => {
      const response = await fetch("/api/content/tvshows?sort=newest");
      if (!response.ok) throw new Error("Failed to fetch new TV shows");
      return await response.json();
    },
  });

  // Fetch highest rated TV shows
  const { data: topRatedShows } = useQuery({
    queryKey: ["/api/content/tvshows/top-rated"],
    enabled: !!activeProfile,
    queryFn: async () => {
      const allRated = await getHighestRatedContent(20);
      // Filter to only include TV shows
      return allRated.filter((item) => item.media_type === "tv");
    },
  });

  // Fetch drama shows
  const { data: dramaShows } = useQuery({
    queryKey: ["/api/content/tvshows/genre", GENRE_IDS.DRAMA],
    enabled: !!activeProfile,
    queryFn: () => fetchTVShowsByGenre(GENRE_IDS.DRAMA),
  });

  // Fetch comedy shows
  const { data: comedyShows } = useQuery({
    queryKey: ["/api/content/tvshows/genre", GENRE_IDS.COMEDY],
    enabled: !!activeProfile,
    queryFn: () => fetchTVShowsByGenre(GENRE_IDS.COMEDY),
  });

  // Fetch sci-fi & fantasy shows
  const { data: scifiShows } = useQuery({
    queryKey: ["/api/content/tvshows/genre", GENRE_IDS.TV_SCIFI_FANTASY],
    enabled: !!activeProfile,
    queryFn: () => fetchTVShowsByGenre(GENRE_IDS.TV_SCIFI_FANTASY),
  });

  // Fetch crime shows
  const { data: crimeShows } = useQuery({
    queryKey: ["/api/content/tvshows/genre", GENRE_IDS.CRIME],
    enabled: !!activeProfile,
    queryFn: () => fetchTVShowsByGenre(GENRE_IDS.CRIME),
  });

  // Get featured TV show for banner
  const featuredShow =
    tvShowsData?.length > 0 ? getRandomItem(tvShowsData.slice(0, 5)) : null;

  // Handle content item click
  const handleContentClick = (content) => {
    setSelectedContent({
      ...content,
      media_type: "tv",
    });
    setIsModalOpen(true);
  };

  // Handle more info button click on banner
  const handleBannerInfoClick = () => {
    if (featuredShow) {
      setSelectedContent({
        ...featuredShow,
        media_type: "tv",
      });
      setIsModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-16">
        {" "}
        {/* Add padding top to account for fixed header */}
        {/* Featured TV show banner */}
        {featuredShow && (
          <ContentBanner
            content={featuredShow}
            onInfoClick={handleBannerInfoClick}
          />
        )}
        {/* Content rows */}
        <div className="p-8">
          {recommendedShows?.length > 0 && (
            <ContentRow
              title="Recommended for You"
              items={recommendedShows}
              onItemClick={handleContentClick}
            />
          )}

          {newShows?.length > 0 && (
            <ContentRow
              title="New TV Shows"
              items={newShows}
              onItemClick={handleContentClick}
            />
          )}

          {topRatedShows?.length > 0 && (
            <ContentRow
              title="Top Rated Shows"
              items={topRatedShows}
              onItemClick={handleContentClick}
            />
          )}

          {dramaShows?.length > 0 && (
            <ContentRow
              title="Drama Series"
              items={dramaShows}
              onItemClick={handleContentClick}
            />
          )}

          {comedyShows?.length > 0 && (
            <ContentRow
              title="Comedy Series"
              items={comedyShows}
              onItemClick={handleContentClick}
            />
          )}

          {scifiShows?.length > 0 && (
            <ContentRow
              title="Sci-Fi & Fantasy"
              items={scifiShows}
              onItemClick={handleContentClick}
            />
          )}

          {crimeShows?.length > 0 && (
            <ContentRow
              title="Crime TV Shows"
              items={crimeShows}
              onItemClick={handleContentClick}
            />
          )}
        </div>
        <Footer />
      </div>

      {/* Content details modal */}
      <ContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contentId={selectedContent?.contentId}
        tmdbId={selectedContent?.id}
        type="tv"
        activeProfileId={activeProfile?.id}
      />
    </div>
  );
}

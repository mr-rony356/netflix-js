import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ContentBanner from "@/components/content/content-banner";
import ContentRow from "@/components/content/content-row";
import ContentModal from "@/components/content/content-modal";
import { getRandomItem } from "@/lib/utils";
import {
  getRecommendationsForProfile,
  getAnimationContent,
  getHighestRatedContent,
} from "@/lib/ai-recommendations";

export default function HomePage() {
  const [selectedContent, setSelectedContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get active profile
  const { data: activeProfile } = useQuery({
    queryKey: ["/api/profiles/active"],
  });

  // Fetch featured/trending content for banner
  const { data: trendingData } = useQuery({
    queryKey: ["/api/content/popular"],
    enabled: !!activeProfile,
  });

  // Fetch personalized recommendations
  const { data: recommendedContent } = useQuery({
    queryKey: ["/api/content/recommendations", activeProfile?.id],
    enabled: !!activeProfile?.id,
    queryFn: () => getRecommendationsForProfile(activeProfile?.id, 10),
  });

  // Fetch new releases
  const { data: newContent } = useQuery({
    queryKey: ["/api/content/newest"],
    enabled: !!activeProfile,
  });

  // Fetch most watched content
  const { data: mostWatchedContent } = useQuery({
    queryKey: ["/api/content/most-viewed"],
    enabled: !!activeProfile,
  });

  // Fetch user's reviewed content
  const { data: reviewedContent } = useQuery({
    queryKey: ["/api/reviews/profile", activeProfile?.id],
    enabled: !!activeProfile?.id,
  });

  // Fetch highest rated content
  const { data: highestRatedContent } = useQuery({
    queryKey: ["/api/content/popular"],
    enabled: !!activeProfile,
    queryFn: () => getHighestRatedContent(10),
  });

  // Fetch animation content
  const { data: animationContent } = useQuery({
    queryKey: ["/api/content/animation"],
    enabled: !!activeProfile,
    queryFn: () => getAnimationContent(10),
  });

  // Fetch my list content
  const { data: myListContent } = useQuery({
    queryKey: ["/api/mylist", activeProfile?.id],
    enabled: !!activeProfile?.id,
  });

  // Select a random trending item for the banner when data changes
  const [featuredContent, setFeaturedContent] = useState(null);

  useEffect(() => {
    if (trendingData?.length > 0) {
      const randomItem = getRandomItem(trendingData.slice(0, 4));
      setFeaturedContent(randomItem);
    }
  }, [trendingData]);

  // Handle content item click
  const handleContentClick = (content) => {
    setSelectedContent(content);
    setIsModalOpen(true);
  };

  // Handle more info button click on banner
  const handleBannerInfoClick = () => {
    if (featuredContent) {
      setSelectedContent(featuredContent);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-16">
        {" "}
        {/* Add padding top to account for fixed header */}
        {/* Featured content banner */}
        {featuredContent && (
          <ContentBanner
            content={featuredContent}
            onInfoClick={handleBannerInfoClick}
          />
        )}
        {/* Content rows */}
        <div className="p-8">
          {recommendedContent?.length > 0 && (
            <ContentRow
              title="Recommended for You"
              items={recommendedContent}
              onItemClick={handleContentClick}
            />
          )}

          {newContent?.length > 0 && (
            <ContentRow
              title="New on Netflix"
              items={newContent}
              onItemClick={handleContentClick}
            />
          )}

          {mostWatchedContent?.length > 0 && (
            <ContentRow
              title="Popular in Your Country"
              items={mostWatchedContent}
              onItemClick={handleContentClick}
            />
          )}

          {reviewedContent?.length > 0 && (
            <ContentRow
              title="Your Reviewed Content"
              items={reviewedContent.map((review) => review.content)}
              onItemClick={handleContentClick}
            />
          )}

          {highestRatedContent?.length > 0 && (
            <ContentRow
              title="Top Rated"
              items={highestRatedContent}
              onItemClick={handleContentClick}
            />
          )}

          {animationContent?.length > 0 && (
            <ContentRow
              title="Animation"
              items={animationContent}
              onItemClick={handleContentClick}
            />
          )}

          {/* Additional genre row (can be made dynamic) */}
          {trendingData?.length > 0 && (
            <ContentRow
              title="Trending Now"
              items={trendingData.slice(5, 15)}
              onItemClick={handleContentClick}
            />
          )}

          {myListContent?.length > 0 && (
            <ContentRow
              title="My List"
              items={myListContent.map((item) => item.content)}
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
        type={
          selectedContent?.media_type ||
          (selectedContent?.title ? "movie" : "tv")
        }
        activeProfileId={activeProfile?.id}
      />
    </div>
  );
}

import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTMDbImageUrl } from "@/lib/utils";
import { FALLBACK_BACKDROP } from "@/lib/constants";

export default function ContentBanner({ content, onInfoClick }) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Get the appropriate title (movies use title, TV shows use name)
  const title = content?.title || content?.name || "";
  const overview = content?.overview || "";

  // Get the backdrop image or use fallback
  const backdropImage = content?.backdrop_path
    ? getTMDbImageUrl(content.backdrop_path, "original")
    : FALLBACK_BACKDROP;

  // Truncate overview text for display
  const truncatedOverview =
    overview.length > 200 ? `${overview.substring(0, 200)}...` : overview;

  useEffect(() => {
    // Reset loading state when content changes
    setIsLoaded(false);

    // Preload the image
    const img = new Image();
    img.src = backdropImage;
    img.onload = () => setIsLoaded(true);
  }, [backdropImage]);

  return (
    <div className="relative w-full h-[70vh] md:h-[80vh]">
      {/* Banner image */}
      <div
        className={`absolute inset-0 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } transition-opacity duration-500`}
      >
        <img
          src={backdropImage}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 netflix-gradient"></div>
      </div>

      {/* Content info */}
      <div className="absolute bottom-0 left-0 p-6 md:p-16 w-full md:w-1/2 z-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
          {title}
        </h1>

        {truncatedOverview && (
          <p className="text-lg text-gray-200 mb-6 hidden md:block">
            {truncatedOverview}
          </p>
        )}

        <Button
          onClick={onInfoClick}
          className="bg-white text-black hover:bg-gray-200 rounded-md"
          size="lg"
        >
          <Info className="mr-2 h-4 w-4" />
          More Info
        </Button>
      </div>

      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-900 animate-pulse">
          <div className="absolute bottom-0 left-0 p-6 md:p-16 w-full md:w-1/2">
            <div className="h-10 bg-gray-800 rounded mb-4 w-3/4"></div>
            <div className="h-4 bg-gray-800 rounded mb-2 w-full"></div>
            <div className="h-4 bg-gray-800 rounded mb-2 w-5/6"></div>
            <div className="h-4 bg-gray-800 rounded mb-6 w-4/6"></div>
            <div className="h-10 bg-gray-800 rounded w-40"></div>
          </div>
        </div>
      )}
    </div>
  );
}

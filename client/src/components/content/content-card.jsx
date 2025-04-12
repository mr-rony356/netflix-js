import { useState, useEffect } from "react";
import { getTMDbImageUrl, truncateText, getYear } from "@/lib/utils";
import { FALLBACK_POSTER } from "@/lib/constants";

export default function ContentCard({ item, onClick }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get the title (movies use title, TV shows use name)
  const title = item?.title || item?.name || "";

  // Year of release
  const year = getYear(item?.release_date || item?.first_air_date || "");

  // Vote average converted to percentage
  const rating = item?.vote_average ? Math.round(item.vote_average * 10) : null;

  // Get poster image or fallback
  const posterImage = item?.poster_path
    ? getTMDbImageUrl(item.poster_path, "w342")
    : FALLBACK_POSTER;

  // Reset loaded state when item changes
  useEffect(() => {
    setIsLoaded(false);

    // Preload the image
    const img = new Image();
    img.src = posterImage;
    img.onload = () => setIsLoaded(true);
  }, [posterImage]);

  return (
    <div
      className={`relative flex-shrink-0 w-32 md:w-44 hover-scale cursor-pointer`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Card image */}
      <div
        className={`aspect-[2/3] rounded-md overflow-hidden ${
          isLoaded ? "opacity-100" : "opacity-0"
        } transition-opacity duration-300`}
      >
        <img
          src={posterImage}
          alt={title}
          className={`w-full h-full object-cover`}
        />
      </div>

      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse rounded-md"></div>
      )}

      {/* Hover info overlay */}
      {isHovered && isLoaded && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent rounded-b-md">
          <h3 className="text-sm font-bold mb-1">{truncateText(title, 20)}</h3>
          <div className="flex items-center text-xs">
            {rating && (
              <span className="text-green-500 font-bold mr-1">{rating}%</span>
            )}
            {year && <span>{year}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

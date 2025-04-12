import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StarRating({ rating, onRating, disabled = false }) {
  const [hoverRating, setHoverRating] = useState(0);

  const getColor = (index) => {
    // If disabled, show the current rating only
    if (disabled) {
      return index <= rating
        ? "text-yellow-400 fill-yellow-400"
        : "text-gray-400";
    }

    // When hovering, show the hover rating
    if (hoverRating >= index) {
      return "text-yellow-400 fill-yellow-400";
    }
    // Otherwise show the current rating
    else if (!hoverRating && rating >= index) {
      return "text-yellow-400 fill-yellow-400";
    }
    // Default state (not rated, not hovered)
    else {
      return "text-gray-400";
    }
  };

  // Handle click to set rating
  const handleClick = (index) => {
    if (disabled) return;

    // If clicking the same star, toggle it off (0 rating)
    if (rating === index) {
      onRating(0);
    } else {
      onRating(index);
    }
  };

  return (
    <div
      className={cn(
        "flex space-x-1",
        disabled ? "opacity-80" : "cursor-pointer"
      )}
      onMouseLeave={() => !disabled && setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          className={cn("w-8 h-8 transition-colors", getColor(index))}
          onClick={() => handleClick(index)}
          onMouseEnter={() => !disabled && setHoverRating(index)}
        />
      ))}
    </div>
  );
}

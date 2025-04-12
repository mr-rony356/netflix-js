import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronRight } from "lucide-react";
import { GENRE_IDS } from "@/lib/constants";

// Define the most popular genres
const POPULAR_GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 18, name: "Drama" },
  { id: 14, name: "Fantasy" },
  { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 53, name: "Thriller" },
];

export default function GenreBrowse() {
  const [, navigate] = useLocation();

  const handleGenreClick = (genreId) => {
    navigate(`/search?genre=${genreId}`);
  };

  return (
    <div className="px-4 md:px-8 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Browse by Genre</h2>
        <button
          onClick={() => navigate("/search")}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          View All <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {POPULAR_GENRES.map((genre) => (
          <div
            key={genre.id}
            onClick={() => handleGenreClick(genre.id)}
            className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 cursor-pointer transition-colors text-center"
          >
            <span className="text-white font-medium">{genre.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

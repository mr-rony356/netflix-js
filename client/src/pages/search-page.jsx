import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Loader2, X } from "lucide-react";
import { useDebounce } from "use-debounce";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ContentModal from "@/components/content/content-modal";
import InfiniteGrid from "@/components/content/infinite-grid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Language options
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
];

// Genre options
const GENRES = [
  { value: "28", label: "Action" },
  { value: "12", label: "Adventure" },
  { value: "16", label: "Animation" },
  { value: "35", label: "Comedy" },
  { value: "80", label: "Crime" },
  { value: "18", label: "Drama" },
  { value: "14", label: "Fantasy" },
  { value: "27", label: "Horror" },
  { value: "10749", label: "Romance" },
  { value: "878", label: "Science Fiction" },
  { value: "53", label: "Thriller" },
];

// Year options
const YEARS = Array.from({ length: 30 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year.toString(), label: year.toString() };
});

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 500);
  const [selectedContent, setSelectedContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [language, setLanguage] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");

  // Get active profile
  const { data: activeProfile } = useQuery({
    queryKey: ["/api/profiles/active"],
  });

  // Check for URL parameters whenever the URL changes
  const [location] = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const genreParam = searchParams.get("genre");

    if (genreParam) {
      setGenre(genreParam);
      // Set a default query if coming directly from genre selection
      setSearchQuery("*"); // Use a wildcard to show all results for this genre
    }
  }, [location]);

  // Determine if we should show genre results without search query
  const hasGenreFilter = genre && genre !== "all";

  // Fetch search results
  const {
    data: searchResults,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/content/search", debouncedQuery, language, genre, year],
    enabled:
      !!activeProfile && (debouncedQuery.length > 2 || Boolean(hasGenreFilter)),
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("q", debouncedQuery || "*"); // Use wildcard if query is empty but genre is specified
      if (language && language !== "all") params.append("language", language);
      if (genre && genre !== "all") params.append("genre", genre);
      if (year && year !== "all") params.append("year", year);

      const response = await fetch(`/api/content/search?${params.toString()}`);
      if (!response.ok) throw new Error("Search failed");
      return await response.json();
    },
  });

  // Function to fetch more search results for infinite scroll
  const fetchMoreSearchResults = useCallback(
    async (page) => {
      try {
        // Build query parameters
        const params = new URLSearchParams();
        params.append("q", debouncedQuery || "*"); // Use wildcard for genre-only searches
        params.append("page", page.toString());
        if (language) params.append("language", language);
        if (genre) params.append("genre", genre);
        if (year) params.append("year", year);

        const response = await fetch(
          `/api/content/search?${params.toString()}`
        );
        if (!response.ok) throw new Error("Failed to fetch more results");
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching more search results:", error);
        throw error;
      }
    },
    [debouncedQuery, language, genre, year]
  );

  // Handle content item click
  const handleContentClick = (content) => {
    setSelectedContent(content);
    setIsModalOpen(true);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setLanguage("all");
    setGenre("all");
    setYear("all");
  };

  // Refetch when filters change
  useEffect(() => {
    if (debouncedQuery.length > 2 || hasGenreFilter) {
      refetch();
    }
  }, [language, genre, year, hasGenreFilter, refetch, debouncedQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-28 px-4 md:px-16">
        {" "}
        {/* Add padding top to account for fixed header */}
        {/* Search header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Search
          </h1>

          {/* Search input */}
          <div className="relative mb-6">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for movies, TV shows, actors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 bg-gray-800 border-gray-700 text-white text-lg w-full"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div>
              <Label htmlFor="language" className="text-gray-300 mb-1 block">
                Language
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger
                  id="language"
                  className="bg-gray-800 border-gray-700 text-white"
                >
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="all">All Languages</SelectItem>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="genre" className="text-gray-300 mb-1 block">
                Genre
              </Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger
                  id="genre"
                  className="bg-gray-800 border-gray-700 text-white"
                >
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="all">All Genres</SelectItem>
                  {GENRES.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year" className="text-gray-300 mb-1 block">
                Year
              </Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger
                  id="year"
                  className="bg-gray-800 border-gray-700 text-white"
                >
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="all">All Years</SelectItem>
                  {YEARS.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {/* Search results */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : searchResults ? (
          <InfiniteGrid
            initialItems={searchResults || []}
            fetchItems={fetchMoreSearchResults}
            onItemClick={handleContentClick}
            filters={{ type: "", genre, year }}
          />
        ) : hasGenreFilter ? (
          <div className="flex justify-center items-center min-h-[300px] text-gray-400">
            <p>Loading content for this genre...</p>
          </div>
        ) : debouncedQuery.length > 0 && debouncedQuery.length < 3 ? (
          <div className="flex justify-center items-center min-h-[300px] text-gray-400">
            <p>Enter at least 3 characters to search</p>
          </div>
        ) : (
          <div className="flex justify-center items-center min-h-[300px] text-gray-400">
            <p>Use the search box above or select a genre to find content</p>
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

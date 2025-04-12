import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, Search, Loader2, Film, Tv } from "lucide-react";
import { debounce } from "lodash";
import { ROUTES } from "@/lib/constants";

// Form schema for content search
const searchSchema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters"),
  type: z.enum(["movie", "tv"]),
});

// Form schema for content selection
const contentSelectionSchema = z.object({
  tmdbId: z.number(),
  type: z.enum(["movie", "tv"]),
});

export default function ContentForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);

  // Form for searching content
  const searchForm = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: "",
      type: "movie",
    },
  });

  // Form for content selection
  const contentSelectionForm = useForm({
    resolver: zodResolver(contentSelectionSchema),
    defaultValues: {
      tmdbId: 0,
      type: "movie",
    },
  });

  // Search for content
  const searchContent = async (values) => {
    try {
      setIsSearching(true);
      const params = new URLSearchParams();
      params.append("q", values.query);
      params.append("type", values.type);

      const response = await fetch(`/api/content/search?${params.toString()}`);
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching content:", error);
      toast({
        title: "Search Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to search for content",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search to prevent too many API calls
  const debouncedSearch = debounce((values) => {
    searchContent(values);
  }, 500);

  // Handle search form submission
  const onSearchSubmit = (values) => {
    debouncedSearch(values);
  };

  // Handle search input change
  const handleSearchChange = () => {
    searchForm.handleSubmit(onSearchSubmit)();
  };

  // Select a content item from search results
  const handleSelectContent = (content) => {
    setSelectedContent(content);
    contentSelectionForm.setValue("tmdbId", content.id);
    contentSelectionForm.setValue(
      "type",
      content.media_type || searchForm.getValues("type")
    );
  };

  // Add content mutation
  const addContentMutation = useMutation({
    mutationFn: async (values) => {
      const response = await apiRequest("POST", "/api/admin/content", values);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Added",
        description: `${
          selectedContent?.title || selectedContent?.name
        } has been added to the library`,
      });
      navigate(ROUTES.ADMIN);
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Content",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle content selection form submission
  const onContentSubmit = (values) => {
    addContentMutation.mutate(values);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-28 px-4 md:px-16 pb-16">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.ADMIN)}
            className="mr-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div>
            <h1 className="text-3xl font-bold text-white">Add Content</h1>
            <p className="text-gray-400">
              Search and add movies or TV shows to the Netflix library
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Search section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Search Content</CardTitle>
              <CardDescription>
                Search for movies or TV shows using the external API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...searchForm}>
                <form onChange={handleSearchChange} className="space-y-6">
                  <div className="flex flex-col space-y-4">
                    <FormField
                      control={searchForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">
                            Content Type
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="Select content type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-700 border-gray-600 text-white">
                              <SelectItem value="movie">
                                <div className="flex items-center">
                                  <Film className="mr-2 h-4 w-4" />
                                  Movie
                                </div>
                              </SelectItem>
                              <SelectItem value="tv">
                                <div className="flex items-center">
                                  <Tv className="mr-2 h-4 w-4" />
                                  TV Show
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={searchForm.control}
                      name="query"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">
                            Search Query
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter movie or show title..."
                                className="bg-gray-700 border-gray-600 text-white pl-10"
                              />
                            </FormControl>
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>

              {/* Search results */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-white mb-3">
                  Search Results
                </h3>

                {isSearching ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>
                      {searchForm.getValues("query")
                        ? "No results found"
                        : "Enter a search term to find content"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {searchResults.map((result) => (
                      <div
                        key={`${result.id}-${
                          result.media_type || searchForm.getValues("type")
                        }`}
                        className={`
                          flex items-center p-3 rounded-md cursor-pointer transition-colors
                          ${
                            selectedContent?.id === result.id
                              ? "bg-primary bg-opacity-20"
                              : "bg-gray-700 hover:bg-gray-600"
                          }
                        `}
                        onClick={() => handleSelectContent(result)}
                      >
                        {result.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                            alt={result.title || result.name}
                            className="w-12 h-18 rounded-md mr-3"
                          />
                        ) : (
                          <div className="w-12 h-18 rounded-md bg-gray-600 mr-3 flex items-center justify-center">
                            <Film className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-white font-medium">
                            {result.title || result.name}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {result.release_date?.split("-")[0] ||
                              result.first_air_date?.split("-")[0] ||
                              "N/A"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content selection section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Selected Content</CardTitle>
              <CardDescription>
                Review and confirm the content to add to the library
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedContent ? (
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    {selectedContent.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342${selectedContent.poster_path}`}
                        alt={selectedContent.title || selectedContent.name}
                        className="w-32 rounded-md"
                      />
                    ) : (
                      <div className="w-32 h-48 rounded-md bg-gray-600 flex items-center justify-center">
                        <Film className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {selectedContent.title || selectedContent.name}
                      </h3>
                      <p className="text-gray-400">
                        {selectedContent.release_date?.split("-")[0] ||
                          selectedContent.first_air_date?.split("-")[0] ||
                          "N/A"}
                      </p>
                      <p className="text-gray-400 mt-2">
                        {selectedContent.overview}
                      </p>
                    </div>
                  </div>

                  <Form {...contentSelectionForm}>
                    <form
                      onSubmit={contentSelectionForm.handleSubmit(
                        onContentSubmit
                      )}
                      className="space-y-4"
                    >
                      <FormField
                        control={contentSelectionForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">
                              Content Type
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                  <SelectValue placeholder="Select content type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-700 border-gray-600 text-white">
                                <SelectItem value="movie">
                                  <div className="flex items-center">
                                    <Film className="mr-2 h-4 w-4" />
                                    Movie
                                  </div>
                                </SelectItem>
                                <SelectItem value="tv">
                                  <div className="flex items-center">
                                    <Tv className="mr-2 h-4 w-4" />
                                    TV Show
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={addContentMutation.isPending}
                      >
                        {addContentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding Content...
                          </>
                        ) : (
                          "Add to Library"
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Select a content item from the search results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

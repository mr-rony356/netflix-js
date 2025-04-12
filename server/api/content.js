import { storage } from "../storage.js";
import { insertContentSchema } from "../../shared/schema.js";
import {
  fetchTrendingMovies,
  fetchTrendingTVShows,
  searchMoviesAndShows,
  getMovieDetails,
  getTVDetails,
} from "../services/tmdb.js";
import { getRecommendations } from "../services/ai-recommendations.js";
import { z } from "zod";

// Helper function to save a TMDB item to our database
async function saveContentToDb(item, type) {
  try {
    // Check if content already exists in our db by TMDB ID
    const existingContent = await storage.getContentByTmdbId(item.id);
    if (existingContent) {
      return existingContent; // Already exists, return it
    }

    // Prepare content data
    const contentData = {
      tmdbId: item.id,
      type,
      title: item.title || item.name,
      overview: item.overview,
      posterPath: item.poster_path,
      backdropPath: item.backdrop_path,
      releaseDate: item.release_date || item.first_air_date,
      voteAverage: item.vote_average || 0,
      popularity: item.popularity || 0,
      genreIds: JSON.stringify(item.genre_ids || []),
      additionalData: JSON.stringify({
        media_type: type,
        ...item,
      }),
    };

    // Save to database
    const savedContent = await storage.createContent(contentData);

    // Return saved content
    return savedContent;
  } catch (error) {
    console.error("Error saving content to database:", error);
    throw error;
  }
}

export function setupContentRoutes(app) {
  // Middleware to check authentication
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };

  // Get newest content
  app.get("/api/content/newest", isAuthenticated, async (req, res, next) => {
    try {
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;

      // Fetch from TMDb and map to our content
      const [trendingMovies, trendingTVShows] = await Promise.all([
        fetchTrendingMovies(),
        fetchTrendingTVShows(),
      ]);

      // Combine and sort by release date
      const allContent = [...trendingMovies, ...trendingTVShows]
        .sort(
          (a, b) =>
            new Date(b.release_date || b.first_air_date || "").getTime() -
            new Date(a.release_date || a.first_air_date || "").getTime()
        )
        .slice(0, limit);

      res.json(allContent);
    } catch (error) {
      next(error);
    }
  });

  // Get most popular content
  app.get("/api/content/popular", isAuthenticated, async (req, res, next) => {
    try {
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;

      // Fetch from TMDb and map to our content
      const [trendingMovies, trendingTVShows] = await Promise.all([
        fetchTrendingMovies(),
        fetchTrendingTVShows(),
      ]);

      // Combine and sort by popularity
      const allContent = [...trendingMovies, ...trendingTVShows]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, limit);

      res.json(allContent);
    } catch (error) {
      next(error);
    }
  });

  // Get most viewed content (based on reviews count)
  app.get(
    "/api/content/most-viewed",
    isAuthenticated,
    async (req, res, next) => {
      try {
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;

        // Get all content
        const contentList = await storage.getAllContent();

        // Get review counts for each content
        const contentWithReviewCounts = await Promise.all(
          contentList.map(async (content) => {
            const reviews = await storage.getReviewsByContentId(content.id);
            return {
              ...content,
              reviewCount: reviews.length,
            };
          })
        );

        // Sort by review count and paginate
        const sortedContent = contentWithReviewCounts
          .sort((a, b) => b.reviewCount - a.reviewCount)
          .slice((page - 1) * limit, page * limit);

        // Fetch full details for each content item
        const contentWithDetails = await Promise.all(
          sortedContent.map(async (content) => {
            if (content.type === "movie") {
              return await getMovieDetails(content.tmdbId);
            } else {
              return await getTVDetails(content.tmdbId);
            }
          })
        );

        res.json(contentWithDetails);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get AI-recommended content for a profile
  app.get(
    "/api/content/recommendations/:profileId",
    isAuthenticated,
    async (req, res, next) => {
      try {
        const profileId = parseInt(req.params.profileId);
        const profile = await storage.getProfile(profileId);

        if (!profile) {
          return res.status(404).json({ message: "Profile not found" });
        }

        // Check if profile belongs to the authenticated user
        if (profile.userId !== req.user.id) {
          return res.status(403).json({ message: "Access denied" });
        }

        const limit = req.query.limit ? parseInt(req.query.limit) : 10;

        // Get profile's reviews
        const reviews = await storage.getReviewsByProfileId(profileId);

        // Get recommendations based on reviews
        const recommendations = await getRecommendations(reviews, limit);

        res.json(recommendations);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get movies only
  app.get("/api/content/movies", isAuthenticated, async (req, res, next) => {
    try {
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;

      // Fetch trending movies from TMDb
      const movies = await fetchTrendingMovies(page);

      res.json(movies.slice(0, limit));
    } catch (error) {
      next(error);
    }
  });

  // Get TV shows only
  app.get("/api/content/tvshows", isAuthenticated, async (req, res, next) => {
    try {
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;

      // Fetch trending TV shows from TMDb
      const tvShows = await fetchTrendingTVShows(page);

      res.json(tvShows.slice(0, limit));
    } catch (error) {
      next(error);
    }
  });

  // Create content (from client-side data)
  app.post("/api/content", isAuthenticated, async (req, res, next) => {
    try {
      // Validate input with zod
      const validatedData = insertContentSchema.parse(req.body);

      // Check if content already exists by TMDB ID
      const existingContent = await storage.getContentByTmdbId(
        validatedData.tmdbId
      );
      if (existingContent) {
        return res.json(existingContent); // Return existing content
      }

      // Create new content record
      const newContent = await storage.createContent(validatedData);

      res.status(201).json(newContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  // Get content details
  app.get("/api/content/:type/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const type = req.params.type;

      if (type !== "movie" && type !== "tv") {
        return res.status(400).json({ message: "Invalid content type" });
      }

      // Fetch details from TMDb
      let details;
      if (type === "movie") {
        details = await getMovieDetails(id);
      } else {
        details = await getTVDetails(id);
      }

      // Check if content exists in our database
      let content = await storage.getContentByTmdbId(id);

      // If content doesn't exist, create it
      if (!content) {
        const contentData = {
          tmdbId: id,
          type,
          title: details.title || details.name,
          overview: details.overview,
          posterPath: details.poster_path,
          backdropPath: details.backdrop_path,
          releaseDate: details.release_date || details.first_air_date,
          voteAverage: details.vote_average || 0,
          popularity: details.popularity || 0,
          genreIds: JSON.stringify(details.genre_ids || []),
          additionalData: JSON.stringify({
            media_type: type,
            ...details,
          }),
        };
        content = await storage.createContent(contentData);
      }

      // Return both TMDb details and our content record
      res.json({
        ...details,
        contentId: content.id,
      });
    } catch (error) {
      next(error);
    }
  });

  // Search for content
  app.get("/api/content/search", isAuthenticated, async (req, res, next) => {
    try {
      const { q: query, page = 1, language, genre, year } = req.query;

      if (!query && !genre) {
        return res
          .status(400)
          .json({ message: "Search query or genre is required" });
      }

      // Search using TMDb API
      const results = await searchMoviesAndShows(query || "*", {
        page: parseInt(page),
        language,
        genre,
        year,
      });

      res.json(results);
    } catch (error) {
      next(error);
    }
  });
}

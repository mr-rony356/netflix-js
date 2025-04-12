import { storage } from "../storage.js";
import { insertReviewSchema } from "../../shared/schema.js";
import { z } from "zod";

export function setupReviewRoutes(app) {
  // Middleware to check authentication
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };

  // Get all reviews for a content item
  app.get(
    "/api/reviews/content/:contentId",
    isAuthenticated,
    async (req, res, next) => {
      try {
        const contentId = parseInt(req.params.contentId);

        // Check if content exists
        const content = await storage.getContent(contentId);
        if (!content) {
          return res.status(404).json({ message: "Content not found" });
        }

        // Get all reviews for this content
        const reviews = await storage.getReviewsByContentId(contentId);

        // Filter out private reviews that don't belong to the current user's profiles
        const userProfiles = await storage.getProfilesByUserId(req.user.id);
        const userProfileIds = userProfiles.map((profile) => profile.id);

        const filteredReviews = reviews.filter(
          (review) =>
            review.isPublic || userProfileIds.includes(review.profileId)
        );

        res.json(filteredReviews);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get all reviews by a profile
  app.get(
    "/api/reviews/profile/:profileId",
    isAuthenticated,
    async (req, res, next) => {
      try {
        const profileId = parseInt(req.params.profileId);

        // Check if profile exists and belongs to the user
        const profile = await storage.getProfile(profileId);
        if (!profile) {
          return res.status(404).json({ message: "Profile not found" });
        }

        if (profile.userId !== req.user.id) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Get all reviews by this profile
        const reviews = await storage.getReviewsByProfileId(profileId);
        res.json(reviews);
      } catch (error) {
        next(error);
      }
    }
  );

  // Create a new review
  app.post("/api/reviews", isAuthenticated, async (req, res, next) => {
    try {
      const reviewData = req.body;

      // Check if profile exists and belongs to the user
      const profile = await storage.getProfile(reviewData.profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      if (profile.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if content exists
      const content = await storage.getContent(reviewData.contentId);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      // Validate input
      const validatedData = insertReviewSchema.parse(reviewData);

      // Create review
      const review = await storage.createReview(validatedData);

      // Log the action
      await storage.createLog({
        action: "review_created",
        userId: req.user.id,
        details: `Profile ${profile.name} reviewed content ${content.id}`,
      });

      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid review data", errors: error.errors });
      }
      next(error);
    }
  });

  // Update a review
  app.put("/api/reviews/:id", isAuthenticated, async (req, res, next) => {
    try {
      const reviewId = parseInt(req.params.id);
      const reviewData = req.body;

      // Get the review
      const review = await storage.getReview(reviewId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      // Check if profile exists and belongs to the user
      const profile = await storage.getProfile(review.profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      if (profile.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Update review
      const updatedReview = await storage.updateReview(reviewId, reviewData);
      if (!updatedReview) {
        return res.status(404).json({ message: "Review not found" });
      }

      // Log the action
      await storage.createLog({
        action: "review_updated",
        userId: req.user.id,
        details: `Profile ${profile.name} updated review ${reviewId}`,
      });

      res.json(updatedReview);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid review data", errors: error.errors });
      }
      next(error);
    }
  });

  // Delete a review
  app.delete("/api/reviews/:id", isAuthenticated, async (req, res, next) => {
    try {
      const reviewId = parseInt(req.params.id);

      // Get the review
      const review = await storage.getReview(reviewId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      // Check if profile exists and belongs to the user
      const profile = await storage.getProfile(review.profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      if (profile.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Delete review
      const success = await storage.deleteReview(reviewId);
      if (!success) {
        return res.status(404).json({ message: "Review not found" });
      }

      // Log the action
      await storage.createLog({
        action: "review_deleted",
        userId: req.user.id,
        details: `Profile ${profile.name} deleted review ${reviewId}`,
      });

      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });
}

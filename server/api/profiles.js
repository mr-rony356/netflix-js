import { storage } from "../storage.js";
import { insertProfileSchema } from "../../shared/schema.js";
import { z } from "zod";

export function setupProfileRoutes(app) {
  // Middleware to check authentication
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };

  // Store active profile in session
  app.post("/api/profiles/active", isAuthenticated, async (req, res, next) => {
    try {
      const { profileId } = req.body;

      if (!profileId || typeof profileId !== "number") {
        return res.status(400).json({ message: "Valid profileId is required" });
      }

      // Check if profile exists and belongs to user
      const profile = await storage.getProfile(profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      if (profile.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Store active profile in session and save immediately
      req.session.activeProfileId = profileId;

      // Force save the session to ensure it's stored
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return next(err);
        }

        // Log success after session is saved
        console.log("Profile activated and session saved:", profileId);
        res.json({ activeProfileId: profileId, profile });
      });
    } catch (error) {
      console.error("Error in /api/profiles/active:", error);
      next(error);
    }
  });

  // Get active profile
  app.get("/api/profiles/active", isAuthenticated, async (req, res, next) => {
    try {
      const activeProfileId = req.session.activeProfileId;

      if (!activeProfileId) {
        return res.status(404).json({ message: "No active profile" });
      }

      const profile = await storage.getProfile(activeProfileId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Check if profile belongs to user
      if (profile.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(profile);
    } catch (error) {
      next(error);
    }
  });

  // Get all profiles for a user
  app.get("/api/profiles", isAuthenticated, async (req, res, next) => {
    try {
      console.log("Fetching profiles for user ID:", req.user.id);
      const profiles = await storage.getProfilesByUserId(req.user.id);
      console.log("Found profiles:", profiles);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      next(error);
    }
  });

  // Get a specific profile
  app.get("/api/profiles/:id", isAuthenticated, async (req, res, next) => {
    try {
      const profileId = parseInt(req.params.id);
      if (isNaN(profileId)) {
        return res.status(400).json({ message: "Invalid profile ID" });
      }

      const profile = await storage.getProfile(profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Check if profile belongs to user
      if (profile.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(profile);
    } catch (error) {
      next(error);
    }
  });

  // Create a new profile
  app.post("/api/profiles", isAuthenticated, async (req, res, next) => {
    try {
      const result = insertProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .json({
            message: "Invalid profile data",
            errors: result.error.errors,
          });
      }

      const profileData = {
        ...result.data,
        userId: req.user.id,
      };

      const profile = await storage.createProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      next(error);
    }
  });

  // Update a profile
  app.put("/api/profiles/:id", isAuthenticated, async (req, res, next) => {
    try {
      const profileId = parseInt(req.params.id);
      if (isNaN(profileId)) {
        return res.status(400).json({ message: "Invalid profile ID" });
      }

      const profile = await storage.getProfile(profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Check if profile belongs to user
      if (profile.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { name } = req.body;
      if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "Valid name is required" });
      }

      const updatedProfile = await storage.updateProfile(profileId, name);
      if (!updatedProfile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.json(updatedProfile);
    } catch (error) {
      next(error);
    }
  });

  // Delete a profile
  app.delete("/api/profiles/:id", isAuthenticated, async (req, res, next) => {
    try {
      const profileId = parseInt(req.params.id);
      if (isNaN(profileId)) {
        return res.status(400).json({ message: "Invalid profile ID" });
      }

      const profile = await storage.getProfile(profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Check if profile belongs to user
      if (profile.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.deleteProfile(profileId);
      if (!success) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // If the deleted profile was the active profile, clear it from the session
      if (req.session.activeProfileId === profileId) {
        delete req.session.activeProfileId;
        req.session.save();
      }

      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });
}

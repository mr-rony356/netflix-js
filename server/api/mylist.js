import { storage } from "../storage.js";
import { insertMyListSchema } from "../../shared/schema.js";
import { z } from "zod";

export function setupMyListRoutes(app) {
  // Middleware to check authentication
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };

  // Get my list for active profile
  app.get("/api/mylist", isAuthenticated, async (req, res, next) => {
    try {
      // Check if there's an active profile in the session
      console.log("Getting my list for user:", req.user?.id);
      console.log("Active profile in session:", req.session.activeProfileId);

      if (!req.session.activeProfileId) {
        return res.status(200).json([]); // Return empty array instead of error for better UX
      }

      const profileId = req.session.activeProfileId;
      console.log("Fetching my list for profile ID:", profileId);

      // Check if profile exists and belongs to the user
      const profile = await storage.getProfile(profileId);
      if (!profile) {
        console.log("Profile not found:", profileId);
        return res.status(200).json([]); // Return empty array instead of error
      }

      if (profile.userId !== req.user.id) {
        console.log(
          "Access denied - profile userId:",
          profile.userId,
          "user id:",
          req.user.id
        );
        return res.status(200).json([]); // Return empty array instead of error
      }

      // Get the list items
      console.log("Getting my list items for profile:", profileId);
      const myListItems = await storage.getMyList(profileId);
      console.log("Found my list items:", myListItems.length);

      if (myListItems.length === 0) {
        return res.json([]);
      }

      // Get content details for each item
      console.log("Getting content details for items");
      const contentDetails = await Promise.all(
        myListItems.map(async (item) => {
          try {
            const content = await storage.getContent(item.contentId);
            if (!content) {
              console.log("Content not found for item:", item.contentId);
              return null;
            }
            return { ...item, content };
          } catch (err) {
            console.error(
              "Error getting content for item:",
              item.contentId,
              err
            );
            return null;
          }
        })
      );

      // Filter out null items (content not found)
      const validItems = contentDetails.filter((item) => item !== null);
      console.log("Returning valid items:", validItems.length);

      res.json(validItems);
    } catch (error) {
      console.error("Error in /api/mylist:", error);
      res.status(200).json([]); // Return empty array on error for better UX
    }
  });

  // Get my list for a profile
  app.get("/api/mylist/:profileId", isAuthenticated, async (req, res, next) => {
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

      // Get the list items
      const myListItems = await storage.getMyList(profileId);

      // Get content details for each item
      const contentDetails = await Promise.all(
        myListItems.map(async (item) => {
          const content = await storage.getContent(item.contentId);
          if (!content) return null;
          return { ...item, content };
        })
      );

      // Filter out null items (content not found)
      const validItems = contentDetails.filter((item) => item !== null);

      res.json(validItems);
    } catch (error) {
      next(error);
    }
  });

  // Add item to my list
  app.post("/api/mylist", isAuthenticated, async (req, res, next) => {
    try {
      const myListData = req.body;

      // Check if profile exists and belongs to the user
      const profile = await storage.getProfile(myListData.profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      if (profile.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if content exists
      const content = await storage.getContent(myListData.contentId);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      // Check if item is already in the list
      const isInList = await storage.isInMyList(
        myListData.profileId,
        myListData.contentId
      );
      if (isInList) {
        return res.status(400).json({ message: "Content already in list" });
      }

      // Validate input
      const validatedData = insertMyListSchema.parse(myListData);

      // Add to list
      const myListItem = await storage.addToMyList(validatedData);

      // Log the action
      await storage.createLog({
        action: "mylist_added",
        userId: req.user.id,
        details: `Profile ${profile.name} added content ${content.id} to their list`,
      });

      res.status(201).json(myListItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  // Remove item from my list
  app.delete(
    "/api/mylist/:profileId/:contentId",
    isAuthenticated,
    async (req, res, next) => {
      try {
        const profileId = parseInt(req.params.profileId);
        const contentId = parseInt(req.params.contentId);

        // Check if profile exists and belongs to the user
        const profile = await storage.getProfile(profileId);
        if (!profile) {
          return res.status(404).json({ message: "Profile not found" });
        }

        if (profile.userId !== req.user.id) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Check if content exists
        const content = await storage.getContent(contentId);
        if (!content) {
          return res.status(404).json({ message: "Content not found" });
        }

        // Remove from list
        const success = await storage.removeFromMyList(profileId, contentId);
        if (!success) {
          return res.status(404).json({ message: "Item not found in list" });
        }

        // Log the action
        await storage.createLog({
          action: "mylist_removed",
          userId: req.user.id,
          details: `Profile ${profile.name} removed content ${content.id} from their list`,
        });

        res.sendStatus(204);
      } catch (error) {
        next(error);
      }
    }
  );
}

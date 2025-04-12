import { apiRequest } from "./queryClient";

// This client-side module will handle making requests to the server's AI recommendation service

// Get content recommendations for a specific profile
export async function getRecommendationsForProfile(profileId, limit = 10) {
  try {
    const response = await fetch(
      `/api/content/recommendations/${profileId}?limit=${limit}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching recommendations: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to get recommendations:", error);
    throw error;
  }
}

// Add a review to help improve recommendations
export async function addReviewForRecommendations(data) {
  try {
    const response = await apiRequest("POST", "/api/reviews", data);
    return await response.json();
  } catch (error) {
    console.error("Failed to add review:", error);
    throw error;
  }
}

// Get animation content (used for one of the rows)
export async function getAnimationContent(limit = 10) {
  try {
    // Animation genre ID is 16
    const response = await fetch(
      `/api/content/search?genre=16&limit=${limit}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching animation content: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to get animation content:", error);
    throw error;
  }
}

// Get highest rated content
export async function getHighestRatedContent(limit = 10) {
  try {
    const response = await fetch(`/api/content/popular?limit=${limit}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        `Error fetching highest rated content: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to get highest rated content:", error);
    throw error;
  }
}

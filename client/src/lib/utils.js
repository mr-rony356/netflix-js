import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format date - Example: Jan 12, 2022
export function formatDate(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Get year from date
export function getYear(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getFullYear().toString();
}

// Format runtime - Example: 2h 15m
export function formatRuntime(minutes) {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours > 0 ? `${hours}h` : ""} ${mins > 0 ? `${mins}m` : ""}`;
}

// Get image URL from TMDb path
export function getTMDbImageUrl(path, size = "original") {
  if (!path) return "https://via.placeholder.com/500x750?text=No+Image";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

// Format list of genres
export function formatGenres(genres) {
  if (!genres || genres.length === 0) return "";
  return genres.map((g) => g.name).join(", ");
}

// Get random item from array
export function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Get a random number between min and max (inclusive)
export function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Extract YouTube video ID from various YouTube URL formats
export function getYouTubeId(url) {
  if (!url) return null;

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  return match && match[2].length === 11 ? match[2] : null;
}

// Truncate text with ellipsis
export function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text || "";
  return text.substring(0, maxLength) + "...";
}

// Create match percentage from rating (1-5 scale to 0-100%)
export function ratingToMatchPercentage(rating) {
  if (rating === null || rating === undefined) return 0;
  return Math.round((rating / 5) * 100);
}

// Generate a random avatar ID (1-4)
export function getRandomAvatarId() {
  return Math.floor(Math.random() * 4) + 1;
}

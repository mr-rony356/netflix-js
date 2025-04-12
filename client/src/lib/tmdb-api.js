import { TMDB_API_BASE_URL } from "./constants";

// Use environment variable
const API_KEY = "a469ae4b2443c21d2ec656c61874b199";

// Fetch trending movies
export async function fetchTrendingMovies(page = 1) {
  const url = `${TMDB_API_BASE_URL}/trending/movie/week?api_key=${API_KEY}&page=${page}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `TMDb API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.results;
}

// Fetch trending TV shows
export async function fetchTrendingTVShows(page = 1) {
  const url = `${TMDB_API_BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `TMDb API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.results;
}

// Get movie details
export async function getMovieDetails(id) {
  const url = `${TMDB_API_BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=credits,videos,images,similar`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `TMDb API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
}

// Get TV show details
export async function getTVDetails(id) {
  const url = `${TMDB_API_BASE_URL}/tv/${id}?api_key=${API_KEY}&append_to_response=credits,videos,images,similar,seasons`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `TMDb API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
}

// Search for movies and TV shows
export async function searchMoviesAndShows(query, options = {}) {
  const { page = 1, language, genre, year } = options;

  let queryParams = `query=${encodeURIComponent(query)}&page=${page}`;

  if (language) {
    queryParams += `&with_original_language=${language}`;
  }

  if (genre) {
    queryParams += `&with_genres=${genre}`;
  }

  if (year) {
    queryParams += `&primary_release_year=${year}`;
  }

  const url = `${TMDB_API_BASE_URL}/search/multi?api_key=${API_KEY}&${queryParams}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `TMDb API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.results;
}

// Fetch movies by genre
export async function fetchMoviesByGenre(genreId, page = 1) {
  const url = `${TMDB_API_BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${page}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `TMDb API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.results;
}

// Fetch TV shows by genre
export async function fetchTVShowsByGenre(genreId, page = 1) {
  const url = `${TMDB_API_BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${genreId}&page=${page}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `TMDb API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.results;
}

// Get all popular movies
export async function getPopularMovies(page = 1) {
  const url = `${TMDB_API_BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `TMDb API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.results;
}

// Get all popular TV shows
export async function getPopularTVShows(page = 1) {
  const url = `${TMDB_API_BASE_URL}/tv/popular?api_key=${API_KEY}&page=${page}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `TMDb API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.results;
}

// Get movie genres
export async function getMovieGenres() {
  const url = `${TMDB_API_BASE_URL}/genre/movie/list?api_key=${API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `TMDb API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.genres;
}

// Get TV genres
export async function getTVGenres() {
  const url = `${TMDB_API_BASE_URL}/genre/tv/list?api_key=${API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `TMDb API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.genres;
}

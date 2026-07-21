const API_KEY = import.meta.env.VITE_TMDB_API_KEY || "193c909f9dcb815ea536c783dab59ff5"; // fallback for testing if env not loaded
const BASE_URL = "https://api.themoviedb.org/3";
export const IMAGE_BASE = "https://image.tmdb.org/t/p/";

async function fetchTmdb(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", API_KEY);
  url.searchParams.append("language", "en-US");
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB API Error: ${res.statusText}`);
  }
  return res.json();
}

export async function getTrending(type: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'day') {
  return fetchTmdb(`/trending/${type}/${timeWindow}`);
}

export async function getPopular(type: 'movie' | 'tv') {
  return fetchTmdb(`/${type}/popular`);
}

export async function getTopRated(type: 'movie' | 'tv') {
  return fetchTmdb(`/${type}/top_rated`);
}

export async function searchMulti(query: string, page: number = 1) {
  if (!query) return { results: [] };
  return fetchTmdb(`/search/multi`, { query, page: page.toString() });
}

export async function getDetails(type: 'movie' | 'tv', id: number) {
  return fetchTmdb(`/${type}/${id}`, { append_to_response: 'videos,credits,similar' });
}

export async function getCredits(type: 'movie' | 'tv', id: number) {
  return fetchTmdb(`/${type}/${id}/credits`);
}

export async function getGenres(type: 'movie' | 'tv') {
  return fetchTmdb(`/genre/${type}/list`);
}

export async function getByGenre(type: 'movie' | 'tv', genreId: number, page: number = 1) {
  return fetchTmdb(`/discover/${type}`, { with_genres: genreId.toString(), page: page.toString() });
}

export async function getDiscover(type: 'movie' | 'tv', params: Record<string, string> = {}) {
  return fetchTmdb(`/discover/${type}`, params);
}

export async function getSeasonDetails(tvId: number, seasonNumber: number) {
  return fetchTmdb(`/tv/${tvId}/season/${seasonNumber}`);
}
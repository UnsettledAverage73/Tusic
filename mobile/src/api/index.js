import { YouTubeSearch } from './search';
import { Platform } from 'react-native';

// Replace with your Render URL or local IP for testing
export const API_BASE_URL = 'http://172.20.10.8:8000'; 

/**
 * Lightweight Fetch-based API client to avoid Axios/whatwg-url 
 * compatibility issues with Hermes on Web.
 */
const apiFetch = async (endpoint) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[API] Starting Request: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[API] Response Success`);
    return { data };
  } catch (error) {
    console.log(`[API] Response Error: ${error.message}`);
    throw error;
  }
};

export const TusicAPI = {
  search: async (query) => {
    // 1. Try Decentralized Client-Side Search (FAST & RELIABLE)
    // Only attempt on native mobile to avoid CORS blocks in the browser.
    if (Platform.OS !== 'web') {
      const localResults = await YouTubeSearch.search(query);
      if (localResults && localResults.length > 0) {
        return localResults;
      }
    }

    // 2. Fallback to Backend Proxy (Required for Web and blocked native nodes)
    console.log("[API] Local search unavailable or failed, using backend proxy...");
    const response = await apiFetch(`/search?q=${encodeURIComponent(query)}`);
    return response.data.results;
  },
  searchPodcasts: async (query) => {
    const response = await apiFetch(`/podcasts?q=${encodeURIComponent(query)}`);
    return response.data.results;
  },
  getRadio: async (videoId) => {
    const response = await apiFetch(`/radio?id=${videoId}`);
    return response.data.results;
  },
  resolve: async (videoId) => {
    const response = await apiFetch(`/resolve?id=${videoId}`);
    return response.data.url;
  },
  getLyrics: async (videoId) => {
    const response = await apiFetch(`/lyrics?id=${videoId}`);
    return response.data.lyrics;
  },
};

export default { get: apiFetch };

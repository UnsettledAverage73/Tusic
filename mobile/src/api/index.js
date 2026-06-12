import { YouTubeSearch } from './search';
import { Platform } from 'react-native';

/**
 * DYNAMIC API DISCOVERY
 * Automatically detects the 'System IP' without hardcoding.
 */
const getBaseUrl = () => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const host = window.location.hostname;
      const protocol = window.location.protocol;
      
      if (host === 'localhost' || host.startsWith('192.168.') || host.startsWith('172.') || host.startsWith('10.')) {
        return `${protocol}//${host}:8000`;
      }
    }
  } catch (e) {
    console.warn("[Tusic] Could not auto-detect Web host", e);
  }
  
  if (__DEV__) {
    return 'http://172.20.10.8:8000';
  }

  return 'https://tusic-backend.onrender.com';
};

export const API_BASE_URL = getBaseUrl();

const apiFetch = async (endpoint) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[API] System Route: ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const data = await response.json();
    return { data };
  } catch (error) {
    // If the local IP has changed, fallback to Render automatically
    if (!API_BASE_URL.includes('onrender.com')) {
      const backupUrl = `https://tusic-backend.onrender.com${endpoint}`;
      console.log(`[API] System IP changed or unreachable, falling back to Render: ${backupUrl}`);
      const response = await fetch(backupUrl);
      const data = await response.json();
      return { data };
    }
    throw error;
  }
};

export const TusicAPI = {
  search: async (query) => {
    // APK/Device: Always try to use the 'Real Device' IP first
    if (Platform.OS !== 'web') {
      const local = await YouTubeSearch.search(query);
      if (local && local.length > 0) return local;
    }
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

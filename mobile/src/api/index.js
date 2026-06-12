import { YouTubeSearch } from './search';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * ULTRA-SMART API DISCOVERY
 * Dynamically detects your system IP even if it changes.
 */
const getBaseUrl = () => {
  // 1. Web Auto-Detect
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && !host.includes('onrender.com')) {
      return `${window.location.protocol}//${host}:8000`;
    }
    if (host === 'localhost') return 'http://localhost:8000';
  }
  
  // 2. iOS/Android Dynamic WiFi Discovery
  // This extracts the IP of your PC directly from the Expo connection.
  try {
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      console.log(`[Tusic] Auto-detected System IP: ${ip}`);
      return `http://${ip}:8000`;
    }
  } catch (e) {
    console.warn("[Tusic] Dynamic discovery failed", e);
  }

  // 3. Known Manual Fallback
  if (__DEV__) return 'http://172.20.10.8:8000'; 

  // 4. Global Production Fallback
  return 'https://tusic-backend.onrender.com';
};

/**
 * PUBLIC TUNNEL OVERRIDE
 * If you have a localtunnel/ngrok URL, paste it here to 
 * work without being on the same WiFi.
 */
const PUBLIC_TUNNEL = 'https://ripe-items-battle.loca.lt'; 

export const API_BASE_URL = PUBLIC_TUNNEL || getBaseUrl();

const apiFetch = async (endpoint) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const data = await response.json();
    return { data };
  } catch (error) {
    // If the auto-detected IP fails, try the common local patterns
    if (!API_BASE_URL.includes('onrender.com')) {
      console.log("[API] Local link weak, attempting Render failover...");
      try {
        const backupUrl = `https://tusic-backend.onrender.com${endpoint}`;
        const response = await fetch(backupUrl);
        const data = await response.json();
        return { data };
      } catch (e) {
        throw new Error("NETWORK_ISOLATION: Ensure phone and PC are on same WiFi.");
      }
    }
    throw error;
  }
};

export const TusicAPI = {
  search: async (query) => {
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

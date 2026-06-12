import { Platform } from 'react-native';
import ytdl from 'react-native-ytdl';
import { API_BASE_URL } from './index';

/**
 * YouTube InnerTube Resolver (Production Hardened Edition)
 * Tier 0: react-native-ytdl (Native Only - High Success)
 * Tier 1: Direct InnerTube Handshake (Fastest)
 * Tier 2: Public Proxy Nodes (Hardened)
 * Tier 3: Emergency Extraction Override (Cipher Bypass)
 */
export const YouTubeResolver = {
  resolve: async (videoId) => {
    if (!videoId) {
      console.error("[Resolver] Aborting: Missing videoId argument");
      return null;
    }
    
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`[Resolver] Initializing multi-tier resolution for: ${videoId}`);

    // SMART WEB RESOLUTION
    // Use the local system backend (System IP) for web requests to bypass CORS 
    // while still ensuring the request comes from your residential connection.
    if (Platform.OS === 'web') {
      const isLocal = API_BASE_URL.includes('localhost') || 
                      API_BASE_URL.includes('127.0.0.1') || 
                      API_BASE_URL.includes('172.') || 
                      API_BASE_URL.includes('192.168.') || 
                      API_BASE_URL.includes('10.');
      
      if (isLocal) {
        console.log(`[Resolver] Web detected: Routing via local system backend (${API_BASE_URL}).`);
        return null; // Triggers automatic fallback to backend proxy in PlayerContext
      }
      console.log("[Resolver] Web detected: Local backend unreachable, using Render.");
      return null;
    }

    // --- TIER 0: react-native-ytdl (Native-first extraction) ---
    if (Platform.OS !== 'web') {
      try {
        console.log("[Resolver] Tier 0: Attempting react-native-ytdl...");
        const formats = await ytdl(youtubeUrl, { quality: 'highestaudio' });
        if (formats && formats.length > 0) {
          const best = formats.find(f => f.url);
          if (best) {
            console.log("[Resolver] Tier 0 SUCCESS");
            return best.url;
          }
        }
      } catch (err) {
        console.warn(`[Resolver] Tier 0 FAILED: ${err.message}`);
      }
    }

    // --- TIER 1: DIRECT INNERTUBE (Android Client Spoof) ---
    try {
      console.log("[Resolver] Tier 1: Attempting Direct Handshake...");
      const response = await fetch('https://www.youtube.com/youtubei/v1/player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'com.google.android.youtube/17.36.4 (Linux; U; Android 12; GB) CRL/S-911'
        },
        body: JSON.stringify({
          context: {
            client: { clientName: 'ANDROID', clientVersion: '17.36.4', androidSdkVersion: 31, hl: 'en', gl: 'US' }
          },
          videoId: videoId,
          playbackContext: { contentPlaybackContext: { signatureTimestamp: 19800 } }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const streamingData = data?.streamingData;
        const formats = [
          ...(streamingData?.adaptiveFormats || []),
          ...(streamingData?.formats || [])
        ];

        // Ensure we isolate formats that provide direct playback URLs
        const audioOnly = formats.filter(f => f?.mimeType?.includes('audio') && f?.url);
        if (audioOnly.length > 0) {
          const best = audioOnly.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
          if (best?.url) {
            console.log("[Resolver] Tier 1 SUCCESS");
            return best.url;
          }
        }
      }
    } catch (err) {
      console.warn(`[Resolver] Tier 1 FAILED: ${err.message}`);
    }

    // --- TIER 2: HARDENED PUBLIC PROXIES (Invidious) ---
    const instances = [
      "https://invidious.privacydev.net",
      "https://iv.ggtyler.dev",
      "https://inv.zzls.xyz",
      "https://invidious.no-logs.com"
    ];

    for (const instance of instances) {
      try {
        console.log(`[Resolver] Tier 2: Querying Node ${instance}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s fast-fail window

        const response = await fetch(`${instance}/api/v1/videos/${videoId}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.adaptiveFormats)) {
            const best = data.adaptiveFormats
              .filter(f => f && typeof f.type === 'string' && f.type.includes('audio'))
              .sort((a, b) => (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0))[0];

            if (best?.url) {
              console.log(`[Resolver] Tier 2 SUCCESS via ${instance}`);
              return best.url;
            }
          }
        }
      } catch (err) {
        console.warn(`[Resolver] Tier 2 Node ${instance} Exception: ${err.message}`);
        continue;
      }
    }

    // --- TIER 3: EMERGENCY EXTRACTION OVERRIDE ---
    const emergencyEndpoints = [
      `https://api.v03.purple-api.workers.dev/api/stream?id=${videoId}`,
      `https://cobalt-api.mha.fi/api/json`
    ];

    for (const endpoint of emergencyEndpoints) {
      try {
        console.log(`[Resolver] Tier 3: Attempting Emergency Override...`);
        let res;
        
        if (endpoint.includes('cobalt')) {
          res = await fetch(endpoint, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              'Accept': 'application/json' 
            },
            body: JSON.stringify({ 
              url: `https://www.youtube.com/watch?v=${videoId}`, // ✅ Corrected string interpolation
              downloadMode: 'audio',
              audioFormat: 'mp3'
            })
          });
        } else {
          res = await fetch(endpoint);
        }

        if (res.ok) {
          const data = await res.json();
          const streamUrl = data?.url || data?.streamingData?.url;
          if (streamUrl) {
            console.log("[Resolver] Tier 3 EMERGENCY SUCCESS");
            return streamUrl;
          }
        }
      } catch (e) {
        console.warn(`[Resolver] Tier 3 Endpoint Failed: ${e.message}`);
      }
    }

    console.error("[Resolver] CRITICAL: ALL TIERS EXHAUSTED.");
    return null;
  }
};

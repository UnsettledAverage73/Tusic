import axios from 'axios';

/**
 * YouTube InnerTube Resolver (Production Hardened Edition)
 * Moves the fetching logic to the device to use residential IPs.
 * Includes AbortController for real fetch timeouts in React Native.
 */
export const YouTubeResolver = {
  resolve: async (videoId) => {
    console.log(`[Resolver] Starting production-grade resolution for: ${videoId}`);

    // 1. Try Direct InnerTube (Android Client)
    try {
      console.log("[Resolver] Tier 1: Direct InnerTube Handshake...");
      const response = await fetch('https://www.youtube.com/youtubei/v1/player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'com.google.android.youtube/17.36.4 (Linux; U; Android 12; GB) CRL/S-911'
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'ANDROID',
              clientVersion: '17.36.4',
              androidSdkVersion: 31,
              hl: 'en',
              gl: 'US'
            }
          },
          videoId: videoId,
          playbackContext: {
            contentPlaybackContext: {
              signatureTimestamp: 19800 
            }
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const streamingData = data?.streamingData;
        const formats = [
          ...(streamingData?.adaptiveFormats || []),
          ...(streamingData?.formats || [])
        ];

        // Find a format that has a direct URL (not a cipher)
        const bestAudio = formats
          .filter(f => f.mimeType && f.mimeType.includes('audio') && f.url)
          .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

        if (bestAudio && bestAudio.url) {
          console.log("[Resolver] Tier 1 SUCCESS: Direct");
          return bestAudio.url;
        }
      }
    } catch (err) {
      console.warn(`[Resolver] Tier 1 FAILED: ${err.message}`);
    }

    // 2. Try Invidious API (With AbortController for real timeouts)
    const instances = [
      "https://invidious.privacydev.net",
      "https://iv.ggtyler.dev",
      "https://inv.zzls.xyz"
    ];

    for (const instance of instances) {
      try {
        console.log(`[Resolver] Tier 2: Querying Node ${instance}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

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
            
            if (best && best.url) {
              console.log(`[Resolver] Tier 2 SUCCESS: ${instance}`);
              return best.url;
            }
          }
        }
      } catch (err) {
        console.warn(`[Resolver] Tier 2 Node ${instance} failed: ${err.message}`);
        continue;
      }
    }

    // 3. Tier 3: Emergency Cobalt Extraction
    try {
      console.log("[Resolver] Tier 3: Attempting Emergency Extraction...");
      const cobaltRes = await fetch('https://cobalt-api.mha.fi/api/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          downloadMode: 'audio',
          audioFormat: 'mp3'
        })
      });

      if (cobaltRes.ok) {
        const data = await cobaltRes.json();
        if (data?.url) {
          console.log("[Resolver] Tier 3 EMERGENCY SUCCESS");
          return data.url;
        }
      }
    } catch (err) {
      console.error("[Resolver] Tier 3 FAILED:", err.message);
    }

    console.error("[Resolver] CRITICAL: All resolution strategies exhausted.");
    return null;
  }
};

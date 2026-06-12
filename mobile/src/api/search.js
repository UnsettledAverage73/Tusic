import { Platform } from 'react-native';

/**
 * YouTube InnerTube Search Utility
 * Fetches search results directly from YouTube Music internal API.
 */
export const YouTubeSearch = {
  search: async (query) => {
    console.log(`[Search] Local decentralized search started for: ${query}`);
    
    if (Platform.OS === 'web') {
      console.warn("[Search] Direct hits to YouTube on Web will likely fail due to CORS. This is a browser security restriction. Use the APK for direct phone-to-YouTube hits.");
    }
    try {
      const url = 'https://www.youtube.com/youtubei/v1/search';
      const payload = {
        context: {
          client: {
            clientName: 'ANDROID_MUSIC',
            clientVersion: '6.02.53',
            hl: 'en',
            gl: 'US'
          }
        },
        query: query,
        params: 'EgWKAQIIAWoFEAMQBBA=' // Filter for songs only in YT Music
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'com.google.android.youtube.music/6.02.53 (Linux; U; Android 12; GB) CRL/S-911'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP_${response.status}`);

      const data = await response.json();
      
      // Navigate deep into the InnerTube response object to find tracks
      const results = [];
      const sections = data?.contents?.tabbedSearchRender?.contents?.[0]?.sectionListRenderer?.contents || [];
      
      for (const section of sections) {
        const items = section?.musicShelfRenderer?.contents || [];
        for (const item of items) {
          const track = item?.musicResponsiveListItemRenderer;
          if (!track) continue;

          const videoId = track.playlistItemData?.videoId;
          if (!videoId) continue;

          // Extract Title
          const title = track.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
          
          // Extract Artist & Duration
          const subtitleRuns = track.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
          const artist = subtitleRuns[0]?.text;
          const duration = subtitleRuns[subtitleRuns.length - 1]?.text;

          // Extract Thumbnail
          const thumbnails = track.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
          const thumbnail = thumbnails[thumbnails.length - 1]?.url;

          results.push({
            id: videoId,
            title: title || 'Unknown',
            artist: artist || 'Unknown',
            duration: duration || '0:00',
            thumbnail: thumbnail,
            type: 'song'
          });
        }
      }

      console.log(`[Search] Local search success: found ${results.length} items`);
      return results;
    } catch (err) {
      console.error(`[Search] Local search failed: ${err.message}`);
      return null;
    }
  }
};

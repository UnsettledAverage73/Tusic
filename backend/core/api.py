import requests
import re
from ytmusicapi import YTMusic

class TusicAPI:
    def __init__(self):
        self.ytmusic = YTMusic()

    def search_songs(self, query: str) -> list:
        try:
            results = self.ytmusic.search(query, filter="songs", limit=50)
            tracks = []
            seen_ids = set()
            for item in results:
                video_id = item.get('videoId')
                if not video_id or video_id in seen_ids:
                    continue
                seen_ids.add(video_id)
                
                artists = ", ".join([a['name'] for a in item.get('artists', [])])
                thumbnails = item.get('thumbnails', [])
                thumbnail = thumbnails[-1]['url'] if thumbnails else None
                
                tracks.append({
                    'id': video_id,
                    'title': item['title'],
                    'artist': artists,
                    'duration': item.get('duration', 'Unknown'),
                    'thumbnail': thumbnail,
                    'type': 'song'
                })
            return tracks
        except Exception:
            return []

    def search_podcasts(self, query: str) -> list:
        try:
            results = self.ytmusic.search(query, filter="podcasts", limit=20)
            podcasts = []
            for item in results:
                browse_id = item.get('browseId')
                if not browse_id: continue
                
                thumbnails = item.get('thumbnails', [])
                thumbnail = thumbnails[-1]['url'] if thumbnails else None
                
                podcasts.append({
                    'id': browse_id,
                    'title': item.get('title', 'Unknown Podcast'),
                    'publisher': item.get('publisher', 'Unknown'),
                    'thumbnail': thumbnail,
                    'type': 'podcast_show'
                })
            return podcasts
        except Exception:
            return []

    def get_home_content(self) -> dict:
        """Fetches charts and mood categories for the Discover tab."""
        try:
            charts = self.ytmusic.get_charts(country="US")
            moods = self.ytmusic.get_mood_categories()
            
            # Simplify charts for the mobile app
            top_songs = []
            for track in charts.get('songs', {}).get('items', [])[:10]:
                thumbnails = track.get('thumbnails', [])
                top_songs.append({
                    'id': track['videoId'],
                    'title': track['title'],
                    'artist': ", ".join([a['name'] for a in track.get('artists', [])]),
                    'thumbnail': thumbnails[-1]['url'] if thumbnails else None
                })

            return {
                "top_songs": top_songs,
                "mood_categories": moods
            }
        except Exception as e:
            print(f"Home content error: {e}")
            return {"top_songs": [], "mood_categories": {}}

    def get_radio_songs(self, video_id: str) -> list:
        try:
            # The RDAMVM prefix forces YouTube to generate an endless algorithmic radio mix
            playlist = self.ytmusic.get_watch_playlist(videoId=video_id, playlistId=f"RDAMVM{video_id}")
            tracks = []
            seen_ids = set()
            
            for item in playlist.get('tracks', []):
                current_id = item.get('videoId')
                
                if not current_id or current_id == video_id or current_id in seen_ids:
                    continue 
                
                seen_ids.add(current_id)
                artists_list = item.get('artists', [])
                artists = ", ".join([a['name'] for a in artists_list if 'name' in a]) if artists_list else "Unknown Artist"
                
                thumbnails = item.get('thumbnails', [])
                thumbnail = thumbnails[-1]['url'] if thumbnails else None
                
                tracks.append({
                    'id': current_id,
                    'title': item.get('title', 'Unknown Title'),
                    'artist': artists,
                    'duration': item.get('length', 'Unknown'),
                    'thumbnail': thumbnail
                })
            return tracks
        except Exception as e:
            # Pass the error string back so the UI can display it
            return [{"error": str(e)}]

    def parse_lrc(self, lrc_text: str) -> list:
        """Parses LRC format into a list of {start_time, text} objects."""
        if not lrc_text:
            return None
            
        lines = []
        # Pattern: [mm:ss.xx] text
        pattern = re.compile(r'\[(\d+):(\d+\.\d+)\](.*)')
        
        for line in lrc_text.split('\n'):
            match = pattern.match(line)
            if match:
                minutes = int(match.group(1))
                seconds = float(match.group(2))
                text = match.group(3).strip()
                
                # Convert to milliseconds
                start_time = int((minutes * 60 + seconds) * 1000)
                lines.append({"start_time": start_time, "text": text})
        
        return lines if lines else None

    def get_synced_lyrics(self, title: str, artist: str) -> dict:
        """Fetches synced lyrics from LRCLIB.net."""
        try:
            # Search for the track on LRCLIB
            url = f"https://lrclib.net/api/search?track_name={title}&artist_name={artist}"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data:
                    # Take the first result that has synced lyrics
                    for item in data:
                        if item.get('syncedLyrics'):
                            parsed = self.parse_lrc(item['syncedLyrics'])
                            if parsed:
                                return {"lines": parsed, "synced": True}
            return None
        except Exception as e:
            print(f"LRCLIB error: {e}")
            return None

    def get_lyrics_browse_id(self, video_id: str) -> tuple:
        """Returns browse_id, title, and artist for a video_id."""
        try:
            watch_playlist = self.ytmusic.get_watch_playlist(videoId=video_id)
            tracks = watch_playlist.get('tracks', [])
            title = "Unknown"
            artist = "Unknown"
            if tracks:
                title = tracks[0].get('title', 'Unknown')
                artists = tracks[0].get('artists', [])
                artist = artists[0].get('name', 'Unknown') if artists else 'Unknown'
                
            return watch_playlist.get("lyrics"), title, artist
        except Exception:
            return None, "Unknown", "Unknown"

    def get_lyrics(self, browse_id: str) -> dict:
        if not browse_id:
            return None
        try:
            return self.ytmusic.get_lyrics(browse_id)
        except Exception:
            return None

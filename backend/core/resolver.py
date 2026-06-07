import yt_dlp
import requests

class StreamResolver:
    def __init__(self):
        self.ydl_opts = {
            'format': 'bestaudio/best',
            'quiet': True,
            'no_warnings': True,
            'nocheckcertificate': True,
        }
        # A curated list of healthy instances that are less likely to return 502/522
        self.invidious_instances = [
            "https://iv.ggtyler.dev",
            "https://invidious.flokinet.to",
            "https://invidious.io.lol",
            "https://inv.zzls.xyz"
        ]
        self.piped_instances = [
            "https://pipedapi.kavin.rocks",
            "https://api.piped.vicr.me",
            "https://piped-api.lunar.icu"
        ]

    def get_stream_url(self, video_id: str) -> str:
        """Resolves the stream URL using multiple public API fallbacks."""
        
        # 1. Try Invidious API (Very stable for stream URLs)
        for instance in self.invidious_instances:
            try:
                print(f"Attempting Invidious resolution for {video_id} via {instance}")
                # We use the /api/v1/videos endpoint which is standard for Invidious
                response = requests.get(f"{instance}/api/v1/videos/{video_id}", timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    # We prefer 'adaptiveFormats' (M4A/WebM) as they are cleaner for audio
                    formats = data.get('adaptiveFormats', [])
                    audio_only = [f for f in formats if 'audio' in f.get('type', '')]
                    if audio_only:
                        # Return the highest quality audio stream
                        best_audio = sorted(audio_only, key=lambda x: int(x.get('bitrate', 0)), reverse=True)[0]
                        return best_audio['url']
                    
                    # Fallback to standard formats
                    formats = data.get('formatStreams', [])
                    if formats:
                        return formats[0]['url']
            except Exception as e:
                print(f"Invidious failed for {instance}: {e}")
                continue

        # 2. Try Piped API (Backup)
        for instance in self.piped_instances:
            try:
                print(f"Attempting Piped resolution for {video_id} via {instance}")
                response = requests.get(f"{instance}/streams/{video_id}", timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    audio_streams = data.get('audioStreams', [])
                    if audio_streams:
                        best_audio = sorted(audio_streams, key=lambda x: x.get('bitrate', 0), reverse=True)[0]
                        return best_audio['url']
            except Exception as e:
                print(f"Piped failed for {instance}: {e}")
                continue

        # 3. Last Resort: yt-dlp (Usually fails on Render but kept for local dev)
        try:
            print(f"Falling back to yt-dlp for {video_id}")
            url = f"https://www.youtube.com/watch?v={video_id}"
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                return info['url']
        except Exception as e:
            print(f"yt-dlp failed: {e}")
            raise Exception("SYSTEM_ALL_RESOLVERS_EXHAUSTED: YouTube is strictly blocking all resolution attempts from this node.")

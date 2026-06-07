import yt_dlp
import requests

class StreamResolver:
    def __init__(self):
        self.ydl_opts = {
            'format': 'bestaudio/best',
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'nocheckcertificate': True,
            'extractor_args': {
                'youtube': {
                    'player_client': ['ios', 'android'],
                }
            }
        }
        self.piped_instances = [
            "https://pipedapi.kavin.rocks",
            "https://api.piped.vicr.me",
            "https://piped-api.lunar.icu"
        ]

    def get_stream_url(self, video_id: str) -> str:
        """Resolves the stream URL using Piped API first, then falls back to yt-dlp."""
        
        # Try Piped API instances first (much faster and less likely to be blocked)
        for instance in self.piped_instances:
            try:
                print(f"Attempting to resolve {video_id} via {instance}")
                response = requests.get(f"{instance}/streams/{video_id}", timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    audio_streams = data.get('audioStreams', [])
                    if audio_streams:
                        # Get the highest quality audio stream
                        best_audio = sorted(audio_streams, key=lambda x: x.get('bitrate', 0), reverse=True)[0]
                        return best_audio['url']
            except Exception as e:
                print(f"Piped resolution failed for {instance}: {e}")
                continue

        # Fallback to direct yt-dlp resolution
        print(f"Falling back to yt-dlp for {video_id}")
        url = f"https://www.youtube.com/watch?v={video_id}"
        with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return info['url']

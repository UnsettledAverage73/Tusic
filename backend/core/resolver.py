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
            "https://piped-api.lunar.icu",
            "https://api-piped.mha.fi"
        ]

    def get_stream_url(self, video_id: str) -> str:
        """Resolves the stream URL using Cobalt/Piped API first, then falls back to yt-dlp."""
        
        # 1. Try Cobalt API (Fastest and very reliable for direct links)
        try:
            print(f"Attempting Cobalt resolution for {video_id}")
            cobalt_url = "https://api.cobalt.tools/api/json"
            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
            payload = {
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "downloadMode": "audio",
                "audioFormat": "mp3"
            }
            response = requests.post(cobalt_url, json=payload, headers=headers, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('url'):
                    return data['url']
        except Exception as e:
            print(f"Cobalt resolution failed: {e}")

        # 2. Try Piped API instances with a short 3s timeout to prevent hanging
        for instance in self.piped_instances:
            try:
                print(f"Attempting Piped resolution for {video_id} via {instance}")
                response = requests.get(f"{instance}/streams/{video_id}", timeout=3)
                if response.status_code == 200:
                    data = response.json()
                    audio_streams = data.get('audioStreams', [])
                    if audio_streams:
                        best_audio = sorted(audio_streams, key=lambda x: x.get('bitrate', 0), reverse=True)[0]
                        return best_audio['url']
            except Exception as e:
                print(f"Piped resolution failed for {instance}: {e}")
                continue

        # 3. Fallback to direct yt-dlp resolution (usually fails on Render but good for local)
        print(f"Falling back to yt-dlp for {video_id}")
        url = f"https://www.youtube.com/watch?v={video_id}"
        with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return info['url']

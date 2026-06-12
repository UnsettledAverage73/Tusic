import requests
import time

class StreamResolver:
    def __init__(self):
        # Persistent session to reuse TCP connections and reduce memory overhead
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        })
        
        # Priority-ordered healthy instances
        self.invidious_instances = [
            "https://iv.ggtyler.dev",
            "https://invidious.flokinet.to",
            "https://inv.zzls.xyz",
            "https://invidious.io.lol",
            "https://invidious.namazso.eu",
            "https://inv.n8pjl.ca",
            "https://invidious.snopyta.org"
        ]
        self.piped_instances = [
            "https://api.piped.vicr.me",
            "https://piped-api.lunar.icu",
            "https://pipedapi.kavin.rocks"
        ]

    def get_stream_url(self, video_id: str) -> str:
        """Resolves stream URL with aggressive RAM management and fast-fail timeouts."""
        
        # 1. Try Invidious (Lightweight JSON API)
        for instance in self.invidious_instances:
            try:
                # Fast 2.5s timeout per instance to stay under mobile's 20s total limit
                response = self.session.get(
                    f"{instance}/api/v1/videos/{video_id}", 
                    timeout=2.5
                )
                if response.status_code == 200:
                    data = response.json()
                    formats = data.get('adaptiveFormats', [])
                    audio_only = [f for f in formats if 'audio' in f.get('type', '')]
                    if audio_only:
                        best = sorted(audio_only, key=lambda x: int(x.get('bitrate', 0)), reverse=True)[0]
                        return best['url']
                    
                    # Backup to formatStreams
                    streams = data.get('formatStreams', [])
                    if streams: return streams[0]['url']
            except Exception:
                continue

        # 2. Try Piped (Backup)
        for instance in self.piped_instances:
            try:
                response = self.session.get(
                    f"{instance}/streams/{video_id}", 
                    timeout=3.0
                )
                if response.status_code == 200:
                    data = response.json()
                    audio = data.get('audioStreams', [])
                    if audio:
                        best = sorted(audio, key=lambda x: x.get('bitrate', 0), reverse=True)[0]
                        return best['url']
            except Exception:
                continue

        # 3. Last Resort: yt-dlp (Only load if absolutely necessary)
        try:
            print(f"[Resolver] Fallback to heavy yt-dlp for {video_id}")
            import yt_dlp 
            
            # Use multiple sets of options for better compatibility
            attempts = [
                {
                    'format': 'bestaudio/best',
                    'quiet': True,
                    'no_warnings': True,
                    'nocheckcertificate': True,
                },
                {
                    'format': 'ba',
                    'quiet': True,
                    'extract_flat': True,
                    'force_generic_extractor': True,
                }
            ]

            for opts in attempts:
                try:
                    with yt_dlp.YoutubeDL(opts) as ydl:
                        info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
                        if 'url' in info:
                            return info['url']
                except Exception as e:
                    print(f"[Resolver] yt-dlp attempt failed: {e}")
                    continue

        except Exception as e:
            print(f"[Resolver] Critical Failure: {e}")
            raise Exception("ALL_RESOLVERS_EXHAUSTED: Media block persistent across all global nodes.")

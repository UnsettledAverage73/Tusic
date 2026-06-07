from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from core.api import TusicAPI
from core.resolver import StreamResolver

app = FastAPI(title="Tusic API")

# Allow mobile app to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tusic_api = TusicAPI()
resolver = StreamResolver()

@app.get("/")
def health_check():
    return {"status": "alive", "service": "Tusic API"}

@app.get("/search")
def search(q: str):
    try:
        results = tusic_api.search_songs(q)
        return {"results": results}
    except Exception as e:
        print(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/radio")
def radio(id: str):
    results = tusic_api.get_radio_songs(id)
    return {"results": results}

@app.get("/resolve")
def resolve(id: str):
    try:
        url = resolver.get_stream_url(id)
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/lyrics")
def lyrics(id: str):
    browse_id = tusic_api.get_lyrics_browse_id(id)
    if browse_id:
        lyrics_data = tusic_api.get_lyrics(browse_id)
        return {"lyrics": lyrics_data}
    return {"lyrics": None}

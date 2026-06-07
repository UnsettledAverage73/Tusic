from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
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

# Active connections storage: {room_id: [websocket1, websocket2]}
rooms: Dict[str, List[WebSocket]] = {}

@app.websocket("/ws/room/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await websocket.accept()
    if room_id not in rooms:
        rooms[room_id] = []
    rooms[room_id].append(websocket)
    
    try:
        while True:
            # Wait for any message from a client in the room
            data = await websocket.receive_json()
            
            # Broadcast the message to everyone else in the same room
            for connection in rooms[room_id]:
                if connection != websocket:
                    await connection.send_json(data)
    except WebSocketDisconnect:
        rooms[room_id].remove(websocket)
        if not rooms[room_id]:
            del rooms[room_id]

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

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

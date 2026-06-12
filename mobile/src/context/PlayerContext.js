import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { TusicAPI, API_BASE_URL } from '../api';
import { DownloadManager } from '../api/download';
import { YouTubeResolver } from '../api/resolver';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [sound, setSound] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [moodSeeds, setMoodSeeds] = useState([]);
  const [playbackError, setPlaybackError] = useState(null);
  
  // Collaborative Room State
  const [roomId, setRoomId] = useState(null);
  const [roomUsers, setRoomUsers] = useState([]);
  const ws = useRef(null);
  
  const positionUpdateTimer = useRef(null);

  useEffect(() => {
    DownloadManager.init();
    loadLibrary();
    return () => {
      if (sound) sound.unloadAsync();
      if (positionUpdateTimer.current) clearInterval(positionUpdateTimer.current);
      if (ws.current) ws.current.close();
    };
  }, []);

  // Real Web Socket Sync Logic
  const joinRoom = (id) => {
    if (ws.current) ws.current.close();
    
    // Convert HTTP URL to WS URL dynamically
    const protocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const host = API_BASE_URL.replace(/^https?:\/\//, '');
    const wsUrl = `${protocol}://${host}/ws/room/${id}`;
    
    console.log(`[Socket] Connecting to Room: ${id} at ${wsUrl}`);
    
    ws.current = new WebSocket(wsUrl);
    setRoomId(id);
    
    ws.current.onopen = () => {
      console.log("[Socket] Connected to room server");
    };

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log("[Socket] Received event:", data.type);
      
      if (data.type === 'TRACK_CHANGE') {
        if (data.track.id !== currentTrack?.id) {
           playTrack(data.track, [], true); // true to skip emitting back
        }
      } else if (data.type === 'PLAY') {
        if (sound && !isPlaying) sound.playAsync();
      } else if (data.type === 'PAUSE') {
        if (sound && isPlaying) sound.pauseAsync();
      } else if (data.type === 'SEEK') {
        if (sound) sound.setPositionAsync(data.position);
      }
    };

    ws.current.onerror = (err) => {
      console.error("[Socket] Error:", err.message);
    };

    ws.current.onclose = () => {
      console.log("[Socket] Connection closed");
      setRoomId(null);
    };
  };

  const leaveRoom = () => {
    if (ws.current) ws.current.close();
    setRoomId(null);
    setRoomUsers([]);
  };

  const shareToRoom = () => {
    if (currentTrack && roomId) {
      console.log("[Socket] Sharing track to room:", currentTrack.title);
      emitPlaybackEvent('TRACK_CHANGE', { track: currentTrack });
    }
  };

  const emitPlaybackEvent = (type, data) => {
    if (roomId && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type,
        roomId,
        ...data,
        timestamp: Date.now()
      }));
    }
  };

  // Periodic persistence of position
  useEffect(() => {
    if (isPlaying) {
      positionUpdateTimer.current = setInterval(() => {
        if (currentTrack && position > 0) {
          AsyncStorage.setItem('last_position', position.toString());
        }
      }, 5000);
    } else {
      if (positionUpdateTimer.current) clearInterval(positionUpdateTimer.current);
    }
    return () => {
      if (positionUpdateTimer.current) clearInterval(positionUpdateTimer.current);
    };
  }, [isPlaying, currentTrack, position]);

  const loadLibrary = async () => {
    try {
      const [
        savedHistory, 
        savedPlaylist, 
        savedDownloads,
        lastTrack, 
        lastPos
      ] = await Promise.all([
        AsyncStorage.getItem('history'),
        AsyncStorage.getItem('playlist'),
        AsyncStorage.getItem('downloads'),
        AsyncStorage.getItem('last_track'),
        AsyncStorage.getItem('last_position')
      ]);

      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedPlaylist) setPlaylist(JSON.parse(savedPlaylist));
      if (savedDownloads) setDownloads(Object.values(JSON.parse(savedDownloads)));
      if (lastTrack) setCurrentTrack(JSON.parse(lastTrack));
      if (lastPos) setPosition(parseInt(lastPos, 10));
      
      generateMoodSeeds();
    } catch (e) {
      console.error("Failed to load library", e);
    }
  };

  const generateMoodSeeds = () => {
    const hour = new Date().getHours();
    let mood = "lofi"; 
    if (hour >= 5 && hour < 12) mood = "energetic"; 
    if (hour >= 12 && hour < 17) mood = "focus"; 
    if (hour >= 17 && hour < 22) mood = "chill"; 
    
    setMoodSeeds([mood]);
  };

  const downloadTrack = async (track) => {
    try {
      await DownloadManager.downloadTrack(track);
      const updated = await DownloadManager.listDownloads();
      setDownloads(updated);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  const deleteDownload = async (trackId) => {
    await DownloadManager.deleteDownload(trackId);
    const updated = await DownloadManager.listDownloads();
    setDownloads(updated);
  };

  const saveToHistory = async (track) => {
    const updatedHistory = [track, ...history.filter(t => t.id !== track.id)].slice(0, 50);
    setHistory(updatedHistory);
    await AsyncStorage.setItem('history', JSON.stringify(updatedHistory));
  };

  const togglePlaylist = async (track) => {
    let updatedPlaylist;
    if (playlist.find(t => t.id === track.id)) {
      updatedPlaylist = playlist.filter(t => t.id !== track.id);
    } else {
      updatedPlaylist = [track, ...playlist];
    }
    setPlaylist(updatedPlaylist);
    await AsyncStorage.setItem('playlist', JSON.stringify(updatedPlaylist));
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem('history');
  };

  const playTrack = async (track, newQueue = [], isRemote = false) => {
    try {
      setPlaybackError(null);
      console.log(`[Player] Attempting to play track: ${track.title} (${track.id})`);
      setIsLoading(true);
      
      if (sound) {
        console.log("[Player] Unloading previous sound");
        await sound.unloadAsync();
        setSound(null);
      }

      // Check for local download first
      console.log(`[Player] Checking local storage for: ${track.id}`);
      let streamUrl = await DownloadManager.getDownloadedUri(track.id);
      
      if (!streamUrl) {
        // Try Client-Side Resolution (Bypasses Data Center Blocks)
        console.log(`[Player] Resolving stream locally via InnerTube client for: ${track.id}`);
        streamUrl = await YouTubeResolver.resolve(track.id);
      }

      if (!streamUrl) {
        // Last Resort Fallback to Backend Proxy
        console.log(`[Player] Falling back to backend proxy for: ${track.id}`);
        streamUrl = await TusicAPI.resolve(track.id);
      }

      if (!streamUrl) {
        throw new Error("MEDIA_RESOLUTION_FAILED: All global resolution nodes (Local, Proxy, Backend) are currently blocked or offline.");
      }

      console.log("[Player] Creating sound instance");
      
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { 
          shouldPlay: true,
          progressUpdateIntervalMillis: 500,
        },
        onPlaybackStatusUpdate
      );

      if (status.error) {
        throw new Error(`Media engine error: ${status.error}`);
      }

      setSound(newSound);
      setCurrentTrack(track);
      setIsPlaying(true);
      setIsLoading(false);
      console.log("[Player] Success");
      
      saveToHistory(track);
      AsyncStorage.setItem('last_track', JSON.stringify(track));

      if (!isRemote) {
        emitPlaybackEvent('TRACK_CHANGE', { track });
      }

      if (newQueue.length > 0) {
        setQueue(newQueue);
      } else {
        const radioTracks = await TusicAPI.getRadio(track.id);
        setQueue(radioTracks);
      }
    } catch (e) {
      console.error("[Player] CRITICAL Playback Failure:", e.message);
      
      // CRITICAL: Clean up state to break the infinite loading loop
      setIsLoading(false);
      setIsPlaying(false);
      
      if (sound) {
        try { await sound.unloadAsync(); } catch (err) {}
        setSound(null);
      }

      setPlaybackError(`SYSTEM_BLOCK: ${e.message}. All available resolution nodes are currently blocked or offline.`);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        playNext();
      }
    }
  };

  const togglePlayPause = async () => {
    try {
      if (!sound) {
        console.log("[Player] Toggle: No sound object, attempting to play currentTrack");
        if (currentTrack) playTrack(currentTrack);
        return;
      }

      const status = await sound.getStatusAsync();
      if (!status.isLoaded) {
        console.warn("[Player] Toggle: Sound not loaded");
        return;
      }

      if (isPlaying) {
        console.log("[Player] Toggle: Pausing...");
        await sound.pauseAsync();
        setIsPlaying(false); // Immediate UI update
        emitPlaybackEvent('PAUSE', { position });
      } else {
        console.log("[Player] Toggle: Playing...");
        await sound.playAsync();
        setIsPlaying(true); // Immediate UI update
        emitPlaybackEvent('PLAY', { position });
      }
    } catch (e) {
      console.error("[Player] Toggle Error:", e);
    }
  };

  const playNext = () => {
    if (queue.length > 0) {
      const nextTrack = queue[0];
      const remainingQueue = queue.slice(1);
      playTrack(nextTrack, remainingQueue);
    }
  };

  const seek = async (millis) => {
    if (sound) {
      await sound.setPositionAsync(millis);
      emitPlaybackEvent('SEEK', { position: millis });
    }
  };

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      isLoading,
      position,
      duration,
      queue,
      history,
      playlist,
      downloads,
      moodSeeds,
      roomId,
      roomUsers,
      playTrack,
      downloadTrack,
      deleteDownload,
      togglePlayPause,
      playNext,
      seek,
      togglePlaylist,
      clearHistory,
      joinRoom,
      leaveRoom,
      shareToRoom,
      playbackError
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);

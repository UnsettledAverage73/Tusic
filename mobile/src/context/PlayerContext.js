import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { TusicAPI } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ytdl from 'react-native-ytdl';

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
  const [moodSeeds, setMoodSeeds] = useState([]);
  
  // Collaborative Room State
  const [roomId, setRoomId] = useState(null);
  const [roomUsers, setRoomUsers] = useState([]);
  const ws = useRef(null);
  
  const positionUpdateTimer = useRef(null);

  useEffect(() => {
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
    
    const wsUrl = `wss://tusic-backend.onrender.com/ws/room/${id}`;
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
        lastTrack, 
        lastPos
      ] = await Promise.all([
        AsyncStorage.getItem('history'),
        AsyncStorage.getItem('playlist'),
        AsyncStorage.getItem('last_track'),
        AsyncStorage.getItem('last_position')
      ]);

      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedPlaylist) setPlaylist(JSON.parse(savedPlaylist));
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

  const [playbackError, setPlaybackError] = useState(null);

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

      console.log(`[Player] Resolving stream locally for: ${track.id}`);
      let streamUrl = null;
      
      try {
        // Try local resolution
        const urls = await ytdl(track.id, { quality: 'highestaudio' });
        if (urls && urls[0] && urls[0].url) {
          streamUrl = urls[0].url;
          console.log("[Player] Local resolution success");
        }
      } catch (ytdlError) {
        console.warn("[Player] Local resolution failed:", ytdlError.message);
      }

      // Fallback to backend if local failed or returned nothing
      if (!streamUrl) {
        console.log("[Player] Falling back to backend resolver...");
        streamUrl = await TusicAPI.resolve(track.id);
      }

      if (!streamUrl) {
        throw new Error("Could not obtain a valid stream URL from any source.");
      }

      console.log("[Player] Creating sound with URL:", streamUrl.substring(0, 50) + "...");
      
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { 
          shouldPlay: true,
          progressUpdateIntervalMillis: 500,
          positionMillis: 0
        },
        onPlaybackStatusUpdate
      );

      if (status.error) {
        throw new Error(`Expo AV status error: ${status.error}`);
      }

      setSound(newSound);
      setCurrentTrack(track);
      setIsPlaying(true);
      setIsLoading(false);
      console.log("[Player] Playback instance created and playing");
      
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
      console.error("[Player] CRITICAL Playback error:", e);
      setPlaybackError(e.message);
      setIsLoading(false);
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
    if (!sound) {
      if (currentTrack) playTrack(currentTrack);
      return;
    }
    if (isPlaying) {
      await sound.pauseAsync();
      emitPlaybackEvent('PAUSE', { position });
    } else {
      await sound.playAsync();
      emitPlaybackEvent('PLAY', { position });
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
      moodSeeds,
      roomId,
      roomUsers,
      playTrack,
      togglePlayPause,
      playNext,
      seek,
      togglePlaylist,
      joinRoom,
      leaveRoom,
      playbackError
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);

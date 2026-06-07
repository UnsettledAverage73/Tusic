import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, Dimensions, Share } from 'react-native';
import { Play, Pause, SkipForward, Music, Heart, Terminal, Download, Share2, CheckCircle, Maximize2, Users } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { TusicAPI } from '../api';
import { THEME } from '../styles/theme';

const { width } = Dimensions.get('window');

const PlayerScreen = () => {
  const { 
    currentTrack, isPlaying, isLoading, position, duration, 
    togglePlayPause, playNext, togglePlaylist, playlist,
    playbackError, downloadTrack, downloads, roomId, shareToRoom
  } = usePlayer();
  const [lyrics, setLyrics] = useState(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [fullLyrics, setFullLyrics] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (currentTrack) {
      fetchLyrics(currentTrack.id);
      setFullLyrics(false);
    }
  }, [currentTrack]);

  useEffect(() => {
    if (lyrics && lyrics.lines && scrollRef.current) {
      const activeIndex = lyrics.lines.findIndex((line, i) => 
        position >= line.start_time && (i === lyrics.lines.length - 1 || position < lyrics.lines[i+1].start_time)
      );
      if (activeIndex !== -1) {
        scrollRef.current.scrollTo({ y: activeIndex * 40 - 100, animated: true });
      }
    }
  }, [position, lyrics]);

  const fetchLyrics = async (id) => {
    setLoadingLyrics(true);
    try {
      const data = await TusicAPI.getLyrics(id);
      setLyrics(data);
    } catch (e) {
      console.error(e);
      setLyrics(null);
    } finally {
      setLoadingLyrics(false);
    }
  };

  const shareTrack = async () => {
    try {
      await Share.share({
        message: `Listening to ${currentTrack.title} by ${currentTrack.artist} on Tusic! https://www.youtube.com/watch?v=${currentTrack.id}`,
        url: `https://www.youtube.com/watch?v=${currentTrack.id}`,
        title: 'Share Track'
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const renderProgressBar = () => {
    const totalBars = 20;
    const progress = duration > 0 ? (position / duration) : 0;
    const filledBars = Math.floor(progress * totalBars);
    const emptyBars = totalBars - filledBars;
    
    return (
      <Text style={styles.progressBar}>
        <Text style={{color: THEME.colors.text.accent}}>[</Text>
        <Text style={{color: THEME.colors.text.accent}}>{'#'.repeat(filledBars)}</Text>
        <Text style={{color: THEME.colors.text.dim}}>{'-'.repeat(emptyBars)}</Text>
        <Text style={{color: THEME.colors.text.accent}}>]</Text>
      </Text>
    );
  };

  if (!currentTrack) {
    return (
      <View style={styles.emptyContainer}>
        {playbackError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorHeader}>!! PLAYBACK_FAILURE !!</Text>
            <Text style={styles.errorText}>{playbackError}</Text>
            <Text style={styles.errorSubText}>Resolution timeout or network error.</Text>
          </View>
        )}
        <Text style={styles.asciiArt}>{`
  _______ _    _  _____ _____ _____ 
 |__   __| |  | |/ ____|_   _/ ____|
    | |  | |  | | (___   | || |     
    | |  | |  | |\___ \  | || |     
    | |  | |__| |____) |_| || |____ 
    |_|   \____/|_____/|_____\_____|
        `}</Text>
        <Text style={styles.emptyText}>_ NO_MEDIA_DETECTED</Text>
      </View>
    );
  }

  const isSaved = playlist.some(t => t.id === currentTrack.id);
  const isDownloaded = downloads.some(d => d.id === currentTrack.id);

  return (
    <View style={styles.container}>
      {!fullLyrics && (
        <>
          <View style={styles.artworkContainer}>
            {currentTrack.thumbnail ? (
              <Image 
                source={{ uri: currentTrack.thumbnail }} 
                style={styles.albumArt}
                resizeMode="cover"
              />
            ) : (
              <Music size={100} color={THEME.colors.text.dim} />
            )}
          </View>

          <View style={styles.trackInfo}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>> {currentTrack.title}</Text>
              <Text style={styles.artist} numberOfLines={1}>$ artist: {currentTrack.artist}</Text>
            </View>
            <View style={styles.trackActions}>
              {roomId && (
                <TouchableOpacity onPress={shareToRoom} style={{marginRight: 15}}>
                  <Users size={22} color={THEME.colors.text.accent} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={shareTrack} style={{marginRight: 15}}>
                <Share2 size={22} color={THEME.colors.text.dim} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => downloadTrack(currentTrack)} style={{marginRight: 15}}>
                {isDownloaded ? (
                  <CheckCircle size={22} color={THEME.colors.text.accent} />
                ) : (
                  <Download size={22} color={THEME.colors.text.dim} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => togglePlaylist(currentTrack)}>
                <Heart size={24} color={isSaved ? THEME.colors.text.accent : THEME.colors.text.dim} fill={isSaved ? THEME.colors.text.accent : "none"} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {playbackError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorHeader}>!! PLAYBACK_FAILURE !!</Text>
          <Text style={styles.errorText}>{playbackError}</Text>
        </View>
      )}

      <View style={styles.controlsContainer}>
        {renderProgressBar()}
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity onPress={togglePlayPause} style={styles.tuiButton}>
            {isLoading ? (
              <ActivityIndicator color={THEME.colors.text.accent} size="small" />
            ) : isPlaying ? (
              <Pause size={24} color={THEME.colors.text.primary} />
            ) : (
              <Play size={24} color={THEME.colors.text.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={playNext} style={styles.tuiButton}>
             <SkipForward size={24} color={THEME.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.lyricsContainer, fullLyrics && styles.fullLyricsContainer]} 
        onPress={() => setFullLyrics(!fullLyrics)}
        activeOpacity={0.9}
      >
        <View style={styles.lyricsHeaderContainer}>
          <Text style={styles.lyricsHeader}>
            -- {fullLyrics ? 'EXIT_IMMERSIVE_MODE' : 'SYNCED_LYRICS_SYNC'} --
          </Text>
          {!fullLyrics && <Maximize2 size={12} color={THEME.colors.text.accent} />}
        </View>
        
        <ScrollView 
          ref={scrollRef}
          style={styles.lyricsScroll}
          contentContainerStyle={{ paddingBottom: 150 }}
          pointerEvents="none"
          scrollEnabled={fullLyrics}
        >
          {loadingLyrics ? (
            <ActivityIndicator color={THEME.colors.text.accent} />
          ) : lyrics ? (
            lyrics.lines ? (
              lyrics.lines.map((line, i) => {
                const isActive = position >= line.start_time && (i === lyrics.lines.length - 1 || position < lyrics.lines[i+1].start_time);
                return (
                  <Text key={i} style={[
                    styles.lyricLine,
                    isActive && styles.activeLyric,
                    fullLyrics && styles.fullLyricLine,
                    fullLyrics && isActive && styles.fullActiveLyric
                  ]}>
                    {isActive ? '> ' : '  '}{line.text}
                  </Text>
                );
              })
            ) : (
              <Text style={styles.plainLyrics}>{lyrics.lyrics || "No data."}</Text>
            )
          ) : (
            <Text style={styles.plainLyrics}>_NO_LYRICS_FOUND</Text>
          )}
        </ScrollView>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  asciiArt: {
    color: THEME.colors.text.accent,
    fontFamily: THEME.typography.mono,
    fontSize: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: THEME.colors.text.secondary,
    fontFamily: THEME.typography.mono,
    fontSize: THEME.typography.size.md,
    marginTop: 20,
  },
  artworkContainer: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: THEME.colors.surface,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  albumArt: {
    width: width - 80,
    height: width - 80,
    backgroundColor: '#111',
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderLeftWidth: 2,
    borderLeftColor: THEME.colors.text.accent,
    paddingLeft: 12,
  },
  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: THEME.colors.text.primary,
    fontSize: 18,
    fontFamily: THEME.typography.mono,
    fontWeight: 'bold',
  },
  artist: {
    color: THEME.colors.text.secondary,
    fontSize: 12,
    fontFamily: THEME.typography.mono,
  },
  errorBox: {
    backgroundColor: '#300',
    borderWidth: 1,
    borderColor: '#f00',
    padding: 10,
    marginBottom: 20,
  },
  errorHeader: {
    color: '#f00',
    fontFamily: THEME.typography.mono,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  errorText: {
    color: '#fff',
    fontFamily: THEME.typography.mono,
    fontSize: 10,
  },
  progressBar: {
    fontFamily: THEME.typography.mono,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: -1,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  timeText: {
    color: THEME.colors.text.dim,
    fontFamily: THEME.typography.mono,
    fontSize: 10,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  tuiButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  lyricsContainer: {
    flex: 1,
    marginTop: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 12,
    backgroundColor: THEME.colors.surface,
  },
  fullLyricsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    marginTop: 0,
    zIndex: 100,
    paddingTop: 60,
    backgroundColor: '#000',
  },
  lyricsHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  lyricsHeader: {
    color: THEME.colors.text.accent,
    fontSize: 10,
    fontFamily: THEME.typography.mono,
    textAlign: 'center',
  },
  lyricsScroll: {
    flex: 1,
  },
  lyricLine: {
    color: THEME.colors.text.dim,
    fontFamily: THEME.typography.mono,
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  activeLyric: {
    color: THEME.colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullLyricLine: {
    fontSize: 22,
    marginBottom: 20,
    lineHeight: 28,
  },
  fullActiveLyric: {
    fontSize: 32,
    color: THEME.colors.text.accent,
  },
  plainLyrics: {
    color: THEME.colors.text.secondary,
    fontFamily: THEME.typography.mono,
    fontSize: 12,
  },
});

export default PlayerScreen;

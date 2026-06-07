import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Play, Pause, SkipForward, Music, Heart, Terminal } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { TusicAPI } from '../api';
import { THEME } from '../styles/theme';

const PlayerScreen = () => {
  const { 
    currentTrack, isPlaying, isLoading, position, duration, 
    togglePlayPause, playNext, togglePlaylist, playlist,
    playbackError
  } = usePlayer();
  const [lyrics, setLyrics] = useState(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);

  useEffect(() => {
    if (currentTrack) {
      fetchLyrics(currentTrack.id);
    }
  }, [currentTrack]);

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
            <Text style={styles.errorSubText}>The server was unable to resolve this stream. This is likely due to YouTube's bot protection.</Text>
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

  return (
    <View style={styles.container}>
      {/* ASCII Artwork Placeholder */}
      <View style={styles.artworkContainer}>
        <Text style={styles.asciiDisc}>{`
      .ed'''''''''be.
    .dP'           'Yb.
   .d'               'b.
  .d'        .        'b.
 .d'      .d888b.      'b.
 dP      .8888888.      Yb
 dP      .8888888.      Yb
 Yb      'Y88888P'      dP
 'b.      'Y888P'      .d'
  'b.        '        .d'
   'Yb.             .dP'
     'Yb...........dP'
        ''!!!!!!!''
        `}</Text>
      </View>

      <View style={styles.trackInfo}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>> {currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>$ artist: {currentTrack.artist}</Text>
        </View>
        <TouchableOpacity onPress={() => togglePlaylist(currentTrack)}>
          <Heart size={24} color={isSaved ? THEME.colors.text.accent : THEME.colors.text.dim} fill={isSaved ? THEME.colors.text.accent : "none"} />
        </TouchableOpacity>
      </View>

      {playbackError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorHeader}>!! PLAYBACK_FAILURE !!</Text>
          <Text style={styles.errorText}>{playbackError}</Text>
          <Text style={styles.errorSubText}>Check logs for details.</Text>
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
              <Text style={styles.tuiButtonText}>[ PAUSE ]</Text>
            ) : (
              <Text style={styles.tuiButtonText}>[ PLAY ]</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={playNext} style={styles.tuiButton}>
             <Text style={styles.tuiButtonText}>[ NEXT ]</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.lyricsContainer}>
        <Text style={styles.lyricsHeader}>-- LYRICS_LOG --</Text>
        <ScrollView style={styles.lyricsScroll}>
          {loadingLyrics ? (
            <ActivityIndicator color={THEME.colors.text.accent} />
          ) : lyrics ? (
            lyrics.lines ? (
              lyrics.lines.map((line, i) => (
                <Text key={i} style={[
                  styles.lyricLine,
                  position >= line.start_time && (i === lyrics.lines.length - 1 || position < lyrics.lines[i+1].start_time) && styles.activeLyric
                ]}>
                  {position >= line.start_time && (i === lyrics.lines.length - 1 || position < lyrics.lines[i+1].start_time) ? '> ' : '  '}{line.text}
                </Text>
              ))
            ) : (
              <Text style={styles.plainLyrics}>{lyrics.lyrics || "No data."}</Text>
            )
          ) : (
            <Text style={styles.plainLyrics}>_NO_LYRICS_FOUND</Text>
          )}
        </ScrollView>
      </View>
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
    marginVertical: 10,
  },
  asciiDisc: {
    color: THEME.colors.text.dim,
    fontFamily: THEME.typography.mono,
    fontSize: 7,
    lineHeight: 8,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderLeftWidth: 2,
    borderLeftColor: THEME.colors.text.accent,
    paddingLeft: 12,
  },
  title: {
    color: THEME.colors.text.primary,
    fontSize: THEME.typography.size.lg,
    fontFamily: THEME.typography.mono,
    fontWeight: 'bold',
  },
  artist: {
    color: THEME.colors.text.secondary,
    fontSize: THEME.typography.size.sm,
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
  errorSubText: {
    color: '#faa',
    fontFamily: THEME.typography.mono,
    fontSize: 8,
    marginTop: 4,
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
    gap: 16,
  },
  tuiButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  tuiButtonText: {
    color: THEME.colors.text.primary,
    fontFamily: THEME.typography.mono,
    fontSize: 12,
  },
  lyricsContainer: {
    flex: 1,
    marginTop: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 12,
    backgroundColor: THEME.colors.surface,
  },
  lyricsHeader: {
    color: THEME.colors.text.accent,
    fontSize: 10,
    fontFamily: THEME.typography.mono,
    marginBottom: 8,
    textAlign: 'center',
  },
  lyricsScroll: {
    flex: 1,
  },
  lyricLine: {
    color: THEME.colors.text.dim,
    fontFamily: THEME.typography.mono,
    fontSize: 14,
    marginBottom: 6,
  },
  activeLyric: {
    color: THEME.colors.text.primary,
    backgroundColor: '#111',
  },
  plainLyrics: {
    color: THEME.colors.text.secondary,
    fontFamily: THEME.typography.mono,
    fontSize: 12,
  },
});

export default PlayerScreen;

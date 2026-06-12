import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Play, Pause, SkipForward, Music } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { THEME } from '../styles/theme';

const MiniPlayer = ({ onOpenPlayer }) => {
  const { currentTrack, isPlaying, togglePlayPause, playNext } = usePlayer();

  if (!currentTrack) return null;

  return (
    <TouchableOpacity style={styles.container} onPress={onOpenPlayer} activeOpacity={0.9}>
      <View style={styles.artwork}>
        {currentTrack.thumbnail ? (
          <Image source={{ uri: currentTrack.thumbnail }} style={styles.thumbnail} />
        ) : (
          <Music size={20} color="#888" />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={togglePlayPause} style={styles.button}>
          {isPlaying ? <Pause size={24} color={THEME.colors.text.accent} fill={THEME.colors.text.accent} /> : <Play size={24} color={THEME.colors.text.accent} fill={THEME.colors.text.accent} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={playNext} style={styles.button}>
          <SkipForward size={24} color="#fff" fill="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginHorizontal: 8,
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    position: 'absolute',
    bottom: 50, // Above tab bar
    left: 0,
    right: 0,
  },
  artwork: {
    width: 40,
    height: 40,
    backgroundColor: '#111',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  info: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontFamily: THEME.typography.mono,
    fontWeight: 'bold',
  },
  artist: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: THEME.typography.mono,
    fontSize: 10,
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  button: {
    padding: 4,
  },
});

export default MiniPlayer;

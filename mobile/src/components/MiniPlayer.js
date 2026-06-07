import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause, SkipForward, Music } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';

const MiniPlayer = () => {
  const { currentTrack, isPlaying, togglePlayPause, playNext } = usePlayer();

  if (!currentTrack) return null;

  return (
    <View style={styles.container}>
      <View style={styles.artwork}>
        <Music size={20} color="#888" />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={togglePlayPause} style={styles.button}>
          {isPlaying ? <Pause size={24} color="#fff" fill="#fff" /> : <Play size={24} color="#fff" fill="#fff" />}
        </TouchableOpacity>
        <TouchableOpacity onPress={playNext} style={styles.button}>
          <SkipForward size={24} color="#fff" fill="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1DB954',
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
    backgroundColor: '#000',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  artist: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    padding: 4,
  },
});

export default MiniPlayer;

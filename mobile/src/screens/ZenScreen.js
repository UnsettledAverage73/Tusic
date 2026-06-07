import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { usePlayer } from '../context/PlayerContext';
import { THEME } from '../styles/theme';
import { Moon, Sun, Coffee, Brain } from 'lucide-react-native';

const ZenScreen = () => {
  const { moodSeeds, playTrack, currentTrack, isPlaying } = usePlayer();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('WORK'); // WORK or BREAK
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    if (mode === 'WORK') {
      setMode('BREAK');
      setTimeLeft(5 * 60);
    } else {
      setMode('WORK');
      setTimeLeft(25 * 60);
    }
    // Pulse animation on complete
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'WORK' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Brain size={20} color={THEME.colors.text.accent} />
        <Text style={styles.headerText}> SESSION_TYPE: {mode}</Text>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        <Text style={styles.statusText}>
          {isActive ? '> SYSTEM_FOCUSED' : '_ IDLE_WAITING'}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleTimer} style={styles.zenButton}>
          <Text style={styles.zenButtonText}>
            {isActive ? '[ STOP_CLOCK ]' : '[ START_CLOCK ]'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={resetTimer} style={styles.zenButton}>
          <Text style={styles.zenButtonText}>[ RESET ]</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.moodInfo}>
        <Text style={styles.moodLabel}>CURRENT_MOOD_OPTIMIZATION:</Text>
        <View style={styles.moodBadge}>
          {moodSeeds[0] === 'energetic' && <Sun size={14} color={THEME.colors.warning} />}
          {moodSeeds[0] === 'lofi' && <Moon size={14} color={THEME.colors.text.accent} />}
          {moodSeeds[0] === 'focus' && <Brain size={14} color={THEME.colors.text.primary} />}
          {moodSeeds[0] === 'chill' && <Coffee size={14} color={THEME.colors.text.secondary} />}
          <Text style={styles.moodText}> {moodSeeds[0]?.toUpperCase() || 'DEFAULT'}</Text>
        </View>
        <Text style={styles.moodDescription}>
          Audio streams are being dynamically throttled for maximum focus efficiency.
        </Text>
      </View>

      {currentTrack && (
        <View style={styles.miniInfo}>
          <Text style={styles.nowPlayingText}>
            NOW_PLAYING: {currentTrack.title.toUpperCase()}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    position: 'absolute',
    top: 40,
    left: 24,
  },
  headerText: {
    color: THEME.colors.text.accent,
    fontFamily: THEME.typography.mono,
    fontSize: 12,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  timerText: {
    color: THEME.colors.text.primary,
    fontFamily: THEME.typography.mono,
    fontSize: 80,
    letterSpacing: -2,
  },
  statusText: {
    color: THEME.colors.text.dim,
    fontFamily: THEME.typography.mono,
    fontSize: 14,
    marginTop: 10,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 60,
  },
  zenButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  zenButtonText: {
    color: THEME.colors.text.primary,
    fontFamily: THEME.typography.mono,
    fontSize: 12,
  },
  moodInfo: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 16,
    backgroundColor: '#050505',
  },
  moodLabel: {
    color: THEME.colors.text.dim,
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    marginBottom: 8,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodText: {
    color: THEME.colors.text.accent,
    fontFamily: THEME.typography.mono,
    fontSize: 16,
    fontWeight: 'bold',
  },
  moodDescription: {
    color: THEME.colors.text.secondary,
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    lineHeight: 14,
  },
  miniInfo: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  nowPlayingText: {
    color: THEME.colors.text.dim,
    fontFamily: THEME.typography.mono,
    fontSize: 9,
  }
});

export default ZenScreen;

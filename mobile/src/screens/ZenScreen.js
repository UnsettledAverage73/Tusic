import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, TextInput, ActivityIndicator, Vibration } from 'react-native';
import { usePlayer } from '../context/PlayerContext';
import { THEME } from '../styles/theme';
import { Moon, Sun, Coffee, Brain, Users, XCircle, ChevronRight, Zap, Copy, Plus } from 'lucide-react-native';
import { Accelerometer } from 'expo-sensors';
import * as Clipboard from 'expo-clipboard';

const ZenScreen = () => {
  const { moodSeeds, playTrack, currentTrack, isPlaying, roomId, joinRoom, leaveRoom } = usePlayer();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('WORK'); // WORK or BREAK
  const [inputRoomId, setInputRoomId] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let subscription;
    const setupAccelerometer = async () => {
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isAvailable) return;
      
      Accelerometer.setUpdateInterval(100);
      subscription = Accelerometer.addListener(data => {
        const { x, y, z } = data;
        const totalForce = Math.sqrt(x*x + y*y + z*z);
        if (totalForce > 2.5) { // Shake threshold
          handleShake();
        }
      });
    };
    
    setupAccelerometer();
    return () => subscription && subscription.remove();
  }, []);

  const handleShake = () => {
    if (isShaking) return;
    setIsShaking(true);
    Vibration.vibrate(100);
    
    // Animate
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    // Generate random room ID if not in one
    if (!roomId) {
      handleGenerateRoom();
    }

    setTimeout(() => setIsShaking(false), 1000);
  };

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
      Animated.timing(fadeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
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

  const handleJoin = () => {
    if (inputRoomId.trim()) {
      joinRoom(inputRoomId.trim().toUpperCase());
    }
  };

  const handleGenerateRoom = () => {
    const newId = Math.random().toString(36).substring(7).toUpperCase();
    console.log("[Zen] Generating new session:", newId);
    joinRoom(newId);
  };

  const copyToClipboard = async () => {
    if (roomId) {
      await Clipboard.setStringAsync(roomId);
      setCopied(true);
      Vibration.vibrate(50);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Animated.View style={[
      styles.container, 
      { opacity: fadeAnim, transform: [{ translateX: shakeAnim }] }
    ]}>
      <View style={styles.header}>
        <Brain size={20} color={THEME.colors.text.accent} />
        <Text style={styles.headerText}> SESSION_TYPE: {mode}</Text>
        {isShaking && <Zap size={14} color={THEME.colors.warning} style={{marginLeft: 10}} />}
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

      <View style={styles.sectionDivider}>
        <Text style={styles.dividerText}>-- NETWORK_PROTOCOLS --</Text>
      </View>

      <View style={styles.roomContainer}>
        <View style={styles.roomHeader}>
          <Users size={16} color={roomId ? THEME.colors.text.accent : THEME.colors.text.dim} />
          <Text style={[styles.roomTitle, roomId && {color: THEME.colors.text.accent}]}> 
            {roomId ? `CONNECTED_TO: ${roomId}` : 'COLLABORATIVE_SESSION'}
          </Text>
        </View>
        
        {roomId ? (
          <View style={styles.activeRoom}>
            <View style={styles.roomInfoRow}>
              <Text style={styles.roomDesc}>Sharing enabled. Your playback is now synced across all nodes.</Text>
              <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn}>
                <Copy size={16} color={copied ? THEME.colors.text.accent : THEME.colors.text.dim} />
                {copied && <Text style={styles.copiedText}> COPIED!</Text>}
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={leaveRoom} style={styles.leaveButton}>
              <XCircle size={14} color="#f44" />
              <Text style={styles.leaveButtonText}> TERMINATE_SESSION</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.roomActions}>
            <View style={styles.joinForm}>
              <TextInput
                style={styles.roomInput}
                placeholder="ENTER_ROOM_ID..."
                placeholderTextColor={THEME.colors.text.dim}
                value={inputRoomId}
                onChangeText={setInputRoomId}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={handleJoin} style={styles.joinButton}>
                <ChevronRight size={20} color={THEME.colors.text.accent} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleGenerateRoom} style={styles.generateBtn}>
              <Plus size={14} color={THEME.colors.text.primary} />
              <Text style={styles.generateBtnText}> GENERATE_NEW_CODE</Text>
            </TouchableOpacity>
          </View>
        )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  headerText: {
    color: THEME.colors.text.accent,
    fontFamily: THEME.typography.mono,
    fontSize: 12,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerText: {
    color: THEME.colors.text.primary,
    fontFamily: THEME.typography.mono,
    fontSize: 64,
    letterSpacing: -2,
  },
  statusText: {
    color: THEME.colors.text.dim,
    fontFamily: THEME.typography.mono,
    fontSize: 12,
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 30,
  },
  zenButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  zenButtonText: {
    color: THEME.colors.text.primary,
    fontFamily: THEME.typography.mono,
    fontSize: 10,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingBottom: 4,
    marginBottom: 16,
  },
  dividerText: {
    color: THEME.colors.text.dim,
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    textAlign: 'center',
  },
  roomContainer: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 16,
    marginBottom: 24,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomTitle: {
    color: THEME.colors.text.secondary,
    fontFamily: THEME.typography.mono,
    fontSize: 12,
    fontWeight: 'bold',
  },
  roomActions: {
    gap: 12,
  },
  roomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  copiedText: {
    color: THEME.colors.text.accent,
    fontFamily: THEME.typography.mono,
    fontSize: 8,
    marginLeft: 4,
  },
  joinForm: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: '#000',
    paddingLeft: 12,
  },
  roomInput: {
    flex: 1,
    color: THEME.colors.text.primary,
    fontFamily: THEME.typography.mono,
    fontSize: 12,
    height: 40,
  },
  joinButton: {
    padding: 10,
    borderLeftWidth: 1,
    borderLeftColor: THEME.colors.border,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderStyle: 'dashed',
  },
  generateBtnText: {
    color: THEME.colors.text.primary,
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    marginLeft: 8,
  },
  activeRoom: {
    gap: 12,
  },
  roomDesc: {
    flex: 1,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    lineHeight: 14,
    marginRight: 10,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  leaveButtonText: {
    color: '#f44',
    fontFamily: THEME.typography.mono,
    fontSize: 10,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  moodDescription: {
    color: THEME.colors.text.secondary,
    fontFamily: THEME.typography.mono,
    fontSize: 9,
    lineHeight: 13,
  },
  miniInfo: {
    marginTop: 20,
    alignItems: 'center',
  },
  nowPlayingText: {
    color: THEME.colors.text.dim,
    fontFamily: THEME.typography.mono,
    fontSize: 8,
  }
});

export default ZenScreen;

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, TextInput, ActivityIndicator } from 'react-native';
import { usePlayer } from '../context/PlayerContext';
import { THEME } from '../styles/theme';
import { Moon, Sun, Coffee, Brain, Users, XCircle, ChevronRight } from 'lucide-react-native';

const ZenScreen = () => {
  const { moodSeeds, playTrack, currentTrack, isPlaying, roomId, joinRoom, leaveRoom } = usePlayer();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('WORK'); // WORK or BREAK
  const [inputRoomId, setInputRoomId] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // ... (timer logic remains unchanged)

  const handleJoin = () => {
    if (inputRoomId.trim()) {
      joinRoom(inputRoomId.trim());
    }
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

      <View style={styles.sectionDivider}>
        <Text style={styles.dividerText}>-- NETWORK_PROTOCOLS --</Text>
      </View>

      <View style={styles.roomContainer}>
        <View style={styles.roomHeader}>
          <Users size={16} color={roomId ? THEME.colors.text.accent : THEME.colors.text.dim} />
          <Text style={[styles.roomTitle, roomId && {color: THEME.colors.text.accent}]}> 
            {roomId ? `CONNECTED_TO: ${roomId}` : 'JOIN_COLLAB_ROOM'}
          </Text>
        </View>
        
        {roomId ? (
          <View style={styles.activeRoom}>
            <Text style={styles.roomDesc}>Real-time synchronization enabled. Every action you take is broadcasted to the session.</Text>
            <TouchableOpacity onPress={leaveRoom} style={styles.leaveButton}>
              <XCircle size={14} color="#f44" />
              <Text style={styles.leaveButtonText}> TERMINATE_SESSION</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.joinForm}>
            <TextInput
              style={styles.roomInput}
              placeholder="ENTER_ROOM_ID..."
              placeholderTextColor={THEME.colors.text.dim}
              value={inputRoomId}
              onChangeText={setInputRoomId}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={handleJoin} style={styles.joinButton}>
              <ChevronRight size={20} color={THEME.colors.text.accent} />
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
  activeRoom: {
    gap: 12,
  },
  roomDesc: {
    color: THEME.colors.text.secondary,
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    lineHeight: 14,
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

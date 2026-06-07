import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { PlayerProvider } from './src/context/PlayerContext';
import MainLayout from './src/components/MainLayout';

export default function App() {
  useEffect(() => {
    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          interruptionModeIOS: 1, // InterruptionModeIOS.DuckOthers
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: 1, // InterruptionModeAndroid.DuckOthers
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.error("Audio mode setup failed", e);
      }
    }
    setupAudio();
  }, []);

  return (
    <SafeAreaProvider>
      <PlayerProvider>
        <NavigationContainer>
          <MainLayout />
          <StatusBar style="light" />
        </NavigationContainer>
      </PlayerProvider>
    </SafeAreaProvider>
  );
}

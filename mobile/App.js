import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { PlayerProvider } from './src/context/PlayerContext';
import MainLayout from './src/components/MainLayout';

export default function App() {
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

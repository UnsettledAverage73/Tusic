import React, { useState } from 'react';
import { View, useWindowDimensions, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Search, Library, PlayCircle, Terminal, Brain } from 'lucide-react-native';

import SearchScreen from '../screens/SearchScreen';
import LibraryScreen from '../screens/LibraryScreen';
import PlayerScreen from '../screens/PlayerScreen';
import ZenScreen from '../screens/ZenScreen';
import MiniPlayer from './MiniPlayer';
import { usePlayer } from '../context/PlayerContext';
import { THEME } from '../styles/theme';

const MainLayout = () => {
  const { width } = useWindowDimensions();
  const { currentTrack } = usePlayer();
  const [activePane, setActivePane] = useState('Search');
  const isTablet = width >= 768;

  const renderActivePane = () => {
    switch (activePane) {
      case 'Search': return <SearchScreen />;
      case 'Library': return <LibraryScreen />;
      case 'Player': return <PlayerScreen />;
      case 'Zen': return <ZenScreen />;
      default: return <SearchScreen />;
    }
  };

  const NavItem = ({ name, icon: Icon }) => (
    <TouchableOpacity 
      onPress={() => setActivePane(name)}
      style={[
        styles.navItem,
        activePane === name && styles.navItemActive
      ]}
    >
      <Icon size={18} color={activePane === name ? THEME.colors.text.accent : THEME.colors.text.secondary} />
      <Text style={[
        styles.navText,
        activePane === name && styles.navTextActive
      ]}>
        {name.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* TUI Status Header */}
      <View style={styles.header}>
        <Terminal size={16} color={THEME.colors.text.accent} />
        <Text style={styles.headerText}> TUSIC_V2.0 // {activePane.toUpperCase()}</Text>
      </View>

      {/* Main Grid Content */}
      <View style={styles.mainContent}>
        {isTablet ? (
          <View style={styles.tabletLayout}>
            <View style={styles.sidePane}><SearchScreen /></View>
            <View style={styles.centerPane}><LibraryScreen /></View>
            <View style={styles.sidePane}><PlayerScreen /></View>
          </View>
        ) : (
          renderActivePane()
        )}
      </View>

      {/* MiniPlayer integration */}
      {currentTrack && activePane !== 'Player' && activePane !== 'Zen' && <MiniPlayer />}

      {/* TUI Navigation Footer (Status Line) */}
      {!isTablet && (
        <View style={styles.footer}>
          <NavItem name="Search" icon={Search} />
          <NavItem name="Library" icon={Library} />
          <NavItem name="Player" icon={PlayCircle} />
          <NavItem name="Zen" icon={Brain} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    paddingTop: 40, // Space for status bar
  },
  header: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  headerText: {
    color: THEME.colors.text.primary,
    fontFamily: THEME.typography.mono,
    fontSize: 12,
  },
  mainContent: {
    flex: 1,
  },
  tabletLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidePane: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: THEME.colors.border,
  },
  centerPane: {
    flex: 1.5,
    borderRightWidth: 1,
    borderRightColor: THEME.colors.border,
  },
  footer: {
    height: 50,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  navItemActive: {
    backgroundColor: '#111',
  },
  navText: {
    color: THEME.colors.text.secondary,
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    marginLeft: 6,
  },
  navTextActive: {
    color: THEME.colors.text.accent,
  },
});

export default MainLayout;

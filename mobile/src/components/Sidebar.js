import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, Library, Music2 } from 'lucide-react-native';

const Sidebar = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Music2 size={32} color="#1DB954" />
        <Text style={styles.logoText}>Tusic</Text>
      </View>
      
      <View style={styles.menu}>
        <TouchableOpacity style={[styles.menuItem, styles.activeItem]}>
          <Search size={24} color="#fff" />
          <Text style={styles.menuText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Library size={24} color="#888" />
          <Text style={[styles.menuText, { color: '#888' }]}>Library</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Your Playlists</Text>
        <TouchableOpacity style={styles.playlistItem}>
          <Text style={styles.playlistText}>My Favorites</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.playlistItem}>
          <Text style={styles.playlistText}>Recent Mix</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 240,
    backgroundColor: '#000',
    borderRightWidth: 1,
    borderRightColor: '#222',
    padding: 24,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  logoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  menu: {
    gap: 16,
    marginBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    borderRadius: 8,
  },
  activeItem: {
    backgroundColor: '#222',
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  playlistItem: {
    paddingVertical: 8,
  },
  playlistText: {
    color: '#888',
    fontSize: 14,
  },
});

export default Sidebar;

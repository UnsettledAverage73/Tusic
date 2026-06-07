import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Play, Heart, Clock, Download, Trash2 } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { THEME } from '../styles/theme';

const LibraryScreen = () => {
  const { history, playlist, downloads, playTrack, clearHistory, deleteDownload } = usePlayer();
  const [tab, setTab] = useState('Playlist');

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.songItem}
      onPress={() => playTrack(item, tab === 'Playlist' ? playlist : (tab === 'Downloads' ? downloads : history))}
    >
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          <Text style={{color: THEME.colors.text.accent}}>> </Text>{item.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          <Text style={{color: THEME.colors.text.dim}}>$ </Text>{item.artist} | {item.duration}
        </Text>
      </View>
      <View style={styles.itemActions}>
        {tab === 'Downloads' && (
          <TouchableOpacity onPress={() => deleteDownload(item.id)} style={{marginRight: 15}}>
             <Trash2 size={16} color="#f44" />
          </TouchableOpacity>
        )}
        <Text style={styles.playTag}>[ PLAY ]</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabsHeader}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, tab === 'Playlist' && styles.activeTab]}
            onPress={() => setTab('Playlist')}
          >
            <Text style={[styles.tabText, tab === 'Playlist' && styles.activeTabText]}>
              [ {tab === 'Playlist' ? '*' : ' '} ] PLAYLIST
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, tab === 'Downloads' && styles.activeTab]}
            onPress={() => setTab('Downloads')}
          >
            <Text style={[styles.tabText, tab === 'Downloads' && styles.activeTabText]}>
              [ {tab === 'Downloads' ? '*' : ' '} ] DOWNLOADS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, tab === 'History' && styles.activeTab]}
            onPress={() => setTab('History')}
          >
            <Text style={[styles.tabText, tab === 'History' && styles.activeTabText]}>
              [ {tab === 'History' ? '*' : ' '} ] HISTORY
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {tab === 'History' && history.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
          <Text style={styles.clearButtonText}>[ PURGE_HISTORY_LOG ]</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={tab === 'Playlist' ? playlist : (tab === 'Downloads' ? downloads : history)}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {tab === 'Playlist' ? "_ NO_SAVED_TRACKS" : (tab === 'Downloads' ? "_ NO_OFFLINE_CONTENT" : "_ NO_HISTORY_LOGGED")}
            </Text>
            <Text style={styles.subEmptyText}>
              {tab === 'Downloads' ? "Download tracks from the Player to listen offline." : "Search for tracks and play them to populate your localized database."}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  tabsHeader: {
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  tabsContainer: {
    padding: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  activeTab: {
    backgroundColor: '#111',
    borderColor: THEME.colors.text.accent,
  },
  tabText: {
    color: THEME.colors.text.secondary,
    fontFamily: THEME.typography.mono,
    fontSize: 12,
  },
  activeTabText: {
    color: THEME.colors.text.accent,
  },
  clearButton: {
    padding: 12,
    alignItems: 'flex-end',
  },
  clearButtonText: {
    color: THEME.colors.error,
    fontFamily: THEME.typography.mono,
    fontSize: 10,
  },
  list: {
    paddingHorizontal: 12,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: THEME.colors.text.primary,
    fontSize: 14,
    fontFamily: THEME.typography.mono,
    marginBottom: 2,
  },
  songArtist: {
    color: THEME.colors.text.secondary,
    fontSize: 12,
    fontFamily: THEME.typography.mono,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playTag: {
    color: THEME.colors.text.accent,
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    padding: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  emptyText: {
    color: THEME.colors.text.accent,
    fontFamily: THEME.typography.mono,
    fontSize: 14,
    marginBottom: 8,
  },
  subEmptyText: {
    color: THEME.colors.text.dim,
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    textAlign: 'center',
  },
});

export default LibraryScreen;

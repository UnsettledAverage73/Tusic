import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Search, Play, Terminal } from 'lucide-react-native';
import { TusicAPI } from '../api';
import { usePlayer } from '../context/PlayerContext';
import { THEME } from '../styles/theme';

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('SONG'); // SONG or PODCAST
  const { playTrack } = usePlayer();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      let data;
      if (searchType === 'SONG') {
        data = await TusicAPI.search(query);
      } else {
        data = await TusicAPI.searchPodcasts(query);
      }
      // Deduplicate results by id to prevent "duplicate key" error
      const uniqueResults = Array.from(new Map(data.map(item => [item.id, item])).values());
      setResults(uniqueResults);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.songItem}
      onPress={() => playTrack(item, results)}
    >
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          <Text style={{color: THEME.colors.text.accent}}>> </Text>{item.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          <Text style={{color: THEME.colors.text.dim}}>$ </Text>{item.artist} | {item.duration}
        </Text>
      </View>
      <Text style={styles.playTag}>[ PLAY ]</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.prompt}>$ /</Text>
        <TextInput
          style={styles.input}
          placeholder="ENTER_SEARCH_QUERY..."
          placeholderTextColor={THEME.colors.text.dim}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          selectionColor={THEME.colors.text.accent}
        />
      </View>

      <View style={styles.typeSelector}>
        <TouchableOpacity 
          style={[styles.typeBtn, searchType === 'SONG' && styles.typeBtnActive]}
          onPress={() => setSearchType('SONG')}
        >
          <Text style={[styles.typeText, searchType === 'SONG' && styles.typeTextActive]}>[ SONGS ]</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeBtn, searchType === 'PODCAST' && styles.typeBtnActive]}
          onPress={() => setSearchType('PODCAST')}
        >
          <Text style={[styles.typeText, searchType === 'PODCAST' && styles.typeTextActive]}>[ PODCASTS ]</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={THEME.colors.text.accent} />
          <Text style={styles.loadingText}>RESOLVING_STREAMS...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>_ READY_FOR_INPUT</Text>
              <Text style={styles.subEmptyText}>Type a command above to begin.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    margin: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 4,
  },
  typeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  typeBtnActive: {
    borderColor: THEME.colors.text.accent,
    backgroundColor: '#111',
  },
  typeText: {
    color: THEME.colors.text.dim,
    fontFamily: THEME.typography.mono,
    fontSize: 10,
  },
  typeTextActive: {
    color: THEME.colors.text.accent,
  },
  prompt: {
    color: THEME.colors.text.accent,
    fontFamily: THEME.typography.mono,
    fontSize: 14,
    marginRight: 4,
  },
  input: {
    flex: 1,
    color: THEME.colors.text.primary,
    height: 40,
    fontSize: 14,
    fontFamily: THEME.typography.mono,
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
  playTag: {
    color: THEME.colors.text.accent,
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: THEME.colors.text.accent,
    fontFamily: THEME.typography.mono,
    fontSize: 12,
    marginTop: 8,
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
  },
});

export default SearchScreen;

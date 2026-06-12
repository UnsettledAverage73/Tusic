import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TusicAPI } from './index';
import { Platform } from 'react-native';

const DOWNLOAD_DIR = `${FileSystem.documentDirectory}songs/`;

export const DownloadManager = {
  init: async () => {
    if (Platform.OS === 'web') return;
    
    const info = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
    }
  },

  downloadTrack: async (track) => {
    if (Platform.OS === 'web') {
      console.warn("[DownloadManager] Downloads are not supported on web.");
      return null;
    }
    try {
      // 1. Resolve stream URL
      const streamUrl = await TusicAPI.resolve(track.id);
      if (!streamUrl) throw new Error("Could not resolve stream URL for download");

      // 2. Define local path
      const fileUri = `${DOWNLOAD_DIR}${track.id}.mp3`;

      // 3. Download
      const downloadResumable = FileSystem.createDownloadResumable(
        streamUrl,
        fileUri,
        {},
        (downloadProgress) => {
          // Progress can be emitted if needed
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      // 4. Save to mapping
      const savedDownloads = await AsyncStorage.getItem('downloads');
      const downloads = savedDownloads ? JSON.parse(savedDownloads) : {};
      downloads[track.id] = {
        ...track,
        localUri: result.uri
      };
      await AsyncStorage.setItem('downloads', JSON.stringify(downloads));
      
      return result.uri;
    } catch (e) {
      console.error("[DownloadManager] Download failed:", e);
      throw e;
    }
  },

  getDownloadedUri: async (trackId) => {
    if (Platform.OS === 'web') return null;
    const savedDownloads = await AsyncStorage.getItem('downloads');
    if (!savedDownloads) return null;
    const downloads = JSON.parse(savedDownloads);
    const download = downloads[trackId];
    if (download && download.localUri) {
      // Verify file still exists
      const info = await FileSystem.getInfoAsync(download.localUri);
      return info.exists ? download.localUri : null;
    }
    return null;
  },

  deleteDownload: async (trackId) => {
    if (Platform.OS === 'web') return;
    const savedDownloads = await AsyncStorage.getItem('downloads');
    if (!savedDownloads) return;
    const downloads = JSON.parse(savedDownloads);
    const download = downloads[trackId];
    
    if (download && download.localUri) {
      await FileSystem.deleteAsync(download.localUri, { idempotent: true });
      delete downloads[trackId];
      await AsyncStorage.setItem('downloads', JSON.stringify(downloads));
    }
  },

  listDownloads: async () => {
    const savedDownloads = await AsyncStorage.getItem('downloads');
    return savedDownloads ? Object.values(JSON.parse(savedDownloads)) : [];
  }
};

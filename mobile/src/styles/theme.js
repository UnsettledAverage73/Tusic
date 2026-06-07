/**
 * Tusic Theme Configuration
 * 
 * This file centralizes all visual constants for the Retro/Terminal UI.
 * It uses a pure black background (#000) for OLED efficiency and 
 * high-contrast neon accents for that classic terminal feel.
 */

export const THEME = {
  colors: {
    background: '#000000',
    surface: '#111111',
    border: '#333333',
    text: {
      primary: '#FFFFFF',
      secondary: '#888888',
      accent: '#1DB954', // Default Spotify-ish green, can be changed to Amber or Cyan
      dim: '#444444',
    },
    error: '#FF5555',
    warning: '#FFB86C',
  },
  typography: {
    // We prioritize system monospace for maximum compatibility and performance
    mono: 'monospace', 
    size: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
      xxl: 32,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borders: {
    width: 1,
    radius: 0, // Terminal UIs usually have sharp edges
  }
};

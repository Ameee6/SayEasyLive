// localStorage utilities for persisting settings

const STORAGE_KEY = 'sayeasy_settings';

// Default settings structure
export const getDefaultSettings = () => ({
  mode: 'default', // 'default' or 'custom'
  voicePreference: 'neutral', // 'boy', 'girl', or 'neutral'
  customCards: [],
  customLeftButtons: null
});

// Load settings from localStorage
export const loadSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...getDefaultSettings(), ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return getDefaultSettings();
};

// Save settings to localStorage
export const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

// Clear all settings
export const clearSettings = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing settings:', error);
    return false;
  }
};

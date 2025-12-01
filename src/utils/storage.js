// localStorage utilities for persisting settings

const STORAGE_KEY = 'sayeasy_settings';
const DASHBOARD_KEY = 'sayeasy_dashboard';
const REMOVED_CARDS_KEY = 'sayeasy_removed_cards';

// Legacy settings structure - preserved for backward compatibility with existing installations.
// The old Settings.jsx component used this format. New installations use the dashboard format below.
// This will be removed in a future version once all users have migrated to the dashboard.
export const getDefaultSettings = () => ({
  mode: 'default', // 'default' or 'custom'
  voicePreference: 'neutral', // 'boy', 'girl', or 'neutral'
  customCards: [],
  customLeftButtons: null
});

// Default dashboard settings structure for MVP
// Note: scrollCards can contain both preset cards (isPreset: true) and custom cards
export const getDefaultDashboardSettings = () => ({
  mainButtons: {
    top: {
      id: 'main-top',
      label: 'More/Yes',
      emoji: '👏',
      speakText: 'More, Yes',
      imageId: null // Reference to IndexedDB image
    },
    bottom: {
      id: 'main-bottom',
      label: 'All Done/No',
      emoji: '🛑',
      speakText: 'All Done, No',
      imageId: null
    }
  },
  scrollCards: [
    {
      id: 'preset-tv',
      label: 'TV',
      emoji: '📺',
      speakText: 'TV',
      isPreset: true,
      imageId: null
    },
    {
      id: 'preset-play',
      label: 'Play',
      emoji: '🧱',
      speakText: 'Play',
      isPreset: true,
      imageId: null
    }
  ],
  voicePreference: 'neutral'
});

// Load dashboard settings from localStorage
export const loadDashboardSettings = () => {
  try {
    const stored = localStorage.getItem(DASHBOARD_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure we have at least the default structure
      return {
        ...getDefaultDashboardSettings(),
        ...parsed,
        mainButtons: {
          ...getDefaultDashboardSettings().mainButtons,
          ...(parsed.mainButtons || {})
        }
      };
    }
  } catch (error) {
    console.error('Error loading dashboard settings:', error);
  }
  return getDefaultDashboardSettings();
};

// Save dashboard settings to localStorage
export const saveDashboardSettings = (settings) => {
  try {
    localStorage.setItem(DASHBOARD_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving dashboard settings:', error);
    return false;
  }
};

// Load removed cards for easy re-adding
export const loadRemovedCards = () => {
  try {
    const stored = localStorage.getItem(REMOVED_CARDS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading removed cards:', error);
  }
  return [];
};

// Save removed cards
export const saveRemovedCards = (cards) => {
  try {
    localStorage.setItem(REMOVED_CARDS_KEY, JSON.stringify(cards));
    return true;
  } catch (error) {
    console.error('Error saving removed cards:', error);
    return false;
  }
};

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

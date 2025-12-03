// src/settingsStorage.js
// Handle saving/loading user settings with tier validation

import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "./firebase-config";
import { getProfile } from "./auth";
import { validateCustomCards } from "./tierManager";

/**
 * Save user settings to Firestore with tier validation
 * @param {Object} settings - Settings object to save
 * @param {Array} settings.customCards - Array of custom cards
 * @param {string} settings.voicePreference - Voice preference
 * @param {string} settings.mode - 'default' or 'custom'
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
export async function saveSettings(settings) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "You must be signed in to save settings." };
    }

    // Get user profile to check tier
    const profile = await getProfile(user.uid);

    // Validate custom cards limit
    const validation = validateCustomCards(profile, settings.customCards);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        maxAllowed: validation.maxAllowed,
        needsUpgrade: true,
      };
    }

    // Save to Firestore
    const settingsRef = doc(db, "user_settings", user.uid);
    await setDoc(settingsRef, {
      userId: user.uid,
      ...settings,
      updatedAt: new Date().toISOString(),
    });

    // Also save to localStorage as backup
    localStorage.setItem('sayeasy-settings', JSON.stringify(settings));

    return { success: true };
  } catch (error) {
    console.error("Error saving settings:", error);
    return {
      success: false,
      error: error.message || "Failed to save settings. Please try again.",
    };
  }
}

/**
 * Load user settings from Firestore (falls back to localStorage)
 * @returns {Promise<Object|null>} Settings object or null
 */
export async function loadSettings() {
  try {
    const user = auth.currentUser;

    if (!user) {
      // Not signed in, try localStorage
      const localSettings = localStorage.getItem('sayeasy-settings');
      return localSettings ? JSON.parse(localSettings) : null;
    }

    // Try Firestore first
    const settingsRef = doc(db, "user_settings", user.uid);
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      const settings = settingsSnap.data();
      // Cache in localStorage
      localStorage.setItem('sayeasy-settings', JSON.stringify(settings));
      return settings;
    }

    // Fall back to localStorage if no Firestore data
    const localSettings = localStorage.getItem('sayeasy-settings');
    return localSettings ? JSON.parse(localSettings) : null;
  } catch (error) {
    console.error("Error loading settings:", error);
    // Fall back to localStorage on error
    const localSettings = localStorage.getItem('sayeasy-settings');
    return localSettings ? JSON.parse(localSettings) : null;
  }
}

/**
 * Check if user can add another custom card
 * @returns {Promise<Object>} { canAdd: boolean, currentCount: number, maxAllowed: number, tier: string }
 */
export async function checkCanAddCustomCard() {
  try {
    const user = auth.currentUser;
    if (!user) {
      return {
        canAdd: false,
        currentCount: 0,
        maxAllowed: 2,
        tier: 'free',
        error: "You must be signed in",
      };
    }

    const profile = await getProfile(user.uid);
    const settings = await loadSettings();
    const currentCount = settings?.customCards?.length || 0;

    const validation = validateCustomCards(profile, settings?.customCards || []);

    return {
      canAdd: currentCount < validation.maxAllowed,
      currentCount,
      maxAllowed: validation.maxAllowed,
      tier: profile?.tier || 'free',
    };
  } catch (error) {
    console.error("Error checking card limit:", error);
    return {
      canAdd: false,
      currentCount: 0,
      maxAllowed: 2,
      tier: 'free',
      error: error.message,
    };
  }
}

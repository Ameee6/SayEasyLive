import { useEffect, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db, auth } from '../firebase-config';
import { loadSettings } from '../settingsStorage';

/**
 * Hook that listens for real-time Firestore settings changes
 * Returns the latest settings and automatically updates when they change
 */
export function useSettingsListener() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let unsubscribe = null;

    const setupListener = async () => {
      const user = currentUser;
      
      if (!user) {
        // No user logged in, load from localStorage
        try {
          const localSettings = await loadSettings();
          setSettings(localSettings);
        } catch (error) {
          console.error('Error loading local settings:', error);
        }
        setLoading(false);
        return;
      }

      try {
        // Set up real-time listener for Firestore settings
        const settingsRef = doc(db, 'user_settings', user.uid);
        
        unsubscribe = onSnapshot(settingsRef, async (docSnapshot) => {
          console.log('🔄 Settings changed in Firestore, updating...');
          
          if (docSnapshot.exists()) {
            const firestoreSettings = docSnapshot.data();
            console.log('📡 Real-time settings update:', firestoreSettings);
            setSettings(firestoreSettings);
          } else {
            // No Firestore settings, fall back to localStorage
            const localSettings = await loadSettings();
            setSettings(localSettings);
          }
          setLoading(false);
        }, (error) => {
          console.error('❌ Error listening to settings changes:', error);
          // Fall back to loading settings normally
          loadSettings().then(setSettings).catch(console.error);
          setLoading(false);
        });
      } catch (error) {
        console.error('❌ Error setting up settings listener:', error);
        // Fall back to loading settings normally
        try {
          const localSettings = await loadSettings();
          setSettings(localSettings);
        } catch (loadError) {
          console.error('Error loading fallback settings:', loadError);
        }
        setLoading(false);
      }
    };

    setupListener();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        console.log('🔕 Cleaning up settings listener');
        unsubscribe();
      }
    };
  }, [currentUser]);

  return { settings, loading };
}
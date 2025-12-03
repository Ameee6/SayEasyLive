import { useState, useEffect } from 'react';
import Homepage from './components/Homepage';
import MainView from './components/MainView';
import DrumsView from './components/DrumsView';
import SettingsDashboard from './components/SettingsDashboard';
import { initSpeech } from './utils/speech';
import { loadDashboardSettings, saveDashboardSettings } from './utils/storage';
import { onAuthChange, getProfile } from './auth';
import { getUserTier } from './tierManager';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'main', 'drums', or 'settings'
  const [dashboardSettings, setDashboardSettings] = useState(loadDashboardSettings());
  const [highlightedCardIndex, setHighlightedCardIndex] = useState(null); // Track which card to highlight when returning to main view
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userTier, setUserTier] = useState(null);

  // Initialize speech synthesis on mount
  useEffect(() => {
    initSpeech();
  }, []);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await getProfile(firebaseUser.uid);
          setUserProfile(profile);
          setUserTier(getUserTier(profile));
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
        setUserTier(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Convert dashboard settings to format expected by MainView
  const getCards = () => {
    return dashboardSettings.scrollCards;
  };

  const getLeftButtons = () => {
    return dashboardSettings.mainButtons;
  };

  // Handle exiting from main view to homepage
  const handleExitToHome = () => {
    setCurrentView('home');
  };

  // Handle saving settings from dashboard
  const handleSaveSettings = (newSettings) => {
    setDashboardSettings(newSettings);
    saveDashboardSettings(newSettings);
    setCurrentView('main');
  };

  // Handle going back from settings to homepage
  const handleBackToHome = () => {
    setCurrentView('home');
  };

  // Handle navigation from homepage to settings
  const handleNavigateToSettings = () => {
    setCurrentView('settings');
  };

  // Handle navigation from homepage to main communication app
  const handleNavigateToMain = () => {
    setHighlightedCardIndex(null); // Reset highlighted card when navigating fresh to main
    setCurrentView('main');
  };

  // Handle navigation to Drums view
  const handlePlayDrums = () => {
    setCurrentView('drums');
  };

  // Handle going back from Drums view to main view - highlight the Drums card
  const handleBackFromDrums = () => {
    // Find the index of the Drums card (the card with isInteractive: true)
    const cards = getCards();
    const drumsIndex = cards.findIndex(card => card.isInteractive === true);
    setHighlightedCardIndex(drumsIndex >= 0 ? drumsIndex : null);
    setCurrentView('main');
  };

  // Render appropriate view
  if (currentView === 'home') {
    return (
      <Homepage
        onNavigateToSettings={handleNavigateToSettings}
        onNavigateToMain={handleNavigateToMain}
        user={user}
        userProfile={userProfile}
        userTier={userTier}
      />
    );
  }

  if (currentView === 'settings') {
    return (
      <SettingsDashboard
        onSave={handleSaveSettings}
        onBack={handleBackToHome}
      />
    );
  }

  if (currentView === 'drums') {
    return (
      <DrumsView
        leftButtons={getLeftButtons()}
        voicePreference={dashboardSettings.voicePreference}
        onBack={handleBackFromDrums}
      />
    );
  }

  return (
    <MainView
      cards={getCards()}
      leftButtons={getLeftButtons()}
      voicePreference={dashboardSettings.voicePreference}
      onExit={handleExitToHome}
      onPlayDrums={handlePlayDrums}
      initialCardIndex={highlightedCardIndex}
    />
  );
}

export default App;

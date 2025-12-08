import { useState, useEffect } from 'react';
import Homepage from './components/Homepage';
import MainView from './components/MainView';
import DrumsView from './components/DrumsView';
import SettingsDashboard from './components/SettingsDashboard';
import ContactPage from './components/ContactPage';
import AdminDashboard from './components/AdminDashboard';
import UserAccountDashboard from './components/UserAccountDashboard';
import { initSpeech } from './utils/speech';
import { loadDashboardSettings, saveDashboardSettings } from './utils/storage';
import { onAuthChange, getProfile } from './auth';
import { getUserTier } from './tierManager';
import { useSettingsListener } from './hooks/useSettingsListener';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'main', 'drums', 'settings', 'contact', 'admin', or 'account'
  const [highlightedCardIndex, setHighlightedCardIndex] = useState(null); // Track which card to highlight when returning to main view
  const [showSignupModal, setShowSignupModal] = useState(false); // Control signup modal from settings
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userTier, setUserTier] = useState(null);

  // Use real-time settings listener for live sync
  const { settings: realtimeSettings, loading: settingsLoading } = useSettingsListener();
  
  // Fall back to default settings if real-time settings aren't loaded yet
  const dashboardSettings = realtimeSettings || loadDashboardSettings();

  // Initialize speech synthesis on mount
  useEffect(() => {
    initSpeech();
  }, []);

  // Refresh user profile data
  const refreshUserProfile = async () => {
    if (user) {
      try {
        const profile = await getProfile(user.uid);
        setUserProfile(profile);
        setUserTier(getUserTier(profile));
      } catch (error) {
        console.error('Error refreshing user profile:', error);
      }
    }
  };

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
    // Save to localStorage as backup
    saveDashboardSettings(newSettings);
    setCurrentView('main');
    // Note: Real-time settings will be updated automatically via the useSettingsListener hook
    // when the SettingsDashboard saves to Firestore
  };

  // Handle going back from settings to homepage
  const handleBackToHome = () => {
    setCurrentView('home');
  };

  // Handle showing signup modal from settings
  const handleShowSignup = () => {
    setCurrentView('home');
    setShowSignupModal(true);
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

  // Handle navigation to contact page
  const handleNavigateToContact = () => {
    setCurrentView('contact');
  };

  // Handle navigation to admin dashboard
  const handleNavigateToAdmin = () => {
    setCurrentView('admin');
  };

  // Handle navigation to user account dashboard
  const handleNavigateToAccount = () => {
    setCurrentView('account');
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

  // Show loading screen if settings are still loading
  if (settingsLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700 mb-2">Loading...</div>
          <div className="text-gray-500">Syncing your settings</div>
        </div>
      </div>
    );
  }

  // Render appropriate view
  if (currentView === 'home') {
    return (
      <Homepage
        onNavigateToSettings={handleNavigateToSettings}
        onNavigateToMain={handleNavigateToMain}
        onNavigateToContact={handleNavigateToContact}
        onNavigateToAdmin={handleNavigateToAdmin}
        onNavigateToAccount={handleNavigateToAccount}
        user={user}
        userProfile={userProfile}
        userTier={userTier}
        onRefreshUser={refreshUserProfile}
        showSignupModal={showSignupModal}
        onCloseSignupModal={() => setShowSignupModal(false)}
      />
    );
  }

  if (currentView === 'settings') {
    return (
      <SettingsDashboard
        onSave={handleSaveSettings}
        onBack={handleBackToHome}
        onShowSignup={handleShowSignup}
        userProfile={userProfile}
        userTier={userTier}
      />
    );
  }

  if (currentView === 'contact') {
    return (
      <ContactPage
        onBack={handleBackToHome}
      />
    );
  }

  if (currentView === 'admin') {
    return (
      <AdminDashboard
        onBack={handleBackToHome}
        userProfile={userProfile}
      />
    );
  }

  if (currentView === 'account') {
    return (
      <UserAccountDashboard
        user={user}
        userProfile={userProfile}
        userTier={userTier}
        onRefreshUser={refreshUserProfile}
        onNavigateHome={handleBackToHome}
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

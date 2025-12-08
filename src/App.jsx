import { useState, useEffect } from 'react';
import Homepage from './components/Homepage';
import MainView from './components/MainView';
import DrumsView from './components/DrumsView';
import SettingsDashboard from './components/SettingsDashboard';
import ContactPage from './components/ContactPage';
import AdminDashboard from './components/AdminDashboard';
import UserAccountDashboard from './components/UserAccountDashboard';
import EmailSuccessPage from './components/EmailSuccessPage';
import { initSpeech } from './utils/speech';
import { loadDashboardSettings, saveDashboardSettings } from './utils/storage';
import { onAuthChange, getProfile } from './auth';
import { getUserTier } from './tierManager';
import { useSettingsListener } from './hooks/useSettingsListener';
import analytics from './utils/analytics';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'main', 'drums', 'settings', 'contact', 'admin', 'account', 'verify-success', or 'reset-success'
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

  // Check URL for success pages on mount
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/verify-success') {
      setCurrentView('verify-success');
      // Clean up URL
      window.history.replaceState({}, '', '/');
    } else if (path === '/reset-success') {
      setCurrentView('reset-success');
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }
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
          
          // Analytics: Track user login
          analytics.setUserId(firebaseUser.uid);
          analytics.trackAction('user_login', {
            method: firebaseUser.providerData[0]?.providerId || 'unknown',
            isNewUser: profile === null
          });
        } catch (error) {
          console.error('Error fetching user profile:', error);
          analytics.trackError(error, { context: 'user_profile_load' });
        }
      } else {
        analytics.setUserId(null);
        analytics.trackAction('user_logout');
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
    analytics.trackPageView('home');
  };

  // Handle showing signup modal from settings
  const handleShowSignup = () => {
    setCurrentView('home');
    setShowSignupModal(true);
    analytics.trackAction('signup_modal_opened', { source: 'settings' });
    analytics.trackPageView('home');
  };

  // Handle navigation from homepage to settings
  const handleNavigateToSettings = () => {
    setCurrentView('settings');
    analytics.trackPageView('settings');
  };

  // Handle navigation from homepage to main communication app
  const handleNavigateToMain = () => {
    setHighlightedCardIndex(null); // Reset highlighted card when navigating fresh to main
    setCurrentView('main');
    analytics.trackPageView('main');
    analytics.trackFeatureUsage('communication_app');
  };

  // Handle navigation to contact page
  const handleNavigateToContact = () => {
    setCurrentView('contact');
    analytics.trackPageView('contact');
  };

  // Handle navigation to admin dashboard
  const handleNavigateToAdmin = () => {
    setCurrentView('admin');
    analytics.trackPageView('admin');
  };

  // Handle navigation to user account dashboard
  const handleNavigateToAccount = () => {
    setCurrentView('account');
    analytics.trackPageView('account');
  };

  // Handle navigation to Drums view
  const handlePlayDrums = () => {
    setCurrentView('drums');
    analytics.trackPageView('drums');
    analytics.trackFeatureUsage('drums_game');
  };

  // Handle going back from Drums view to main view - highlight the Drums card
  const handleBackFromDrums = () => {
    // Find the index of the Drums card (the card with isInteractive: true)
    const cards = getCards();
    const drumsIndex = cards.findIndex(card => card.isInteractive === true);
    setHighlightedCardIndex(drumsIndex >= 0 ? drumsIndex : null);
    setCurrentView('main');
    analytics.trackPageView('main');
    analytics.trackAction('back_from_drums');
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

  // Render appropriate view with Support Widget
  const renderCurrentView = () => {
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
          onRefreshUser={refreshUserProfile}
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

    if (currentView === 'verify-success') {
      return (
        <EmailSuccessPage
          type="verify"
          onNavigateHome={handleBackToHome}
        />
      );
    }

    if (currentView === 'reset-success') {
      return (
        <EmailSuccessPage
          type="reset"
          onNavigateHome={handleBackToHome}
        />
      );
    }

    // Default MainView
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
  };

  return renderCurrentView();
}

export default App;

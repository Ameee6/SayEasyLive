import { useState, useEffect } from 'react';
import Homepage from './components/Homepage';
import MainView from './components/MainView';
import SettingsDashboard from './components/SettingsDashboard';
import { initSpeech } from './utils/speech';
import { loadDashboardSettings, saveDashboardSettings } from './utils/storage';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'main', or 'settings'
  const [dashboardSettings, setDashboardSettings] = useState(loadDashboardSettings());

  // Initialize speech synthesis on mount
  useEffect(() => {
    initSpeech();
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
    setCurrentView('main');
  };

  // Render appropriate view
  if (currentView === 'home') {
    return (
      <Homepage
        onNavigateToSettings={handleNavigateToSettings}
        onNavigateToMain={handleNavigateToMain}
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

  return (
    <MainView
      cards={getCards()}
      leftButtons={getLeftButtons()}
      voicePreference={dashboardSettings.voicePreference}
      onExit={handleExitToHome}
    />
  );
}

export default App;

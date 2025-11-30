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

  // Handle entering fullscreen
  const enterFullscreen = () => {
    const elem = document.documentElement;

    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };

  // Handle exiting fullscreen
  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }

    // Return to homepage after exiting fullscreen
    setCurrentView('home');
  };

  // Listen for fullscreen changes (e.g., user pressing ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (!isCurrentlyFullscreen && currentView === 'main') {
        setCurrentView('home');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [currentView]);

  // Handle saving settings from dashboard
  const handleSaveSettings = (newSettings) => {
    setDashboardSettings(newSettings);
    saveDashboardSettings(newSettings);
    setCurrentView('main');
    // Enter fullscreen when returning to main view
    setTimeout(enterFullscreen, 100);
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
    setTimeout(enterFullscreen, 100);
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
      onExitFullscreen={exitFullscreen}
    />
  );
}

export default App;

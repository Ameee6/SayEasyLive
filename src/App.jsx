import { useState, useEffect } from 'react';
import MainView from './components/MainView';
import Settings from './components/Settings';
import { initSpeech } from './utils/speech';
import { loadSettings, saveSettings } from './utils/storage';
import { defaultCards, defaultLeftButtons } from './data/defaultCards';

function App() {
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'settings'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settings, setSettings] = useState(loadSettings());

  // Initialize speech synthesis on mount
  useEffect(() => {
    initSpeech();
  }, []);

  // Get the cards to display based on mode
  const getCards = () => {
    if (settings.mode === 'custom' && settings.customCards.length > 0) {
      return settings.customCards;
    }
    return defaultCards;
  };

  // Handle entering fullscreen
  const enterFullscreen = () => {
    const elem = document.documentElement;

    if (elem.requestFullscreen) {
      elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
      setIsFullscreen(true);
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
      setIsFullscreen(true);
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
      setIsFullscreen(true);
    }
  };

  // Handle exiting fullscreen
  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
      setIsFullscreen(false);
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
      setIsFullscreen(false);
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
      setIsFullscreen(false);
    }

    // Return to settings after exiting fullscreen
    setCurrentView('settings');
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

      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && currentView === 'main') {
        setCurrentView('settings');
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

  // Handle saving settings
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    setCurrentView('main');
    // Enter fullscreen when returning to main view
    setTimeout(enterFullscreen, 100);
  };

  // Handle going back from settings to main
  const handleBackToMain = () => {
    setCurrentView('main');
    setTimeout(enterFullscreen, 100);
  };

  // Render appropriate view
  if (currentView === 'settings') {
    return (
      <Settings
        settings={settings}
        onSave={handleSaveSettings}
        onBack={handleBackToMain}
      />
    );
  }

  return (
    <MainView
      cards={getCards()}
      leftButtons={defaultLeftButtons}
      voicePreference={settings.voicePreference}
      onExitFullscreen={exitFullscreen}
    />
  );
}

export default App;

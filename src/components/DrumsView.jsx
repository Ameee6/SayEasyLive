import { useState, useRef, useEffect, useCallback } from 'react';
import { DRUM_CONFIGS } from '../utils/drumSounds';
import { loadAllImages } from '../utils/imageStorage';
import { speak } from '../utils/speech';

// Drum repeat configuration
const DRUM_REPEAT_INTERVAL = 1500; // 1.5 seconds

// Button styling constants - enlarged for better touch accessibility
const CONTROL_BUTTON_STYLE = {
  width: 'min(32vw, 42vh)',
  height: 'min(32vw, 42vh)',
  minWidth: '200px',
  minHeight: '200px',
  touchAction: 'manipulation',
  cursor: 'pointer',
};

// Enlarged drum buttons for easier tapping in vertical layout
const DRUM_BUTTON_STYLE = {
  width: 'min(45vw, 320px)',
  height: 'min(20vh, 220px)',
  minWidth: '260px',
  minHeight: '160px',
  touchAction: 'manipulation',
  cursor: 'pointer',
};

const LABEL_STYLE = {
  fontFamily: "'Quicksand', sans-serif",
  textShadow: '4px 4px 8px rgba(0,0,0,0.4)',
  color: '#FFFFFF'
};

// Yes/No button colors - matching MainView
const YES_BUTTON_COLOR = '#00E676'; // Bright Lime Green
const NO_BUTTON_COLOR = '#FF6D00';  // Bright Orange
const BACK_BUTTON_COLOR = '#6366F1'; // Indigo/Purple for BACK

function DrumsView({ leftButtons, voicePreference, onBack }) {
  const [images, setImages] = useState({});
  
  // Animation states for buttons
  const [yesButtonAnimating, setYesButtonAnimating] = useState(false);
  const [noButtonAnimating, setNoButtonAnimating] = useState(false);
  const [drumAnimating, setDrumAnimating] = useState({});

  // Refs for animation timeouts
  const yesAnimationTimeoutRef = useRef(null);
  const noAnimationTimeoutRef = useRef(null);
  const drumAnimationTimeoutRefs = useRef({});
  const drumRepeatIntervalRefs = useRef({});

  // Load images from IndexedDB on mount
  useEffect(() => {
    const loadImages = async () => {
      const allImages = await loadAllImages();
      setImages(allImages);
    };
    loadImages();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    // Copy refs to local variables for cleanup
    const drumAnimationTimeouts = drumAnimationTimeoutRefs.current;
    const drumRepeatIntervals = drumRepeatIntervalRefs.current;
    
    return () => {
      if (yesAnimationTimeoutRef.current) clearTimeout(yesAnimationTimeoutRef.current);
      if (noAnimationTimeoutRef.current) clearTimeout(noAnimationTimeoutRef.current);
      Object.values(drumAnimationTimeouts).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      Object.values(drumRepeatIntervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, []);

  // Speak handler
  const handleSpeak = useCallback((text) => {
    speak(text, voicePreference);
  }, [voicePreference]);

  // Yes button handlers
  const handleYesPress = () => {
    handleSpeak(leftButtons.top.speakText);
    if (yesAnimationTimeoutRef.current) clearTimeout(yesAnimationTimeoutRef.current);
    setYesButtonAnimating(true);
    yesAnimationTimeoutRef.current = setTimeout(() => {
      setYesButtonAnimating(false);
      yesAnimationTimeoutRef.current = null;
    }, 800);
  };

  // No button handlers  
  const handleNoPress = () => {
    handleSpeak(leftButtons.bottom.speakText);
    if (noAnimationTimeoutRef.current) clearTimeout(noAnimationTimeoutRef.current);
    setNoButtonAnimating(true);
    noAnimationTimeoutRef.current = setTimeout(() => {
      setNoButtonAnimating(false);
      noAnimationTimeoutRef.current = null;
    }, 800);
  };

  // Drum button press handler - plays sound and sets up repeat on hold
  const handleDrumPress = (drumId, playSound) => {
    // Play the sound immediately
    playSound();
    
    // Animate the button
    setDrumAnimating(prev => ({ ...prev, [drumId]: true }));
    if (drumAnimationTimeoutRefs.current[drumId]) {
      clearTimeout(drumAnimationTimeoutRefs.current[drumId]);
    }
    drumAnimationTimeoutRefs.current[drumId] = setTimeout(() => {
      setDrumAnimating(prev => ({ ...prev, [drumId]: false }));
    }, 200);

    // Clear any existing repeat interval
    if (drumRepeatIntervalRefs.current[drumId]) {
      clearInterval(drumRepeatIntervalRefs.current[drumId]);
    }

    // Set up repeat interval for long press
    drumRepeatIntervalRefs.current[drumId] = setInterval(() => {
      playSound();
      // Re-trigger animation
      setDrumAnimating(prev => ({ ...prev, [drumId]: true }));
      setTimeout(() => {
        setDrumAnimating(prev => ({ ...prev, [drumId]: false }));
      }, 200);
    }, DRUM_REPEAT_INTERVAL);
  };

  // Drum button release handler - stops repeat
  const handleDrumRelease = (drumId) => {
    if (drumRepeatIntervalRefs.current[drumId]) {
      clearInterval(drumRepeatIntervalRefs.current[drumId]);
      drumRepeatIntervalRefs.current[drumId] = null;
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col relative bg-white no-select" style={{ touchAction: 'none' }}>
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - black background with Yes, BACK, No vertical stack */}
        <div 
          className="w-1/3 flex flex-col items-center justify-around border-r-8 border-black p-4"
          style={{ backgroundColor: '#1a1a2e' }}
        >
          {/* Yes button */}
          <button
            onMouseDown={handleYesPress}
            onTouchStart={handleYesPress}
            aria-label={leftButtons.top.speakText}
            className={`flex flex-col items-center justify-center rounded-full outline-none focus:outline-none shadow-2xl border-4 border-white overflow-hidden ${yesButtonAnimating ? 'spin-on-press' : ''}`}
            style={{
              ...CONTROL_BUTTON_STYLE,
              backgroundColor: YES_BUTTON_COLOR,
            }}
          >
            {leftButtons.top.imageId && images[leftButtons.top.imageId] ? (
              <img 
                src={images[leftButtons.top.imageId]} 
                alt={leftButtons.top.label}
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <div style={{ fontSize: 'min(10vw, 5vh)', lineHeight: 1 }}>{leftButtons.top.emoji}</div>
                <div 
                  className="font-bold text-center leading-tight mt-1"
                  style={{ 
                    fontSize: 'clamp(24px, 3vw, 48px)',
                    ...LABEL_STYLE,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  {leftButtons.top.label}
                </div>
              </>
            )}
          </button>

          {/* BACK button (arrow left) - not editable */}
          <button
            onClick={onBack}
            aria-label="Go back"
            className="flex flex-col items-center justify-center rounded-full outline-none focus:outline-none shadow-2xl border-4 border-white"
            style={{
              ...CONTROL_BUTTON_STYLE,
              backgroundColor: BACK_BUTTON_COLOR,
            }}
          >
            <div style={{ fontSize: 'min(14vw, 7vh)', lineHeight: 1 }}>←</div>
            <div 
              className="font-bold text-center leading-tight mt-1"
              style={{ 
                fontSize: 'clamp(24px, 3vw, 48px)',
                ...LABEL_STYLE,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              BACK
            </div>
          </button>

          {/* No button */}
          <button
            onMouseDown={handleNoPress}
            onTouchStart={handleNoPress}
            aria-label={leftButtons.bottom.speakText}
            className={`flex flex-col items-center justify-center rounded-full outline-none focus:outline-none shadow-2xl border-4 border-white overflow-hidden ${noButtonAnimating ? 'spin-on-press' : ''}`}
            style={{
              ...CONTROL_BUTTON_STYLE,
              backgroundColor: NO_BUTTON_COLOR,
            }}
          >
            {leftButtons.bottom.imageId && images[leftButtons.bottom.imageId] ? (
              <img 
                src={images[leftButtons.bottom.imageId]} 
                alt={leftButtons.bottom.label}
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <div style={{ fontSize: 'min(10vw, 5vh)', lineHeight: 1 }}>{leftButtons.bottom.emoji}</div>
                <div 
                  className="font-bold text-center leading-tight mt-1"
                  style={{ 
                    fontSize: 'clamp(24px, 3vw, 48px)',
                    ...LABEL_STYLE,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  {leftButtons.bottom.label}
                </div>
              </>
            )}
          </button>
        </div>

        {/* Right Panel - white background with three drum buttons arranged vertically */}
        <div className="w-2/3 flex flex-col items-center justify-around p-6 bg-white">
          {DRUM_CONFIGS.map((drum) => (
            <button
              key={drum.id}
              onMouseDown={() => handleDrumPress(drum.id, drum.playSound)}
              onMouseUp={() => handleDrumRelease(drum.id)}
              onMouseLeave={() => handleDrumRelease(drum.id)}
              onTouchStart={() => handleDrumPress(drum.id, drum.playSound)}
              onTouchEnd={() => handleDrumRelease(drum.id)}
              aria-label={`Play ${drum.label} drum`}
              className={`flex flex-row items-center justify-center rounded-3xl outline-none focus:outline-none shadow-2xl border-8 border-black/20 ${drumAnimating[drum.id] ? 'drum-bounce' : ''}`}
              style={{
                ...DRUM_BUTTON_STYLE,
                backgroundColor: drum.color,
              }}
            >
              <div style={{ fontSize: 'min(8vw, 70px)', lineHeight: 1, marginRight: '12px' }}>{drum.emoji}</div>
              <div 
                className="font-bold text-center leading-tight"
                style={{ 
                  fontSize: 'clamp(28px, 5vw, 56px)',
                  ...LABEL_STYLE,
                }}
              >
                {drum.label}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DrumsView;

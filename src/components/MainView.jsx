import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { speak } from '../utils/speech';
import { defaultLeftButtons } from '../data/defaultCards';
import { loadAllImages } from '../utils/imageStorage';

// 7 distinct bright solid colors - no gradients (using hex values for reliability)
const CARD_COLORS = [
  '#8B5CF6',  // Bright Purple
  '#EC4899',  // Hot Pink
  '#3B82F6',  // Electric Blue
  '#FACC15',  // Sunny Yellow
  '#F97316',  // Vibrant Orange
  '#22C55E',  // Fresh Green
  '#EF4444',  // Cherry Red
];

// Yes/No button colors - bright, fun, distinct from cards
const YES_BUTTON_COLOR = '#00E676'; // Bright Lime Green
const NO_BUTTON_COLOR = '#FF6D00';  // Bright Orange

// Thumbnail sidebar configuration
const THUMBNAIL_SIZE_BREAKPOINT = 7; // Cards above this threshold get smaller thumbnails

// Generate box-shadow for active thumbnail with glow effect
const getActiveThumbnailBoxShadow = (cardColor) => 
  `0 0 20px 4px ${cardColor}, 0 0 40px 8px ${cardColor}80, 0 8px 24px rgba(0,0,0,0.4)`;

// Long-press configuration
const LONG_PRESS_THRESHOLD = 800; // 0.8 seconds
const REPEAT_INTERVAL = 2000; // 2 seconds

// Tween configuration for smooth 500ms transitions
const TRANSITION_CONFIG = {
  type: 'tween',
  duration: 0.5,    // 500ms for smooth but responsive feel
  ease: 'easeInOut',
};

// Shared sizing constants for accessibility - oversized tap zones for reliable touch/palm registration
const YES_NO_BUTTON_STYLE = {
  width: 'min(34vw, 44vh)',
  height: 'min(34vw, 44vh)',
  minWidth: '240px',
  minHeight: '240px',
  touchAction: 'manipulation',
  cursor: 'pointer',
};

const CARD_EMOJI_BUTTON_STYLE = {
  width: 'min(52vw, 500px)',
  height: 'min(52vw, 500px)',
  minWidth: '300px',
  minHeight: '300px',
  touchAction: 'manipulation',
  cursor: 'pointer',
};

const LABEL_STYLE = {
  fontFamily: "'Quicksand', sans-serif",
  textShadow: '4px 4px 8px rgba(0,0,0,0.4)',
  color: '#FFFFFF'
};

function MainView({ cards, leftButtons = defaultLeftButtons, voicePreference, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for up, 1 for down, 0 for initial
  const [images, setImages] = useState({}); // Images loaded from IndexedDB

  // Button animation states
  const [yesButtonAnimating, setYesButtonAnimating] = useState(false);
  const [noButtonAnimating, setNoButtonAnimating] = useState(false);
  const [cardButtonAnimating, setCardButtonAnimating] = useState(false);

  // Refs for animation timeouts to prevent memory leaks
  const yesAnimationTimeoutRef = useRef(null);
  const noAnimationTimeoutRef = useRef(null);
  const cardAnimationTimeoutRef = useRef(null);

  // Long press handling refs
  const longPressTimerRef = useRef(null);
  const repeatIntervalRef = useRef(null);

  // Wheel event debounce ref
  const wheelTimeoutRef = useRef(null);

  const handleSpeak = useCallback((text) => {
    speak(text, voicePreference);
  }, [voicePreference]);

  // Long press handlers
  const startLongPress = useCallback((text) => {
    // Clear any existing timers
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    if (repeatIntervalRef.current) clearInterval(repeatIntervalRef.current);

    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      // Start repeating voice every 2 seconds
      repeatIntervalRef.current = setInterval(() => {
        handleSpeak(text);
      }, REPEAT_INTERVAL);
    }, LONG_PRESS_THRESHOLD);
  }, [handleSpeak]);

  const stopLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  }, []);

  // Load images from IndexedDB on mount.
  // Separate from cleanup effect because this is an async data fetch operation,
  // while the cleanup effect handles synchronous timer/interval cleanup.
  useEffect(() => {
    const loadImages = async () => {
      const allImages = await loadAllImages();
      setImages(allImages);
    };
    loadImages();
  }, []);

  // Cleanup all timeouts/intervals on unmount
  useEffect(() => {
    return () => {
      stopLongPress();
      if (yesAnimationTimeoutRef.current) clearTimeout(yesAnimationTimeoutRef.current);
      if (noAnimationTimeoutRef.current) clearTimeout(noAnimationTimeoutRef.current);
      if (cardAnimationTimeoutRef.current) clearTimeout(cardAnimationTimeoutRef.current);
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
    };
  }, [stopLongPress]);

  // Get card color by index, cycling through the palette
  const getCardColor = (index) => {
    return CARD_COLORS[index % CARD_COLORS.length];
  };

  // Navigate to next card (pull/swipe down reveals the card above)
  const goToNextCard = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  }, [cards.length]);

  // Navigate to previous card (pull/swipe up reveals the card below)
  const goToPrevCard = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  }, [cards.length]);

  // Handle drag end with velocity-based navigation
  // Stacked index behavior: drag down to see above (next card), drag up to see below (previous card)
  const handleDragEnd = useCallback((event, info) => {
    const threshold = 50; // Minimum drag distance to trigger card change
    const velocityThreshold = 200; // Minimum velocity to trigger card change
    
    const offset = info.offset.y;
    const velocity = info.velocity.y;
    
    // Determine if we should change cards based on drag distance or velocity
    if (offset > threshold || velocity > velocityThreshold) {
      // Dragged down - reveal next card from above (stacked index: pull down to see above)
      goToNextCard();
    } else if (offset < -threshold || velocity < -velocityThreshold) {
      // Dragged up - reveal previous card from below (stacked index: pull up to see below)
      goToPrevCard();
    }
    // If neither threshold met, framer-motion spring will animate back to center
  }, [goToNextCard, goToPrevCard]);

  // Wheel handler with debouncing for smooth scrolling
  // Scroll down reveals next card, scroll up reveals previous card
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    // Debounce wheel events to prevent rapid scrolling
    if (wheelTimeoutRef.current) return;
    
    wheelTimeoutRef.current = setTimeout(() => {
      wheelTimeoutRef.current = null;
    }, 400); // Debounce prevents rapid successive wheel events

    if (e.deltaY > 0) {
      // Scroll down - go to next card
      goToNextCard();
    } else if (e.deltaY < 0) {
      // Scroll up - go to previous card
      goToPrevCard();
    }
  }, [goToNextCard, goToPrevCard]);

  // Get current card
  const currentCard = cards[currentIndex];

  // Yes button handlers with animation and long-press
  const handleYesPress = () => {
    handleSpeak(leftButtons.top.speakText);
    if (yesAnimationTimeoutRef.current) clearTimeout(yesAnimationTimeoutRef.current);
    setYesButtonAnimating(true);
    yesAnimationTimeoutRef.current = setTimeout(() => {
      setYesButtonAnimating(false);
      yesAnimationTimeoutRef.current = null;
    }, 800);
    startLongPress(leftButtons.top.speakText);
  };

  const handleYesRelease = () => {
    stopLongPress();
  };

  // No button handlers with animation and long-press
  const handleNoPress = () => {
    handleSpeak(leftButtons.bottom.speakText);
    if (noAnimationTimeoutRef.current) clearTimeout(noAnimationTimeoutRef.current);
    setNoButtonAnimating(true);
    noAnimationTimeoutRef.current = setTimeout(() => {
      setNoButtonAnimating(false);
      noAnimationTimeoutRef.current = null;
    }, 800);
    startLongPress(leftButtons.bottom.speakText);
  };

  const handleNoRelease = () => {
    stopLongPress();
  };

  // Card button handlers with animation and long-press
  const handleCardPress = () => {
    handleSpeak(currentCard.speakText);
    if (cardAnimationTimeoutRef.current) clearTimeout(cardAnimationTimeoutRef.current);
    setCardButtonAnimating(true);
    cardAnimationTimeoutRef.current = setTimeout(() => {
      setCardButtonAnimating(false);
      cardAnimationTimeoutRef.current = null;
    }, 500);
    startLongPress(currentCard.speakText);
  };

  const handleCardRelease = () => {
    stopLongPress();
  };

  return (
    <div className="w-screen h-screen flex flex-col relative bg-white no-select" style={{ touchAction: 'none' }}>
      {/* Double-tap to exit button */}
      <DoubleTapExit onExit={onExit} />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - 1/3 width - Yes/No circular buttons */}
        <div className="w-1/3 flex flex-col items-center justify-around border-r-8 border-black p-4"
             style={{ backgroundColor: '#1a1a2e' }}>
          
          {/* Yes button - perfectly circular, large touch zone */}
          <button
            onMouseDown={handleYesPress}
            onMouseUp={handleYesRelease}
            onMouseLeave={handleYesRelease}
            onTouchStart={handleYesPress}
            onTouchEnd={handleYesRelease}
            aria-label={leftButtons.top.speakText}
            className={`flex flex-col items-center justify-center rounded-full outline-none focus:outline-none shadow-2xl border-8 border-white/40 overflow-hidden ${yesButtonAnimating ? 'spin-on-press' : ''}`}
            style={{
              ...YES_NO_BUTTON_STYLE,
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
                <div style={{ fontSize: 'min(14vw, 7vh)', lineHeight: 1 }}>{leftButtons.top.emoji}</div>
                <div 
                  className="font-bold text-center leading-tight mt-1"
                  style={{ 
                    fontSize: 'clamp(36px, 5vw, 72px)',
                    ...LABEL_STYLE,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  {leftButtons.top.label}
                </div>
              </>
            )}
          </button>

          {/* No button - perfectly circular, same size as Yes */}
          <button
            onMouseDown={handleNoPress}
            onMouseUp={handleNoRelease}
            onMouseLeave={handleNoRelease}
            onTouchStart={handleNoPress}
            onTouchEnd={handleNoRelease}
            aria-label={leftButtons.bottom.speakText}
            className={`flex flex-col items-center justify-center rounded-full outline-none focus:outline-none shadow-2xl border-8 border-white/40 overflow-hidden ${noButtonAnimating ? 'spin-on-press' : ''}`}
            style={{
              ...YES_NO_BUTTON_STYLE,
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
                <div style={{ fontSize: 'min(14vw, 7vh)', lineHeight: 1 }}>{leftButtons.bottom.emoji}</div>
                <div 
                  className="font-bold text-center leading-tight mt-1"
                  style={{ 
                    fontSize: 'clamp(36px, 5vw, 72px)',
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

        {/* Right Panel - 2/3 width - Split into card area (~80%) and thumbnail sidebar (~20%) */}
        <div className="w-2/3 flex h-full">
          {/* Card scroll area - ~80% of right panel */}
          <div
            className="flex items-center justify-center overflow-hidden relative"
            style={{ width: '80%', touchAction: 'none' }}
            onWheel={handleWheel}
          >
            {/* Animated card container using framer-motion */}
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                initial={(dir) => ({
                  y: dir === 0 ? 0 : dir > 0 ? '-100%' : '100%',
                })}
                animate={{
                  y: 0,
                }}
                exit={(dir) => ({
                  y: dir > 0 ? '100%' : '-100%',
                })}
                transition={TRANSITION_CONFIG}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.3}
                onDragEnd={handleDragEnd}
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8"
                style={{ backgroundColor: getCardColor(currentIndex) }}
              >
                {/* Huge tappable emoji circle - enlarged touch zone */}
                <button
                  onMouseDown={handleCardPress}
                  onMouseUp={handleCardRelease}
                  onMouseLeave={handleCardRelease}
                  onTouchStart={handleCardPress}
                  onTouchEnd={handleCardRelease}
                  aria-label={currentCard.speakText}
                  className={`rounded-full bg-white/95 backdrop-blur flex items-center justify-center outline-none focus:outline-none shadow-2xl border-8 border-black/20 overflow-hidden ${cardButtonAnimating ? 'bounce-on-press' : ''}`}
                  style={CARD_EMOJI_BUTTON_STYLE}
                >
                  {currentCard.imageId && images[currentCard.imageId] ? (
                    <img 
                      src={images[currentCard.imageId]} 
                      alt={currentCard.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div style={{ fontSize: 'min(28vw, 14rem)', lineHeight: 1 }}>{currentCard.emoji}</div>
                  )}
                </button>

                {/* Title/Label - much larger text */}
                <div 
                  className="font-bold text-center px-4 my-6"
                  style={{ 
                    fontSize: 'clamp(48px, 14vw, 160px)',
                    ...LABEL_STYLE
                  }}
                >
                  {currentCard.label}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Position dots - larger for accessibility */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
              {cards.map((_, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    scale: idx === currentIndex ? 1.1 : 1,
                    backgroundColor: idx === currentIndex ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.5)',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`rounded-full shadow-lg ${
                    idx === currentIndex ? 'w-12 h-12' : 'w-8 h-8'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Vertical dividing line */}
          <div className="w-1 bg-black" />

          {/* Thumbnail sidebar - ~20% of right panel */}
          <ThumbnailSidebar 
            cards={cards} 
            currentIndex={currentIndex} 
            getCardColor={getCardColor}
            images={images}
          />
        </div>
      </div>
    </div>
  );
}

// Double-tap to exit component with confirmation modal
function DoubleTapExit({ onExit }) {
  const [lastTap, setLastTap] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const modalTimeoutRef = useRef(null);
  const doubleTapDelay = 500; // milliseconds
  const autoCloseDelay = 4000; // 4 seconds auto-cancel

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
      }
    };
  }, []);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < doubleTapDelay) {
      // Double tap detected - show confirmation modal
      setShowModal(true);
      // Set auto-close timeout
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
      }
      modalTimeoutRef.current = setTimeout(() => {
        setShowModal(false);
        modalTimeoutRef.current = null;
      }, autoCloseDelay);
    }
    setLastTap(now);
  };

  const handleConfirmExit = () => {
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
      modalTimeoutRef.current = null;
    }
    setShowModal(false);
    onExit();
  };

  const handleStay = () => {
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
      modalTimeoutRef.current = null;
    }
    setShowModal(false);
  };

  return (
    <>
      {/* Exit button - small, positioned in top left corner */}
      <button
        onClick={handleTap}
        className="absolute top-4 left-4 z-50 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 active:bg-gray-900 border border-gray-600 shadow-md outline-none focus:outline-none"
        style={{ 
          fontSize: 'clamp(12px, 1.5vw, 16px)',
          fontFamily: "'Quicksand', sans-serif",
          fontWeight: 600,
          opacity: 0.7
        }}
        aria-label="Double-tap to exit"
      >
        Exit
      </button>

      {/* Confirmation modal - appears in top left corner */}
      {showModal && (
        <div 
          className="absolute top-16 left-4 z-50 bg-white rounded-xl shadow-2xl border-2 border-gray-300 p-4"
          style={{
            minWidth: '220px',
            maxWidth: '280px',
          }}
        >
          <p 
            className="text-gray-800 font-semibold mb-4 text-center"
            style={{ 
              fontSize: 'clamp(14px, 2vw, 18px)',
              fontFamily: "'Quicksand', sans-serif"
            }}
          >
            Are you sure you want to exit?
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleConfirmExit}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 font-semibold outline-none focus:outline-none"
              style={{ 
                fontSize: 'clamp(12px, 1.5vw, 16px)',
                fontFamily: "'Quicksand', sans-serif"
              }}
            >
              Confirm
            </button>
            <button
              onClick={handleStay}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 font-semibold outline-none focus:outline-none"
              style={{ 
                fontSize: 'clamp(12px, 1.5vw, 16px)',
                fontFamily: "'Quicksand', sans-serif"
              }}
            >
              Stay
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Thumbnail sidebar component for card preview/orientation
function ThumbnailSidebar({ cards, currentIndex, getCardColor, images }) {
  return (
    <div 
      className="flex flex-col items-center justify-center py-6 px-3 overflow-hidden"
      style={{ 
        width: '20%',
        backgroundColor: '#f0f0f0',
        touchAction: 'none', // Not interactive - purely visual
        pointerEvents: 'none' // Prevent any interaction
      }}
      aria-hidden="true" // Hide from screen readers since it's purely visual
    >
      {/* Vertically stacked thumbnails with generous spacing */}
      <div className="flex flex-col gap-4 w-full max-h-full overflow-hidden">
        {cards.map((card, idx) => {
          const isActive = idx === currentIndex;
          const cardColor = getCardColor(idx);
          const imageUrl = card.imageId ? images[card.imageId] : null;
          
          return (
            <div
              key={idx}
              className={`
                flex flex-col items-center justify-center
                rounded-xl
                ${isActive ? 'active-thumbnail-highlight' : 'opacity-60'}
              `}
              style={{
                // Asymmetric borders: thick left/right, slim top/bottom
                borderStyle: 'solid',
                borderColor: cardColor,
                borderTopWidth: isActive ? '2px' : '1px',
                borderBottomWidth: isActive ? '2px' : '1px',
                borderLeftWidth: isActive ? '14px' : '10px',
                borderRightWidth: isActive ? '14px' : '10px',
                backgroundColor: isActive ? '#ffffff' : '#fafafa',
                // Increased vertical space (10% additional height)
                minHeight: '68px',
                maxHeight: cards.length > THUMBNAIL_SIZE_BREAKPOINT ? '123px' : '151px',
                flex: '1 1 0',
                boxShadow: isActive 
                  ? getActiveThumbnailBoxShadow(cardColor) 
                  : '0 2px 4px rgba(0,0,0,0.1)',
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, border 0.3s ease-in-out',
                position: 'relative',
                zIndex: isActive ? 10 : 1,
              }}
            >
              {/* Thumbnail emoji or image */}
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={card.label}
                  className="rounded object-cover"
                  style={{ 
                    width: cards.length > THUMBNAIL_SIZE_BREAKPOINT ? '28px' : '36px',
                    height: cards.length > THUMBNAIL_SIZE_BREAKPOINT ? '28px' : '36px',
                  }}
                />
              ) : (
                <div 
                  className="leading-none"
                  style={{ 
                    fontSize: cards.length > THUMBNAIL_SIZE_BREAKPOINT ? 'clamp(16px, 3vw, 28px)' : 'clamp(20px, 4vw, 36px)',
                  }}
                >
                  {card.emoji}
                </div>
              )}
              
              {/* Thumbnail label */}
              <div 
                className={`
                  font-bold text-center leading-tight
                  ${isActive ? 'text-black' : 'text-gray-600'}
                `}
                style={{ 
                  fontSize: cards.length > THUMBNAIL_SIZE_BREAKPOINT ? 'clamp(10px, 1.5vw, 14px)' : 'clamp(12px, 2vw, 18px)',
                  fontFamily: "'Quicksand', sans-serif",
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  padding: '0 4px',
                }}
              >
                {card.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MainView;

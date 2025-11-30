import { useState, useRef, useEffect, useCallback } from 'react';
import { speak } from '../utils/speech';
import { defaultLeftButtons } from '../data/defaultCards';

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

// Normalization factor to convert velocity to ~60fps frame rate
const FRAME_RATE_NORMALIZATION = 16;

// Long-press configuration
const LONG_PRESS_THRESHOLD = 800; // 0.8 seconds
const REPEAT_INTERVAL = 2000; // 2 seconds

function MainView({ cards, leftButtons = defaultLeftButtons, voicePreference, onExitFullscreen }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0); // Real-time drag position
  const [startY, setStartY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [settleAnimating, setSettleAnimating] = useState(false); // For bounce animation
  const velocityRef = useRef(0);
  const lastTouchTimeRef = useRef(0);
  const lastTouchYRef = useRef(0);
  const animationRef = useRef(null);

  // Button animation states
  const [yesButtonAnimating, setYesButtonAnimating] = useState(false);
  const [noButtonAnimating, setNoButtonAnimating] = useState(false);
  const [cardButtonAnimating, setCardButtonAnimating] = useState(false);

  // Long press handling refs
  const longPressTimerRef = useRef(null);
  const repeatIntervalRef = useRef(null);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLongPress();
    };
  }, [stopLongPress]);

  // Get card color by index, cycling through the palette
  const getCardColor = (index) => {
    return CARD_COLORS[index % CARD_COLORS.length];
  };

  // Smooth momentum-based settle animation - MUCH SLOWER (2-3x)
  const animateSettle = (initialVelocity, initialOffset) => {
    const friction = 0.96; // SLOWER deceleration (was 0.92)
    const minVelocity = 0.3; // Lower threshold for smoother stopping
    const cardHeight = window.innerHeight;
    
    let velocity = initialVelocity * 0.5; // Reduce initial velocity for slower animation
    let offset = initialOffset;
    
    const animate = () => {
      velocity *= friction;
      offset += velocity;
      
      // Check if we should snap to a card
      if (Math.abs(velocity) < minVelocity) {
        // Determine final card based on offset
        let targetIndex = currentIndex;
        if (offset > cardHeight * 0.3) {
          targetIndex = (currentIndex - 1 + cards.length) % cards.length;
        } else if (offset < -cardHeight * 0.3) {
          targetIndex = (currentIndex + 1) % cards.length;
        }
        
        setCurrentIndex(targetIndex);
        setDragOffset(0);
        setIsAnimating(false);
        // Trigger settle bounce animation
        setSettleAnimating(true);
        setTimeout(() => setSettleAnimating(false), 600);
        return;
      }
      
      // Check boundaries - if offset exceeds threshold, trigger card change
      if (offset > cardHeight * 0.5) {
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
        setDragOffset(0);
        setIsAnimating(false);
        setSettleAnimating(true);
        setTimeout(() => setSettleAnimating(false), 600);
        return;
      } else if (offset < -cardHeight * 0.5) {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
        setDragOffset(0);
        setIsAnimating(false);
        setSettleAnimating(true);
        setTimeout(() => setSettleAnimating(false), 600);
        return;
      }
      
      setDragOffset(offset);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    setIsAnimating(true);
    animationRef.current = requestAnimationFrame(animate);
  };

  // Touch handlers - real-time following with velocity tracking
  const handleTouchStart = (e) => {
    e.preventDefault();
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsAnimating(false);
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    lastTouchYRef.current = e.touches[0].clientY;
    lastTouchTimeRef.current = Date.now();
    velocityRef.current = 0;
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTouchTimeRef.current;
    
    if (deltaTime > 0) {
      velocityRef.current = (currentY - lastTouchYRef.current) / deltaTime * FRAME_RATE_NORMALIZATION;
    }
    
    lastTouchYRef.current = currentY;
    lastTouchTimeRef.current = currentTime;
    
    const deltaY = currentY - startY;
    setDragOffset(deltaY);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    if (!isDragging) return;

    setIsDragging(false);
    setStartY(0);
    
    // Use momentum scrolling with current velocity
    animateSettle(velocityRef.current * 2, dragOffset);
  };

  // Mouse handlers - real-time following with velocity tracking
  const handleMouseDown = (e) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsAnimating(false);
    setIsDragging(true);
    setStartY(e.clientY);
    lastTouchYRef.current = e.clientY;
    lastTouchTimeRef.current = Date.now();
    velocityRef.current = 0;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const currentY = e.clientY;
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTouchTimeRef.current;
    
    if (deltaTime > 0) {
      velocityRef.current = (currentY - lastTouchYRef.current) / deltaTime * FRAME_RATE_NORMALIZATION;
    }
    
    lastTouchYRef.current = currentY;
    lastTouchTimeRef.current = currentTime;
    
    const deltaY = currentY - startY;
    setDragOffset(deltaY);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);
    setStartY(0);
    
    // Use momentum scrolling with current velocity
    animateSettle(velocityRef.current * 2, dragOffset);
  };

  // Wheel handler with smooth scrolling
  const handleWheel = (e) => {
    e.preventDefault();
    if (isDragging || isAnimating) return;

    if (e.deltaY > 0) {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
      setSettleAnimating(true);
      setTimeout(() => setSettleAnimating(false), 600);
    } else if (e.deltaY < 0) {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
      setSettleAnimating(true);
      setTimeout(() => setSettleAnimating(false), 600);
    }
  };

  // Get current, previous, and next cards
  const currentCard = cards[currentIndex];
  const prevCard = cards[(currentIndex - 1 + cards.length) % cards.length];
  const nextCard = cards[(currentIndex + 1) % cards.length];

  // Yes button handlers with animation and long-press
  const handleYesPress = () => {
    handleSpeak(leftButtons.top.speakText);
    setYesButtonAnimating(true);
    setTimeout(() => setYesButtonAnimating(false), 800);
    startLongPress(leftButtons.top.speakText);
  };

  const handleYesRelease = () => {
    stopLongPress();
  };

  // No button handlers with animation and long-press
  const handleNoPress = () => {
    handleSpeak(leftButtons.bottom.speakText);
    setNoButtonAnimating(true);
    setTimeout(() => setNoButtonAnimating(false), 800);
    startLongPress(leftButtons.bottom.speakText);
  };

  const handleNoRelease = () => {
    stopLongPress();
  };

  // Card button handlers with animation and long-press
  const handleCardPress = () => {
    handleSpeak(currentCard.speakText);
    setCardButtonAnimating(true);
    setTimeout(() => setCardButtonAnimating(false), 500);
    startLongPress(currentCard.speakText);
  };

  const handleCardRelease = () => {
    stopLongPress();
  };

  return (
    <div className="w-screen h-screen flex flex-col relative bg-white no-select" style={{ touchAction: 'none' }}>
      {/* Double-tap to exit button */}
      <DoubleTapExit onExit={onExitFullscreen} />

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
            className={`flex flex-col items-center justify-center rounded-full outline-none focus:outline-none shadow-2xl border-8 border-white/40 overflow-hidden ${yesButtonAnimating ? 'spin-on-press' : ''}`}
            style={{
              width: 'min(32vw, 42vh)',
              height: 'min(32vw, 42vh)',
              minWidth: '220px',
              minHeight: '220px',
              backgroundColor: YES_BUTTON_COLOR,
              touchAction: 'manipulation',
            }}
          >
            <div style={{ fontSize: 'min(14vw, 7vh)', lineHeight: 1 }}>{leftButtons.top.emoji}</div>
            <div 
              className="font-bold text-white text-center leading-tight mt-1"
              style={{ 
                fontSize: 'clamp(36px, 5vw, 72px)',
                fontFamily: "'Quicksand', sans-serif",
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              {leftButtons.top.label}
            </div>
          </button>

          {/* No button - perfectly circular, same size as Yes */}
          <button
            onMouseDown={handleNoPress}
            onMouseUp={handleNoRelease}
            onMouseLeave={handleNoRelease}
            onTouchStart={handleNoPress}
            onTouchEnd={handleNoRelease}
            className={`flex flex-col items-center justify-center rounded-full outline-none focus:outline-none shadow-2xl border-8 border-white/40 overflow-hidden ${noButtonAnimating ? 'spin-on-press' : ''}`}
            style={{
              width: 'min(32vw, 42vh)',
              height: 'min(32vw, 42vh)',
              minWidth: '220px',
              minHeight: '220px',
              backgroundColor: NO_BUTTON_COLOR,
              touchAction: 'manipulation',
            }}
          >
            <div style={{ fontSize: 'min(14vw, 7vh)', lineHeight: 1 }}>{leftButtons.bottom.emoji}</div>
            <div 
              className="font-bold text-white text-center leading-tight mt-1"
              style={{ 
                fontSize: 'clamp(36px, 5vw, 72px)',
                fontFamily: "'Quicksand', sans-serif",
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              {leftButtons.bottom.label}
            </div>
          </button>
        </div>

        {/* Right Panel - 2/3 width - Full-screen card swiper */}
        <div
          className="w-2/3 flex items-center justify-center overflow-hidden relative"
          style={{ touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Full-screen cards - one at a time, slides in/out - MUCH SLOWER transition */}
          <div
            className={`absolute inset-0 w-full h-full ${settleAnimating ? 'settle-bounce' : ''}`}
            style={{
              transform: isDragging || isAnimating ? `translateY(${dragOffset}px)` : 'translateY(0)',
              transition: isDragging || isAnimating ? 'none' : 'transform 1.2s cubic-bezier(0.25, 0.1, 0.25, 1.05)' // MUCH SLOWER with slight overshoot
            }}
          >
            {/* Previous card (above current) */}
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8"
                 style={{ transform: 'translateY(-100%)', backgroundColor: getCardColor((currentIndex - 1 + cards.length) % cards.length) }}>
              <button 
                className="rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-2xl pointer-events-none border-8 border-black/20 overflow-hidden"
                style={{ 
                  width: 'min(50vw, 480px)', 
                  height: 'min(50vw, 480px)',
                  minWidth: '280px',
                  minHeight: '280px'
                }}
              >
                <div style={{ fontSize: 'min(28vw, 14rem)', lineHeight: 1 }}>{prevCard.emoji}</div>
              </button>
              <div 
                className="font-bold text-center px-4 my-6"
                style={{ 
                  fontSize: 'clamp(48px, 12vw, 144px)',
                  fontFamily: "'Quicksand', sans-serif",
                  textShadow: '4px 4px 8px rgba(0,0,0,0.4)',
                  color: '#FFFFFF'
                }}
              >
                {prevCard.label}
              </div>
            </div>

            {/* Current card - full screen with enhanced touch zone */}
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8"
                 style={{ backgroundColor: getCardColor(currentIndex) }}>

              {/* Huge tappable emoji circle - enlarged touch zone */}
              <button
                onMouseDown={handleCardPress}
                onMouseUp={handleCardRelease}
                onMouseLeave={handleCardRelease}
                onTouchStart={handleCardPress}
                onTouchEnd={handleCardRelease}
                className={`rounded-full bg-white/95 backdrop-blur flex items-center justify-center outline-none focus:outline-none shadow-2xl border-8 border-black/20 overflow-hidden ${cardButtonAnimating ? 'bounce-on-press' : ''}`}
                style={{ 
                  width: 'min(50vw, 480px)', 
                  height: 'min(50vw, 480px)',
                  minWidth: '280px',
                  minHeight: '280px',
                  touchAction: 'manipulation',
                }}
              >
                <div style={{ fontSize: 'min(28vw, 14rem)', lineHeight: 1 }}>{currentCard.emoji}</div>
              </button>

              {/* Title/Label - much larger text */}
              <div 
                className="font-bold text-center px-4 my-6"
                style={{ 
                  fontSize: 'clamp(48px, 14vw, 160px)',
                  fontFamily: "'Quicksand', sans-serif",
                  textShadow: '4px 4px 8px rgba(0,0,0,0.4)',
                  color: '#FFFFFF'
                }}
              >
                {currentCard.label}
              </div>
            </div>

            {/* Next card (below current) */}
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8"
                 style={{ transform: 'translateY(100%)', backgroundColor: getCardColor((currentIndex + 1) % cards.length) }}>
              <button 
                className="rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-2xl pointer-events-none border-8 border-black/20 overflow-hidden"
                style={{ 
                  width: 'min(50vw, 480px)', 
                  height: 'min(50vw, 480px)',
                  minWidth: '280px',
                  minHeight: '280px'
                }}
              >
                <div style={{ fontSize: 'min(28vw, 14rem)', lineHeight: 1 }}>{nextCard.emoji}</div>
              </button>
              <div 
                className="font-bold text-center px-4 my-6"
                style={{ 
                  fontSize: 'clamp(48px, 12vw, 144px)',
                  fontFamily: "'Quicksand', sans-serif",
                  textShadow: '4px 4px 8px rgba(0,0,0,0.4)',
                  color: '#FFFFFF'
                }}
              >
                {nextCard.label}
              </div>
            </div>
          </div>

          {/* Position dots - larger for accessibility */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
            {cards.map((_, idx) => (
              <div
                key={idx}
                className={`rounded-full transition-all duration-500 ${
                  idx === currentIndex
                    ? 'w-12 h-12 bg-white scale-110 shadow-lg'
                    : 'w-8 h-8 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Double-tap to exit component
function DoubleTapExit({ onExit }) {
  const [lastTap, setLastTap] = useState(0);
  const doubleTapDelay = 500; // milliseconds

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < doubleTapDelay) {
      // Double tap detected
      onExit();
    }
    setLastTap(now);
  };

  return (
    <button
      onClick={handleTap}
      className="absolute top-4 right-4 z-50 px-6 py-4 bg-gray-800 text-white rounded-xl hover:bg-gray-700 active:bg-gray-900 border-2 border-gray-600 shadow-lg outline-none focus:outline-none"
      style={{ 
        fontSize: 'clamp(18px, 2vw, 24px)',
        fontFamily: "'Quicksand', sans-serif",
        fontWeight: 600
      }}
    >
      Double-tap to exit
    </button>
  );
}

export default MainView;

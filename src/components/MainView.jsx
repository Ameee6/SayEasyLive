import { useState, useRef } from 'react';
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

function MainView({ cards, leftButtons = defaultLeftButtons, voicePreference, onExitFullscreen }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0); // Real-time drag position
  const [startY, setStartY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const velocityRef = useRef(0);
  const lastTouchTimeRef = useRef(0);
  const lastTouchYRef = useRef(0);
  const animationRef = useRef(null);

  const handleSpeak = (text) => {
    speak(text, voicePreference);
  };

  // Get card color by index, cycling through the palette
  const getCardColor = (index) => {
    return CARD_COLORS[index % CARD_COLORS.length];
  };

  // Smooth momentum-based settle animation
  const animateSettle = (initialVelocity, initialOffset) => {
    const friction = 0.92; // Deceleration factor
    const minVelocity = 0.5; // Stop when velocity is very low
    const cardHeight = window.innerHeight; // Full screen card height
    
    let velocity = initialVelocity;
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
        return;
      }
      
      // Check boundaries - if offset exceeds threshold, trigger card change
      if (offset > cardHeight * 0.5) {
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
        setDragOffset(0);
        setIsAnimating(false);
        return;
      } else if (offset < -cardHeight * 0.5) {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
        setDragOffset(0);
        setIsAnimating(false);
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
      velocityRef.current = (currentY - lastTouchYRef.current) / deltaTime * 16; // Normalize to ~60fps
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
      velocityRef.current = (currentY - lastTouchYRef.current) / deltaTime * 16;
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
    } else if (e.deltaY < 0) {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }
  };

  // Get current, previous, and next cards
  const currentCard = cards[currentIndex];
  const prevCard = cards[(currentIndex - 1 + cards.length) % cards.length];
  const nextCard = cards[(currentIndex + 1) % cards.length];

  return (
    <div className="w-screen h-screen flex flex-col relative bg-white no-select" style={{ touchAction: 'none' }}>
      {/* Double-tap to exit button */}
      <DoubleTapExit onExit={onExitFullscreen} />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - 1/3 width */}
        <div className="w-1/3 flex flex-col border-r-8 border-black">
          {/* Top button - More/Yes */}
          <button
            onClick={() => handleSpeak(leftButtons.top.speakText)}
            className="flex-1 flex flex-col items-center justify-center bg-green-300 hover:bg-green-400 active:bg-green-500 border-b-8 border-black transition-colors outline-none focus:outline-none"
            style={{ minHeight: '72px' }}
          >
            <div className="text-[12rem] mb-6 leading-none">{leftButtons.top.emoji}</div>
            <div className="text-7xl font-bold text-black px-4 text-center leading-tight">
              {leftButtons.top.label}
            </div>
          </button>

          {/* Bottom button - All Done/No */}
          <button
            onClick={() => handleSpeak(leftButtons.bottom.speakText)}
            className="flex-1 flex flex-col items-center justify-center bg-red-300 hover:bg-red-400 active:bg-red-500 transition-colors outline-none focus:outline-none"
            style={{ minHeight: '72px' }}
          >
            <div className="text-[12rem] mb-6 leading-none">{leftButtons.bottom.emoji}</div>
            <div className="text-7xl font-bold text-black px-4 text-center leading-tight">
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
          {/* Full-screen cards - one at a time, slides in/out */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              transform: isDragging || isAnimating ? `translateY(${dragOffset}px)` : 'translateY(0)',
              transition: isDragging || isAnimating ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          >
            {/* Previous card (above current) */}
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-12"
                 style={{ transform: 'translateY(-100%)', backgroundColor: getCardColor((currentIndex - 1 + cards.length) % cards.length) }}>
              <button className="w-[500px] h-[500px] rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-2xl pointer-events-none">
                <div className="text-[18rem] leading-none">{prevCard.emoji}</div>
              </button>
              <div className="text-9xl font-black text-white text-center drop-shadow-2xl px-8 my-12">{prevCard.label}</div>
            </div>

            {/* Current card - full screen */}
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-12"
                 style={{ backgroundColor: getCardColor(currentIndex) }}>

              {/* Huge tappable emoji circle - 25% bigger */}
              <button
                onClick={() => handleSpeak(currentCard.speakText)}
                className="w-[500px] h-[500px] rounded-full bg-white/95 backdrop-blur flex items-center justify-center outline-none focus:outline-none transform active:scale-95 transition-all shadow-2xl"
                style={{ touchAction: 'manipulation' }}
              >
                <div className="text-[18rem] leading-none">{currentCard.emoji}</div>
              </button>

              {/* Title/Label */}
              <div className="text-9xl font-black text-white text-center drop-shadow-2xl px-8 my-12">
                {currentCard.label}
              </div>
            </div>

            {/* Next card (below current) */}
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-12"
                 style={{ transform: 'translateY(100%)', backgroundColor: getCardColor((currentIndex + 1) % cards.length) }}>
              <button className="w-[500px] h-[500px] rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-2xl pointer-events-none">
                <div className="text-[18rem] leading-none">{nextCard.emoji}</div>
              </button>
              <div className="text-9xl font-black text-white text-center drop-shadow-2xl px-8 my-12">{nextCard.label}</div>
            </div>
          </div>

          {/* Position dots */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
            {cards.map((_, idx) => (
              <div
                key={idx}
                className={`rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-10 h-10 bg-white scale-110 shadow-lg'
                    : 'w-7 h-7 bg-white/50'
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
      className="absolute top-4 right-4 z-50 px-6 py-3 bg-gray-800 text-white text-lg rounded-lg hover:bg-gray-700 active:bg-gray-900 border-2 border-gray-600 shadow-lg outline-none focus:outline-none"
    >
      Double-tap to exit
    </button>
  );
}

export default MainView;

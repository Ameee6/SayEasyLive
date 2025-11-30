import { useState, useRef, useEffect } from 'react';
import { speak } from '../utils/speech';
import { defaultLeftButtons } from '../data/defaultCards';

function MainView({ cards, leftButtons = defaultLeftButtons, voicePreference, onExitFullscreen }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0); // Real-time drag position
  const [startY, setStartY] = useState(0);
  const snapThreshold = 80; // pixels to snap to next card

  const handleSpeak = (text) => {
    speak(text, voicePreference);
  };

  // Touch handlers - real-time following
  const handleTouchStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY;
    setDragOffset(deltaY);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    if (!isDragging) return;

    // Determine which card to snap to
    if (dragOffset > snapThreshold) {
      // Dragged down - go to previous card
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    } else if (dragOffset < -snapThreshold) {
      // Dragged up - go to next card
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }

    setIsDragging(false);
    setDragOffset(0);
    setStartY(0);
  };

  // Mouse handlers - real-time following
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartY(e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY;
    setDragOffset(deltaY);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    // Determine which card to snap to
    if (dragOffset > snapThreshold) {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    } else if (dragOffset < -snapThreshold) {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }

    setIsDragging(false);
    setDragOffset(0);
    setStartY(0);
  };

  // Wheel handler
  const handleWheel = (e) => {
    e.preventDefault();
    if (isDragging) return;

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

  // Vibrant gradient backgrounds for each card
  const cardGradients = [
    'from-purple-400 to-pink-400',
    'from-pink-400 to-rose-400',
    'from-blue-400 to-cyan-400',
    'from-yellow-300 to-orange-400',
    'from-orange-400 to-red-400',
    'from-teal-400 to-green-400',
    'from-rose-400 to-pink-500',
    'from-cyan-400 to-blue-500',
    'from-lime-400 to-green-500',
    'from-fuchsia-400 to-purple-500'
  ];

  // Background colors (lighter versions for panel background)
  const bgColors = [
    'bg-purple-200',
    'bg-pink-200',
    'bg-blue-200',
    'bg-yellow-100',
    'bg-orange-200',
    'bg-teal-200',
    'bg-rose-200',
    'bg-cyan-200',
    'bg-lime-200',
    'bg-fuchsia-200'
  ];

  const bgColor = bgColors[currentIndex % bgColors.length];

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

        {/* Right Panel - 2/3 width - Smooth scrolling cards */}
        <div
          className={`w-2/3 flex items-center justify-center overflow-hidden relative transition-colors duration-700 ${bgColor}`}
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
          {/* Cards container - moves with drag */}
          <div
            className="relative w-full h-full flex flex-col items-center justify-center"
            style={{
              transform: isDragging ? `translateY(${dragOffset}px)` : 'translateY(0)',
              transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Previous card (peeking from top) */}
            <div
              className="absolute top-0 opacity-30 scale-90"
              style={{ transform: 'translateY(-85%)' }}
            >
              <Card card={prevCard} gradient={cardGradients[(currentIndex - 1 + cards.length) % cardGradients.length]} onSpeak={handleSpeak} isPeek />
            </div>

            {/* Current card */}
            <div className="relative z-10">
              <Card card={currentCard} gradient={cardGradients[currentIndex % cardGradients.length]} onSpeak={handleSpeak} />
            </div>

            {/* Next card (peeking from bottom) */}
            <div
              className="absolute bottom-0 opacity-30 scale-90"
              style={{ transform: 'translateY(85%)' }}
            >
              <Card card={nextCard} gradient={cardGradients[(currentIndex + 1) % cardGradients.length]} onSpeak={handleSpeak} isPeek />
            </div>
          </div>

          {/* Position dots */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
            {cards.map((_, idx) => (
              <div
                key={idx}
                className={`rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-8 h-8 bg-black scale-110'
                    : 'w-6 h-6 bg-gray-700 opacity-50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Card component - modern, playful design
function Card({ card, gradient, onSpeak, isPeek = false }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-[3rem] shadow-2xl p-8 flex flex-col items-center w-[85vw] md:w-[50vw] max-w-2xl ${isPeek ? 'pointer-events-none' : ''}`}>

      {/* UP arrow - smaller, cleaner */}
      {!isPeek && (
        <div className="text-6xl font-bold text-white/80 mb-6 drop-shadow-lg">
          ↑
        </div>
      )}

      {/* Tappable emoji button - HUGE */}
      <button
        onClick={() => !isPeek && onSpeak(card.speakText)}
        className="w-72 h-72 md:w-80 md:h-80 rounded-full bg-white/90 backdrop-blur flex items-center justify-center outline-none focus:outline-none transform active:scale-95 transition-all shadow-2xl mb-8"
        style={{ touchAction: 'manipulation' }}
        disabled={isPeek}
      >
        <div className="text-[14rem] leading-none">{card.emoji}</div>
      </button>

      {/* Label - big and bold */}
      <div className="text-7xl font-black text-white text-center mb-6 drop-shadow-lg px-6">
        {card.label}
      </div>

      {/* DOWN arrow - smaller, cleaner */}
      {!isPeek && (
        <div className="text-6xl font-bold text-white/80 mt-2 drop-shadow-lg">
          ↓
        </div>
      )}
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

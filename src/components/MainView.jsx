import { useState, useRef, useEffect } from 'react';
import { speak } from '../utils/speech';
import { defaultLeftButtons } from '../data/defaultCards';

function MainView({ cards, leftButtons = defaultLeftButtons, voicePreference, onExitFullscreen }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const dragThreshold = 50; // pixels to trigger flip

  const handleSpeak = (text) => {
    speak(text, voicePreference);
  };

  // Touch/drag handlers for the rolodex
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    const deltaY = startY - currentY;

    if (Math.abs(deltaY) > dragThreshold) {
      if (deltaY > 0) {
        // Swipe up - next item
        setCurrentIndex((prev) => (prev + 1) % cards.length);
      } else {
        // Swipe down - previous item
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
      }
    }

    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  // Mouse handlers for desktop testing
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setCurrentY(e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setCurrentY(e.clientY);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    const deltaY = startY - currentY;

    if (Math.abs(deltaY) > dragThreshold) {
      if (deltaY > 0) {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
      } else {
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
      }
    }

    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="w-screen h-screen flex flex-col relative bg-white no-select">
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

        {/* Right Panel - 2/3 width - Rolodex */}
        <div
          className="w-2/3 flex items-center justify-center bg-blue-50 overflow-hidden relative cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Current card */}
          <div className="flex flex-col items-center justify-center p-8 max-w-2xl w-full">
            {/* Tappable circle with emoji/icon */}
            <button
              onClick={() => handleSpeak(currentCard.speakText)}
              className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-white border-8 border-black flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors mb-8 shadow-2xl outline-none focus:outline-none"
              style={{ minHeight: '72px', minWidth: '72px' }}
            >
              <div className="text-9xl">{currentCard.emoji}</div>
            </button>

            {/* Label */}
            <div className="text-6xl font-bold text-black text-center mb-8">
              {currentCard.label}
            </div>

            {/* Visual indicator of position */}
            <div className="flex gap-3">
              {cards.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'bg-blue-600 scale-125'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Swipe hint */}
            <div className="mt-8 text-gray-500 text-2xl">
              ↕ Swipe to browse
            </div>
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

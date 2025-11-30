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
    e.preventDefault(); // Prevent iOS gestures
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // Prevent iOS gestures
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault(); // Prevent iOS gestures
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

  // Wheel/scroll handler for desktop
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      // Scroll down - next item
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    } else if (e.deltaY < 0) {
      // Scroll up - previous item
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }
  };

  const currentCard = cards[currentIndex];

  // Bright distinct colors for each card (TikTok-style)
  const cardColors = [
    'bg-purple-300',
    'bg-pink-300',
    'bg-blue-300',
    'bg-yellow-300',
    'bg-orange-300',
    'bg-teal-300',
    'bg-rose-300',
    'bg-cyan-300',
    'bg-lime-300',
    'bg-fuchsia-300'
  ];

  const cardColor = cardColors[currentIndex % cardColors.length];

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

        {/* Right Panel - 2/3 width - TikTok-style full-screen cards */}
        <div
          className={`w-2/3 flex items-center justify-center overflow-hidden relative transition-colors ${cardColor}`}
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
          {/* Full-screen card - TikTok style */}
          <div className="flex flex-col items-center justify-center w-full h-full p-12">
            {/* Huge emoji */}
            <button
              onClick={() => handleSpeak(currentCard.speakText)}
              className="flex items-center justify-center mb-12 outline-none focus:outline-none transform hover:scale-105 active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation' }}
            >
              <div className="text-[20rem] leading-none drop-shadow-2xl">{currentCard.emoji}</div>
            </button>

            {/* Huge label */}
            <div className="text-8xl font-black text-black text-center mb-12 drop-shadow-lg px-8">
              {currentCard.label}
            </div>

            {/* Visual indicator of position */}
            <div className="flex gap-4 mb-8">
              {cards.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-5 h-5 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'bg-black scale-150'
                      : 'bg-gray-600 opacity-40'
                  }`}
                />
              ))}
            </div>

            {/* Swipe hint */}
            <div className="text-gray-700 text-3xl font-bold">
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

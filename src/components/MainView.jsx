import { useState, useRef, useEffect } from 'react';
import { speak } from '../utils/speech';
import { defaultLeftButtons } from '../data/defaultCards';

function MainView({ cards, leftButtons = defaultLeftButtons, voicePreference, onExitFullscreen }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [slideDirection, setSlideDirection] = useState(null); // 'up' or 'down'
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
        setSlideDirection('up');
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % cards.length);
          setSlideDirection(null);
        }, 300);
      } else {
        // Swipe down - previous item
        setSlideDirection('down');
        setTimeout(() => {
          setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
          setSlideDirection(null);
        }, 300);
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
        setSlideDirection('up');
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % cards.length);
          setSlideDirection(null);
        }, 300);
      } else {
        setSlideDirection('down');
        setTimeout(() => {
          setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
          setSlideDirection(null);
        }, 300);
      }
    }

    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  // Wheel/scroll handler for desktop
  const handleWheel = (e) => {
    e.preventDefault();
    if (slideDirection) return; // Prevent rapid scrolling during animation

    if (e.deltaY > 0) {
      // Scroll down - next item
      setSlideDirection('up');
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
        setSlideDirection(null);
      }, 300);
    } else if (e.deltaY < 0) {
      // Scroll up - previous item
      setSlideDirection('down');
      setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
        setSlideDirection(null);
      }, 300);
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

        {/* Right Panel - 2/3 width - Card slider */}
        <div
          className={`w-2/3 flex items-center justify-center overflow-hidden relative transition-colors duration-500 ${cardColor}`}
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
          {/* Card with slide animation */}
          <div
            className={`flex flex-col items-center justify-center w-full h-full p-12 transition-transform duration-300 ease-out ${
              slideDirection === 'up' ? '-translate-y-full opacity-0' :
              slideDirection === 'down' ? 'translate-y-full opacity-0' :
              'translate-y-0 opacity-100'
            }`}
          >
            {/* Picture frame card */}
            <div className="bg-white rounded-3xl border-8 border-black shadow-2xl p-12 flex flex-col items-center max-w-3xl">

              {/* Giant UP arrow */}
              <div className="text-9xl font-black text-gray-700 mb-8 animate-bounce">
                ↑
              </div>

              {/* Tappable emoji circle */}
              <button
                onClick={() => handleSpeak(currentCard.speakText)}
                className="w-80 h-80 rounded-full bg-gradient-to-br from-white to-gray-100 border-8 border-black flex items-center justify-center outline-none focus:outline-none transform hover:scale-105 active:scale-95 transition-all shadow-xl mb-8"
                style={{ touchAction: 'manipulation' }}
              >
                <div className="text-[16rem] leading-none">{currentCard.emoji}</div>
              </button>

              {/* Label/Title */}
              <div className="text-8xl font-black text-black text-center mb-8 px-8">
                {currentCard.label}
              </div>

              {/* Giant DOWN arrow */}
              <div className="text-9xl font-black text-gray-700 mt-4 animate-bounce" style={{ animationDelay: '150ms' }}>
                ↓
              </div>
            </div>

            {/* Position dots */}
            <div className="flex gap-4 mt-12">
              {cards.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-6 h-6 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'bg-black scale-150'
                      : 'bg-gray-600 opacity-40'
                  }`}
                />
              ))}
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

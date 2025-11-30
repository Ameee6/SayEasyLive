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
              transform: isDragging ? `translateY(${dragOffset}px)` : 'translateY(0)',
              transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          >
            {/* Previous card (above current) */}
            <div className={`absolute inset-0 w-full h-full bg-gradient-to-br ${cardGradients[(currentIndex - 1 + cards.length) % cardGradients.length]} flex flex-col items-center justify-center p-12`}
                 style={{ transform: 'translateY(-100%)' }}>
              <div className="text-[12rem] font-black text-yellow-300 mb-auto mt-12 drop-shadow-2xl animate-pulse">↑</div>
              <button className="w-[500px] h-[500px] rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-2xl pointer-events-none">
                <div className="text-[18rem] leading-none">{prevCard.emoji}</div>
              </button>
              <div className="text-9xl font-black text-white text-center drop-shadow-2xl px-8 my-12">{prevCard.label}</div>
              <div className="text-[12rem] font-black text-yellow-300 mb-12 mt-auto drop-shadow-2xl animate-pulse">↓</div>
            </div>

            {/* Current card - full screen */}
            <div className={`absolute inset-0 w-full h-full bg-gradient-to-br ${cardGradients[currentIndex % cardGradients.length]} flex flex-col items-center justify-center p-12`}>

              {/* UP arrow - huge and colorful */}
              <div className="text-[12rem] font-black text-yellow-300 mb-auto mt-12 drop-shadow-2xl animate-pulse">
                ↑
              </div>

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

              {/* DOWN arrow - huge and colorful */}
              <div className="text-[12rem] font-black text-yellow-300 mb-12 mt-auto drop-shadow-2xl animate-pulse">
                ↓
              </div>
            </div>

            {/* Next card (below current) */}
            <div className={`absolute inset-0 w-full h-full bg-gradient-to-br ${cardGradients[(currentIndex + 1) % cardGradients.length]} flex flex-col items-center justify-center p-12`}
                 style={{ transform: 'translateY(100%)' }}>
              <div className="text-[12rem] font-black text-yellow-300 mb-auto mt-12 drop-shadow-2xl animate-pulse">↑</div>
              <button className="w-[500px] h-[500px] rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-2xl pointer-events-none">
                <div className="text-[18rem] leading-none">{nextCard.emoji}</div>
              </button>
              <div className="text-9xl font-black text-white text-center drop-shadow-2xl px-8 my-12">{nextCard.label}</div>
              <div className="text-[12rem] font-black text-yellow-300 mb-12 mt-auto drop-shadow-2xl animate-pulse">↓</div>
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

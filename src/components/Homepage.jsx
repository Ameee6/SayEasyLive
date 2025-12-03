import { useRef, useEffect } from 'react';
import AuthButton from './AuthButton';

function Homepage({ onNavigateToSettings, onNavigateToMain, user, userProfile, userTier }) {
  const highlightTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const scrollToSetupTips = () => {
    const element = document.getElementById('caregiver-setup-tips');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      element.classList.add('ring-2', 'ring-yellow-400');
      highlightTimeoutRef.current = setTimeout(() => {
        element.classList.remove('ring-2', 'ring-yellow-400');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col scrollable-page">
      {/* Device Info Banner */}
      <div className="bg-blue-900/80 border-b border-blue-700 px-4 py-3 text-center flex-shrink-0">
        <p className="text-sm md:text-base text-blue-100">
          <span className="font-semibold">📱 SayEasy</span> is designed for tablets and large touch screens. Card/button editing works on mobile, but main user experience is best on larger screens.
        </p>
      </div>

      {/* Top Banner with Logo */}
      <header className="bg-gradient-to-r from-purple-700 via-blue-600 to-purple-700 py-8 px-6 shadow-lg flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <h1 
            className="text-5xl md:text-6xl font-bold tracking-tight"
            style={{ fontFamily: "'Quicksand', sans-serif" }}
          >
            <span className="text-white">Say</span>
            <span className="text-yellow-300">Easy</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Welcome Message */}
          <section className="text-center py-8">
            <h2 
              className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              Welcome to SayEasy!
            </h2>
            <p 
              className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              Simple, Stable Communication Tools for All.
            </p>
          </section>

          {/* Info Cards Section - On mobile, "A Calm Space" shows first for immediate caregiver readability */}
          <section className="grid gap-8 md:grid-cols-2">
            
            {/* Safety & Stability Tools Card - Shows second on mobile (order-2), first on desktop (md:order-1) */}
            <div className="order-2 md:order-1 bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-700 hover:border-purple-500 transition-colors">
              <div className="flex items-center mb-6">
                <span className="text-4xl mr-4">🔒</span>
                <h3 
                  className="text-2xl md:text-3xl font-bold text-purple-300"
                  style={{ fontFamily: "'Quicksand', sans-serif" }}
                >
                  Safety & Stability Tools
                </h3>
              </div>
              <p className="text-lg text-gray-300 mb-6">
                Keep users focused and secure within SayEasy.
              </p>
              <ul className="space-y-4 text-lg">
                <li className="flex items-start">
                  <span className="text-green-400 text-2xl mr-3 flex-shrink-0">✓</span>
                  <div>
                    <span className="font-semibold text-white">Discreet "Double-Tap to Exit" Control</span>
                    <p className="text-gray-400 text-base mt-1">
                      Caregivers use a double-tap to exit, reducing unintended button presses.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 text-2xl mr-3 flex-shrink-0">✓</span>
                  <div>
                    <span className="font-semibold text-white">Use Your Device's "Lock to App" Feature</span>
                    <p className="text-gray-400 text-base mt-1">
                      <strong>iOS:</strong> Settings → Accessibility → Guided Access
                    </p>
                    <p className="text-gray-400 text-base mt-1">
                      <strong>Android:</strong> Settings → Security → App Pinning
                    </p>
                  </div>
                </li>
              </ul>
              <button
                onClick={scrollToSetupTips}
                className="mt-6 text-sm text-purple-300 hover:text-purple-200 underline underline-offset-2 transition-colors flex items-center gap-1"
              >
                <span>↓</span> See Caregiver Setup Tips
              </button>
            </div>

            {/* A Calm Space Card - Shows first on mobile (order-1), second on desktop (md:order-2) */}
            <div className="order-1 md:order-2 bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="flex items-center mb-6">
                <span className="text-4xl mr-4">💙</span>
                <h3 
                  className="text-2xl md:text-3xl font-bold text-blue-300"
                  style={{ fontFamily: "'Quicksand', sans-serif" }}
                >
                  A Calm Space for Communication
                </h3>
              </div>
              <p className="text-lg text-gray-300 mb-6">
                Built with accessibility and peace of mind at its core.
              </p>
              <ul className="space-y-4 text-lg">
                <li className="flex items-start">
                  <span className="text-blue-400 text-2xl mr-3 flex-shrink-0">•</span>
                  <span className="text-gray-200">Large, high-contrast buttons for easy touch</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 text-2xl mr-3 flex-shrink-0">•</span>
                  <span className="text-gray-200">Simple, distraction-free interface</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 text-2xl mr-3 flex-shrink-0">•</span>
                  <span className="text-gray-200">Clear voice output for each selection</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 text-2xl mr-3 flex-shrink-0">•</span>
                  <span className="text-gray-200">Customizable cards tailored to your needs</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Navigation Buttons */}
          <section className="py-8">
            <h3 
              className="text-2xl md:text-3xl font-bold text-center text-white mb-8"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              Get Started
            </h3>
            
            <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
              {/* Settings Dashboard - Primary CTA */}
              <button
                onClick={onNavigateToSettings}
                className="w-full p-6 md:p-8 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl shadow-lg hover:from-green-500 hover:to-green-400 transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-opacity-50"
              >
                <span className="text-4xl mb-4 block">⚙️</span>
                <span 
                  className="text-xl md:text-2xl font-bold text-white block"
                  style={{ fontFamily: "'Quicksand', sans-serif" }}
                >
                  Settings Dashboard
                </span>
                <span className="text-green-100 text-base mt-2 block">
                  Customize buttons, cards, and voice
                </span>
              </button>

              {/* Start Communication - Primary CTA */}
              <button
                onClick={onNavigateToMain}
                className="w-full p-6 md:p-8 bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl shadow-lg hover:from-purple-500 hover:to-blue-400 transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50"
              >
                <span className="text-4xl mb-4 block">🗣️</span>
                <span 
                  className="text-xl md:text-2xl font-bold text-white block"
                  style={{ fontFamily: "'Quicksand', sans-serif" }}
                >
                  Start Communication
                </span>
                <span className="text-purple-100 text-base mt-2 block">
                  Launch the main communication app
                </span>
              </button>
            </div>
          </section>

          {/* Caregiver Setup Tips */}
          <section 
            id="caregiver-setup-tips"
            className="bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-700 transition-all"
          >
            <div className="flex items-center mb-6">
              <span className="text-4xl mr-4">📋</span>
              <h3 
                className="text-2xl md:text-3xl font-bold text-green-300"
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                Caregiver Setup Tips
              </h3>
            </div>
            <p className="text-lg text-gray-300 mb-6">
              Quick essentials to get SayEasy ready for your user.
            </p>
            <ul className="space-y-4 text-lg">
              <li className="flex items-start">
                <span className="text-green-400 text-2xl mr-3 flex-shrink-0">1.</span>
                <div>
                  <span className="font-semibold text-white">Start Simple</span>
                  <p className="text-gray-400 text-base mt-1">
                    Begin with 2–3 scroll card buttons to keep it simple for users.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 text-2xl mr-3 flex-shrink-0">2.</span>
                <div>
                  <span className="font-semibold text-white">Enable Device Lock</span>
                  <p className="text-gray-400 text-base mt-1">
                    <strong>iOS:</strong> Settings → Accessibility → Guided Access
                  </p>
                  <p className="text-gray-400 text-base mt-1">
                    <strong>Android:</strong> Settings → Security → App Pinning
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 text-2xl mr-3 flex-shrink-0">3.</span>
                <div>
                  <span className="font-semibold text-white">Add to Home Screen (iOS)</span>
                  <p className="text-gray-400 text-base mt-1">
                    Safari → Share icon → Add to Home Screen. This reduces accidental swipes/taps out of the main communication app.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 text-2xl mr-3 flex-shrink-0">4.</span>
                <div>
                  <span className="font-semibold text-white">Upload Familiar Content</span>
                  <p className="text-gray-400 text-base mt-1">
                    Add images and phrases that are meaningful to your user for easier recognition.
                  </p>
                </div>
              </li>
            </ul>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-700 py-6 px-4 pb-8 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-400 text-center md:text-left">
            <span 
              className="font-bold text-white"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              SayEasy
            </span>
            <span className="mx-2">•</span>
            <span>Simple, Stable Communication</span>
          </div>
          <div className="flex gap-6 items-center">
            <a 
              href="https://ajamcodes.netlify.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Contact
            </a>
            <AuthButton 
              user={user}
              userProfile={userProfile}
              userTier={userTier}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Homepage;

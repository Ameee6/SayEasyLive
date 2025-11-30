function Homepage({ onNavigateToSettings, onNavigateToMain }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col scrollable-page">
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

          {/* Info Cards Section */}
          <section className="grid gap-8 md:grid-cols-2">
            
            {/* Staying in SayEasy Card */}
            <div className="bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-700 hover:border-purple-500 transition-colors">
              <div className="flex items-center mb-6">
                <span className="text-4xl mr-4">🔒</span>
                <h3 
                  className="text-2xl md:text-3xl font-bold text-purple-300"
                  style={{ fontFamily: "'Quicksand', sans-serif" }}
                >
                  Staying in SayEasy
                </h3>
              </div>
              <p className="text-lg text-gray-300 mb-6">
                Safety & Stability Tools
              </p>
              <ul className="space-y-4 text-lg">
                <li className="flex items-start">
                  <span className="text-green-400 text-2xl mr-3 flex-shrink-0">✓</span>
                  <div>
                    <span className="font-semibold text-white">Discreet "Double-Tap to Exit" Control</span>
                    <p className="text-gray-400 text-base mt-1">
                      Only caregivers know the quick double-tap exit gesture
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 text-2xl mr-3 flex-shrink-0">✓</span>
                  <div>
                    <span className="font-semibold text-white">Use Your Device's "Lock to App" Feature</span>
                    <p className="text-gray-400 text-base mt-1">
                      <strong>iOS:</strong> Settings → Accessibility → Guided Access<br />
                      <strong>Android:</strong> Settings → Security → App Pinning
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* A Calm Space Card */}
            <div className="bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-700 hover:border-blue-500 transition-colors">
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

            {/* Secondary Links */}
            <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto mt-8">
              <div className="p-5 bg-gray-800 rounded-xl border border-gray-700 text-center opacity-75">
                <span className="text-2xl mb-2 block">📋</span>
                <span className="text-lg font-semibold text-gray-300 block">Getting Started Checklist</span>
                <span className="text-sm text-gray-500 mt-1 block">Coming Soon</span>
              </div>
              
              <div className="p-5 bg-gray-800 rounded-xl border border-gray-700 text-center opacity-75">
                <span className="text-2xl mb-2 block">👥</span>
                <span className="text-lg font-semibold text-gray-300 block">Caregiver Guide</span>
                <span className="text-sm text-gray-500 mt-1 block">Coming Soon</span>
              </div>
              
              <div className="p-5 bg-gray-800 rounded-xl border border-gray-700 text-center opacity-75">
                <span className="text-2xl mb-2 block">❓</span>
                <span className="text-lg font-semibold text-gray-300 block">FAQ</span>
                <span className="text-sm text-gray-500 mt-1 block">Coming Soon</span>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-700 py-6 px-4">
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
          <div className="flex gap-6 text-gray-400">
            <span className="cursor-default" title="Coming soon">
              About
            </span>
            <span className="cursor-default" title="Coming soon">
              Help
            </span>
            <span className="cursor-default" title="Coming soon">
              Contact
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Homepage;

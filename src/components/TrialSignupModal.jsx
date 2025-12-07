// Note: No React hooks needed for this component

export default function TrialSignupModal({ onClose, onSignIn, onSignUp, onStartTrial, userProfile }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-200 transform max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ready for Custom Cards?
          </h2>
          <p className="text-gray-600">
            Unlock personalized communication with your 2-week free trial!
          </p>
        </div>

        {/* Current Plan */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 text-center">Your Current Plan</h3>
          <div className="space-y-2">
            <div className="flex items-center text-gray-700">
              <span className="text-green-500 mr-2">✓</span>
              2 main buttons (always customizable)
            </div>
            <div className="flex items-center text-gray-700">
              <span className="text-green-500 mr-2">✓</span>
              10 preset cards
            </div>
            <div className="flex items-center text-gray-400">
              <span className="text-gray-300 mr-2">✕</span>
              Custom scroll cards
            </div>
          </div>
        </div>

        {/* Trial Benefits */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-6 border border-blue-100">
          <h3 className="font-semibold text-gray-900 mb-3 text-center">Free Trial Includes</h3>
          <div className="space-y-2">
            <div className="flex items-center text-gray-700">
              <span className="text-blue-500 mr-2">✨</span>
              10 custom scroll cards with photos
            </div>
            <div className="flex items-center text-gray-700">
              <span className="text-blue-500 mr-2">✨</span>
              Real-time sync across devices
            </div>
          </div>
        </div>

        {/* No Payment Needed - Prominent */}
        <div className="text-center mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="text-lg font-bold text-green-700 mb-1">
            🎉 No Payment Info Needed to Start!
          </div>
          <div className="text-sm text-green-600">
            Try everything free for 2 weeks
          </div>
        </div>

        {/* Pricing - De-emphasized */}
        <div className="text-center mb-6">
          <div className="text-xs text-gray-400 mb-1">After trial ends:</div>
          <div className="text-lg font-semibold text-gray-700">$12.99/year</div>
          <div className="text-xs text-gray-400">Just $1.08/month • Cancel anytime</div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={userProfile ? onStartTrial : onSignUp}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Start Free Trial
          </button>
          
          <button
            onClick={onSignIn}
            className="w-full py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Already have an account? Sign In
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-light"
        >
          ×
        </button>

        {/* Trust indicators */}
        <div className="mt-8 pt-4 pb-2 border-t border-gray-100 text-center">
          <div className="text-xs text-gray-400">
            🔒 Secure • 📱 Mobile-friendly • ♿ Accessibility-focused
          </div>
        </div>
      </div>
    </div>
  );
}
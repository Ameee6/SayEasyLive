// SaveSettingsModal - Prompts non-logged-in users to save settings to account

export default function SaveSettingsModal({ onClose, onSaveToAccount, onStayLocal }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-200 transform max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Save Your Settings
          </h2>
          <p className="text-gray-600">
            Choose how you'd like to save your personalized communication setup
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4 mb-6">
          {/* Save to Account Option */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <span className="text-blue-500 mr-2">☁️</span>
              Save to Account (Recommended)
            </h3>
            <div className="text-sm text-gray-700 space-y-1">
              <div>• Access from any device (tablet, phone, computer)</div>
              <div>• Settings sync automatically</div>
              <div>• Never lose your customizations</div>
              <div>• Free account - no payment needed</div>
            </div>
          </div>

          {/* Stay Local Option */}
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <span className="text-yellow-500 mr-2">📱</span>
              Stay Local Only
            </h3>
            <div className="text-sm text-gray-700 space-y-1">
              <div>• Settings saved only on this device</div>
              <div>• ⚠️ May be lost if you clear browser data</div>
              <div>• ⚠️ Won't transfer to other devices</div>
              <div>• No sync between tablet and phone</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onSaveToAccount}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            💾 Create Account & Save Settings
          </button>
          
          <button
            onClick={onStayLocal}
            className="w-full py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors border border-gray-300 rounded-xl"
          >
            📱 Keep Settings Local Only
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-light"
        >
          ×
        </button>

        {/* Info note */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <div className="text-xs text-gray-500">
            💡 You can always create an account later to sync your settings
          </div>
        </div>
      </div>
    </div>
  );
}
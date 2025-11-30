import { useState, useEffect } from 'react';
import { defaultCards, defaultLeftButtons } from '../data/defaultCards';

function Settings({ settings, onSave, onBack }) {
  const [mode, setMode] = useState(settings.mode);
  const [voicePreference, setVoicePreference] = useState(settings.voicePreference);
  const [customCards, setCustomCards] = useState(
    settings.customCards.length > 0
      ? settings.customCards
      : Array(7).fill(null).map((_, i) => ({
          id: i + 1,
          label: '',
          emoji: '😊',
          speakText: ''
        }))
  );
  const [numCards, setNumCards] = useState(settings.customCards.length || 7);

  const handleAddCard = () => {
    if (customCards.length < 10) {
      setCustomCards([
        ...customCards,
        {
          id: customCards.length + 1,
          label: '',
          emoji: '😊',
          speakText: ''
        }
      ]);
      setNumCards(customCards.length + 1);
    }
  };

  const handleRemoveCard = (index) => {
    if (customCards.length > 1) {
      const newCards = customCards.filter((_, i) => i !== index);
      setCustomCards(newCards);
      setNumCards(newCards.length);
    }
  };

  const handleCardChange = (index, field, value) => {
    const newCards = [...customCards];
    newCards[index] = { ...newCards[index], [field]: value };
    // Auto-populate speakText if empty
    if (field === 'label' && !newCards[index].speakText) {
      newCards[index].speakText = value;
    }
    setCustomCards(newCards);
  };

  const handleSave = () => {
    const newSettings = {
      mode,
      voicePreference,
      customCards: mode === 'custom' ? customCards : [],
      customLeftButtons: null // Future feature
    };
    onSave(newSettings);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">SayEasy Settings</h1>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-semibold"
          >
            ← Back to App
          </button>
        </div>

        {/* Voice Preference */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Voice Preference</h2>
          <div className="flex gap-4">
            {['neutral', 'boy', 'girl'].map((voice) => (
              <button
                key={voice}
                onClick={() => setVoicePreference(voice)}
                className={`px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
                  voicePreference === voice
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                }`}
              >
                {voice.charAt(0).toUpperCase() + voice.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Mode Selection */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Card Set</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setMode('default')}
              className={`flex-1 p-6 rounded-lg text-lg font-medium transition-colors ${
                mode === 'default'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-400'
              }`}
            >
              <div className="text-2xl font-bold mb-2">Default Set</div>
              <div className="text-sm opacity-90">7 preset cards (TV, Floor, Play, etc.)</div>
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`flex-1 p-6 rounded-lg text-lg font-medium transition-colors ${
                mode === 'custom'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
              }`}
            >
              <div className="text-2xl font-bold mb-2">Custom Set</div>
              <div className="text-sm opacity-90">Create your own cards (up to 10)</div>
            </button>
          </div>
        </div>

        {/* Custom Cards Editor */}
        {mode === 'custom' && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-700">Custom Cards</h2>
              {customCards.length < 10 && (
                <button
                  onClick={handleAddCard}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  + Add Card
                </button>
              )}
            </div>

            <div className="space-y-4">
              {customCards.map((card, index) => (
                <div key={index} className="flex gap-4 items-start p-4 bg-white rounded-lg border-2 border-gray-200">
                  <div className="flex-shrink-0 text-gray-500 font-bold text-lg pt-2">
                    #{index + 1}
                  </div>

                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Label
                      </label>
                      <input
                        type="text"
                        value={card.label}
                        onChange={(e) => handleCardChange(index, 'label', e.target.value)}
                        placeholder="e.g., TV"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emoji
                      </label>
                      <input
                        type="text"
                        value={card.emoji}
                        onChange={(e) => handleCardChange(index, 'emoji', e.target.value)}
                        placeholder="📺"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Voice Text
                      </label>
                      <input
                        type="text"
                        value={card.speakText}
                        onChange={(e) => handleCardChange(index, 'speakText', e.target.value)}
                        placeholder="What to say"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {customCards.length > 1 && (
                    <button
                      onClick={() => handleRemoveCard(index)}
                      className="flex-shrink-0 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 mt-6"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Default Cards Preview */}
        {mode === 'default' && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Default Cards Preview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {defaultCards.map((card) => (
                <div
                  key={card.id}
                  className="p-4 bg-white rounded-lg border-2 border-gray-200 text-center"
                >
                  <div className="text-4xl mb-2">{card.emoji}</div>
                  <div className="font-medium text-gray-800">{card.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onBack}
            className="px-8 py-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-xl font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xl font-semibold"
          >
            Save & Close
          </button>
        </div>

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
          <p className="text-gray-700">
            <strong>Tip:</strong> The app works in fullscreen mode for the best experience.
            Use "Double-tap to exit" to return to settings when helping your client.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;

// Web Speech API utilities

let speechSynthesis = null;
let voices = [];

// Initialize speech synthesis
export const initSpeech = () => {
  if ('speechSynthesis' in window) {
    speechSynthesis = window.speechSynthesis;

    // Load voices (may need to wait for them to load)
    const loadVoices = () => {
      voices = speechSynthesis.getVoices();
    };

    loadVoices();

    // Chrome loads voices asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return true;
  }
  return false;
};

// Get available voices categorized by type
export const getVoices = () => {
  const allVoices = speechSynthesis ? speechSynthesis.getVoices() : [];

  // Categorize voices (this is approximate - actual voice characteristics vary)
  const categorized = {
    boy: [],
    girl: [],
    neutral: []
  };

  allVoices.forEach(voice => {
    const name = voice.name.toLowerCase();
    const lang = voice.lang.toLowerCase();

    // Prioritize English voices
    if (!lang.startsWith('en')) return;

    // Categorize based on voice name patterns
    if (name.includes('male') && !name.includes('female')) {
      categorized.boy.push(voice);
    } else if (name.includes('female')) {
      categorized.girl.push(voice);
    } else {
      categorized.neutral.push(voice);
    }
  });

  // Fallback: if categories are empty, distribute available voices
  if (categorized.boy.length === 0 && categorized.girl.length === 0) {
    allVoices.forEach((voice, idx) => {
      if (voice.lang.toLowerCase().startsWith('en')) {
        if (idx % 3 === 0) categorized.boy.push(voice);
        else if (idx % 3 === 1) categorized.girl.push(voice);
        else categorized.neutral.push(voice);
      }
    });
  }

  return categorized;
};

// Speak text with selected voice preference
export const speak = (text, voicePreference = 'neutral') => {
  if (!speechSynthesis) return;

  // Cancel any ongoing speech
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9; // Slightly slower for clarity
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Select voice based on preference
  const voiceOptions = getVoices();
  const preferredVoices = voiceOptions[voicePreference] || [];

  if (preferredVoices.length > 0) {
    utterance.voice = preferredVoices[0];
  }

  speechSynthesis.speak(utterance);
};

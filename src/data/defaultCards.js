// Default card configuration

export const defaultLeftButtons = {
  top: {
    label: 'More/Yes',
    emoji: '👏',
    speakText: 'More, Yes'
  },
  bottom: {
    label: 'All Done/No',
    emoji: '🛑',
    speakText: 'All Done, No'
  }
};

// 10 preset cards for free tier
// Note: 'Drums' has isInteractive flag to show "(Interactive!)" label
export const presetCards = [
  {
    id: 'preset-tv',
    label: 'TV',
    emoji: '📺',
    speakText: 'TV',
    isPreset: true,
    imageId: null
  },
  {
    id: 'preset-play',
    label: 'Play',
    emoji: '🧱',
    speakText: 'Play',
    isPreset: true,
    imageId: null
  },
  {
    id: 'preset-drums',
    label: 'Drums',
    emoji: '🥁',
    speakText: 'Drums',
    isPreset: true,
    isInteractive: true,
    imageId: null
  },
  {
    id: 'preset-read',
    label: 'Read',
    emoji: '📖',
    speakText: 'Read',
    isPreset: true,
    imageId: null
  },
  {
    id: 'preset-bathroom',
    label: 'Bathroom',
    emoji: '🚽',
    speakText: 'Bathroom',
    isPreset: true,
    imageId: null
  },
  {
    id: 'preset-eat',
    label: 'Eat',
    emoji: '🍽️',
    speakText: 'Eat',
    isPreset: true,
    imageId: null
  },
  {
    id: 'preset-drink',
    label: 'Drink',
    emoji: '🥤',
    speakText: 'Drink',
    isPreset: true,
    imageId: null
  },
  {
    id: 'preset-outside',
    label: 'Outside',
    emoji: '🌳',
    speakText: 'Outside',
    isPreset: true,
    imageId: null
  },
  {
    id: 'preset-brush-hair',
    label: 'Brush Hair',
    emoji: '🪮',
    speakText: 'Brush Hair',
    isPreset: true,
    imageId: null
  },
  {
    id: 'preset-back-scratch',
    label: 'Back Scratch',
    emoji: '🤚',
    speakText: 'Back Scratch',
    isPreset: true,
    imageId: null
  }
];

// Legacy defaultCards - kept for backward compatibility
export const defaultCards = [
  {
    id: 1,
    label: 'TV',
    emoji: '📺',
    speakText: 'TV'
  },
  {
    id: 2,
    label: 'Floor',
    emoji: '🧘',
    speakText: 'Floor'
  },
  {
    id: 3,
    label: 'Play',
    emoji: '🧸',
    speakText: 'Play'
  },
  {
    id: 4,
    label: 'Read',
    emoji: '📖',
    speakText: 'Read'
  },
  {
    id: 5,
    label: 'Stand',
    emoji: '⬆️',
    speakText: 'Stand'
  },
  {
    id: 6,
    label: 'Do Hair',
    emoji: '💇‍♀️',
    speakText: 'Do Hair'
  },
  {
    id: 7,
    label: 'Back Rub',
    emoji: '🤲',
    speakText: 'Back Rub'
  }
];

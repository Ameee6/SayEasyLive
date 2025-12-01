// Drum sounds utility using Web Audio API
// Generates simple percussive sounds without external audio files

let audioContext = null;

// Initialize audio context (must be called after user interaction)
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume context if it's suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

// Create a kick drum sound (deep bass thump)
export const playKick = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Oscillator for the tone
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

  gainNode.gain.setValueAtTime(1, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.4);
};

// Create a snare drum sound (short, punchy with noise)
export const playSnare = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Noise component (white noise for the "snap")
  const bufferSize = ctx.sampleRate * 0.2; // 200ms of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 1000;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.8, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noise.start(now);

  // Tone component (adds body to the snare)
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

  oscGain.gain.setValueAtTime(0.7, now);
  oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);
};

// Create a hi-hat sound (bright, metallic)
export const playHiHat = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Create noise
  const bufferSize = ctx.sampleRate * 0.1; // 100ms of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  // Bandpass filter for metallic sound
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 10000;
  bandpass.Q.value = 1;

  // High pass for brightness
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 7000;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.4, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

  noise.connect(bandpass);
  bandpass.connect(highpass);
  highpass.connect(gainNode);
  gainNode.connect(ctx.destination);

  noise.start(now);
};

// Drum configurations with colors and sounds
export const DRUM_CONFIGS = [
  {
    id: 'kick',
    label: 'BOOM',
    emoji: '🥁',
    color: '#EF4444', // Red
    playSound: playKick,
  },
  {
    id: 'snare',
    label: 'SNAP',
    emoji: '🪘',
    color: '#3B82F6', // Blue
    playSound: playSnare,
  },
  {
    id: 'hihat',
    label: 'TSS',
    emoji: '🔔',
    color: '#FACC15', // Yellow
    playSound: playHiHat,
  },
];

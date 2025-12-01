// Drum sounds utility using Web Audio API
// Generates simple percussive sounds without external audio files

let audioContext = null;

// Sound configuration constants
const KICK_START_FREQ = 150;      // Hz - starting frequency for kick
const KICK_END_FREQ = 40;         // Hz - ending frequency for kick
const KICK_PITCH_DECAY = 0.15;    // seconds - pitch drop duration
const KICK_DURATION = 0.4;        // seconds - total kick duration

const SNARE_NOISE_DURATION = 0.2; // seconds - noise component duration
const SNARE_FILTER_FREQ = 1000;   // Hz - highpass filter frequency
const SNARE_TONE_START = 180;     // Hz - tone component start frequency
const SNARE_TONE_END = 80;        // Hz - tone component end frequency
const SNARE_TONE_DECAY = 0.1;     // seconds - tone decay duration

const HIHAT_NOISE_DURATION = 0.1; // seconds - noise component duration
const HIHAT_BANDPASS_FREQ = 10000; // Hz - bandpass filter center frequency
const HIHAT_HIGHPASS_FREQ = 7000;  // Hz - highpass filter frequency
const HIHAT_DECAY = 0.08;          // seconds - decay duration

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
  osc.frequency.setValueAtTime(KICK_START_FREQ, now);
  osc.frequency.exponentialRampToValueAtTime(KICK_END_FREQ, now + KICK_PITCH_DECAY);

  gainNode.gain.setValueAtTime(1, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + KICK_DURATION);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + KICK_DURATION);
};

// Create a snare drum sound (short, punchy with noise)
export const playSnare = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Noise component (white noise for the "snap")
  const bufferSize = ctx.sampleRate * SNARE_NOISE_DURATION;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = SNARE_FILTER_FREQ;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.8, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + SNARE_NOISE_DURATION);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noise.start(now);

  // Tone component (adds body to the snare)
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(SNARE_TONE_START, now);
  osc.frequency.exponentialRampToValueAtTime(SNARE_TONE_END, now + SNARE_TONE_DECAY);

  oscGain.gain.setValueAtTime(0.7, now);
  oscGain.gain.exponentialRampToValueAtTime(0.01, now + SNARE_TONE_DECAY);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + SNARE_NOISE_DURATION);
};

// Create a hi-hat sound (bright, metallic)
export const playHiHat = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Create noise
  const bufferSize = ctx.sampleRate * HIHAT_NOISE_DURATION;
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
  bandpass.frequency.value = HIHAT_BANDPASS_FREQ;
  bandpass.Q.value = 1;

  // High pass for brightness
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = HIHAT_HIGHPASS_FREQ;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.4, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + HIHAT_DECAY);

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

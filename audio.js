/**
 * Web Audio API procedurally synthesized sound effects and lo-fi BGM.
 */

let audioCtx = null;
let bgmInterval = null;
let bgmNodes = [];
let isBgmPlaying = false;

// Chord progression for lo-fi background BGM (A minor, F major, C major, G major pentatonic pads)
const bgmChords = [
  [220.00, 261.63, 329.63, 392.00], // Am7
  [174.61, 261.63, 329.63, 440.00], // Fmaj7
  [261.63, 329.63, 392.00, 493.88], // Cmaj7
  [196.00, 293.66, 392.00, 440.00]  // G6
];

function initAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

/**
 * 1. 🧻 Paper Ball Thud: Low frequency short damp thump.
 */
function playThud() {
  initAudioContext();
  if (!audioCtx) return;

  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(180, t);

  gain.gain.setValueAtTime(0.35, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(t);
  osc.stop(t + 0.2);
}

/**
 * 2. 🔨 Toy Squeaky Hammer: Squeak pitch sweeps up and down quickly.
 */
function playSqueak() {
  initAudioContext();
  if (!audioCtx) return;

  const t = audioCtx.currentTime;
  
  // High pitch squeak
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(950, t);
  osc1.frequency.linearRampToValueAtTime(1650, t + 0.05);
  osc1.frequency.linearRampToValueAtTime(1000, t + 0.12);

  gain1.gain.setValueAtTime(0.08, t);
  gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

  osc1.connect(gain1);
  gain1.connect(audioCtx.destination);

  // Soft low pop
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(220, t);
  osc2.frequency.exponentialRampToValueAtTime(80, t + 0.1);
  gain2.gain.setValueAtTime(0.2, t);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);

  osc1.start(t);
  osc1.stop(t + 0.16);
  osc2.start(t);
  osc2.stop(t + 0.11);
}

/**
 * 3. ☕ Espresso Splash: Short white noise burst for liquid sizzle.
 */
function playSplat() {
  initAudioContext();
  if (!audioCtx) return;

  const t = audioCtx.currentTime;
  const duration = 0.35;
  
  // Create noise buffer
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1500, t);
  filter.frequency.exponentialRampToValueAtTime(500, t + duration);
  filter.Q.setValueAtTime(3.0, t);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.linearRampToValueAtTime(0.04, t + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  noiseNode.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  // Metallic pitch ring
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(110, t + 0.2);
  oscGain.gain.setValueAtTime(0.03, t);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  
  osc.connect(oscGain);
  oscGain.connect(audioCtx.destination);

  noiseNode.start(t);
  noiseNode.stop(t + duration);
  osc.start(t);
  osc.stop(t + 0.3);
}

/**
 * 4. 📄 Resignation Slap (Ultimate): Cyberpunk subdrop + dramatic metal crash.
 */
function playUltimateBreak() {
  initAudioContext();
  if (!audioCtx) return;

  const t = audioCtx.currentTime;

  // Subdrop Bass
  const subOsc = audioCtx.createOscillator();
  const subGain = audioCtx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(180, t);
  subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.7);

  subGain.gain.setValueAtTime(0.6, t);
  subGain.gain.linearRampToValueAtTime(0.4, t + 0.2);
  subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

  subOsc.connect(subGain);
  subGain.connect(audioCtx.destination);

  // High Frequency Metallic Crash
  const crashOscs = [440, 587.33, 659.25, 880];
  crashOscs.forEach(freq => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.4);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, t);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.6);
  });

  subOsc.start(t);
  subOsc.stop(t + 0.8);
}

/**
 * 5. Triumphant Fanfare (Victory sound)
 */
function playVictoryFanfare() {
  initAudioContext();
  if (!audioCtx) return;

  const t = audioCtx.currentTime;
  const notes = [
    { freq: 261.63, time: 0 },   // C4
    { freq: 329.63, time: 0.15 }, // E4
    { freq: 392.00, time: 0.3 },  // G4
    { freq: 523.25, time: 0.45 }  // C5 (Hold)
  ];

  notes.forEach((note, idx) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note.freq, t + note.time);
    
    const dur = idx === notes.length - 1 ? 0.8 : 0.25;
    gain.gain.setValueAtTime(0.001, t + note.time);
    gain.gain.linearRampToValueAtTime(0.12, t + note.time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + note.time + dur);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(t + note.time);
    osc.stop(t + note.time + dur + 0.1);
  });
}

/**
 * 6. UI Click Chirp sound
 */
function playChirp(freq = 600, duration = 0.08) {
  initAudioContext();
  if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.3, t + duration);
    
    gain.gain.setValueAtTime(0.02, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  } catch (e) {}
}

/**
 * Lo-Fi procedural ambient sound generator for BGM.
 */
function startProceduralBgm() {
  initAudioContext();
  if (!audioCtx || isBgmPlaying) return;

  isBgmPlaying = true;
  let chordIdx = 0;

  function playNextChord() {
    if (!isBgmPlaying || !audioCtx) return;
    
    const t = audioCtx.currentTime;
    const chord = bgmChords[chordIdx];
    
    // Create soft sine nodes for chord pad
    bgmNodes = [];
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);
    
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.001, t);
    masterGain.gain.linearRampToValueAtTime(0.04, t + 1.5); // Fade in over 1.5s
    masterGain.gain.setValueAtTime(0.04, t + 5.0);
    masterGain.gain.linearRampToValueAtTime(0.001, t + 7.5); // Fade out over 2.5s
    
    filter.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    chord.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      // Detune slightly for soft chorusing
      osc.frequency.setValueAtTime(freq + (idx * 0.4), t);
      
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.06, t);
      
      osc.connect(gain);
      gain.connect(filter);
      osc.start(t);
      osc.stop(t + 7.8);
    });

    chordIdx = (chordIdx + 1) % bgmChords.length;
  }

  // Trigger every 8 seconds
  playNextChord();
  bgmInterval = setInterval(playNextChord, 8000);
}

function stopProceduralBgm() {
  isBgmPlaying = false;
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
}

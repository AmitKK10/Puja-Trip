/**
 * Web Audio API based authentic Bengali Dhak (Dhaak) and Kanshor / Ghonta Sound Generator
 * Generates realistic skin resonance, stick strikes, and brass overtones.
 */

let audioCtx: AudioContext | null = null;
let isLooping = false;
let loopTimeoutId: number | null = null;
let currentVolume = 0.75;

type DhakListener = (isPlaying: boolean, beat: number, volume: number) => void;
const listeners = new Set<DhakListener>();

function notifyListeners(isPlaying: boolean, beat = 0) {
  listeners.forEach((fn) => {
    try {
      fn(isPlaying, beat, currentVolume);
    } catch (e) {
      console.warn('Dhak listener error:', e);
    }
  });
}

export function subscribeDhakState(listener: DhakListener): () => void {
  listeners.add(listener);
  // Initial emit
  listener(isLooping, 0, currentVolume);
  return () => {
    listeners.delete(listener);
  };
}

export function setDhakLoopVolume(vol: number) {
  currentVolume = Math.max(0.05, Math.min(1.0, vol));
  notifyListeners(isLooping, 0);
}

export function getDhakLoopVolume(): number {
  return currentVolume;
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesize a single Dhak hit
 * @param type 'dha' (deep resonant base strike) | 'khi'/'ta' (crisp wood rim stick strike) | 'tin' (open slap)
 * @param time AudioContext trigger time
 */
export function playDhakHit(type: 'dha' | 'ta' | 'khi' | 'tin' = 'dha', volume = 0.7) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (type === 'dha') {
      // Deep resonant goat-skin drum low hit
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(58, now + 0.18);

      gain.gain.setValueAtTime(volume * 0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      // Noise layer for mallet thump
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(300, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(volume * 0.6, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
      noise.start(now);
    } else if (type === 'ta' || type === 'khi') {
      // Crisp bamboo kathi (stick) strike on high rim
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(type === 'ta' ? 380 : 540, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

      gain.gain.setValueAtTime(volume * 0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      // High click
      const bufferSize = ctx.sampleRate * 0.02;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.005));
      }
      const click = ctx.createBufferSource();
      click.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, now);
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(volume * 0.4, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      click.connect(filter);
      filter.connect(clickGain);
      clickGain.connect(ctx.destination);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);
      click.start(now);
    } else {
      // Tin open resonance
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);
      gain.gain.setValueAtTime(volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    }
  } catch (err) {
    console.warn('Audio synth not allowed without interaction yet', err);
  }
}

/**
 * Play authentic brass Kanshor (brass plate struck during Aarti)
 */
export function playKanshorBell(volume = 0.5) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const freqs = [1046, 1568, 2093, 3136];
    
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (Math.random() * 8 - 4), now);
      
      const decay = 0.8 + idx * 0.2;
      gain.gain.setValueAtTime((volume / freqs.length) * (1 - idx * 0.15), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + decay + 0.05);
    });
  } catch (e) {
    console.warn(e);
  }
}

export interface DhakLoopOptions {
  onBeat?: (beatIdx: number) => void;
  volume?: number;
  maxCycles?: number;
  onComplete?: () => void;
}

/**
 * Play a traditional Durga Puja Dhak rhythm pattern:
 * "Dha... Ta-khi-ta-khi Dha... Ta-khi-ta-khi... Tin Tin Dha!"
 */
export function playFestiveDhakRhythm(
  onBeatOrOptions?: ((beatIdx: number) => void) | DhakLoopOptions,
  volumeMultiplier: number = 0.7
) {
  stopFestiveDhakRhythm();
  isLooping = true;

  const options: DhakLoopOptions =
    typeof onBeatOrOptions === 'function'
      ? { onBeat: onBeatOrOptions, volume: volumeMultiplier }
      : onBeatOrOptions || { volume: volumeMultiplier };

  if (options.volume !== undefined) {
    currentVolume = options.volume;
  }
  const maxCycles = options.maxCycles; // undefined means infinite until stopped
  let completedCycles = 0;

  notifyListeners(true, 0);

  const pattern: Array<{ type: 'dha' | 'ta' | 'khi' | 'tin' | 'kanshor'; delay: number }> = [
    { type: 'dha', delay: 0 },
    { type: 'kanshor', delay: 20 },
    { type: 'ta', delay: 180 },
    { type: 'khi', delay: 270 },
    { type: 'ta', delay: 360 },
    { type: 'khi', delay: 450 },
    { type: 'dha', delay: 550 },
    { type: 'kanshor', delay: 560 },
    { type: 'tin', delay: 720 },
    { type: 'tin', delay: 840 },
    { type: 'ta', delay: 930 },
    { type: 'khi', delay: 1020 },
    { type: 'dha', delay: 1120 },
    { type: 'dha', delay: 1250 },
    { type: 'kanshor', delay: 1260 },
  ];

  let step = 0;
  function scheduleNext() {
    if (!isLooping) return;
    const item = pattern[step % pattern.length];
    const vol = Math.max(0.1, Math.min(1.0, currentVolume));
    
    if (item.type === 'kanshor') {
      playKanshorBell(0.35 * vol);
    } else {
      playDhakHit(item.type, 0.6 * vol);
    }

    const currentBeat = step % pattern.length;
    if (options.onBeat) options.onBeat(currentBeat);
    notifyListeners(true, currentBeat);

    step++;

    // Check if a full cycle just finished
    if (step % pattern.length === 0) {
      completedCycles++;
      if (maxCycles !== undefined && completedCycles >= maxCycles) {
        stopFestiveDhakRhythm();
        if (options.onComplete) options.onComplete();
        return;
      }
    }

    const nextItem = pattern[step % pattern.length];
    const wait = (step % pattern.length === 0) ? 350 : (nextItem.delay - item.delay || 120);
    
    loopTimeoutId = window.setTimeout(scheduleNext, Math.max(70, wait));
  }

  scheduleNext();
}

/**
 * Play a short traditional Dhak loop (2 full cycles ~ 3 seconds)
 */
export function playShortDhakLoop(options?: DhakLoopOptions) {
  playFestiveDhakRhythm({
    maxCycles: options?.maxCycles ?? 2,
    volume: options?.volume ?? currentVolume,
    onBeat: options?.onBeat,
    onComplete: options?.onComplete,
  });
}

export function stopFestiveDhakRhythm() {
  isLooping = false;
  if (loopTimeoutId !== null) {
    clearTimeout(loopTimeoutId);
    loopTimeoutId = null;
  }
  notifyListeners(false, 0);
}

export function isDhakRhythmPlaying() {
  return isLooping;
}

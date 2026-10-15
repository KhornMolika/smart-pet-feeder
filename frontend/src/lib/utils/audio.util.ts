/**
 * Audio Chime Synthesizer using Web Audio API
 * Plays pleasant alert melodies & tones to signal to pets that food is served.
 */

export type BuzzerToneType = 'gentle_chime' | 'bird_chirp' | 'pavlov_bell' | 'playful_jingle';

export interface SoundToneDefinition {
  id: BuzzerToneType;
  name: string;
  badge: string;
  targetPet: 'all' | 'cat' | 'dog' | 'puppy';
  description: string;
  frequencies: string;
  notesSummary: string;
}

export const SOUND_TONE_PRESETS: SoundToneDefinition[] = [
  {
    id: 'gentle_chime',
    name: 'Gentle Dinner Chime',
    badge: 'Soft & Calming • All Pets',
    targetPet: 'all',
    description: '3-note ascending arpeggio (C5 → E5 → G5). Warm and gentle, perfect for sensitive pets.',
    frequencies: '523 Hz – 784 Hz',
    notesSummary: 'C5 • E5 • G5 (Ascending)',
  },
  {
    id: 'bird_chirp',
    name: 'High-Pitch Bird Chirp',
    badge: '🐱 Cat Specialist',
    targetPet: 'cat',
    description: 'Crisp dual chirp (C7 → E7). Mimics bird & rodent calls that instantly perk up feline ears.',
    frequencies: '2,093 Hz – 2,637 Hz',
    notesSummary: 'C7 • E7 (Dual Chirp)',
  },
  {
    id: 'pavlov_bell',
    name: 'Pavlovian Dinner Bell',
    badge: '🐶 Dog Specialist',
    targetPet: 'dog',
    description: 'Resonant 2-tone bell (G5 → C6). Clear ring that carries through closed doors and hallways.',
    frequencies: '784 Hz – 1,046 Hz',
    notesSummary: 'G5 • C6 (Ding-Dong)',
  },
  {
    id: 'playful_jingle',
    name: 'Playful Food Jingle',
    badge: '🐾 Puppies & Kittens',
    targetPet: 'puppy',
    description: 'Upbeat 4-note melody (C5 → G5 → E5 → C6). Cheerful and bouncy to build mealtime excitement.',
    frequencies: '523 Hz – 1,046 Hz',
    notesSummary: 'C5 • G5 • E5 • C6 (Jingle)',
  },
];

export function getToneDuration(toneId: BuzzerToneType = 'gentle_chime', repeatCount: number = 1): number {
  const baseDurations: Record<BuzzerToneType, number> = {
    gentle_chime: 770,
    bird_chirp: 260,
    pavlov_bell: 870,
    playful_jingle: 780,
  };
  const base = baseDurations[toneId] || 750;
  const pauseBetweenRepeats = 240;
  return base * repeatCount + pauseBetweenRepeats * Math.max(0, repeatCount - 1);
}

export function playToneSound(toneId: BuzzerToneType = 'gentle_chime', repeatCount: number = 1) {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    let baseNotes: { freq: number; time: number; duration: number; type?: OscillatorType; maxGain?: number }[] = [];

    switch (toneId) {
      case 'gentle_chime':
        // Ascending triad (C5 -> E5 -> G5)
        baseNotes = [
          { freq: 523.25, time: 0, duration: 0.24, type: 'sine', maxGain: 0.28 },
          { freq: 659.25, time: 0.16, duration: 0.28, type: 'sine', maxGain: 0.3 },
          { freq: 783.99, time: 0.32, duration: 0.45, type: 'sine', maxGain: 0.32 },
        ];
        break;

      case 'bird_chirp':
        // High-pitch dual chirp (C7 -> E7)
        baseNotes = [
          { freq: 2093.0, time: 0, duration: 0.08, type: 'sine', maxGain: 0.2 },
          { freq: 2637.02, time: 0.11, duration: 0.15, type: 'sine', maxGain: 0.24 },
        ];
        break;

      case 'pavlov_bell':
        // Resonant Dinner Bell (G5 -> C6) with longer ring-out
        baseNotes = [
          { freq: 783.99, time: 0, duration: 0.35, type: 'triangle', maxGain: 0.32 },
          { freq: 1046.5, time: 0.22, duration: 0.65, type: 'sine', maxGain: 0.35 },
        ];
        break;

      case 'playful_jingle':
        // 4-note bouncy melody (C5 -> G5 -> E5 -> C6)
        baseNotes = [
          { freq: 523.25, time: 0, duration: 0.14, type: 'sine', maxGain: 0.26 },
          { freq: 783.99, time: 0.13, duration: 0.14, type: 'sine', maxGain: 0.28 },
          { freq: 659.25, time: 0.26, duration: 0.16, type: 'sine', maxGain: 0.3 },
          { freq: 1046.5, time: 0.40, duration: 0.38, type: 'sine', maxGain: 0.32 },
        ];
        break;
    }

    // Determine single phrase duration
    const phraseDuration = baseNotes.reduce((max, n) => Math.max(max, n.time + n.duration), 0);
    const pauseDuration = 0.24; // inter-repeat musical breath
    const count = Math.max(1, Math.min(5, Math.floor(repeatCount || 1)));

    // Schedule all notes across repetitions
    for (let r = 0; r < count; r++) {
      const phraseStartOffset = r * (phraseDuration + pauseDuration);

      baseNotes.forEach(({ freq, time, duration, type = 'sine', maxGain = 0.3 }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const noteStartTime = ctx.currentTime + phraseStartOffset + time;
        const noteEndTime = noteStartTime + duration;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, noteStartTime);

        gain.gain.setValueAtTime(0, noteStartTime);
        gain.gain.linearRampToValueAtTime(maxGain, noteStartTime + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, noteEndTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStartTime);
        osc.stop(noteEndTime);
      });
    }
  } catch (err) {
    console.warn('Audio tone playback omitted:', err);
  }
}

export function playPetFeedingChime(repeatCount: number = 1) {
  playToneSound('gentle_chime', repeatCount);
}


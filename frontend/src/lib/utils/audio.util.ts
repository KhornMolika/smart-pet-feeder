/**
 * Audio Chime Synthesizer using Web Audio API
 * Plays a pleasant alert melody to signal to pets that food has dropped.
 */
export function playPetFeedingChime() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // 3-note melodic arpeggio (C5 -> E5 -> G5) like a gentle dinner chime
    const notes = [
      { freq: 523.25, time: 0, duration: 0.25 },
      { freq: 659.25, time: 0.18, duration: 0.3 },
      { freq: 783.99, time: 0.36, duration: 0.45 },
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + duration);
    });
  } catch (err) {
    console.warn('Audio chime playback omitted:', err);
  }
}

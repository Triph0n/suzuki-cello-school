// Sample-accurate multi-part synth player, ported from the violin practice
// app. The ensemble stage keeps playing recorded WAV stems (stemPlayer.js);
// this synth covers everything that has no recording — today the short band
// motifs in the Band Workshop, later any ensemble whose chairs carry note
// arrays instead of stems. Every note is scheduled on one AudioContext clock,
// with one GainNode per part for click-free mute/solo.

const VOICES = {
  violin: { wave: "sawtooth", cutoff: 3200, peak: 0.16, attack: 0.05, vibrato: 5.5, depth: 4 },
  cello: { wave: "sawtooth", cutoff: 1400, peak: 0.2, attack: 0.07, vibrato: 4.5, depth: 3 }
};

export const partDuration = (notes) =>
  notes.reduce((sum, [, beats]) => sum + beats, 0);

export function createEnsemblePlayer() {
  let context = null;
  const gains = new Map(); // part id -> GainNode
  const targetGains = new Map(); // part id -> desired volume (survives replays)
  let active = []; // currently scheduled source nodes
  let endTimer = null;

  const ensureContext = () => {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
    }
    if (context.state === "suspended") context.resume();
    return context;
  };

  const gainFor = (id) => {
    const ctx = ensureContext();
    let gain = gains.get(id);
    if (!gain) {
      gain = ctx.createGain();
      gain.connect(ctx.destination);
      gains.set(id, gain);
    }
    gain.gain.value = targetGains.has(id) ? targetGains.get(id) : 1;
    return gain;
  };

  const scheduleNote = (ctx, destination, frequency, start, duration, voice) => {
    const spec = VOICES[voice] || VOICES.cello;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = spec.wave;
    osc.frequency.setValueAtTime(frequency, start);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(spec.cutoff, start);
    filter.Q.value = 0.7;

    // Bowed envelope: soft attack, steady sustain, gentle release.
    const attack = Math.min(spec.attack, duration * 0.35);
    const release = Math.min(0.14, duration * 0.35);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.linearRampToValueAtTime(spec.peak, start + attack);
    amp.gain.setValueAtTime(spec.peak, start + duration - release);
    amp.gain.linearRampToValueAtTime(0.0001, start + duration);

    // A slow vibrato keeps the synth from sounding like a test tone.
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(spec.vibrato, start);
    lfoGain.gain.setValueAtTime(0, start);
    lfoGain.gain.linearRampToValueAtTime(spec.depth, start + duration * 0.4);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.connect(filter);
    filter.connect(amp);
    amp.connect(destination);

    osc.start(start);
    osc.stop(start + duration + 0.05);
    lfo.start(start);
    lfo.stop(start + duration + 0.05);
    active.push(osc, lfo);
  };

  const scheduleClick = (ctx, start, accent) => {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(accent ? 1600 : 1100, start);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.linearRampToValueAtTime(accent ? 0.22 : 0.14, start + 0.005);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.06);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.08);
    active.push(osc);
  };

  const stop = () => {
    if (endTimer) {
      clearTimeout(endTimer);
      endTimer = null;
    }
    for (const node of active) {
      try {
        node.stop();
      } catch {
        // already stopped
      }
    }
    active = [];
  };

  const setGain = (id, volume) => {
    targetGains.set(id, volume);
    const gain = gains.get(id);
    if (gain && context) {
      gain.gain.setTargetAtTime(volume, context.currentTime, 0.01);
    }
  };

  // parts: [{ id, notes, voice }]. Returns the total playback length in seconds.
  const play = ({ parts, bpm, countInBeats = 0, onEnded }) => {
    stop();
    const ctx = ensureContext();
    const beat = 60 / bpm;
    const lead = 0.15; // let the scheduler breathe before the first note
    const musicStart = ctx.currentTime + lead + countInBeats * beat;

    for (let i = 0; i < countInBeats; i++) {
      scheduleClick(ctx, ctx.currentTime + lead + i * beat, i === 0);
    }

    let longest = 0;
    for (const part of parts) {
      const destination = gainFor(part.id);
      let cursor = musicStart;
      for (const [frequency, beats] of part.notes) {
        const duration = beats * beat;
        if (frequency) {
          // Leave a hair of silence so repeated notes are re-articulated.
          scheduleNote(ctx, destination, frequency, cursor, duration * 0.94, part.voice);
        }
        cursor += duration;
      }
      longest = Math.max(longest, cursor - ctx.currentTime);
    }

    if (onEnded) {
      endTimer = setTimeout(onEnded, (longest + 0.3) * 1000);
    }
    return longest;
  };

  const dispose = () => {
    stop();
    gains.clear();
    if (context) {
      context.close();
      context = null;
    }
  };

  return { play, stop, setGain, dispose };
}

// One-shot helper for the short band motifs in the Band Workshop.
export function playMotif(motif, { bpm = 120, voice = "cello" } = {}) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const player = createEnsemblePlayer();
  const notes = motif.map((frequency) => [frequency, 1]);
  const length = player.play({ parts: [{ id: "motif", notes, voice }], bpm });
  setTimeout(() => player.dispose(), (length + 0.5) * 1000);
}

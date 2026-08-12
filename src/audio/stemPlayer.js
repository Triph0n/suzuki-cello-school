// Sample-accurate multi-track player for ensemble stems. All stems are
// decoded into AudioBuffers and started on the same AudioContext clock, with
// one GainNode per stem for click-free mute/solo. <audio> elements are
// deliberately not used — they drift out of sync.

const stemModules = import.meta.glob("../stems/**/*.wav", {
  eager: true,
  query: "?url",
  import: "default"
});

// stemId is "<ensemble>/<part>", tempo "practice" | "concert".
export const stemUrl = (stemId, tempo) =>
  stemModules[`../stems/${stemId}.${tempo}.wav`];

export function createStemPlayer() {
  let context = null;
  const buffers = new Map(); // url -> AudioBuffer
  const gains = new Map(); // stem id -> GainNode
  const targetGains = new Map(); // stem id -> desired volume (survives replays)
  let active = []; // currently playing AudioBufferSourceNodes
  let playToken = 0;

  const ensureContext = () => {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
    }
    if (context.state === "suspended") context.resume();
    return context;
  };

  const load = async (stems) => {
    const ctx = ensureContext();
    await Promise.all(
      stems.map(async ({ url }) => {
        if (buffers.has(url)) return;
        const response = await fetch(url);
        const encoded = await response.arrayBuffer();
        buffers.set(url, await ctx.decodeAudioData(encoded));
      })
    );
  };

  const stop = () => {
    playToken += 1;
    for (const source of active) {
      try {
        source.stop();
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
      gain.gain.setTargetAtTime(volume, context.currentTime, 0.02);
    }
  };

  // stems: [{ id, url }]. Excluded ids (the child's own part in play-along
  // mode) are not scheduled at all. The count-in clicks at the given bpm
  // before the stems enter together.
  const play = ({ stems, bpm = 100, countInBeats = 0, onEnded }) => {
    const ctx = ensureContext();
    stop();
    const token = playToken;

    const beat = 60 / bpm;
    const startAt = ctx.currentTime + 0.08 + countInBeats * beat;

    for (let i = 0; i < countInBeats; i++) {
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.frequency.value = i === 0 ? 880 : 660;
      clickGain.gain.setValueAtTime(0.15, ctx.currentTime);
      click.connect(clickGain).connect(ctx.destination);
      const at = ctx.currentTime + 0.08 + i * beat;
      clickGain.gain.setValueAtTime(0.15, at);
      clickGain.gain.exponentialRampToValueAtTime(0.001, at + 0.1);
      click.start(at);
      click.stop(at + 0.12);
    }

    let longest = null;
    let longestDuration = 0;
    for (const { id, url } of stems) {
      const buffer = buffers.get(url);
      if (!buffer) continue;
      let gain = gains.get(id);
      if (!gain) {
        gain = ctx.createGain();
        gain.connect(ctx.destination);
        gains.set(id, gain);
      }
      gain.gain.setValueAtTime(targetGains.get(id) ?? 1, ctx.currentTime);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      source.start(startAt);
      active.push(source);
      if (buffer.duration > longestDuration) {
        longestDuration = buffer.duration;
        longest = source;
      }
    }

    if (longest && onEnded) {
      longest.onended = () => {
        // Ignore the ended event when a newer play()/stop() superseded us.
        if (token === playToken) onEnded();
      };
    }
    return { startAt, duration: longestDuration };
  };

  const dispose = () => {
    stop();
    gains.clear();
    buffers.clear();
    if (context) {
      context.close();
      context = null;
    }
  };

  return { load, play, stop, setGain, dispose };
}

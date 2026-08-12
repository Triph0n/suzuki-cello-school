import { useCallback, useEffect, useRef, useState } from "react";
import clickUrl from "../audio/metronome-click.wav";

// The Fortin Piccolo metronome, ported from the standalone app
// (~/Documents/Projects/piccolo-metronome). Same mahogany pyramid, same brass
// pendulum, same look-ahead scheduler — Sarno mode and the tilt sensor are
// deliberately left out: this is a practice tool for children, not a swing box.
//
// Timing does not run on React state. Beats are scheduled into the Web Audio
// clock ahead of time and the pendulum is drawn from that same clock, so the
// swing and the click can never drift apart, however busy the main thread is.

const MIN_BPM = 40;
const MAX_BPM = 208;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.12;

const MARKS = [40, 50, 60, 72, 80, 92, 104, 120, 138, 152, 168, 184, 208];
const BIG_MARKS = new Set([40, 60, 80, 120, 168, 208]);
const NAMES = [
  [60, "Largo"],
  [66, "Larghetto"],
  [76, "Adagio"],
  [108, "Andante"],
  [120, "Moderato"],
  [168, "Allegro"],
  [200, "Presto"]
];
const ACCENTS = [
  { value: 0, label: "no accent" },
  { value: 2, label: "2/4" },
  { value: 3, label: "3/4" },
  { value: 4, label: "4/4" }
];

const clamp = (v) => Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(v)));
const tempoName = (bpm) => {
  for (const [limit, name] of NAMES) if (bpm < limit) return name;
  return "Prestissimo";
};
// Position on the ivory scale plate, in SVG units.
const yOf = (bpm) => 64 + ((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 160;
// Slower tempo, wider swing — the real instrument behaves the same way.
const amplitude = (bpm) => 30 - ((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 12;

export default function PiccoloMetronome() {
  const [bpm, setBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [accentEvery, setAccentEvery] = useState(0);
  const [slots, setSlots] = useState({ A: null, B: null });
  const [activeSlot, setActiveSlot] = useState(null);

  const audioRef = useRef({ ctx: null, master: null, buffer: null });
  const clockRef = useRef({ anchorTime: 0, anchorBeat: 0, nextBeat: 0 });
  const bpmRef = useRef(bpm);
  const accentRef = useRef(accentEvery);
  const playingRef = useRef(false);
  const pendulumRef = useRef(null);
  const weightRef = useRef(null);
  const lampRef = useRef(null);
  const tapsRef = useRef([]);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { accentRef.current = accentEvery; }, [accentEvery]);

  const beatDur = () => 60 / bpmRef.current;

  const initAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (audio.ctx) return audio;
    const ctx = new (window.AudioContext || window.webkitAudioContext)({
      latencyHint: "interactive"
    });
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 6;
    comp.ratio.value = 14;
    comp.attack.value = 0.001;
    comp.release.value = 0.08;
    const master = ctx.createGain();
    master.gain.value = 1;
    master.connect(comp).connect(ctx.destination);
    audio.ctx = ctx;
    audio.master = master;
    try {
      const bytes = await (await fetch(clickUrl)).arrayBuffer();
      audio.buffer = await ctx.decodeAudioData(bytes);
    } catch {
      // No sample: click() falls back to the synthesised wood block below.
    }
    return audio;
  }, []);

  const click = useCallback((time, accent) => {
    const { ctx, master, buffer } = audioRef.current;
    if (!ctx) return;
    if (buffer) {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = accent ? 1.35 : 1;
      const gain = ctx.createGain();
      gain.gain.value = accent ? 2.6 : 2.2;
      src.connect(gain).connect(master);
      src.start(time);
      return;
    }
    const f = accent ? 1900 : 1250;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(accent ? 2.4 : 2, time + 0.0015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.055);
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(f, time);
    osc.frequency.exponentialRampToValueAtTime(f * 0.72, time + 0.05);
    osc.connect(gain).connect(master);
    osc.start(time);
    osc.stop(time + 0.07);
  }, []);

  // Beats are placed on the audio clock, never on setTimeout: the timer only
  // decides when to look ahead, the sample start times are exact.
  useEffect(() => {
    if (!playing) return undefined;
    const beatTime = (n) => {
      const c = clockRef.current;
      return c.anchorTime + (n - c.anchorBeat) * beatDur();
    };
    const pump = () => {
      const { ctx } = audioRef.current;
      if (!ctx) return;
      const c = clockRef.current;
      while (beatTime(c.nextBeat) < ctx.currentTime + SCHEDULE_AHEAD) {
        const every = accentRef.current;
        click(beatTime(c.nextBeat), every > 0 && c.nextBeat % every === 0);
        c.nextBeat += 1;
      }
    };
    pump();
    const id = setInterval(pump, LOOKAHEAD_MS);
    return () => clearInterval(id);
  }, [playing, click]);

  // Pendulum and lamp are driven off the same audio clock as the clicks.
  useEffect(() => {
    let raf = 0;
    let lastTick = -1;
    let lamp = 0.15;
    const draw = () => {
      const { ctx } = audioRef.current;
      let angle = 0;
      if (playingRef.current && ctx) {
        const c = clockRef.current;
        const beat = c.anchorBeat + (ctx.currentTime - c.anchorTime) / beatDur();
        angle = amplitude(bpmRef.current) * Math.cos(Math.PI * beat);
        const whole = Math.floor(beat + 0.02);
        if (whole !== lastTick && whole >= 0) {
          lastTick = whole;
          lamp = 1;
        }
      }
      if (pendulumRef.current) {
        pendulumRef.current.setAttribute("transform", `rotate(${angle} 110 278)`);
      }
      if (lampRef.current) {
        lamp = Math.max(0.15, lamp - 0.06);
        lampRef.current.setAttribute("opacity", String(lamp));
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (weightRef.current) {
      weightRef.current.setAttribute("transform", `translate(0 ${yOf(bpm)})`);
    }
  }, [bpm]);

  // Changing tempo mid-swing re-anchors the clock instead of restarting it, so
  // the pendulum keeps its phase and nothing jumps.
  useEffect(() => {
    const { ctx } = audioRef.current;
    if (!playingRef.current || !ctx) return;
    const c = clockRef.current;
    const now = ctx.currentTime;
    c.anchorBeat = c.anchorBeat + (now - c.anchorTime) / (60 / bpm);
    c.anchorTime = now;
    c.nextBeat = Math.max(c.nextBeat, Math.ceil(c.anchorBeat));
  }, [bpm]);

  const toggle = useCallback(async () => {
    if (playingRef.current) {
      playingRef.current = false;
      setPlaying(false);
      return;
    }
    const { ctx } = await initAudio();
    await ctx.resume();
    clockRef.current = { anchorTime: ctx.currentTime + 0.08, anchorBeat: 0, nextBeat: 0 };
    playingRef.current = true;
    setPlaying(true);
  }, [initAudio]);

  useEffect(() => () => {
    playingRef.current = false;
    audioRef.current.ctx?.close().catch(() => {});
  }, []);

  const tap = () => {
    const now = performance.now();
    const taps = tapsRef.current.filter((t) => now - t < 2200);
    taps.push(now);
    tapsRef.current = taps;
    if (taps.length >= 2) {
      const interval = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
      setBpm(clamp(60000 / interval));
    }
  };

  // Tapping an inactive slot recalls it; tapping the active one re-saves.
  const tapSlot = (key) => {
    if (activeSlot !== key && slots[key] != null) {
      setBpm(slots[key]);
    } else {
      setSlots((current) => ({ ...current, [key]: bpm }));
    }
    setActiveSlot(key);
  };

  const nudge = (delta) => setBpm((current) => clamp(current + delta));

  return (
    <section className="club-leather rounded-3xl p-5">
      <p className="club-plate text-[11px] mb-3">Metronome</p>

      <div className="flex justify-center">
        <svg
          viewBox="0 0 220 330"
          role="img"
          aria-label="Metronome"
          className="h-56 w-auto drop-shadow-[0_18px_28px_rgba(0,0,0,0.65)]"
        >
          <defs>
            <linearGradient id="pm-wood" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#2a1108" />
              <stop offset=".22" stopColor="#8d431f" />
              <stop offset=".5" stopColor="#63290f" />
              <stop offset=".8" stopColor="#38180c" />
              <stop offset="1" stopColor="#2a1108" />
            </linearGradient>
            <linearGradient id="pm-base" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8d431f" />
              <stop offset=".5" stopColor="#63290f" />
              <stop offset="1" stopColor="#2a1108" />
            </linearGradient>
            <linearGradient id="pm-brass" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#7a5822" />
              <stop offset=".38" stopColor="#f0d492" />
              <stop offset=".6" stopColor="#c99d47" />
              <stop offset="1" stopColor="#7a5822" />
            </linearGradient>
            <linearGradient id="pm-sheen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity=".28" />
              <stop offset=".35" stopColor="#fff" stopOpacity=".05" />
              <stop offset=".6" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="pm-body">
              <path d="M44 300 L97 32 Q110 18 123 32 L176 300 Z" />
            </clipPath>
            <filter id="pm-blur"><feGaussianBlur stdDeviation="3" /></filter>
          </defs>

          <ellipse cx="110" cy="318" rx="92" ry="7" fill="#000" opacity=".5" filter="url(#pm-blur)" />

          {/* two-tier mahogany plinth with a brass inlay */}
          <rect x="22" y="306" width="176" height="12" rx="3" fill="url(#pm-base)" />
          <rect x="28" y="296" width="164" height="12" rx="3" fill="url(#pm-base)" />
          <rect x="28" y="303.4" width="164" height="1.8" fill="url(#pm-brass)" opacity=".9" />
          <rect x="22" y="306" width="176" height="2.4" fill="#fff" opacity=".08" />

          {/* pyramid body */}
          <path d="M44 300 L97 32 Q110 18 123 32 L176 300 Z" fill="url(#pm-wood)" />
          <g clipPath="url(#pm-body)">
            <path d="M44 300 L97 32 Q110 18 123 32 L134 88 L70 300 Z" fill="url(#pm-sheen)" />
          </g>
          <path
            d="M44 300 L97 32 Q110 18 123 32 L176 300"
            fill="none"
            stroke="#000"
            strokeOpacity=".45"
            strokeWidth="1.6"
          />
          <path
            d="M46 297 L98 34 Q110 21 122 34"
            fill="none"
            stroke="#f0d492"
            strokeOpacity=".28"
            strokeWidth="1"
          />

          {/* winding key */}
          <rect x="152" y="206" width="16" height="3.6" rx="1.8" fill="url(#pm-brass)" />
          <circle cx="171" cy="207.8" r="6" fill="none" stroke="url(#pm-brass)" strokeWidth="3.4" />

          {/* ivory scale plate in a brass frame */}
          <rect x="88" y="48" width="44" height="242" rx="4" fill="#7a5822" />
          <rect x="89.5" y="49.5" width="41" height="239" rx="3" fill="#e9dcbc" />
          {MARKS.map((mark) => {
            const y = yOf(mark);
            const big = BIG_MARKS.has(mark);
            return (
              <g key={mark}>
                <line x1="92" x2={big ? 100 : 98} y1={y} y2={y} stroke="#332718" strokeWidth={big ? 1.2 : 0.7} opacity=".8" />
                <line x1={big ? 120 : 122} x2="128" y1={y} y2={y} stroke="#332718" strokeWidth={big ? 1.2 : 0.7} opacity=".8" />
                {big && (
                  <text x="110" y={y + 3} textAnchor="middle" fill="#332718" fontSize="9.5" fontWeight="700" fontFamily="Georgia, serif">
                    {mark}
                  </text>
                )}
              </g>
            );
          })}

          {/* pendulum */}
          <g ref={pendulumRef}>
            <line x1="110" y1="278" x2="110" y2="50" stroke="#7a5822" strokeWidth="4" strokeLinecap="round" />
            <line x1="110" y1="278" x2="110" y2="50" stroke="#f0d492" strokeWidth="1.4" strokeLinecap="round" />
            <g ref={weightRef}>
              <path d="M98 -9 L122 -9 L117.5 10 L102.5 10 Z" fill="url(#pm-brass)" stroke="#7a5822" strokeWidth="1" />
              <path d="M98 -9 L122 -9 L121 -5 L99 -5 Z" fill="#fff" opacity=".22" />
              <rect x="98" y="-1.6" width="24" height="3.2" fill="#000" opacity=".32" />
            </g>
          </g>

          <circle cx="110" cy="278" r="7.5" fill="url(#pm-brass)" />
          <circle cx="110" cy="278" r="2.6" fill="#2a1108" />
          <circle cx="108" cy="275.6" r="1.6" fill="#fff" opacity=".5" />

          {/* tick lamp in a brass bezel */}
          <circle cx="110" cy="34" r="6" fill="url(#pm-brass)" />
          <circle ref={lampRef} cx="110" cy="34" r="3.6" fill="#ffca5e" opacity=".15" />
        </svg>
      </div>

      <div className="text-center leading-none mt-2">
        <span className="font-headline text-5xl tabular-nums text-on-background">{bpm}</span>
        <span className="club-plate text-[11px] ml-2 align-super">BPM</span>
        <p className="font-headline text-xl text-primary mt-1">{tempoName(bpm)}</p>
      </div>

      <input
        type="range"
        min={MIN_BPM}
        max={MAX_BPM}
        step={1}
        value={bpm}
        onChange={(event) => setBpm(Number(event.target.value))}
        aria-label="Tempo"
        className="w-full mt-3 accent-primary"
      />

      <div className="flex gap-2 mt-2">
        {[-5, -1].map((delta) => (
          <button
            key={delta}
            type="button"
            onClick={() => nudge(delta)}
            className="club-leather flex-1 h-11 rounded-lg text-on-background"
            aria-label={delta === -1 ? "Slower" : "5 slower"}
          >
            {delta === -1 ? "−" : "−5"}
          </button>
        ))}
        <button
          type="button"
          onClick={tap}
          className="club-leather flex-[1.4] h-11 rounded-lg text-on-background"
        >
          <span className="block text-[10px] font-bold tracking-[0.25em] text-primary leading-none">TAP</span>
          <span className="text-sm">tempo</span>
        </button>
        {[1, 5].map((delta) => (
          <button
            key={delta}
            type="button"
            onClick={() => nudge(delta)}
            className="club-leather flex-1 h-11 rounded-lg text-on-background"
            aria-label={delta === 1 ? "Faster" : "5 faster"}
          >
            {delta === 1 ? "+" : "+5"}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mt-2" role="group" aria-label="Tempo memory">
        {["A", "B"].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => tapSlot(key)}
            aria-pressed={activeSlot === key}
            className={`club-leather flex-1 h-9 rounded-lg text-sm ${
              activeSlot === key ? "text-primary-fixed-dim border-primary" : "text-on-surface-variant"
            }`}
          >
            {slots[key] == null ? key : `${key} ${slots[key]}`}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mt-2" role="group" aria-label="Accent">
        {ACCENTS.map((accent) => (
          <button
            key={accent.value}
            type="button"
            onClick={() => setAccentEvery(accent.value)}
            aria-pressed={accentEvery === accent.value}
            className={`club-leather flex-1 h-9 rounded-lg text-[11px] tracking-[0.14em] ${
              accentEvery === accent.value
                ? "text-primary-fixed-dim border-primary"
                : "text-on-surface-variant"
            }`}
          >
            {accent.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={toggle}
        className={`w-full h-14 rounded-xl mt-3 tracking-[0.4em] uppercase text-sm ${
          playing ? "club-leather text-primary-fixed-dim" : "club-brass"
        }`}
      >
        {playing ? "Stop" : "Start"}
      </button>
    </section>
  );
}

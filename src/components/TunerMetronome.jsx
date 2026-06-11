import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Mic2, Activity, Power, Minus, Plus } from 'lucide-react';

const STRINGS = [
  { name: 'A', freq: 442.0 },
  { name: 'D', freq: 294.6667 },
  { name: 'G', freq: 196.4444 },
  { name: 'C', freq: 130.9630 },
];

const centsOff = (frequency, targetFrequency) => (
  1200 * Math.log2(frequency / targetFrequency)
);

const getClosestString = (frequency) => (
  STRINGS.reduce((closest, string) => {
    const cents = centsOff(frequency, string.freq);
    return Math.abs(cents) < Math.abs(closest.cents)
      ? { ...string, cents }
      : closest;
  }, { ...STRINGS[0], cents: centsOff(frequency, STRINGS[0].freq) })
);

const autoCorrelate = (buf, sampleRate) => {
  let rms = 0;
  for (let i = 0; i < buf.length; i += 1) {
    rms += buf[i] * buf[i];
  }
  rms = Math.sqrt(rms / buf.length);
  if (rms < 0.005) return null;

  let r1 = 0;
  let r2 = buf.length - 1;
  const thres = 0.01;

  for (let i = 0; i < buf.length / 2; i += 1) {
    if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  }
  for (let i = 1; i < buf.length / 2; i += 1) {
    if (Math.abs(buf[buf.length - i]) < thres) { r2 = buf.length - i; break; }
  }

  const trimmed = buf.slice(r1, r2);
  const size = trimmed.length;
  const c = new Array(size).fill(0);

  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j < size - i; j += 1) {
      c[i] += trimmed[j] * trimmed[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d += 1;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < size; i += 1) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;

  if (T0 > 0 && T0 < size - 1) {
    const x1 = c[T0 - 1];
    const x2 = c[T0];
    const x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 -= b / (2 * a);
  }

  return T0 ? sampleRate / T0 : null;
};

const TunerMetronome = () => {
  const [bpm, setBpm] = useState(60);
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  const [activeString, setActiveString] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [detectedFrequency, setDetectedFrequency] = useState(null);
  const [targetString, setTargetString] = useState(STRINGS[0]);
  const [pitchCents, setPitchCents] = useState(0);
  const [micError, setMicError] = useState('');

  // References for Web Audio API
  const audioContextRef = useRef(null);
  const audioBufferRef = useRef(null);
  const tunerOscillatorRef = useRef(null);
  const tunerGainRef = useRef(null);
  const micStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const detectorFrameRef = useRef(null);
  const detectorBufferRef = useRef(null);

  // Metronome state refs
  const bpmRef = useRef(bpm);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef(null);

  // Hold refs for continuous BPM adjustment
  const holdIntervalRef = useRef(null);
  const holdTimeoutRef = useRef(null);

  const startBpmChange = (direction) => {
    stopBpmChange();
    setBpm((prev) => {
      const next = prev + direction;
      return Math.max(40, Math.min(240, next));
    });

    holdTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        setBpm((prev) => {
          const next = prev + direction;
          return Math.max(40, Math.min(240, next));
        });
      }, 70);
    }, 400);
  };

  const stopBpmChange = () => {
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
  };

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  const initAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (!audioBufferRef.current) {
      try {
        const response = await fetch('/metronome-click.wav');
        const arrayBuffer = await response.arrayBuffer();
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
      } catch (e) {
        console.error("Failed to load metronome sound", e);
      }
    }
  };

  // --- METRONOME LOGIC ---
  const scheduleNote = (time) => {
    if (!audioContextRef.current || !audioBufferRef.current) return;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    
    const gainNode = audioContextRef.current.createGain();
    gainNode.gain.value = 1.5; // Hlasitý úder
    
    source.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    source.start(time);
  };

  const scheduler = () => {
    if (!audioContextRef.current) return;
    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + 0.1) {
      scheduleNote(nextNoteTimeRef.current);
      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;
    }
    timerIDRef.current = window.setTimeout(scheduler, 25);
  };

  const toggleMetronome = async () => {
    await initAudio();
    if (isMetronomePlaying) {
      window.clearTimeout(timerIDRef.current);
      setIsMetronomePlaying(false);
    } else {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
      scheduler();
      setIsMetronomePlaying(true);
    }
  };

  // Stop metronome and clean up hold timers on unmount
  useEffect(() => {
    return () => {
      if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  // --- TUNER LOGIC ---
  const stopTuner = () => {
    if (tunerOscillatorRef.current) {
      // Fade out to avoid clipping click
      if (tunerGainRef.current && audioContextRef.current) {
        const t = audioContextRef.current.currentTime;
        tunerGainRef.current.gain.cancelScheduledValues(t);
        tunerGainRef.current.gain.setValueAtTime(tunerGainRef.current.gain.value, t);
        tunerGainRef.current.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      }
      const osc = tunerOscillatorRef.current;
      setTimeout(() => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // Oscillator may already be stopped during cleanup.
        }
      }, 150);
      tunerOscillatorRef.current = null;
    }
    setActiveString(null);
  };

  const playString = async (freq, name) => {
    await initAudio();
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (activeString === name) {
      stopTuner();
      return;
    }

    stopTuner();

    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();

    osc.type = 'triangle'; // Triangle wave sounds more like a string instrument than sine
    osc.frequency.value = freq;

    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);

    // Fade in
    const t = audioContextRef.current.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.1);

    osc.start();

    tunerOscillatorRef.current = osc;
    tunerGainRef.current = gain;
    setActiveString(name);
  };

  const stopListening = () => {
    if (detectorFrameRef.current) {
      window.cancelAnimationFrame(detectorFrameRef.current);
      detectorFrameRef.current = null;
    }

    if (analyserRef.current) {
      try { analyserRef.current.disconnect(); } catch (e) { console.warn(e); }
      analyserRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    setIsListening(false);
  };

  const detectPitch = () => {
    const analyser = analyserRef.current;
    const context = audioContextRef.current;
    const buffer = detectorBufferRef.current;

    if (!analyser || !context || !buffer) return;

    analyser.getFloatTimeDomainData(buffer);
    const frequency = autoCorrelate(buffer, context.sampleRate);

    if (frequency && frequency >= 60 && frequency <= 700) {
      const closestString = getClosestString(frequency);
      setDetectedFrequency(frequency);
      setTargetString(closestString);
      setPitchCents(closestString.cents);
      setMicError('');
    }

    detectorFrameRef.current = window.requestAnimationFrame(detectPitch);
  };

  const startListening = async () => {
    setMicError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError('Mikrofon není v tomto prohlížeči dostupný.');
      return;
    }

    try {
      await initAudio();
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      stopTuner();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.15;
      source.connect(analyser);

      micStreamRef.current = stream;
      analyserRef.current = analyser;
      detectorBufferRef.current = new Float32Array(analyser.fftSize);
      setIsListening(true);
      detectPitch();
    } catch (error) {
      setMicError('Povolte mikrofon a zkuste ladičku znovu.');
      console.error(error);
      stopListening();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Stop tuner on unmount
  useEffect(() => {
    return () => {
      if (detectorFrameRef.current) window.cancelAnimationFrame(detectorFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (tunerOscillatorRef.current) {
        try { tunerOscillatorRef.current.stop(); } catch (e) { console.warn(e); }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const normalizedCents = Math.max(-50, Math.min(50, pitchCents));
  const needleRotation = (normalizedCents / 50) * 44;
  const isInTune = Math.abs(pitchCents) <= 5;
  const pitchLabel = !detectedFrequency
    ? ''
    : isInTune
      ? 'In Tune'
      : pitchCents < 0
        ? 'Flat'
        : 'Sharp';

  return (
    <div className="bg-surface-container rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-4 mt-4">
      {/* Metronome Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-on-surface">
          <span className="font-semibold text-sm flex items-center gap-1">
            <Activity size={16} /> Metronome
          </span>
          <span className="text-xs font-mono bg-surface-variant px-2 py-1 rounded-md">{bpm} BPM</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMetronome}
            className={`p-2 rounded-full flex-shrink-0 transition-colors ${isMetronomePlaying ? 'bg-error text-on-error' : 'bg-primary text-on-primary'}`}
            title={isMetronomePlaying ? 'Zastavit metronom' : 'Spustit metronom'}
          >
            {isMetronomePlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>
          
          <button
            onPointerDown={() => startBpmChange(-1)}
            onPointerUp={stopBpmChange}
            onPointerLeave={stopBpmChange}
            onPointerCancel={stopBpmChange}
            className="w-8 h-8 rounded-lg bg-surface-variant hover:bg-surface-container-high active:scale-95 transition-all text-on-surface flex items-center justify-center flex-shrink-0 select-none touch-none"
            title="Snížit tempo (přidržením plynule)"
            aria-label="Snížit tempo"
          >
            <Minus size={14} />
          </button>

          <input
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value, 10))}
            className="flex-grow accent-primary cursor-pointer min-w-0"
          />

          <button
            onPointerDown={() => startBpmChange(1)}
            onPointerUp={stopBpmChange}
            onPointerLeave={stopBpmChange}
            onPointerCancel={stopBpmChange}
            className="w-8 h-8 rounded-lg bg-surface-variant hover:bg-surface-container-high active:scale-95 transition-all text-on-surface flex items-center justify-center flex-shrink-0 select-none touch-none"
            title="Zvýšit tempo (přidržením plynule)"
            aria-label="Zvýšit tempo"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <hr className="border-outline-variant/30" />

      {/* Tuner Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-on-surface">
          <span className="font-semibold text-sm flex items-center gap-1">
            <Mic2 size={16} /> Tuning (A=442)
          </span>
          <button
            onClick={toggleListening}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
              isListening ? 'bg-error text-on-error' : 'bg-tertiary text-on-tertiary'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
            title={isListening ? 'Stop listening' : 'Start listening'}
          >
            <Power size={15} />
          </button>
        </div>

        <div className="relative h-28 overflow-hidden rounded-xl bg-surface-container-low border border-outline-variant/30 px-3 pt-3">
          <div className="absolute left-3 right-3 top-4 h-16 rounded-t-full border-t-4 border-l-4 border-r-4 border-outline-variant/40" />
          <div className="absolute left-1/2 top-5 h-14 w-px bg-secondary -translate-x-1/2" />
          <div className="absolute left-5 top-11 text-[10px] font-semibold text-on-surface-variant">LOW</div>
          <div className="absolute right-5 top-11 text-[10px] font-semibold text-on-surface-variant">HIGH</div>
          <div
            className={`absolute left-1/2 bottom-8 h-16 w-1 origin-bottom rounded-full transition-transform duration-150 ${
              isInTune && detectedFrequency ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }}
          />
          <div className="absolute left-1/2 bottom-7 h-4 w-4 -translate-x-1/2 rounded-full bg-on-background shadow-sm" />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs">
            <span className="font-mono text-on-surface-variant">
              {detectedFrequency ? `${detectedFrequency.toFixed(1)} Hz` : '-- Hz'}
            </span>
            <span className={`font-bold ${isInTune && detectedFrequency ? 'text-green-500' : 'text-red-500'}`}>
              {pitchLabel}
            </span>
            <span className="font-mono text-on-surface-variant">
              {detectedFrequency ? `${pitchCents > 0 ? '+' : ''}${pitchCents.toFixed(0)} ct` : '-- ct'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-surface-variant px-3 py-2 text-xs text-on-surface-variant">
          <span className="font-bold text-on-background">
            {targetString.name} {targetString.freq.toFixed(1)} Hz
          </span>
          <span>{isListening ? 'Listening' : 'Mic off'}</span>
        </div>
        {micError && <p className="text-xs text-primary">{micError}</p>}

        <div className="flex gap-2 justify-between">
          {STRINGS.map((string) => (
            <button
              key={string.name}
              onClick={() => playString(string.freq, string.name)}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                activeString === string.name
                  ? 'bg-tertiary text-on-tertiary shadow-md scale-105'
                  : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {string.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TunerMetronome;

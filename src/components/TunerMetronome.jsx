import React, { useState, useEffect, useRef } from 'react';
import { Mic2, Power } from 'lucide-react';
import PiccoloMetronome from './PiccoloMetronome';

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
  const [activeString, setActiveString] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [detectedFrequency, setDetectedFrequency] = useState(null);
  const [targetString, setTargetString] = useState(STRINGS[0]);
  const [pitchCents, setPitchCents] = useState(0);
  const [micError, setMicError] = useState('');

  // References for Web Audio API
  const audioContextRef = useRef(null);
  const tunerOscillatorRef = useRef(null);
  const tunerGainRef = useRef(null);
  const micStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const detectorFrameRef = useRef(null);
  const detectorBufferRef = useRef(null);

  // The metronome moved out to PiccoloMetronome, which owns its own audio
  // context; what stays here is the tuner's reference-pitch oscillator.
  const initAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

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
    <div className="flex flex-col gap-4 mt-4">
      {/* The metronome is the Fortin Piccolo, ported whole from the standalone
          app — the slider-and-two-buttons version that used to live here has
          been replaced by it. */}
      <PiccoloMetronome />

      {/* Tuner Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-on-surface">
          <span className="font-semibold text-sm flex items-center gap-1">
            <Mic2 size={16} /> Tuning (A=442)
          </span>
          <button
            onClick={toggleListening}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
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
          <div className="absolute left-5 top-11 text-xs font-semibold text-on-surface-variant">LOW</div>
          <div className="absolute right-5 top-11 text-xs font-semibold text-on-surface-variant">HIGH</div>
          <div
            className={`absolute left-1/2 bottom-8 h-16 w-1 origin-bottom rounded-full transition-transform duration-150 ${
              isInTune && detectedFrequency ? 'bg-secondary' : 'bg-error'
            }`}
            style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }}
          />
          <div className="absolute left-1/2 bottom-7 h-4 w-4 -translate-x-1/2 rounded-full bg-on-background shadow-sm" />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs">
            <span className="tabular-nums text-on-surface-variant">
              {detectedFrequency ? `${detectedFrequency.toFixed(1)} Hz` : '-- Hz'}
            </span>
            <span className={`font-bold ${isInTune && detectedFrequency ? 'text-secondary' : 'text-error'}`}>
              {pitchLabel}
            </span>
            <span className="tabular-nums text-on-surface-variant">
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

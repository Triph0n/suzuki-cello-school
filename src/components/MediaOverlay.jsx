import { useRef, useState } from "react";
import { X, Headphones, Maximize } from "lucide-react";
import Modal from "./ui/Modal";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

/**
 * Full-screen player for an assigned or library item (PDF / audio / video).
 * Shared by StudentDashboard and VideoLibrary so the player looks and
 * behaves the same everywhere.
 */
export default function MediaOverlay({ title, url, type, onClose }) {
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef(null);
  const iframeRef = useRef(null);

  const handleSpeedChange = (e) => {
    const speed = parseFloat(e.target.value);
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleAudioLoad = () => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  };

  return (
    <Modal
      onClose={onClose}
      panelClassName="max-w-7xl h-full"
      zClassName="z-[60]"
      scrimClassName="bg-scrim/80 backdrop-blur-md"
    >
      <div className="flex justify-between items-center p-4 sm:p-6 border-b border-outline-variant/20 bg-surface-container shrink-0 gap-4">
        <h2 className="font-headline text-xl sm:text-2xl font-bold text-on-background break-words">{title}</h2>
        <div className="flex items-center gap-2">
          {type === "book" && (
            <button
              onClick={() => {
                if (iframeRef.current?.requestFullscreen) {
                  iframeRef.current.requestFullscreen();
                }
              }}
              className="hidden md:flex items-center gap-2 bg-surface-variant hover:bg-surface-container-highest border-none px-4 py-2 rounded-xl text-on-surface-variant hover:text-primary font-bold cursor-pointer transition-colors shadow-sm"
              title="Fullscreen"
            >
              <Maximize size={16} /> Fullscreen
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-surface-variant text-on-surface-variant rounded-xl transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Close"
            aria-label="Close player"
          >
            <X size={28} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-scrim/10 flex items-center justify-center p-2 sm:p-6 relative">
        {!url ? (
          <div className="text-on-surface-variant text-lg bg-surface-container-low p-8 rounded-2xl shadow-sm text-center">
            <p className="font-bold text-xl mb-2 text-primary">Media not found</p>
            <p>Old link type or file is missing. Please ask the teacher to reassign the task.</p>
          </div>
        ) : type === "book" ? (
          <iframe ref={iframeRef} src={url} className="w-full h-full border-none rounded-xl bg-white shadow-md" title={title} />
        ) : type === "audio" ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-8 bg-surface-container rounded-2xl">
            <div className="p-8 bg-rosin-wash rounded-full animate-pulse">
              <Headphones size={64} className="text-rosin" />
            </div>
            <audio ref={audioRef} onLoadedData={handleAudioLoad} src={url} controls autoPlay className="w-full max-w-md shadow-md rounded-full" />
            <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 shadow-sm">
              <label htmlFor="playback-speed" className="font-bold text-on-surface-variant">Speed:</label>
              <select
                id="playback-speed"
                value={playbackSpeed}
                onChange={handleSpeedChange}
                className="bg-surface-variant text-on-surface p-2 rounded-lg border-none focus:ring-2 focus:ring-primary outline-none cursor-pointer font-medium"
              >
                {SPEEDS.map((speed) => (
                  <option key={speed} value={speed}>{speed === 1 ? "1x (Normal)" : `${speed}x`}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <video src={url} controls autoPlay className="w-full h-full object-contain rounded-xl shadow-md bg-scrim" />
        )}
      </div>
    </Modal>
  );
}

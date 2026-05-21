import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { subscribeToStudents, getStudents } from "../api";
import { Play, X, Headphones, FileText } from "lucide-react";
import { allMediaFiles } from "../mediaConfig";

export default function StudentDashboard() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState(null);
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

  const getMediaType = (path) => {
    if (!path) return 'video';
    const ext = path.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'book';
    if (['mp3', 'wav'].includes(ext)) return 'audio';
    return 'video';
  };

  useEffect(() => {
    let isMounted = true;
    let unsubscribe;

    const fallbackTimeout = setTimeout(() => {
      if (isMounted) {
        setStudent(getStudents().find(s => s.id === id));
        setLoading(false);
      }
    }, 1500);

    try {
      unsubscribe = subscribeToStudents((data) => {
        if (isMounted) {
          clearTimeout(fallbackTimeout);
          const found = data.find(s => s.id === id) || getStudents().find(s => s.id === id);
          setStudent(found);
          setLoading(false);
        }
      });
    } catch (e) {
      if (isMounted) {
        clearTimeout(fallbackTimeout);
        setStudent(getStudents().find(s => s.id === id));
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
      if (unsubscribe) unsubscribe();
    };
  }, [id]);

  if (loading) return <div className="text-on-surface-variant text-center mt-12 text-lg">Loading...</div>;
  if (!student) return <div className="text-on-surface-variant text-center mt-12 text-lg">Student not found.</div>;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-6 drop-shadow-sm">
        Welcome, {student.name}!
      </h1>
      
      <p className="text-on-surface-variant text-lg mb-10 font-medium">
        Here are your currently assigned lessons. Keep practicing!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {student.assignedVideos && student.assignedVideos.length > 0 ? (
          student.assignedVideos.map((video, index) => (
            <div key={index} className="bg-surface-container-low border border-outline-variant/30 hover:border-primary/50 shadow-md hover:shadow-xl rounded-3xl p-6 flex items-start gap-4 transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-20 h-20 shrink-0 bg-secondary-container text-tertiary rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                <Play size={36} className="ml-1" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-headline text-xl font-bold text-on-background mb-2 truncate" title={video.title}>
                  {video.title}
                </h3>
                <span className="inline-block bg-surface-variant text-on-surface-variant text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full mb-4">
                  {video.type}
                </span>
                <button 
                  onClick={() => setPlayingVideo(video)}
                  className="w-full bg-primary hover:bg-primary-dim text-on-primary font-bold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                >
                  Practice Now
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-on-surface-variant bg-surface-container-low border border-outline-variant/30 rounded-3xl p-12 text-center text-lg shadow-sm">
            You don't have any assignments right now. Enjoy your free time!
          </div>
        )}
      </div>

      {/* Media Player Overlay */}
      {playingVideo && (() => {
         const videoUrl = allMediaFiles[playingVideo.videoId]; // Fetch URL from dictionary
         const type = getMediaType(playingVideo.videoId);      // Extract media type from filename
         return (
           <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6" onClick={() => setPlayingVideo(null)}>
             <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] shadow-2xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center p-4 sm:p-6 border-b border-outline-variant/20 bg-surface-container shrink-0">
                 <h2 className="font-headline text-xl sm:text-2xl font-bold text-on-background break-words">{playingVideo.title}</h2>
                 <div className="flex items-center gap-2">
                   {type === 'book' && (
                     <button
                       onClick={() => {
                         if (iframeRef.current && iframeRef.current.requestFullscreen) {
                           iframeRef.current.requestFullscreen();
                         }
                       }}
                       className="hidden md:flex items-center gap-2 bg-surface-variant hover:bg-surface-container-highest border-none px-4 py-2 rounded-xl text-on-surface-variant hover:text-primary font-bold cursor-pointer transition-colors shadow-sm"
                       title="Celá obrazovka"
                     >
                       Celá obrazovka
                     </button>
                   )}
                   <button onClick={() => setPlayingVideo(null)} className="p-2 hover:bg-surface-variant text-on-surface-variant rounded-xl transition-colors shrink-0 outline-none" title="Zavřít">
                     <X size={28} />
                   </button>
                 </div>
               </div>
               
               <div className="flex-1 overflow-hidden bg-black/10 flex items-center justify-center p-2 sm:p-6 relative">
                 {!videoUrl ? (
                   <div className="text-on-surface-variant text-lg bg-surface-container-low p-8 rounded-2xl shadow-sm text-center">
                     <p className="font-bold text-xl mb-2 text-primary">Media not found</p>
                     <p>Old link type or file is missing. Please ask the teacher to reassign the task.</p>
                   </div>
                 ) : type === 'book' ? (
                   <iframe ref={iframeRef} src={videoUrl} className="w-full h-full border-none rounded-xl bg-white shadow-md" title={playingVideo.title} />
                 ) : type === 'audio' ? (
                   <div className="w-full h-full flex flex-col items-center justify-center gap-8 bg-surface-container rounded-2xl">
                       <div className="p-8 bg-surface-variant rounded-full shadow-inner animate-pulse">
                         <Headphones size={64} className="text-amber-500" />
                       </div>
                       <audio ref={audioRef} onLoadedData={handleAudioLoad} src={videoUrl} controls autoPlay className="w-full max-w-md shadow-md rounded-full" />
                       <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 shadow-sm mt-4">
                          <label htmlFor="speed" className="font-bold text-on-surface-variant">Speed:</label>
                          <select 
                            id="speed"
                            value={playbackSpeed}
                            onChange={handleSpeedChange}
                            className="bg-surface-variant text-on-surface p-2 rounded-lg border-none focus:ring-2 focus:ring-primary outline-none cursor-pointer font-medium"
                          >
                            <option value="0.5">0.5x</option>
                            <option value="0.75">0.75x</option>
                            <option value="1">1x (Normal)</option>
                            <option value="1.25">1.25x</option>
                            <option value="1.5">1.5x</option>
                          </select>
                        </div>
                    </div>
                 ) : (
                   <video src={videoUrl} controls autoPlay className="w-full h-full object-contain rounded-xl shadow-md bg-black" />
                 )}
               </div>
             </div>
           </div>
         );
      })()}

    </div>
  );
}

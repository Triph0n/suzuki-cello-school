import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { subscribeToStudents, getStudents, importStudent } from "../api";
import { Play, Headphones, FileText, Music } from "lucide-react";
import { allMediaFiles } from "../mediaConfig";
import GamificationPanel from "../components/gamification/GamificationPanel";
import MediaOverlay from "../components/MediaOverlay";
import EmptyState from "../components/ui/EmptyState";

const getMediaType = (path) => {
  if (!path) return 'video';
  const ext = path.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'book';
  if (['mp3', 'wav'].includes(ext)) return 'audio';
  return 'video';
};

export default function StudentDashboard() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe;

    // Check for encoded student data in the URL
    const searchParams = new URLSearchParams(window.location.search);
    const dParam = searchParams.get('d');
    if (dParam) {
      try {
        const bytes = Uint8Array.from(atob(dParam), (c) => c.charCodeAt(0));
        const decoded = new TextDecoder().decode(bytes);
        const imported = JSON.parse(decoded);
        if (imported && imported.id === id) {
          importStudent(imported);
          // Clean up URL parameters
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      } catch (e) {
        console.error("Failed to parse shared student data:", e);
      }
    }

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
    } catch {
      if (isMounted) {
        setTimeout(() => {
          if (isMounted) {
            clearTimeout(fallbackTimeout);
            setStudent(getStudents().find(s => s.id === id));
            setLoading(false);
          }
        }, 0);
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
      <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-6">
        Welcome, {student.name}!
      </h1>

      <p className="text-on-surface-variant text-lg mb-8 font-medium">
        Here are your currently assigned lessons. Keep practicing!
      </p>

      <GamificationPanel key={student.id} studentId={student.id} mediaActive={!!playingVideo} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {student.assignedVideos && student.assignedVideos.length > 0 ? (
          student.assignedVideos.map((video, index) => (
            <div key={`${video.videoId}-${index}`} className={`group bg-surface-container-low border border-outline-variant/30 hover:border-primary/50 border-l-4 p-6 flex flex-col gap-4 rounded-3xl transition-all shadow-sm hover:shadow-md ${
              video.type === 'book' ? "border-l-madder" :
              video.type === 'audio' ? "border-l-rosin" :
              "border-l-lake"
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                  video.type === 'book' ? "bg-madder-wash text-madder" :
                  video.type === 'audio' ? "bg-rosin-wash text-rosin" :
                  "bg-lake-wash text-lake"
                }`}>
                  {video.type === 'book' ? <FileText size={28} /> : video.type === 'audio' ? <Headphones size={28} /> : <Play size={28} className="ml-1" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline text-xl font-bold text-on-background truncate" title={video.title}>
                    {video.title}
                  </h3>
                  <span className="text-on-surface-variant text-xs uppercase tracking-widest mt-1 block">
                    {video.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPlayingVideo(video)}
                className="w-full bg-primary hover:bg-primary-dim text-on-primary font-medium py-3 px-4 rounded-full transition-colors flex items-center justify-center mt-2 cursor-pointer"
              >
                Practice Now
              </button>
            </div>
          ))
        ) : (
          <EmptyState
            icon={Music}
            title="You don't have any assignments right now"
            hint="Enjoy your free time!"
            className="col-span-full"
          />
        )}
      </div>

      {/* Media Player Overlay */}
      {playingVideo && (
        <MediaOverlay
          title={playingVideo.title}
          url={allMediaFiles[playingVideo.videoId]}
          type={getMediaType(playingVideo.videoId)}
          onClose={() => setPlayingVideo(null)}
        />
      )}
    </div>
  );
}

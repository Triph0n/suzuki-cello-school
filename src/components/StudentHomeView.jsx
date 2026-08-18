import { useState } from "react";
import { Play, Headphones, FileText, Music, Calendar } from "lucide-react";
import { allMediaFiles } from "../mediaConfig";
import { FEATURES } from "../features";
import GamificationPanel from "./gamification/GamificationPanel";
import MediaOverlay from "./MediaOverlay";
import EmptyState from "./ui/EmptyState";

const getMediaType = (path) => {
  if (!path) return 'video';
  const ext = path.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'book';
  if (['mp3', 'wav'].includes(ext)) return 'audio';
  return 'video';
};

const ICONS = { book: FileText, audio: Headphones, video: Play };

// Shared student-facing dashboard, rendered both on /student/:id (teacher
// device) and /portal/:token (private parent link). lessonNotes is optional
// and only the portal passes it.
//
// The screen is deliberately two halves and nothing else. Top: what the teacher
// set, one row per item, tap to play. Bottom: the cello asking to be played and
// the week of pearls filling up. No collection to browse, no counters, no tabs
// — a child who opens this has two things they can do, and both of them are
// practising.
export default function StudentHomeView({ student, lessonNotes }) {
  const [playingVideo, setPlayingVideo] = useState(null);
  const assignments = student.assignedVideos || [];

  return (
    <div className="max-w-3xl mx-auto py-8 flex flex-col gap-8">
      <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
        Hello, {student.name}!
      </h1>

      {/* ── top half: what the teacher set ─────────────────────────── */}
      <section className="flex flex-col gap-3">
        <p className="club-plate text-[11px]">Today&apos;s lesson</p>
        {assignments.length > 0 ? (
          assignments.map((video, index) => {
            const Icon = ICONS[video.type] || Play;
            return (
              <button
                key={`${video.videoId}-${index}`}
                type="button"
                onClick={() => setPlayingVideo(video)}
                className="club-leather w-full rounded-3xl p-5 flex items-center gap-4 text-left cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <span className="club-brass w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center">
                  <Icon size={26} className={video.type === "video" ? "ml-1" : ""} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-headline text-xl font-bold text-on-background block truncate">
                    {video.title}
                  </span>
                  <span className="text-sm text-on-surface-variant">
                    {video.type === "book" ? "Tap to open" : "Tap to play"}
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <EmptyState
            icon={Music}
            title="Nothing set for today"
            hint="Play something you love."
          />
        )}
      </section>

      {/* ── bottom half: the practice itself ───────────────────────── */}
      {FEATURES.gamification && (
        <GamificationPanel
          key={student.id}
          studentId={student.id}
          mediaActive={!!playingVideo}
        />
      )}

      {/* For the grown-up reading over the child's shoulder. */}
      {lessonNotes && lessonNotes.length > 0 && (
        <details className="club-leather rounded-3xl px-5 py-4">
          <summary className="club-plate text-[11px] cursor-pointer">
            Notes from the lesson
          </summary>
          <div className="mt-4 flex flex-col gap-4">
            {lessonNotes.map((lesson) => (
              <div key={lesson.id}>
                <span className="font-headline font-bold text-sm text-primary flex items-center gap-2 mb-1">
                  <Calendar size={16} />
                  {new Date(lesson.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {lesson.note && (
                  <p className="text-on-surface-variant leading-relaxed text-sm whitespace-pre-line">{lesson.note}</p>
                )}
                {lesson.homework && (
                  <p className="text-on-surface-variant leading-relaxed text-sm whitespace-pre-line mt-1">
                    <span className="font-bold text-on-background">Homework: </span>{lesson.homework}
                  </p>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

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

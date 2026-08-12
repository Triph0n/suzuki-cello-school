import { useEffect, useState } from "react";
import { Award, Check } from "lucide-react";
import {
  ENSEMBLES,
  awardMusician,
  getGamifyState,
  getMusician,
  isMusicianOwned
} from "../../gamification";
import { stickerSrc } from "../gamification/assets";

// Every musician that has a chair somewhere on the ensemble ladder, with the
// ensemble it plays in. Awarding is the teacher's act for a real milestone —
// musicians can't be earned from the reward chest.
const AWARDABLE = ENSEMBLES.flatMap((ensemble) =>
  ensemble.chairs
    .filter((chair) => chair.musician)
    .map((chair) => ({
      musician: getMusician(chair.musician),
      ensembleKey: ensemble.key,
      ensembleName: ensemble.name,
      partLabel: chair.label
    }))
);

// Mounted with key={studentId}, so initial state always matches the student;
// the effect only subscribes to storage updates.
export default function MusicianAwarder({ studentId }) {
  const [state, setState] = useState(() => getGamifyState(studentId));

  useEffect(() => {
    const refresh = () => setState(getGamifyState(studentId));
    window.addEventListener("gamify_updated", refresh);
    return () => window.removeEventListener("gamify_updated", refresh);
  }, [studentId]);

  if (AWARDABLE.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="font-headline text-2xl font-bold text-on-background mb-6">
        Ensemble Musicians
      </h2>
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 shadow-sm">
        <p className="text-sm text-on-surface-variant font-medium mb-4">
          Award a musician when the student reaches a milestone — it fills a
          chair in their ensemble.
        </p>
        <div className="flex flex-col gap-3">
          {AWARDABLE.map(({ musician, ensembleKey, ensembleName, partLabel }) => {
            const owned = isMusicianOwned(state, ensembleKey, musician.key);
            return (
              <div
                key={`${ensembleKey}:${musician.key}`}
                className="bg-surface-container border border-outline-variant/50 p-3 rounded-xl flex justify-between items-center gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={stickerSrc(musician.key)}
                    alt={musician.name}
                    className="w-12 h-12 object-contain shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-on-background truncate">
                      {musician.name}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {partLabel} · {ensembleName}
                    </p>
                  </div>
                </div>
                {owned ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container text-on-secondary-container px-3 py-1.5 text-xs font-bold shrink-0">
                    <Check size={14} />
                    Awarded
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => awardMusician(studentId, ensembleKey, musician.key, "teacher")}
                    className="inline-flex items-center gap-2 rounded-full bg-primary text-on-primary px-4 py-2 text-sm font-bold hover:opacity-90 transition-opacity shrink-0"
                  >
                    <Award size={16} />
                    Award
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

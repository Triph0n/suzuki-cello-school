import { useState } from "react";
import { Armchair, Lock, Sparkles, Theater } from "lucide-react";
import { getEnsembleSummaries } from "../../gamification";
import { stickerSrc } from "./assets";
import EnsembleStage from "./EnsembleStage";

function ChairAvatar({ chair }) {
  if (chair.playerChair) {
    return (
      <div
        className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/50 flex items-center justify-center"
        title="Your chair — you play this part live"
      >
        <Armchair size={28} className="text-primary" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <div
      className="relative w-14 h-14 rounded-2xl bg-surface-container border border-outline-variant/40 flex items-center justify-center overflow-hidden"
      title={chair.owned ? chair.musicianInfo?.name : "Empty chair — ask your teacher"}
    >
      <img
        src={stickerSrc(chair.musician)}
        alt={chair.owned ? chair.musicianInfo?.name : "Empty chair"}
        className={`w-full h-full object-contain ${chair.owned ? "" : "grayscale opacity-25"}`}
      />
      {!chair.owned && (
        <Lock size={16} className="absolute text-on-surface-variant" />
      )}
    </div>
  );
}

// The ensemble ladder (E1: just the first duo). Each card shows the chairs,
// rehearsal progress and opens the full stage.
export default function EnsembleSection({ studentId, state, onPracticeStart }) {
  const [stageKey, setStageKey] = useState(null);
  const ensembles = getEnsembleSummaries(state);
  const stageEnsemble = ensembles.find((ensemble) => ensemble.key === stageKey);

  return (
    <section className="lg:col-span-2">
      <div className="mb-4">
        <h3 className="font-headline text-2xl font-bold text-on-background">
          Ensemble Hall
        </h3>
        <p className="text-sm text-on-surface-variant font-medium">
          Fill every chair, rehearse together, and earn your premiere. One chair
          is always yours.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {ensembles.map((ensemble) => (
          <article
            key={ensemble.key}
            className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-5 shadow-sm border-l-4 border-l-rosin"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase font-bold tracking-widest text-primary mb-1">
                  Tier {ensemble.tier} · {ensemble.venue}
                </p>
                <h4 className="font-headline text-xl font-bold text-on-background">
                  {ensemble.name}
                </h4>
                <p className="text-sm text-on-surface-variant mt-1">
                  {ensemble.piece.title} — Suzuki Book {ensemble.piece.book}
                </p>
              </div>
              {ensemble.premieredAt && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container text-on-secondary-container px-3 py-1.5 text-xs font-bold shrink-0">
                  <Sparkles size={14} />
                  Premiered
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mb-4">
              {ensemble.chairs.map((chair) => (
                <ChairAvatar key={chair.part} chair={chair} />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-on-surface-variant">
                {!ensemble.complete
                  ? `${ensemble.missing} chair${ensemble.missing === 1 ? "" : "s"} to fill — your teacher awards musicians.`
                  : ensemble.premieredAt
                    ? "Play the concert again any time."
                    : `Rehearsals: ${ensemble.rehearsals}/${ensemble.rehearsalsNeeded} — practice days count.`}
              </p>
              <button
                type="button"
                onClick={() => setStageKey(ensemble.key)}
                className="inline-flex items-center gap-2 rounded-full bg-primary text-on-primary px-4 py-2 text-sm font-bold hover:opacity-90 transition-opacity shrink-0"
              >
                <Theater size={16} />
                Open stage
              </button>
            </div>
          </article>
        ))}
      </div>

      {stageEnsemble && (
        <EnsembleStage
          studentId={studentId}
          progress={stageEnsemble}
          onClose={() => setStageKey(null)}
          onPracticeStart={onPracticeStart}
        />
      )}
    </section>
  );
}

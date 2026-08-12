import { Lock } from "lucide-react";
import { getCollectionShelf } from "../../gamification";
import MusicianCard from "./MusicianCard";

// The whole collection on one shelf, empty slots included.
//
// The gaps carry the motivation: a child who can see the three holes left in a
// row knows exactly what is still out there, without the app having to nag.
// Each band is one plank; a band that has not opened yet keeps its slots dark
// so the shelf is never a wall of question marks either.
export default function CollectionShelf({ state, onOpenCard }) {
  const shelf = getCollectionShelf(state);

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-5 shadow-sm">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h4 className="font-headline text-xl font-bold text-on-background">
            My collection
          </h4>
          <p className="text-sm text-on-surface-variant font-medium">
            Every card, and every space still waiting for one.
          </p>
        </div>
        <p className="font-headline text-2xl font-bold text-primary tabular-nums shrink-0">
          {shelf.owned}
          <span className="text-on-surface-variant">/{shelf.total}</span>
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {shelf.sections.map((section) => (
          <section key={section.key}>
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <p className="text-xs uppercase font-bold tracking-widest text-on-surface-variant flex items-center gap-1.5 min-w-0">
                {section.locked && <Lock size={12} className="shrink-0" />}
                <span className="truncate">{section.name}</span>
              </p>
              <p className="text-xs font-bold text-on-surface-variant tabular-nums shrink-0">
                {section.collectedCount}/{section.slots.length}
              </p>
            </div>

            <div
              className={`grid grid-cols-3 sm:grid-cols-6 gap-2 pb-3 border-b-2 border-outline-variant/30 ${
                section.locked ? "opacity-50" : ""
              }`}
            >
              {section.slots.map((slot) =>
                slot.collected ? (
                  <button
                    key={`${section.key}:${slot.key}`}
                    type="button"
                    onClick={() => onOpenCard(section.key, slot.key)}
                    className="block cursor-pointer rounded-2xl transition-transform hover:scale-[1.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    title={`Look at ${slot.shortName}`}
                  >
                    <MusicianCard musician={slot} size="mini" />
                  </button>
                ) : (
                  <MusicianCard
                    key={`${section.key}:${slot.key}`}
                    musician={slot}
                    owned={false}
                    size="mini"
                  />
                )
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

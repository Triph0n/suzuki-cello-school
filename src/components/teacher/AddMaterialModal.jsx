import { useState } from "react";
import { Book, X, Play, Headphones, FileText, PenLine } from "lucide-react";
import Modal from "../ui/Modal";
import { MEDIA_TABS, KIND_LABEL } from "../../mediaCatalogue";

const ICONS = { book: FileText, audio: Headphones, video: Play };

// Adding a material means picking a file, not describing one. The title comes
// from the file name and the kind from its extension, so there is nothing to
// type and nothing to classify. Writing a free-text entry is still possible for
// things that have no file — a scale, a bow exercise — but it is the side door,
// not the front one.
export default function AddMaterialModal({ onSave, onClose }) {
  const [activeTab, setActiveTab] = useState(MEDIA_TABS[0]?.id);
  const [writingOwn, setWritingOwn] = useState(false);
  const [title, setTitle] = useState("");

  const pick = (file) =>
    onSave({
      title: file.title,
      category: file.category,
      type: file.type,
      metadata: { videoId: file.videoId }
    });

  const submitOwn = (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), category: "own", type: "material" });
  };

  const files = MEDIA_TABS.find((tab) => tab.id === activeTab)?.files || [];

  return (
    <Modal onClose={onClose} panelClassName="max-w-4xl" zClassName="z-[60]">
      <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 bg-surface-container shrink-0">
        <h2 className="font-headline text-2xl font-bold text-on-background flex items-center gap-2">
          <Book size={24} className="text-primary" />
          Add material
        </h2>
        <button
          onClick={onClose}
          className="p-2.5 hover:bg-surface-variant text-on-surface-variant rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {writingOwn ? (
        <form onSubmit={submitOwn} className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="new-material-title" className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
              What is it called?
            </label>
            <input
              id="new-material-title"
              type="text"
              required
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="E.g. C major scale, three octaves"
              className="px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors w-full"
            />
          </div>
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setWritingOwn(false)}
              className="flex-1 py-3 px-4 bg-surface-variant hover:bg-outline-variant/30 text-on-surface-variant font-bold rounded-full transition-colors"
            >
              Back to the library
            </button>
            <button
              type="submit"
              className="club-brass flex-1 py-3 px-4 font-bold rounded-full"
            >
              Add
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex overflow-x-auto p-4 gap-2 bg-surface-container-low shrink-0 border-b border-outline-variant/10">
            {MEDIA_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-full font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "club-brass"
                    : "club-leather text-on-surface-variant"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-container-lowest">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => {
                const Icon = ICONS[file.type] || Play;
                return (
                  <button
                    key={file.videoId}
                    type="button"
                    onClick={() => pick(file)}
                    className="club-leather group text-left cursor-pointer rounded-2xl p-4 flex items-center gap-3 transition-transform hover:scale-[1.02]"
                  >
                    <Icon size={24} className="shrink-0 text-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="font-headline text-sm font-bold text-on-background leading-snug break-words block">
                        {file.title}
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium block mt-1 truncate">
                        {file.folder || KIND_LABEL[file.type]}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-outline-variant/20 bg-surface-container shrink-0 text-center">
            <button
              type="button"
              onClick={() => setWritingOwn(true)}
              className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
            >
              <PenLine size={16} />
              Nothing to play — write it myself
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

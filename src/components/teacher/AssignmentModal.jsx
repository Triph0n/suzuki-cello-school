import { useState } from "react";
import { Play, X, Headphones, FileText } from "lucide-react";
import Modal from "../ui/Modal";

export default function AssignmentModal({ tabs, onAssign, onClose }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);

  return (
    <Modal onClose={onClose} panelClassName="max-w-4xl">
      <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 bg-surface-container shrink-0">
        <h2 className="font-headline text-xl sm:text-2xl font-bold text-on-background">Assign exercise / material</h2>
        <button
          onClick={onClose}
          className="p-2.5 hover:bg-surface-variant text-on-surface-variant rounded-full transition-colors shadow-sm"
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex overflow-x-auto p-4 gap-2 bg-surface-container-low shrink-0 border-b border-outline-variant/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-full font-bold whitespace-nowrap transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-primary text-on-primary shadow-md"
                : "bg-surface-variant/50 text-on-surface-variant hover:bg-surface-variant"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-container-lowest">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tabs.find((t) => t.id === activeTab)?.files.map((file) => (
            <button
              key={file.videoId}
              type="button"
              onClick={() => onAssign(file)}
              className="group text-left cursor-pointer bg-surface-container-low hover:bg-primary-container/20 border border-outline-variant/30 hover:border-primary/40 rounded-2xl p-4 flex items-center gap-3 transition-colors shadow-sm hover:shadow-md"
            >
              <div className="shrink-0 text-tertiary">
                {file.type === "book" ? <FileText size={24} /> : file.type === "audio" ? <Headphones size={24} /> : <Play size={24} />}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-headline text-sm font-bold text-on-background group-hover:text-primary transition-colors leading-snug break-words">
                  {file.title}
                </h4>
                {file.folder && <span className="text-xs text-on-surface-variant font-medium block mt-1 truncate">{file.folder}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

import { useState } from "react";
import { Calendar } from "lucide-react";
import Modal from "../ui/Modal";

const QUICK_ENTRY = [
  {
    label: "Basics",
    items: ["C Scale", "D Scale", "G Scale", "A Scale", "Ševčík", "Time Joggers", "Rick Mooney"],
  },
  {
    label: "Suzuki Book 1",
    items: ["Twinkle Var.", "French Folk Song", "Lightly Row", "Song of the Wind", "Go Tell Aunt Rhody", "O Come, Little Children", "May Song", "Allegro", "Perpetual Motion", "Long, Long Ago", "Allegretto", "Andantino", "Rigadoon", "Etude", "The Happy Farmer", "Minuet in C", "Minuet No. 2"],
  },
  {
    label: "Suzuki Book 2",
    items: ["Long, Long Ago (Bk2)", "May Time", "Minuet No. 1", "Minuet No. 3", "Judas Maccabaeus", "Hunters' Chorus", "Musette", "March in G", "Witches' Dance", "Two Grenadiers", "Gavotte (Gossec)", "Bourrée (Handel)"],
  },
];

const todayLocalISO = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  return new Date(today - offset).toISOString().split("T")[0];
};

export default function AttendanceModal({ editing, onSave, onClose }) {
  const [date, setDate] = useState(editing ? editing.date : todayLocalISO());
  const [note, setNote] = useState(editing ? editing.note : "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(date, note);
  };

  const appendToNote = (item) => setNote((prev) => (prev ? `${prev}, ${item}` : item));

  return (
    <Modal onClose={onClose} panelClassName="max-w-md" zClassName="z-[60]">
      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-outline-variant/10 bg-surface-container shrink-0">
          <h2 className="font-headline text-xl font-medium text-on-background flex items-center gap-2">
            <Calendar size={20} className="text-tertiary" />
            {editing ? "Edit Lesson" : "Log Lesson"}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 hover:bg-surface-variant text-on-surface-variant font-medium rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-dim text-on-primary font-medium rounded-full transition-colors"
            >
              Save
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <label htmlFor="lesson-date" className="text-sm font-medium text-on-surface-variant">Date</label>
            <input
              id="lesson-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 rounded-xl border border-outline-variant bg-surface-container text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="lesson-note" className="text-sm font-medium text-on-surface-variant">Note (what was played)</label>
            <textarea
              id="lesson-note"
              required
              rows="4"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g. C major scale, repeating Minuet..."
              className="px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none w-full"
            ></textarea>

            <div className="mt-2 flex flex-col gap-4">
              {QUICK_ENTRY.map((group) => (
                <div key={group.label}>
                  <span className="text-sm font-medium text-on-surface-variant mb-2 block">{group.label}</span>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => appendToNote(item)}
                        className="px-3 py-1.5 bg-surface-variant text-on-surface-variant text-sm font-medium rounded-lg hover:bg-secondary-container hover:text-on-secondary-container transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

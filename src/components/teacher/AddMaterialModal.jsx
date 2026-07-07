import { useState } from "react";
import { Book, X } from "lucide-react";
import Modal from "../ui/Modal";

export default function AddMaterialModal({ onSave, onClose }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("PDF");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), category: category.trim() || "PDF" });
  };

  return (
    <Modal onClose={onClose} panelClassName="max-w-md" zClassName="z-[60]">
      <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 bg-surface-container">
        <h2 className="font-headline text-2xl font-bold text-on-background flex items-center gap-2">
          <Book size={24} className="text-tertiary" />
          Add Material
        </h2>
        <button onClick={onClose} className="p-2.5 hover:bg-surface-variant text-on-surface-variant rounded-full transition-colors" aria-label="Close">
          <X size={20} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="new-material-title" className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Material Name</label>
          <input
            id="new-material-title"
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g. C major scale..."
            className="px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="new-material-category" className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Category</label>
          <input
            id="new-material-category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="E.g. PDF, Link, Video..."
            className="px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors w-full"
          />
        </div>
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-surface-variant hover:bg-outline-variant/30 text-on-surface-variant font-bold rounded-full transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 px-4 bg-primary hover:bg-primary-dim text-on-primary font-bold rounded-full transition-colors shadow-sm"
          >
            Add
          </button>
        </div>
      </form>
    </Modal>
  );
}

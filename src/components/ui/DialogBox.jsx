import { AlertTriangle, Info } from "lucide-react";
import Modal from "./Modal";

/** Confirm / notice box rendered by useDialogs — not used directly. */
export default function DialogBox({ dialog, onDone }) {
  const isConfirm = dialog.type === "confirm";
  const danger = dialog.danger ?? isConfirm;
  const Icon = danger ? AlertTriangle : Info;

  return (
    <Modal onClose={() => onDone(false)} panelClassName="max-w-sm" zClassName="z-[80]">
      <div className="p-6 text-center">
        <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${danger ? "bg-madder-wash text-error" : "bg-lake-wash text-lake"}`}>
          <Icon size={24} />
        </div>
        {dialog.title && (
          <h2 className="font-headline text-xl font-bold text-on-background mb-2">{dialog.title}</h2>
        )}
        <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line mb-6">{dialog.message}</p>
        <div className="flex gap-3 justify-center">
          {isConfirm && (
            <button
              type="button"
              onClick={() => onDone(false)}
              className="flex-1 py-3 px-4 bg-surface-variant hover:bg-outline-variant/30 text-on-surface-variant font-bold rounded-full transition-colors"
            >
              {dialog.cancelLabel || "Cancel"}
            </button>
          )}
          <button
            type="button"
            autoFocus={!isConfirm}
            onClick={() => onDone(true)}
            className={`flex-1 py-3 px-4 font-bold rounded-full transition-colors shadow-sm ${
              danger && isConfirm
                ? "bg-error hover:opacity-90 text-on-error"
                : "bg-primary hover:bg-primary-dim text-on-primary"
            }`}
          >
            {dialog.confirmLabel || (isConfirm ? "Confirm" : "OK")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

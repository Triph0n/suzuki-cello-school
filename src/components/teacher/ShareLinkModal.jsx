import { useEffect, useState } from "react";
import { QrCode, X, Copy, Check } from "lucide-react";
import QRCode from "qrcode";
import Modal from "../ui/Modal";
import { copyToClipboard } from "../../lib/clipboard";

// Shown right after a student link is created. The link is already on the
// clipboard by then; this modal is for the other ways it travels — a QR code
// the parent scans off the screen, and the link itself to read or re-copy.
export default function ShareLinkModal({ studentName, url, copied: copiedOnCreate, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [copied, setCopied] = useState(copiedOnCreate);

  useEffect(() => {
    let active = true;
    // Plain black on white: scanners want contrast, not Club 1920.
    QRCode.toDataURL(url, { width: 512, margin: 2 })
      .then((dataUrl) => { if (active) setQrDataUrl(dataUrl); })
      .catch((error) => console.error("QR generation failed", error));
    return () => { active = false; };
  }, [url]);

  const handleCopy = async () => {
    if (await copyToClipboard(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal onClose={onClose} panelClassName="max-w-md" zClassName="z-[60]">
      <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 bg-surface-container">
        <h2 className="font-headline text-2xl font-bold text-on-background flex items-center gap-2">
          <QrCode size={24} className="text-tertiary" />
          Link for {studentName}
        </h2>
        <button onClick={onClose} className="p-2.5 hover:bg-surface-variant text-on-surface-variant rounded-full transition-colors" aria-label="Close">
          <X size={20} />
        </button>
      </div>
      <div className="p-6 flex flex-col items-center gap-5">
        {/* Pale paper on the dark ground needs a frame (see PROGRESS.md). */}
        <div className="bg-white rounded-2xl border border-outline-variant/30 p-3 shadow-sm">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR code with the link for ${studentName}`} className="w-56 h-56 block" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-sm text-gray-500">…</div>
          )}
        </div>

        <p className="w-full text-sm text-on-surface-variant bg-surface-container rounded-xl border border-outline-variant/30 px-4 py-3 break-all select-all">
          {url}
        </p>

        <button
          onClick={handleCopy}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 font-bold rounded-full transition-colors shadow-sm ${
            copied
              ? "bg-secondary-container text-on-secondary-container"
              : "bg-primary hover:bg-primary-dim text-on-primary"
          }`}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? "Copied to clipboard" : "Copy link"}
        </button>

        <p className="text-xs text-on-surface-variant text-center">
          Scan the QR code with the phone, or send the link.
          Creating a new link later stops this one from working.
        </p>
      </div>
    </Modal>
  );
}

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Shared modal shell: unified scrim, z-index, radius and elevation, plus
 * Escape-to-close, a Tab focus trap and focus restore on close.
 * Render it only while open (the usual `{open && <Modal …>}` pattern also
 * works — it unmounts cleanly either way).
 */
export default function Modal({
  onClose,
  children,
  panelClassName = "max-w-md",
  zClassName = "z-50",
  scrimClassName = "bg-scrim/50 backdrop-blur-sm",
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    const autoTarget = panel.querySelector("[autofocus]") || panel.querySelectorAll(FOCUSABLE)[0];
    if (autoTarget) autoTarget.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (el) => !el.disabled && el.offsetParent !== null
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div className={`fixed inset-0 ${zClassName} flex items-center justify-center p-4 sm:p-6 overflow-hidden`} role="dialog" aria-modal="true">
      <div className={`absolute inset-0 ${scrimClassName}`} onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={`bg-surface-container-low border border-outline-variant/30 rounded-3xl w-full max-h-[90vh] shadow-2xl relative z-10 overflow-hidden flex flex-col ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

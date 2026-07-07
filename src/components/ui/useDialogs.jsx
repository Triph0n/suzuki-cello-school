import { useCallback, useState } from "react";
import DialogBox from "./DialogBox";

/**
 * In-app replacement for window.confirm / window.alert, styled with the
 * Design 2.0 tokens. Usage:
 *   const { confirm, notice, dialogs } = useDialogs();
 *   if (!(await confirm("Delete this student?"))) return;
 *   await notice("Backup restored!");
 * Render {dialogs} once at the end of the component.
 */
export default function useDialogs() {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback(
    (message, options = {}) =>
      new Promise((resolve) => setDialog({ type: "confirm", message, resolve, ...options })),
    []
  );

  const notice = useCallback(
    (message, options = {}) =>
      new Promise((resolve) => setDialog({ type: "notice", message, resolve, ...options })),
    []
  );

  const dialogs = dialog ? (
    <DialogBox
      dialog={dialog}
      onDone={(result) => {
        dialog.resolve(result);
        setDialog(null);
      }}
    />
  ) : null;

  return { confirm, notice, dialogs };
}

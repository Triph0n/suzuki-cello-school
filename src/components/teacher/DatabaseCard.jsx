import { Database, Upload, Download, RotateCcw } from "lucide-react";
import { exportDatabasePayload, importDatabasePayload, resetDatabase } from "../../api";
import { validateBackupPayload } from "../../backupValidation";
import useDialogs from "../ui/useDialogs";

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsText(file);
  });

export default function DatabaseCard() {
  const { confirm, notice, dialogs } = useDialogs();

  const handleExport = async () => {
    try {
      const payload = await exportDatabasePayload();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      const today = new Date().toISOString().split("T")[0];
      downloadAnchor.setAttribute("download", `suzuki_cello_backup_${today}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error(e);
      await notice(`Failed to export database: ${e.message}`, { title: "Export failed", danger: true });
    }
  };

  const handleImport = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const json = JSON.parse(await readFileAsText(file));
      const { ok, error, payload } = validateBackupPayload(json);
      if (!ok) throw new Error(error);

      const proceed = await confirm(
        "Are you sure you want to import this backup? This will overwrite your current students, materials, and lesson logs.",
        { title: "Import backup", confirmLabel: "Import" }
      );
      if (!proceed) return;

      await importDatabasePayload(payload);
      await notice("Backup successfully restored!", { title: "Import finished" });
    } catch (err) {
      console.error(err);
      await notice(`Failed to import database: ${err.message}`, { title: "Import failed", danger: true });
    } finally {
      input.value = "";
    }
  };

  const handleReset = async () => {
    const first = await confirm(
      "WARNING: This will permanently delete all students, materials, and lesson records. Are you sure you want to continue?",
      { title: "Reset database", confirmLabel: "Continue" }
    );
    if (!first) return;

    const second = await confirm(
      "This action cannot be undone. Are you absolutely sure you want to reset the database?",
      { title: "Last warning", confirmLabel: "Reset everything" }
    );
    if (!second) return;

    try {
      await resetDatabase();
      await notice("Database reset successfully.", { title: "Reset finished" });
    } catch (e) {
      console.error(e);
      await notice(`Failed to reset database: ${e.message}`, { title: "Reset failed", danger: true });
    }
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-sm">
      <h2 className="font-headline text-2xl font-bold text-on-background mb-4 flex items-center gap-3">
        <Database className="text-tertiary" size={24} />
        Správa databáze (Database Management)
      </h2>
      <p className="text-on-surface-variant text-sm mb-6 max-w-2xl leading-relaxed">
        Zde můžete zálohovat studenty, lekce a materiály do souboru pro jejich přenos do nové verze aplikace nebo na jiné zařízení. Data jsou uložena lokálně ve vašem prohlížeči.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-3 px-5 py-4 bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary-container rounded-2xl transition-all duration-300 font-bold shadow-sm hover:shadow-md border border-outline-variant/20 hover:-translate-y-0.5 cursor-pointer"
        >
          <Download size={20} className="shrink-0 text-primary" />
          <div className="text-left min-w-0">
            <div className="text-sm font-semibold truncate text-on-secondary-container">Exportovat zálohu</div>
            <div className="text-xs font-normal opacity-85 truncate">Stáhnout JSON zálohu</div>
          </div>
        </button>

        <label
          className="flex items-center justify-center gap-3 px-5 py-4 bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary-container rounded-2xl transition-all duration-300 font-bold shadow-sm hover:shadow-md border border-outline-variant/20 hover:-translate-y-0.5 cursor-pointer"
        >
          <Upload size={20} className="shrink-0 text-primary" />
          <div className="text-left min-w-0">
            <div className="text-sm font-semibold truncate text-on-secondary-container">Importovat zálohu</div>
            <div className="text-xs font-normal opacity-85 truncate">Nahrát JSON zálohu</div>
          </div>
          <input
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="hidden"
          />
        </label>

        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-3 px-5 py-4 bg-madder-wash/50 hover:bg-madder-wash text-error rounded-2xl transition-all duration-300 font-bold shadow-sm hover:shadow-md border border-madder-wash hover:-translate-y-0.5 cursor-pointer"
        >
          <RotateCcw size={20} className="shrink-0 text-error" />
          <div className="text-left min-w-0">
            <div className="text-sm font-semibold truncate">Resetovat databázi</div>
            <div className="text-xs font-normal text-error/80 truncate">Smazat všechna data</div>
          </div>
        </button>
      </div>

      {dialogs}
    </div>
  );
}

"use client";

interface SaveLoadPanelProps {
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
  hasSave: boolean;
}

export default function SaveLoadPanel({ onSave, onLoad, onClear, hasSave }: SaveLoadPanelProps) {
  return (
    <section className="ornate-card p-4">
      <h3 className="mb-3 border-b border-amber-300/20 pb-2 text-lg font-semibold text-amber-100">שמירה</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={onSave}
          className="btn-iron px-3 py-2 text-sm"
        >
          שמור עכשיו
        </button>
        <button
          type="button"
          disabled={!hasSave}
          onClick={onLoad}
          className="btn-iron px-3 py-2 text-sm disabled:opacity-40"
        >
          טען שמירה
        </button>
        <button
          type="button"
          disabled={!hasSave}
          onClick={onClear}
          className="rounded-lg border border-red-300/40 bg-red-950/70 px-3 py-2 text-sm text-red-100 disabled:opacity-40"
        >
          מחק שמירה
        </button>
      </div>
    </section>
  );
}

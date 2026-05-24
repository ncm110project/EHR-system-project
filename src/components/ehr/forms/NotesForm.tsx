"use client";

import { useState } from "react";

interface NotesFormProps {
  initialNotes?: string;
  onSave: (notes: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
}

export function NotesForm({ initialNotes = "", onSave, onCancel, placeholder, rows = 4, readOnly }: NotesFormProps) {
  const [notes, setNotes] = useState(initialNotes);

  const handleSubmit = () => {
    if (notes.trim()) {
      onSave(notes.trim());
      setNotes("");
    }
  };

  if (readOnly) {
    return (
      <div className="bg-slate-50 rounded-lg p-3">
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{initialNotes}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={placeholder || "Enter notes..."}
        rows={rows}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 resize-none"
      />
      <div className="flex gap-2">
        <button onClick={handleSubmit} className="btn btn-primary btn-sm">
          Save Notes
        </button>
        {onCancel && (
          <button onClick={onCancel} className="btn btn-ghost btn-sm">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
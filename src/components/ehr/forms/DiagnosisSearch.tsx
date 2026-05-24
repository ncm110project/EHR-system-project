"use client";

import { useState, useMemo } from "react";
import { ALL_DIAGNOSES } from "@/lib/ehr-data";

interface DiagnosisSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DiagnosisSearch({ value, onChange, placeholder = "Search diagnosis...", disabled }: DiagnosisSearchProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    if (!value) return [];
    return ALL_DIAGNOSES.filter(d =>
      d.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 10);
  }, [value]);

  const handleSelect = (diagnosis: string) => {
    onChange(diagnosis);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full px-3 py-2 text-left hover:bg-slate-50 text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
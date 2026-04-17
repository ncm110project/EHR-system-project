"use client";

import { useState, ReactNode } from "react";

interface ExpandSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  disabled?: boolean;
}

const variantStyles = {
  default: "border-slate-200 hover:bg-slate-50",
  primary: "border-blue-200 hover:bg-blue-50",
  success: "border-green-200 hover:bg-green-50",
  warning: "border-amber-200 hover:bg-amber-50",
  danger: "border-red-200 hover:bg-red-50",
};

const variantIconColors = {
  default: "text-slate-500",
  primary: "text-blue-600",
  success: "text-green-600",
  warning: "text-amber-600",
  danger: "text-red-600",
};

export function ExpandSection({
  title,
  description,
  icon,
  defaultExpanded = false,
  children,
  variant = "default",
  disabled = false,
}: ExpandSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsExpanded(!isExpanded)}
        className={`w-full p-3 border rounded-lg text-left transition-all ${
          disabled ? "opacity-50 cursor-not-allowed" : variantStyles[variant]
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <span className={variantIconColors[variant]}>{icon}</span>
            )}
            <div>
              <span className="font-medium">{title}</span>
              {description && (
                <p className="text-sm text-slate-500">{description}</p>
              )}
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          {children}
        </div>
      )}
    </div>
  );
}
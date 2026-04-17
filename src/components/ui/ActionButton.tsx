"use client";

import { ReactNode } from "react";

interface ActionButtonProps {
  onClick: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

const variantStyles = {
  default: "border-slate-200 hover:bg-slate-50",
  primary: "border-blue-200 hover:bg-blue-50",
  success: "border-green-200 hover:bg-green-50",
  warning: "border-amber-200 hover:bg-amber-50",
  danger: "border-red-200 hover:bg-red-50",
  info: "border-violet-200 hover:bg-violet-50",
};

const variantIconColors = {
  default: "text-slate-500",
  primary: "text-blue-600",
  success: "text-green-600",
  warning: "text-amber-600",
  danger: "text-red-600",
  info: "text-violet-600",
};

const sizeStyles = {
  sm: "p-2 text-sm",
  md: "p-3 text-base",
  lg: "p-4 text-lg",
};

export function ActionButton({
  onClick,
  title,
  description,
  icon,
  variant = "default",
  size = "md",
  disabled = false,
  fullWidth = false,
  children,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full ${fullWidth ? "" : "max-w-md"} ${sizeStyles[size]} border rounded-lg text-left transition-all ${
        disabled ? "opacity-50 cursor-not-allowed" : variantStyles[variant]
      }`}
    >
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
      {children}
    </button>
  );
}

interface SaveButtonProps {
  onClick: () => void;
  label?: string;
  variant?: "primary" | "success" | "danger";
  disabled?: boolean;
  fullWidth?: boolean;
}

export function SaveButton({
  onClick,
  label = "Save",
  variant = "primary",
  disabled = false,
  fullWidth = false,
}: SaveButtonProps) {
  const buttonVariants = {
    primary: "bg-teal-600 hover:bg-teal-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        fullWidth ? "w-full" : ""
      } ${buttonVariants[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {label}
    </button>
  );
}

interface CancelButtonProps {
  onClick: () => void;
  label?: string;
  variant?: "default" | "danger";
  fullWidth?: boolean;
}

export function CancelButton({
  onClick,
  label = "Cancel",
  variant = "default",
  fullWidth = false,
}: CancelButtonProps) {
  const buttonVariants = {
    default: "border border-slate-300 hover:bg-slate-50 text-slate-700",
    danger: "border border-red-300 hover:bg-red-50 text-red-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        fullWidth ? "w-full" : ""
      } ${buttonVariants[variant]}`}
    >
      {label}
    </button>
  );
}
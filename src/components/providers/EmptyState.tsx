"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      {description && <p className="text-slate-500 max-w-md mb-4">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

interface LoadingEmptyStateProps {
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  loadingMessage?: string;
  children: ReactNode;
}

export function LoadingEmptyState({
  isLoading = false,
  isEmpty = false,
  emptyIcon = "📭",
  emptyTitle = "No data found",
  emptyDescription,
  loadingMessage = "Loading...",
  children,
}: LoadingEmptyStateProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-3" />
        <p className="text-slate-500">{loadingMessage}</p>
      </div>
    );
  }

  if (isEmpty) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return <>{children}</>;
}
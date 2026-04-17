'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-4">
      <div className="card p-8 max-w-lg text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong!</h2>
        <p className="text-slate-600 mb-6">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700 font-mono break-all">
            {error.message || 'Unknown error'}
          </p>
        </div>
        <button
          onClick={() => reset()}
          className="btn btn-primary py-3 px-6"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PujaTrip ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-[#FFFDF9] dark:bg-[#1A1215] text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-white dark:bg-[#281B23] p-6 rounded-3xl border border-red-200 dark:border-red-900/50 shadow-xl space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-3xl">
              🪔
            </div>
            <h1 className="text-xl font-bold font-display text-red-700 dark:text-red-400">
              Something went wrong
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-300">
              {this.state.error?.message || 'An unexpected error occurred while loading the app.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-sm shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              Reload PujaTrip (পুনরায় লোড করুন)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

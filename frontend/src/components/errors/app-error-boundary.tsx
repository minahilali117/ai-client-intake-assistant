'use client';

import React from 'react';

class InternalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled client error boundary', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="mt-2 text-sm text-slate-600">
            Please refresh the page and try again.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return <InternalErrorBoundary>{children}</InternalErrorBoundary>;
}
